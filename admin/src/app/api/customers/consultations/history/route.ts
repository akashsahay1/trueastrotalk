import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { jwtVerify } from 'jose';
import { Media } from '@/models';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired' 
      }, { status: 401 });
    }

    // Verify user is a customer
    if (payload.user_type !== 'customer') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Customer account required.' 
      }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const type = url.searchParams.get('type'); // 'call', 'chat', 'video'

    // Connect to MongoDB
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Build query
    const query: Record<string, unknown> = {
      user_id: payload.userId as string,
      status: { $in: ['completed', 'cancelled'] } // Only show finished sessions
    };

    if (type) {
      query.session_type = type;
    }

    // Get sessions
    const sessions = await sessionsCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Get astrologer details for each session
    const enrichedConsultations = [];

    for (const session of sessions) {
      let astrologer = null;
      let astrologerImage = null;

      try {
        // Find astrologer using user_id field
        astrologer = await usersCollection.findOne(
          { user_id: session.astrologer_id },
          { projection: { full_name: 1, profile_image_id: 1 } }
        );

        // Resolve astrologer profile image from media library
        if (astrologer) {
          astrologerImage = await Media.resolveProfileImage(astrologer, baseUrl);
        }
      } catch (error) {
        console.error('Error fetching astrologer details:', error);
      }

      // Map session type to consultation type
      let consultationType = 'call';
      const sessionType = session.session_type || session.type || '';
      if (sessionType === 'chat') {
        consultationType = 'chat';
      } else if (sessionType === 'video_call') {
        consultationType = 'video';
      } else {
        consultationType = 'call';
      }

      // Format duration
      const durationMinutes = session.duration_minutes || 0;
      const durationStr = `${durationMinutes} min`;

      enrichedConsultations.push({
        id: session._id.toString(),
        session_id: session._id.toString(),
        astrologer_id: session.astrologer_id,
        astrologer_user_id: session.astrologer_id,
        astrologer_name: astrologer?.full_name || 'Unknown Astrologer',
        astrologer_image: astrologerImage || '',
        type: consultationType,
        duration: durationStr,
        amount: session.total_amount || session.amount || 0,
        created_at: session.created_at || session.createdAt || new Date().toISOString(),
        status: session.status || 'completed',
        rating: session.customer_rating,
        review: session.customer_review
      });
    }

    // Get total count
    const totalCount = await sessionsCollection.countDocuments(query);
    const hasMore = (offset + limit) < totalCount;
    return NextResponse.json({
      success: true,
      data: {
        consultations: enrichedConsultations,
        has_more: hasMore,
        total_count: totalCount
      }
    });

  } catch(error) {
    console.error('Error fetching consultation history:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while retrieving consultation history'
    }, { status: 500 });
  }
}