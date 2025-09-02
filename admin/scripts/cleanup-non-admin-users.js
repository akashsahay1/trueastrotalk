#!/usr/bin/env node

/**
 * Script to remove all non-administrator users from MongoDB
 * 
 * This will:
 * 1. Create a backup of all user data before deletion
 * 2. Remove all users except those with user_type: 'administrator'
 * 3. Also clean up related data (sessions, wallet transactions, etc.)
 * 
 * CAUTION: This is a destructive operation!
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'trueastrotalkDB';

async function cleanupNonAdminUsers() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    // First, let's analyze what we have
    console.log('\n📊 Current database state:');
    
    const totalUsers = await usersCollection.countDocuments();
    const adminUsers = await usersCollection.countDocuments({ user_type: 'administrator' });
    const customerUsers = await usersCollection.countDocuments({ user_type: 'customer' });
    const astrologerUsers = await usersCollection.countDocuments({ user_type: 'astrologer' });
    const managerUsers = await usersCollection.countDocuments({ user_type: 'manager' });
    const otherUsers = totalUsers - adminUsers - customerUsers - astrologerUsers - managerUsers;
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`- Administrators: ${adminUsers}`);
    console.log(`- Customers: ${customerUsers}`);
    console.log(`- Astrologers: ${astrologerUsers}`);
    console.log(`- Managers: ${managerUsers}`);
    console.log(`- Other types: ${otherUsers}`);
    
    if (adminUsers === 0) {
      console.log('⚠️  WARNING: No administrator users found! Aborting to prevent lockout.');
      return;
    }
    
    // Show admin users that will be kept
    const adminUsersList = await usersCollection.find({ user_type: 'administrator' }).toArray();
    console.log('\n👤 Administrator users that will be KEPT:');
    adminUsersList.forEach(admin => {
      console.log(`  - ${admin.full_name || admin.name || 'Unknown'} (${admin.email_address || admin.email})`);
    });
    
    const usersToDelete = totalUsers - adminUsers;
    if (usersToDelete === 0) {
      console.log('\n✅ No non-admin users to delete. Database is already clean.');
      return;
    }
    
    console.log(`\n⚠️  About to DELETE ${usersToDelete} non-administrator users!`);
    
    // Create backup directory
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(backupDir, `users-backup-${timestamp}.json`);
    
    // Step 1: Backup all user data
    console.log('\n💾 Creating backup of all users...');
    const allUsers = await usersCollection.find({}).toArray();
    fs.writeFileSync(backupFile, JSON.stringify(allUsers, null, 2));
    console.log(`✅ Backup created: ${backupFile}`);
    
    // Step 2: Get list of user IDs to delete (for cleaning up related data)
    const nonAdminUsers = await usersCollection.find({ 
      user_type: { $ne: 'administrator' } 
    }, { 
      projection: { _id: 1, user_id: 1, email_address: 1, email: 1 } 
    }).toArray();
    
    const userIdsToDelete = nonAdminUsers.map(u => u._id.toString());
    const userStringIdsToDelete = nonAdminUsers.map(u => u.user_id || u._id.toString()).filter(Boolean);
    const userEmailsToDelete = nonAdminUsers.map(u => u.email_address || u.email).filter(Boolean);
    
    console.log(`\n🗑️  Will delete ${userIdsToDelete.length} users and their related data...`);
    
    // Step 3: Delete related data first (to maintain referential integrity)
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n🧹 Cleaning up related data...');
    
    // Clean up sessions
    if (collectionNames.includes('sessions')) {
      const sessionsCollection = db.collection('sessions');
      const deletedSessions = await sessionsCollection.deleteMany({
        $or: [
          { customer_id: { $in: userIdsToDelete } },
          { astrologer_id: { $in: userIdsToDelete } },
          { customer_id: { $in: userStringIdsToDelete } },
          { astrologer_id: { $in: userStringIdsToDelete } }
        ]
      });
      console.log(`  ✅ Deleted ${deletedSessions.deletedCount} sessions`);
    }
    
    // Clean up wallet transactions
    if (collectionNames.includes('wallet_transactions')) {
      const walletCollection = db.collection('wallet_transactions');
      const deletedTransactions = await walletCollection.deleteMany({
        $or: [
          { user_id: { $in: userIdsToDelete } },
          { user_id: { $in: userStringIdsToDelete } }
        ]
      });
      console.log(`  ✅ Deleted ${deletedTransactions.deletedCount} wallet transactions`);
    }
    
    // Clean up orders/purchases
    if (collectionNames.includes('orders')) {
      const ordersCollection = db.collection('orders');
      const deletedOrders = await ordersCollection.deleteMany({
        $or: [
          { customer_id: { $in: userIdsToDelete } },
          { customer_id: { $in: userStringIdsToDelete } },
          { customer_email: { $in: userEmailsToDelete } }
        ]
      });
      console.log(`  ✅ Deleted ${deletedOrders.deletedCount} orders`);
    }
    
    // Clean up reviews/ratings
    if (collectionNames.includes('reviews')) {
      const reviewsCollection = db.collection('reviews');
      const deletedReviews = await reviewsCollection.deleteMany({
        $or: [
          { customer_id: { $in: userIdsToDelete } },
          { astrologer_id: { $in: userIdsToDelete } },
          { customer_id: { $in: userStringIdsToDelete } },
          { astrologer_id: { $in: userStringIdsToDelete } }
        ]
      });
      console.log(`  ✅ Deleted ${deletedReviews.deletedCount} reviews`);
    }
    
    // Clean up notifications
    if (collectionNames.includes('notifications')) {
      const notificationsCollection = db.collection('notifications');
      const deletedNotifications = await notificationsCollection.deleteMany({
        $or: [
          { user_id: { $in: userIdsToDelete } },
          { user_id: { $in: userStringIdsToDelete } },
          { recipient_email: { $in: userEmailsToDelete } }
        ]
      });
      console.log(`  ✅ Deleted ${deletedNotifications.deletedCount} notifications`);
    }
    
    // Clean up chat messages
    if (collectionNames.includes('chat_messages')) {
      const chatCollection = db.collection('chat_messages');
      const deletedMessages = await chatCollection.deleteMany({
        $or: [
          { sender_id: { $in: userIdsToDelete } },
          { receiver_id: { $in: userIdsToDelete } },
          { sender_id: { $in: userStringIdsToDelete } },
          { receiver_id: { $in: userStringIdsToDelete } }
        ]
      });
      console.log(`  ✅ Deleted ${deletedMessages.deletedCount} chat messages`);
    }
    
    // Clean up media files (profile images, etc.)
    if (collectionNames.includes('media')) {
      const mediaCollection = db.collection('media');
      const deletedMedia = await mediaCollection.deleteMany({
        $or: [
          { uploaded_by: { $in: userIdsToDelete } },
          { uploaded_by: { $in: userStringIdsToDelete } },
          { user_id: { $in: userIdsToDelete } },
          { user_id: { $in: userStringIdsToDelete } }
        ]
      });
      console.log(`  ✅ Deleted ${deletedMedia.deletedCount} media files`);
    }
    
    // Step 4: Finally, delete the non-admin users
    console.log('\n🗑️  Deleting non-administrator users...');
    const deleteResult = await usersCollection.deleteMany({ 
      user_type: { $ne: 'administrator' } 
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} non-administrator users`);
    
    // Step 5: Verify final state
    console.log('\n📊 Final database state:');
    const finalUserCount = await usersCollection.countDocuments();
    const finalAdminCount = await usersCollection.countDocuments({ user_type: 'administrator' });
    
    console.log(`Total users remaining: ${finalUserCount}`);
    console.log(`Administrator users: ${finalAdminCount}`);
    
    if (finalUserCount === finalAdminCount && finalAdminCount > 0) {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('   - All non-administrator users have been removed');
      console.log('   - Administrator access preserved');
      console.log(`   - Backup saved to: ${backupFile}`);
    } else {
      console.log('\n⚠️  Unexpected final state. Please review the results.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
console.log('⚠️  WARNING: This will DELETE all non-administrator users!');
console.log('This action cannot be undone (except from backup).');
console.log('Starting cleanup in 3 seconds...\n');

setTimeout(() => {
  cleanupNonAdminUsers().catch(console.error);
}, 3000);