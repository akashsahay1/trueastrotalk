import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';
import { NotificationService } from '@/lib/notifications';
import { Media } from '@/models';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// GET - Get call session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    // Use 'customer' as default instead of 'user'
    const userType = searchParams.get('userType') || 'customer';

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session ID',
        message: 'Valid session ID is required'
      }, { status: 400 });
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Get call session (voice_call or video_call)
    const session = await sessionsCollection.findOne({
      _id: new ObjectId(sessionId),
      session_type: { $in: ['voice_call', 'video_call'] }
    });

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Call session not found'
      }, { status: 404 });
    }

    // Verify user access
    const isCustomer = userType === 'customer';
    if (userId && isCustomer && session.user_id !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this call session'
      }, { status: 403 });
    }

    if (userId && userType === 'astrologer' && session.astrologer_id !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this call session'
      }, { status: 403 });
    }

    // Get user and astrologer details
    const [user, astrologer] = await Promise.all([
      usersCollection.findOne({ user_id: session.user_id }),
      usersCollection.findOne({ user_id: session.astrologer_id, user_type: 'astrologer' })
    ]);

    // Resolve profile images from media library
    const userProfileImage = user ? await Media.resolveProfileImage(user, baseUrl) : null;
    const astrologerProfileImage = astrologer ? await Media.resolveProfileImage(astrologer, baseUrl) : null;

    // Format response
    const formattedSession = {
      _id: session._id.toString(),
      session_id: session._id.toString(),
      user: user ? {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        profile_image: userProfileImage || ''
      } : null,
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
      } : null,
      call_type: session.call_type,
      status: session.status,
      rate_per_minute: session.rate_per_minute,
      start_time: session.start_time,
      end_time: session.end_time,
      duration_minutes: session.duration_minutes,
      total_amount: session.total_amount,
      call_quality_rating: session.call_quality_rating,
      connection_id: session.connection_id,
      created_at: session.created_at,
      updated_at: session.updated_at
    };
    return NextResponse.json({
      success: true,
      session: formattedSession
    });

  } catch(error) {
    console.error('Call session details GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching call session details'
    }, { status: 500 });
  }
}

// PUT - Update call session (answer/reject/end/rate)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    const body = await request.json();
    const { action, user_id, user_type, connection_id, rating } = body; 
    // action: 'answer', 'reject', 'end', 'rate', 'ring'

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session ID',
        message: 'Valid session ID is required'
      }, { status: 400 });
    }

    if (!action || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Action and user ID are required'
      }, { status: 400 });
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');

    // Get session (voice_call or video_call)
    const session = await sessionsCollection.findOne({
      _id: new ObjectId(sessionId),
      session_type: { $in: ['voice_call', 'video_call'] }
    });

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Call session not found'
      }, { status: 404 });
    }

    // Verify user has permission to perform this action
    const isCustomerAction = user_type === 'customer';
    if (isCustomerAction && session.user_id !== user_id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to modify this session'
      }, { status: 403 });
    }

    if (user_type === 'astrologer' && session.astrologer_id !== user_id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to modify this session'
      }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    let message = '';

    switch (action) {
      case 'ring':
        if (session.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only ring pending call sessions'
          }, { status: 400 });
        }
        updateData.status = 'ringing';
        message = 'Call is now ringing';
        break;

      case 'answer':
        if (session.status !== 'ringing' && session.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only answer ringing or pending call sessions'
          }, { status: 400 });
        }
        updateData.status = 'active';
        updateData.start_time = new Date();
        if (connection_id) {
          updateData.connection_id = connection_id;
        }
        message = 'Call answered and started';
        break;

      case 'reject':
        if (!['pending', 'ringing'].includes(session.status)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only reject pending or ringing call sessions'
          }, { status: 400 });
        }
        updateData.status = 'rejected';
        message = 'Call was rejected';
        break;

      case 'end':
        if (session.status !== 'active') {
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only end active call sessions'
          }, { status: 400 });
        }

        const endTime = new Date();
        const durationMs = endTime.getTime() - session.start_time.getTime();
        const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Round up to next minute
        const totalAmount = durationMinutes * session.rate_per_minute;

        updateData.status = 'completed';
        updateData.end_time = endTime;
        updateData.duration_minutes = durationMinutes;
        updateData.total_amount = Math.round(totalAmount * 100) / 100; // Round to 2 decimal places
        message = `Call ended. Duration: ${durationMinutes} minutes. Total: ₹${updateData.total_amount}`;

        // Send session end notifications to both parties
        try {
          const callType = session.call_type === 'video' ? 'video' : 'call';
          await NotificationService.sendSessionEndedNotification(
            session.user_id,
            session.astrologer_id,
            callType,
            durationMinutes,
            updateData.total_amount as number,
            sessionId
          );
        } catch (notifError) {
          console.error('Failed to send session end notifications:', notifError);
          // Don't fail the request if notification fails
        }
        break;

      case 'rate':
        if (session.status !== 'completed') {
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only rate completed call sessions'
          }, { status: 400 });
        }
        
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({
            success: false,
            error: 'Invalid rating',
            message: 'Rating must be between 1 and 5'
          }, { status: 400 });
        }

        updateData.call_quality_rating = rating;
        message = 'Call rating submitted successfully';
        break;

      case 'missed':
        if (!['ringing', 'pending'].includes(session.status)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only mark ringing or pending calls as missed'
          }, { status: 400 });
        }
        updateData.status = 'missed';
        message = 'Call marked as missed';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Invalid action specified'
        }, { status: 400 });
    }

    // Update session
    await sessionsCollection.updateOne(
      { _id: new ObjectId(sessionId), session_type: { $in: ['voice_call', 'video_call'] } },
      { $set: updateData }
    );
    const sessionResponse: Record<string, unknown> = {
      _id: sessionId,
      status: updateData.status,
    };
    
    if (updateData.duration_minutes) {
      sessionResponse.duration_minutes = updateData.duration_minutes;
    }
    if (updateData.total_amount) {
      sessionResponse.total_amount = updateData.total_amount;
    }
    if (updateData.call_quality_rating) {
      sessionResponse.call_quality_rating = updateData.call_quality_rating;
    }

    return NextResponse.json({
      success: true,
      message: message,
      session: sessionResponse
    });

  } catch(error) {
    console.error('Call session update PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating call session'
    }, { status: 500 });
  }
}