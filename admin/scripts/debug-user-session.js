const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function debugUserSession() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    const usersCollection = db.collection('users');
    const sessionsCollection = db.collection('sessions');
    
    console.log('\n👤 Users with email akash@denaurlen.com:');
    const akashUsers = await usersCollection.find({
      email: 'akash@denaurlen.com'
    }).toArray();
    
    akashUsers.forEach(user => {
      console.log(`   - ID: ${user._id}`);
      console.log(`     Name: ${user.full_name || user.name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     User Type: ${user.user_type}`);
      console.log(`     Auth Type: ${user.auth_type || 'password'}`);
      console.log('');
    });
    
    console.log('🔮 Astrologers named Ashok Dwivedi:');
    const ashokUsers = await usersCollection.find({
      user_type: 'astrologer',
      $or: [
        { full_name: { $regex: /Ashok.*Dwivedi/i } },
        { name: { $regex: /Ashok.*Dwivedi/i } }
      ]
    }).toArray();
    
    ashokUsers.forEach(astrologer => {
      console.log(`   - ID: ${astrologer._id}`);
      console.log(`     Name: ${astrologer.full_name || astrologer.name}`);
      console.log(`     User Type: ${astrologer.user_type}`);
      console.log('');
    });
    
    console.log('💬 Chat sessions between these users:');
    if (akashUsers.length > 0 && ashokUsers.length > 0) {
      for (const akash of akashUsers) {
        for (const ashok of ashokUsers) {
          const sessions = await sessionsCollection.find({
            user_id: akash._id,
            astrologer_id: ashok._id
          }).toArray();
          
          sessions.forEach(session => {
            console.log(`   Session ID: ${session._id}`);
            console.log(`   User: ${akash.full_name || akash.name} (${akash._id})`);
            console.log(`   Astrologer: ${ashok.full_name || ashok.name} (${ashok._id})`);
            console.log(`   Type: ${session.session_type}`);
            console.log(`   Status: ${session.status}`);
            console.log(`   Created: ${session.created_at}`);
            console.log('');
          });
        }
      }
    }
    
    // Also check for any Google auth users
    console.log('🔍 All Google authenticated users:');
    const googleUsers = await usersCollection.find({
      auth_type: 'google'
    }).toArray();
    
    googleUsers.forEach(user => {
      console.log(`   - ${user.full_name || user.name} (${user.email}) - ID: ${user._id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script
debugUserSession();