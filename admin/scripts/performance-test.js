#!/usr/bin/env node

/**
 * Performance testing script for TrueAstroTalk Admin Panel
 * Tests API endpoints and database queries for performance bottlenecks
 */

const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@trueastrotalk.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

let authToken = '';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  fast: 200,      // < 200ms
  acceptable: 500, // < 500ms
  slow: 1000,     // < 1000ms
  // Anything above 1000ms is considered very slow
};

class PerformanceTest {
  constructor() {
    this.results = [];
    this.summary = {
      total: 0,
      passed: 0,
      failed: 0,
      fast: 0,
      acceptable: 0,
      slow: 0,
      verySlow: 0
    };
  }

  async login() {
    console.log('🔐 Logging in to get auth token...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        })
      });

      if (response.ok) {
        // Extract token from cookies
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          const tokenMatch = cookies.match(/auth[-_]token=([^;]+)/);
          if (tokenMatch) {
            authToken = tokenMatch[1];
            console.log('✅ Login successful');
            return true;
          }
        }
      }
      
      console.error('❌ Login failed');
      return false;
      
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return false;
    }
  }

  async testEndpoint(name, url, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      threshold = PERFORMANCE_THRESHOLDS.acceptable
    } = options;

    console.log(`🧪 Testing: ${name}`);
    
    const start = performance.now();
    
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`,
          ...headers
        },
        ...(body && { body: JSON.stringify(body) })
      });

      const end = performance.now();
      const duration = Math.round(end - start);
      
      const success = response.ok;
      const passed = success && duration <= threshold;
      
      // Categorize performance
      let category = 'very-slow';
      if (duration < PERFORMANCE_THRESHOLDS.fast) category = 'fast';
      else if (duration < PERFORMANCE_THRESHOLDS.acceptable) category = 'acceptable';
      else if (duration < PERFORMANCE_THRESHOLDS.slow) category = 'slow';

      const result = {
        name,
        url,
        method,
        duration,
        success,
        passed,
        category,
        status: response.status,
        threshold
      };

      this.results.push(result);
      this.updateSummary(result);
      
      // Log result
      const statusIcon = passed ? '✅' : '❌';
      const perfIcon = this.getPerformanceIcon(category);
      console.log(`   ${statusIcon} ${perfIcon} ${duration}ms (${response.status})`);
      
      if (!success) {
        console.log(`   Error: ${response.statusText}`);
      }
      
      return result;
      
    } catch (error) {
      const end = performance.now();
      const duration = Math.round(end - start);
      
      const result = {
        name,
        url,
        method,
        duration,
        success: false,
        passed: false,
        category: 'error',
        error: error.message,
        threshold
      };

      this.results.push(result);
      this.updateSummary(result);
      
      console.log(`   ❌ ⚠️  ${duration}ms (ERROR: ${error.message})`);
      
      return result;
    }
  }

  getPerformanceIcon(category) {
    switch (category) {
      case 'fast': return '🚀';
      case 'acceptable': return '✅';
      case 'slow': return '⚠️';
      case 'very-slow': return '🐌';
      case 'error': return '💥';
      default: return '❓';
    }
  }

  updateSummary(result) {
    this.summary.total++;
    if (result.success) this.summary.passed++;
    else this.summary.failed++;

    switch (result.category) {
      case 'fast': this.summary.fast++; break;
      case 'acceptable': this.summary.acceptable++; break;
      case 'slow': this.summary.slow++; break;
      case 'very-slow': this.summary.verySlow++; break;
    }
  }

  async runAllTests() {
    console.log('\n🚀 Starting Performance Tests...\n');
    
    // Authentication test
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without authentication');
      return;
    }
    
    console.log('\n📊 Testing API Endpoints...\n');

    // Dashboard and stats
    await this.testEndpoint('Dashboard Stats', '/api/dashboard/stats');
    await this.testEndpoint('Performance Monitor', '/api/admin/performance');
    
    // User management
    await this.testEndpoint('Users List', '/api/users?page=1&limit=20');
    await this.testEndpoint('Users Search', '/api/users?search=test&page=1&limit=10');
    await this.testEndpoint('Customers Only', '/api/users?type=customer&page=1&limit=15');
    await this.testEndpoint('Astrologers Only', '/api/users?type=astrologer&page=1&limit=15');
    
    // Available astrologers
    await this.testEndpoint('Available Astrologers', '/api/astrologers/available?limit=20');
    await this.testEndpoint('Online Astrologers Only', '/api/astrologers/available?online_only=true&limit=10');
    
    // Products and orders
    await this.testEndpoint('Products List', '/api/products?page=1&limit=20');
    await this.testEndpoint('Orders List', '/api/orders?page=1&limit=20');
    
    // Sessions and analytics  
    await this.testEndpoint('Sessions List', '/api/sessions?page=1&limit=20');
    await this.testEndpoint('Sessions Stats', '/api/sessions/stats');
    
    // Notifications
    await this.testEndpoint('Notifications List', '/api/notifications?page=1&limit=20');
    
    // Finance
    await this.testEndpoint('Wallet Transactions', '/api/finance/transactions?page=1&limit=20');
    await this.testEndpoint('Commission Stats', '/api/finance/commissions');
    
    // Media
    await this.testEndpoint('Media Files', '/api/admin/media?page=1&limit=20');
    
    console.log('\n🔧 Testing Performance Optimizations...\n');
    
    // Test caching by hitting same endpoint twice
    const startCache = performance.now();
    await this.testEndpoint('Dashboard Stats (Cache Test)', '/api/dashboard/stats');
    const cacheTime1 = performance.now() - startCache;
    
    const startCache2 = performance.now();
    await this.testEndpoint('Dashboard Stats (Cache Hit)', '/api/dashboard/stats');
    const cacheTime2 = performance.now() - startCache2;
    
    console.log(`\n📈 Cache Performance:`);
    console.log(`   First request: ${Math.round(cacheTime1)}ms`);
    console.log(`   Second request: ${Math.round(cacheTime2)}ms`);
    console.log(`   Cache improvement: ${Math.round(((cacheTime1 - cacheTime2) / cacheTime1) * 100)}%`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 PERFORMANCE TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${this.summary.total}`);
    console.log(`   Passed: ${this.summary.passed} ✅`);
    console.log(`   Failed: ${this.summary.failed} ❌`);
    console.log(`   Success Rate: ${Math.round((this.summary.passed / this.summary.total) * 100)}%`);
    
    console.log(`\n⚡ Performance Distribution:`);
    console.log(`   Fast (< ${PERFORMANCE_THRESHOLDS.fast}ms): ${this.summary.fast} 🚀`);
    console.log(`   Acceptable (< ${PERFORMANCE_THRESHOLDS.acceptable}ms): ${this.summary.acceptable} ✅`);
    console.log(`   Slow (< ${PERFORMANCE_THRESHOLDS.slow}ms): ${this.summary.slow} ⚠️`);
    console.log(`   Very Slow (> ${PERFORMANCE_THRESHOLDS.slow}ms): ${this.summary.verySlow} 🐌`);
    
    // Slowest endpoints
    const slowestEndpoints = this.results
      .filter(r => r.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    if (slowestEndpoints.length > 0) {
      console.log(`\n🐌 Slowest Endpoints:`);
      slowestEndpoints.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name}: ${result.duration}ms`);
      });
    }
    
    // Fastest endpoints
    const fastestEndpoints = this.results
      .filter(r => r.success)
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 5);
    
    if (fastestEndpoints.length > 0) {
      console.log(`\n🚀 Fastest Endpoints:`);
      fastestEndpoints.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name}: ${result.duration}ms`);
      });
    }
    
    // Recommendations
    const verySlowEndpoints = this.results.filter(r => r.category === 'very-slow');
    const slowEndpoints = this.results.filter(r => r.category === 'slow');
    
    if (verySlowEndpoints.length > 0 || slowEndpoints.length > 0) {
      console.log(`\n💡 Recommendations:`);
      
      if (verySlowEndpoints.length > 0) {
        console.log(`   🔥 Priority: Optimize these very slow endpoints:`);
        verySlowEndpoints.forEach(r => {
          console.log(`      - ${r.name} (${r.duration}ms)`);
        });
      }
      
      if (slowEndpoints.length > 0) {
        console.log(`   ⚠️  Consider optimizing these slow endpoints:`);
        slowEndpoints.forEach(r => {
          console.log(`      - ${r.name} (${r.duration}ms)`);
        });
      }
      
      console.log(`\n   🔧 Suggested optimizations:`);
      console.log(`      - Add database indexes for slow queries`);
      console.log(`      - Implement query result caching`);
      console.log(`      - Use aggregation pipelines instead of multiple queries`);
      console.log(`      - Add pagination for large datasets`);
      console.log(`      - Consider CDN for static assets`);
    } else {
      console.log(`\n🎉 Excellent! All endpoints are performing well.`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the performance tests
async function main() {
  const tester = new PerformanceTest();
  
  try {
    await tester.runAllTests();
    tester.generateReport();
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceTest;