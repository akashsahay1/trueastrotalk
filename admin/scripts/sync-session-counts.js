const { MongoClient } = require('mongodb');

const MONGODB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function syncSessionCounts() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const sessionsCollection = db.collection('sessions');
    
    // Get all astrologers
    const astrologers = await usersCollection.find({
      user_type: 'astrologer'
    }).toArray();
    
    console.log(`📋 Found ${astrologers.length} astrologers to update`);
    
    let updatedCount = 0;
    
    for (const astrologer of astrologers) {
      try {
        // Count actual sessions for this astrologer
        const actualSessionCount = await sessionsCollection.countDocuments({
          astrologer_id: astrologer._id
        });
        
        // Get current count from user document
        const currentCount = astrologer.total_consultations || 0;
        
        console.log(`👤 ${astrologer.full_name}: Current=${currentCount}, Actual=${actualSessionCount}`);
        
        // Update if counts don't match
        if (currentCount !== actualSessionCount) {
          await usersCollection.updateOne(
            { _id: astrologer._id },
            { 
              $set: { 
                total_consultations: actualSessionCount,
                total_sessions: actualSessionCount, // Also set this field for consistency
                updated_at: new Date()
              }
            }
          );
          
          console.log(`✅ Updated ${astrologer.full_name}: ${currentCount} → ${actualSessionCount}`);
          updatedCount++;
        } else {
          console.log(`✨ ${astrologer.full_name}: Already in sync`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${astrologer.full_name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Sync Summary:`);
    console.log(`✅ Updated: ${updatedCount} astrologers`);
    console.log(`✨ Already synced: ${astrologers.length - updatedCount} astrologers`);
    
  } catch (error) {
    console.error('💥 Sync failed:', error);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the sync
if (require.main === module) {
  syncSessionCounts()
    .then(() => {
      console.log('\n🎉 Session count sync completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncSessionCounts };