// Script to check user data in MongoDB
// Usage: node scripts/check-user.js <email>
// Usage: node scripts/check-user.js --list-astrologers

const { MongoClient } = require('mongodb');

const MONGODB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkUser(email) {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({
      email_address: email.toLowerCase()
    });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }

    console.log('\n🔍 User found in database:');
    console.log('─'.repeat(50));
    console.log(`   _id:                 ${user._id}`);
    console.log(`   user_id:             ${user.user_id}`);
    console.log(`   full_name:           ${user.full_name}`);
    console.log(`   email_address:       ${user.email_address}`);
    console.log(`   phone_number:        ${user.phone_number}`);
    console.log('─'.repeat(50));
    console.log(`   user_type:           ${user.user_type}`);
    console.log(`   role:                ${user.role}`);
    console.log('─'.repeat(50));
    console.log(`   account_status:      ${user.account_status}`);
    console.log(`   verification_status: ${user.verification_status}`);
    console.log(`   email_verified:      ${user.email_verified}`);
    console.log(`   phone_verified:      ${user.phone_verified}`);
    console.log('─'.repeat(50));
    console.log(`   auth_type:           ${user.auth_type}`);
    console.log(`   created_at:          ${user.created_at}`);
    console.log(`   updated_at:          ${user.updated_at}`);
    console.log('─'.repeat(50));

    // Check for any fields that might indicate role
    const allKeys = Object.keys(user);
    const roleRelatedKeys = allKeys.filter(k =>
      k.includes('type') || k.includes('role') || k.includes('user')
    );
    console.log('\n📋 All fields with "type", "role", or "user" in name:');
    roleRelatedKeys.forEach(key => {
      console.log(`   ${key}: ${user[key]}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

async function listAstrologers() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Find all astrologers
    const astrologers = await usersCollection.find({
      $or: [
        { user_type: 'astrologer' },
        { role: 'astrologer' }
      ]
    }).toArray();

    console.log(`\n🔍 Found ${astrologers.length} astrologers:\n`);

    astrologers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'N/A'}`);
      console.log(`   Email: ${user.email_address}`);
      console.log(`   Phone: ${user.phone_number}`);
      console.log(`   user_type: ${user.user_type}, role: ${user.role}`);
      console.log(`   Status: ${user.account_status} / ${user.verification_status}`);
      console.log('');
    });

    // Also show all users count
    const totalUsers = await usersCollection.countDocuments();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

    // Show breakdown by user_type
    const breakdown = await usersCollection.aggregate([
      { $group: { _id: '$user_type', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\n📊 Users by user_type:');
    breakdown.forEach(b => {
      console.log(`   ${b._id || 'undefined'}: ${b.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

// Get command from args
const arg = process.argv[2];

if (arg === '--list-astrologers' || arg === '-l') {
  listAstrologers();
} else {
  const email = arg || 'akashsahay1243@gmail.com';
  console.log(`\n🔎 Checking user: ${email}\n`);
  checkUser(email);
}
