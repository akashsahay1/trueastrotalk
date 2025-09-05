const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixOrderUserIds() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');
    const usersCollection = db.collection('users');
    
    // Find all orders with problematic user_id values
    const orders = await ordersCollection.find({}).toArray();
    console.log(`Found ${orders.length} orders to analyze`);
    
    let fixedCount = 0;
    let deletedCount = 0;
    
    for (const order of orders) {
      console.log(`\n📋 Checking order ${order.order_number}:`);
      console.log(`  - Current user_id: ${order.user_id}`);
      
      // Check if user exists with this user_id
      const user = await usersCollection.findOne({ user_id: order.user_id });
      
      if (user) {
        console.log(`  ✅ User found: ${user.full_name}`);
        continue;
      }
      
      console.log(`  ❌ No user found with user_id: ${order.user_id}`);
      
      // If user_id looks like a MongoDB ObjectId, try to find the user and update
      if (typeof order.user_id === 'string' && order.user_id.length === 24) {
        try {
          const userByObjectId = await usersCollection.findOne({ _id: new ObjectId(order.user_id) });
          if (userByObjectId) {
            console.log(`  🔄 Found user by ObjectId, updating to proper user_id: ${userByObjectId.user_id}`);
            await ordersCollection.updateOne(
              { _id: order._id },
              { $set: { user_id: userByObjectId.user_id } }
            );
            fixedCount++;
            continue;
          }
        } catch (error) {
          console.log(`  ⚠️ Invalid ObjectId format`);
        }
      }
      
      // If it's test data (test_user_123), delete the order
      if (order.user_id === 'test_user_123') {
        console.log(`  🗑️ Deleting test order: ${order.order_number}`);
        await ordersCollection.deleteOne({ _id: order._id });
        deletedCount++;
      } else {
        console.log(`  ⚠️ Order ${order.order_number} has orphaned user_id: ${order.user_id}`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Fixed ${fixedCount} orders with proper user_id`);
    console.log(`🗑️ Deleted ${deletedCount} test orders`);
    
  } catch (error) {
    console.error('Error fixing order user IDs:', error);
  } finally {
    await client.close();
    console.log('\n🔐 Database connection closed');
  }
}

// Run the script
fixOrderUserIds();