const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkUsers() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    const usersCollection = db.collection('users');
    
    console.log('\n👥 Available customers:');
    const customers = await usersCollection.find({ user_type: 'customer' }).toArray();
    customers.forEach(user => {
      console.log(`   - ${user.full_name || user.name} (${user.email})`);
    });
    
    console.log('\n🔮 Available astrologers:');
    const astrologers = await usersCollection.find({ user_type: 'astrologer' }).toArray();
    astrologers.forEach(user => {
      console.log(`   - ${user.full_name || user.name} (${user.email || 'no email'})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script
checkUsers();