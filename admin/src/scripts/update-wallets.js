// Script to update existing customers and astrologers with wallet balances
// Run this with: node src/scripts/update-wallets.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalk';

async function updateWallets() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const customersCollection = db.collection('customers');
    const astrologersCollection = db.collection('astrologers');
    const sessionsCollection = db.collection('sessions');
    
    console.log('Updating customer wallets...');
    
    // Update customers with realistic wallet balances
    const customers = await customersCollection.find({}).toArray();
    
    for (const customer of customers) {
      // Calculate total spent from sessions
      const customerSessions = await sessionsCollection
        .find({ customer_id: customer._id.toString() })
        .toArray();
      
      const totalSpent = customerSessions.reduce((sum, session) => sum + (session.total_amount || 0), 0);
      
      // Generate realistic wallet balance (0 to 5000 for customers)
      const walletBalance = Math.floor(Math.random() * 5000);
      
      await customersCollection.updateOne(
        { _id: customer._id },
        { 
          $set: { 
            wallet_balance: walletBalance,
            total_spent: totalSpent,
            total_recharged: walletBalance + totalSpent
          } 
        }
      );
    }
    
    console.log(`Updated ${customers.length} customer wallets`);
    
    // Update astrologers with realistic wallet balances
    const astrologers = await astrologersCollection.find({}).toArray();
    
    for (const astrologer of astrologers) {
      // Calculate total earned from sessions
      const astrologerSessions = await sessionsCollection
        .find({ astrologer_id: astrologer._id.toString() })
        .toArray();
      
      const commissionRate = astrologer.commission_rates?.call_rate || 70; // Default 70%
      const totalEarned = astrologerSessions.reduce((sum, session) => {
        return sum + ((session.total_amount || 0) * commissionRate / 100);
      }, 0);
      
      // Generate realistic wallet balance (0 to 50% of total earned)
      const walletBalance = Math.floor(totalEarned * (Math.random() * 0.5));
      const totalWithdrawn = totalEarned - walletBalance;
      
      await astrologersCollection.updateOne(
        { _id: astrologer._id },
        { 
          $set: { 
            wallet_balance: walletBalance,
            total_earned: totalEarned,
            total_withdrawn: totalWithdrawn
          } 
        }
      );
    }
    
    console.log(`Updated ${astrologers.length} astrologer wallets`);
    
    await client.close();
    console.log('Wallet update completed successfully!');
    
  } catch (error) {
    console.error('Error updating wallets:', error);
  }
}

updateWallets();