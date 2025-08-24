require('dotenv').config();
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// Encryption function to match the EncryptionSecurity class
function encrypt(text, password) {
  const algorithm = 'aes-256-cbc';
  const keyLength = 32;
  
  // Generate salt and key (matching EncryptionSecurity implementation)
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt.toString('hex'), 10000, keyLength, 'sha256');
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return salt:encrypted format (including IV in encrypted part for compatibility)
  return salt.toString('hex') + ':' + iv.toString('hex') + encrypted;
}

async function setupRazorpayConfig() {
  const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'trueastrotalkDB');
    const settingsCollection = db.collection('app_settings');
    
    // Get credentials from environment
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD;
    
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !ENCRYPTION_PASSWORD) {
      console.error('❌ Missing required environment variables:');
      console.error('   RAZORPAY_KEY_ID:', !!RAZORPAY_KEY_ID);
      console.error('   RAZORPAY_KEY_SECRET:', !!RAZORPAY_KEY_SECRET);
      console.error('   ENCRYPTION_PASSWORD:', !!ENCRYPTION_PASSWORD);
      process.exit(1);
    }
    
    console.log('🔐 Encrypting Razorpay credentials...');
    
    // Encrypt the secret key
    const encryptedSecret = encrypt(RAZORPAY_KEY_SECRET, ENCRYPTION_PASSWORD);
    
    // Create payment gateway config
    const paymentConfig = {
      type: 'payment_gateway',
      razorpay: {
        keyId: RAZORPAY_KEY_ID,
        encryptedKeySecret: encryptedSecret,
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
    
  } catch (error) {
    console.error('❌ Error setting up Razorpay configuration:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupRazorpayConfig();