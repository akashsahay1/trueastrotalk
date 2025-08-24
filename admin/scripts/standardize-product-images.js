const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function standardizeProductImages() {
  console.log('🔧 STANDARDIZING PRODUCT IMAGE FIELDS...');
  console.log('=========================================\n');
  
  let client;
  
  try {
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    
    // Get all products
    const products = await productsCollection.find({}).toArray();
    console.log(`📦 Found ${products.length} products to standardize\n`);
    
    let updatedCount = 0;
    
    console.log('🔄 UPDATING PRODUCTS:');
    console.log('====================');
    
    for (const product of products) {
      let needsUpdate = false;
      const updateDoc = {
        $set: {},
        $unset: {}
      };
      
      // Determine the primary image URL
      let primaryImageUrl = null;
      
      if (product.image_urls && product.image_urls.length > 0) {
        primaryImageUrl = product.image_urls[0];
      } else if (product.image_url) {
        primaryImageUrl = product.image_url;
      }
      
      // Set the single image_url field
      if (primaryImageUrl) {
        updateDoc.$set.image_url = primaryImageUrl;
        needsUpdate = true;
      }
      
      // Remove all the old/redundant fields
      const fieldsToRemove = ['image_urls', 'images', 'primary_image'];
      fieldsToRemove.forEach(field => {
        if (product.hasOwnProperty(field)) {
          updateDoc.$unset[field] = '';
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        // Clean up empty $set and $unset objects
        if (Object.keys(updateDoc.$set).length === 0) {
          delete updateDoc.$set;
        }
        if (Object.keys(updateDoc.$unset).length === 0) {
          delete updateDoc.$unset;
        }
        
        await productsCollection.updateOne(
          { _id: product._id },
          updateDoc
        );
        
        console.log(`  ✅ ${product.name}`);
        console.log(`     image_url: ${primaryImageUrl || 'none'}`);
        console.log(`     removed: ${fieldsToRemove.filter(f => product.hasOwnProperty(f)).join(', ')}`);
        
        updatedCount++;
      } else {
        console.log(`  ⏭️  ${product.name} (no changes needed)`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`===========`);
    console.log(`✅ Updated: ${updatedCount} products`);
    console.log(`⏭️  Skipped: ${products.length - updatedCount} products`);
    
    // Verification
    console.log(`\n🔍 VERIFICATION:`);
    console.log(`================`);
    
    const verificationProducts = await productsCollection.find({}).limit(3).toArray();
    verificationProducts.forEach(product => {
      console.log(`${product.name}:`);
      console.log(`  image_url: ${product.image_url || 'undefined'}`);
      console.log(`  image_urls: ${product.image_urls || 'undefined'}`);
      console.log(`  images: ${product.images || 'undefined'}`);
      console.log(`  primary_image: ${product.primary_image || 'undefined'}`);
      console.log('');
    });
    
    const productsWithImages = await productsCollection.countDocuments({
      image_url: { $exists: true, $ne: null, $ne: '' }
    });
    
    const productsWithoutImages = await productsCollection.countDocuments({
      $or: [
        { image_url: { $exists: false } },
        { image_url: null },
        { image_url: '' }
      ]
    });
    
    console.log(`📸 Products with images: ${productsWithImages}`);
    console.log(`❌ Products without images: ${productsWithoutImages}`);
    
    if (productsWithoutImages === 0) {
      console.log('🎉 All products now have clean, single image_url field!');
    }
    
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
  standardizeProductImages();
}

module.exports = { standardizeProductImages };