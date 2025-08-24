const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// MongoDB connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

async function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = await readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        await getAllFiles(filePath, arrayOfFiles);
      } else if (!file.startsWith('.')) { // Skip hidden files like .DS_Store
        arrayOfFiles.push({
          fullPath: filePath,
          relativePath: filePath.replace(path.join(__dirname, '..', 'public'), ''),
          fileName: file,
          size: fileStat.size,
          stats: fileStat
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return arrayOfFiles;
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function getCategory(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
    return 'image';
  } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
    return 'video';
  } else if (['.pdf', '.doc', '.docx'].includes(ext)) {
    return 'document';
  }
  return 'other';
}

async function fixMediaSync() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');
    const productsCollection = db.collection('products');
    
    // Get all files from filesystem
    const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
    const filesInSystem = await getAllFiles(uploadsPath);
    
    console.log('\n📁 FILES FOUND IN FILESYSTEM:');
    console.log('=============================');
    filesInSystem.forEach(file => {
      console.log(`  - ${file.relativePath} (${file.size} bytes)`);
    });
    console.log(`Total: ${filesInSystem.length} files\n`);
    
    // Check existing media entries
    const existingMedia = await mediaCollection.find({}).toArray();
    console.log(`💾 Existing media entries in database: ${existingMedia.length}\n`);
    
    // Add missing files to media library
    console.log('🔄 ADDING MISSING FILES TO MEDIA LIBRARY:');
    console.log('==========================================');
    
    let addedCount = 0;
    for (const file of filesInSystem) {
      // Check if file already exists in database
      const exists = existingMedia.some(media => media.file_path === file.relativePath);
      
      if (!exists) {
        const mediaEntry = {
          file_name: file.fileName,
          original_name: file.fileName,
          file_path: file.relativePath,
          file_size: file.size,
          mime_type: getMimeType(file.fileName),
          category: getCategory(file.fileName),
          uploaded_by: null, // No specific user
          created_at: file.stats.birthtime || new Date(),
          updated_at: new Date()
        };
        
        const result = await mediaCollection.insertOne(mediaEntry);
        console.log(`  ✅ Added: ${file.relativePath} (ID: ${result.insertedId})`);
        addedCount++;
      } else {
        console.log(`  ⏭️  Skipped: ${file.relativePath} (already exists)`);
      }
    }
    
    console.log(`\n📊 Added ${addedCount} new media entries\n`);
    
    // Fix product image URLs
    console.log('🛍️ FIXING PRODUCT IMAGE URLS:');
    console.log('==============================');
    
    const products = await productsCollection.find({ 
      image_url: { $exists: true, $ne: null, $ne: '' } 
    }).toArray();
    
    let fixedCount = 0;
    for (const product of products) {
      let needsUpdate = false;
      let newImageUrl = product.image_url;
      
      // Check if URL is absolute but file exists locally
      if (product.image_url.startsWith('https://') || product.image_url.startsWith('http://')) {
        // Extract the path part
        const urlPath = product.image_url.replace(/https?:\/\/[^\/]+/, '');
        const localPath = path.join(__dirname, '..', 'public', urlPath);
        
        if (fs.existsSync(localPath)) {
          newImageUrl = urlPath;
          needsUpdate = true;
          console.log(`  🔧 Product "${product.name}": ${product.image_url} → ${urlPath}`);
        } else {
          console.log(`  ❌ Product "${product.name}": File not found at ${localPath}`);
        }
      } else {
        // Check if relative path exists
        const localPath = path.join(__dirname, '..', 'public', product.image_url);
        if (fs.existsSync(localPath)) {
          console.log(`  ✅ Product "${product.name}": ${product.image_url} (OK)`);
        } else {
          console.log(`  ❌ Product "${product.name}": File not found at ${localPath}`);
        }
      }
      
      if (needsUpdate) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { image_url: newImageUrl, updated_at: new Date() } }
        );
        fixedCount++;
      }
    }
    
    console.log(`\n📊 Fixed ${fixedCount} product image URLs\n`);
    
    // Final verification
    console.log('🔍 FINAL VERIFICATION:');
    console.log('======================');
    
    const finalMediaCount = await mediaCollection.countDocuments();
    const finalProducts = await productsCollection.find({ 
      image_url: { $exists: true, $ne: null, $ne: '' } 
    }).toArray();
    
    console.log(`Media library entries: ${finalMediaCount}`);
    console.log(`Products with images: ${finalProducts.length}`);
    
    let allGood = true;
    for (const product of finalProducts) {
      const localPath = path.join(__dirname, '..', 'public', product.image_url);
      const exists = fs.existsSync(localPath);
      if (!exists) {
        console.log(`  ❌ ${product.name}: ${product.image_url} still missing`);
        allGood = false;
      }
    }
    
    if (allGood) {
      console.log('✅ All product images are now accessible!');
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

// Run the fix
fixMediaSync();