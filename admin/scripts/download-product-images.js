const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Free image sources (royalty-free)
const FREE_IMAGE_SOURCES = {
  // Unsplash API (requires registration but free)
  unsplash: 'https://source.unsplash.com/400x400/?',
  // Picsum (Lorem Picsum - free placeholder images)
  picsum: 'https://picsum.photos/400/400',
  // Pexels (free stock photos)
  pexels: 'https://images.pexels.com/photos/'
};

// Image search terms for each product category
const getSearchTerm = (productName, category) => {
  const name = productName.toLowerCase();
  
  // Specific mappings for spiritual/astrological products
  const specificTerms = {
    'rudraksh': 'rudraksha-beads',
    'rudraksha': 'rudraksha-beads',
    'mala': 'prayer-beads',
    'yantra': 'sacred-geometry',
    'crystal': 'healing-crystals',
    'stone': 'gemstones',
    'ring': 'gemstone-ring',
    'pendant': 'spiritual-pendant',
    'bracelet': 'crystal-bracelet',
    'idol': 'brass-statue',
    'ganesha': 'ganesha-statue',
    'hanuman': 'hanuman-statue',
    'shivling': 'shiva-lingam',
    'om': 'om-symbol',
    'chakra': 'chakra-stones',
    'buddha': 'buddha-statue',
    'tarot': 'tarot-cards',
    'incense': 'incense-sticks',
    'meditation': 'meditation-cushion',
    'feng': 'feng-shui',
    'compass': 'vintage-compass',
    'oil': 'essential-oil',
    'amethyst': 'amethyst-crystal',
    'quartz': 'quartz-crystal',
    'tourmaline': 'black-tourmaline',
    'citrine': 'citrine-crystal',
    'coral': 'red-coral',
    'pearl': 'pearl-jewelry',
    'emerald': 'emerald-gemstone',
    'sapphire': 'sapphire-gemstone',
    'copper': 'copper-vessel',
    'brass': 'brass-items',
    'diya': 'oil-lamp',
    'camphor': 'camphor-tablets',
    'tulsi': 'tulsi-beads',
    'conch': 'conch-shell',
    'shells': 'sea-shells',
    'thread': 'sacred-thread',
    'book': 'spiritual-book',
    'manual': 'guide-book'
  };
  
  // Find matching term
  for (const [key, term] of Object.entries(specificTerms)) {
    if (name.includes(key)) {
      return term;
    }
  }
  
  // Fallback based on category
  const categoryTerms = {
    'gemstones': 'healing-crystals',
    'spiritual': 'spiritual-items',
    'books': 'spiritual-books',
    'jewelry': 'spiritual-jewelry',
    'others': 'spiritual-products'
  };
  
  return categoryTerms[category?.toLowerCase()] || 'spiritual-products';
};

// Download image from URL
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete partial file
          reject(err);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.abort();
      reject(new Error('Download timeout'));
    });
  });
};

// Get file size
const getFileSize = (filepath) => {
  try {
    const stats = fs.statSync(filepath);
    return stats.size;
  } catch {
    return 0;
  }
};

// Get MIME type from file extension
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

