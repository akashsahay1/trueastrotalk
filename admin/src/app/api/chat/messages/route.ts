import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// POST - Send new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      session_id, 
      sender_id, 
      sender_name, 
      sender_type, 
      message_type = 'text', 
      content, 
      image_url 
    } = body;

    if (!session_id || !sender_id || !sender_name || !sender_type || (!content && !image_url)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Session ID, sender info, and content are required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const chatMessagesCollection = db.collection('chat_messages');
    const chatSessionsCollection = db.collection('chat_sessions');

    // Verify session exists and is active
    const session = await chatSessionsCollection.findOne({ _id: new ObjectId(session_id) });

    if (!session) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Chat session not found'
      }, { status: 404 });
    }

    if (session.status !== 'active' && session.status !== 'pending') {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Session not active',
        message: 'Cannot send messages to inactive session'
      }, { status: 400 });
    }

    // Verify sender has access to this session
    if (sender_type === 'user' && session.user_id !== sender_id) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this chat session'
      }, { status: 403 });
    }

    if (sender_type === 'astrologer' && session.astrologer_id !== sender_id) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this chat session'
      }, { status: 403 });
    }

    // Create message
    const messageData = {
      session_id: session_id,
      sender_id: sender_id,
      sender_name: sender_name,
      sender_type: sender_type,
      message_type: message_type,
      content: content || '',
      image_url: image_url || null,
      read_by_user: sender_type === 'user', // Sender's messages are automatically marked as read by sender
      read_by_astrologer: sender_type === 'astrologer',
      timestamp: new Date(),
      created_at: new Date()
    };

    const result = await chatMessagesCollection.insertOne(messageData);
    const messageId = result.insertedId.toString();

    // Update session with last message info and increment unread count for recipient
    const updateData: Record<string, unknown> = {
      last_message: content || '[Image]',
      last_message_time: new Date(),
      updated_at: new Date()
    };

    // Increment unread count for recipient
    if (sender_type === 'user') {
      updateData.$inc = { astrologer_unread_count: 1 };
    } else {
      updateData.$inc = { user_unread_count: 1 };
    }

    // If session is pending and astrologer sends first message, activate it
    if (session.status === 'pending' && sender_type === 'astrologer') {
      updateData.status = 'active';
      updateData.start_time = new Date();
    }

    await chatSessionsCollection.updateOne(
      { _id: new ObjectId(session_id) },
      updateData.$inc ? 
        { $set: { ...updateData, $inc: undefined }, $inc: updateData.$inc } :
        { $set: updateData }
    );

    await client.close();

    // Format message for response
    const formattedMessage = {
      _id: messageId,
      session_id: session_id,
      sender_id: sender_id,
      sender_name: sender_name,
      sender_type: sender_type,
      message_type: message_type,
      content: content,
      image_url: image_url,
      read_by_user: messageData.read_by_user,
      read_by_astrologer: messageData.read_by_astrologer,
      timestamp: messageData.timestamp
    };

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      message_data: formattedMessage
    }, { status: 201 });

  } catch(error) {
    console.error('Chat message POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while sending message'
    }, { status: 500 });
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_ids, user_id, user_type } = body;

    if (!message_ids || !Array.isArray(message_ids) || !user_id || !user_type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Message IDs, user ID, and user type are required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const chatMessagesCollection = db.collection('chat_messages');
    const chatSessionsCollection = db.collection('chat_sessions');

    // Convert message IDs to ObjectIds
    const messageObjectIds = message_ids
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    if (messageObjectIds.length === 0) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Invalid message IDs',
        message: 'No valid message IDs provided'
      }, { status: 400 });
    }

    // Update messages as read
    const readField = user_type === 'user' ? 'read_by_user' : 'read_by_astrologer';
    
    const result = await chatMessagesCollection.updateMany(
      { 
        _id: { $in: messageObjectIds },
        sender_id: { $ne: user_id }, // Don't mark own messages
        [readField]: false
      },
      { 
        $set: { 
          [readField]: true,
          updated_at: new Date()
        }
      }
    );

    // Update unread counts in all affected sessions
    const messages = await chatMessagesCollection
      .find({ _id: { $in: messageObjectIds } })
      .toArray();

    const sessionIds = [...new Set(messages.map(msg => msg.session_id))];

    for (const sessionId of sessionIds) {
      // Count unread messages for this user in this session
      const unreadCount = await chatMessagesCollection.countDocuments({
        session_id: sessionId,
        sender_id: { $ne: user_id },
        [readField]: false
      });

      const unreadCountField = user_type === 'user' ? 'user_unread_count' : 'astrologer_unread_count';
      
      await chatSessionsCollection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            [unreadCountField]: unreadCount,
            updated_at: new Date()
          }
        }
      );
    }

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
      updated_count: result.modifiedCount
    });

  } catch(error) {
    console.error('Chat messages read PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while marking messages as read'
    }, { status: 500 });
  }
}

// GET - Get messages for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing session ID',
        message: 'Session ID is required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const chatMessagesCollection = db.collection('chat_messages');
    const chatSessionsCollection = db.collection('chat_sessions');

    // Verify user has access to this session
    if (userId && userType) {
      const session = await chatSessionsCollection.findOne({ _id: new ObjectId(sessionId) });
      
      if (!session) {
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Session not found',
          message: 'Chat session not found'
        }, { status: 404 });
      }

      if (userType === 'user' && session.user_id !== userId) {
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this chat session'
        }, { status: 403 });
      }

      if (userType === 'astrologer' && session.astrologer_id !== userId) {
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this chat session'
        }, { status: 403 });
      }
    }

    // Get messages for session
    const messages = await chatMessagesCollection
      .find({ session_id: sessionId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalMessages = await chatMessagesCollection.countDocuments({ session_id: sessionId });

    // Format messages for response
    const formattedMessages = messages.reverse().map(msg => ({ // Reverse to show oldest first
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
    }));

    await client.close();

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      pagination: {
        total: totalMessages,
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit)
      }
    });

  } catch(error) {
    console.error('Chat messages GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching messages'
    }, { status: 500 });
  }
}