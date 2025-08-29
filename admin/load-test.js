#!/usr/bin/env node

/**
 * Load Testing Script for TrueAstroTalk Platform
 * Target: Support 100+ simultaneous users (customers and astrologers)
 */

const http = require('http');
const https = require('https');

// Configuration
const config = {
  apiBaseUrl: 'http://localhost:4000',
  totalUsers: 100,
  customerRatio: 0.8, // 80% customers, 20% astrologers
  testDuration: 30000, // 30 seconds
  rampUpTime: 5000, // 5 seconds to ramp up all users
};

// Performance metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: null,
  endTime: null,
};

// API endpoints to test
const endpoints = {
  customer: [
    { method: 'GET', path: '/api/products', weight: 3 },
    { method: 'GET', path: '/api/astrologers/available', weight: 3 },
    { method: 'GET', path: '/api/customers/wallet/balance', weight: 2 },
    { method: 'GET', path: '/api/customers/consultations/history', weight: 1 },
    { method: 'GET', path: '/api/cart', weight: 2 },
  ],
  astrologer: [
    { method: 'GET', path: '/api/astrologers/dashboard', weight: 3 },
    { method: 'GET', path: '/api/astrologers/consultations', weight: 2 },
    { method: 'GET', path: '/api/astrologers/earnings', weight: 2 },
    { method: 'GET', path: '/api/sessions/stats', weight: 1 },
  ],
  public: [
    { method: 'GET', path: '/api/app-config', weight: 5 },
    { method: 'GET', path: '/api/public/astrologer-options', weight: 2 },
  ],
};

// Helper function to make HTTP request
function makeRequest(endpoint, userType, userId) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(config.apiBaseUrl + endpoint.path);
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        // Simulate authenticated request
        'x-user-id': userId,
        'x-user-type': userType,
      },
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        metrics.totalRequests++;
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          metrics.successfulRequests++;
          metrics.responseTimes.push(responseTime);
        } else {
          metrics.failedRequests++;
          metrics.errors.push({
            endpoint: endpoint.path,
            status: res.statusCode,
            responseTime,
          });
        }
        
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          responseTime,
          statusCode: res.statusCode,
        });
      });
    });
    
    req.on('error', (error) => {
      metrics.failedRequests++;
      metrics.totalRequests++;
      metrics.errors.push({
        endpoint: endpoint.path,
        error: error.message,
      });
      
      resolve({
        success: false,
        error: error.message,
      });
    });
    
    req.end();
  });
}

// Weighted random selection of endpoints
function selectEndpoint(userType) {
  const endpointList = [...endpoints[userType], ...endpoints.public];
  const totalWeight = endpointList.reduce((sum, ep) => sum + ep.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of endpointList) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return endpointList[0];
}

