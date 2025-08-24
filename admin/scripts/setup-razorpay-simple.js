require('dotenv').config();
const { MongoClient } = require('mongodb');

async function setupRazorpayConfig() {
  const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'trueastrotalkDB');
    const settingsCollection = db.collection('app_settings');
    
    // Get credentials from environment
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('❌ Missing required environment variables:');
      console.error('   RAZORPAY_KEY_ID:', !!RAZORPAY_KEY_ID);
      console.error('   RAZORPAY_KEY_SECRET:', !!RAZORPAY_KEY_SECRET);
      process.exit(1);
    }
    
    console.log('💾 Setting up Razorpay configuration in database...');
    
    // Create payment gateway config (temporarily without encryption)
    const paymentConfig = {
      type: 'payment_gateway',
      razorpay: {
        keyId: RAZORPAY_KEY_ID,
        // Store as plain text temporarily - we'll fix encryption later
        encryptedKeySecret: RAZORPAY_KEY_SECRET,
        environment: process.env.NODE_ENV === 'production' ? 'live' : 'test'
      },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Upsert the configuration
    const result = await settingsCollection.replaceOne(
      { type: 'payment_gateway' },
      paymentConfig,
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      console.log('✅ Razorpay configuration created successfully');
    } else if (result.modifiedCount > 0) {
      console.log('✅ Razorpay configuration updated successfully');
    } else {
      console.log('ℹ️  Razorpay configuration already exists and is identical');
    }
    
    console.log('🎯 Payment service should now work correctly');
    console.log('⚠️  Note: Secret is stored as plain text temporarily. Fix encryption later.');
    
  } catch (error) {
    console.error('❌ Error setting up Razorpay configuration:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupRazorpayConfig();