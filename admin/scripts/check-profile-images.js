require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkProfileImages() {
  console.log('🖼️ Checking profile image references...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const mediaCollection = db.collection('media');
    
    // Get first few astrologers with their profile_image_id
    const astrologers = await usersCollection.find({ 
      user_type: 'astrologer' 
    }).limit(3).toArray();
    
    console.log('\n🔍 Astrologer profile image IDs:');
    for (const astrologer of astrologers) {
      console.log(`${astrologer.full_name}: ${astrologer.profile_image_id}`);
      
      // Try to find the media file
      let mediaFile = null;
      if (astrologer.profile_image_id) {
        try {
          // Check if it's an ObjectId
          if (ObjectId.isValid(astrologer.profile_image_id)) {
            mediaFile = await mediaCollection.findOne({ 
              _id: new ObjectId(astrologer.profile_image_id) 
            });
            console.log(`  → Media file found: ${mediaFile ? 'YES' : 'NO'}`);
            if (mediaFile) {
              console.log(`    File path: ${mediaFile.file_path}`);
              console.log(`    Original name: ${mediaFile.original_name}`);
            }
          } else {
            console.log(`  → Invalid ObjectId format: ${astrologer.profile_image_id}`);
          }
        } catch (error) {
          console.log(`  → Error checking media: ${error.message}`);
        }
      }
      console.log('');
    }
    
    // Check total media files available
    const totalMedia = await mediaCollection.countDocuments({});
    console.log(`📊 Total media files: ${totalMedia}`);
    
    // Show sample media files
    const sampleMedia = await mediaCollection.find({}).limit(3).toArray();
    console.log('\n📋 Sample media files:');
    sampleMedia.forEach((media, index) => {
      console.log(`Media ${index + 1}:`);
      console.log(`  ID: ${media._id}`);
      console.log(`  File path: ${media.file_path}`);
      console.log(`  Original name: ${media.original_name}`);
      console.log(`  Media ID: ${media.media_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkProfileImages().catch(console.error);