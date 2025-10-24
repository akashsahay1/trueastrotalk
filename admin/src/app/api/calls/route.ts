import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Get user's call sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType') || 'user'; // 'user' or 'astrologer'
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

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const callSessionsCollection = db.collection('call_sessions');
    const usersCollection = db.collection('users');
    const astrologersCollection = db.collection('astrologers');

    // Build query based on user type
    const query: Record<string, unknown> = {};
    if (userType === 'user') {
      query.user_id = userId;
    } else {
      query.astrologer_id = userId;
    }
    
    if (status) {
      query.status = status;
    }

    // Get call sessions with pagination
    const callSessions = await callSessionsCollection
      .find(query)
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalSessions = await callSessionsCollection.countDocuments(query);

    // Populate user and astrologer details
    const populatedSessions = await Promise.all(
      callSessions.map(async (session) => {
        const [user, astrologer] = await Promise.all([
          usersCollection.findOne({ user_id: session.user_id }),
          astrologersCollection.findOne({ user_id: session.astrologer_id })
        ]);

        return {
          _id: session._id.toString(),
          session_id: session._id.toString(),
          user: user ? {
            _id: user.user_id,
            name: user.full_name,
            email: user.email_address,
            profile_image: user.profile_image
          } : null,
          astrologer: astrologer ? {
            _id: astrologer.user_id,
            full_name: astrologer.full_name,
            email_address: astrologer.email_address,
            profile_image: astrologer.profile_image,
            call_rate: astrologer.call_rate,
            is_online: astrologer.is_online
          } : null,
          call_type: session.call_type,
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

    await client.close();

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

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const callSessionsCollection = db.collection('call_sessions');
    const astrologersCollection = db.collection('astrologers');
    const usersCollection = db.collection('users');

    // Check if astrologer exists and is online (removed availability check)
    const astrologer = await astrologersCollection.findOne({ 
      user_id: astrologer_id,
      is_online: true
    });

    if (!astrologer) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Astrologer not available',
        message: 'Astrologer is not available for calls'
      }, { status: 400 });
    }

    // Check if user exists
    const user = await usersCollection.findOne({ user_id: user_id });
    if (!user) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if there's already an active call session
    const existingSession = await callSessionsCollection.findOne({
      user_id: user_id,
      astrologer_id: astrologer_id,
      status: { $in: ['pending', 'ringing', 'active'] }
    });

    if (existingSession) {
      await client.close();
      return NextResponse.json({
        success: true,
        message: 'Active call session already exists',
        session_id: existingSession._id.toString(),
        session: {
          _id: existingSession._id.toString(),
          status: existingSession.status,
          call_type: existingSession.call_type,
          rate_per_minute: existingSession.rate_per_minute,
          start_time: existingSession.start_time
        }
      });
    }

    // Create new call session
    const sessionData = {
      user_id: user_id,
      astrologer_id: astrologer_id,
      call_type: call_type,
      status: 'pending', // pending -> ringing -> active -> completed/missed/rejected
      rate_per_minute: call_type === 'video' ? (astrologer.video_call_rate || astrologer.call_rate || 10.0) : (astrologer.call_rate || 8.0),
      start_time: null,
      end_time: null,
      duration_minutes: 0,
      total_amount: 0.0,
      call_quality_rating: null,
      connection_id: null, // For WebRTC connection
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await callSessionsCollection.insertOne(sessionData);
    const sessionId = result.insertedId.toString();

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Call session created successfully',
      session_id: sessionId,
      session: {
        _id: sessionId,
        status: sessionData.status,
        call_type: sessionData.call_type,
        rate_per_minute: sessionData.rate_per_minute,
        created_at: sessionData.created_at,
        user: {
          _id: user.user_id,
          name: user.full_name,
          email: user.email_address
        },
        astrologer: {
          _id: astrologer.user_id,
          full_name: astrologer.full_name,
          email_address: astrologer.email_address,
          call_rate: astrologer.call_rate,
          video_call_rate: astrologer.video_call_rate
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