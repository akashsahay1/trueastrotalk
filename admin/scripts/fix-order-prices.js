const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixOrderPrices() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');
    
    // Find all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`Found ${orders.length} orders to check`);
    
    let fixedCount = 0;
    
    for (const order of orders) {
      console.log(`\nChecking order ${order.order_id || order._id}:`);
      
      let needsUpdate = false;
      const updatedItems = [];
      
      if (order.items && Array.isArray(order.items)) {
        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          console.log(`  Item ${i + 1}: ${item.product_name}`);
          console.log(`    - price: ${item.price}`);
          console.log(`    - product_price: ${item.product_price}`);
          console.log(`    - quantity: ${item.quantity}`);
          console.log(`    - total_price: ${item.total_price}`);
          
          // Check if item has product_price but not price
          if (item.product_price !== undefined && item.price === undefined) {
            console.log(`    -> Fixing: copying product_price (${item.product_price}) to price`);
            // Copy product_price to price
            updatedItems.push({
              ...item,
              price: item.product_price,
              // Ensure total_price is calculated correctly
              total_price: item.product_price * (item.quantity || 1)
            });
            needsUpdate = true;
          } else if (item.price === 0 && item.product_price > 0) {
            console.log(`    -> Fixing: price is 0 but product_price is ${item.product_price}`);
            // Fix cases where price is 0 but product_price has value
            updatedItems.push({
              ...item,
              price: item.product_price,
              total_price: item.product_price * (item.quantity || 1)
            });
            needsUpdate = true;
          } else if (item.price === 0 && (!item.product_price || item.product_price === 0)) {
            console.log(`    -> WARNING: Both price and product_price are 0 or undefined`);
            updatedItems.push(item);
          } else {
            // Item is fine, keep as is
            updatedItems.push(item);
          }
        }
      }
      
      if (needsUpdate) {
        // Update the order with fixed items
        await ordersCollection.updateOne(
          { _id: order._id },
          { 
            $set: { 
              items: updatedItems,
              updated_at: new Date()
            }
          }
        );
        console.log(`Fixed order ${order.order_id || order._id}`);
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} orders with incorrect price fields`);
    
  } catch (error) {
    console.error('Error fixing order prices:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the script
fixOrderPrices();