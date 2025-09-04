// Cleanup script to remove test data from collections
// Run with: node scripts/cleanup-test-data.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalk';

async function cleanupTestData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🧹 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    // Collections to clean up
    const collectionsToClean = [
      'payment_orders',  // Remove this entire collection - it's redundant
      'orders',          // Remove test product orders
      'transactions',    // Remove test transactions
      'wallet_transactions' // Remove if it exists - also redundant
    ];
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`🗑️  Clearing ${count} documents from ${collectionName}...`);
          await collection.deleteMany({});
          console.log(`✅ Cleared ${collectionName} collection`);
        } else {
          console.log(`ℹ️  Collection ${collectionName} is already empty`);
        }
      } catch (error) {
        console.log(`ℹ️  Collection ${collectionName} doesn't exist - skipping`);
      }
    }
    
    // Optional: Drop the payment_orders collection entirely since we're not using it anymore
    try {
      await db.collection('payment_orders').drop();
      console.log('🗑️  Dropped payment_orders collection entirely');
    } catch (error) {
      console.log('ℹ️  payment_orders collection doesn\'t exist or already dropped');
    }
    
    // Optional: Drop wallet_transactions collection if it exists
    try {
      await db.collection('wallet_transactions').drop();
      console.log('🗑️  Dropped wallet_transactions collection entirely');
    } catch (error) {
      console.log('ℹ️  wallet_transactions collection doesn\'t exist or already dropped');
    }
    
    console.log('🎉 Cleanup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('  ✅ payment_orders - REMOVED (redundant)');
    console.log('  ✅ wallet_transactions - REMOVED (redundant)');  
    console.log('  ✅ orders - CLEARED (fresh start)');
    console.log('  ✅ transactions - CLEARED (fresh start)');
    console.log('');
    console.log('🏗️  New Architecture:');
    console.log('  📊 transactions - ALL financial transactions (wallet, orders, consultations)');
    console.log('  📦 orders - Product fulfillment only');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run cleanup
cleanupTestData().catch(console.error);