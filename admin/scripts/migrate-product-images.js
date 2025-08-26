#!/usr/bin/env node

/**
 * Migration script to standardize product images to use media_id system
 * This script:
 * 1. Adds media_id to all media records that don't have one
 * 2. Updates products to use image_id (media_id reference) instead of image_url
 * 3. Cleans up old image fields
 */

const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

/**
 * Generate a unique media ID that persists across database exports/imports
 * Format: media_{timestamp}_{random}
 */
function generateMediaId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `media_${timestamp}_${random}`;
}

async function migrateMedia(db) {
  console.log('📸 Starting media migration...');
  
  const mediaCollection = db.collection('media');
  
  // Find all media records without media_id
  const mediaWithoutId = await mediaCollection.find({ 
    media_id: { $exists: false } 
  }).toArray();
  
  console.log(`Found ${mediaWithoutId.length} media records without media_id`);
  
  // Add media_id to each record
  for (const media of mediaWithoutId) {
    const mediaId = generateMediaId();
    await mediaCollection.updateOne(
      { _id: media._id },
      { 
        $set: { 
          media_id: mediaId,
          updated_at: new Date()
        } 
      }
    );
    console.log(`✅ Added media_id ${mediaId} to ${media.file_path}`);
  }
  
  console.log('✨ Media migration complete!\n');
}

async function migrateProducts(db) {
  console.log('📦 Starting product migration...');
  
  const productsCollection = db.collection('products');
  const mediaCollection = db.collection('media');
  
  // Find all products
  const products = await productsCollection.find({}).toArray();
  console.log(`Found ${products.length} products to migrate`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const product of products) {
    const updates = {};
    
    // If product already has image_id with media_id format, skip
    if (product.image_id && typeof product.image_id === 'string' && product.image_id.startsWith('media_')) {
      console.log(`⏭️  Skipping ${product.name} - already migrated`);
      skippedCount++;
      continue;
    }
    
    // Handle featured image
    let featuredMediaId = null;
    
    // Check various possible image fields
    const imageUrl = product.image_url || product.primary_image;
    
    if (imageUrl) {
      // Look up media record by file_path
      const mediaRecord = await mediaCollection.findOne({ file_path: imageUrl });
      
      if (mediaRecord) {
        // Use existing media_id or generate one if missing
        if (!mediaRecord.media_id) {
          const newMediaId = generateMediaId();
          await mediaCollection.updateOne(
            { _id: mediaRecord._id },
            { 
              $set: { 
                media_id: newMediaId,
                updated_at: new Date()
              } 
            }
          );
          featuredMediaId = newMediaId;
          console.log(`  Generated media_id for ${imageUrl}: ${newMediaId}`);
        } else {
          featuredMediaId = mediaRecord.media_id;
        }
      } else {
        console.log(`  ⚠️  No media record found for ${imageUrl}`);
      }
    }
    
    // Handle gallery images
    const galleryMediaIds = [];
    const galleryImages = product.images || product.image_urls || [];
    
    if (Array.isArray(galleryImages) && galleryImages.length > 0) {
      for (const imgUrl of galleryImages) {
        if (typeof imgUrl === 'string') {
          // Skip if it's already a media_id
          if (imgUrl.startsWith('media_')) {
            galleryMediaIds.push(imgUrl);
            continue;
          }
          
          // Look up media record
          const mediaRecord = await mediaCollection.findOne({ file_path: imgUrl });
          
          if (mediaRecord) {
            if (!mediaRecord.media_id) {
              const newMediaId = generateMediaId();
              await mediaCollection.updateOne(
                { _id: mediaRecord._id },
                { 
                  $set: { 
                    media_id: newMediaId,
                    updated_at: new Date()
                  } 
                }
              );
              galleryMediaIds.push(newMediaId);
            } else {
              galleryMediaIds.push(mediaRecord.media_id);
            }
          }
        }
      }
    }
    
    // Prepare updates
    if (featuredMediaId) {
      updates.image_id = featuredMediaId;
    }
    
    if (galleryMediaIds.length > 0) {
      updates.images = galleryMediaIds;
    } else if (!product.images) {
      updates.images = [];
    }
    
    // Add update timestamp
    updates.updated_at = new Date();
    
    // Remove old fields
    const unsetFields = {};
    if (product.image_url) unsetFields.image_url = "";
    if (product.primary_image) unsetFields.primary_image = "";
    if (product.image_urls) unsetFields.image_urls = "";
    
    // Update the product
    const updateQuery = { $set: updates };
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }
    
    await productsCollection.updateOne(
      { _id: product._id },
      updateQuery
    );
    
    console.log(`✅ Migrated ${product.name}`);
    if (featuredMediaId) console.log(`   Featured: ${featuredMediaId}`);
    if (galleryMediaIds.length > 0) console.log(`   Gallery: ${galleryMediaIds.length} images`);
    
    migratedCount++;
  }
  
  console.log(`\n✨ Product migration complete!`);
  console.log(`   Migrated: ${migratedCount} products`);
  console.log(`   Skipped: ${skippedCount} products (already migrated)`);
}

async function verifyMigration(db) {
  console.log('\n🔍 Verifying migration...');
  
  const productsCollection = db.collection('products');
  const mediaCollection = db.collection('media');
  
  // Check media records
  const mediaWithoutId = await mediaCollection.countDocuments({ 
    media_id: { $exists: false } 
  });
  
  const mediaWithId = await mediaCollection.countDocuments({ 
    media_id: { $exists: true } 
  });
  
  console.log(`\nMedia Collection:`);
  console.log(`  With media_id: ${mediaWithId}`);
  console.log(`  Without media_id: ${mediaWithoutId}`);
  
  // Check products
  const productsWithImageId = await productsCollection.countDocuments({ 
    image_id: { $exists: true } 
  });
  
  const productsWithOldFields = await productsCollection.countDocuments({ 
    $or: [
      { image_url: { $exists: true } },
      { primary_image: { $exists: true } },
      { image_urls: { $exists: true } }
    ]
  });
  
  console.log(`\nProducts Collection:`);
  console.log(`  With image_id: ${productsWithImageId}`);
  console.log(`  With old image fields: ${productsWithOldFields}`);
  
  // Sample a migrated product
  const sampleProduct = await productsCollection.findOne({ 
    image_id: { $exists: true } 
  });
  
  if (sampleProduct) {
    console.log(`\nSample migrated product: ${sampleProduct.name}`);
    console.log(`  image_id: ${sampleProduct.image_id}`);
    console.log(`  images: ${JSON.stringify(sampleProduct.images || [])}`);
  }
}

async function main() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🚀 Starting product image migration...');
    console.log(`   MongoDB: ${MONGODB_URL}`);
    console.log(`   Database: ${DB_NAME}\n`);
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Step 1: Migrate media collection
    await migrateMedia(db);
    
    // Step 2: Migrate products collection
    await migrateProducts(db);
    
    // Step 3: Verify migration
    await verifyMigration(db);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration
main().catch(console.error);