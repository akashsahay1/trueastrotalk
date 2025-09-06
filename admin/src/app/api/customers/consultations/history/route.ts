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
    const consultationsCollection = db.collection('consultations');
    const usersCollection = db.collection('users');

    // Build query
    const query: Record<string, unknown> = {
      customer_id: payload.userId as string,
      status: { $in: ['completed', 'cancelled'] } // Only show finished consultations
    };

    if (type) {
      query.consultation_type = type;
    }

    // Get consultations
    const consultations = await consultationsCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Get astrologer details for each consultation
    const enrichedConsultations = [];
    
    for (const consultation of consultations) {
      let astrologer = null;
      
      try {
        astrologer = await usersCollection.findOne(
          { _id: new ObjectId(consultation.astrologer_id) },
          { projection: { full_name: 1, profile_image: 1 } }
        );
      } catch (error) {
        console.error('Error fetching astrologer details:', error);
      }

      enrichedConsultations.push({
        _id: consultation._id,
        astrologer_id: consultation.astrologer_id,
        astrologer_name: astrologer?.full_name || 'Unknown Astrologer',
        astrologer_image: astrologer?.profile_image,
        type: consultation.consultation_type || consultation.type || 'call',
        duration: consultation.duration || '0 min',
        amount: consultation.amount || consultation.total_cost || 0,
        created_at: consultation.created_at || consultation.createdAt || new Date().toISOString(),
        status: consultation.status || 'completed',
        rating: consultation.rating,
        review: consultation.review
      });
    }

    // Get total count
    const totalCount = await consultationsCollection.countDocuments(query);
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