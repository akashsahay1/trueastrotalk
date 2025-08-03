// Script to set up finance database with customers, astrologers, and wallets
// Run this with: node src/scripts/setup-finance-db.js

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalk';

async function setupFinanceDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const customersCollection = db.collection('customers');
    const astrologersCollection = db.collection('astrologers');
    const sessionsCollection = db.collection('sessions');
    const transactionsCollection = db.collection('transactions');
    
    console.log('Setting up customers...');
    
    // Create 50 realistic customers
    const customers = [];
    const customerNames = [
      'Priya Sharma', 'Rahul Gupta', 'Anjali Singh', 'Vikram Patel', 'Sneha Agarwal',
      'Arjun Reddy', 'Kavya Joshi', 'Rohit Kumar', 'Meera Iyer', 'Aditya Verma',
      'Nisha Tiwari', 'Karan Malhotra', 'Pooja Bansal', 'Siddharth Roy', 'Deepika Nair',
      'Aman Sinha', 'Ritika Chopra', 'Varun Saxena', 'Shreya Das', 'Nikhil Bhatia',
      'Priyanka Mehta', 'Akash Pandey', 'Riya Kapoor', 'Harsh Agrawal', 'Divya Rao',
      'Manish Goyal', 'Sakshi Jain', 'Rohan Khanna', 'Neha Mishra', 'Ankit Sharma',
      'Swati Dubey', 'Gaurav Singh', 'Isha Gupta', 'Tarun Kumar', 'Pallavi Soni',
      'Raj Patel', 'Komal Shah', 'Vishal Yadav', 'Nidhi Arora', 'Suresh Chand',
      'Madhuri Devi', 'Shubham Tiwari', 'Kriti Bhatt', 'Mohit Garg', 'Seema Dixit',
      'Ajay Thakur', 'Preeti Rathi', 'Nitesh Jha', 'Ritu Banerjee', 'Deepak Modi'
    ];
    
    for (let i = 0; i < 50; i++) {
      const walletBalance = Math.floor(Math.random() * 5000) + 100; // 100 to 5100
      const totalSpent = Math.floor(Math.random() * 10000) + 500; // 500 to 10500
      
      customers.push({
        _id: new ObjectId(),
        full_name: customerNames[i],
        email_address: `${customerNames[i].toLowerCase().replace(' ', '.')}@gmail.com`,
        phone_number: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        wallet_balance: walletBalance,
        total_spent: totalSpent,
        total_recharged: walletBalance + totalSpent,
        account_status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)],
        gender: ['male', 'female'][Math.floor(Math.random() * 2)],
        date_of_birth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad'][Math.floor(Math.random() * 7)],
        state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana'][Math.floor(Math.random() * 6)],
        created_at: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString() // Random date in last year
      });
    }
    
    await customersCollection.deleteMany({});
    await customersCollection.insertMany(customers);
    console.log(`Created ${customers.length} customers`);
    
    console.log('Setting up astrologers...');
    
    // Create 30 realistic astrologers
    const astrologers = [];
    const astrologerNames = [
      'Pt. Suresh Sharma', 'Dr. Meera Joshi', 'Pandit Rajesh Gupta', 'Smt. Kavita Iyer', 'Guru Anil Kumar',
      'Pt. Ramesh Tiwari', 'Dr. Sunita Patel', 'Acharya Vivek Singh', 'Smt. Priya Agarwal', 'Pandit Mohan Das',
      'Dr. Neelam Verma', 'Pt. Ashok Mishra', 'Guru Deepak Rao', 'Smt. Renu Bansal', 'Acharya Kiran Jain',
      'Pt. Vijay Pandey', 'Dr. Sushma Roy', 'Pandit Hari Om', 'Smt. Geeta Nair', 'Guru Manish Goyal',
      'Dr. Rekha Saxena', 'Pt. Santosh Kumar', 'Acharya Pawan Dixit', 'Smt. Usha Chopra', 'Pandit Ravi Bhatt',
      'Dr. Lalita Sinha', 'Pt. Mukesh Yadav', 'Guru Anand Tripathi', 'Smt. Savita Arora', 'Acharya Dinesh Jha'
    ];
    
    for (let i = 0; i < 30; i++) {
      const totalEarned = Math.floor(Math.random() * 50000) + 10000; // 10k to 60k
      const walletBalance = Math.floor(totalEarned * (Math.random() * 0.6)); // 0 to 60% of earned
      
      astrologers.push({
        _id: new ObjectId(),
        full_name: astrologerNames[i],
        email_address: `${astrologerNames[i].toLowerCase().replace(/[^a-z]/g, '')}@trueastrotalk.com`,
        phone_number: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        wallet_balance: walletBalance,
        total_earned: totalEarned,
        total_withdrawn: totalEarned - walletBalance,
        account_status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
        specialization: ['Vedic Astrology', 'Tarot Reading', 'Numerology', 'Palmistry', 'Vastu Shastra'][Math.floor(Math.random() * 5)],
        experience_years: Math.floor(Math.random() * 20) + 5, // 5 to 25 years
        commission_rates: {
          call_rate: [60, 65, 70, 75, 80][Math.floor(Math.random() * 5)], // Commission percentage
          chat_rate: [55, 60, 65, 70, 75][Math.floor(Math.random() * 5)],
          video_rate: [65, 70, 75, 80, 85][Math.floor(Math.random() * 5)]
        },
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
        total_consultations: Math.floor(Math.random() * 1000) + 100,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 730 * 24 * 60 * 60 * 1000)).toISOString() // Random date in last 2 years
      });
    }
    
    await astrologersCollection.deleteMany({});
    await astrologersCollection.insertMany(astrologers);
    console.log(`Created ${astrologers.length} astrologers`);
    
    console.log('Creating sample transactions...');
    
    // Create sample transactions for customers and astrologers
    const transactions = [];
    
    // Customer recharge transactions
    for (const customer of customers.slice(0, 25)) { // 25 customers with recharge history
      const numTransactions = Math.floor(Math.random() * 5) + 1; // 1 to 5 transactions
      for (let i = 0; i < numTransactions; i++) {
        transactions.push({
          _id: new ObjectId(),
          user_id: customer._id.toString(),
          user_type: 'customer',
          transaction_type: 'recharge',
          amount: Math.floor(Math.random() * 2000) + 100, // 100 to 2100
          status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
          payment_method: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'][Math.floor(Math.random() * 5)],
          reference_id: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          description: 'Wallet recharge',
          created_at: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)).toISOString() // Last 6 months
        });
      }
    }
    
    // Astrologer withdrawal transactions
    for (const astrologer of astrologers.slice(0, 20)) { // 20 astrologers with withdrawal history
      const numTransactions = Math.floor(Math.random() * 3) + 1; // 1 to 3 transactions
      for (let i = 0; i < numTransactions; i++) {
        transactions.push({
          _id: new ObjectId(),
          user_id: astrologer._id.toString(),
          user_type: 'astrologer',
          transaction_type: 'withdrawal',
          amount: Math.floor(Math.random() * 5000) + 500, // 500 to 5500
          status: ['completed', 'pending', 'processing'][Math.floor(Math.random() * 3)],
          payment_method: 'Bank Transfer',
          reference_id: `WTH${Date.now()}${Math.floor(Math.random() * 1000)}`,
          description: 'Earnings withdrawal',
          bank_details: {
            account_number: `****${Math.floor(Math.random() * 10000)}`,
            ifsc_code: 'HDFC0001234'
          },
          created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString() // Last 3 months
        });
      }
    }
    
    await transactionsCollection.deleteMany({});
    await transactionsCollection.insertMany(transactions);
    console.log(`Created ${transactions.length} transactions`);
    
    await client.close();
    console.log('Finance database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up finance database:', error);
  }
}

setupFinanceDatabase();