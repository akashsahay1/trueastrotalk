import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';
import { NotificationService } from '@/lib/notifications';
import { Media } from '@/models';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// GET - Get chat session details with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    // Use 'customer' as default instead of 'user'
    const userType = searchParams.get('userType') || 'customer';
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

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const chatMessagesCollection = await DatabaseService.getCollection('chat_messages');
    const usersCollection = await DatabaseService.getCollection('users');
    const baseUrl = getBaseUrl(request);

    // Get chat session from unified sessions collection
    const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId), session_type: 'chat' });

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Chat session not found'
      }, { status: 404 });
    }

    // Verify user access (user can only access their own sessions)
    // Handle case where userId might be MongoDB _id instead of custom user_id
    const isCustomer = userType === 'customer';

    if (userId && isCustomer) {
      let hasAccess = session.user_id === userId;

      // If not, check if userId is a MongoDB _id and lookup the user's custom user_id
      if (!hasAccess && ObjectId.isValid(userId)) {
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (user && user.user_id === session.user_id) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this chat session'
        }, { status: 403 });
      }
    }

    if (userId && userType === 'astrologer') {
      let hasAccess = session.astrologer_id === userId;

      // If not, check if userId is a MongoDB _id and lookup the user's custom user_id
      if (!hasAccess && ObjectId.isValid(userId)) {
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (user && user.user_id === session.astrologer_id) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this chat session'
        }, { status: 403 });
      }
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
      usersCollection.findOne({ user_id: session.user_id }),
      usersCollection.findOne({ user_id: session.astrologer_id, user_type: 'astrologer' })
    ]);

    // Resolve profile images from media library
    const userProfileImage = user ? await Media.resolveProfileImage(user, baseUrl) : null;
    const astrologerProfileImage = astrologer ? await Media.resolveProfileImage(astrologer, baseUrl) : null;

    // Mark messages as read for the requesting user
    if (userId) {
      const readUpdateField = isCustomer ? 'read_by_user' : 'read_by_astrologer';
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
      const unreadCountField = isCustomer ? 'user_unread_count' : 'astrologer_unread_count';
      await sessionsCollection.updateOne(
        { _id: new ObjectId(sessionId), session_type: 'chat' },
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
        name: user.full_name,
        email: user.email_address,
        profile_image: userProfileImage || ''
      } : null,
      astrologer: astrologer ? {
        _id: astrologer._id.toString(),
        full_name: astrologer.full_name,
        email_address: astrologer.email_address,
        profile_image: astrologerProfileImage || '',
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
      unread_count: isCustomer ? session.user_unread_count : session.astrologer_unread_count,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
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

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const chatMessagesCollection = await DatabaseService.getCollection('chat_messages');
    const usersCollection = await DatabaseService.getCollection('users');

    // Get session
    const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId), session_type: 'chat' });

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Chat session not found'
      }, { status: 404 });
    }

    // Verify user has permission to perform this action
    // Handle case where user_id might be MongoDB _id instead of custom user_id
    const isCustomer = user_type === 'user' || user_type === 'customer';

    if (isCustomer) {
      let hasAccess = session.user_id === user_id;

      // If not, check if user_id is a MongoDB _id and lookup the user's custom user_id
      if (!hasAccess && ObjectId.isValid(user_id)) {
        const user = await usersCollection.findOne({ _id: new ObjectId(user_id) });
        if (user && user.user_id === session.user_id) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to modify this session'
        }, { status: 403 });
      }
    }

    if (user_type === 'astrologer') {
      let hasAccess = session.astrologer_id === user_id;

      // If not, check if user_id is a MongoDB _id and lookup the user's custom user_id
      if (!hasAccess && ObjectId.isValid(user_id)) {
        const user = await usersCollection.findOne({ _id: new ObjectId(user_id) });
        if (user && user.user_id === session.astrologer_id) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return NextResponse.json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to modify this session'
        }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    let systemMessage = '';

    switch (action) {
      case 'accept':
        if (session.status !== 'pending') {
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

        // Send session end notifications to both parties
        try {
          await NotificationService.sendSessionEndedNotification(
            session.user_id,
            session.astrologer_id,
            'chat',
            durationMinutes,
            updateData.total_amount as number,
            sessionId
          );
        } catch (notifError) {
          console.error('Failed to send session end notifications:', notifError);
          // Don't fail the request if notification fails
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Invalid action specified'
        }, { status: 400 });
    }

    // Update session
    await sessionsCollection.updateOne(
      { _id: new ObjectId(sessionId), session_type: 'chat' },
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
      await sessionsCollection.updateOne(
        { _id: new ObjectId(sessionId), session_type: 'chat' },
        {
          $set: {
            last_message: systemMessage,
            last_message_time: new Date()
          }
        }
      );
    }
    const sessionResponse: Record<string, unknown> = {
      _id: sessionId,
      status: updateData.status,
    };
    
    if (updateData.duration_minutes) {
      sessionResponse.duration_minutes = updateData.duration_minutes;
    }
    if (updateData.total_amount) {
      sessionResponse.total_amount = updateData.total_amount;
    }

    return NextResponse.json({
      success: true,
      message: `Session ${action}ed successfully`,
      session: sessionResponse
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