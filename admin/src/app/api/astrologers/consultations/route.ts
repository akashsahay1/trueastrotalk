import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
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

interface SessionData {
  _id: { toString(): string };
  user_id?: string;
  customer_id?: { toString(): string };
  client_name?: string;
  client_image?: string;
  client_phone?: string;
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
  scheduled_at?: Date;
  started_at?: Date;
  ended_at?: Date;
  duration_minutes?: number;
  total_amount?: number;
  astrologer_earnings?: number;
  rating?: number;
  review?: string;
  notes?: string;
  astrologer_notes?: string;
  service_type?: string;
}

// GET - Astrologer consultations history
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
      astrologer_id: astrologerId
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
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Helper function to build consultation object
    const buildConsultation = (session: SessionData, sessionType: string) => {
      return {
        id: session._id.toString(),
        consultation_id: session._id.toString(),
        client_id: session.user_id || session.customer_id?.toString() || '',
        client_name: session.client_name || 'Unknown Client',
        client_image: session.client_image || '',
        client_phone: session.client_phone || '',
        type: sessionType,
        status: mapSessionStatus(session.status || 'unknown'),
        scheduled_time: session.created_at || session.scheduled_at,
        start_time: session.started_at,
        end_time: session.ended_at,
        duration_minutes: session.duration_minutes || 0,
        total_amount: session.total_amount || 0,
        astrologer_earnings: session.astrologer_earnings || ((session.total_amount || 0) * 0.7), // 70% commission
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
      const chatMatch = { ...baseMatch, session_type: 'chat' };
      const chatSessions = await sessionsCollection
        .find(chatMatch)
        .sort({ created_at: -1 })
        .toArray();

      const chatConsultations = chatSessions.map(session =>
        buildConsultation(session, 'chat')
      );
      consultations = consultations.concat(chatConsultations);
    }

    if (!type || type === 'voice_call' || type === 'video_call' || type === 'video' || type === 'voice' || type === 'call') {
      // Fetch call sessions
      const callMatch: Record<string, unknown> = { ...baseMatch };
      if (type === 'voice_call' || type === 'voice') {
        callMatch.session_type = { $in: ['voice_call', 'voice'] };
      } else if (type === 'video_call' || type === 'video') {
        callMatch.session_type = { $in: ['video_call', 'video'] };
      } else if (type === 'call') {
        callMatch.session_type = { $in: ['voice_call', 'video_call', 'video', 'voice', 'call'] };
      } else {
        callMatch.session_type = { $in: ['voice_call', 'video_call', 'video', 'voice', 'call'] };
      }

      const callSessions = await sessionsCollection
        .find(callMatch)
        .sort({ created_at: -1 })
        .toArray();

      console.log('📋 Call sessions found:', callSessions.length);
      callSessions.forEach((s: Record<string, unknown>, i: number) => {
        console.log(`  Session ${i + 1}: user_id=${s.user_id}, type=${s.session_type}, duration=${s.duration_minutes}, amount=${s.total_amount}`);
      });

      const callConsultations = callSessions.map(session => {
        const callType = (session.session_type === 'video_call' || session.session_type === 'video') ? 'video_call' : 'voice_call';
        return buildConsultation(session, callType);
      });
      consultations = consultations.concat(callConsultations);
    }

    // Sort by scheduled_time (most recent first)
    consultations.sort((a, b) => {
      const dateA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
      const dateB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
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
      .filter(id => id && typeof id === 'string' && id.trim().length > 0)
    )];

    console.log('📋 Client IDs to lookup:', clientIds);

    let clientsData: Record<string, { name?: string; image?: string; phone?: string; email?: string }> = {};
    if (clientIds.length > 0) {
      const clients = await usersCollection
        .find({
          user_id: { $in: clientIds }
        })
        .project({
          user_id: 1,
          full_name: 1,
          profile_image_id: 1,
          phone_number: 1,
          email_address: 1
        })
        .toArray();

      console.log('📋 Found clients:', clients.length, clients.map((c: Record<string, unknown>) => ({ user_id: c.user_id, full_name: c.full_name })));

      // Resolve profile images for all clients
      for (const client of clients) {
        const userId = (client as unknown as { user_id: string }).user_id;
        const profileImage = await Media.resolveProfileImage(client, baseUrl);
        clientsData[userId] = {
          name: (client as unknown as { full_name?: string }).full_name,
          image: profileImage || undefined,
          phone: (client as unknown as { phone_number?: string }).phone_number,
          email: (client as unknown as { email_address?: string }).email_address
        };
      }
    } else {
      console.log('📋 No client IDs found in consultations');
    }

    // Enhance consultations with client data
    const enhancedConsultations = paginatedConsultations.map(consultation => {
      const clientData = clientsData[consultation.client_id];
      if (clientData) {
        return {
          ...consultation,
          client_name: clientData.name || consultation.client_name,
          client_image: clientData.image || consultation.client_image,
          client_phone: clientData.phone || consultation.client_phone,
          client_email: clientData.email
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

    // Use unified sessions collection
    const sessionsCollection = await DatabaseService.getCollection('sessions');

    // Determine session_type filter - account for different naming conventions
    let sessionTypeFilter: string | { $in: string[] };
    if (session_type === 'voice_call' || session_type === 'voice') {
      sessionTypeFilter = { $in: ['voice_call', 'voice', 'call'] };
    } else if (session_type === 'video_call' || session_type === 'video') {
      sessionTypeFilter = { $in: ['video_call', 'video'] };
    } else if (session_type === 'chat') {
      sessionTypeFilter = 'chat';
    } else {
      sessionTypeFilter = { $in: ['chat', 'voice_call', 'video_call', 'voice', 'video', 'call'] };
    }

    // Build query for finding consultation - support both ObjectId and string IDs
    let sessionQuery: Record<string, unknown>;
    if (ObjectId.isValid(consultation_id as string)) {
      sessionQuery = { _id: new ObjectId(consultation_id as string), session_type: sessionTypeFilter };
    } else {
      sessionQuery = { session_id: consultation_id as string, session_type: sessionTypeFilter };
    }

    // Find the consultation
    console.log('🔍 Looking up consultation:', { consultation_id, astrologerId, sessionQuery });

    const consultation = await sessionsCollection.findOne({
      ...sessionQuery,
      astrologer_id: astrologerId
    });

    if (!consultation) {
      // Debug: Try to find the session without astrologer filter to diagnose
      const sessionWithoutAstrologer = await sessionsCollection.findOne(sessionQuery);
      console.log('❌ Consultation not found. Session exists without astrologer filter:', !!sessionWithoutAstrologer);
      if (sessionWithoutAstrologer) {
        console.log('  Session astrologer_id:', sessionWithoutAstrologer.astrologer_id, 'vs requested:', astrologerId);
        console.log('  Session type:', sessionWithoutAstrologer.session_type);
      }

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
        // Allow joining scheduled, pending, or ringing consultations
        // If already active/ongoing, return success without updating (user is reconnecting)
        if (consultation.status === 'active' || consultation.status === 'ongoing' || consultation.status === 'in_progress') {
          // Already active, return success without updating
          return NextResponse.json({
            success: true,
            message: 'Consultation is already active',
            consultation: {
              ...consultation,
              _id: consultation._id.toString()
            }
          });
        }
        if (consultation.status !== 'scheduled' && consultation.status !== 'pending' && consultation.status !== 'ringing') {
          return NextResponse.json({
            success: false,
            error: 'INVALID_STATUS',
            message: `Cannot join consultation with status '${consultation.status}'. Only scheduled, pending, or ringing consultations can be joined.`
          }, { status: 400 });
        }
        updateData = {
          ...updateData,
          status: 'ongoing',
          started_at: new Date()
        };
        break;

      case 'end':
        if (consultation.status !== 'ongoing' && consultation.status !== 'in_progress' && consultation.status !== 'active') {
          return NextResponse.json({
            success: false,
            error: 'INVALID_STATUS',
            message: `Cannot end consultation with status '${consultation.status}'. Only active consultations can be ended.`
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
    const updateResult = await sessionsCollection.updateOne(
      sessionQuery,
      { $set: updateData }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update consultation'
      }, { status: 500 });
    }


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