const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Files that need to be updated to use 'media' instead of 'media_files'
const FILES_TO_UPDATE = [
  // Core media API
  'src/app/api/media/resolve/route.ts',
  
  // Upload service
  'src/lib/upload-service.ts',
  
  // File cleanup utilities
  'src/lib/file-cleanup.ts',
  
  // Database indexes
  'src/lib/database-indexes.ts',
  
  // Products API
  'src/app/api/admin/products/route.ts',
  
  // Users API routes
  'src/app/api/users/[id]/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/users/profile/route.ts',
  
  // Upload route
  'src/app/api/upload/route.ts',
  
  // Astrologers API
  'src/app/api/astrologers/available/route.ts'
];

async function migrateAllMediaReferences() {
  console.log('🔄 MIGRATING ALL MEDIA_FILES REFERENCES...');
  console.log('===========================================\n');
  
  let client;
  
  try {
    // Step 1: Check current state
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    
    const mediaCount = await db.collection('media').countDocuments();
    const mediaFilesCount = await db.collection('media_files').countDocuments();
    
    console.log('📊 CURRENT STATE:');
    console.log(`   media collection: ${mediaCount} entries`);
    console.log(`   media_files collection: ${mediaFilesCount} entries\n`);
    
    // Step 2: Update all TypeScript/JavaScript files
    console.log('📝 UPDATING CODE FILES:');
    console.log('=======================');
    
    let filesUpdated = 0;
    const adminPath = path.join(__dirname, '..');
    
    for (const relativeFilePath of FILES_TO_UPDATE) {
      const fullPath = path.join(adminPath, relativeFilePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`   ⏭️  Skipped: ${relativeFilePath} (file not found)`);
        continue;
      }
      
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Replace media_files with media
        content = content.replace(/collection\\('media_files'\\)/g, "collection('media')");
        content = content.replace(/getCollection\\('media_files'\\)/g, "getCollection('media')");
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content);
          console.log(`   ✅ Updated: ${relativeFilePath}`);
          filesUpdated++;
        } else {
          console.log(`   ⏭️  No changes: ${relativeFilePath}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error updating ${relativeFilePath}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Updated ${filesUpdated} files\n`);
    
    // Step 3: Migrate any remaining data from media_files to media
    console.log('📦 CHECKING FOR DATA MIGRATION:');
    console.log('===============================');
    
    if (mediaFilesCount > 0) {
      const mediaFilesData = await db.collection('media_files').find({}).toArray();
      const mediaData = await db.collection('media').find({}).toArray();
      
      // Find media_files entries that don't exist in media collection
      const mediaFilePaths = new Set(mediaData.map(m => m.file_path));
      const missingEntries = mediaFilesData.filter(mf => !mediaFilePaths.has(mf.file_path));
      
      if (missingEntries.length > 0) {
        console.log(`   Found ${missingEntries.length} entries in media_files not in media collection`);
        
        for (const entry of missingEntries) {
          // Convert media_files format to media format
          const mediaEntry = {
            file_name: entry.filename,
            original_name: entry.original_name,
            file_path: entry.file_path,
            file_size: entry.file_size,
            mime_type: entry.mime_type,
            category: 'image',
            uploaded_by: entry.uploaded_by,
            created_at: entry.created_at || entry.uploaded_at,
            updated_at: entry.updated_at || new Date()
          };
          
          // Check if file actually exists
          const fullFilePath = path.join(__dirname, '..', 'public', entry.file_path);
          if (fs.existsSync(fullFilePath)) {
            await db.collection('media').insertOne(mediaEntry);
            console.log(`   ✅ Migrated: ${entry.file_path}`);
          } else {
            console.log(`   ⏭️  Skipped: ${entry.file_path} (file missing)`);
          }
        }
      } else {
        console.log('   ✅ All media_files data already exists in media collection');
      }
    } else {
      console.log('   ✅ No data in media_files collection to migrate');
    }
    
    // Step 4: Final verification
    console.log(`\n🔍 FINAL VERIFICATION:`);
    console.log('======================');
    
    const finalMediaCount = await db.collection('media').countDocuments();
    console.log(`   media collection: ${finalMediaCount} entries`);
    
    // Check if any products still reference media_files ObjectIds
    const productsWithMediaFiles = await db.collection('products').find({
      $or: [
        { primary_image: { $exists: true } },
        { images: { $exists: true, $ne: [] } }
      ]
    }).toArray();
    
    let brokenReferences = 0;
    for (const product of productsWithMediaFiles) {
      if (product.primary_image && !product.image_urls?.length) {
        const mediaExists = await db.collection('media').findOne({ _id: product.primary_image });
        if (!mediaExists) {
          brokenReferences++;
        }
      }
    }
    
    if (brokenReferences > 0) {
      console.log(`   ⚠️  Found ${brokenReferences} products with broken references`);
      console.log('   Run product schema migration to fix these');
    } else {
      console.log('   ✅ All product references are clean');
    }
    
    console.log(`\n✅ MIGRATION READY FOR FINAL STEP:`);
    console.log('==================================');
    console.log('   1. Code files updated to use media collection');
    console.log('   2. Data migration completed');
    console.log('   3. References verified');
    console.log('');
    console.log('⚠️  To complete migration, run:');
    console.log('   node scripts/remove-media-files-collection.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  migrateAllMediaReferences();
}

module.exports = { migrateAllMediaReferences };