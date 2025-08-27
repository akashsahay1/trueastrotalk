require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkCustomerAccounts() {
  console.log('🔍 Checking customer accounts...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Check for customer accounts
    const customers = await usersCollection.find({ 
      user_type: 'customer'
    }).limit(5).toArray();
    
    console.log(`📊 Found ${customers.length} customer accounts:`);
    
    customers.forEach((customer, index) => {
      console.log(`\n--- Customer ${index + 1} ---`);
      console.log(`Name: ${customer.full_name}`);
      console.log(`Email: ${customer.email_address}`);
      console.log(`Account Status: ${customer.account_status}`);
      console.log(`Verification Status: ${customer.verification_status}`);
    });
    
    if (customers.length === 0) {
      console.log('\n⚠️ No customer accounts found! Creating a test customer...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('customer123', 10);
      
      const testCustomer = {
        full_name: 'Test Customer',
        email_address: 'customer@trueastrotalk.com',
        phone_number: '+91 9999999999',
        user_type: 'customer',
        password: hashedPassword,
        account_status: 'active',
        verification_status: 'verified',
        auth_type: 'email',
        wallet_balance: 1000, // Give some balance for testing
        is_online: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await usersCollection.insertOne(testCustomer);
      console.log(`✅ Created test customer: ${result.insertedId}`);
      console.log(`📧 Email: customer@trueastrotalk.com`);
      console.log(`🔐 Password: customer123`);
      console.log(`💰 Wallet Balance: ₹1000`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkCustomerAccounts().catch(console.error);