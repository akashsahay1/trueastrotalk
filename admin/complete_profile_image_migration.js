const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function completeProfileImageMigration() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Step 1: Get or create default avatar in media_files
    console.log('\n=== Step 1: Ensuring Default Avatar Exists ===');
    let defaultAvatarMedia = await db.collection('media_files').findOne({
      original_name: 'default_astrologer_avatar.jpg'
    });
    
    if (!defaultAvatarMedia) {
      const avatarData = {
        filename: 'default_astrologer_avatar.jpg',
        original_name: 'default_astrologer_avatar.jpg',
        file_path: '/assets/images/avatar-1.jpg',
        file_size: 15000,
        mime_type: 'image/jpeg',
        uploaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await db.collection('media_files').insertOne(avatarData);
      defaultAvatarMedia = { ...avatarData, _id: result.insertedId };
      console.log(`✅ Created default avatar: ${defaultAvatarMedia._id}`);
    } else {
      console.log(`✅ Using existing default avatar: ${defaultAvatarMedia._id}`);
    }

    // Step 2: Get all users and prepare migration data
    console.log('\n=== Step 2: Processing All Users ===');
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`Found ${allUsers.length} total users`);

    let processedCount = 0;
    let googleUsersCount = 0;
    let regularUsersCount = 0;

    // Step 2a: First, clean up all old fields
    console.log('Cleaning up old profile image fields...');
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          profile_image: "",
          profile_image_id: "", 
          social_auth_profile_image: ""
        }
      }
    );

    // Step 2b: Process each user to set new fields
    for (const user of allUsers) {
      const updates = {};
      
      // Determine what to set based on auth_type and existing profile_image
      if (user.auth_type === 'google' && user.profile_image && user.profile_image.startsWith('http')) {
        // Google user with external URL - save to social_auth_profile_image
        updates.social_auth_profile_image = user.profile_image;
        updates.profile_image_id = defaultAvatarMedia._id; // Still give them default as fallback
        googleUsersCount++;
        console.log(`📷 Google user: ${user.full_name || user.email_address} -> social_auth_profile_image`);
      } else {
        // Everyone else gets default avatar
        updates.profile_image_id = defaultAvatarMedia._id;
        regularUsersCount++;
        
        // If they had a local image, try to find it in media_files
        if (user.profile_image && !user.profile_image.startsWith('http') && user.profile_image.startsWith('/uploads/')) {
          const mediaFile = await db.collection('media_files').findOne({file_path: user.profile_image});
          if (mediaFile) {
            updates.profile_image_id = mediaFile._id;
            console.log(`🔗 Found media file for ${user.full_name || user.email_address}: ${mediaFile._id}`);
          } else {
            console.log(`⚠️  Media file not found for ${user.full_name || user.email_address}: ${user.profile_image}, using default`);
          }
        }
      }

      // Apply the updates
      if (Object.keys(updates).length > 0) {
        await db.collection('users').updateOne({_id: user._id}, {$set: updates});
        processedCount++;
      }
    }

    // Step 3: Verification
    console.log('\n=== Step 3: Verification ===');
    const totalUsers = await db.collection('users').countDocuments({});
    const usersWithProfileId = await db.collection('users').countDocuments({profile_image_id: {$exists: true}});
    const usersWithSocialAuth = await db.collection('users').countDocuments({social_auth_profile_image: {$exists: true}});
    const usersWithOldProfileImage = await db.collection('users').countDocuments({profile_image: {$exists: true}});

    console.log('\n=== Migration Summary ===');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users processed: ${processedCount}`);
    console.log(`Google users (with social_auth_profile_image): ${googleUsersCount}`);
    console.log(`Regular users (with profile_image_id only): ${regularUsersCount}`);
    console.log(`Users with profile_image_id: ${usersWithProfileId}`);
    console.log(`Users with social_auth_profile_image: ${usersWithSocialAuth}`);
    console.log(`Users still with old profile_image: ${usersWithOldProfileImage}`);
    console.log(`Default avatar media ID: ${defaultAvatarMedia._id}`);

    if (usersWithOldProfileImage > 0) {
      console.log('\n⚠️  Warning: Some users still have old profile_image fields');
      const remainingUsers = await db.collection('users').find({profile_image: {$exists: true}}, {full_name: 1, profile_image: 1, user_type: 1}).toArray();
      remainingUsers.forEach(user => {
        console.log(`  - ${user.full_name || 'Unknown'} (${user.user_type}): ${user.profile_image}`);
      });
    }

    console.log('\n✅ Complete profile image migration finished!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
completeProfileImageMigration();