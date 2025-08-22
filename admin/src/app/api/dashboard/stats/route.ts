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
    const token = request.cookies.get('auth_token')?.value;
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
        
        // Optimized aggregation pipeline
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

        return {
          totalCustomers: statsResult.customerCount[0]?.total || 0,
          totalAstrologers: statsResult.astrologerCount[0]?.total || 0,
          totalOrders: 0, // As requested
          totalRevenue: 0, // As requested
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