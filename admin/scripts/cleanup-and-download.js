const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const https = require('https');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// More specific and relevant image sources for spiritual/astrological products
const SPECIFIC_PRODUCT_IMAGES = {
  'rudraksha mala 108 beads': 'https://images.pexels.com/photos/8844956/pexels-photo-8844956.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'crystal healing stone set': 'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'yantra for wealth': 'https://images.pexels.com/photos/8919567/pexels-photo-8919567.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'ganesha idol brass': 'https://images.pexels.com/photos/3686769/pexels-photo-3686769.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'shri yantra crystal': 'https://images.pexels.com/photos/8919567/pexels-photo-8919567.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'evil eye protection bracelet': 'https://images.pexels.com/photos/6787202/pexels-photo-6787202.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'navgraha stone ring': 'https://images.pexels.com/photos/1449729/pexels-photo-1449729.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'hanuman chalisa book': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'meditation cushion': 'https://images.pexels.com/photos/775203/pexels-photo-775203.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'incense sticks sandalwood': 'https://images.pexels.com/photos/6787303/pexels-photo-6787303.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'om wall hanging': 'https://images.pexels.com/photos/5749135/pexels-photo-5749135.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'chakra balancing stones': 'https://images.pexels.com/photos/4040662/pexels-photo-4040662.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'feng shui laughing buddha': 'https://images.pexels.com/photos/4940756/pexels-photo-4940756.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'tarot card deck': 'https://images.pexels.com/photos/7130555/pexels-photo-7130555.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'numerology chart': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'palmistry hand model': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'astrology calendar 2025': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'gemstone consultation kit': 'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'vastu compass': 'https://images.pexels.com/photos/1022923/pexels-photo-1022923.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'spiritual healing oil': 'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'mahamrityunjaya yantra': 'https://images.pexels.com/photos/8919567/pexels-photo-8919567.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'rose quartz heart': 'https://images.pexels.com/photos/4040662/pexels-photo-4040662.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'black tourmaline pendant': 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'amethyst cluster': 'https://images.pexels.com/photos/6943433/pexels-photo-6943433.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'citrine tree': 'https://images.pexels.com/photos/4040662/pexels-photo-4040662.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'red coral ring': 'https://images.pexels.com/photos/1449729/pexels-photo-1449729.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'pearl mala': 'https://images.pexels.com/photos/8844956/pexels-photo-8844956.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'emerald pendant': 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'blue sapphire ring': 'https://images.pexels.com/photos/1449729/pexels-photo-1449729.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'yellow sapphire earrings': 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'silver om pendant': 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'copper kalash': 'https://images.pexels.com/photos/6076414/pexels-photo-6076414.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'brass diya set': 'https://images.pexels.com/photos/5273575/pexels-photo-5273575.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'camphor tablets': 'https://images.pexels.com/photos/6787303/pexels-photo-6787303.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'gangajal holy water': 'https://images.pexels.com/photos/6076414/pexels-photo-6076414.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'tulsi mala 108 beads': 'https://images.pexels.com/photos/8844956/pexels-photo-8844956.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'sphatik shivling': 'https://images.pexels.com/photos/5273575/pexels-photo-5273575.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'gomti chakra set': 'https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'conch shell shankh': 'https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'kauri shells set': 'https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'abhimantrit yantra': 'https://images.pexels.com/photos/8919567/pexels-photo-8919567.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'energized bracelet': 'https://images.pexels.com/photos/6787202/pexels-photo-6787202.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'blessed rudraksha': 'https://images.pexels.com/photos/8844956/pexels-photo-8844956.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'consecrated ring': 'https://images.pexels.com/photos/1449729/pexels-photo-1449729.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'sacred thread kalawa': 'https://images.pexels.com/photos/6787303/pexels-photo-6787303.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'astrology software cd': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'kundli making book': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'horoscope analysis guide': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'vastu tips manual': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  'numerology handbook': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop'
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

const getFileSize = (filepath) => {
  try {
    const stats = fs.statSync(filepath);
    return stats.size;
  } catch {
    return 0;
  }
};

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

async function cleanupAndDownload() {
  let client;
  
  try {
    console.log('🧹 Starting cleanup and download process...\n');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    const mediaCollection = db.collection('media');
    
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', '2025', '08');
    
    // Step 1: Cleanup incorrect images
    console.log('\n🗑️  CLEANUP PHASE:');
    console.log('==================');
    
    // Find all incorrectly downloaded images (with -00X suffix)
    const files = fs.readdirSync(uploadDir).filter(f => f.match(/ta-\d+-\d{3}\.jpg$/));
    let cleanedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const relativePath = `/uploads/2025/08/${file}`;
      
      // Remove from media collection
      const mediaResult = await mediaCollection.deleteMany({ file_path: relativePath });
      
      // Remove from products
      await productsCollection.updateMany(
        { image_urls: relativePath },
        { 
          $unset: { 
            images: '',
            primary_image: '',
            image_urls: ''
          }
        }
      );
      
      // Delete physical file
      fs.unlinkSync(filePath);
      
      console.log(`  🗑️  Removed: ${file} (and ${mediaResult.deletedCount} DB entries)`);
      cleanedCount++;
    }
    
    console.log(`✅ Cleaned up ${cleanedCount} incorrect images\n`);
    
    // Step 2: Download correct, relevant images
    console.log('🔄 DOWNLOAD PHASE:');
    console.log('==================');
    
    const products = await productsCollection.find({}).toArray();
    let downloadedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const product of products) {
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
      
      // Get specific image URL for this product
      const imageUrl = SPECIFIC_PRODUCT_IMAGES[product.name.toLowerCase()];
      
      if (!imageUrl) {
        console.log(`    ⚠️  No specific image found for: ${product.name}`);
        failedCount++;
        continue;
      }
      
      try {
        // Generate filename with ta- prefix (timestamp only, no suffix)
        const timestamp = Date.now();
        const filename = `ta-${timestamp}.jpg`;
        const filepath = path.join(uploadDir, filename);
        const relativePath = `/uploads/2025/08/${filename}`;
        
        console.log(`    🌐 Downloading specific image...`);
        await downloadImage(imageUrl, filepath);
        
        // Verify file was downloaded
        const fileSize = getFileSize(filepath);
        if (fileSize < 5000) {
          fs.unlink(filepath, () => {});
          console.log(`    ❌ Downloaded file too small (${fileSize} bytes)`);
          failedCount++;
          continue;
        }
        
        console.log(`    ✅ Downloaded: ${filename} (${Math.round(fileSize/1024)}KB)`);
        
        // Add to media collection
        const mediaEntry = {
          file_name: filename,
          original_name: `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
          file_path: relativePath,
          file_size: fileSize,
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
        
        // Delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`=================`);
    console.log(`🧹 Cleaned: ${cleanedCount} incorrect images`);
    console.log(`✅ Downloaded: ${downloadedCount} relevant images`);
    console.log(`⏭️  Skipped: ${skippedCount} products (valid images)`);
    console.log(`❌ Failed: ${failedCount} products`);
    console.log(`📦 Total: ${products.length} products`);
    
    // Verification
    const finalFiles = fs.readdirSync(uploadDir).filter(f => f.startsWith('ta-'));
    console.log(`\nFiles in directory: ${finalFiles.length}`);
    console.log(`Recent downloads: ${finalFiles.slice(-3).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Disconnected from MongoDB');
    }
  }
}

if (require.main === module) {
  cleanupAndDownload();
}

module.exports = { cleanupAndDownload };