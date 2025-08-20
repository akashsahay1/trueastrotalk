const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

async function verifyAstrologers() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    console.log('=== VERIFYING ASTROLOGERS ===\n');
    
    // Get active astrologers with profile images
    const astrologersToVerify = await usersCollection.find({
      user_type: 'astrologer',
      account_status: 'active',
      $or: [
        { profile_image: { $exists: true, $ne: null, $nin: [''] } },
        { profile_picture: { $exists: true, $ne: null, $nin: [''] } }
      ]
    }).limit(10).toArray(); // Verify first 10 astrologers
    
    console.log(`Found ${astrologersToVerify.length} astrologers to verify:`);
    
    for (const astrologer of astrologersToVerify) {
      console.log(`- ${astrologer.full_name} (${astrologer.email_address})`);
    }
    
    // Update them to verified status
    const result = await usersCollection.updateMany(
      {
        _id: { $in: astrologersToVerify.map(a => a._id) }
      },
      {
        $set: {
          is_verified: true,
          verification_status: 'approved',
          updated_at: new Date()
        }
      }
    );
    
    console.log(`\n✅ Successfully verified ${result.modifiedCount} astrologers!`);
    
    // Also set some as online for testing
    const onlineResult = await usersCollection.updateMany(
      {
        _id: { $in: astrologersToVerify.slice(0, 5).map(a => a._id) }
      },
      {
        $set: {
          is_online: true,
          updated_at: new Date()
        }
      }
    );
    
    console.log(`🌐 Set ${onlineResult.modifiedCount} astrologers as online!`);
    
    // Verify the changes
    const verifiedCount = await usersCollection.countDocuments({
      user_type: 'astrologer',
      account_status: 'active',
      is_verified: true
    });
    
    console.log(`\n📊 Total verified astrologers now: ${verifiedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyAstrologers();