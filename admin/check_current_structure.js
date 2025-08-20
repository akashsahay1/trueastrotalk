const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

async function checkCurrentStructure() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    // Check current astrologer_options structure
    const optionsCollection = db.collection('astrologer_options');
    const allOptions = await optionsCollection.find({}).toArray();
    
    console.log('Current astrologer_options structure:');
    console.log('===================================');
    
    if (allOptions.length === 0) {
      console.log('No documents found in astrologer_options');
    } else {
      allOptions.forEach((doc, index) => {
        console.log(`\nDocument ${index + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }
    
    // Check what skills are actually used by existing astrologers
    const usersCollection = db.collection('users');
    const astrologers = await usersCollection.find({
      user_type: 'astrologer',
      skills: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log('\n\nSkills used by existing astrologers:');
    console.log('===================================');
    
    const allSkillsUsed = new Set();
    astrologers.forEach(astrologer => {
      if (astrologer.skills && Array.isArray(astrologer.skills)) {
        astrologer.skills.forEach(skill => allSkillsUsed.add(skill));
      }
    });
    
    console.log('Unique skills in use:');
    Array.from(allSkillsUsed).sort().forEach((skill, index) => {
      console.log(`${index + 1}. ${skill}`);
    });
    
    console.log(`\nTotal unique skills: ${allSkillsUsed.size}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCurrentStructure();