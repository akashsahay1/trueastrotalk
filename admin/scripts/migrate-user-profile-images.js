#!/usr/bin/env node

/**
 * Migration script to ensure user profile images use the media_id system
 * This script:
 * 1. Ensures all media records have media_id
 * 2. Updates user profile_image_id to use media_id references where possible
 * 3. Handles both ObjectId and media_id formats properly
 */

const { MongoClient, ObjectId } = require('mongodb');

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

async function migrateUserProfileImages(db) {
  console.log('👤 Starting user profile image migration...\n');
  
  const usersCollection = db.collection('users');
  const mediaCollection = db.collection('media');
  
  // Find all users with profile_image_id
  const users = await usersCollection.find({ 
    profile_image_id: { $exists: true, $ne: null } 
  }).toArray();
  
  console.log(`Found ${users.length} users with profile images to check\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let mediaCreatedCount = 0;
  
  for (const user of users) {
    const updates = {};
    let needsUpdate = false;
    
    // Check if profile_image_id is ObjectId format and needs media_id
    if (user.profile_image_id instanceof ObjectId) {
      // Find the media record by ObjectId
      const mediaRecord = await mediaCollection.findOne({ _id: user.profile_image_id });
      
      if (mediaRecord) {
        // If media record doesn't have media_id, create one
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
          console.log(`  Generated media_id for user ${user.full_name}: ${newMediaId}`);
          mediaCreatedCount++;
          
          // Update user to use the new media_id instead of ObjectId
          updates.profile_image_id = newMediaId;
          needsUpdate = true;
        } else {
          // Update user to use existing media_id
          updates.profile_image_id = mediaRecord.media_id;
          needsUpdate = true;
        }
      } else {
        console.log(`  ⚠️  Media record not found for user ${user.full_name} with ObjectId: ${user.profile_image_id}`);
        // Remove invalid profile_image_id
        updates.profile_image_id = null;
        needsUpdate = true;
      }
    } else if (typeof user.profile_image_id === 'string') {
      // Check if it's already a media_id format
      if (user.profile_image_id.startsWith('media_')) {
        // Verify the media record exists
        const mediaRecord = await mediaCollection.findOne({ media_id: user.profile_image_id });
        if (!mediaRecord) {
          console.log(`  ⚠️  Media record not found for user ${user.full_name} with media_id: ${user.profile_image_id}`);
          updates.profile_image_id = null;
          needsUpdate = true;
        } else {
          console.log(`  ✅ User ${user.full_name} already has valid media_id: ${user.profile_image_id}`);
          skippedCount++;
        }
      } else {
        // It might be a string representation of ObjectId, try to convert
        try {
          const objectId = new ObjectId(user.profile_image_id);
          const mediaRecord = await mediaCollection.findOne({ _id: objectId });
          
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
              mediaCreatedCount++;
            }
            updates.profile_image_id = mediaRecord.media_id;
            needsUpdate = true;
          } else {
            console.log(`  ⚠️  Invalid profile_image_id for user ${user.full_name}: ${user.profile_image_id}`);
            updates.profile_image_id = null;
            needsUpdate = true;
          }
        } catch {
          console.log(`  ⚠️  Invalid profile_image_id format for user ${user.full_name}: ${user.profile_image_id}`);
          updates.profile_image_id = null;
          needsUpdate = true;
        }
      }
    }
    
    // Apply updates if needed
    if (needsUpdate && Object.keys(updates).length > 0) {
      updates.updated_at = new Date();
      
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: updates }
      );
      
      console.log(`✅ Updated profile image for user: ${user.full_name}`);
      if (updates.profile_image_id) {
        console.log(`   New profile_image_id: ${updates.profile_image_id}`);
      } else {
        console.log(`   Removed invalid profile_image_id`);
      }
      updatedCount++;
    }
  }
  
  console.log(`\n📊 User Profile Image Migration Summary:`);
  console.log(`   Users updated: ${updatedCount}`);
  console.log(`   Users already valid: ${skippedCount}`);
  console.log(`   Media records created: ${mediaCreatedCount}`);
  console.log(`   Total users processed: ${users.length}`);
}

async function verifyUserProfileImages(db) {
  console.log('\n🔍 Verifying user profile image migration...\n');
  
  const usersCollection = db.collection('users');
  const mediaCollection = db.collection('media');
  
  // Count users by profile image type
  const usersWithObjectId = await usersCollection.countDocuments({ 
    profile_image_id: { $type: 'objectId' } 
  });
  
  const usersWithMediaId = await usersCollection.countDocuments({ 
    profile_image_id: { $regex: /^media_/ } 
  });
  
  const usersWithNoProfileImage = await usersCollection.countDocuments({ 
    $or: [
      { profile_image_id: { $exists: false } },
      { profile_image_id: null }
    ]
  });
  
  console.log(`User Profile Images Summary:`);
  console.log(`  With ObjectId format: ${usersWithObjectId}`);
  console.log(`  With media_id format: ${usersWithMediaId}`);
  console.log(`  Without profile image: ${usersWithNoProfileImage}`);
  
  // Sample a few users to verify their media records exist
  const sampleUsers = await usersCollection.find({ 
    profile_image_id: { $regex: /^media_/ } 
  }).limit(3).toArray();
  
  console.log(`\nSample verification:`);
  for (const user of sampleUsers) {
    const mediaRecord = await mediaCollection.findOne({ 
      media_id: user.profile_image_id 
    });
    
    if (mediaRecord) {
      console.log(`  ✅ ${user.full_name}: ${user.profile_image_id} -> ${mediaRecord.file_path}`);
    } else {
      console.log(`  ❌ ${user.full_name}: ${user.profile_image_id} -> NOT FOUND`);
    }
  }
}

async function main() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🚀 Starting user profile image migration...');
    console.log(`   MongoDB: ${MONGODB_URL}`);
    console.log(`   Database: ${DB_NAME}\n`);
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Step 1: Migrate user profile images
    await migrateUserProfileImages(db);
    
    // Step 2: Verify migration
    await verifyUserProfileImages(db);
    
    console.log('\n✅ User profile image migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ User profile image migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration
main().catch(console.error);