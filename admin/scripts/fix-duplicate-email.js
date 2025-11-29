// Script to fix duplicate email records caused by Gmail dot aliases
// Usage: node scripts/fix-duplicate-email.js

const { MongoClient } = require('mongodb');

const MONGODB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixDuplicateEmails() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Find the orphan OTP record (no user_type, has temp phone)
    const orphanRecord = await usersCollection.findOne({
      email_address: 'akashsahay1243@gmail.com'
    });

    if (!orphanRecord) {
      console.log('❌ No orphan record found for akashsahay1243@gmail.com');
      return;
    }

    console.log('\n🔍 Found orphan OTP record:');
    console.log(`   _id: ${orphanRecord._id}`);
    console.log(`   email: ${orphanRecord.email_address}`);
    console.log(`   user_type: ${orphanRecord.user_type}`);
    console.log(`   phone: ${orphanRecord.phone_number}`);

    // Find the actual astrologer record
    const astrologerRecord = await usersCollection.findOne({
      email_address: 'akash.sahay1243@gmail.com'
    });

    if (!astrologerRecord) {
      console.log('❌ No astrologer record found for akash.sahay1243@gmail.com');
      return;
    }

    console.log('\n🔍 Found actual astrologer record:');
    console.log(`   _id: ${astrologerRecord._id}`);
    console.log(`   email: ${astrologerRecord.email_address}`);
    console.log(`   user_type: ${astrologerRecord.user_type}`);
    console.log(`   full_name: ${astrologerRecord.full_name}`);

    // Option 1: Delete the orphan record
    console.log('\n🗑️ Deleting orphan OTP record...');
    const deleteResult = await usersCollection.deleteOne({
      _id: orphanRecord._id
    });
    console.log(`   Deleted: ${deleteResult.deletedCount} record(s)`);

    // Option 2: Update astrologer record to also include the dot-less email variant
    // This ensures future logins with either email variant will work
    console.log('\n📝 Adding email alias to astrologer record...');
    const updateResult = await usersCollection.updateOne(
      { _id: astrologerRecord._id },
      {
        $addToSet: {
          email_aliases: 'akashsahay1243@gmail.com'
        }
      }
    );
    console.log(`   Updated: ${updateResult.modifiedCount} record(s)`);

    console.log('\n✅ Fix completed successfully!');
    console.log('\nThe user should now log in using: akash.sahay1243@gmail.com');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

fixDuplicateEmails();
