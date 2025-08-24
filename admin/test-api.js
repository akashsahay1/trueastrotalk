const { MongoClient } = require('mongodb');

async function testActiveOptionsAPI() {
  const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
  const DB_NAME = 'trueastrotalkDB';

  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Simulate the API logic
    const optionsCollection = db.collection('astrologer_options');
    
    const options = await optionsCollection
      .find({ type: { $exists: true }, values: { $exists: true } })
      .toArray();

    console.log('📋 Found options:', options.length);

    const groupedOptions = {
      languages: [],
      skills: []
    };

    for (const option of options) {
      console.log(`Processing option type: ${option.type}`);
      
      if (option.type === 'skills') {
        groupedOptions.skills = option.values
          .filter((val) => val.isActive !== false)
          .map((val) => typeof val === 'string' ? val : val.name);
        console.log('Skills:', groupedOptions.skills);
      } else if (option.type === 'languages') {
        groupedOptions.languages = option.values
          .filter((val) => val.isActive !== false)
          .map((val) => typeof val === 'string' ? val : val.name);
        console.log('Languages:', groupedOptions.languages);
      }
    }

    console.log('\n✅ Final result:');
    console.log(JSON.stringify(groupedOptions, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

testActiveOptionsAPI();