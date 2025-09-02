import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
import { 
  SecurityMiddleware, 
  InputSanitizer 
} from '../../../../lib/security';

interface SessionData {
  _id: { toString(): string };
  customer_id?: { toString(): string };
  client_name?: string;
  client_image?: string;
  astrologer_id?: { toString(): string };
  created_at?: Date;
  updated_at?: Date;
  status?: string;
  duration?: number;
  amount?: number;
  commission?: number;
  rate_per_minute?: number;
  client_rating?: number;
  astrologer_rating?: number;
  recording_url?: string;
}

// GET - Astrologer consultations history
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`📋 Astrologer consultations request from IP: ${ip}`);

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

    // Only astrologers can access their consultations
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only astrologers can access consultation data'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, upcoming, completed, cancelled, all
    const type = searchParams.get('type'); // chat, voice_call, video_call
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const astrologerId = authenticatedUser.userId as string;

    // Build base match query
    const baseMatch: Record<string, unknown> = {
      astrologer_id: new ObjectId(astrologerId)
    };

    // Add status filter
    if (status && status !== 'all') {
      const statusMap: Record<string, string> = {
        'active': 'ongoing',
        'upcoming': 'scheduled',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };
      baseMatch.status = statusMap[status] || status;
    }

    // Get collections
    const chatSessionsCollection = await DatabaseService.getCollection('chat_sessions');
    const callSessionsCollection = await DatabaseService.getCollection('call_sessions');
    const usersCollection = await DatabaseService.getCollection('users');

    // Helper function to build consultation object
    const buildConsultation = (session: SessionData, sessionType: string) => {
      return {
        id: session._id.toString(),
        consultation_id: session._id.toString(),
        client_id: session.customer_id?.toString() || '',
        client_name: session.client_name || 'Unknown Client',
        client_image: session.client_image || '',
        client_phone: session.client_phone || '',
        type: sessionType,
        status: mapSessionStatus(session.status),
        scheduled_time: session.created_at || session.scheduled_at,
        start_time: session.started_at,
        end_time: session.ended_at,
        duration_minutes: session.duration_minutes || 0,
        total_amount: session.total_amount || 0,
        astrologer_earnings: session.astrologer_earnings || (session.total_amount * 0.7), // 70% commission
        rating: session.rating,
        review: session.review,
        notes: session.notes || session.astrologer_notes,
        service_type: session.service_type || sessionType,
        created_at: session.created_at,
        updated_at: session.updated_at
      };
    };

    // Helper function to map session status
    function mapSessionStatus(status: string) {
      const statusMap: Record<string, string> = {
        'ongoing': 'active',
        'in_progress': 'active',
        'scheduled': 'upcoming',
        'pending': 'upcoming',
        'completed': 'completed',
        'finished': 'completed',
        'cancelled': 'cancelled',
        'rejected': 'cancelled'
      };
      return statusMap[status] || status;
    }

    // Fetch consultations based on type filter
    let consultations: ReturnType<typeof buildConsultation>[] = [];

    if (!type || type === 'chat') {
      // Fetch chat sessions
      const chatMatch = { ...baseMatch };
      const chatSessions = await chatSessionsCollection
        .find(chatMatch)
        .sort({ created_at: -1 })
        .toArray();

      const chatConsultations = chatSessions.map(session => 
        buildConsultation(session, 'chat')
      );
      consultations = consultations.concat(chatConsultations);
    }

    if (!type || type === 'voice_call' || type === 'video_call') {
      // Fetch call sessions
      const callMatch = { ...baseMatch };
      if (type === 'voice_call') {
        callMatch.call_type = 'voice';
      } else if (type === 'video_call') {
        callMatch.call_type = 'video';
      }

      const callSessions = await callSessionsCollection
        .find(callMatch)
        .sort({ created_at: -1 })
        .toArray();

      const callConsultations = callSessions.map(session => {
        const callType = session.call_type === 'video' ? 'video_call' : 'voice_call';
        return buildConsultation(session, callType);
      });
      consultations = consultations.concat(callConsultations);
    }

    // Sort by scheduled_time (most recent first)
    consultations.sort((a, b) => {
      const dateA = new Date(a.scheduled_time).getTime();
      const dateB = new Date(b.scheduled_time).getTime();
      return dateB - dateA;
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      consultations = consultations.filter(consultation =>
        consultation.client_name.toLowerCase().includes(searchLower) ||
        consultation.notes?.toLowerCase().includes(searchLower) ||
        consultation.consultation_id.includes(searchLower)
      );
    }

    // Apply pagination
    const totalConsultations = consultations.length;
    const paginatedConsultations = consultations.slice(skip, skip + limit);

    // Get client details for consultations
    const clientIds = [...new Set(paginatedConsultations
      .map(c => c.client_id)
      .filter(id => id && ObjectId.isValid(id))
    )];

    let clientsData: Record<string, { full_name?: string; profile_image?: string }> = {};
    if (clientIds.length > 0) {
      const clients = await usersCollection
        .find({ 
          _id: { $in: clientIds.map(id => new ObjectId(id)) }
        })
        .project({ 
          full_name: 1, 
          profile_image_url: 1, 
          phone_number: 1,
          email_address: 1 
        })
        .toArray();

      clientsData = clients.reduce((acc, client) => {
        acc[client._id.toString()] = {
          name: client.full_name,
          image: client.profile_image_url,
          phone: client.phone_number,
          email: client.email_address
        };
        return acc;
      }, {} as Record<string, { full_name?: string; profile_image?: string }>);
    }

    // Enhance consultations with client data
    const enhancedConsultations = paginatedConsultations.map(consultation => {
      const clientData = clientsData[consultation.client_id];
      if (clientData) {
        return {
          ...consultation,
          client_name: clientData.name || consultation.client_name,
          client_image: clientData.image || consultation.client_image,
          client_phone: clientData.phone || consultation.client_phone
        };
      }
      return consultation;
    });

    // Get summary statistics
    const stats = {
      total_consultations: consultations.length,
      active_consultations: consultations.filter(c => c.status === 'active').length,
      upcoming_consultations: consultations.filter(c => c.status === 'upcoming').length,
      completed_consultations: consultations.filter(c => c.status === 'completed').length,
      cancelled_consultations: consultations.filter(c => c.status === 'cancelled').length,
      total_earnings: consultations
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.astrologer_earnings || 0), 0),
      total_duration: consultations
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.duration_minutes || 0), 0),
      average_rating: consultations
        .filter(c => c.rating && c.rating > 0)
        .reduce((sum, c, _, arr) => sum + (c.rating || 0) / arr.length, 0)
    };

    console.log(`✅ Consultations data retrieved for astrologer: ${astrologerId}`);

    return NextResponse.json({
      success: true,
      data: {
        consultations: enhancedConsultations,
        statistics: stats,
        pagination: {
          current_page: page,
          per_page: limit,
          total_consultations: totalConsultations,
          total_pages: Math.ceil(totalConsultations / limit),
          has_next: skip + limit < totalConsultations,
          has_prev: page > 1
        },
        filters: {
          status,
          type,
          search
        },
        metadata: {
          last_updated: new Date(),
          astrologer_id: astrologerId
        }
      }
    });

  } catch (error) {
    console.error('Astrologer consultations error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching consultations data'
    }, { status: 500 });
  }
}

