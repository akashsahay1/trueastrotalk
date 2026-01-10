import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../lib/database';
import { SecurityMiddleware, InputSanitizer } from '../../../lib/security';
import { Media } from '@/models';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// GET - Get user's chat sessions
export async function GET(request: NextRequest) {
  try {
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate user
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 items
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    // User can only access their own chat sessions
    const userId = authenticatedUser.userId;
    const userType = authenticatedUser.user_type;

    // Validate user type
    if (!['customer', 'astrologer'].includes(userType as string)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_USER_TYPE',
        message: 'Invalid user type for chat access'
      }, { status: 403 });
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Build secure query based on user type
    const query: Record<string, unknown> = {
      session_type: 'chat' // Only get chat sessions from unified collection
    };
    if (userType === 'customer') {
      query.user_id = userId as string;
    } else if (userType === 'astrologer') {
      query.astrologer_id = userId as string;
    }
    
    // Validate and sanitize status filter
    if (status) {
      const validStatuses = ['pending', 'active', 'completed', 'cancelled', 'ringing', 'rejected'];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Get chat sessions with pagination and security projection
    const chatSessions = await sessionsCollection
      .find(query, {
        projection: {
          // Don't expose sensitive internal data
          internal_notes: 0,
          admin_flags: 0
        }
      })
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalSessions = await sessionsCollection.countDocuments(query);

    // Populate user and astrologer details securely
    const populatedSessions = await Promise.all(
      chatSessions.map(async (session) => {
        const [user, astrologer] = await Promise.all([
          usersCollection.findOne(
            { user_id: session.user_id as string },
            {
              projection: {
                password: 0,
                google_access_token: 0,
                failed_login_attempts: 0,
                registration_ip: 0
              }
            }
          ),
          usersCollection.findOne(
            { user_id: session.astrologer_id as string, user_type: 'astrologer' },
            {
              projection: {
                password: 0,
                google_access_token: 0,
                failed_login_attempts: 0,
                registration_ip: 0,
                total_earnings: 0  // Don't expose earnings to customers
              }
            }
          )
        ]);

        // Resolve profile images from media library
        const userProfileImage = user ? await Media.resolveProfileImage(user, baseUrl) : null;
        const astrologerProfileImage = astrologer ? await Media.resolveProfileImage(astrologer, baseUrl) : null;

        return {
          _id: session._id.toString(),
          session_id: session._id.toString(),
          user: user ? {
            _id: user._id.toString(),
            full_name: user.full_name,
            profile_image: userProfileImage || '',
            // Only show essential info to astrologer
            ...(userType === 'astrologer' && {
              phone_number: user.phone_number
            })
          } : null,
          astrologer: astrologer ? {
            _id: astrologer._id.toString(),
            full_name: astrologer.full_name,
            profile_image: astrologerProfileImage || '',
            chat_rate: astrologer.chat_rate,
            is_online: astrologer.is_online || false,
            rating: astrologer.rating || 0,
            skills: astrologer.skills || []
          } : null,
          status: session.status,
          rate_per_minute: session.rate_per_minute,
          start_time: session.start_time,
          end_time: session.end_time,
          duration_minutes: session.duration_minutes || 0,
          total_amount: session.total_amount || 0,
          last_message: session.last_message,
          last_message_time: session.last_message_time,
          unread_count: userType === 'customer' ?
            (session.user_unread_count || 0) :
            (session.astrologer_unread_count || 0),
          created_at: session.created_at,
          updated_at: session.updated_at
        };
      })
    );


    return NextResponse.json({
      success: true,
      chat_sessions: populatedSessions,
      pagination: {
        total: totalSessions,
        page,
        limit,
        totalPages: Math.ceil(totalSessions / limit)
      }
    });

  } catch (error) {
    console.error('Chat sessions GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching chat sessions'
    }, { status: 500 });
  }
}

