const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixExistingOrders() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');
    const transactionsCollection = db.collection('transactions');
    
    // Find all orders that might need fixing
    const orders = await ordersCollection.find({}).toArray();
    console.log(`Found ${orders.length} orders to analyze`);
    
    let fixedCount = 0;
    let statusUpdates = [];
    
    for (const order of orders) {
      let needsUpdate = false;
      let updateData = {};
      
      console.log(`\n📋 Checking order ${order.order_id || order._id}:`);
      console.log(`  - Current payment_status: ${order.payment_status}`);
      console.log(`  - Current status: ${order.status}`);
      console.log(`  - Payment method: ${order.payment_method}`);
      console.log(`  - Total amount: ${order.total_amount}`);
      
      // Case 1: Orders with 'awaiting_payment' status
      if (order.payment_status === 'awaiting_payment') {
        // Check if there's a completed transaction for this order
        let matchingTransaction = null;
        
        // Try to find transaction by razorpay_order_id if available
        if (order.razorpay_order_id) {
          matchingTransaction = await transactionsCollection.findOne({
            razorpay_order_id: order.razorpay_order_id,
            status: 'completed'
          });
        }
        
        // If not found, try to find by user_id, amount and date range
        if (!matchingTransaction) {
          const orderDate = new Date(order.created_at);
          const dateRange = {
            $gte: new Date(orderDate.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour before
            $lte: new Date(orderDate.getTime() + 60 * 60 * 1000).toISOString()  // 1 hour after
          };
          
          matchingTransaction = await transactionsCollection.findOne({
            user_id: order.user_id,
            amount: order.total_amount,
            purpose: 'product_purchase',
            status: 'completed',
            created_at: dateRange
          });
        }
        
        if (matchingTransaction) {
          console.log(`  ✅ Found completed transaction - marking as PAID`);
          updateData.payment_status = 'paid';
          updateData.payment_id = matchingTransaction.payment_id;
          updateData.status = 'confirmed';
          updateData.confirmed_at = matchingTransaction.verified_at || new Date().toISOString();
          needsUpdate = true;
        } else {
          console.log(`  ⚠️ No completed transaction found - keeping as PENDING`);
          updateData.payment_status = 'pending';
          needsUpdate = true;
        }
      }
      
      // Case 2: Orders with 'completed' payment status (should be 'paid')
      else if (order.payment_status === 'completed') {
        console.log(`  🔄 Converting 'completed' to 'paid'`);
        updateData.payment_status = 'paid';
        needsUpdate = true;
      }
      
      // Case 3: Orders that are very old and likely abandoned
      else if (order.payment_status === 'pending') {
        const orderDate = new Date(order.created_at);
        const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceOrder > 1) { // Orders older than 1 day
          console.log(`  ❌ Order is ${Math.round(daysSinceOrder)} days old - marking as FAILED`);
          updateData.payment_status = 'failed';
          updateData.status = 'cancelled';
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        updateData.updated_at = new Date().toISOString();
        
        // Update the order
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: updateData }
        );
        
        console.log(`  ✅ UPDATED: ${JSON.stringify(updateData, null, 2)}`);
        statusUpdates.push({
          order_id: order.order_id || order._id.toString(),
          old_status: order.payment_status,
          new_status: updateData.payment_status,
          reason: updateData.payment_status === 'paid' ? 'found_transaction' : 
                  updateData.payment_status === 'failed' ? 'old_abandoned_order' : 
                  'status_normalization'
        });
        fixedCount++;
      } else {
        console.log(`  ➡️ No changes needed`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Fixed ${fixedCount} orders`);
    console.log(`\n📋 Status Updates:`);
    statusUpdates.forEach(update => {
      console.log(`  ${update.order_id}: ${update.old_status} → ${update.new_status} (${update.reason})`);
    });
    
  } catch (error) {
    console.error('Error fixing existing orders:', error);
  } finally {
    await client.close();
    console.log('\n🔐 Database connection closed');
  }
}

// Run the script
fixExistingOrders();