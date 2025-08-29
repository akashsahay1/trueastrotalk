import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../lib/database';
import { SecurityMiddleware } from '../../../../lib/security';

// GET - View rate limit status and violations
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔍 Rate limit monitoring request from IP: ${ip}`);

    // Authenticate admin
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

    // Only admins can view rate limit data
    if (authenticatedUser.user_type !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can access rate limit data'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, forgot-password, reset-password, violations
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    const rateLimitsCollection = await DatabaseService.getCollection('rate_limits');

    // Build filter
    let filter: any = {};
    if (type !== 'all') {
      if (type === 'violations') {
        filter.key = { $regex: ':violations$' };
      } else {
        filter.key = { $regex: `^${type}:` };
      }
    }

    // Get current active rate limits
    const now = new Date();
    const activeWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    // Get rate limit records
    const rateLimits = await rateLimitsCollection
      .find({
        ...filter,
        lastRequest: { $gte: activeWindow }
      })
      .sort({ lastRequest: -1, count: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalRecords = await rateLimitsCollection.countDocuments({
      ...filter,
      lastRequest: { $gte: activeWindow }
    });

    // Get summary statistics
    const stats = await rateLimitsCollection.aggregate([
      {
        $match: {
          lastRequest: { $gte: activeWindow }
        }
      },
      {
        $group: {
          _id: null,
          totalActiveKeys: { $sum: 1 },
          totalRequests: { $sum: '$count' },
          avgRequestsPerKey: { $avg: '$count' },
          maxRequestsPerKey: { $max: '$count' }
        }
      }
    ]).toArray();

    // Get top violators
    const topViolators = await rateLimitsCollection
      .find({
        key: { $not: { $regex: ':violations$' } },
        count: { $gte: 10 },
        lastRequest: { $gte: activeWindow }
      })
      .sort({ count: -1 })
      .limit(10)
      .toArray();

    // Get violation patterns
    const violationPatterns = await rateLimitsCollection
      .find({
        key: { $regex: ':violations$' },
        lastRequest: { $gte: activeWindow }
      })
      .sort({ count: -1 })
      .limit(10)
      .toArray();

    // Format response
    const formattedRateLimits = rateLimits.map(record => ({
      key: record.key,
      count: record.count,
      windowStart: record.windowStart,
      lastRequest: record.lastRequest,
      type: record.key.includes(':violations') ? 'violation' : 'rate_limit',
      identifier: record.key.split(':')[0],
      target: record.key.includes('email:') ? 'email' : 'ip'
    }));

    console.log(`✅ Rate limit data retrieved - ${formattedRateLimits.length} records`);

    return NextResponse.json({
      success: true,
      data: {
        rateLimits: formattedRateLimits,
        statistics: stats[0] || {
          totalActiveKeys: 0,
          totalRequests: 0,
          avgRequestsPerKey: 0,
          maxRequestsPerKey: 0
        },
        topViolators: topViolators.map(v => ({
          key: v.key,
          count: v.count,
          lastRequest: v.lastRequest
        })),
        violationPatterns: violationPatterns.map(v => ({
          key: v.key.replace(':violations', ''),
          violationCount: v.count,
          lastViolation: v.lastRequest
        })),
        pagination: {
          current_page: page,
          per_page: limit,
          total_records: totalRecords,
          total_pages: Math.ceil(totalRecords / limit),
          has_next: skip + limit < totalRecords,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Rate limit monitoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while retrieving rate limit data'
    }, { status: 500 });
  }
}

// DELETE - Clear rate limits (admin emergency action)
export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🗑️ Rate limit clear request from IP: ${ip}`);

    // Authenticate admin
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

    // Only admins can clear rate limits
    if (authenticatedUser.user_type !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can clear rate limits'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const type = searchParams.get('type');
    
    const rateLimitsCollection = await DatabaseService.getCollection('rate_limits');

    if (key) {
      // Clear specific key
      const result = await rateLimitsCollection.deleteOne({ key });
      console.log(`🗑️ Cleared rate limit for key: ${key}`);
      
      return NextResponse.json({
        success: true,
        message: `Rate limit cleared for key: ${key}`,
        deleted: result.deletedCount
      });
    } else if (type) {
      // Clear all records of a specific type
      const filter = type === 'violations' 
        ? { key: { $regex: ':violations$' } }
        : { key: { $regex: `^${type}:` } };
      
      const result = await rateLimitsCollection.deleteMany(filter);
      console.log(`🗑️ Cleared ${result.deletedCount} rate limit records of type: ${type}`);
      
      return NextResponse.json({
        success: true,
        message: `Cleared ${result.deletedCount} rate limit records of type: ${type}`,
        deleted: result.deletedCount
      });
    } else {
      // Clear old records (older than 24 hours)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await rateLimitsCollection.deleteMany({
        lastRequest: { $lt: cutoff }
      });
      
      console.log(`🗑️ Cleared ${result.deletedCount} old rate limit records`);
      
      return NextResponse.json({
        success: true,
        message: `Cleared ${result.deletedCount} old rate limit records`,
        deleted: result.deletedCount
      });
    }

  } catch (error) {
    console.error('Rate limit clear error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while clearing rate limits'
    }, { status: 500 });
  }
}