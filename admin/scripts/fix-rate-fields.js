#!/usr/bin/env node

/**
 * Migration script to fix rate field inconsistencies in MongoDB
 * 
 * Current issue:
 * - Some documents have rates in commission_rates object
 * - Some have rates as direct fields (call_rate, chat_rate, video_rate)
 * - This causes data integrity issues
 * 
 * Solution:
 * - Use direct fields (call_rate, chat_rate, video_rate) for service rates
 * - Remove commission_rates object OR repurpose it for actual commission percentages
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'trueastrotalkDB';

async function migrateRateFields() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    // First, let's analyze the current state
    console.log('\n📊 Analyzing current data structure...');
    
    const totalUsers = await usersCollection.countDocuments();
    const usersWithCommissionRates = await usersCollection.countDocuments({ commission_rates: { $exists: true } });
    const usersWithDirectRates = await usersCollection.countDocuments({ 
      $or: [
        { call_rate: { $exists: true } },
        { chat_rate: { $exists: true } },
        { video_rate: { $exists: true } }
      ]
    });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with commission_rates object: ${usersWithCommissionRates}`);
    console.log(`Users with direct rate fields: ${usersWithDirectRates}`);
    
    // Get a sample of users with both structures
    const sampleWithBoth = await usersCollection.findOne({
      commission_rates: { $exists: true },
      call_rate: { $exists: true }
    });
    
    if (sampleWithBoth) {
      console.log('\n📋 Sample user with both structures:');
      console.log(`  Direct rates - Call: ${sampleWithBoth.call_rate}, Chat: ${sampleWithBoth.chat_rate}, Video: ${sampleWithBoth.video_rate}`);
      console.log(`  Commission rates - Call: ${sampleWithBoth.commission_rates?.call_rate}, Chat: ${sampleWithBoth.commission_rates?.chat_rate}, Video: ${sampleWithBoth.commission_rates?.video_rate}`);
    }
    
    // Migration strategy
    console.log('\n🔄 Starting migration...');
    
    // Step 1: For users with commission_rates but no direct rates, copy commission_rates values to direct fields
    const migrateFromCommissionRates = await usersCollection.updateMany(
      {
        commission_rates: { $exists: true },
        call_rate: { $exists: false }
      },
      [
        {
          $set: {
            call_rate: { $ifNull: ['$commission_rates.call_rate', 50] },
            chat_rate: { $ifNull: ['$commission_rates.chat_rate', 30] },
            video_rate: { $ifNull: ['$commission_rates.video_rate', 80] }
          }
        }
      ]
    );
    
    console.log(`✅ Migrated ${migrateFromCommissionRates.modifiedCount} users from commission_rates to direct fields`);
    
    // Step 2: For astrologers, ensure they have reasonable default rates if missing
    const updateAstrologersWithoutRates = await usersCollection.updateMany(
      {
        user_type: 'astrologer',
        $or: [
          { call_rate: { $exists: false } },
          { call_rate: null },
          { call_rate: 0 }
        ]
      },
      {
        $set: {
          call_rate: 50,
          chat_rate: 30,
          video_rate: 80
        }
      }
    );
    
    console.log(`✅ Set default rates for ${updateAstrologersWithoutRates.modifiedCount} astrologers without rates`);
    
    // Step 3: Create commission_percentage field for actual commission percentages
    // Default commission structure: Platform takes 30% for calls, 35% for chat, 25% for video
    const addCommissionPercentages = await usersCollection.updateMany(
      {
        user_type: 'astrologer',
        commission_percentage: { $exists: false }
      },
      {
        $set: {
          commission_percentage: {
            call: 70,  // Astrologer gets 70%
            chat: 65,  // Astrologer gets 65%
            video: 75  // Astrologer gets 75%
          }
        }
      }
    );
    
    console.log(`✅ Added commission_percentage field to ${addCommissionPercentages.modifiedCount} astrologers`);
    
    // Step 4: Remove the confusing commission_rates field
    const removeCommissionRates = await usersCollection.updateMany(
      { commission_rates: { $exists: true } },
      { $unset: { commission_rates: '' } }
    );
    
    console.log(`✅ Removed commission_rates field from ${removeCommissionRates.modifiedCount} users`);
    
    // Step 5: Ensure all rate fields are numbers, not strings
    const users = await usersCollection.find({
      user_type: 'astrologer'
    }).toArray();
    
    let convertedCount = 0;
    for (const user of users) {
      let needsUpdate = false;
      const update = {};
      
      if (typeof user.call_rate === 'string') {
        update.call_rate = parseFloat(user.call_rate) || 50;
        needsUpdate = true;
      }
      if (typeof user.chat_rate === 'string') {
        update.chat_rate = parseFloat(user.chat_rate) || 30;
        needsUpdate = true;
      }
      if (typeof user.video_rate === 'string') {
        update.video_rate = parseFloat(user.video_rate) || 80;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: update }
        );
        convertedCount++;
      }
    }
    
    console.log(`✅ Converted ${convertedCount} string rates to numbers`);
    
    // Final verification
    console.log('\n📊 Final data structure:');
    
    const finalUsersWithDirectRates = await usersCollection.countDocuments({ 
      user_type: 'astrologer',
      call_rate: { $exists: true },
      chat_rate: { $exists: true },
      video_rate: { $exists: true }
    });
    
    const finalUsersWithCommissionPercentage = await usersCollection.countDocuments({
      user_type: 'astrologer',
      commission_percentage: { $exists: true }
    });
    
    const finalUsersWithOldCommissionRates = await usersCollection.countDocuments({
      commission_rates: { $exists: true }
    });
    
    console.log(`Astrologers with service rates: ${finalUsersWithDirectRates}`);
    console.log(`Astrologers with commission percentages: ${finalUsersWithCommissionPercentage}`);
    console.log(`Users still with old commission_rates: ${finalUsersWithOldCommissionRates}`);
    
    // Sample final structure
    const sampleFinal = await usersCollection.findOne({ user_type: 'astrologer' });
    if (sampleFinal) {
      console.log('\n📋 Sample astrologer after migration:');
      console.log(`  Service rates - Call: ₹${sampleFinal.call_rate}/min, Chat: ₹${sampleFinal.chat_rate}/min, Video: ₹${sampleFinal.video_rate}/min`);
      console.log(`  Commission % - Call: ${sampleFinal.commission_percentage?.call}%, Chat: ${sampleFinal.commission_percentage?.chat}%, Video: ${sampleFinal.commission_percentage?.video}%`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateRateFields().catch(console.error);