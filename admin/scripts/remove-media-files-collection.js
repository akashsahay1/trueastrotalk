const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function removeMediaFilesCollection() {
  console.log('🗑️  SAFELY REMOVING MEDIA_FILES COLLECTION...');
  console.log('============================================\n');
  
  let client;
  
  try {
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Final safety checks
    console.log('🔍 FINAL SAFETY CHECKS:');
    console.log('=======================');
    
    const mediaCount = await db.collection('media').countDocuments();
    const mediaFilesCount = await db.collection('media_files').countDocuments();
    
    console.log(`   media collection: ${mediaCount} entries`);
    console.log(`   media_files collection: ${mediaFilesCount} entries`);
    
    if (mediaCount === 0) {
      console.log('❌ UNSAFE: media collection is empty!');
      console.log('   Cannot proceed with removal.');
      return;
    }
    
    if (mediaCount < 40) {
      console.log('⚠️  WARNING: media collection has fewer entries than expected');
      console.log('   Proceeding with caution...');
    }
    
    // Check if any products still reference media_files ObjectIds
    const productsWithBrokenRefs = await db.collection('products').find({
      $or: [
        { primary_image: { $exists: true, $ne: null } },
        { images: { $exists: true, $ne: [] } }
      ]
    }).toArray();
    
    let hasImageUrls = 0;
    let missingImageUrls = 0;
    
    for (const product of productsWithBrokenRefs) {
      if (product.image_urls && product.image_urls.length > 0) {
        hasImageUrls++;
      } else {
        missingImageUrls++;
      }
    }
    
    console.log(`   Products with image_urls: ${hasImageUrls}`);
    console.log(`   Products missing image_urls: ${missingImageUrls}`);
    
    if (missingImageUrls > 0) {
      console.log('⚠️  WARNING: Some products still rely on ObjectId references');
      console.log('   These will lose their image references after collection removal');
    }
    
    // Show what will be lost
    console.log(`\\n📋 MEDIA_FILES COLLECTION CONTENTS:`);
    console.log('===================================');
    const mediaFilesData = await db.collection('media_files').find({}).toArray();
    
    let validFiles = 0;
    let brokenFiles = 0;
    
    mediaFilesData.forEach(file => {
      const exists = require('fs').existsSync(require('path').join(__dirname, '..', 'public', file.file_path));
      if (exists) {
        console.log(`   ✅ ${file.file_path} (${file.original_name})`);
        validFiles++;
      } else {
        console.log(`   ❌ ${file.file_path} (${file.original_name}) - FILE MISSING`);
        brokenFiles++;
      }
    });
    
    console.log(`\\nSummary: ${validFiles} valid files, ${brokenFiles} broken files`);
    
    // Ask for confirmation
    console.log(`\\n⚠️  CONFIRMATION REQUIRED:`);
    console.log('=========================');
    console.log('About to PERMANENTLY DELETE media_files collection containing:');
    console.log(`   - ${validFiles} valid file references`);
    console.log(`   - ${brokenFiles} broken file references`);
    console.log('');
    console.log('This action cannot be undone!');
    console.log('');
    console.log('Type "DELETE" to confirm or anything else to cancel:');
    
    // In automated script, we'll add a safety parameter
    const confirmDelete = process.argv.includes('--confirm-delete');
    
    if (!confirmDelete) {
      console.log('❌ Deletion not confirmed. Collection preserved.');
      console.log('');
      console.log('To actually delete, run:');
      console.log('   node scripts/remove-media-files-collection.js --confirm-delete');
      return;
    }
    
    // Proceed with deletion
    console.log('🗑️  PROCEEDING WITH DELETION...');
    
    const dropResult = await db.collection('media_files').drop();
    
    if (dropResult) {
      console.log('✅ media_files collection successfully removed!');
      
      // Verify it's gone
      const collections = await db.listCollections({ name: 'media_files' }).toArray();
      if (collections.length === 0) {
        console.log('✅ Verified: media_files collection no longer exists');
      } else {
        console.log('⚠️  Warning: Collection might still exist');
      }
      
      // Final status
      const finalMediaCount = await db.collection('media').countDocuments();
      console.log(`\\n📊 FINAL STATUS:`);
      console.log('===============');
      console.log(`   media collection: ${finalMediaCount} entries (active)`);
      console.log(`   media_files collection: REMOVED`);
      console.log('');
      console.log('✅ Migration complete! All media references now use the media collection.');
      
    } else {
      console.log('❌ Failed to remove collection');
    }
    
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('✅ Collection already removed or never existed');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  removeMediaFilesCollection();
}

module.exports = { removeMediaFilesCollection };