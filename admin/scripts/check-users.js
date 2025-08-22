#!/usr/bin/env node

const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function checkUsers() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`\n📊 Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`);
      console.log(`   Email: ${user.email_address}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   Status: ${user.account_status}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`   Auth Type: ${user.auth_type || 'email'}`);
      if (user.password) {
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      }
    });
    
    // Check specifically for admin users
    const adminUsers = await usersCollection.find({ 
      user_type: 'administrator' 
    }).toArray();
    
    console.log(`\n🔑 Admin users found: ${adminUsers.length}`);
    adminUsers.forEach((admin) => {
      console.log(`   - ${admin.email_address} (${admin.account_status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();