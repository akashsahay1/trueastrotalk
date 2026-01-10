/**
 * One-time migration script to add reference_id and transaction_id to existing transactions
 * Run with: node scripts/migrate-transactions.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    console.error('❌ MONGODB_URI or MONGODB_URL not found in environment variables');
    process.exit(1);
  }

  if (!dbName) {
    console.error('❌ DB_NAME not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const transactionsCollection = db.collection('transactions');

    // Find all transactions without reference_id
    const transactionsWithoutRef = await transactionsCollection.find({
      $or: [
        { reference_id: { $exists: false } },
        { reference_id: null },
        { reference_id: '' }
      ]
    }).toArray();

    console.log(`📊 Found ${transactionsWithoutRef.length} transactions without reference_id`);

    if (transactionsWithoutRef.length === 0) {
      console.log('✅ No transactions need migration');
      return;
    }

    let updatedCount = 0;

    for (const transaction of transactionsWithoutRef) {
      // Generate reference_id based on transaction type
      let prefix = 'TXN';
      if (transaction.transaction_type === 'credit') {
        if (transaction.type === 'recharge' || transaction.description?.toLowerCase().includes('recharge')) {
          prefix = 'RCH';
        } else {
          prefix = 'ERN'; // Earnings
        }
      } else if (transaction.transaction_type === 'debit') {
        prefix = 'PAY'; // Payment
      } else if (transaction.transaction_type === 'withdrawal') {
        prefix = 'WD'; // Withdrawal
      } else if (transaction.transaction_type === 'commission') {
        prefix = 'COM'; // Commission
      }

      // Use created_at timestamp if available, otherwise use current time
      let timestamp;
      if (transaction.created_at) {
        timestamp = new Date(transaction.created_at).getTime();
      } else {
        timestamp = Date.now();
      }

      const referenceId = `${prefix}${timestamp}`;
      const transactionId = transaction.transaction_id || `txn_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;

      await transactionsCollection.updateOne(
        { _id: transaction._id },
        {
          $set: {
            reference_id: referenceId,
            transaction_id: transactionId
          }
        }
      );

      updatedCount++;

      if (updatedCount % 100 === 0) {
        console.log(`   Updated ${updatedCount}/${transactionsWithoutRef.length} transactions...`);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} transactions with reference_id`);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('📡 Disconnected from MongoDB');
  }
}

migrate();
