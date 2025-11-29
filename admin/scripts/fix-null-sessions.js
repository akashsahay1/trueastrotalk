// Script to fix sessions with null user_id and astrologer_id
// Usage: node scripts/fix-null-sessions.js

const { MongoClient } = require('mongodb');

const MONGODB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function fixNullSessions() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');

    // Find the customer and astrologer by email
    const customer = await usersCollection.findOne({
      email_address: 'akash.sahay1@gmail.com'
    });

    // Try both email variants (with and without dot - Gmail treats them the same)
    let astrologer = await usersCollection.findOne({
      email_address: 'akash.sahay1243@gmail.com'
    });

    if (!astrologer) {
      astrologer = await usersCollection.findOne({
        email_address: 'akashsahay1243@gmail.com'
      });
    }

    if (!customer) {
      console.log('❌ Customer with email akash.sahay1@gmail.com not found');
      return;
    }

    if (!astrologer) {
      console.log('❌ Astrologer with email akash.sahay1243@gmail.com not found');
      return;
    }

    console.log('\n📋 Found users:');
    console.log(`   Customer: ${customer.full_name} (${customer.user_id})`);
    console.log(`   Astrologer: ${astrologer.full_name} (${astrologer.user_id})`);

    // Find all sessions with null user_id or astrologer_id
    const nullSessions = await sessionsCollection.find({
      $or: [
        { user_id: null },
        { astrologer_id: null },
        { status: null },
        { rate_per_minute: null }
      ]
    }).toArray();

    console.log(`\n🔍 Found ${nullSessions.length} sessions with null values:\n`);

    if (nullSessions.length === 0) {
      console.log('✅ No sessions with null values found!');
      return;
    }

    // Display the sessions
    nullSessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session._id}`);
      console.log(`   Type: ${session.session_type}`);
      console.log(`   user_id: ${session.user_id}`);
      console.log(`   astrologer_id: ${session.astrologer_id}`);
      console.log(`   status: ${session.status}`);
      console.log(`   rate_per_minute: ${session.rate_per_minute}`);
      console.log(`   created_at: ${session.created_at}`);
      console.log('');
    });

    // Get rate based on session type
    const getRate = (sessionType) => {
      if (sessionType === 'video_call') {
        return astrologer.video_call_rate || astrologer.call_rate || 15;
      } else if (sessionType === 'voice_call') {
        return astrologer.call_rate || 10;
      } else if (sessionType === 'chat') {
        return astrologer.chat_rate || 8;
      }
      return 10;
    };

    // Update each session
    console.log('🔧 Updating sessions...\n');

    for (const session of nullSessions) {
      const rate = getRate(session.session_type);

      const updateResult = await sessionsCollection.updateOne(
        { _id: session._id },
        {
          $set: {
            user_id: customer.user_id,
            astrologer_id: astrologer.user_id,
            status: session.status || 'completed', // Default to completed for old sessions
            rate_per_minute: session.rate_per_minute || rate,
            updated_at: new Date()
          }
        }
      );

      console.log(`   Updated session ${session._id}: ${updateResult.modifiedCount} document(s)`);
    }

    console.log('\n✅ All sessions updated successfully!');

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const verifyResult = await sessionsCollection.find({
      $or: [
        { user_id: null },
        { astrologer_id: null }
      ]
    }).count();

    console.log(`   Remaining sessions with null user_id/astrologer_id: ${verifyResult}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

fixNullSessions();
