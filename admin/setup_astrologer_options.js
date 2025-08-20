const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

// Proper astrologer skills based on common astrology services
const astrologerSkills = [
  'Vedic Astrology',
  'Western Astrology', 
  'Numerology',
  'Palmistry',
  'Tarot Reading',
  'Vastu Shastra',
  'Gemology',
  'Face Reading',
  'Horary Astrology',
  'Prashna Astrology',
  'KP Astrology',
  'Lal Kitab',
  'Ashtakavarga',
  'Muhurta',
  'Relationship Counseling',
  'Career Guidance',
  'Health Astrology',
  'Financial Astrology',
  'Love and Marriage',
  'Child Astrology'
];

const astrologerLanguages = [
  'Hindi',
  'English', 
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Urdu',
  'Sanskrit'
];

const astrologerQualifications = [
  'Ph.D. in Astrology',
  'M.A. in Vedic Astrology',
  'Certified Astrologer',
  'Jyotish Acharya',
  'Jyotish Visharad',
  'Vastu Expert',
  'Certified Numerologist',
  'Tarot Master',
  'B.A. in Sanskrit',
  'Diploma in Astrology',
  'Certificate in Palmistry',
  'KP Astrology Certified'
];

async function setupAstrologerOptions() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const optionsCollection = db.collection('astrologer_options');
    
    // Clear existing options
    await optionsCollection.deleteMany({});
    console.log('Cleared existing astrologer options');
    
    // Insert proper options
    const options = [
      {
        type: 'skills',
        label: 'Astrology Skills',
        values: astrologerSkills,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        type: 'languages',
        label: 'Languages',
        values: astrologerLanguages,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        type: 'qualifications',
        label: 'Qualifications',
        values: astrologerQualifications,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    const result = await optionsCollection.insertMany(options);
    console.log(`Inserted ${result.insertedCount} option categories`);
    
    // Show what was inserted
    console.log('\nSetup completed:');
    console.log(`- Skills: ${astrologerSkills.length} options`);
    console.log(`- Languages: ${astrologerLanguages.length} options`);
    console.log(`- Qualifications: ${astrologerQualifications.length} options`);
    
    console.log('\nAvailable Skills:');
    astrologerSkills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill}`);
    });
    
  } catch (error) {
    console.error('Error setting up astrologer options:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

setupAstrologerOptions();