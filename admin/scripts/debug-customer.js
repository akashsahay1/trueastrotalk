require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function debugCustomer() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    const customer = await usersCollection.findOne({ 
      email_address: 'akash@denaurlen.com'
    });
    
    console.log('🔍 Customer record:');
    console.log('Name:', customer.full_name);
    console.log('Email:', customer.email_address);
    console.log('User Type:', customer.user_type);
    console.log('Auth Type:', customer.auth_type);
    console.log('Password field exists:', !!customer.password);
    console.log('Password length:', customer.password ? customer.password.length : 'N/A');
    
    // Test password hash
    if (customer.password) {
      const isValid = await bcrypt.compare('customer123', customer.password);
      console.log('Password "customer123" valid:', isValid);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugCustomer().catch(console.error);