require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkAstrologers() {
  console.log('🔍 Checking astrologer records in database...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Count total astrologers
    const totalCount = await usersCollection.countDocuments({ user_type: 'astrologer' });
    console.log(`📊 Total astrologers: ${totalCount}`);
    
    // Get first few astrologers to examine their structure
    const astrologers = await usersCollection.find({ user_type: 'astrologer' })
      .limit(3)
      .toArray();
    
    console.log('\n🔍 Sample astrologer records:');
    astrologers.forEach((astrologer, index) => {
      console.log(`\n--- Astrologer ${index + 1} ---`);
      console.log(`ID: ${astrologer._id}`);
      console.log(`Name: ${astrologer.full_name}`);
      console.log(`User Type: ${astrologer.user_type}`);
      console.log(`Account Status: ${astrologer.account_status}`);
      console.log(`Is Verified: ${astrologer.is_verified}`);
      console.log(`Profile Image ID: ${astrologer.profile_image_id}`);
      console.log(`Is Online: ${astrologer.is_online}`);
      console.log(`Created At: ${astrologer.created_at}`);
    });
    
    // Check how many meet each requirement
    const activeCount = await usersCollection.countDocuments({ 
      user_type: 'astrologer', 
      account_status: 'active' 
    });
    
    const verifiedCount = await usersCollection.countDocuments({ 
      user_type: 'astrologer', 
      is_verified: true 
    });
    
    const withImageCount = await usersCollection.countDocuments({ 
      user_type: 'astrologer', 
      profile_image_id: { $exists: true, $ne: null } 
    });
    
    const meetingAllCriteria = await usersCollection.countDocuments({
      user_type: 'astrologer',
      account_status: 'active',
      is_verified: true,
      profile_image_id: { $exists: true, $ne: null }
    });
    
    console.log('\n📋 Requirements analysis:');
    console.log(`✅ Active account status: ${activeCount}/${totalCount}`);
    console.log(`✅ Is verified: ${verifiedCount}/${totalCount}`);
    console.log(`✅ Has profile image: ${withImageCount}/${totalCount}`);
    console.log(`✅ Meeting ALL criteria: ${meetingAllCriteria}/${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkAstrologers().catch(console.error);