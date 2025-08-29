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
    const astrologer = searchParams.get('astrologer') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';
    const rating = searchParams.get('rating') || '';
    
    // Calculate skip
    const skip = (page - 1) * limit;

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
        { user_id: { $regex: search, $options: 'i' } },
        { astrologer_id: { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } }
      ];
    }

    // Additional filters
    if (astrologer) {
      mongoQuery.astrologer_id = { $regex: astrologer, $options: 'i' };
    }

    // Date range filter
    if (fromDate || toDate) {
      const dateQuery: Record<string, Date> = {};
      if (fromDate) {
        dateQuery.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Add one day to include the entire toDate
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        dateQuery.$lt = endDate;
      }
      mongoQuery.created_at = dateQuery;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      const amountQuery: Record<string, number> = {};
      if (minAmount) {
        amountQuery.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        amountQuery.$lte = parseFloat(maxAmount);
      }
      mongoQuery.total_amount = amountQuery;
    }

    // Rating filter (minimum rating)
    if (rating) {
      mongoQuery.customer_rating = { $gte: parseInt(rating) };
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
      user_id: session.user_id ? session.user_id.toString() : session.user_id,
      astrologer_id: session.astrologer_id ? session.astrologer_id.toString() : session.astrologer_id,
      start_time: session.start_time ? session.start_time.toISOString() : session.start_time,
      end_time: session.end_time ? session.end_time.toISOString() : session.end_time,
      created_at: session.created_at ? session.created_at.toISOString() : session.created_at,
      updated_at: session.updated_at ? session.updated_at.toISOString() : session.updated_at
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

export async function PATCH(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { sessionId, sessionType, durationMinutes, totalAmount } = body;

    if (!sessionId || !sessionType || durationMinutes === undefined || totalAmount === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: sessionId, sessionType, durationMinutes, totalAmount' 
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const sessionsCollection = db.collection('sessions');

    // Update session billing information
    const updateQuery = {
      $set: {
        duration_minutes: durationMinutes,
        total_amount: totalAmount,
        billing_updated_at: new Date()
      }
    };

    const result = await sessionsCollection.updateOne(
      { session_id: sessionId, session_type: sessionType },
      updateQuery
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session billing updated successfully',
      sessionId,
      durationMinutes,
      totalAmount
    });

  } catch(error) {
    console.error('Error updating session billing:', error);
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