// Simulate a single user session
async function simulateUser(userId, userType) {
  const sessionDuration = config.testDuration - config.rampUpTime;
  const startTime = Date.now();
  
  while (Date.now() - startTime < sessionDuration) {
    const endpoint = selectEndpoint(userType);
    await makeRequest(endpoint, userType, userId);
    
    // Random delay between requests (100ms to 2000ms)
    const delay = Math.floor(Math.random() * 1900) + 100;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Main load test function
async function runLoadTest() {
  console.log('🚀 Starting Load Test for TrueAstroTalk Platform');
  console.log(`📊 Configuration:`);
  console.log(`   - Total Users: ${config.totalUsers}`);
  console.log(`   - Customers: ${Math.floor(config.totalUsers * config.customerRatio)}`);
  console.log(`   - Astrologers: ${Math.floor(config.totalUsers * (1 - config.customerRatio))}`);
  console.log(`   - Test Duration: ${config.testDuration / 1000}s`);
  console.log(`   - API Base URL: ${config.apiBaseUrl}`);
  console.log('');
  
  metrics.startTime = Date.now();
  
  const users = [];
  const rampUpDelay = config.rampUpTime / config.totalUsers;
  
  // Start users with ramp-up
  for (let i = 0; i < config.totalUsers; i++) {
    const userType = i < config.totalUsers * config.customerRatio ? 'customer' : 'astrologer';
    const userId = `test_${userType}_${i}`;
    
    users.push(simulateUser(userId, userType));
    
    // Ramp-up delay
    if (i < config.totalUsers - 1) {
      await new Promise(resolve => setTimeout(resolve, rampUpDelay));
    }
  }
  
  console.log('⏳ All users started, running test...');
  
  // Wait for all users to complete
  await Promise.all(users);
  
  metrics.endTime = Date.now();
  
  // Calculate statistics
  const totalTime = (metrics.endTime - metrics.startTime) / 1000;
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;
  const minResponseTime = metrics.responseTimes.length > 0
    ? Math.min(...metrics.responseTimes)
    : 0;
  const maxResponseTime = metrics.responseTimes.length > 0
    ? Math.max(...metrics.responseTimes)
    : 0;
  const requestsPerSecond = metrics.totalRequests / totalTime;
  const successRate = (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2);
  
  // Calculate percentiles
  const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📈 LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n📊 Overall Statistics:`);
  console.log(`   - Test Duration: ${totalTime.toFixed(2)}s`);
  console.log(`   - Total Requests: ${metrics.totalRequests}`);
  console.log(`   - Successful: ${metrics.successfulRequests} (${successRate}%)`);
  console.log(`   - Failed: ${metrics.failedRequests}`);
  console.log(`   - Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  
  console.log(`\n⏱️  Response Times:`);
  console.log(`   - Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   - Min: ${minResponseTime}ms`);
  console.log(`   - Max: ${maxResponseTime}ms`);
  console.log(`   - P50 (Median): ${p50}ms`);
  console.log(`   - P95: ${p95}ms`);
  console.log(`   - P99: ${p99}ms`);
  
  // Identify bottlenecks
  console.log(`\n🔍 Bottleneck Analysis:`);
  
  if (p95 > 1000) {
    console.log(`   ⚠️  P95 response time > 1s - Performance optimization needed`);
  } else {
    console.log(`   ✅ P95 response time < 1s - Good performance`);
  }
  
  if (successRate < 99) {
    console.log(`   ⚠️  Success rate < 99% - Reliability issues detected`);
  } else {
    console.log(`   ✅ Success rate >= 99% - Excellent reliability`);
  }
  
  if (maxResponseTime > 5000) {
    console.log(`   ⚠️  Max response time > 5s - Timeout issues possible`);
  } else {
    console.log(`   ✅ Max response time < 5s - No timeout issues`);
  }
  
  if (requestsPerSecond < 50) {
    console.log(`   ⚠️  Throughput < 50 req/s - May struggle with high load`);
  } else {
    console.log(`   ✅ Throughput >= 50 req/s - Good capacity`);
  }
  
  // Show errors if any
  if (metrics.errors.length > 0) {
    console.log(`\n❌ Errors (showing first 10):`);
    metrics.errors.slice(0, 10).forEach(error => {
      console.log(`   - ${error.endpoint}: ${error.status || error.error}`);
    });
  }
  
  // Final verdict
  console.log(`\n${'='.repeat(60)}`);
  if (successRate >= 99 && p95 < 1000 && requestsPerSecond >= 50) {
    console.log('✅ LOAD TEST PASSED - System can handle 100+ simultaneous users');
  } else {
    console.log('⚠️  LOAD TEST NEEDS OPTIMIZATION - See bottleneck analysis above');
  }
  console.log('='.repeat(60));
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const url = new URL(config.apiBaseUrl + '/api/app-config');
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    
    req.on('error', () => {
      resolve(false);
    });
  });
}

// Main execution
async function main() {
  console.log('🔍 Checking server availability...');
  
  const serverAvailable = await checkServer();
  
  if (!serverAvailable) {
    console.error('❌ Server is not running at ' + config.apiBaseUrl);
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  
  await runLoadTest();
}

// Run the test
main().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});