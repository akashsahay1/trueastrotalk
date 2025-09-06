const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixTransactionUserIds() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const transactionsCollection = db.collection('transactions');
    const usersCollection = db.collection('users');
    
    // Find transactions with MongoDB ObjectId as user_id
    const problematicTransactions = await transactionsCollection.find({
      user_id: { $regex: /^[a-f\d]{24}$/i }, // MongoDB ObjectId pattern
      purpose: 'product_purchase',
      status: 'pending'
    }).toArray();
    
    console.log(`Found ${problematicTransactions.length} transactions with ObjectId user_id`);
    
    let fixedCount = 0;
    
    for (const transaction of problematicTransactions) {
      console.log(`\n🔍 Fixing transaction ${transaction._id}:`);
      console.log(`  - Current user_id: ${transaction.user_id}`);
      console.log(`  - Amount: ${transaction.amount}`);
      console.log(`  - Razorpay Order ID: ${transaction.razorpay_order_id}`);
      
      // Find the user by MongoDB ObjectId
      try {
        const user = await usersCollection.findOne({ _id: new ObjectId(transaction.user_id) });
        
        if (user && user.user_id) {
          console.log(`  ✅ Found user: ${user.full_name} (${user.user_id})`);
          
          // Update transaction with correct user_id
          await transactionsCollection.updateOne(
            { _id: transaction._id },
            { $set: { user_id: user.user_id } }
          );
          
          console.log(`  🔧 Updated transaction user_id to: ${user.user_id}`);
          fixedCount++;
        } else {
          console.log(`  ❌ No user found with ObjectId: ${transaction.user_id}`);
        }
      } catch (error) {
        console.log(`  ⚠️ Error processing transaction: ${error.message}`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Fixed ${fixedCount} transactions`);
    
    // Now check if any orders can be matched with the fixed transactions
    console.log(`\n🔄 Checking if any orders can now be processed...`);
    const fixedTransactions = await transactionsCollection.find({
      purpose: 'product_purchase',
      status: 'pending'
    }).toArray();
    
    for (const transaction of fixedTransactions) {
      // Try to find matching order
      const ordersCollection = db.collection('orders');
      const matchingOrder = await ordersCollection.findOne({
        user_id: transaction.user_id,
        total_amount: transaction.amount,
        payment_status: 'pending'
      });
      
      if (matchingOrder) {
        console.log(`  🎯 Found matching order: ${matchingOrder.order_number} for transaction ${transaction.razorpay_order_id}`);
      }
    }
    
  } catch (error) {
    console.error('Error fixing transaction user IDs:', error);
  } finally {
    await client.close();
    console.log('\n🔐 Database connection closed');
  }
}

// Run the script
fixTransactionUserIds();