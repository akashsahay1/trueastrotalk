const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function cleanupDatabase() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    console.log('\n==========================================');
    console.log('🧹 DATABASE CLEANUP STARTING');
    console.log('==========================================\n');
    
    // ================================
    // 1. CLEAN UP USERS COLLECTION
    // ================================
    console.log('1️⃣ CLEANING UP USERS COLLECTION');
    console.log('=====================================');
    
    // Get all users first for analysis
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`📊 Total users found: ${allUsers.length}`);
    
    // Categorize users
    let regularUsers = 0;
    let googleUsers = 0;
    let usersWithOldProfileImage = 0;
    let usersWithProfileImageId = 0;
    let usersWithSocialAuthImage = 0;
    
    allUsers.forEach(user => {
      if (user.auth_type === 'google') googleUsers++;
      else regularUsers++;
      
      if (user.profile_image && typeof user.profile_image === 'string') usersWithOldProfileImage++;
      if (user.profile_image_id) usersWithProfileImageId++;
      if (user.social_auth_profile_image !== undefined) usersWithSocialAuthImage++;
    });
    
    console.log(`👤 Regular users: ${regularUsers}`);
    console.log(`🔗 Google users: ${googleUsers}`);
    console.log(`🗑️  Users with old profile_image field: ${usersWithOldProfileImage}`);
    console.log(`🖼️  Users with profile_image_id: ${usersWithProfileImageId}`);
    console.log(`📱 Users with social_auth_profile_image: ${usersWithSocialAuthImage}`);
    
    // Remove any remaining old profile_image fields
    if (usersWithOldProfileImage > 0) {
      console.log('\n🧽 Removing old profile_image fields...');
      const result = await db.collection('users').updateMany(
        { profile_image: { $exists: true } },
        { $unset: { profile_image: "" } }
      );
      console.log(`✅ Removed profile_image from ${result.modifiedCount} users`);
    }
    
    // Fix Google users - remove profile_image_id and ensure social_auth_profile_image is null
    const googleUsersWithMediaId = await db.collection('users').find({ 
      auth_type: 'google',
      profile_image_id: { $exists: true }
    }).toArray();
    
    if (googleUsersWithMediaId.length > 0) {
      console.log(`\n🔧 Fixing ${googleUsersWithMediaId.length} Google users with incorrect profile_image_id...`);
      await db.collection('users').updateMany(
        { auth_type: 'google' },
        { 
          $unset: { profile_image_id: "" },
          $set: { social_auth_profile_image: null }
        }
      );
      console.log('✅ Fixed Google users profile image setup');
    }
    
    // Ensure all regular users have profile_image_id (set to null if not exists)
    const regularUsersWithoutProfileId = await db.collection('users').countDocuments({
      auth_type: { $ne: 'google' },
      profile_image_id: { $exists: false }
    });
    
    if (regularUsersWithoutProfileId > 0) {
      console.log(`\n🔧 Setting profile_image_id to null for ${regularUsersWithoutProfileId} regular users...`);
      await db.collection('users').updateMany(
        { 
          auth_type: { $ne: 'google' },
          profile_image_id: { $exists: false }
        },
        { $set: { profile_image_id: null } }
      );
      console.log('✅ Set profile_image_id to null for regular users without it');
    }
    
    // ================================
    // 2. CLEAN UP PRODUCTS COLLECTION
    // ================================
    console.log('\n2️⃣ CLEANING UP PRODUCTS COLLECTION');
    console.log('====================================');
    
    const allProducts = await db.collection('products').find({}).toArray();
    console.log(`📦 Total products found: ${allProducts.length}`);
    
    let productsWithOldImageUrl = 0;
    let productsWithImageId = 0;
    
    allProducts.forEach(product => {
      if (product.image_url && typeof product.image_url === 'string') productsWithOldImageUrl++;
      if (product.image_id) productsWithImageId++;
    });
    
    console.log(`🗑️  Products with old image_url field: ${productsWithOldImageUrl}`);
    console.log(`🖼️  Products with image_id: ${productsWithImageId}`);
    
    // Remove old image_url fields
    if (productsWithOldImageUrl > 0) {
      console.log('\n🧽 Removing old image_url fields from products...');
      const result = await db.collection('products').updateMany(
        { image_url: { $exists: true } },
        { $unset: { image_url: "" } }
      );
      console.log(`✅ Removed image_url from ${result.modifiedCount} products`);
    }
    
    // Ensure all products have image_id field (set to null if not exists)
    const productsWithoutImageId = await db.collection('products').countDocuments({
      image_id: { $exists: false }
    });
    
    if (productsWithoutImageId > 0) {
      console.log(`\n🔧 Setting image_id to null for ${productsWithoutImageId} products...`);
      await db.collection('products').updateMany(
        { image_id: { $exists: false } },
        { $set: { image_id: null } }
      );
      console.log('✅ Set image_id to null for products without it');
    }
    
    // ================================
    // 3. VERIFY MEDIA FILES COLLECTION
    // ================================
    console.log('\n3️⃣ VERIFYING MEDIA FILES COLLECTION');
    console.log('=====================================');
    
    const mediaCount = await db.collection('media_files').countDocuments();
    console.log(`📁 Total media files: ${mediaCount}`);
    
    // Check for default avatar
    const defaultAvatar = await db.collection('media_files').findOne({
      original_name: 'default_astrologer_avatar.jpg'
    });
    console.log(`🖼️  Default avatar exists: ${defaultAvatar ? 'Yes' : 'No'}`);
    
    // ================================
    // 4. FINAL VERIFICATION
    // ================================
    console.log('\n4️⃣ FINAL VERIFICATION');
    console.log('======================');
    
    // Check users
    const finalUserStats = await db.collection('users').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          regularUsersWithProfileId: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$auth_type", "google"] }, { $ne: ["$profile_image_id", null] }] },
                1, 0
              ]
            }
          },
          regularUsersWithoutProfileId: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$auth_type", "google"] }, { $eq: ["$profile_image_id", null] }] },
                1, 0
              ]
            }
          },
          googleUsersWithSocialAuth: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$auth_type", "google"] }, { $eq: ["$social_auth_profile_image", null] }] },
                1, 0
              ]
            }
          },
          usersWithOldFields: {
            $sum: {
              $cond: [{ $ifNull: ["$profile_image", false] }, 1, 0]
            }
          }
        }
      }
    ]).toArray();
    
    const userStats = finalUserStats[0] || {};
    console.log(`👥 Final user statistics:`);
    console.log(`   - Total users: ${userStats.total || 0}`);
    console.log(`   - Regular users with profile_image_id: ${userStats.regularUsersWithProfileId || 0}`);
    console.log(`   - Regular users without profile_image_id (null): ${userStats.regularUsersWithoutProfileId || 0}`);
    console.log(`   - Google users with social_auth_profile_image: ${userStats.googleUsersWithSocialAuth || 0}`);
    console.log(`   - Users with old profile_image fields: ${userStats.usersWithOldFields || 0}`);
    
    // Check products
    const finalProductStats = await db.collection('products').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withImageId: {
            $sum: {
              $cond: [{ $ne: ["$image_id", null] }, 1, 0]
            }
          },
          withoutImageId: {
            $sum: {
              $cond: [{ $eq: ["$image_id", null] }, 1, 0]
            }
          },
          withOldFields: {
            $sum: {
              $cond: [{ $ifNull: ["$image_url", false] }, 1, 0]
            }
          }
        }
      }
    ]).toArray();
    
    const productStats = finalProductStats[0] || {};
    console.log(`📦 Final product statistics:`);
    console.log(`   - Total products: ${productStats.total || 0}`);
    console.log(`   - Products with image_id: ${productStats.withImageId || 0}`);
    console.log(`   - Products without image_id (null): ${productStats.withoutImageId || 0}`);
    console.log(`   - Products with old image_url fields: ${productStats.withOldFields || 0}`);
    
    console.log('\n==========================================');
    console.log('✅ DATABASE CLEANUP COMPLETED!');
    console.log('==========================================');
    
    if ((userStats.usersWithOldFields || 0) === 0 && (productStats.withOldFields || 0) === 0) {
      console.log('🎉 All old fields have been successfully removed!');
      console.log('🎉 Database is now using the new media management system!');
    } else {
      console.log('⚠️  Some old fields still remain - manual review may be needed');
    }
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    await client.close();
  }
}

// Run the cleanup
cleanupDatabase();