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
        arrayOfFiles.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return arrayOfFiles;
}

async function checkMediaSync() {
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
    
    console.log('\n📁 FILES IN FILESYSTEM:');
    console.log('=======================');
    const systemFiles = filesInSystem.map(file => {
      const relativePath = file.replace(path.join(__dirname, '..', 'public'), '');
      console.log(`  - ${relativePath}`);
      return relativePath;
    });
    console.log(`Total: ${systemFiles.length} files\n`);
    
    // Get all media entries from database
    const mediaInDB = await mediaCollection.find({}).toArray();
    console.log('💾 MEDIA ENTRIES IN DATABASE:');
    console.log('==============================');
    
    const orphanedInDB = [];
    const validInDB = [];
    
    for (const media of mediaInDB) {
      const fullPath = path.join(__dirname, '..', 'public', media.file_path);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        console.log(`  ✅ ${media.file_path} - EXISTS (${media.original_name || 'Unknown'})`);
        validInDB.push(media);
      } else {
        console.log(`  ❌ ${media.file_path} - MISSING (${media.original_name || 'Unknown'})`);
        orphanedInDB.push(media);
      }
    }
    
    console.log(`\nTotal in DB: ${mediaInDB.length}`);
    console.log(`Valid: ${validInDB.length}`);
    console.log(`Orphaned: ${orphanedInDB.length}\n`);
    
    // Check for files in system but not in database
    const filesNotInDB = systemFiles.filter(file => {
      return !mediaInDB.some(media => media.file_path === file);
    });
    
    if (filesNotInDB.length > 0) {
      console.log('📂 FILES IN SYSTEM BUT NOT IN DATABASE:');
      console.log('=========================================');
      filesNotInDB.forEach(file => {
        console.log(`  - ${file}`);
      });
      console.log(`Total: ${filesNotInDB.length} files\n`);
    }
    
    // Check products using these images
    console.log('🛍️ PRODUCTS AND THEIR IMAGES:');
    console.log('==============================');
    const products = await productsCollection.find({ 
      image_url: { $exists: true, $ne: null, $ne: '' } 
    }).toArray();
    
    for (const product of products) {
      const imagePath = path.join(__dirname, '..', 'public', product.image_url);
      const exists = fs.existsSync(imagePath);
      
      console.log(`Product: ${product.name}`);
      console.log(`  Image URL: ${product.image_url}`);
      console.log(`  Status: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log('');
    }
    
    // Summary and recommendations
    console.log('\n📊 SUMMARY & RECOMMENDATIONS:');
    console.log('==============================');
    
    if (orphanedInDB.length > 0) {
      console.log('\n⚠️  Orphaned Database Entries (files don\'t exist):');
      orphanedInDB.forEach(media => {
        console.log(`  - ID: ${media._id}, Path: ${media.file_path}`);
      });
      console.log('\n  Recommendation: Run cleanup to remove these entries from database');
    }
    
    if (filesNotInDB.length > 0) {
      console.log('\n⚠️  Untracked Files (exist but not in database):');
      filesNotInDB.forEach(file => {
        console.log(`  - ${file}`);
      });
      console.log('\n  Recommendation: Either add to database or remove from filesystem');
    }
    
    if (orphanedInDB.length === 0 && filesNotInDB.length === 0) {
      console.log('\n✅ Media library is in sync! No issues found.');
    }
    
    // Cleanup option
    if (orphanedInDB.length > 0) {
      console.log('\n🧹 CLEANUP OPTION:');
      console.log('==================');
      console.log('To remove orphaned entries from database, run:');
      console.log('node scripts/check-media-sync.js --cleanup\n');
      
      if (process.argv.includes('--cleanup')) {
        console.log('Performing cleanup...');
        for (const media of orphanedInDB) {
          await mediaCollection.deleteOne({ _id: media._id });
          console.log(`  Deleted: ${media.file_path}`);
        }
        console.log('✅ Cleanup completed!');
      }
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

// Run the check
checkMediaSync();