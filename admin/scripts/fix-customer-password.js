require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixCustomerPassword() {
  console.log('🔧 Setting password for customer account...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    const customer = await usersCollection.findOne({ 
      email_address: 'akash@denaurlen.com'
    });
    
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }
    
    console.log('👤 Found customer:', customer.full_name);
    console.log('🔐 Current password set:', customer.password ? 'YES' : 'NO');
    
    // Set password to 'customer123'
    const hashedPassword = await bcrypt.hash('customer123', 10);
    
    await usersCollection.updateOne(
      { _id: customer._id },
      { 
        $set: { 
          password: hashedPassword,
          updated_at: new Date()
        }
      }
    );
    
    console.log('✅ Password updated successfully!');
    console.log('📧 Email: akash@denaurlen.com');
    console.log('🔐 Password: customer123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

fixCustomerPassword().catch(console.error);