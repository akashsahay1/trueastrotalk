/**
 * Test Razorpay API Credentials
 * This script tests if the Razorpay credentials are valid by making actual API calls
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

async function testRazorpayCredentials() {
  console.log('🧪 Testing Razorpay API Credentials...\n');

  const client = new MongoClient(MONGODB_URL);

  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const settingsCollection = db.collection('app_settings');

    // Get Razorpay credentials from database
    const config = await settingsCollection.findOne({ type: 'general' });

    if (!config || !config.razorpay || !config.razorpay.keyId || !config.razorpay.keySecret) {
      console.error('❌ Razorpay credentials not found in database');
      console.log('   Please run: node scripts/sync-razorpay-credentials.js\n');
      process.exit(1);
    }

    const RAZORPAY_KEY_ID = config.razorpay.keyId;
    const RAZORPAY_KEY_SECRET = config.razorpay.keySecret;
    const environment = config.razorpay.environment;

    console.log('📋 Testing with credentials:');
    console.log(`   Key ID: ${RAZORPAY_KEY_ID}`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Key Secret: ${RAZORPAY_KEY_SECRET.substring(0, 4)}${'*'.repeat(RAZORPAY_KEY_SECRET.length - 4)}\n`);

    // Test 1: Create a basic authorization header
    const authString = `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    console.log('🔐 Authorization header created\n');

    // Test 2: Try to fetch account details (simple API call)
    console.log('📡 Test 1: Fetching Razorpay account details...');
    try {
      const response = await fetch('https://api.razorpay.com/v1/payments?count=1', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Authentication successful!');
        console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
      } else {
        const errorData = await response.json();
        console.log('   ❌ Authentication failed!');
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}\n`);
    }

    // Test 3: Try to create a test order
    console.log('📡 Test 2: Creating a test Razorpay order...');
    const orderData = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: 'Credential test'
      }
    };

    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${base64Auth}`
        },
        body: JSON.stringify(orderData)
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const order = await response.json();
        console.log('   ✅ Order created successfully!');
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Amount: ₹${order.amount / 100}`);
        console.log(`   Status: ${order.status}\n`);

        console.log('🎉 All tests passed! Your Razorpay credentials are valid.\n');
        console.log('💡 The payment issue in your app might be due to:');
        console.log('   1. Network connectivity issues');
        console.log('   2. App configuration issues');
        console.log('   3. Certificate/SSL issues on mobile device\n');
      } else {
        const errorData = await response.json();
        console.log('   ❌ Order creation failed!');
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}\n`);

        if (response.status === 401) {
          console.log('❌ AUTHENTICATION FAILED');
          console.log('   Your Razorpay credentials are INVALID or EXPIRED.\n');
          console.log('🔧 To fix this:');
          console.log('   1. Log into Razorpay Dashboard: https://dashboard.razorpay.com/');
          console.log('   2. Go to Settings → API Keys');
          console.log('   3. Generate new Test/Live keys');
          console.log('   4. Update your .env file with new credentials');
          console.log('   5. Run: node scripts/sync-razorpay-credentials.js\n');
        } else if (response.status === 400) {
          console.log('⚠️  BAD REQUEST');
          console.log('   The credentials might be valid but the request format is incorrect.\n');
        }
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the test
testRazorpayCredentials().catch(console.error);
