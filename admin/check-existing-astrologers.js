const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

async function checkExistingAstrologers() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    const astrologers = await db.collection('users')
      .find({ user_type: 'astrologer' })
      .sort({ created_at: 1 })
      .toArray();
    
    console.log(`📊 Found ${astrologers.length} existing astrologer(s):`);
    
    astrologers.forEach((astrologer, index) => {
      console.log(`${index + 1}. ${astrologer.full_name} (${astrologer.email_address})`);
      console.log(`   📸 Profile Image ID: ${astrologer.profile_image_id}`);
      console.log(`   🆔 User ID: ${astrologer.user_id || 'Not set'}`);
      console.log('');
    });
    
    // Validate profile_image_id format
    const validImageIds = astrologers.filter(a => 
      a.profile_image_id && a.profile_image_id.startsWith('media_')
    );
    
    console.log(`✅ Astrologers with correct media_id format: ${validImageIds.length}/${astrologers.length}`);
    
  } catch (error) {
    console.error('❌ Error checking astrologers:', error);
  } finally {
    await client.close();
  }
}

checkExistingAstrologers();