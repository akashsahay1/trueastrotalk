const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const https = require('https');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Specific image URLs for spiritual/astrological products from free sources
const PRODUCT_IMAGE_URLS = {
  // Rudraksha and Malas
  'rudraksha': [
    'https://images.pexels.com/photos/8436744/pexels-photo-8436744.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/5990819/pexels-photo-5990819.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'mala': [
    'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/7319070/pexels-photo-7319070.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Crystals and Stones
  'crystal': [
    'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/4040662/pexels-photo-4040662.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/6943433/pexels-photo-6943433.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'stone': [
    'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/8919567/pexels-photo-8919567.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'amethyst': [
    'https://images.pexels.com/photos/6943433/pexels-photo-6943433.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'quartz': [
    'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'citrine': [
    'https://images.pexels.com/photos/4040662/pexels-photo-4040662.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Jewelry and Rings
  'ring': [
    'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1449729/pexels-photo-1449729.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'pendant': [
    'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'bracelet': [
    'https://images.pexels.com/photos/6787202/pexels-photo-6787202.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Statues and Idols
  'ganesha': [
    'https://images.pexels.com/photos/7114748/pexels-photo-7114748.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3686769/pexels-photo-3686769.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'buddha': [
    'https://images.pexels.com/photos/775203/pexels-photo-775203.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/4940756/pexels-photo-4940756.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'hanuman': [
    'https://images.pexels.com/photos/7114748/pexels-photo-7114748.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'shivling': [
    'https://images.pexels.com/photos/5273575/pexels-photo-5273575.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Spiritual Items
  'yantra': [
    'https://images.pexels.com/photos/8815475/pexels-photo-8815475.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/5749135/pexels-photo-5749135.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'om': [
    'https://images.pexels.com/photos/5749135/pexels-photo-5749135.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'chakra': [
    'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Incense and Oils
  'incense': [
    'https://images.pexels.com/photos/4040662/pexels-photo-4040662.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/6787303/pexels-photo-6787303.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'oil': [
    'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Books and Tarot
  'book': [
    'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'tarot': [
    'https://images.pexels.com/photos/7130555/pexels-photo-7130555.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Meditation and Wellness
  'meditation': [
    'https://images.pexels.com/photos/775203/pexels-photo-775203.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'cushion': [
    'https://images.pexels.com/photos/775203/pexels-photo-775203.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  
  // Vessels and Traditional Items
  'brass': [
    'https://images.pexels.com/photos/6076414/pexels-photo-6076414.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'copper': [
    'https://images.pexels.com/photos/6076414/pexels-photo-6076414.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'diya': [
    'https://images.pexels.com/photos/5273575/pexels-photo-5273575.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'conch': [
    'https://images.pexels.com/photos/8815475/pexels-photo-8815475.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  'shells': [
    'https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&w=400'
  ]
};

// Find matching image URLs for a product
const getRelevantImageUrls = (productName) => {
  const name = productName.toLowerCase();
  
  // Find matching keywords
  const matches = [];
  for (const [keyword, urls] of Object.entries(PRODUCT_IMAGE_URLS)) {
    if (name.includes(keyword)) {
      matches.push(...urls);
    }
  }
  
  // If no specific matches, use generic spiritual images
  if (matches.length === 0) {
    matches.push(
      'https://images.pexels.com/photos/5749135/pexels-photo-5749135.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/775203/pexels-photo-775203.jpeg?auto=compress&cs=tinysrgb&w=400'
    );
  }
  
  // Return unique URLs
  return [...new Set(matches)];
};

// Download image from URL
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
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
    request.setTimeout(15000, () => {
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

async function downloadRelevantImages() {
  let client;
  
  try {
    console.log('🖼️  Starting relevant product image download...\n');
    
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
    
    // Get products that need images
    const products = await productsCollection.find({}).toArray();
    console.log(`📦 Found ${products.length} products\n`);
    
    // Track statistics
    let downloadedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    console.log('🔄 DOWNLOADING RELEVANT IMAGES:');
    console.log('===============================');
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Check if product has valid images
      let hasValidImages = false;
      if (product.image_urls && product.image_urls.length > 0) {
        for (const imageUrl of product.image_urls) {
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
        // Get relevant image URLs
        const imageUrls = getRelevantImageUrls(product.name);
        console.log(`    Found ${imageUrls.length} relevant image options`);
        
        // Generate filename with ta- prefix
        const timestamp = Date.now();
        const filename = `ta-${timestamp}-${i.toString().padStart(3, '0')}.jpg`;
        const filepath = path.join(uploadDir, filename);
        const relativePath = `/uploads/2025/08/${filename}`;
        
        let downloadSuccess = false;
        let downloadedPath = null;
        
        // Try each relevant image URL
        for (let urlIndex = 0; urlIndex < imageUrls.length; urlIndex++) {
          const url = imageUrls[urlIndex];
          try {
            console.log(`    🌐 Trying image ${urlIndex + 1}/${imageUrls.length}: ${url.split('/').pop()}`);
            await downloadImage(url, filepath);
            
            // Verify file was downloaded and has content
            const fileSize = getFileSize(filepath);
            if (fileSize > 5000) { // Minimum 5KB for a proper image
              downloadedPath = filepath;
              downloadSuccess = true;
              console.log(`    ✅ Downloaded: ${filename} (${Math.round(fileSize/1024)}KB)`);
              break;
            } else {
              fs.unlink(filepath, () => {}); // Delete small/empty file
              console.log(`    ⚠️  File too small (${fileSize} bytes), trying next...`);
            }
          } catch (error) {
            console.log(`    ❌ Failed: ${error.message}`);
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
        
        // Delay to be respectful to image services
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`    ❌ Error processing ${product.name}: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log(`\n📊 DOWNLOAD SUMMARY:`);
    console.log(`====================`);
    console.log(`✅ Downloaded: ${downloadedCount} relevant images`);
    console.log(`⏭️  Skipped: ${skippedCount} products (already had valid images)`);
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
    
    // List downloaded files
    const files = fs.readdirSync(uploadDir).filter(f => f.startsWith('ta-'));
    console.log(`Files in upload directory: ${files.length}`);
    
    if (files.length > 0) {
      console.log(`\nRecent downloads:`);
      files.slice(-5).forEach(file => {
        const filePath = path.join(uploadDir, file);
        const size = Math.round(getFileSize(filePath) / 1024);
        console.log(`  - ${file} (${size}KB)`);
      });
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
  downloadRelevantImages();
}

module.exports = { downloadRelevantImages };