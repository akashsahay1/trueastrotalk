require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function cleanupVerificationFields() {
  console.log('🧹 Cleaning up verification fields in database...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Check current state
    console.log('\n🔍 Current verification field status:');
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithIsVerified = await usersCollection.countDocuments({ is_verified: { $exists: true } });
    const usersWithVerificationStatus = await usersCollection.countDocuments({ verification_status: { $exists: true } });
    
    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`📊 Users with is_verified field: ${usersWithIsVerified}`);
    console.log(`📊 Users with verification_status field: ${usersWithVerificationStatus}`);
    
    // Get sample to see current structure
    const sampleUsers = await usersCollection.find({
      user_type: 'astrologer'
    }).limit(2).toArray();
    
    console.log('\n📋 Sample user verification fields:');
    sampleUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  - is_verified: ${user.is_verified}`);
      console.log(`  - verification_status: ${user.verification_status}`);
    });
    
    // Update strategy:
    // 1. For astrologers: set verification_status to 'verified' (since they should be active)
    // 2. For customers: set verification_status to 'verified' (since they can register freely)
    // 3. Remove is_verified field from all users
    
    console.log('\n🔧 Updating astrologers to use verification_status...');
    const astrologerUpdate = await usersCollection.updateMany(
      { user_type: 'astrologer' },
      {
        $set: { verification_status: 'verified' },
        $unset: { is_verified: '' }
      }
    );
    console.log(`✅ Updated ${astrologerUpdate.modifiedCount} astrologers`);
    
    console.log('\n🔧 Updating customers to use verification_status...');
    const customerUpdate = await usersCollection.updateMany(
      { user_type: 'customer' },
      {
        $set: { verification_status: 'verified' },
        $unset: { is_verified: '' }
      }
    );
    console.log(`✅ Updated ${customerUpdate.modifiedCount} customers`);
    
    console.log('\n🔧 Updating any remaining users...');
    const otherUpdate = await usersCollection.updateMany(
      { 
        user_type: { $nin: ['astrologer', 'customer'] },
        verification_status: { $exists: false }
      },
      {
        $set: { verification_status: 'verified' },
        $unset: { is_verified: '' }
      }
    );
    console.log(`✅ Updated ${otherUpdate.modifiedCount} other users`);
    
    // Verify the changes
    console.log('\n✅ Verification complete! New status:');
    const finalUsersWithIsVerified = await usersCollection.countDocuments({ is_verified: { $exists: true } });
    const finalUsersWithVerificationStatus = await usersCollection.countDocuments({ verification_status: { $exists: true } });
    const verifiedUsers = await usersCollection.countDocuments({ verification_status: 'verified' });
    
    console.log(`📊 Users with is_verified field: ${finalUsersWithIsVerified} (should be 0)`);
    console.log(`📊 Users with verification_status field: ${finalUsersWithVerificationStatus}`);
    console.log(`📊 Users with verification_status 'verified': ${verifiedUsers}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

cleanupVerificationFields().catch(console.error);