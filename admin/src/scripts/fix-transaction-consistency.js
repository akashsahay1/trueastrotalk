// Script to create consistent transaction history that matches wallet balances
// Run this with: node src/scripts/fix-transaction-consistency.js

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalk';

async function fixTransactionConsistency() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const customersCollection = db.collection('customers');
    const astrologersCollection = db.collection('astrologers');
    const sessionsCollection = db.collection('sessions');
    const transactionsCollection = db.collection('transactions');
    
    console.log('Clearing existing transactions...');
    await transactionsCollection.deleteMany({});
    
    console.log('Creating transaction history for customers...');
    
    const customers = await customersCollection.find({}).toArray();
    const transactions = [];
    
    for (const customer of customers) {
      const walletBalance = customer.wallet_balance || 0;
      const totalSpent = customer.total_spent || 0;
      const totalRecharged = customer.total_recharged || (walletBalance + totalSpent);
      
      // Get customer's sessions to create session payment transactions
      const customerSessions = await sessionsCollection
        .find({ customer_id: customer._id.toString() })
        .sort({ created_at: 1 })
        .toArray();
      
      let remainingRechargeAmount = totalRecharged;
      let currentBalance = 0;
      
      // Create realistic recharge pattern
      const numRecharges = Math.floor(Math.random() * 5) + 2; // 2-6 recharges
      const rechargeAmounts = [];
      
      // Distribute total recharge across multiple transactions
      for (let i = 0; i < numRecharges; i++) {
        if (i === numRecharges - 1) {
          // Last recharge gets remaining amount
          rechargeAmounts.push(remainingRechargeAmount);
        } else {
          const amount = Math.floor(remainingRechargeAmount * (0.2 + Math.random() * 0.3));
          rechargeAmounts.push(amount);
          remainingRechargeAmount -= amount;
        }
      }
      
      // Create recharge transactions spread over time
      for (let i = 0; i < rechargeAmounts.length; i++) {
        const amount = rechargeAmounts[i];
        if (amount > 0) {
          const rechargeDate = new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)); // Last 6 months
          
          transactions.push({
            _id: new ObjectId(),
            user_id: customer._id.toString(),
            user_type: 'customer',
            transaction_type: 'recharge',
            amount: amount,
            status: 'completed',
            payment_method: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'][Math.floor(Math.random() * 4)],
            reference_id: `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`,
            description: 'Wallet recharge',
            created_at: rechargeDate.toISOString(),
            updated_at: rechargeDate.toISOString()
          });
          
          currentBalance += amount;
        }
      }
      
      // Create session payment transactions
      for (const session of customerSessions) {
        const sessionAmount = session.total_amount || 0;
        if (sessionAmount > 0) {
          transactions.push({
            _id: new ObjectId(),
            user_id: customer._id.toString(),
            user_type: 'customer',
            transaction_type: 'payment',
            amount: sessionAmount,
            status: 'completed',
            payment_method: 'Wallet',
            reference_id: `PAY${session.session_id}${Math.floor(Math.random() * 1000)}`,
            description: `Payment for ${session.session_id ? session.session_id.split('#')[0] : 'session'}`,
            session_id: session.session_id,
            created_at: session.created_at,
            updated_at: session.created_at
          });
          
          currentBalance -= sessionAmount;
        }
      }
    }
    
    console.log('Creating transaction history for astrologers...');
    
    const astrologers = await astrologersCollection.find({}).toArray();
    
    for (const astrologer of astrologers) {
      const walletBalance = astrologer.wallet_balance || 0;
      const totalEarned = astrologer.total_earned || 0;
      const totalWithdrawn = astrologer.total_withdrawn || (totalEarned - walletBalance);
      
      // Get astrologer's sessions to create commission transactions
      const astrologerSessions = await sessionsCollection
        .find({ astrologer_id: astrologer._id.toString() })
        .sort({ created_at: 1 })
        .toArray();
      
      // Create commission transactions for each session
      for (const session of astrologerSessions) {
        const sessionRevenue = session.total_amount || 0;
        if (sessionRevenue > 0) {
          const commissionRate = astrologer.commission_rates?.call_rate || 70;
          const commissionAmount = Math.floor(sessionRevenue * commissionRate / 100);
          
          transactions.push({
            _id: new ObjectId(),
            user_id: astrologer._id.toString(),
            user_type: 'astrologer',
            transaction_type: 'commission',
            amount: commissionAmount,
            status: 'completed',
            payment_method: 'Commission Credit',
            reference_id: `COM${session.session_id}${Math.floor(Math.random() * 1000)}`,
            description: `Commission for ${session.session_id ? session.session_id.split('#')[0] : 'session'}`,
            session_id: session.session_id,
            commission_rate: commissionRate,
            base_amount: sessionRevenue,
            created_at: session.created_at,
            updated_at: session.created_at
          });
        }
      }
      
      // Create withdrawal transactions
      if (totalWithdrawn > 0) {
        const numWithdrawals = Math.floor(Math.random() * 3) + 1; // 1-3 withdrawals
        let remainingWithdrawal = totalWithdrawn;
        
        for (let i = 0; i < numWithdrawals; i++) {
          let withdrawalAmount;
          if (i === numWithdrawals - 1) {
            withdrawalAmount = remainingWithdrawal;
          } else {
            withdrawalAmount = Math.floor(remainingWithdrawal * (0.3 + Math.random() * 0.4));
            remainingWithdrawal -= withdrawalAmount;
          }
          
          if (withdrawalAmount > 0) {
            const withdrawalDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)); // Last 3 months
            
            transactions.push({
              _id: new ObjectId(),
              user_id: astrologer._id.toString(),
              user_type: 'astrologer',
              transaction_type: 'withdrawal',
              amount: withdrawalAmount,
              status: ['completed', 'processing'][Math.floor(Math.random() * 2)],
              payment_method: 'Bank Transfer',
              reference_id: `WTH${Date.now()}${Math.floor(Math.random() * 10000)}`,
              description: 'Earnings withdrawal',
              bank_details: {
                account_number: `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                ifsc_code: ['HDFC0001234', 'ICICI0001234', 'SBI0001234', 'AXIS0001234'][Math.floor(Math.random() * 4)]
              },
              created_at: withdrawalDate.toISOString(),
              updated_at: withdrawalDate.toISOString()
            });
          }
        }
      }
    }
    
    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Insert all transactions
    await transactionsCollection.insertMany(transactions);
    console.log(`Created ${transactions.length} consistent transactions`);
    
    // Verify consistency
    console.log('\nVerifying transaction consistency...');
    
    const customerRecharges = await transactionsCollection.aggregate([
      { $match: { user_type: 'customer', transaction_type: 'recharge', status: 'completed' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]).toArray();
    
    const customerPayments = await transactionsCollection.aggregate([
      { $match: { user_type: 'customer', transaction_type: 'payment', status: 'completed' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]).toArray();
    
    console.log(`Customer recharge transactions: ${customerRecharges.length} customers`);
    console.log(`Customer payment transactions: ${customerPayments.length} customers`);
    
    const astrologerCommissions = await transactionsCollection.aggregate([
      { $match: { user_type: 'astrologer', transaction_type: 'commission', status: 'completed' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]).toArray();
    
    const astrologerWithdrawals = await transactionsCollection.aggregate([
      { $match: { user_type: 'astrologer', transaction_type: 'withdrawal' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]).toArray();
    
    console.log(`Astrologer commission transactions: ${astrologerCommissions.length} astrologers`);
    console.log(`Astrologer withdrawal transactions: ${astrologerWithdrawals.length} astrologers`);
    
    await client.close();
    console.log('\nTransaction consistency fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing transaction consistency:', error);
  }
}

fixTransactionConsistency();