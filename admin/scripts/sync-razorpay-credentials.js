/**
 * Sync Razorpay credentials from .env to database
 * Run this script to update app_settings with Razorpay credentials
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

async function syncRazorpayCredentials() {
  console.log('🔧 Starting Razorpay credentials sync...\n');

  // Validate environment variables
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error('❌ Error: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env file');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   MongoDB URL: ${MONGODB_URL}`);
  console.log(`   Database: ${DB_NAME}`);
  console.log(`   Razorpay Key ID: ${RAZORPAY_KEY_ID}`);
  console.log(`   Razorpay Environment: ${RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'test' : 'live'}\n`);

  const client = new MongoClient(MONGODB_URL);

  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const settingsCollection = db.collection('app_settings');

    // Check if configuration exists
    const existingConfig = await settingsCollection.findOne({ type: 'general' });

    if (existingConfig) {
      console.log('📝 Existing configuration found');
      console.log(`   Current Key ID: ${existingConfig.razorpay?.keyId || 'Not set'}`);
      console.log(`   Current Environment: ${existingConfig.razorpay?.environment || 'Not set'}\n`);
    } else {
      console.log('📝 No existing configuration found. Creating new one...\n');
    }

    // Determine environment from key ID
    const environment = RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'test' : 'live';

    // Update or insert configuration
    const configData = {
      type: 'general',
      razorpay: {
        keyId: RAZORPAY_KEY_ID,
        keySecret: RAZORPAY_KEY_SECRET,
        environment: environment
      },
      app: existingConfig?.app || {
        name: 'True Astrotalk',
        version: '1.0.0',
        minSupportedVersion: '1.0.0'
      },
      commission: existingConfig?.commission || {
        defaultRate: 25,
        gstRate: 18,
        minimumPayout: 1000
      },
      updated_at: new Date().toISOString()
    };

    // Add created_at only if it's a new document
    if (!existingConfig) {
      configData.created_at = new Date().toISOString();
    }

    console.log('💾 Updating database configuration...');
    const result = await settingsCollection.updateOne(
      { type: 'general' },
      {
        $set: configData,
        $setOnInsert: { created_at: new Date().toISOString() }
      },
      { upsert: true }
    );

    console.log('✅ Database updated successfully!\n');
    console.log('📊 Update result:');
    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}`);
    console.log(`   Upserted: ${result.upsertedCount}\n`);

    // Verify the update
    const updatedConfig = await settingsCollection.findOne({ type: 'general' });
    console.log('🔍 Verification:');
    console.log(`   Razorpay Key ID: ${updatedConfig.razorpay.keyId}`);
    console.log(`   Razorpay Environment: ${updatedConfig.razorpay.environment}`);
    console.log(`   Key Secret set: ${updatedConfig.razorpay.keySecret ? 'Yes' : 'No'}\n`);

    console.log('✨ Razorpay credentials synced successfully!');
    console.log('🚀 You can now test the add money functionality in your app.\n');

  } catch (error) {
    console.error('❌ Error syncing Razorpay credentials:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the sync
syncRazorpayCredentials().catch(console.error);
