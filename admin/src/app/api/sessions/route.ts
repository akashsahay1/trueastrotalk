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

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Verify user is either a customer or astrologer
    if (payload.user_type !== 'customer' && payload.user_type !== 'astrologer') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Valid user account required.' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { sessionId, sessionType, astrologerId, userId } = body;

    if (!sessionId || !sessionType || !astrologerId || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: sessionId, sessionType, astrologerId, userId' 
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const sessionsCollection = db.collection('sessions');

    // Check if session already exists to prevent duplicates
    const existingSession = await sessionsCollection.findOne({ session_id: sessionId });
    if (existingSession) {
      await client.close();
      console.log(`⚠️ Session ${sessionId} already exists, returning existing session`);
      return NextResponse.json({
        success: true,
        message: 'Session already exists',
        session: existingSession
      });
    }

    // Create session record
    console.log(`🔧 Creating session record: sessionId=${sessionId}, sessionType=${sessionType}, userId=${userId}, astrologerId=${astrologerId}`);
    
    const session = {
      session_id: sessionId,
      session_type: sessionType, // 'call', 'video', or 'chat'
      user_id: userId,
      astrologer_id: astrologerId,
      status: 'active',
      duration_minutes: 0,
      total_amount: 0.0,
      created_at: new Date(),
      updated_at: new Date(),
      billing_updated_at: null
    };

    const result = await sessionsCollection.insertOne(session);
    await client.close();

    console.log(`📝 Successfully created ${sessionType} session ${sessionId} between user ${userId} and astrologer ${astrologerId} - MongoDB ID: ${result.insertedId}`);

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      sessionId
    });

  } catch(error) {
    console.error('Error creating session:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating the session'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
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

    // Verify user is either a customer or astrologer (only they can update billing)
    if (payload.user_type !== 'customer' && payload.user_type !== 'astrologer') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Valid user account required.' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { sessionId, sessionType, durationMinutes, totalAmount } = body;

    if (!sessionId || !sessionType || durationMinutes === undefined || totalAmount === undefined) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: sessionId, sessionType, durationMinutes, totalAmount' 
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');

    // Get the session to find the user_id (customer who should be charged)
    console.log(`🔍 Looking for session with session_id: ${sessionId}, sessionType: ${sessionType}`);
    const session = await sessionsCollection.findOne({ 
      session_id: sessionId, 
      session_type: sessionType 
    });

    if (!session) {
      console.log(`❌ Session not found: sessionId=${sessionId}, sessionType=${sessionType}`);
      // Show available sessions to help debug
      const availableSessions = await sessionsCollection.find(
        { session_id: sessionId }, // Search by just session_id to see if it exists with different type
        { projection: { session_id: 1, session_type: 1, status: 1 } }
      ).toArray();
      console.log(`📊 Sessions with matching session_id:`, availableSessions);
      await client.close();
      return NextResponse.json({ 
        success: false,
        error: `Session not found: ${sessionId} with type ${sessionType}` 
      }, { status: 404 });
    }
    console.log(`✅ Found session: ${sessionId} - Status: ${session.status}, Type: ${session.session_type}, User: ${session.user_id}, Astrologer: ${session.astrologer_id}`);

    // Only allow the customer (user) to update their own session billing
    // or allow astrologers to update sessions where they are the provider
    if (payload.user_type === 'customer' && session.user_id !== payload.userId) {
      await client.close();
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'You can only update your own sessions' 
      }, { status: 403 });
    }

    // Get current session billing info to calculate amount to deduct
    const currentAmount = session.total_amount || 0;
    const amountToDeduct = totalAmount - currentAmount;

    // Only deduct if there's a positive amount to charge
    if (amountToDeduct > 0) {
      // Get user's current wallet balance - using custom user_id field
      const user = await usersCollection.findOne(
        { user_id: session.user_id },
        { projection: { wallet_balance: 1, full_name: 1 } }
      );

      if (!user) {
        await client.close();
        return NextResponse.json({ 
          success: false,
          error: 'User not found' 
        }, { status: 404 });
      }

      const currentBalance = user.wallet_balance || 0;

      // Check if user has sufficient balance
      if (currentBalance < amountToDeduct) {
        await client.close();
        return NextResponse.json({ 
          success: false,
          error: 'Insufficient balance',
          message: `Insufficient wallet balance. Required: ₹${amountToDeduct}, Current: ₹${currentBalance}` 
        }, { status: 400 });
      }

      // Deduct amount from user's wallet - using custom user_id field
      const newBalance = currentBalance - amountToDeduct;
      await usersCollection.updateOne(
        { user_id: session.user_id },
        { 
          $set: { wallet_balance: newBalance },
          $currentDate: { updated_at: true }
        }
      );

      console.log(`💰 Deducted ₹${amountToDeduct} from user ${session.user_id} for ${sessionType} session ${sessionId}`);

      // Credit astrologer's wallet (80% of the amount, 20% platform commission)
      const astrologerShare = amountToDeduct * 0.8; // 80% to astrologer
      // const platformCommission = amountToDeduct * 0.2; // 20% platform commission (for future use)

      // Get astrologer to update their wallet
      const astrologer = await usersCollection.findOne(
        { user_id: session.astrologer_id },
        { projection: { wallet_balance: 1, full_name: 1 } }
      );

      if (astrologer) {
        const astrologerCurrentBalance = astrologer.wallet_balance || 0;
        const astrologerNewBalance = astrologerCurrentBalance + astrologerShare;
        
        await usersCollection.updateOne(
          { user_id: session.astrologer_id },
          { 
            $set: { wallet_balance: astrologerNewBalance },
            $currentDate: { updated_at: true }
          }
        );

        // Update or create wallet transaction records
        const walletTransactionsCollection = db.collection('wallet_transactions');
        
        // Customer debit transaction - update existing or create new
        await walletTransactionsCollection.updateOne(
          {
            user_id: session.user_id,
            transaction_type: 'debit',
            session_id: sessionId,
            service_type: sessionType
          },
          {
            $set: {
              amount: totalAmount,
              description: `Payment for ${sessionType} session (${durationMinutes} minutes)`,
              status: 'completed',
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          { upsert: true }
        );

        // Astrologer credit transaction - update existing or create new  
        const astrologerTotalShare = totalAmount * 0.8;
        await walletTransactionsCollection.updateOne(
          {
            recipient_user_id: session.astrologer_id,
            transaction_type: 'credit',
            session_id: sessionId,
            service_type: sessionType
          },
          {
            $set: {
              amount: astrologerTotalShare,
              description: `Earnings from ${sessionType} session (${durationMinutes} minutes)`,
              status: 'completed',
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          { upsert: true }
        );

        // Platform commission transaction - update existing or create new
        const totalPlatformCommission = totalAmount * 0.2;
        await walletTransactionsCollection.updateOne(
          {
            transaction_type: 'commission',
            session_id: sessionId,
            service_type: sessionType
          },
          {
            $set: {
              amount: totalPlatformCommission,
              description: `Platform commission for ${sessionType} session (${durationMinutes} minutes)`,
              status: 'completed',
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          { upsert: true }
        );

        console.log(`💰 Updated transactions - Astrologer: ₹${astrologerTotalShare}, Commission: ₹${totalPlatformCommission}`);
      }
    }

    // Update session billing information
    const updateQuery = {
      $set: {
        duration_minutes: durationMinutes,
        total_amount: totalAmount,
        billing_updated_at: new Date()
      }
    };

    await sessionsCollection.updateOne(
      { session_id: sessionId, session_type: sessionType },
      updateQuery
    );

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Session billing updated successfully',
      sessionId,
      durationMinutes,
      totalAmount,
      amountDeducted: amountToDeduct > 0 ? amountToDeduct : 0
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