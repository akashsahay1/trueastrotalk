import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../lib/database';
import {
  SecurityMiddleware,
  InputSanitizer
} from '../../../../lib/security';
import { Media } from '@/models';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// GET - Astrologer dashboard data
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

    // Only astrologers can access this dashboard
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'This endpoint is only accessible to astrologers'
      }, { status: 403 });
    }

    const astrologerId = authenticatedUser.userId as string;

    // Get collections
    const usersCollection = await DatabaseService.getCollection('users');
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const walletTransactionsCollection = await DatabaseService.getCollection('transactions');
    const reviewsCollection = await DatabaseService.getCollection('reviews');
    const baseUrl = getBaseUrl(request);

    // Get astrologer profile
    const astrologer = await usersCollection.findOne(
      { user_id: astrologerId },
      {
        projection: {
          password: 0,
          google_access_token: 0,
          failed_login_attempts: 0,
          registration_ip: 0
        }
      }
    );

    if (!astrologer) {
      return NextResponse.json({
        success: false,
        error: 'ASTROLOGER_NOT_FOUND',
        message: 'Astrologer profile not found'
      }, { status: 404 });
    }

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Optimized single aggregation for chat sessions
    const [chatStats] = await sessionsCollection.aggregate([
      {
        $match: {
          astrologer_id: astrologerId,
          session_type: 'chat'
        }
      },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          todayCount: [
            { $match: { created_at: { $gte: today } } },
            { $count: 'total' }
          ],
          activeCount: [
            { $match: { status: 'active' } },
            { $count: 'total' }
          ],
          completedCount: [
            { $match: { status: 'completed' } },
            { $count: 'total' }
          ],
          avgDuration: [
            { 
              $match: { 
                status: 'completed',
                duration_minutes: { $gt: 0 }
              }
            },
            {
              $group: {
                _id: null,
                avgDuration: { $avg: '$duration_minutes' }
              }
            }
          ]
        }
      }
    ]).toArray();

    const totalChatSessions = chatStats.totalCount[0]?.total || 0;
    const todayChatSessions = chatStats.todayCount[0]?.total || 0;
    const activeChatSessions = chatStats.activeCount[0]?.total || 0;
    const completedChatSessions = chatStats.completedCount[0]?.total || 0;
    const avgSessionDuration = chatStats.avgDuration[0]?.avgDuration || 0;

    // Optimized single aggregation for call sessions
    const [callStats] = await sessionsCollection.aggregate([
      {
        $match: {
          astrologer_id: astrologerId,
          session_type: { $in: ['voice_call', 'video_call', 'video', 'voice', 'call'] }
        }
      },
      {
        $facet: {
          totalCount: [{ $count: 'total' }],
          todayCount: [
            { $match: { created_at: { $gte: today } } },
            { $count: 'total' }
          ],
          activeCount: [
            { $match: { status: { $in: ['ringing', 'active'] } } },
            { $count: 'total' }
          ]
        }
      }
    ]).toArray();

    const totalCallSessions = callStats.totalCount[0]?.total || 0;
    const todayCallSessions = callStats.todayCount[0]?.total || 0;
    const activeCallSessions = callStats.activeCount[0]?.total || 0;

    // Optimized single aggregation for earnings
    const [earningsStats] = await walletTransactionsCollection.aggregate([
      {
        $match: {
          recipient_user_id: astrologerId,
          transaction_type: 'credit',
          status: 'completed'
        }
      },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          today: [
            { $match: { created_at: { $gte: today } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          thisWeek: [
            { $match: { created_at: { $gte: thisWeek } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          thisMonth: [
            { $match: { created_at: { $gte: thisMonth } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          lastMonth: [
            { $match: { created_at: { $gte: lastMonth, $lt: thisMonth } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]
        }
      }
    ]).toArray();

    const totalEarnings = earningsStats.total[0]?.total || 0;
    const todayEarnings = earningsStats.today[0]?.total || 0;
    const thisWeekEarnings = earningsStats.thisWeek[0]?.total || 0;
    const thisMonthEarnings = earningsStats.thisMonth[0]?.total || 0;
    const lastMonthEarnings = earningsStats.lastMonth[0]?.total || 0;

    // Get recent reviews
    const recentReviews = await reviewsCollection
      .find({
        astrologer_id: astrologerId
      })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    // Get recent chat sessions
    const recentChatSessions = await sessionsCollection
      .find({
        astrologer_id: astrologerId,
        session_type: 'chat'
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    // Get weekly earnings chart data
    const weeklyEarnings = await walletTransactionsCollection.aggregate([
      {
        $match: {
          recipient_user_id: astrologerId,
          transaction_type: 'credit',
          status: 'completed',
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$created_at'
            }
          },
          earnings: { $sum: '$amount' },
          sessions: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    // Calculate percentage changes
    const monthlyEarningsChange = thisMonthEarnings[0]?.total && lastMonthEarnings[0]?.total
      ? ((thisMonthEarnings[0].total - lastMonthEarnings[0].total) / lastMonthEarnings[0].total) * 100
      : 0;

    // Resolve profile image from media library
    const profileImage = await Media.resolveProfileImage(astrologer, baseUrl);

    return NextResponse.json({
      success: true,
      data: {
        // Profile summary
        profile: {
          id: astrologer._id.toString(),
          full_name: astrologer.full_name,
          email_address: astrologer.email_address,
          phone_number: astrologer.phone_number || '',
          profile_image: profileImage || '',
          bio: astrologer.bio || '',
          experience_years: astrologer.experience_years || 0,
          languages: astrologer.languages || '',
          skills: astrologer.skills || [],
          rating: astrologer.rating || 0,
          total_reviews: astrologer.total_reviews || 0,
          is_online: astrologer.is_online || false,
          // Removed availability system - astrologers are always available when online
          account_status: astrologer.account_status,
          approval_status: astrologer.approval_status || 'pending',
          chat_rate: astrologer.chat_rate || 0,
          call_rate: astrologer.call_rate || 0,
          video_rate: astrologer.video_rate || 0
        },

        // Statistics overview
        stats: {
          chat_sessions: {
            total: totalChatSessions,
            today: todayChatSessions,
            active: activeChatSessions,
            completed: completedChatSessions,
            avg_duration: avgSessionDuration
          },
          call_sessions: {
            total: totalCallSessions,
            today: todayCallSessions,
            active: activeCallSessions
          },
          earnings: {
            total: totalEarnings,
            today: todayEarnings,
            this_week: thisWeekEarnings,
            this_month: thisMonthEarnings,
            last_month: lastMonthEarnings,
            monthly_change_percentage: monthlyEarningsChange
          },
          reviews: {
            total: astrologer.total_reviews || 0,
            average_rating: astrologer.rating || 0,
            recent_count: recentReviews.length
          }
        },

        // Recent activity
        recent_activity: {
          reviews: recentReviews.map(review => ({
            id: review._id.toString(),
            customer_name: review.customer_name || 'Anonymous',
            rating: review.rating,
            comment: review.comment || '',
            created_at: review.created_at
          })),
          chat_sessions: recentChatSessions.map(session => ({
            id: session._id.toString(),
            status: session.status,
            duration_minutes: session.duration_minutes || 0,
            total_amount: session.total_amount || 0,
            created_at: session.created_at,
            updated_at: session.updated_at
          }))
        },

        // Chart data
        charts: {
          weekly_earnings: weeklyEarnings.map(item => ({
            date: item._id,
            earnings: item.earnings,
            sessions: item.sessions
          }))
        }
      }
    });

  } catch (error) {
    console.error('Astrologer dashboard error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching dashboard data'
    }, { status: 500 });
  }
}

// PUT - Update astrologer availability and settings
export async function PUT(request: NextRequest) {
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

    // Only astrologers can update their settings
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only astrologers can update their settings'
      }, { status: 403 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const {
      is_online,
      chat_rate,
      call_rate,
      video_rate,
      bio,
      skills,
      languages
    } = sanitizedBody;

    const astrologerId = authenticatedUser.userId as string;
    const usersCollection = await DatabaseService.getCollection('users');

    // Build update data with validation
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    // Note: Removed availability system - astrologers are always available when online

    if (typeof is_online === 'boolean') {
      updateData.is_online = is_online;
      if (is_online) {
        updateData.last_seen = new Date();
      }
    }

    // Validate and update rates
    if (chat_rate !== undefined) {
      const rate = Number(chat_rate);
      if (rate >= 5 && rate <= 1000) {
        updateData.chat_rate = rate;
      } else {
        return NextResponse.json({
          success: false,
          error: 'INVALID_CHAT_RATE',
          message: 'Chat rate must be between ₹5 and ₹1000 per minute'
        }, { status: 400 });
      }
    }

    if (call_rate !== undefined) {
      const rate = Number(call_rate);
      if (rate >= 10 && rate <= 2000) {
        updateData.call_rate = rate;
      } else {
        return NextResponse.json({
          success: false,
          error: 'INVALID_CALL_RATE',
          message: 'Call rate must be between ₹10 and ₹2000 per minute'
        }, { status: 400 });
      }
    }

    if (video_rate !== undefined) {
      const rate = Number(video_rate);
      if (rate >= 15 && rate <= 3000) {
        updateData.video_rate = rate;
      } else {
        return NextResponse.json({
          success: false,
          error: 'INVALID_VIDEO_RATE',
          message: 'Video rate must be between ₹15 and ₹3000 per minute'
        }, { status: 400 });
      }
    }

    // Validate and update bio
    if (bio !== undefined && bio !== null) {
      const sanitizedBio = InputSanitizer.sanitizeString(bio as string);
      if (sanitizedBio.length <= 1000) {
        updateData.bio = sanitizedBio;
      } else {
        return NextResponse.json({
          success: false,
          error: 'BIO_TOO_LONG',
          message: 'Bio cannot exceed 1000 characters'
        }, { status: 400 });
      }
    }

    // Validate and update skills
    if (skills !== undefined && Array.isArray(skills)) {
      const validSkills = skills
        .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
        .slice(0, 10); // Max 10 skills
      updateData.skills = validSkills;
    }

    // Validate and update languages
    if (languages !== undefined && languages !== null) {
      const sanitizedLanguages = InputSanitizer.sanitizeString(languages as string);
      if (sanitizedLanguages.length <= 200) {
        updateData.languages = sanitizedLanguages;
      } else {
        return NextResponse.json({
          success: false,
          error: 'LANGUAGES_TOO_LONG',
          message: 'Languages field cannot exceed 200 characters'
        }, { status: 400 });
      }
    }

    // Update astrologer settings
    const result = await usersCollection.updateOne(
      {
        user_id: astrologerId,
        user_type: 'astrologer'
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'ASTROLOGER_NOT_FOUND',
        message: 'Astrologer profile not found'
      }, { status: 404 });
    }


    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at')
    });

  } catch (error) {
    console.error('Astrologer settings update error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while updating settings'
    }, { status: 500 });
  }
}