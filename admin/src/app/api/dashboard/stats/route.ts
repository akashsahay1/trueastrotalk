import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../lib/database';
import { QueryOptimizer, PerformanceMonitor } from '../../../../lib/performance-cache';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  const endTimer = PerformanceMonitor.startTimer('dashboard-stats');
  
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Use cached aggregation for better performance
    const stats = await QueryOptimizer.getCachedAggregation(
      'dashboard-stats',
      async () => {
        const usersCollection = await DatabaseService.getCollection('users');
        const sessionsCollection = await DatabaseService.getCollection('sessions');

        // Optimized aggregation pipeline for users
        const [statsResult] = await usersCollection.aggregate([
          {
            $facet: {
              customerCount: [
                { $match: { user_type: 'customer', account_status: { $ne: 'banned' } } },
                { $count: 'total' }
              ],
              astrologerCount: [
                { $match: { user_type: 'astrologer', account_status: { $ne: 'banned' } } },
                { $count: 'total' }
              ],
              recentCustomers: [
                { $match: { user_type: 'customer', account_status: { $ne: 'banned' } } },
                { $sort: { created_at: -1 } },
                { $limit: 15 },
                {
                  $project: {
                    full_name: 1,
                    email_address: 1,
                    phone_number: 1,
                    account_status: 1,
                    created_at: 1
                  }
                }
              ]
            }
          }
        ]).toArray();

        // Get session stats
        const [sessionStats] = await sessionsCollection.aggregate([
          {
            $facet: {
              totalSessions: [
                { $match: { status: 'completed' } },
                { $count: 'total' }
              ],
              totalRevenue: [
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$total_amount' } } }
              ],
              todaySessions: [
                {
                  $match: {
                    status: 'completed',
                    created_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)).toISOString() }
                  }
                },
                { $count: 'total' }
              ],
              todayRevenue: [
                {
                  $match: {
                    status: 'completed',
                    created_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)).toISOString() }
                  }
                },
                { $group: { _id: null, total: { $sum: '$total_amount' } } }
              ]
            }
          }
        ]).toArray();

        return {
          totalCustomers: statsResult.customerCount[0]?.total || 0,
          totalAstrologers: statsResult.astrologerCount[0]?.total || 0,
          totalSessions: sessionStats.totalSessions[0]?.total || 0,
          totalRevenue: sessionStats.totalRevenue[0]?.total || 0,
          todaySessions: sessionStats.todaySessions[0]?.total || 0,
          todayRevenue: sessionStats.todayRevenue[0]?.total || 0,
          recentCustomers: statsResult.recentCustomers
        };
      },
      2 * 60 * 1000 // Cache for 2 minutes
    );

    endTimer();

    return NextResponse.json({
      success: true,
      ...(stats as Record<string, unknown>)
    });

  } catch (error) {
    endTimer();
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}