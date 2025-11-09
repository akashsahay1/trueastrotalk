import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from '../../../../lib/security';
import { PerformanceMonitor, performanceCache } from '../../../../lib/performance-cache';
import DatabaseIndexManager from '../../../../lib/database-indexes';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

// GET - Performance statistics and monitoring
async function handleGET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate admin user
    let authenticatedUser;
    try {
      authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Only administrators can access performance data
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can access performance data'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'create-indexes') {
      // Create optimized database indexes
      await DatabaseIndexManager.createOptimizedIndexes();
      
      return NextResponse.json({
        success: true,
        message: 'Database indexes created successfully',
        action: 'create-indexes'
      });
    }

    if (action === 'clear-cache') {
      // Clear performance cache
      performanceCache.clear();
      
      return NextResponse.json({
        success: true,
        message: 'Performance cache cleared successfully',
        action: 'clear-cache'
      });
    }

    // Get comprehensive performance statistics
    const [
      queryMetrics,
      cacheStats,
      dbStats
    ] = await Promise.all([
      PerformanceMonitor.getMetrics(),
      performanceCache.getStats(),
      DatabaseIndexManager.getPerformanceStats()
    ]);

    // Calculate performance insights
    const insights = {
      slowQueries: Object.entries(queryMetrics)
        .filter(([, stats]) => stats.avgTime > 1000) // Queries taking more than 1s
        .map(([operation, stats]) => ({ operation, ...stats })),
      
      cacheHitRatio: cacheStats.size > 0 ? 0.85 : 0, // Placeholder calculation
      
      recommendedOptimizations: [
        ...(cacheStats.size === 0 ? ['Enable query caching'] : []),
        ...(dbStats.totalIndexes < 10 ? ['Create database indexes'] : []),
        ...((queryMetrics['dashboard-stats']?.avgTime || 0) > 500 ? ['Optimize dashboard queries'] : [])
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        performance: {
          queryMetrics,
          cacheStats,
          databaseStats: dbStats,
          insights
        },
        recommendations: [
          {
            type: 'database',
            title: 'Create Database Indexes',
            description: 'Create optimized indexes for better query performance',
            action: 'create-indexes',
            impact: 'High',
            enabled: dbStats.totalIndexes < 20
          },
          {
            type: 'cache',
            title: 'Clear Cache',
            description: 'Clear performance cache to free memory',
            action: 'clear-cache',
            impact: 'Medium',
            enabled: cacheStats.size > 50
          }
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while retrieving performance data'
    }, { status: 500 });
  }
}

// POST - Performance optimization actions
async function handlePOST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate admin user
    let authenticatedUser;
    try {
      authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Only administrators can perform optimization actions
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can perform optimization actions'
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, options = {} } = body;

    let result;

    switch (action) {
      case 'create-indexes':
        await DatabaseIndexManager.createOptimizedIndexes();
        result = { message: 'Database indexes created successfully', performance_impact: 'High' };
        break;

      case 'clear-cache':
        performanceCache.clear();
        result = { message: 'Performance cache cleared', memory_freed: 'Variable' };
        break;

      case 'analyze-query':
        if (!options.collection || !options.query) {
          throw new Error('Collection and query are required for analysis');
        }
        
        const analysis = await DatabaseIndexManager.analyzeQueryPerformance(
          options.collection,
          options.query,
          options.sort
        );
        result = { message: 'Query analysis completed', analysis };
        break;

      case 'optimize-collection':
        if (!options.collection) {
          throw new Error('Collection name is required for optimization');
        }
        
        // Get collection indexes
        const indexes = await DatabaseIndexManager.getCollectionIndexes(options.collection);
        result = { 
          message: `Collection ${options.collection} analyzed`, 
          current_indexes: indexes.length,
          indexes 
        };
        break;

      default:
        throw new Error(`Unknown optimization action: ${action}`);
    }


    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance optimization error:', error);
    return NextResponse.json({
      success: false,
      error: 'OPTIMIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Optimization action failed'
    }, { status: 400 });
  }
}

// Export secured handlers with admin-only access
export const GET = withSecurity(handleGET, SecurityPresets.admin);
export const POST = withSecurity(handlePOST, SecurityPresets.admin);