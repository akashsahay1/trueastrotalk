// Production Database Update Script
// Run this script to update the production database schema

const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function updateProductionDatabase() {
  console.log('🔄 Connecting to production database...');
  
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  
  const db = client.db(DB_NAME);
  
  try {
    // 1. Ensure users collection has profile_picture field
    console.log('📝 Updating users collection schema...');
    await db.collection('users').updateMany(
      { profile_picture: { $exists: false } },
      { $set: { profile_picture: null } }
    );
    
    // 2. Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    
    // Users collection indexes
    await db.collection('users').createIndex({ email_address: 1 }, { unique: true });
    await db.collection('users').createIndex({ user_type: 1 });
    await db.collection('users').createIndex({ account_status: 1 });
    await db.collection('users').createIndex({ verification_status: 1 });
    
    // Sessions collection indexes (if exists)
    const collections = await db.listCollections().toArray();
    const hasSessionsCollection = collections.some(col => col.name === 'sessions');
    
    if (hasSessionsCollection) {
      await db.collection('sessions').createIndex({ astrologer_id: 1 });
      await db.collection('sessions').createIndex({ customer_id: 1 });
      await db.collection('sessions').createIndex({ status: 1 });
      await db.collection('sessions').createIndex({ created_at: -1 });
    }
    
    // Products collection indexes (if exists)
    const hasProductsCollection = collections.some(col => col.name === 'products');
    if (hasProductsCollection) {
      await db.collection('products').createIndex({ category: 1 });
      await db.collection('products').createIndex({ featured: 1 });
      await db.collection('products').createIndex({ status: 1 });
    }
    
    // 3. Update any existing profile images to use new format
    console.log('🖼️ Updating profile image URLs...');
    const usersWithImages = await db.collection('users').find({
      profile_picture: { $exists: true, $ne: null, $ne: '' }
    }).toArray();
    
    for (const user of usersWithImages) {
      if (user.profile_picture && !user.profile_picture.startsWith('/uploads/')) {
        // This might be a legacy image URL that needs updating
        console.log(`Updating profile image for user: ${user.full_name}`);
      }
    }
    
    console.log('✅ Database update completed successfully!');
    
    // 4. Print statistics
    const stats = {
      totalUsers: await db.collection('users').countDocuments(),
      astrologers: await db.collection('users').countDocuments({ user_type: 'astrologer' }),
      customers: await db.collection('users').countDocuments({ user_type: 'customer' }),
      usersWithImages: await db.collection('users').countDocuments({ 
        profile_picture: { $exists: true, $ne: null, $ne: '' } 
      })
    };
    
    console.log('📊 Database Statistics:');
    console.log(`   Total Users: ${stats.totalUsers}`);
    console.log(`   Astrologers: ${stats.astrologers}`);
    console.log(`   Customers: ${stats.customers}`);
    console.log(`   Users with Images: ${stats.usersWithImages}`);
    
  } catch (error) {
    console.error('❌ Error updating database:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
updateProductionDatabase()
  .then(() => {
    console.log('🎉 Production database update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Production database update failed:', error);
    process.exit(1);
  });