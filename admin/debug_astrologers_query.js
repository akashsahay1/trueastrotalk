const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

async function debugAstrologersQuery() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    console.log('=== DEBUGGING ASTROLOGERS QUERY ===\n');
    
    // 1. Check total astrologers
    const totalAstrologers = await usersCollection.countDocuments({
      user_type: 'astrologer'
    });
    console.log(`1. Total astrologers in database: ${totalAstrologers}`);
    
    // 2. Check astrologers by account_status
    const activeAstrologers = await usersCollection.countDocuments({
      user_type: 'astrologer',
      account_status: 'active'
    });
    console.log(`2. Active astrologers: ${activeAstrologers}`);
    
    // 3. Check verified astrologers
    const verifiedAstrologers = await usersCollection.countDocuments({
      user_type: 'astrologer',
      account_status: 'active',
      is_verified: true
    });
    console.log(`3. Active + verified astrologers: ${verifiedAstrologers}`);
    
    // 4. Check astrologers with profile images
    const withProfileImages = await usersCollection.countDocuments({
      user_type: 'astrologer',
      account_status: 'active',
      is_verified: true,
      $or: [
        { profile_image_id: { $exists: true, $ne: null } },
        { profile_image: { $exists: true, $ne: null, $nin: [''] } },
        { profile_picture: { $exists: true, $ne: null, $nin: [''] } }
      ]
    });
    console.log(`4. Active + verified + with profile images: ${withProfileImages}`);
    
    // 5. Let's see what actual astrologers we have and their status
    console.log('\n=== ASTROLOGER DETAILS ===');
    const astrologers = await usersCollection.find({ user_type: 'astrologer' })
      .limit(10)
      .toArray();
    
    astrologers.forEach((astrologer, index) => {
      console.log(`\nAstrologer ${index + 1}:`);
      console.log(`  Name: ${astrologer.full_name || 'No name'}`);
      console.log(`  Email: ${astrologer.email_address || 'No email'}`);
      console.log(`  User Type: ${astrologer.user_type}`);
      console.log(`  Account Status: ${astrologer.account_status || 'Not set'}`);
      console.log(`  Is Verified: ${astrologer.is_verified || false}`);
      console.log(`  Is Online: ${astrologer.is_online || false}`);
      console.log(`  Profile Image ID: ${astrologer.profile_image_id || 'None'}`);
      console.log(`  Profile Image: ${astrologer.profile_image || 'None'}`);
      console.log(`  Profile Picture: ${astrologer.profile_picture || 'None'}`);
      console.log(`  Skills: ${astrologer.skills && Array.isArray(astrologer.skills) ? astrologer.skills.join(', ') : 'None'}`);
      console.log(`  Languages: ${astrologer.languages && Array.isArray(astrologer.languages) ? astrologer.languages.join(', ') : 'None'}`);
    });
    
    // 6. Check what's missing
    console.log('\n=== WHAT\'S MISSING? ===');
    
    // Astrologers without active status
    const nonActiveAstrologers = await usersCollection.find({
      user_type: 'astrologer',
      account_status: { $ne: 'active' }
    }).toArray();
    
    if (nonActiveAstrologers.length > 0) {
      console.log(`\nNon-active astrologers (${nonActiveAstrologers.length}):`);
      nonActiveAstrologers.forEach((astrologer, index) => {
        console.log(`  ${index + 1}. ${astrologer.full_name || astrologer.email_address} - Status: ${astrologer.account_status || 'undefined'}`);
      });
    }
    
    // Astrologers without verification
    const unverifiedAstrologers = await usersCollection.find({
      user_type: 'astrologer',
      account_status: 'active',
      is_verified: { $ne: true }
    }).toArray();
    
    if (unverifiedAstrologers.length > 0) {
      console.log(`\nUnverified astrologers (${unverifiedAstrologers.length}):`);
      unverifiedAstrologers.forEach((astrologer, index) => {
        console.log(`  ${index + 1}. ${astrologer.full_name || astrologer.email_address} - Verified: ${astrologer.is_verified || 'undefined'}`);
      });
    }
    
    // Astrologers without profile images
    const withoutImages = await usersCollection.find({
      user_type: 'astrologer',
      account_status: 'active',
      is_verified: true,
      $and: [
        { profile_image_id: { $exists: false } },
        { profile_image: { $exists: false } },
        { profile_picture: { $exists: false } }
      ]
    }).toArray();
    
    if (withoutImages.length > 0) {
      console.log(`\nAstrologers without profile images (${withoutImages.length}):`);
      withoutImages.forEach((astrologer, index) => {
        console.log(`  ${index + 1}. ${astrologer.full_name || astrologer.email_address}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugAstrologersQuery();