const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function migrateAstrologerOptions() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('astrologer_options');
    
    // Find old format documents (with 'type' and 'values' fields)
    const oldFormatDocs = await collection.find({
      type: { $exists: true },
      values: { $exists: true }
    }).toArray();
    
    console.log(`Found ${oldFormatDocs.length} old format documents to migrate`);
    
    // Convert each old format document to individual documents
    const newDocuments = [];
    const documentsToRemove = [];
    
    for (const doc of oldFormatDocs) {
      console.log(`Processing ${doc.type} with ${doc.values.length} values`);
      
      // Create individual documents for each value
      for (const value of doc.values) {
        newDocuments.push({
          category: doc.type === 'skills' ? 'skills' : 'languages',
          name: value,
          isActive: true,
          createdAt: doc.created_at || new Date(),
          updatedAt: doc.updated_at || new Date()
        });
      }
      
      // Mark old document for removal
      documentsToRemove.push(doc._id);
    }
    
    if (newDocuments.length > 0) {
      console.log(`Inserting ${newDocuments.length} new individual documents...`);
      const insertResult = await collection.insertMany(newDocuments);
      console.log(`Inserted ${insertResult.insertedCount} documents`);
      
      // Remove old format documents
      console.log(`Removing ${documentsToRemove.length} old format documents...`);
      const deleteResult = await collection.deleteMany({
        _id: { $in: documentsToRemove }
      });
      console.log(`Deleted ${deleteResult.deletedCount} old documents`);
      
      console.log('Migration completed successfully!');
    } else {
      console.log('No documents to migrate');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
migrateAstrologerOptions();