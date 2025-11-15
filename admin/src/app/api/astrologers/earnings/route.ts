import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
import {
  SecurityMiddleware,
  InputSanitizer
} from '../../../../lib/security';

// GET - Astrologer earnings analytics
export async function GET(request: NextRequest) {
  try {
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate astrologer
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

    // Only astrologers can access their earnings
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only astrologers can access earnings data'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const astrologerId = authenticatedUser.userId as string;

    // Validate period parameter
    const validPeriods = ['day', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PERIOD',
        message: 'Period must be one of: day, week, month, year'
      }, { status: 400 });
    }

    // Get collections
    const walletTransactionsCollection = await DatabaseService.getCollection('transactions');
    const chatSessionsCollection = await DatabaseService.getCollection('chat_sessions');
    const callSessionsCollection = await DatabaseService.getCollection('call_sessions');

    // Calculate date ranges based on period
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        groupByFormat = '%Y-%m-%d';
        break;
      case 'week':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        groupByFormat = '%Y-W%U';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
        groupByFormat = '%Y-%m';
        break;
      case 'year':
        startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); // Last 5 years
        groupByFormat = '%Y';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupByFormat = '%Y-%m-%d';
    }

    // Get earnings summary
    const [earningsSummary] = await walletTransactionsCollection.aggregate([
      {
        $match: {
          recipient_id: new ObjectId(astrologerId),
          transaction_type: 'credit',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total_earnings: { $sum: '$amount' },
          total_transactions: { $sum: 1 },
          avg_transaction: { $avg: '$amount' },
          min_transaction: { $min: '$amount' },
          max_transaction: { $max: '$amount' }
        }
      }
    ]).toArray();

    // Get period-wise earnings breakdown
    const earningsBreakdown = await walletTransactionsCollection.aggregate([
      {
        $match: {
          recipient_id: new ObjectId(astrologerId),
          transaction_type: 'credit',
          status: 'completed',
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$created_at'
            }
          },
          earnings: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avg_amount: { $avg: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    // Get earnings by service type
    const earningsByService = await walletTransactionsCollection.aggregate([
      {
        $match: {
          recipient_id: new ObjectId(astrologerId),
          transaction_type: 'credit',
          status: 'completed',
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$service_type',
          earnings: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { earnings: -1 }
      }
    ]).toArray();

    // Get recent transactions
    const recentTransactions = await walletTransactionsCollection
      .find({
        recipient_id: new ObjectId(astrologerId),
        transaction_type: 'credit'
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalTransactions = await walletTransactionsCollection.countDocuments({
      recipient_id: new ObjectId(astrologerId),
      transaction_type: 'credit'
    });

    // Get session statistics for correlation
    const [chatStats, callStats] = await Promise.all([
      chatSessionsCollection.aggregate([
        {
          $match: {
            astrologer_id: new ObjectId(astrologerId),
            status: 'completed',
            created_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total_sessions: { $sum: 1 },
            total_duration: { $sum: '$duration_minutes' },
            avg_duration: { $avg: '$duration_minutes' },
            total_amount: { $sum: '$total_amount' }
          }
        }
      ]).toArray(),
      callSessionsCollection.aggregate([
        {
          $match: {
            astrologer_id: new ObjectId(astrologerId),
            status: 'completed',
            created_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total_sessions: { $sum: 1 },
            total_duration: { $sum: '$duration_minutes' },
            avg_duration: { $avg: '$duration_minutes' },
            total_amount: { $sum: '$total_amount' }
          }
        }
      ]).toArray()
    ]);

    // Calculate performance metrics
    const totalEarnings = earningsSummary?.total_earnings || 0;
    const periodEarnings = earningsBreakdown.reduce((sum, item) => sum + item.earnings, 0);
    const avgEarningsPerPeriod = earningsBreakdown.length > 0 
      ? periodEarnings / earningsBreakdown.length 
      : 0;

    // Calculate growth rate (compare last period vs previous period)
    const lastPeriodEarnings = earningsBreakdown.slice(-1)[0]?.earnings || 0;
    const previousPeriodEarnings = earningsBreakdown.slice(-2, -1)[0]?.earnings || 0;
    const growthRate = previousPeriodEarnings > 0 
      ? ((lastPeriodEarnings - previousPeriodEarnings) / previousPeriodEarnings) * 100 
      : 0;


    return NextResponse.json({
      success: true,
      data: {
        // Summary metrics
        summary: {
          total_earnings: totalEarnings,
          period_earnings: periodEarnings,
          avg_earnings_per_period: avgEarningsPerPeriod,
          growth_rate_percentage: growthRate,
          total_transactions: earningsSummary?.total_transactions || 0,
          avg_transaction_amount: earningsSummary?.avg_transaction || 0,
          min_transaction: earningsSummary?.min_transaction || 0,
          max_transaction: earningsSummary?.max_transaction || 0
        },

        // Performance metrics
        performance: {
          chat_sessions: {
            total: chatStats[0]?.total_sessions || 0,
            total_duration_minutes: chatStats[0]?.total_duration || 0,
            avg_duration_minutes: chatStats[0]?.avg_duration || 0,
            total_earnings: chatStats[0]?.total_amount || 0
          },
          call_sessions: {
            total: callStats[0]?.total_sessions || 0,
            total_duration_minutes: callStats[0]?.total_duration || 0,
            avg_duration_minutes: callStats[0]?.avg_duration || 0,
            total_earnings: callStats[0]?.total_amount || 0
          }
        },

        // Chart data
        charts: {
          earnings_breakdown: earningsBreakdown.map(item => ({
            period: item._id,
            earnings: item.earnings,
            transactions: item.transactions,
            avg_amount: item.avg_amount
          })),
          earnings_by_service: earningsByService.map(item => ({
            service_type: item._id || 'chat',
            earnings: item.earnings,
            transactions: item.transactions,
            percentage: totalEarnings > 0 ? (item.earnings / totalEarnings) * 100 : 0
          }))
        },

        // Recent transactions
        recent_transactions: recentTransactions.map(transaction => ({
          id: transaction.transaction_id || transaction._id?.toString() || 'unknown',
          amount: transaction.amount,
          service_type: transaction.service_type || 'chat',
          status: transaction.status,
          created_at: transaction.created_at,
          session_id: transaction.session_id || null,
          description: transaction.description || `Payment for ${transaction.service_type || 'chat'} session`
        })),

        // Pagination
        pagination: {
          current_page: page,
          per_page: limit,
          total_transactions: totalTransactions,
          total_pages: Math.ceil(totalTransactions / limit),
          has_next: skip + limit < totalTransactions,
          has_prev: page > 1
        },

        // Metadata
        metadata: {
          period,
          date_range: {
            start: startDate,
            end: now
          },
          last_updated: now
        }
      }
    });

  } catch (error) {
    console.error('Astrologer earnings error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching earnings data'
    }, { status: 500 });
  }
}

// POST - Request withdrawal
export async function POST(request: NextRequest) {
  try {
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate astrologer
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

    // Only astrologers can request withdrawals
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only astrologers can request withdrawals'
      }, { status: 403 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { amount, withdrawal_method, account_details } = sanitizedBody;

    // Validate withdrawal amount
    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount < 100) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Minimum withdrawal amount is ₹100'
      }, { status: 400 });
    }

    if (withdrawalAmount > 50000) {
      return NextResponse.json({
        success: false,
        error: 'AMOUNT_TOO_HIGH',
        message: 'Maximum withdrawal amount is ₹50,000 per request'
      }, { status: 400 });
    }

    // Validate withdrawal method
    const validMethods = ['bank_transfer', 'upi', 'paytm'];
    if (!validMethods.includes(withdrawal_method as string)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_METHOD',
        message: 'Invalid withdrawal method'
      }, { status: 400 });
    }

    const astrologerId = authenticatedUser.userId as string;
    const usersCollection = await DatabaseService.getCollection('users');
    const withdrawalRequestsCollection = await DatabaseService.getCollection('withdrawal_requests');

    // Check astrologer's available balance
    const astrologer = await usersCollection.findOne({
      user_id: astrologerId,
      user_type: 'astrologer'
    });

    if (!astrologer) {
      return NextResponse.json({
        success: false,
        error: 'ASTROLOGER_NOT_FOUND',
        message: 'Astrologer profile not found'
      }, { status: 404 });
    }

    const availableBalance = Number(astrologer.wallet_balance) || 0;
    if (withdrawalAmount > availableBalance) {
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: `Insufficient balance. Available: ₹${availableBalance}`
      }, { status: 400 });
    }

    // Check for pending withdrawal requests
    const pendingWithdrawal = await withdrawalRequestsCollection.findOne({
      astrologer_user_id: astrologerId,
      status: 'pending'
    });

    if (pendingWithdrawal) {
      return NextResponse.json({
        success: false,
        error: 'PENDING_WITHDRAWAL_EXISTS',
        message: 'You have a pending withdrawal request. Please wait for it to be processed.'
      }, { status: 400 });
    }

    // Create withdrawal request
    const withdrawalRequest = {
      request_id: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      astrologer_user_id: astrologerId,
      amount: withdrawalAmount,
      withdrawal_method,
      account_details: InputSanitizer.sanitizeMongoQuery(account_details as Record<string, unknown>),
      status: 'pending',
      requested_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      request_ip: _ip,
      metadata: {
        user_agent: request.headers.get('user-agent') || '',
        astrologer_name: astrologer.full_name,
        astrologer_email: astrologer.email_address
      }
    };

    await withdrawalRequestsCollection.insertOne(withdrawalRequest);

    // Reserve the amount (don't deduct yet, just mark as reserved)
    // First ensure the field exists, then increment
    await usersCollection.updateOne(
      { user_id: astrologerId },
      [
        {
          $set: {
            reserved_balance: {
              $add: [
                { $ifNull: ["$reserved_balance", 0] },
                withdrawalAmount
              ]
            },
            updated_at: new Date()
          }
        }
      ]
    );


    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        request_id: withdrawalRequest.request_id,
        amount: withdrawalAmount,
        status: 'pending',
        estimated_processing_time: '2-3 business days',
        remaining_balance: availableBalance - withdrawalAmount
      }
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing withdrawal request'
    }, { status: 500 });
  }
}