// PUT - Update consultation (join, end, add notes)
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔄 Consultation update request from IP: ${ip}`);

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

    // Only astrologers can update their consultations
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only astrologers can update consultations'
      }, { status: 403 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { consultation_id, action, notes, session_type } = sanitizedBody;

    if (!consultation_id || !ObjectId.isValid(consultation_id as string)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_CONSULTATION_ID',
        message: 'Valid consultation ID is required'
      }, { status: 400 });
    }

    const validActions = ['join', 'end', 'add_notes', 'cancel'];
    if (!validActions.includes(action as string)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ACTION',
        message: 'Action must be one of: join, end, add_notes, cancel'
      }, { status: 400 });
    }

    const astrologerId = authenticatedUser.userId as string;
    const sessionId = new ObjectId(consultation_id as string);

    // Determine which collection to use
    const isCallSession = session_type === 'voice_call' || session_type === 'video_call';
    const collection = await DatabaseService.getCollection(
      isCallSession ? 'call_sessions' : 'chat_sessions'
    );

    // Find the consultation
    const consultation = await collection.findOne({
      _id: sessionId,
      astrologer_id: new ObjectId(astrologerId)
    });

    if (!consultation) {
      return NextResponse.json({
        success: false,
        error: 'CONSULTATION_NOT_FOUND',
        message: 'Consultation not found or access denied'
      }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    switch (action) {
      case 'join':
        if (consultation.status !== 'scheduled' && consultation.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: 'INVALID_STATUS',
            message: 'Can only join scheduled consultations'
          }, { status: 400 });
        }
        updateData = {
          ...updateData,
          status: 'ongoing',
          started_at: new Date()
        };
        break;

      case 'end':
        if (consultation.status !== 'ongoing' && consultation.status !== 'in_progress') {
          return NextResponse.json({
            success: false,
            error: 'INVALID_STATUS',
            message: 'Can only end active consultations'
          }, { status: 400 });
        }
        const endTime = new Date();
        const startTime = consultation.started_at || consultation.created_at;
        const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        updateData = {
          ...updateData,
          status: 'completed',
          ended_at: endTime,
          duration_minutes: durationMinutes
        };
        break;

      case 'add_notes':
        updateData = {
          ...updateData,
          astrologer_notes: notes || '',
          notes: notes || ''
        };
        break;

      case 'cancel':
        if (consultation.status === 'completed') {
          return NextResponse.json({
            success: false,
            error: 'CANNOT_CANCEL_COMPLETED',
            message: 'Cannot cancel completed consultations'
          }, { status: 400 });
        }
        updateData = {
          ...updateData,
          status: 'cancelled',
          cancelled_at: new Date(),
          cancelled_by: 'astrologer'
        };
        break;
    }

    // Update the consultation
    const updateResult = await collection.updateOne(
      { _id: sessionId },
      { $set: updateData }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update consultation'
      }, { status: 500 });
    }

    console.log(`✅ Consultation ${action} successful for: ${consultation_id}`);

    return NextResponse.json({
      success: true,
      message: `Consultation ${action} successful`,
      data: {
        consultation_id: consultation_id,
        action: action,
        status: updateData.status || consultation.status,
        updated_at: updateData.updated_at
      }
    });

  } catch (error) {
    console.error('Consultation update error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while updating consultation'
    }, { status: 500 });
  }
}