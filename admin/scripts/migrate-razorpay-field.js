require('dotenv').config();
const { MongoClient } = require('mongodb');

async function migrateRazorpayField() {
  const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'trueastrotalkDB');
    const settingsCollection = db.collection('app_settings');
    
    console.log('🔍 Checking current Razorpay field structure...');
    
    // Find the general configuration
    const config = await settingsCollection.findOne({ type: 'general' });
    
    if (!config || !config.razorpay) {
      console.log('❌ No general configuration or razorpay section found');
      process.exit(1);
    }
    
    console.log('📋 Current Razorpay fields:', Object.keys(config.razorpay));
    
    // Check what we have and what we need to migrate
    const hasOldField = config.razorpay.encryptedKeySecret;
    const hasNewField = config.razorpay.keySecret;
    
    console.log('🔍 Migration status:');
    console.log('   - Has encryptedKeySecret:', !!hasOldField);
    console.log('   - Has keySecret:', !!hasNewField);
    
    if (hasOldField && !hasNewField) {
      console.log('🔄 Migrating encryptedKeySecret → keySecret...');
      
      const result = await settingsCollection.updateOne(
        { type: 'general' },
        {
          $set: {
            'razorpay.keySecret': config.razorpay.encryptedKeySecret,
            'updated_at': new Date()
          },
          $unset: {
            'razorpay.encryptedKeySecret': ''
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Field migration completed successfully');
        console.log('   - Old field "encryptedKeySecret" removed');
        console.log('   - New field "keySecret" added with same value');
      } else {
        console.log('❌ Migration failed - no documents were modified');
        process.exit(1);
      }
      
    } else if (hasNewField && !hasOldField) {
      console.log('✅ Migration already completed - using keySecret field');
      
    } else if (hasOldField && hasNewField) {
      console.log('⚠️  Both fields exist! Removing old field...');
      
      const result = await settingsCollection.updateOne(
        { type: 'general' },
        {
          $unset: {
            'razorpay.encryptedKeySecret': ''
          },
          $set: {
            'updated_at': new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Cleanup completed - removed duplicate encryptedKeySecret field');
      }
      
    } else {
      console.log('❌ No Razorpay secret field found at all!');
      process.exit(1);
    }
    
    // Verify the final state
    const updatedConfig = await settingsCollection.findOne({ type: 'general' });
    console.log('🎯 Final Razorpay configuration:');
    console.log('   - keyId:', updatedConfig.razorpay.keyId ? 'Present' : 'Missing');
    console.log('   - keySecret:', updatedConfig.razorpay.keySecret ? 'Present' : 'Missing');
    console.log('   - environment:', updatedConfig.razorpay.environment);
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

console.log('🚀 Starting Razorpay field migration...');
migrateRazorpayField();