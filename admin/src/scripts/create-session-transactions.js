// Script to create logical session transactions for existing wallet balances
// Run this with: node src/scripts/create-session-transactions.js

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalk';

async function createSessionTransactions() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const customersCollection = db.collection('customers');
    const astrologersCollection = db.collection('astrologers');
    const transactionsCollection = db.collection('transactions');
    
    console.log('Clearing existing transactions...');
    await transactionsCollection.deleteMany({});
    
    console.log('Creating logical transaction history...');
    
    const customers = await customersCollection.find({}).toArray();
    const astrologers = await astrologersCollection.find({}).toArray();
    const transactions = [];
    
    // Create customer transactions
    for (const customer of customers) {
      const walletBalance = customer.wallet_balance || 0;
      const totalSpent = customer.total_spent || 0;
      const totalRecharged = customer.total_recharged || (walletBalance + totalSpent);
      
      // Create recharge transactions to build up to total_recharged
      const numRecharges = Math.floor(Math.random() * 4) + 2; // 2-5 recharges
      let remainingAmount = totalRecharged;
      
      for (let i = 0; i < numRecharges; i++) {
        let rechargeAmount;
        if (i === numRecharges - 1) {
          rechargeAmount = remainingAmount; // Last recharge gets remaining amount
        } else {
          rechargeAmount = Math.floor(remainingAmount * (0.15 + Math.random() * 0.35)); // 15-50% of remaining
          remainingAmount -= rechargeAmount;
        }
        
        if (rechargeAmount > 0) {
          const daysAgo = Math.floor(Math.random() * 180); // Last 6 months
          const rechargeDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
          
          transactions.push({
            _id: new ObjectId(),
            user_id: customer._id.toString(),
            user_type: 'customer',
            transaction_type: 'recharge',
            amount: rechargeAmount,
            status: 'completed',
            payment_method: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'PayPal'][Math.floor(Math.random() * 5)],
            reference_id: `TXN${Date.now()}${Math.floor(Math.random() * 100000)}`,
            description: 'Wallet recharge',
            created_at: rechargeDate.toISOString(),
            updated_at: rechargeDate.toISOString()
          });
        }
      }
      
      // Create session payment transactions to spend totalSpent
      const numPayments = Math.floor(Math.random() * 8) + 3; // 3-10 session payments
      let remainingSpent = totalSpent;
      
      for (let i = 0; i < numPayments; i++) {
        let paymentAmount;
        if (i === numPayments - 1) {
          paymentAmount = remainingSpent;
        } else {
          paymentAmount = Math.floor(remainingSpent * (0.05 + Math.random() * 0.25)); // 5-30% of remaining
          remainingSpent -= paymentAmount;
        }
        
        if (paymentAmount > 0) {
          const daysAgo = Math.floor(Math.random() * 150); // Last 5 months
          const paymentDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
          
          // Randomly select astrologer for this session
          const randomAstrologer = astrologers[Math.floor(Math.random() * astrologers.length)];
          const sessionTypes = ['call', 'chat', 'video'];
          const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
          const sessionId = `TAS${sessionType.charAt(0).toUpperCase()}#${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
          
          transactions.push({
            _id: new ObjectId(),
            user_id: customer._id.toString(),
            user_type: 'customer',
            transaction_type: 'payment',
            amount: paymentAmount,
            status: 'completed',
            payment_method: 'Wallet',
            reference_id: `PAY${sessionId}${Math.floor(Math.random() * 1000)}`,
            description: `Payment for ${sessionType} session with ${randomAstrologer.full_name}`,
            session_id: sessionId,
            astrologer_id: randomAstrologer._id.toString(),
            session_type: sessionType,
            created_at: paymentDate.toISOString(),
            updated_at: paymentDate.toISOString()
          });
        }
      }
    }
    
    // Create astrologer commission and withdrawal transactions
    for (const astrologer of astrologers) {
      const totalEarned = astrologer.total_earned || 0;
      const walletBalance = astrologer.wallet_balance || 0;
      const totalWithdrawn = astrologer.total_withdrawn || (totalEarned - walletBalance);
      
      // Find customer payment transactions for this astrologer to create corresponding commissions
      const astrologerPayments = transactions.filter(t => 
        t.astrologer_id === astrologer._id.toString() && 
        t.transaction_type === 'payment'
      );
      
      let calculatedEarnings = 0;
      
      // Create commission transactions for each payment
      for (const payment of astrologerPayments) {
        const commissionRate = astrologer.commission_rates?.call_rate || 70;
        const commissionAmount = Math.floor(payment.amount * commissionRate / 100);
        calculatedEarnings += commissionAmount;
        
        // Add a few minutes to the payment time for commission
        const commissionDate = new Date(new Date(payment.created_at).getTime() + (Math.floor(Math.random() * 60) * 1000));
        
        transactions.push({
          _id: new ObjectId(),
          user_id: astrologer._id.toString(),
          user_type: 'astrologer',
          transaction_type: 'commission',
          amount: commissionAmount,
          status: 'completed',
          payment_method: 'Commission Credit',
          reference_id: `COM${payment.session_id}${Math.floor(Math.random() * 1000)}`,
          description: `Commission from ${payment.session_type} session (${commissionRate}%)`,
          session_id: payment.session_id,
          customer_id: payment.user_id,
          commission_rate: commissionRate,
          base_amount: payment.amount,
          created_at: commissionDate.toISOString(),
          updated_at: commissionDate.toISOString()
        });
      }
      
      // If calculated earnings is less than total_earned, add some additional commission transactions
      if (calculatedEarnings < totalEarned) {
        const additionalEarnings = totalEarned - calculatedEarnings;
        const numAdditional = Math.floor(Math.random() * 3) + 1;
        let remainingAdditional = additionalEarnings;
        
        for (let i = 0; i < numAdditional; i++) {
          let amount;
          if (i === numAdditional - 1) {
            amount = remainingAdditional;
          } else {
            amount = Math.floor(remainingAdditional * (0.2 + Math.random() * 0.4));
            remainingAdditional -= amount;
          }
          
          if (amount > 0) {
            const daysAgo = Math.floor(Math.random() * 120);
            const commissionDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
            
            transactions.push({
              _id: new ObjectId(),
              user_id: astrologer._id.toString(),
              user_type: 'astrologer',
              transaction_type: 'commission',
              amount: amount,
              status: 'completed',
              payment_method: 'Commission Credit',
              reference_id: `COM${Date.now()}${Math.floor(Math.random() * 10000)}`,
              description: 'Commission from previous sessions',
              commission_rate: 70,
              created_at: commissionDate.toISOString(),
              updated_at: commissionDate.toISOString()
            });
          }
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
            const daysAgo = Math.floor(Math.random() * 90); // Last 3 months
            const withdrawalDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
            
            transactions.push({
              _id: new ObjectId(),
              user_id: astrologer._id.toString(),
              user_type: 'astrologer',
              transaction_type: 'withdrawal',
              amount: withdrawalAmount,
              status: Math.random() > 0.1 ? 'completed' : 'processing', // 90% completed
              payment_method: 'Bank Transfer',
              reference_id: `WTH${Date.now()}${Math.floor(Math.random() * 10000)}`,
              description: 'Earnings withdrawal to bank account',
              bank_details: {
                account_number: `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                ifsc_code: ['HDFC0001234', 'ICICI0001234', 'SBI0001234', 'AXIS0001234', 'KOTAK0001234'][Math.floor(Math.random() * 5)]
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
    if (transactions.length > 0) {
      await transactionsCollection.insertMany(transactions);
      console.log(`Created ${transactions.length} logical transactions`);
    }
    
    // Summary statistics
    const rechargeTotal = transactions.filter(t => t.transaction_type === 'recharge').reduce((sum, t) => sum + t.amount, 0);
    const paymentTotal = transactions.filter(t => t.transaction_type === 'payment').reduce((sum, t) => sum + t.amount, 0);
    const commissionTotal = transactions.filter(t => t.transaction_type === 'commission').reduce((sum, t) => sum + t.amount, 0);
    const withdrawalTotal = transactions.filter(t => t.transaction_type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
    
    console.log('\nTransaction Summary:');
    console.log(`Total Recharges: ₹${rechargeTotal.toLocaleString()} (${transactions.filter(t => t.transaction_type === 'recharge').length} transactions)`);
    console.log(`Total Payments: ₹${paymentTotal.toLocaleString()} (${transactions.filter(t => t.transaction_type === 'payment').length} transactions)`);
    console.log(`Total Commissions: ₹${commissionTotal.toLocaleString()} (${transactions.filter(t => t.transaction_type === 'commission').length} transactions)`);
    console.log(`Total Withdrawals: ₹${withdrawalTotal.toLocaleString()} (${transactions.filter(t => t.transaction_type === 'withdrawal').length} transactions)`);
    
    await client.close();
    console.log('\nTransaction creation completed successfully!');
    
  } catch (error) {
    console.error('Error creating transactions:', error);
  }
}

createSessionTransactions();