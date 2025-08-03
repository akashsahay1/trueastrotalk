const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const MONGODB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/2025/08');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Function to download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to generate unique filename
function generateUniqueFilename(originalUrl, userId) {
  const urlParams = new URL(originalUrl).searchParams;
  const seed = urlParams.get('seed') || 'default';
  const hash = crypto.createHash('md5').update(`${userId}_${seed}`).digest('hex');
  return `astrologer_${hash}.png`;
}

async function migrateAstrologerImages() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find all astrologers with Dicebear profile images
    const astrologers = await usersCollection.find({
      user_type: 'astrologer',
      profile_image: { $regex: /^https:\/\/api\.dicebear\.com/ }
    }).toArray();
    
    console.log(`📋 Found ${astrologers.length} astrologers with Dicebear images to migrate`);
    
    if (astrologers.length === 0) {
      console.log('✅ No migration needed - no Dicebear images found');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const astrologer of astrologers) {
      try {
        console.log(`\n👤 Processing: ${astrologer.full_name} (${astrologer.email_address})`);
        console.log(`🔗 Original URL: ${astrologer.profile_image}`);
        
        // Generate unique filename
        const filename = generateUniqueFilename(astrologer.profile_image, astrologer._id.toString());
        const filepath = path.join(UPLOAD_DIR, filename);
        const newImagePath = `/uploads/2025/08/${filename}`;
        
        // Download the image
        console.log(`⬇️  Downloading to: ${filename}`);
        await downloadImage(astrologer.profile_image, filepath);
        
        // Update database record
        const updateResult = await usersCollection.updateOne(
          { _id: astrologer._id },
          { 
            $set: { 
              profile_image: newImagePath,
              updated_at: new Date()
            }
          }
        );
        
        if (updateResult.modifiedCount === 1) {
          console.log(`✅ Successfully migrated image for ${astrologer.full_name}`);
          console.log(`📁 New path: ${newImagePath}`);
          successCount++;
        } else {
          console.log(`❌ Failed to update database for ${astrologer.full_name}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${astrologer.full_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Images saved to: ${UPLOAD_DIR}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateAstrologerImages()
    .then(() => {
      console.log('\n🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAstrologerImages };