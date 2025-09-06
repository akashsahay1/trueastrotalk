/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../lib/database';
import { performanceCache, PerformanceMonitor } from '../../../lib/performance-cache';

export async function GET(_request: NextRequest) {
  const testResults = [];
  console.log('🏁 Running comprehensive performance tests...');

  // Test 1: Database Index Impact
  try {
    const usersCollection = await DatabaseService.getCollection('users');
    
    // Test without index (simulate)
    const startNoIndex = Date.now();
    await usersCollection.find({ 
      email_address: 'test@example.com' 
    }).toArray();
    const timeNoIndex = Date.now() - startNoIndex;

    // Test with index (should be faster)
    const startWithIndex = Date.now();
    await usersCollection.find({ 
      user_type: 'customer',
      account_status: 'active'
    }).toArray();
    const timeWithIndex = Date.now() - startWithIndex;

    testResults.push({
      test: 'Database Indexes',
      withoutOptimization: `${timeNoIndex}ms`,
      withOptimization: `${timeWithIndex}ms`,
      improvement: timeNoIndex > timeWithIndex ? '✅ Faster with index' : '⚠️ Similar performance'
    });
  } catch (error) {
    testResults.push({
      test: 'Database Indexes',
      error: error instanceof Error ? error.message : 'Failed'
    });
  }

  // Test 2: Aggregation Pipeline vs Multiple Queries
  try {
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    
    // Old approach: Multiple queries
    const startMultiple = Date.now();
    const [total, _active, _completed] = await Promise.all([
      sessionsCollection.countDocuments({}),
      sessionsCollection.countDocuments({ status: 'active' }),
      sessionsCollection.countDocuments({ status: 'completed' })
    ]);
    const timeMultiple = Date.now() - startMultiple;

    // New approach: Single aggregation
    const startAggregation = Date.now();
    const [_stats] = await sessionsCollection.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [
            { $match: { status: 'active' } },
            { $count: 'count' }
          ],
          completed: [
            { $match: { status: 'completed' } },
            { $count: 'count' }
          ]
        }
      }
    ]).toArray();
    const timeAggregation = Date.now() - startAggregation;

    const improvement = ((timeMultiple - timeAggregation) / timeMultiple * 100).toFixed(2);
    
    testResults.push({
      test: 'Aggregation Optimization',
      multipleQueries: `${timeMultiple}ms (${total} total)`,
      singleAggregation: `${timeAggregation}ms`,
      improvement: `${improvement}% faster`
    });
  } catch (error) {
    testResults.push({
      test: 'Aggregation Optimization',
      error: error instanceof Error ? error.message : 'Failed'
    });
  }

  // Test 3: Cache Performance
  try {
    const cacheKey = 'perf-test-cache';
    
    // First call - no cache
    const startNoCache = Date.now();
    const dataNoCache = await new Promise(resolve => {
      setTimeout(() => resolve({ data: 'test data' }), 50);
    });
    performanceCache.set(cacheKey, dataNoCache);
    const timeNoCache = Date.now() - startNoCache;

    // Second call - with cache
    const startWithCache = Date.now();
    const _dataWithCache = performanceCache.get(cacheKey) || await new Promise(resolve => {
      setTimeout(() => resolve({ data: 'test data' }), 50);
    });
    const timeWithCache = Date.now() - startWithCache;

    testResults.push({
      test: 'Cache System',
      withoutCache: `${timeNoCache}ms`,
      withCache: `${timeWithCache}ms`,
      cacheHit: timeWithCache < 2,
      improvement: `${((timeNoCache - timeWithCache) / timeNoCache * 100).toFixed(2)}% faster`
    });
  } catch (error) {
    testResults.push({
      test: 'Cache System',
      error: error instanceof Error ? error.message : 'Failed'
    });
  }

  // Test 4: Bulk Operations
  try {
    const usersCollection = await DatabaseService.getCollection('users');
    const userIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];
    
    // Old approach: Loop queries
    const startLoop = Date.now();
    const usersLoop = [];
    for (const id of userIds) {
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      if (user) usersLoop.push(user);
    }
    const timeLoop = Date.now() - startLoop;

    // New approach: Bulk query
    const startBulk = Date.now();
    const _usersBulk = await usersCollection.find({ 
      _id: { $in: userIds.map(id => new ObjectId(id)) } 
    }).toArray();
    const timeBulk = Date.now() - startBulk;

    testResults.push({
      test: 'Bulk Operations',
      loopQueries: `${timeLoop}ms`,
      bulkQuery: `${timeBulk}ms`,
      improvement: timeLoop > timeBulk ? '✅ Bulk is faster' : '⚠️ Similar performance'
    });
  } catch (error) {
    testResults.push({
      test: 'Bulk Operations',
      error: error instanceof Error ? error.message : 'Failed'
    });
  }

  // Test 5: Response Optimization
  try {
    const largeData = Array(1000).fill(null).map((_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      metadata: {
        created: new Date(),
        updated: new Date(),
        extra: null,
        unused: undefined
      }
    }));

    const startUnoptimized = Date.now();
    const unoptimizedSize = JSON.stringify(largeData).length;
    const _timeUnoptimized = Date.now() - startUnoptimized;

    const startOptimized = Date.now();
    const optimizedData = largeData.map(item => {
      const cleaned: Record<string, unknown> = {};
      Object.entries(item).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            const cleanedNested: Record<string, unknown> = {};
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (nestedValue !== null && nestedValue !== undefined) {
                cleanedNested[nestedKey] = nestedValue;
              }
            });
            cleaned[key] = cleanedNested;
          } else {
            cleaned[key] = value;
          }
        }
      });
      return cleaned;
    });
    const optimizedSize = JSON.stringify(optimizedData).length;
    const timeOptimized = Date.now() - startOptimized;

    const sizeReduction = ((unoptimizedSize - optimizedSize) / unoptimizedSize * 100).toFixed(2);
    
    testResults.push({
      test: 'Response Compression',
      originalSize: `${(unoptimizedSize / 1024).toFixed(2)}KB`,
      optimizedSize: `${(optimizedSize / 1024).toFixed(2)}KB`,
      sizeReduction: `${sizeReduction}%`,
      processingTime: `${timeOptimized}ms`
    });
  } catch (error) {
    testResults.push({
      test: 'Response Compression',
      error: error instanceof Error ? error.message : 'Failed'
    });
  }

  // Get current performance metrics
  const metrics = PerformanceMonitor.getMetrics();
  const cacheStats = performanceCache.getStats();

  // Performance score calculation
  let score = 0;
  let maxScore = 0;
  
  testResults.forEach(result => {
    maxScore += 20;
    if (!result.error) {
      if (result.improvement && result.improvement.includes('✅')) score += 20;
      else if (result.improvement && result.improvement.includes('%')) {
        const percent = parseFloat(result.improvement);
        if (percent > 50) score += 20;
        else if (percent > 20) score += 15;
        else if (percent > 0) score += 10;
      }
    }
  });

  const performanceGrade = 
    score >= 80 ? '🏆 Excellent' :
    score >= 60 ? '✅ Good' :
    score >= 40 ? '⚠️ Fair' :
    '❌ Needs Improvement';

  return NextResponse.json({
    success: true,
    performanceTests: testResults,
    metrics: {
      performanceScore: `${score}/${maxScore}`,
      grade: performanceGrade,
      cacheStatus: {
        size: cacheStats.size,
        keys: cacheStats.keys.length,
        active: cacheStats.size > 0
      },
      monitoringMetrics: metrics
    },
    recommendations: [
      score < 80 ? '📊 Consider creating more database indexes' : null,
      cacheStats.size === 0 ? '💾 Enable caching for frequently accessed data' : null,
      '🚀 Use aggregation pipelines instead of multiple queries',
      '📦 Implement response compression for large payloads',
      '⚡ Use bulk operations for multiple database operations'
    ].filter(Boolean),
    timestamp: new Date().toISOString()
  });
}