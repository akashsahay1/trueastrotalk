#!/usr/bin/env node

/**
 * Simple Firebase Admin SDK test script
 * Run with: node test-firebase.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function testFirebase() {
  console.log('\n=== Firebase Admin SDK Test ===\n');

  // Step 1: Check service account file
  const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
  console.log('1. Service account path:', serviceAccountPath);

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account file NOT FOUND');
    process.exit(1);
  }
  console.log('✅ Service account file exists');

  // Step 2: Read and validate JSON
  let serviceAccount;
  try {
    const content = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(content);
    console.log('✅ JSON is valid');
    console.log('   - Project ID:', serviceAccount.project_id);
    console.log('   - Client Email:', serviceAccount.client_email);
    console.log('   - Private Key exists:', !!serviceAccount.private_key);
    console.log('   - Private Key length:', serviceAccount.private_key?.length || 0);
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err.message);
    process.exit(1);
  }

  // Step 3: Initialize Firebase with explicit credential
  console.log('\n2. Initializing Firebase Admin SDK...');
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase initialized successfully');
  } catch (err) {
    console.error('❌ Firebase initialization failed:', err.message);
    process.exit(1);
  }

  // Step 4: Try to get an access token (this is what FCM uses)
  console.log('\n3. Testing credential by getting access token...');
  try {
    const token = await admin.app().options.credential.getAccessToken();
    console.log('✅ Access token obtained successfully!');
    console.log('   - Token type:', typeof token.access_token);
    console.log('   - Token length:', token.access_token?.length || 0);
    console.log('   - Expires at:', new Date(token.expires_in * 1000 + Date.now()).toISOString());
  } catch (err) {
    console.error('❌ Failed to get access token:', err.message);
    console.error('   Full error:', err);
    process.exit(1);
  }

  // Step 5: Try to send a test message (dry run)
  console.log('\n4. Testing FCM message send (dry run)...');
  try {
    // Using dryRun to test without actually sending
    const message = {
      token: 'fake-token-for-testing',
      notification: {
        title: 'Test',
        body: 'Test message'
      }
    };

    await admin.messaging().send(message, true); // true = dryRun
    console.log('✅ FCM dry run succeeded (this means auth works!)');
  } catch (err) {
    // We expect an error about invalid token, but NOT an auth error
    if (err.code === 'messaging/invalid-argument' ||
        err.code === 'messaging/registration-token-not-registered' ||
        err.message.includes('not a valid FCM registration token')) {
      console.log('✅ FCM auth works! (Got expected token validation error)');
      console.log('   Error code:', err.code);
    } else if (err.message.includes('Request is missing required authentication credential')) {
      console.error('❌ FCM authentication FAILED');
      console.error('   This is the same error you see in production');
      console.error('   Full error:', err.message);
    } else {
      console.log('⚠️  Got unexpected error:', err.code || err.message);
      console.log('   Full error:', err);
    }
  }

  console.log('\n=== Test Complete ===\n');
}

testFirebase().catch(console.error);
