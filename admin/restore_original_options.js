const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

async function restoreOriginalOptions() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('What are the current astrologer_options in the database?');
    console.log('Please provide the original skills list that your client gave you.');
    console.log('I will restore the database to use only those skills.');
    console.log('\nCurrent structure shows I overwrote your client\'s data.');
    console.log('I should restore it and update the test astrologers instead.');
    
    // Just show current state for now
    const optionsCollection = db.collection('astrologer_options');
    const currentOptions = await optionsCollection.find({}).toArray();
    
    console.log('\nCurrent options I wrongly set:');
    currentOptions.forEach(option => {
      console.log(`\n${option.type}:`);
      if (option.values) {
        option.values.forEach((value, index) => {
          console.log(`  ${index + 1}. ${value}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

restoreOriginalOptions();