const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function addTestChatSession() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    const usersCollection = db.collection('users');
    const sessionsCollection = db.collection('sessions');
    
    // Find the user with email akash@denaurlen.com
    const user = await usersCollection.findOne({
      email: 'akash@denaurlen.com'
    });
    
    if (!user) {
      console.log('❌ User with email akash@denaurlen.com not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.full_name || user.name} (${user.email})`);
    
    // Find the astrologer "Pt. Ashok Dwivedi"
    const astrologer = await usersCollection.findOne({
      user_type: 'astrologer',
      $or: [
        { full_name: { $regex: /Pt\.?\s*Ashok\s*Dwivedi/i } },
        { name: { $regex: /Pt\.?\s*Ashok\s*Dwivedi/i } },
        { full_name: { $regex: /Ashok\s*Dwivedi/i } },
        { name: { $regex: /Ashok\s*Dwivedi/i } }
      ]
    });
    
    if (!astrologer) {
      console.log('❌ Astrologer "Pt. Ashok Dwivedi" not found');
      console.log('Available astrologers:');
      const astrologers = await usersCollection.find({ user_type: 'astrologer' }).toArray();
      astrologers.forEach(ast => {
        console.log(`   - ${ast.full_name || ast.name} (ID: ${ast._id})`);
      });
      return;
    }
    
    console.log(`✅ Found astrologer: ${astrologer.full_name || astrologer.name}`);
    
    // Check if a chat session already exists
    const existingSession = await sessionsCollection.findOne({
      user_id: user._id,
      astrologer_id: astrologer._id,
      session_type: 'chat'
    });
    
    if (existingSession) {
      console.log(`✅ Chat session already exists: ${existingSession._id}`);
      console.log(`   Status: ${existingSession.status}`);
      console.log(`   Created: ${existingSession.created_at}`);
      return existingSession;
    }
    
    // Create a new chat session
    const sessionData = {
      _id: new ObjectId(),
      user_id: user._id,
      astrologer_id: astrologer._id,
      session_type: 'chat',
      status: 'completed', // Mark as completed so user can add review
      start_time: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
      end_time: new Date(Date.now() - 5 * 60 * 1000), // Ended 5 minutes ago
      duration: 25 * 60, // 25 minutes in seconds
      rate_per_minute: astrologer.chat_rate || 5,
      total_amount: (astrologer.chat_rate || 5) * 25, // 25 minutes worth
      payment_status: 'completed',
      created_at: new Date(Date.now() - 30 * 60 * 1000),
      updated_at: new Date()
    };
    
    const result = await sessionsCollection.insertOne(sessionData);
    
    console.log('✅ Test chat session created successfully!');
    console.log(`   Session ID: ${result.insertedId}`);
    console.log(`   User: ${user.full_name || user.name} (${user.email})`);
    console.log(`   Astrologer: ${astrologer.full_name || astrologer.name}`);
    console.log(`   Duration: 25 minutes`);
    console.log(`   Total Amount: ₹${sessionData.total_amount}`);
    console.log(`   Status: ${sessionData.status}`);
    
    console.log('\n🎉 Now the user can add a review for this astrologer!');
    
    return sessionData;
    
  } catch (error) {
    console.error('❌ Error adding test chat session:', error);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
addTestChatSession();