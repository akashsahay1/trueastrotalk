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
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const sessionType = searchParams.get('type'); // call, chat, video
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    
    // Calculate skip
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (sessionType) {
      query.session_type = sessionType;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { astrologer_name: { $regex: search, $options: 'i' } },
        { customer_phone: { $regex: search, $options: 'i' } },
        { session_id: { $regex: search, $options: 'i' } }
      ];
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const sessionsCollection = db.collection('sessions');

    // Build MongoDB query
    const mongoQuery: Record<string, unknown> = {};
    
    if (sessionType) {
      mongoQuery.session_type = sessionType;
    }
    
    if (status) {
      mongoQuery.status = status;
    }
    
    if (search) {
      mongoQuery.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { astrologer_name: { $regex: search, $options: 'i' } },
        { customer_phone: { $regex: search, $options: 'i' } },
        { session_id: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await sessionsCollection.countDocuments(mongoQuery);

    // Fetch sessions with pagination
    const sessions = await sessionsCollection
      .find(mongoQuery)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    await client.close();

    // Convert MongoDB documents to proper format
    const formattedSessions = sessions.map(session => ({
      ...session,
      _id: session._id.toString(),
      customer_id: session.customer_id.toString(),
      astrologer_id: session.astrologer_id.toString(),
      start_time: session.start_time.toISOString(),
      end_time: session.end_time ? session.end_time.toISOString() : undefined,
      created_at: session.created_at.toISOString(),
      last_message_time: session.last_message_time ? session.last_message_time.toISOString() : undefined
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        sessions: formattedSessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionIds, deleteAll } = body;

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const sessionsCollection = db.collection('sessions');

    let result;
    if (deleteAll) {
      // Delete all sessions (be careful with this!)
      result = await sessionsCollection.deleteMany({});
    } else if (sessionIds && Array.isArray(sessionIds)) {
      // Delete specific sessions
      result = await sessionsCollection.deleteMany({
        _id: { $in: sessionIds.map((id: string) => new ObjectId(id)) }
      });
    } else {
      await client.close();
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await client.close();

    return NextResponse.json({
      message: `Successfully deleted ${result.deletedCount} sessions`,
      deletedCount: result.deletedCount
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}