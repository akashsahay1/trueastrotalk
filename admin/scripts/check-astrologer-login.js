require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkAstrologerLogin() {
  console.log('🔍 Checking astrologer login credentials...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Check for the astrologer account
    const email = 'astro1@trueastrotalk.com';
    const testPassword = 'astrologer123';
    
    const user = await usersCollection.findOne({ 
      email_address: email,
      user_type: 'astrologer'
    });
    
    if (!user) {
      console.log('❌ Astrologer account not found!');
      console.log(`   Email: ${email}`);
      
      // Show available astrologer emails
      const astrologers = await usersCollection.find({ 
        user_type: 'astrologer' 
      }).project({ email_address: 1, full_name: 1 }).limit(5).toArray();
      
      console.log('\n📋 Available astrologer accounts:');
      astrologers.forEach((astro, index) => {
        console.log(`  ${index + 1}. ${astro.full_name} - ${astro.email_address}`);
      });
      
      return;
    }
    
    console.log('✅ Astrologer account found!');
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Email: ${user.email_address}`);
    console.log(`   Account Status: ${user.account_status}`);
    console.log(`   Verification Status: ${user.verification_status}`);
    console.log(`   User Type: ${user.user_type}`);
    
    // Check password
    const isValidPassword = await bcrypt.compare(testPassword, user.password);
    console.log(`   Password Check: ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValidPassword) {
      console.log('\n🔧 Updating password to "astrologer123"...');
      const hashedPassword = await bcrypt.hash('astrologer123', 10);
      
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, updated_at: new Date() } }
      );
      
      console.log('✅ Password updated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkAstrologerLogin().catch(console.error);