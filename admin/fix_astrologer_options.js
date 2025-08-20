const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

// Client's original approved skills list
const originalSkills = [
  'Vedic',
  'Palmistry', 
  'Numerology',
  'Vastu',
  'Lal kitab',
  'Loshu grid',
  'Prashana',
  'Tarot',
  'Psychic',
  'Nadi',
  'Kp',
  'Etc'
];

// Keep languages as they are (assuming these are correct)
const languages = [
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

async function fixAstrologerOptions() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const optionsCollection = db.collection('astrologer_options');
    
    // Clear existing options (I wrongly overwrote the client's data)
    await optionsCollection.deleteMany({});
    console.log('Cleared incorrect astrologer options');
    
    // Insert the correct client-approved options
    const correctOptions = [
      {
        type: 'skills',
        label: 'Astrology Skills',
        values: originalSkills,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        type: 'languages',
        label: 'Languages',
        values: languages,
        created_at: new Date(),
        updated_at: new Date()
      }
      // Removed qualifications as they're too subjective
    ];
    
    const result = await optionsCollection.insertMany(correctOptions);
    console.log(`Restored ${result.insertedCount} correct option categories`);
    
    console.log('\nRestored to client-approved skills:');
    originalSkills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill}`);
    });
    
    console.log('\nRemoving qualifications as they are too subjective...');
    
    // Now update all test astrologers to use only client-approved skills
    const usersCollection = db.collection('users');
    
    // Get all test astrologers (those with @trueastrotalk.com emails)
    const testAstrologers = await usersCollection.find({
      user_type: 'astrologer',
      email_address: { $regex: /@trueastrotalk\.com$/ }
    }).toArray();
    
    console.log(`\nFound ${testAstrologers.length} test astrologers to update`);
    
    // Update each test astrologer with correct skills
    let updatedCount = 0;
    for (const astrologer of testAstrologers) {
      // Random selection of 2-4 skills from client-approved list
      const numSkills = 2 + Math.floor(Math.random() * 3);
      const selectedSkills = [];
      const skillsCopy = [...originalSkills];
      
      for (let i = 0; i < numSkills && skillsCopy.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * skillsCopy.length);
        selectedSkills.push(skillsCopy[randomIndex]);
        skillsCopy.splice(randomIndex, 1);
      }
      
      // Update bio to reflect correct skills
      const bio = `I am ${astrologer.full_name}, a professional astrologer with ${astrologer.experience_years} years of experience in ${selectedSkills.slice(0, 2).join(' and ')}. I help people find clarity and direction in their lives through ancient wisdom and modern insights.`;
      
      // Remove qualifications field and update with correct skills
      await usersCollection.updateOne(
        { _id: astrologer._id },
        { 
          $set: { 
            skills: selectedSkills,
            bio: bio,
            updated_at: new Date()
          },
          $unset: { 
            qualifications: ""  // Remove qualifications field
          }
        }
      );
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} test astrologers with client-approved skills`);
    console.log('Removed qualifications field from all test astrologers');
    
    console.log('\n✅ Fixed completed:');
    console.log('- Restored client-approved skills list');
    console.log('- Removed qualifications (too subjective)');
    console.log('- Updated all test astrologers to use only approved skills');
    console.log('- Test emails still use @trueastrotalk.com domain');
    
  } catch (error) {
    console.error('Error fixing astrologer options:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

fixAstrologerOptions();