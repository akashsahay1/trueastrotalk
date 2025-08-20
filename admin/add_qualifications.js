const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

// Sample realistic qualifications that astrologers might add themselves
const sampleQualifications = [
  'B.A. in Sanskrit',
  'M.A. in Vedic Astrology', 
  'Diploma in Astrology',
  'Certificate in Palmistry',
  'B.Tech in Computer Science',
  'M.Com in Finance',
  'Traditional Vedic Training',
  'Certificate in Numerology',
  'Jyotish Acharya',
  'KP Astrology Certified',
  'Vastu Consultant Certificate',
  'Tarot Reading Course',
  'Ph.D. in Philosophy',
  'M.A. in Psychology',
  'Certificate in Counseling',
  'Traditional Guru Training',
  'B.Sc. in Mathematics',
  'Certified Life Coach',
  'Reiki Master',
  'Crystal Healing Certificate'
];

async function addQualifications() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Get all astrologers without qualifications
    const astrologers = await usersCollection.find({
      user_type: 'astrologer',
      $or: [
        { qualifications: { $exists: false } },
        { qualifications: { $size: 0 } },
        { qualifications: null }
      ]
    }).toArray();
    
    console.log(`Found ${astrologers.length} astrologers needing qualifications`);
    
    let updateCount = 0;
    for (const astrologer of astrologers) {
      // Give each astrologer 1-3 random qualifications
      const numQualifications = 1 + Math.floor(Math.random() * 3);
      const selectedQualifications = [];
      const qualificationsCopy = [...sampleQualifications];
      
      for (let i = 0; i < numQualifications && qualificationsCopy.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * qualificationsCopy.length);
        selectedQualifications.push(qualificationsCopy[randomIndex]);
        qualificationsCopy.splice(randomIndex, 1);
      }
      
      await usersCollection.updateOne(
        { _id: astrologer._id },
        { 
          $set: { 
            qualifications: selectedQualifications,
            updated_at: new Date()
          }
        }
      );
      
      updateCount++;
      const type = astrologer.email_address.includes('@trueastrotalk.com') ? '(TEST)' : '(REAL)';
      console.log(`${updateCount}. ${astrologer.full_name} ${type}: ${selectedQualifications.join(', ')}`);
    }
    
    console.log(`\n✅ Added qualifications to ${updateCount} astrologers`);
    console.log('\nNote: These are free-text qualifications that astrologers can edit/add more to');
    console.log('They can use the + icon to keep adding more qualifications');
    
  } catch (error) {
    console.error('Error adding qualifications:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

addQualifications();