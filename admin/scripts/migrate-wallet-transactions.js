/**
 * Migration Script: Merge wallet_transactions into transactions collection
 *
 * This script migrates all documents from wallet_transactions to transactions collection
 * to standardize the database schema. Only run this once!
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

async function migrateWalletTransactions() {
  console.log('🔄 Starting wallet_transactions migration...\n');

  const client = new MongoClient(MONGODB_URL);

  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const walletTransactionsCollection = db.collection('wallet_transactions');
    const transactionsCollection = db.collection('transactions');

    // Check if wallet_transactions collection exists
    const collections = await db.listCollections({ name: 'wallet_transactions' }).toArray();

    if (collections.length === 0) {
      console.log('ℹ️  wallet_transactions collection does not exist');
      console.log('✅ No migration needed - already using transactions collection\n');
      return;
    }

    // Count documents in wallet_transactions
    const walletCount = await walletTransactionsCollection.countDocuments();
    console.log(`📊 Found ${walletCount} documents in wallet_transactions collection`);

    if (walletCount === 0) {
      console.log('ℹ️  wallet_transactions collection is empty');
      console.log('🗑️  Dropping empty wallet_transactions collection...');
      await walletTransactionsCollection.drop();
      console.log('✅ Empty collection dropped\n');
      return;
    }

    // Get all documents from wallet_transactions
    console.log('📥 Fetching documents from wallet_transactions...');
    const walletDocs = await walletTransactionsCollection.find({}).toArray();
    console.log(`✅ Retrieved ${walletDocs.length} documents\n`);

    // Check for duplicates before migrating
    console.log('🔍 Checking for duplicate transactions...');
    let duplicateCount = 0;
    let newCount = 0;

    for (const doc of walletDocs) {
      const exists = await transactionsCollection.findOne({ _id: doc._id });
      if (exists) {
        duplicateCount++;
      } else {
        newCount++;
      }
    }

    console.log(`   Duplicates found: ${duplicateCount}`);
    console.log(`   New transactions: ${newCount}\n`);

    if (newCount === 0) {
      console.log('ℹ️  All transactions already exist in transactions collection');
      console.log('🗑️  Dropping wallet_transactions collection...');
      await walletTransactionsCollection.drop();
      console.log('✅ Collection dropped\n');
      return;
    }

    // Insert only new transactions
    console.log(`📤 Migrating ${newCount} new transactions...`);
    const newDocs = walletDocs.filter(doc => {
      return !transactionsCollection.findOne({ _id: doc._id });
    });

    if (newDocs.length > 0) {
      const result = await transactionsCollection.insertMany(newDocs, { ordered: false });
      console.log(`✅ Inserted ${result.insertedCount} transactions\n`);
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    const finalCount = await transactionsCollection.countDocuments();
    console.log(`   Total transactions in target collection: ${finalCount}\n`);

    // Drop wallet_transactions collection
    console.log('🗑️  Dropping wallet_transactions collection...');
    await walletTransactionsCollection.drop();
    console.log('✅ wallet_transactions collection dropped\n');

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Migrated: ${newCount} transactions`);
    console.log(`   - Duplicates skipped: ${duplicateCount}`);
    console.log(`   - Final total: ${finalCount} transactions`);
    console.log(`   - Source collection: DROPPED ✓\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n⚠️  Your data is safe - no changes were made to wallet_transactions');
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run migration
migrateWalletTransactions().catch(console.error);
