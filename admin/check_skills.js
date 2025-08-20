const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

async function checkSkills() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    // Check astrologer_options collection for skills
    const optionsCollection = db.collection('astrologer_options');
    const skillsDoc = await optionsCollection.findOne({ type: 'skills' });
    
    if (skillsDoc && skillsDoc.values) {
      console.log('Available Skills in Database:');
      console.log('===========================');
      skillsDoc.values.forEach((skill, index) => {
        console.log(`${index + 1}. ${skill}`);
      });
      console.log('\nTotal skills:', skillsDoc.values.length);
      
      // Also return as array for copying
      console.log('\nArray format for script:');
      console.log(JSON.stringify(skillsDoc.values, null, 2));
    } else {
      console.log('No skills found in astrologer_options collection');
      
      // Check if collection exists
      const collections = await db.listCollections().toArray();
      console.log('\nAvailable collections:');
      collections.forEach(col => console.log('- ' + col.name));
      
      // Check what documents exist in astrologer_options
      const allOptions = await optionsCollection.find({}).toArray();
      console.log('\nDocuments in astrologer_options:');
      allOptions.forEach(doc => {
        console.log('- Type:', doc.type, 'Values count:', doc.values ? doc.values.length : 0);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkSkills();