import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '@/lib/database';
import { Media } from '@/models';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// GET - Get user's call sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    // Use 'customer' as default - 'user' or 'astrologer' also accepted for backward compatibility
    const userType = searchParams.get('userType') || 'customer';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing user ID',
        message: 'User ID is required'
      }, { status: 400 });
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Build query based on user type - filter for call sessions (voice and video)
    const query: Record<string, unknown> = {
      session_type: { $in: ['voice_call', 'video_call'] } // Only get call sessions from unified collection
    };
    const isCustomer = userType === 'customer';
    if (isCustomer) {
      query.user_id = userId;
    } else {
      query.astrologer_id = userId;
    }
    
    if (status) {
      query.status = status;
    }

    // Get call sessions with pagination
    const callSessions = await sessionsCollection
      .find(query)
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalSessions = await sessionsCollection.countDocuments(query);

    // Populate user and astrologer details
    const populatedSessions = await Promise.all(
      callSessions.map(async (session) => {
        const [user, astrologer] = await Promise.all([
          usersCollection.findOne({ user_id: session.user_id }),
          usersCollection.findOne({ user_id: session.astrologer_id, user_type: 'astrologer' })
        ]);

        // Resolve profile images from media library
        const userProfileImage = user ? await Media.resolveProfileImage(user, baseUrl) : null;
        const astrologerProfileImage = astrologer ? await Media.resolveProfileImage(astrologer, baseUrl) : null;

        return {
          id: session._id.toString(),
          _id: session._id.toString(),
          session_id: session._id.toString(),
          user: user ? {
            id: user.user_id,
            _id: user.user_id,
            full_name: user.full_name,
            name: user.full_name,
            email_address: user.email_address,
            email: user.email_address,
            phone_number: user.phone_number,
            user_type: user.user_type || 'customer',
            account_status: user.account_status || 'active',
            verification_status: user.verification_status || 'verified',
            auth_type: user.auth_type || 'email',
            profile_image: userProfileImage || ''
          } : {
            id: session.user_id,
            name: 'Unknown User',
            user_type: 'customer',
            account_status: 'active',
            verification_status: 'verified',
            auth_type: 'email'
          },
          astrologer: astrologer ? {
            id: astrologer.user_id,
            _id: astrologer.user_id,
            user_id: astrologer.user_id,
            full_name: astrologer.full_name,
            name: astrologer.full_name,
            email_address: astrologer.email_address || '',
            phone_number: astrologer.phone_number,
            user_type: 'astrologer',
            account_status: astrologer.account_status || 'active',
            verification_status: astrologer.verification_status || 'verified',
            profile_image: astrologerProfileImage || '',
            call_rate: astrologer.call_rate || 0,
            video_rate: astrologer.video_rate || 0,
            chat_rate: astrologer.chat_rate || 0,
            rating: astrologer.rating || 0,
            total_reviews: astrologer.total_reviews || 0,
            total_consultations: astrologer.total_consultations || 0,
            experience_years: astrologer.experience_years || 0,
            is_online: astrologer.is_online || false,
            is_available: astrologer.is_available || false,
            languages: astrologer.languages || [],
            skills: astrologer.skills || [],
            qualifications: astrologer.qualifications || [],
            bio: astrologer.bio || '',
            created_at: astrologer.created_at || new Date().toISOString(),
            updated_at: astrologer.updated_at || new Date().toISOString()
          } : {
            id: session.astrologer_id,
            full_name: 'Unknown Astrologer',
            name: 'Unknown Astrologer',
            email_address: '',
            user_type: 'astrologer',
            account_status: 'active',
            verification_status: 'verified',
            call_rate: 0,
            video_rate: 0,
            chat_rate: 0,
            rating: 0,
            total_reviews: 0,
            total_consultations: 0,
            experience_years: 0,
            is_online: false,
            is_available: false,
            languages: [],
            skills: [],
            qualifications: [],
            bio: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          call_type: session.call_type || (session.session_type === 'video_call' ? 'video' : 'voice'),
          status: session.status,
          rate_per_minute: session.rate_per_minute,
          start_time: session.start_time,
          end_time: session.end_time,
          duration_minutes: session.duration_minutes,
          total_amount: session.total_amount,
          call_quality_rating: session.call_quality_rating,
          created_at: session.created_at,
          updated_at: session.updated_at
        };
      })
    );
    return NextResponse.json({
      success: true,
      call_sessions: populatedSessions,
      pagination: {
        total: totalSessions,
        page,
        limit,
        totalPages: Math.ceil(totalSessions / limit)
      }
    });

  } catch(error) {
    console.error('Call sessions GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching call sessions'
    }, { status: 500 });
  }
}

// POST - Create new call session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, astrologer_id, call_type = 'voice' } = body; // call_type: 'voice' or 'video'

    if (!user_id || !astrologer_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'User ID and Astrologer ID are required'
      }, { status: 400 });
    }

    if (!['voice', 'video'].includes(call_type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid call type',
        message: 'Call type must be either voice or video'
      }, { status: 400 });
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Check if astrologer exists and is online (removed availability check)
    const astrologer = await usersCollection.findOne({
      user_id: astrologer_id,
      user_type: 'astrologer',
      is_online: true
    });

    if (!astrologer) {
      return NextResponse.json({
        success: false,
        error: 'Astrologer not available',
        message: 'Astrologer is not available for calls'
      }, { status: 400 });
    }

    // Check if user exists
    const user = await usersCollection.findOne({ user_id: user_id });
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if there's already an active call session
    const sessionType = call_type === 'video' ? 'video_call' : 'voice_call';
    const existingSession = await sessionsCollection.findOne({
      session_type: sessionType,
      user_id: user_id,
      astrologer_id: astrologer_id,
      status: { $in: ['pending', 'ringing', 'active'] }
    });

    if (existingSession) {
      // Resolve profile images for the response
      const existingUserImage = await Media.resolveProfileImage(user, baseUrl);
      const existingAstrologerImage = await Media.resolveProfileImage(astrologer, baseUrl);

      // Return full session data with user and astrologer info
      const sessionId = existingSession._id.toString();
      return NextResponse.json({
        success: true,
        message: 'Active call session already exists',
        session_id: sessionId,
        session: {
          id: sessionId,
          _id: sessionId,
          status: existingSession.status,
          session_type: existingSession.session_type,
          call_type: call_type,
          rate_per_minute: existingSession.rate_per_minute,
          created_at: existingSession.created_at,
          updated_at: existingSession.updated_at,
          user: {
            id: user.user_id,
            _id: user.user_id,
            full_name: user.full_name,
            name: user.full_name,
            email_address: user.email_address,
            email: user.email_address,
            phone_number: user.phone_number,
            user_type: user.user_type || 'customer',
            account_status: user.account_status || 'active',
            verification_status: user.verification_status || 'verified',
            auth_type: user.auth_type || 'email',
            profile_image: existingUserImage || ''
          },
          astrologer: {
            id: astrologer.user_id,
            _id: astrologer.user_id,
            user_id: astrologer.user_id,
            full_name: astrologer.full_name,
            name: astrologer.full_name,
            email_address: astrologer.email_address || '',
            phone_number: astrologer.phone_number,
            user_type: 'astrologer',
            account_status: astrologer.account_status || 'active',
            verification_status: astrologer.verification_status || 'verified',
            profile_image: existingAstrologerImage || '',
            call_rate: astrologer.call_rate || 0,
            video_rate: astrologer.video_rate || 0,
            chat_rate: astrologer.chat_rate || 0,
            rating: astrologer.rating || 0,
            total_reviews: astrologer.total_reviews || 0,
            total_consultations: astrologer.total_consultations || 0,
            experience_years: astrologer.experience_years || 0,
            is_online: astrologer.is_online || false,
            is_available: astrologer.is_available || false,
            languages: astrologer.languages || [],
            skills: astrologer.skills || [],
            qualifications: astrologer.qualifications || [],
            bio: astrologer.bio || '',
            created_at: astrologer.created_at || new Date().toISOString(),
            updated_at: astrologer.updated_at || new Date().toISOString()
          }
        }
      });
    }

    // Create new call session in unified sessions collection
    const sessionData = {
      _id: new ObjectId(),
      session_id: new ObjectId().toString(),
      session_type: sessionType, // 'voice_call' or 'video_call'
      user_id: user_id,
      astrologer_id: astrologer_id,
      status: 'pending', // pending -> ringing -> active -> completed/missed/rejected
      rate_per_minute: call_type === 'video' ? (astrologer.video_rate || astrologer.call_rate || 10.0) : (astrologer.call_rate || 8.0),
      start_time: null,
      end_time: null,
      duration_minutes: 0,
      total_amount: 0.0,

      // Chat-specific fields (null for calls)
      last_message: null,
      last_message_time: null,
      user_unread_count: 0,
      astrologer_unread_count: 0,

      // Call-specific fields
      call_quality_rating: null,
      connection_id: null, // For WebRTC connection

      billing_updated_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await sessionsCollection.insertOne(sessionData);
    const sessionId = result.insertedId.toString();

    // Resolve profile images for the response
    const newUserImage = await Media.resolveProfileImage(user, baseUrl);
    const newAstrologerImage = await Media.resolveProfileImage(astrologer, baseUrl);

    return NextResponse.json({
      success: true,
      message: 'Call session created successfully',
      session_id: sessionId,
      session: {
        id: sessionId,
        _id: sessionId,
        status: sessionData.status,
        session_type: sessionData.session_type,
        call_type: call_type,
        rate_per_minute: sessionData.rate_per_minute,
        created_at: sessionData.created_at,
        updated_at: sessionData.updated_at,
        user: {
          id: user.user_id,
          _id: user.user_id,
          full_name: user.full_name,
          name: user.full_name,
          email_address: user.email_address,
          email: user.email_address,
          phone_number: user.phone_number,
          user_type: user.user_type || 'customer',
          account_status: user.account_status || 'active',
          verification_status: user.verification_status || 'verified',
          auth_type: user.auth_type || 'email',
          profile_image: newUserImage || ''
        },
        astrologer: {
          id: astrologer.user_id,
          _id: astrologer.user_id,
          user_id: astrologer.user_id,
          full_name: astrologer.full_name,
          name: astrologer.full_name,
          email_address: astrologer.email_address || '',
          phone_number: astrologer.phone_number,
          user_type: 'astrologer',
          account_status: astrologer.account_status || 'active',
          verification_status: astrologer.verification_status || 'verified',
          profile_image: newAstrologerImage || '',
          call_rate: astrologer.call_rate || 0,
          video_rate: astrologer.video_rate || 0,
          chat_rate: astrologer.chat_rate || 0,
          rating: astrologer.rating || 0,
          total_reviews: astrologer.total_reviews || 0,
          total_consultations: astrologer.total_consultations || 0,
          experience_years: astrologer.experience_years || 0,
          is_online: astrologer.is_online || false,
          is_available: astrologer.is_available || false,
          languages: astrologer.languages || [],
          skills: astrologer.skills || [],
          qualifications: astrologer.qualifications || [],
          bio: astrologer.bio || '',
          created_at: astrologer.created_at || new Date().toISOString(),
          updated_at: astrologer.updated_at || new Date().toISOString()
        }
      }
    }, { status: 201 });

  } catch(error) {
    console.error('Call session POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating call session'
    }, { status: 500 });
  }
}