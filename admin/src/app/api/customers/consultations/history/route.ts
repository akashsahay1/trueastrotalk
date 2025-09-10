import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

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
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');

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
      
      try {
        // Find astrologer using user_id field
        astrologer = await usersCollection.findOne(
          { user_id: session.astrologer_id },
          { projection: { full_name: 1, profile_image_id: 1 } }
        );
      } catch (error) {
        console.error('Error fetching astrologer details:', error);
      }

      enrichedConsultations.push({
        _id: session._id,
        astrologer_id: session.astrologer_id,
        astrologer_name: astrologer?.full_name || 'Unknown Astrologer',
        astrologer_image: astrologer?.profile_image,
        type: session.session_type || session.type || 'call',
        duration: session.duration || '0 min',
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

    await client.close();

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