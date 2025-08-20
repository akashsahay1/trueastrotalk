const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function migrateMediaReferences() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Migrate products
    console.log('\n=== Migrating Products ===');
    const products = await db.collection('products').find({image_url: {$exists: true, $type: "string"}}).toArray();
    console.log(`Found ${products.length} products with image URLs`);
    
    for (const product of products) {
      const mediaFile = await db.collection('media_files').findOne({file_path: product.image_url});
      if (mediaFile) {
        await db.collection('products').updateOne(
          {_id: product._id},
          {
            $set: {image_id: mediaFile._id},
            $unset: {image_url: ""}
          }
        );
        console.log(`✅ Updated product: ${product.name} -> ${mediaFile._id}`);
      } else {
        console.log(`❌ No media file found for product: ${product.name} (${product.image_url})`);
      }
    }
    
    // Migrate users (astrologers and customers with profile images)
    console.log('\n=== Migrating User Profile Images ===');
    const users = await db.collection('users').find({
      profile_image: {$exists: true, $ne: "", $type: "string"},
      $and: [
        {profile_image: {$not: /^https?:\/\//}}  // Exclude Google profile URLs
      ]
    }).toArray();
    console.log(`Found ${users.length} users with local profile images`);
    
    for (const user of users) {
      const mediaFile = await db.collection('media_files').findOne({file_path: user.profile_image});
      if (mediaFile) {
        await db.collection('users').updateOne(
          {_id: user._id},
          {
            $set: {profile_image_id: mediaFile._id},
            $unset: {profile_image: ""}
          }
        );
        console.log(`✅ Updated user: ${user.full_name || user.email_address} -> ${mediaFile._id}`);
      } else {
        console.log(`❌ No media file found for user: ${user.full_name || user.email_address} (${user.profile_image})`);
      }
    }
    
    console.log('\n=== Migration Summary ===');
    const updatedProducts = await db.collection('products').countDocuments({image_id: {$exists: true}});
    const updatedUsers = await db.collection('users').countDocuments({profile_image_id: {$exists: true}});
    console.log(`Products with media references: ${updatedProducts}`);
    console.log(`Users with media references: ${updatedUsers}`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
migrateMediaReferences();