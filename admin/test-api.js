#!/usr/bin/env node

/**
 * API Testing Script for TrueAstroTalk Backend
 * Tests all the implemented API endpoints
 */

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  phone: '9876543210'
};

const testAstrologer = {
  full_name: 'Test Astrologer',
  email_address: 'astrologer@example.com',
  phone: '9876543211'
};

const testProduct = {
  name: 'Crystal Healing Set',
  description: 'Premium crystal healing set for spiritual wellness',
  price: 2999,
  original_price: 3999,
  category: 'Crystals',
  stock_quantity: 50,
  tags: ['healing', 'crystals', 'wellness']
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url.toString(), options);
    const result = await response.json();
    
    console.log(`\n📡 ${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    
    return { response, result };
  } catch (error) {
    console.error(`\n❌ Error testing ${method} ${endpoint}:`, error.message);
    return { error };
  }
}

// Test suite
async function runTests() {
  console.log('🚀 Starting TrueAstroTalk API Tests\n');
  console.log('=' .repeat(50));

  try {
    // 1. Test Products API
    console.log('\n📦 TESTING PRODUCTS API');
    console.log('-'.repeat(30));
    
    // Create product
    const { result: createdProduct } = await apiCall('/products', 'POST', testProduct);
    const productId = createdProduct?.product_id;
    
    // Get all products
    await apiCall('/products', 'GET', null, { limit: 5 });
    
    // Get single product
    if (productId) {
      await apiCall(`/products/${productId}`, 'GET');
      
      // Update product
      await apiCall(`/products/${productId}`, 'PUT', { 
        price: 2799,
        is_featured: true 
      });
    }

    // 2. Test Cart API
    console.log('\n🛒 TESTING CART API');
    console.log('-'.repeat(30));
    
    const testUserId = '507f1f77bcf86cd799439011'; // Mock user ID
    
    // Add to cart
    if (productId) {
      await apiCall('/cart', 'POST', {
        user_id: testUserId,
        product_id: productId,
        quantity: 2
      });
    }
    
    // Get cart
    await apiCall('/cart', 'GET', null, { userId: testUserId });

    // 3. Test Addresses API
    console.log('\n🏠 TESTING ADDRESSES API');
    console.log('-'.repeat(30));
    
    // Create address
    const testAddress = {
      user_id: testUserId,
      label: 'Home',
      full_name: 'Test User',
      phone_number: '9876543210',
      address_line_1: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      is_default: true
    };
    
    await apiCall('/addresses', 'POST', testAddress);
    await apiCall('/addresses', 'GET', null, { userId: testUserId });

    // 4. Test Chat API
    console.log('\n💬 TESTING CHAT API');
    console.log('-'.repeat(30));
    
    const testAstrologerId = '507f1f77bcf86cd799439012'; // Mock astrologer ID
    
    // Create chat session
    const { result: chatSession } = await apiCall('/chat', 'POST', {
      user_id: testUserId,
      astrologer_id: testAstrologerId
    });
    
    const sessionId = chatSession?.session_id;
    
    // Get chat sessions
    await apiCall('/chat', 'GET', null, { 
      userId: testUserId,
      userType: 'user' 
    });
    
    // Send message
    if (sessionId) {
      await apiCall('/chat/messages', 'POST', {
        session_id: sessionId,
        sender_id: testUserId,
        sender_name: 'Test User',
        sender_type: 'user',
        content: 'Hello, I need astrological guidance!'
      });
      
      // Get messages
      await apiCall('/chat/messages', 'GET', null, {
        sessionId: sessionId,
        userId: testUserId,
        userType: 'user'
      });
    }

    // 5. Test Calls API
    console.log('\n📞 TESTING CALLS API');
    console.log('-'.repeat(30));
    
    // Create call session
    const { result: callSession } = await apiCall('/calls', 'POST', {
      user_id: testUserId,
      astrologer_id: testAstrologerId,
      call_type: 'voice'
    });
    
    const callSessionId = callSession?.session_id;
    
    // Get call sessions
    await apiCall('/calls', 'GET', null, {
      userId: testUserId,
      userType: 'user'
    });

    // 6. Test Notifications API
    console.log('\n🔔 TESTING NOTIFICATIONS API');
    console.log('-'.repeat(30));
    
    // Send push notification
    await apiCall('/notifications/push', 'POST', {
      type: 'test_notification',
      recipient_id: testUserId,
      recipient_type: 'user',
      title: 'Test Notification',
      message: 'This is a test notification from API testing',
      data: { test: true }
    });
    
    // Get notifications
    await apiCall('/notifications/push', 'GET', null, {
      recipientId: testUserId,
      recipientType: 'user'
    });

    // 7. Test Email Notifications API
    console.log('\n📧 TESTING EMAIL NOTIFICATIONS API');
    console.log('-'.repeat(30));
    
    // Send email notification
    await apiCall('/notifications/email', 'POST', {
      type: 'order_confirmation',
      recipient_email: 'test@example.com',
      recipient_name: 'Test User',
      data: {
        order_number: 'ORD-TEST-001',
        order_date: new Date().toISOString(),
        payment_method: 'online',
        items: [{
          product_name: 'Crystal Healing Set',
          quantity: 1,
          price: 2999,
          total: 2999
        }],
        subtotal: 2999,
        shipping_cost: 0,
        tax_amount: 360,
        total_amount: 3359,
        shipping_address: {
          full_name: 'Test User',
          phone_number: '9876543210',
          address_line_1: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400001'
        }
      }
    });

    // 8. Test Socket API
    console.log('\n🔌 TESTING SOCKET API');
    console.log('-'.repeat(30));
    
    // Get socket status
    await apiCall('/socket', 'GET');
    
    // Test socket actions
    await apiCall('/socket', 'POST', {
      action: 'get_online_astrologers',
      data: {}
    });

    console.log('\n✅ API Testing Complete!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, apiCall };