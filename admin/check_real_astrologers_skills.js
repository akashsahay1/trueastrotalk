const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

// Client's approved skills list
const approvedSkills = [
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

async function checkRealAstrologersSkills() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Get all real astrologers (NOT test ones with @trueastrotalk.com)
    const realAstrologers = await usersCollection.find({
      user_type: 'astrologer',
      email_address: { $not: { $regex: /@trueastrotalk\.com$/ } }
    }).toArray();
    
    console.log(`Found ${realAstrologers.length} real astrologers (non-test)`);
    
    if (realAstrologers.length === 0) {
      console.log('No real astrologers found, only test data exists.');
      return;
    }
    
    console.log('\nChecking real astrologers for non-approved skills...');
    
    let astrologersNeedingUpdate = [];
    let allInvalidSkills = new Set();
    
    realAstrologers.forEach(astrologer => {
      if (astrologer.skills && Array.isArray(astrologer.skills)) {
        const invalidSkills = astrologer.skills.filter(skill => 
          !approvedSkills.includes(skill)
        );
        
        if (invalidSkills.length > 0) {
          astrologersNeedingUpdate.push({
            _id: astrologer._id,
            name: astrologer.full_name,
            email: astrologer.email_address,
            currentSkills: astrologer.skills,
            invalidSkills: invalidSkills,
            validSkills: astrologer.skills.filter(skill => 
              approvedSkills.includes(skill)
            )
          });
          
          invalidSkills.forEach(skill => allInvalidSkills.add(skill));
        }
      }
    });
    
    if (astrologersNeedingUpdate.length === 0) {
      console.log('✅ All real astrologers already have approved skills only!');
      return;
    }
    
    console.log(`\n❌ Found ${astrologersNeedingUpdate.length} real astrologers with non-approved skills:`);
    console.log('\nInvalid skills found:');
    Array.from(allInvalidSkills).sort().forEach((skill, index) => {
      console.log(`${index + 1}. "${skill}"`);
    });
    
    console.log('\nAstrologers needing update:');
    astrologersNeedingUpdate.forEach((astrologer, index) => {
      console.log(`\n${index + 1}. ${astrologer.name} (${astrologer.email})`);
      console.log(`   Invalid skills: ${astrologer.invalidSkills.join(', ')}`);
      console.log(`   Valid skills to keep: ${astrologer.validSkills.join(', ')}`);
    });
    
    console.log('\n⚠️  Do you want me to update these real astrologers?');
    console.log('I will:');
    console.log('- Remove invalid skills');
    console.log('- Keep only client-approved skills');
    console.log('- Update their bios accordingly');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkRealAstrologersSkills();