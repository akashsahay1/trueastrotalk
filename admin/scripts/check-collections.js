// Script to check all collections in the database
// Usage: node scripts/check-collections.js

const { MongoClient } = require('mongodb');

const MONGODB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkCollections() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // List all collections
    const collections = await db.listCollections().toArray();

    console.log(`\n📋 Collections in ${DB_NAME}:\n`);

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documents`);
    }

    // Check if call_sessions exists
    const callSessionsExists = collections.some(c => c.name === 'call_sessions');
    const chatSessionsExists = collections.some(c => c.name === 'chat_sessions');

    console.log('\n🔍 Session collections check:');
    console.log(`   call_sessions exists: ${callSessionsExists}`);
    console.log(`   chat_sessions exists: ${chatSessionsExists}`);

    if (callSessionsExists) {
      const callSessions = await db.collection('call_sessions').find().limit(3).toArray();
      console.log('\n📞 Sample call_sessions documents:');
      callSessions.forEach((doc, i) => {
        console.log(`\n   ${i + 1}. ${doc._id}`);
        console.log(`      session_id: ${doc.session_id}`);
        console.log(`      caller_id: ${doc.caller_id}`);
        console.log(`      receiver_id: ${doc.receiver_id}`);
        console.log(`      call_type: ${doc.call_type}`);
        console.log(`      call_status: ${doc.call_status}`);
      });
    }

    if (chatSessionsExists) {
      const chatSessions = await db.collection('chat_sessions').find().limit(3).toArray();
      console.log('\n💬 Sample chat_sessions documents:');
      chatSessions.forEach((doc, i) => {
        console.log(`\n   ${i + 1}. ${doc._id}`);
        console.log(`      user_id: ${doc.user_id}`);
        console.log(`      astrologer_id: ${doc.astrologer_id}`);
        console.log(`      status: ${doc.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkCollections();
