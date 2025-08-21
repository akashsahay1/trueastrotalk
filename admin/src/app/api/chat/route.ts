import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Get user's chat sessions
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
    const chatSessionsCollection = db.collection('chat_sessions');
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

    // Get chat sessions with pagination
    const chatSessions = await chatSessionsCollection
      .find(query)
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalSessions = await chatSessionsCollection.countDocuments(query);

    // Populate user and astrologer details
    const populatedSessions = await Promise.all(
      chatSessions.map(async (session) => {
        const [user, astrologer] = await Promise.all([
          usersCollection.findOne({ _id: new ObjectId(session.user_id) }),
          astrologersCollection.findOne({ _id: new ObjectId(session.astrologer_id) })
        ]);

        return {
          _id: session._id.toString(),
          session_id: session._id.toString(),
          user: user ? {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            profile_image: user.profile_image
          } : null,
          astrologer: astrologer ? {
            _id: astrologer._id.toString(),
            full_name: astrologer.full_name,
            email_address: astrologer.email_address,
            profile_image: astrologer.profile_image,
            chat_rate: astrologer.chat_rate,
            is_online: astrologer.is_online
          } : null,
          status: session.status,
          rate_per_minute: session.rate_per_minute,
          start_time: session.start_time,
          end_time: session.end_time,
          duration_minutes: session.duration_minutes,
          total_amount: session.total_amount,
          last_message: session.last_message,
          last_message_time: session.last_message_time,
          unread_count: userType === 'user' ? session.user_unread_count : session.astrologer_unread_count,
          created_at: session.created_at,
          updated_at: session.updated_at
        };
      })
    );

    await client.close();

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

  } catch(error) {
    console.error('Chat sessions GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching chat sessions'
    }, { status: 500 });
  }
}

// POST - Create new chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, astrologer_id } = body;

    if (!user_id || !astrologer_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'User ID and Astrologer ID are required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const chatSessionsCollection = db.collection('chat_sessions');
    const astrologersCollection = db.collection('astrologers');
    const usersCollection = db.collection('users');

    // Check if astrologer exists and is available
    const astrologer = await astrologersCollection.findOne({ 
      _id: new ObjectId(astrologer_id),
      is_online: true,
      is_available: true
    });

    if (!astrologer) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Astrologer not available',
        message: 'Astrologer is not available for chat'
      }, { status: 400 });
    }

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(user_id) });
    if (!user) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if there's already an active session
    const existingSession = await chatSessionsCollection.findOne({
      user_id: user_id,
      astrologer_id: astrologer_id,
      status: { $in: ['pending', 'active'] }
    });

    if (existingSession) {
      await client.close();
      return NextResponse.json({
        success: true,
        message: 'Active session already exists',
        session_id: existingSession._id.toString(),
        session: {
          _id: existingSession._id.toString(),
          status: existingSession.status,
          rate_per_minute: existingSession.rate_per_minute,
          start_time: existingSession.start_time
        }
      });
    }

    // Create new chat session
    const sessionData = {
      user_id: user_id,
      astrologer_id: astrologer_id,
      status: 'pending', // pending -> active -> completed
      rate_per_minute: astrologer.chat_rate || 5.0,
      start_time: new Date(),
      end_time: null,
      duration_minutes: 0,
      total_amount: 0.0,
      last_message: null,
      last_message_time: null,
      user_unread_count: 0,
      astrologer_unread_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await chatSessionsCollection.insertOne(sessionData);
    const sessionId = result.insertedId.toString();

    await client.close();

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
          name: user.name,
          email: user.email
        },
        astrologer: {
          _id: astrologer._id.toString(),
          full_name: astrologer.full_name,
          email_address: astrologer.email_address,
          chat_rate: astrologer.chat_rate
        }
      }
    }, { status: 201 });

  } catch(error) {
    console.error('Chat session POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating chat session'
    }, { status: 500 });
  }
}