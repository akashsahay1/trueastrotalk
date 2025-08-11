// Script to populate initial astrologer options data
// Run with: node src/scripts/seed-astrologer-options.js

// Load environment variables
require('dotenv').config();

const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

const initialData = {
  languages: [
    'Hindi',
    'English',
    'Sanskrit',
    'Gujarati',
    'Marathi',
    'Bengali',
    'Punjabi',
    'Marwari',
    'Rajasthani',
    'Odia',
    'Telugu',
    'Malayalam',
    'Kannada',
    'Tamil',
    'Konkani',
    'Bhojpuri',
    'Maithili',
    'Santali',
    'Bhili',
    'Assamese',
    'Khasi',
    'Mizo',
    'Manipuri',
    'Ao',
    'Nissi',
    'Kashmiri',
    'Urdu',
    'Nepali'
  ],
  
  skills: [
    'Vedic',
    'Palmistry', 
    'Numerology',
    'Vastu',
    'Lal Kitab',
    'Loshu Grid',
    'Prashana',
    'Tarot',
    'Psychic',
    'Nadi',
    'KP'
  ]
};

async function seedAstrologerOptions() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log(`Connected to MongoDB: ${MONGODB_URL}`);
    console.log(`Using database: ${DB_NAME}`);

    const db = client.db(DB_NAME);
    const collection = db.collection('astrologer_options');

    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing astrologer options');

    const documentsToInsert = [];
    const now = new Date();

    // Prepare documents for insertion
    for (const [category, items] of Object.entries(initialData)) {
      for (const item of items) {
        documentsToInsert.push({
          category,
          name: item,
          isActive: true,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // Insert all documents
    const result = await collection.insertMany(documentsToInsert);
    console.log(`Inserted ${result.insertedCount} astrologer options`);

    // Show summary
    const summary = await collection.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log('Summary:');
    summary.forEach(item => {
      console.log(`  ${item._id}: ${item.count} items`);
    });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding astrologer options:', error);
  } finally {
    await client.close();
  }
}

// Run the seeding function
seedAstrologerOptions();