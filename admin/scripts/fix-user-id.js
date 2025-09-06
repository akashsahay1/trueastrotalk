const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixUserId() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('📦 Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find user by email
    const email = 'akash@denaurlen.com';
    const user = await usersCollection.findOne({ email_address: email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }
    
    console.log(`✅ Found user: ${user.full_name}`);
    console.log(`   Current user_id: ${user.user_id}`);
    console.log(`   MongoDB _id: ${user._id}`);
    
    // If user doesn't have user_id, update it
    if (!user.user_id) {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            user_id: newUserId,
            updated_at: new Date()
          } 
        }
      );
      
      console.log(`✅ Updated user_id to: ${newUserId}`);
    } else {
      console.log(`ℹ️ User already has user_id: ${user.user_id}`);
    }
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ email_address: email });
    console.log(`\n📊 Final user_id: ${updatedUser.user_id}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixUserId();