import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../lib/database';
import { QueryOptimizer, PerformanceMonitor } from '../../../lib/performance-cache';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  console.log('🚀 Performance Demo API called');
  
  const results: {
    withoutOptimization: Record<string, unknown>;
    withOptimization: Record<string, unknown>;
    improvement: Record<string, unknown>;
  } = {
    withoutOptimization: {},
    withOptimization: {},
    improvement: {}
  };

  try {
    // Test 1: Database query without optimization
    const startWithout = Date.now();
    const usersCollection = await DatabaseService.getCollection('users');
    
    // Simulate multiple queries (old approach)
    const [customers, astrologers, admins] = await Promise.all([
      usersCollection.countDocuments({ user_type: 'customer' }),
      usersCollection.countDocuments({ user_type: 'astrologer' }),
      usersCollection.countDocuments({ user_type: 'administrator' })
    ]);
    
    const endWithout = Date.now();
    results.withoutOptimization = {
      customers,
      astrologers,
      admins,
      time: endWithout - startWithout
    };

    // Test 2: Database query with optimization
    const startWith = Date.now();
    
    // Use cached aggregation (new approach)
    const optimizedData = await QueryOptimizer.getCachedAggregation(
      'demo-user-stats',
      async () => {
        const [stats] = await usersCollection.aggregate([
          {
            $facet: {
              customers: [
                { $match: { user_type: 'customer' } },
                { $count: 'total' }
              ],
              astrologers: [
                { $match: { user_type: 'astrologer' } },
                { $count: 'total' }
              ],
              admins: [
                { $match: { user_type: 'administrator' } },
                { $count: 'total' }
              ]
            }
          }
        ]).toArray();
        
        return {
          customers: stats.customers[0]?.total || 0,
          astrologers: stats.astrologers[0]?.total || 0,
          admins: stats.admins[0]?.total || 0
        };
      },
      60000 // 1 minute cache
    );
    
    const endWith = Date.now();
    results.withOptimization = {
      ...optimizedData as Record<string, number>,
      time: endWith - startWith
    };

    // Calculate improvement
    const timeSaved = (results.withoutOptimization.time as number) - (results.withOptimization.time as number);
    const percentageImprovement = ((timeSaved / (results.withoutOptimization.time as number)) * 100).toFixed(2);
    
    results.improvement = {
      timeSaved: `${timeSaved}ms`,
      percentageImprovement: `${percentageImprovement}%`,
      cacheHit: (results.withOptimization.time as number) < 10 ? 'Yes' : 'No'
    };

    // Test performance monitoring
    const endTimer = PerformanceMonitor.startTimer('demo-operation');
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 50));
    endTimer();

    const metrics = PerformanceMonitor.getMetrics();

    return NextResponse.json({
      success: true,
      message: 'Performance demonstration completed',
      results,
      performanceMetrics: metrics,
      tips: [
        '🚀 First request will be slower (fetches from DB)',
        '⚡ Second request will be much faster (uses cache)',
        '📊 Aggregation pipelines reduce multiple queries to one',
        '💾 Caching reduces database load significantly'
      ]
    });

  } catch (error) {
    console.error('Performance demo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Demo failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}