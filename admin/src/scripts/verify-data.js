// Verify astrologer options data in database
require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

async function verifyData() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log(`Connected to MongoDB: ${MONGODB_URL}`);
    console.log(`Using database: ${DB_NAME}`);

    const db = client.db(DB_NAME);
    const collection = db.collection('astrologer_options');

    // Count total documents
    const totalCount = await collection.countDocuments();
    console.log(`Total documents: ${totalCount}`);

    // Count by category
    const summary = await collection.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('\nBreakdown by category:');
    summary.forEach(item => {
      console.log(`  ${item._id}: ${item.count} items`);
    });

    // Show sample of languages
    const languages = await collection.find({ category: 'languages' }).limit(10).toArray();
    console.log('\nFirst 10 languages:');
    languages.forEach((lang, index) => {
      console.log(`  ${index + 1}. ${lang.name}`);
    });

    console.log('\nData verification completed!');
  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    await client.close();
  }
}

verifyData();