// POST - Create new chat session
export async function POST(request: NextRequest) {
  console.log('📨 POST /api/chat called');
  try {
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate user
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

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { astrologer_id } = sanitizedBody;

    // Only customers can create chat sessions
    if (authenticatedUser.user_type !== 'customer') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_USER_TYPE',
        message: 'Only customers can initiate chat sessions'
      }, { status: 403 });
    }

    const user_id = authenticatedUser.userId;

    if (!astrologer_id) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_ASTROLOGER_ID',
        message: 'Astrologer ID is required'
      }, { status: 400 });
    }

    // Validate astrologer_id format (accept both ObjectId and custom user_id format)
    const astrologerIdStr = astrologer_id as string;
    if (!astrologerIdStr || typeof astrologerIdStr !== 'string' || astrologerIdStr.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ASTROLOGER_ID',
        message: 'Invalid astrologer ID format'
      }, { status: 400 });
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Check if astrologer exists and is available
    const astrologer = await usersCollection.findOne({
      user_id: astrologer_id as string,
      user_type: 'astrologer',
      account_status: 'active',
      approval_status: 'approved'
    });

    if (!astrologer) {
      return NextResponse.json({
        success: false,
        error: 'ASTROLOGER_NOT_FOUND',
        message: 'Astrologer not found or not approved'
      }, { status: 404 });
    }

    // Check if astrologer is online for chat (removed availability check)
    if (!astrologer.is_online) {
      return NextResponse.json({
        success: false,
        error: 'ASTROLOGER_NOT_AVAILABLE',
        message: 'Astrologer is currently not online for chat'
      }, { status: 400 });
    }

    // Verify customer exists and has active account
    const user = await usersCollection.findOne({
      user_id: user_id as string,
      account_status: 'active'
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found or inactive'
      }, { status: 404 });
    }

    // Check if user has sufficient wallet balance
    const estimatedCost = (Number(astrologer.chat_rate) || 30) * 5; // Estimate 5 minutes minimum
    if ((Number(user.wallet_balance) || 0) < estimatedCost) {
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: `Insufficient wallet balance. Minimum ₹${estimatedCost} required for chat session.`
      }, { status: 400 });
    }

    // Check if there's already an active session between these users
    const existingSession = await sessionsCollection.findOne({
      session_type: 'chat',
      user_id: user_id as string,
      astrologer_id: astrologer_id as string,
      status: { $in: ['pending', 'active'] }
    });

    if (existingSession) {
      const existingAstrologerImage = await Media.resolveProfileImage(astrologer, baseUrl);
      return NextResponse.json({
        success: true,
        message: 'Active session already exists',
        session_id: existingSession._id.toString(),
        session: {
          _id: existingSession._id.toString(),
          status: existingSession.status,
          rate_per_minute: existingSession.rate_per_minute,
          start_time: existingSession.start_time,
          astrologer: {
            _id: astrologer._id.toString(),
            full_name: astrologer.full_name,
            profile_image: existingAstrologerImage || '',
            chat_rate: astrologer.chat_rate,
            is_online: astrologer.is_online
          }
        }
      });
    }

    // Check for rate limiting - max 3 new sessions per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSessions = await sessionsCollection.countDocuments({
      session_type: 'chat',
      user_id: user_id as string,
      created_at: { $gte: oneHourAgo }
    });

    if (recentSessions >= 3) {
      return NextResponse.json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Maximum 3 chat sessions per hour allowed. Please try again later.'
      }, { status: 429 });
    }

    // Create new chat session with secure data in unified sessions collection
    const sessionData = {
      _id: new ObjectId(),
      session_id: new ObjectId().toString(),
      session_type: 'chat', // Add session_type for unified collection
      user_id: user_id as string,
      astrologer_id: astrologer_id as string,
      status: 'pending', // pending -> active -> completed -> cancelled
      rate_per_minute: Number(astrologer.chat_rate) || 30,
      start_time: new Date(),
      end_time: null,
      duration_minutes: 0,
      total_amount: 0,

      // Chat-specific fields
      last_message: null,
      last_message_time: null,
      user_unread_count: 0,
      astrologer_unread_count: 0,

      // Call-specific fields (null for chat)
      call_quality_rating: null,
      connection_id: null,

      billing_updated_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      created_by_ip: _ip,
      metadata: {
        user_agent: request.headers.get('user-agent') || '',
        client_type: request.headers.get('x-client-type') || 'web'
      }
    };

    const result = await sessionsCollection.insertOne(sessionData);
    const sessionId = result.insertedId.toString();

    // Resolve profile images for the response
    const newUserImage = await Media.resolveProfileImage(user, baseUrl);
    const newAstrologerImage = await Media.resolveProfileImage(astrologer, baseUrl);

    return NextResponse.json({
      success: true,
      message: 'Chat session created successfully',
      session_id: sessionId,
      session: {
        _id: sessionId,
        status: sessionData.status,
        rate_per_minute: sessionData.rate_per_minute,
        start_time: sessionData.start_time,
        user: {
          _id: user._id.toString(),
          full_name: user.full_name,
          profile_image: newUserImage || ''
        },
        astrologer: {
          _id: astrologer._id.toString(),
          full_name: astrologer.full_name,
          profile_image: newAstrologerImage || '',
          chat_rate: astrologer.chat_rate,
          rating: astrologer.rating || 0,
          skills: astrologer.skills || []
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Chat session POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while creating chat session'
    }, { status: 500 });
  }
}