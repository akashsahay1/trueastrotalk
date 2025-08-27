require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixCustomerAuthType() {
  console.log('🔧 Changing customer auth_type to email...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { email_address: 'akash@denaurlen.com' },
      { 
        $set: { 
          auth_type: 'email',
          updated_at: new Date()
        }
      }
    );
    
    console.log('✅ Updated auth_type to email');
    console.log('📧 Customer can now login with email/password');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixCustomerAuthType().catch(console.error);