async function downloadProductImages() {
  let client;
  
  try {
    console.log('🖼️  Starting product image download process...\n');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    const mediaCollection = db.collection('media');
    
    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', '2025', '08');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Created upload directory');
    }
    
    // Get all products
    const products = await productsCollection.find({}).toArray();
    console.log(`📦 Found ${products.length} products\n`);
    
    // Track statistics
    let downloadedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    console.log('🔄 DOWNLOADING IMAGES:');
    console.log('======================');
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Check if product has valid images (check if image files actually exist)
      let hasValidImages = false;
      if (product.image_urls && product.image_urls.length > 0) {
        for (const imageUrl of product.image_urls) {
          // Remove localhost part and check if file exists locally
          const localPath = imageUrl.replace(/https?:\/\/[^\/]+/, '');
          const fullPath = path.join(__dirname, '..', 'public', localPath);
          if (fs.existsSync(fullPath)) {
            hasValidImages = true;
            break;
          }
        }
      }
      
      if (hasValidImages) {
        console.log(`  ⏭️  Skipped: ${product.name} (has valid images)`);
        skippedCount++;
        continue;
      }
      
      console.log(`  🔍 Processing: ${product.name}`);
      
      try {
        // Generate search term
        const searchTerm = getSearchTerm(product.name, product.category);
        console.log(`    Search term: ${searchTerm}`);
        
        // Generate filename with ta- prefix
        const timestamp = Date.now();
        const filename = `ta-${timestamp}-${i.toString().padStart(3, '0')}.jpg`;
        const filepath = path.join(uploadDir, filename);
        const relativePath = `/uploads/2025/08/${filename}`;
        
        // Try different image sources
        const imageUrls = [
          `${FREE_IMAGE_SOURCES.unsplash}${searchTerm}`,
          `https://source.unsplash.com/featured/400x400/?${searchTerm}`,
          `https://images.unsplash.com/photo-1518176258769-f227c798150e?w=400&h=400&fit=crop` // Fallback
        ];
        
        let downloadSuccess = false;
        let downloadedPath = null;
        
        for (const url of imageUrls) {
          try {
            console.log(`    🌐 Trying: ${url}`);
            await downloadImage(url, filepath);
            
            // Verify file was downloaded and has content
            const fileSize = getFileSize(filepath);
            if (fileSize > 1000) { // Minimum 1KB
              downloadedPath = filepath;
              downloadSuccess = true;
              console.log(`    ✅ Downloaded: ${filename} (${Math.round(fileSize/1024)}KB)`);
              break;
            } else {
              fs.unlink(filepath, () => {}); // Delete small/empty file
            }
          } catch (error) {
            console.log(`    ❌ Failed URL: ${error.message}`);
            // Try next URL
          }
        }
        
        if (!downloadSuccess) {
          console.log(`    ⚠️  No suitable image found for: ${product.name}`);
          failedCount++;
          continue;
        }
        
        // Add to media collection
        const mediaEntry = {
          file_name: filename,
          original_name: `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
          file_path: relativePath,
          file_size: getFileSize(downloadedPath),
          mime_type: getMimeType(filename),
          category: 'image',
          uploaded_by: null,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        const mediaResult = await mediaCollection.insertOne(mediaEntry);
        const mediaId = mediaResult.insertedId;
        
        console.log(`    💾 Added to media library: ${mediaId}`);
        
        // Update product with image references
        await productsCollection.updateOne(
          { _id: product._id },
          {
            $set: {
              images: [mediaId],
              primary_image: mediaId,
              image_urls: [relativePath],
              updated_at: new Date()
            }
          }
        );
        
        console.log(`    🔗 Updated product with image references`);
        downloadedCount++;
        
        // Small delay to be respectful to image services
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`    ❌ Error processing ${product.name}: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log(`\n📊 DOWNLOAD SUMMARY:`);
    console.log(`====================`);
    console.log(`✅ Downloaded: ${downloadedCount} images`);
    console.log(`⏭️  Skipped: ${skippedCount} products (already had images)`);
    console.log(`❌ Failed: ${failedCount} products`);
    console.log(`📦 Total: ${products.length} products`);
    
    // Final verification
    console.log(`\n🔍 VERIFICATION:`);
    console.log(`================`);
    
    const updatedProducts = await productsCollection.find({
      images: { $exists: true, $ne: [] }
    }).toArray();
    
    const totalMediaFiles = await mediaCollection.countDocuments();
    
    console.log(`Products with images: ${updatedProducts.length}/${products.length}`);
    console.log(`Total media files: ${totalMediaFiles}`);
    console.log(`Upload directory: ${uploadDir}`);
    
    // List some downloaded files
    const files = fs.readdirSync(uploadDir).filter(f => f.startsWith('ta-'));
    console.log(`Files in upload directory: ${files.length}`);
    if (files.length > 0) {
      console.log(`Sample files: ${files.slice(0, 3).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Disconnected from MongoDB');
    }
  }
}

// Run the download process
if (require.main === module) {
  downloadProductImages();
}

module.exports = { downloadProductImages };