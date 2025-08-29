/**
 * Script to fix product images by matching product names with uploaded image filenames
 */

const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Mapping of product names to expected image names
const imageNameMappings = {
  'Mahamrityunjaya Yantra': 'Mahamrityunjaya_Yantra',
  '5 Mukhi Rudraksh': '5_Mukhi_Rudraksh',
  'Meditation Cushion': 'Meditation_Cushion',
  'Crystal Healing Stone Set': 'Crystal_Healing_Stone_Set',
  'Yantra for Wealth': 'Yantra_for_Wealth',
  'Ganesha Idol Brass': 'Ganesha_Idol_Brass',
  'Shri Yantra Crystal': 'Shri_Yantra_Crystal',
  'Evil Eye Protection Bracelet': 'Evil_Eye_Protection_Bracelet',
  'Navgraha Stone Ring': 'Navgraha_Stone_Ring',
  'Hanuman Chalisa Book': 'Hanuman_Chalisa_Book',
  'Incense Sticks Sandalwood': 'Incense_Sticks_Sandalwood',
  'Om Wall Hanging': 'Om_Wall_Hanging',
  'Chakra Balancing Stones': 'Chakra_Balancing_Stones',
  'Feng Shui Laughing Buddha': 'Feng_Shui_Laughing_Buddha',
  'Numerology Chart': 'Numerology_Chart',
  'Palmistry Hand Model': 'Palmistry_Hand_Model',
  'Astrology Calendar 2025': 'Astrology_Calendar_2025',
  'Gemstone Consultation Kit': 'Gemstone_Consultation_Kit',
  'Spiritual Healing Oil': 'Spiritual_Healing_Oil',
  'Rose Quartz Heart': 'Rose_Quartz_Heart',
  'Black Tourmaline Pendant': 'Black_Tourmaline_Pendant',
  'Amethyst Cluster': 'Amethyst_Cluster',
  'Citrine Tree': 'Citrine_Tree',
  'Red Coral Ring': 'Red_Coral_Ring',
  'Emerald Pendant': 'Emerald_Pendant',
  'Blue Sapphire Ring': 'Blue_Sapphire_Ring',
  'Yellow Sapphire Earrings': 'Yellow_Sapphire_Earrings',
  'Silver Om Pendant': 'Silver_Om_Pendant',
  'Copper Kalash': 'Copper_Kalash',
  'Brass Diya Set': 'Brass_Diya_Set',
  'Camphor Tablets': 'Camphor_Tablets',
  'Gangajal Holy Water': 'Gangajal_Holy_Water',
  'Sphatik Shivling': 'Sphatik_Shivling',
  'Gomti Chakra Set': 'Gomti_Chakra_Set',
  'Conch Shell Shankh': 'Conch_Shell_Shankh',
  'Kauri Shells Set': 'Kauri_Shells_Set',
  'Abhimantrit Yantra': 'Abhimantrit_Yantra',
  'Energized Bracelet': 'Energized_Bracelet',
  'Consecrated Ring': 'Consecrated_Ring',
  'Sacred Thread Kalawa': 'Sacred_Thread_Kalawa',
  'Astrology Software CD': 'Astrology_Software_CD',
  'Kundli Making Book': 'Kundli_Making_Book',
  'Horoscope Analysis Guide': 'Horoscope_Analysis_Guide',
  'Vastu Tips Manual': 'Vastu_Tips_Manual',
  'Numerology Handbook': 'Numerology_Handbook'
};

async function fixProductImages() {
  console.log('🔧 Starting product images fix...');
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    const mediaCollection = db.collection('media');
    
    // Get all products
    const products = await productsCollection.find({}).toArray();
    console.log(`📦 Found ${products.length} products`);
    
    // Get all media files
    const mediaFiles = await mediaCollection.find({ category: 'image' }).toArray();
    console.log(`🖼️ Found ${mediaFiles.length} media files`);
    
    let fixedCount = 0;
    let notFoundCount = 0;
    
    for (const product of products) {
      if (product.image_id) {
        console.log(`⏭️ Skipping ${product.name} - already has image_id: ${product.image_id}`);
        continue;
      }
      
      // Find matching media file
      const expectedImageName = imageNameMappings[product.name];
      let matchingMedia = null;
      
      if (expectedImageName) {
        // Look for exact match in original_name
        matchingMedia = mediaFiles.find(media => 
          media.original_name && media.original_name.includes(expectedImageName)
        );
      }
      
      // If no exact match, try fuzzy matching by removing special chars and spaces
      if (!matchingMedia) {
        const cleanProductName = product.name.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 10); // First 10 chars
        
        matchingMedia = mediaFiles.find(media => {
          if (!media.original_name) return false;
          const cleanMediaName = media.original_name.toLowerCase()
            .replace(/[^a-z0-9]/g, '');
          return cleanMediaName.includes(cleanProductName) || cleanProductName.includes(cleanMediaName.substring(0, 8));
        });
      }
      
      if (matchingMedia) {
        console.log(`🔗 Linking ${product.name} → ${matchingMedia.original_name} (${matchingMedia.media_id})`);
        
        await productsCollection.updateOne(
          { _id: product._id },
          { 
            $set: { 
              image_id: matchingMedia.media_id,
              updated_at: new Date()
            }
          }
        );
        
        fixedCount++;
      } else {
        console.log(`❌ No matching image found for: ${product.name}`);
        notFoundCount++;
      }
    }
    
    console.log('\n📊 Results:');
    console.log(`✅ Fixed: ${fixedCount} products`);
    console.log(`❌ Not found: ${notFoundCount} products`);
    console.log(`⏭️ Already had images: ${products.length - fixedCount - notFoundCount} products`);
    
  } catch (error) {
    console.error('❌ Error fixing product images:', error);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixProductImages()
    .then(() => {
      console.log('🎉 Product images fix completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixProductImages;