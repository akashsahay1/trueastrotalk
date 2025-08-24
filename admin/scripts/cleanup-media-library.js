const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function cleanupMediaLibrary() {
  let client;
  
  try {
    console.log('🧹 Starting Media Library Cleanup...\n');
    
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');
    const productsCollection = db.collection('products');
    
    // Get all media entries
    const mediaFiles = await mediaCollection.find({}).toArray();
    console.log(`📋 Found ${mediaFiles.length} media entries to check\n`);
    
    let removedBroken = 0;
    let keptValid = 0;
    let keptUnused = 0;
    
    console.log('🔍 PROCESSING MEDIA ENTRIES:');
    console.log('=============================');
    
    for (const media of mediaFiles) {
      const fullPath = path.join(__dirname, '..', 'public', media.file_path);
      const exists = fs.existsSync(fullPath);
      
      if (!exists) {
        // File doesn't exist - remove from database
        await mediaCollection.deleteOne({ _id: media._id });
        
        // Also remove from any products that might reference it
        await productsCollection.updateMany(
          { 
            $or: [
              { images: media._id },
              { primary_image: media._id }
            ]
          },
          { 
            $pull: { images: media._id },
            $unset: { primary_image: '' }
          }
        );
        
        console.log(`🗑️  REMOVED BROKEN: ${media.file_path} (ID: ${media._id})`);
        removedBroken++;
      } else {
        // File exists - check if it's used
        const usedInProduct = await productsCollection.findOne({
          $or: [
            { images: media._id },
            { primary_image: media._id },
            { image_urls: media.file_path }
          ]
        });
        
        if (usedInProduct) {
          console.log(`✅ KEPT VALID: ${media.file_path} (used by: ${usedInProduct.name})`);
          keptValid++;
        } else {
          console.log(`⚠️  KEPT UNUSED: ${media.file_path} (file exists but not used)`);
          keptUnused++;
        }
      }
    }
    
    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`===================`);
    console.log(`🗑️  Removed broken entries: ${removedBroken}`);
    console.log(`✅ Kept valid entries: ${keptValid}`);
    console.log(`⚠️  Kept unused entries: ${keptUnused}`);
    console.log(`📦 Total processed: ${mediaFiles.length}`);
    
    // Final verification
    console.log(`\n🔍 FINAL VERIFICATION:`);
    console.log(`======================`);
    
    const finalMediaCount = await mediaCollection.countDocuments();
    const finalProductsWithImages = await productsCollection.countDocuments({
      image_urls: { $exists: true, $ne: [], $ne: null }
    });
    
    console.log(`📸 Media entries in database: ${finalMediaCount}`);
    console.log(`🛍️  Products with images: ${finalProductsWithImages}`);
    
    // Check for any products still referencing broken ObjectIds
    const productsWithBrokenRefs = await productsCollection.find({
      $or: [
        { primary_image: { $exists: true, $ne: null } },
        { images: { $exists: true, $ne: [] } }
      ]
    }).toArray();
    
    let fixedProducts = 0;
    for (const product of productsWithBrokenRefs) {
      let needsUpdate = false;
      const updateDoc = {};
      
      // Check primary_image ObjectId
      if (product.primary_image && !product.image_urls?.[0]) {
        const mediaExists = await mediaCollection.findOne({ _id: new ObjectId(product.primary_image) });
        if (!mediaExists) {
          updateDoc.$unset = { primary_image: '' };
          needsUpdate = true;
        }
      }
      
      // Check images array ObjectIds
      if (product.images && Array.isArray(product.images)) {
        const validImages = [];
        for (const imageId of product.images) {
          const mediaExists = await mediaCollection.findOne({ _id: new ObjectId(imageId) });
          if (mediaExists) {
            validImages.push(imageId);
          }
        }
        if (validImages.length !== product.images.length) {
          updateDoc.$set = { ...updateDoc.$set, images: validImages };
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await productsCollection.updateOne({ _id: product._id }, updateDoc);
        console.log(`🔧 Fixed references for: ${product.name}`);
        fixedProducts++;
      }
    }
    
    if (fixedProducts > 0) {
      console.log(`🔧 Fixed broken references in ${fixedProducts} products`);
    } else {
      console.log(`✅ All product references are clean!`);
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

// Run the cleanup
if (require.main === module) {
  cleanupMediaLibrary();
}

module.exports = { cleanupMediaLibrary };