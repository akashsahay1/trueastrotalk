import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Get chat session details with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType') || 'user';
    const messagesLimit = parseInt(searchParams.get('messagesLimit') || '50');
    const messagesPage = parseInt(searchParams.get('messagesPage') || '1');
    const messagesSkip = (messagesPage - 1) * messagesLimit;

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session ID',
        message: 'Valid session ID is required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const chatSessionsCollection = db.collection('chat_sessions');
    const chatMessagesCollection = db.collection('chat_messages');
    const usersCollection = db.collection('users');
    const astrologersCollection = db.collection('astrologers');

    // Get chat session
    const session = await chatSessionsCollection.findOne({ _id: new ObjectId(sessionId) });

    if (!session) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Chat session not found'
      }, { status: 404 });
    }

    // Verify user access (user can only access their own sessions)
    if (userId && userType === 'user' && session.user_id !== userId) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this chat session'
      }, { status: 403 });
    }

    if (userId && userType === 'astrologer' && session.astrologer_id !== userId) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this chat session'
      }, { status: 403 });
    }

    // Get messages for this session
    const messages = await chatMessagesCollection
      .find({ session_id: sessionId })
      .sort({ timestamp: -1 })
      .skip(messagesSkip)
      .limit(messagesLimit)
      .toArray();

    const totalMessages = await chatMessagesCollection.countDocuments({ session_id: sessionId });

    // Get user and astrologer details
    const [user, astrologer] = await Promise.all([
      usersCollection.findOne({ _id: new ObjectId(session.user_id) }),
      astrologersCollection.findOne({ _id: new ObjectId(session.astrologer_id) })
    ]);

    // Mark messages as read for the requesting user
    if (userId) {
      const readUpdateField = userType === 'user' ? 'read_by_user' : 'read_by_astrologer';
      await chatMessagesCollection.updateMany(
        { 
          session_id: sessionId,
          [readUpdateField]: false,
          sender_id: { $ne: userId } // Don't mark own messages as read
        },
        { 
          $set: { 
            [readUpdateField]: true,
            updated_at: new Date()
          }
        }
      );

      // Update unread count in session
      const unreadCountField = userType === 'user' ? 'user_unread_count' : 'astrologer_unread_count';
      await chatSessionsCollection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            [unreadCountField]: 0,
            updated_at: new Date()
          }
        }
      );
    }

    // Format response
    const formattedSession = {
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
      updated_at: session.updated_at,
      messages: messages.reverse().map(msg => ({ // Reverse to show oldest first
        _id: msg._id.toString(),
        session_id: msg.session_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        sender_type: msg.sender_type,
        message_type: msg.message_type,
        content: msg.content,
        image_url: msg.image_url,
        read_by_user: msg.read_by_user,
        read_by_astrologer: msg.read_by_astrologer,
        timestamp: msg.timestamp
      })),
      messages_pagination: {
        total: totalMessages,
        page: messagesPage,
        limit: messagesLimit,
        totalPages: Math.ceil(totalMessages / messagesLimit)
      }
    };

    await client.close();

    return NextResponse.json({
      success: true,
      session: formattedSession
    });

  } catch(error) {
    console.error('Chat session details GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching chat session details'
    }, { status: 500 });
  }
}

// PUT - Update chat session (accept/reject/end)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { action, user_id, user_type } = body; // action: 'accept', 'reject', 'end'

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session ID',
        message: 'Valid session ID is required'
      }, { status: 400 });
    }

    if (!action || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Action and user ID are required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const chatSessionsCollection = db.collection('chat_sessions');
    const chatMessagesCollection = db.collection('chat_messages');

    // Get session
    const session = await chatSessionsCollection.findOne({ _id: new ObjectId(sessionId) });

    if (!session) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Chat session not found'
      }, { status: 404 });
    }

    // Verify user has permission to perform this action
    if (user_type === 'user' && session.user_id !== user_id) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to modify this session'
      }, { status: 403 });
    }

    if (user_type === 'astrologer' && session.astrologer_id !== user_id) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to modify this session'
      }, { status: 403 });
    }

    let updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    let systemMessage = '';

    switch (action) {
      case 'accept':
        if (session.status !== 'pending') {
          await client.close();
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only accept pending sessions'
          }, { status: 400 });
        }
        updateData.status = 'active';
        updateData.start_time = new Date();
        systemMessage = 'Chat session started';
        break;

      case 'reject':
        if (session.status !== 'pending') {
          await client.close();
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only reject pending sessions'
          }, { status: 400 });
        }
        updateData.status = 'rejected';
        systemMessage = 'Chat session was declined';
        break;

      case 'end':
        if (session.status !== 'active') {
          await client.close();
          return NextResponse.json({
            success: false,
            error: 'Invalid action',
            message: 'Can only end active sessions'
          }, { status: 400 });
        }
        
        const endTime = new Date();
        const durationMs = endTime.getTime() - session.start_time.getTime();
        const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Round up to next minute
        const totalAmount = durationMinutes * session.rate_per_minute;

        updateData.status = 'completed';
        updateData.end_time = endTime;
        updateData.duration_minutes = durationMinutes;
        updateData.total_amount = Math.round(totalAmount * 100) / 100; // Round to 2 decimal places
        systemMessage = `Chat session ended. Duration: ${durationMinutes} minutes. Total: ₹${updateData.total_amount}`;
        break;

      default:
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Invalid action specified'
        }, { status: 400 });
    }

    // Update session
    await chatSessionsCollection.updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: updateData }
    );

    // Add system message
    if (systemMessage) {
      const messageData = {
        session_id: sessionId,
        sender_id: 'system',
        sender_name: 'System',
        sender_type: 'system',
        message_type: 'system',
        content: systemMessage,
        image_url: null,
        read_by_user: false,
        read_by_astrologer: false,
        timestamp: new Date(),
        created_at: new Date()
      };

      await chatMessagesCollection.insertOne(messageData);

      // Update session with last message info
      await chatSessionsCollection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            last_message: systemMessage,
            last_message_time: new Date()
          }
        }
      );
    }

    await client.close();

    return NextResponse.json({
      success: true,
      message: `Session ${action}ed successfully`,
      session: {
        _id: sessionId,
        status: updateData.status,
        ...(updateData.duration_minutes && { duration_minutes: updateData.duration_minutes }),
        ...(updateData.total_amount && { total_amount: updateData.total_amount })
      }
    });

  } catch(error) {
    console.error('Chat session update PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating chat session'
    }, { status: 500 });
  }
}