const http = require('http');
const { Server } = require('socket.io');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Load environment variables in the same order as Next.js
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const PORT = process.env.SOCKET_PORT || 4002;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-123456789';

// Create HTTP server
const server = http.createServer();

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Connected users storage
const connectedUsers = new Map();
const activeCalls = new Map();
const userSocketMap = new Map();

// Helper function to verify JWT token
async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Helper function to get database connection
async function getDbConnection() {
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  return { client, db };
}

// Middleware for authentication
io.use(async (socket, next) => {
  try {
    console.log('🔐 Authentication attempt:', socket.handshake.auth);
    
    // Check if this is a test connection
    const isTestConnection = socket.handshake.auth.test === true;
    if (isTestConnection) {
      console.log('🧪 Test connection allowed');
      socket.data.userId = 'test-user';
      socket.data.userType = 'test';
      socket.data.isTestConnection = true;
      return next();
    }
    
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('❌ No token provided');
      return next(new Error('Authentication required'));
    }
    
    console.log('🔍 Verifying token...');
    const decoded = await verifyToken(token);
    console.log('✅ Token verified:', { userId: decoded.userId, userType: decoded.user_type });
    socket.data.userId = decoded.userId;
    socket.data.userType = decoded.user_type;
    next();
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id, 'UserId:', socket.data.userId);

  // Auto-authenticate on connection
  handleAuthentication(socket);

  // Chat handlers
  socket.on('join_chat_session', (data) => handleJoinChatSession(socket, data));
  socket.on('leave_chat_session', (data) => handleLeaveChatSession(socket, data));
  socket.on('send_message', (data) => handleSendMessage(socket, data));
  socket.on('typing_start', (data) => handleTypingStart(socket, data));
  socket.on('typing_stop', (data) => handleTypingStop(socket, data));
  socket.on('mark_messages_read', (data) => handleMarkMessagesRead(socket, data));

  // WebRTC Call handlers
  socket.on('initiate_call', (data) => handleInitiateCall(socket, data));
  socket.on('answer_call', (data) => handleAnswerCall(socket, data));
  socket.on('reject_call', (data) => handleRejectCall(socket, data));
  socket.on('end_call', (data) => handleEndCall(socket, data));
  
  // WebRTC Signaling handlers
  socket.on('webrtc_offer', (data) => handleWebRTCOffer(socket, data));
  socket.on('webrtc_answer', (data) => handleWebRTCAnswer(socket, data));
  socket.on('webrtc_ice_candidate', (data) => handleWebRTCIceCandidate(socket, data));
  
  // Presence handlers
  socket.on('get_online_status', (data) => handleGetOnlineStatus(socket, data));
  
  // Test message handler
  socket.on('test-message', (data) => {
    console.log('🧪 Received test message:', data);
    socket.emit('test-response', { 
      message: 'Test message received successfully!',
      timestamp: new Date(),
      socketId: socket.id,
      data: data
    });
  });
  
  socket.on('disconnect', () => handleDisconnect(socket));
});

// Handler functions
async function handleAuthentication(socket) {
  try {
    const userId = socket.data.userId;
    const userType = socket.data.userType;
    const isTestConnection = socket.data.isTestConnection;
    
    // Store user connection
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId,
      userType,
      isOnline: true,
      lastSeen: new Date(),
      isTestConnection
    });
    
    // Update user-socket mapping
    userSocketMap.set(userId, socket.id);
    
    // Join user to their personal room
    socket.join(`user_${userId}`);
    
    // Join type-specific room
    if (!isTestConnection) {
      socket.join(userType === 'astrologer' ? 'astrologers' : 'users');
      
      // Update online status in database - all users are in 'users' collection
      const { client, db } = await getDbConnection();
      
      await db.collection('users').updateOne(
        { user_id: userId },
        { 
          $set: { 
            is_online: true, 
            last_seen: new Date(),
            socket_id: socket.id 
          } 
        }
      );
      
      await client.close();
      
      // Notify others about online status
      socket.broadcast.emit('user_online', { userId, userType });
    } else {
      console.log('🧪 Test connection - skipping database updates');
    }
    
    socket.emit('authenticated', { 
      success: true, 
      userId, 
      userType,
      socketId: socket.id,
      isTestConnection 
    });
    
    console.log(`✅ User ${userId} (${userType}) authenticated and online ${isTestConnection ? '(TEST)' : ''}`);
  } catch (error) {
    console.error('❌ Authentication error:', error);
    socket.emit('authentication_error', { error: 'Authentication failed' });
  }
}

async function handleJoinChatSession(socket, data) {
  try {
    const { sessionId } = data;
    socket.join(`chat_${sessionId}`);
    
    // Load and send recent messages
    const { client, db } = await getDbConnection();
    const messages = await db.collection('chat_messages')
      .find({ session_id: sessionId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    await client.close();
    
    socket.emit('chat_history', { 
      sessionId, 
      messages: messages.reverse() 
    });
    
    console.log(`📚 User ${socket.data.userId} joined chat session ${sessionId}`);
  } catch (error) {
    console.error('❌ Join chat session error:', error);
    socket.emit('chat_error', { error: 'Failed to join chat session' });
  }
}

async function handleLeaveChatSession(socket, data) {
  try {
    const { sessionId } = data;
    socket.leave(`chat_${sessionId}`);
    console.log(`🚪 User ${socket.data.userId} left chat session ${sessionId}`);
  } catch (error) {
    console.error('❌ Leave chat session error:', error);
  }
}

async function handleSendMessage(socket, data) {
  try {
    const { sessionId, content, messageType = 'text', imageUrl, voiceUrl } = data;
    const senderId = socket.data.userId;
    const senderType = socket.data.userType;
    
    const { client, db } = await getDbConnection();
    
    // Get session details from unified sessions collection
    const session = await db.collection('sessions').findOne({
      _id: new ObjectId(sessionId),
      session_type: 'chat'
    });
    
    if (!session) {
      socket.emit('message_error', { error: 'Session not found' });
      await client.close();
      return;
    }
    
    // Get sender details - all users are in 'users' collection
    const sender = await db.collection('users').findOne({ 
      user_id: senderId 
    });
    
    if (!sender) {
      console.error(`❌ Sender not found: ${senderId}`);
      socket.emit('message_error', { error: 'Sender not found' });
      await client.close();
      return;
    }

    const senderName = sender.full_name;
    
    // Create message
    const message = {
      session_id: sessionId,
      sender_id: senderId,
      sender_name: senderName,
      sender_type: senderType,
      message_type: messageType,
      content: content || '',
      image_url: imageUrl,
      voice_url: voiceUrl,
      read_by_user: senderType === 'user',
      read_by_astrologer: senderType === 'astrologer',
      timestamp: new Date(),
      created_at: new Date()
    };
    
    const result = await db.collection('chat_messages').insertOne(message);
    
    // Update session in unified sessions collection
    await db.collection('sessions').updateOne(
      { _id: new ObjectId(sessionId), session_type: 'chat' },
      {
        $set: {
          last_message: content || `[${messageType}]`,
          last_message_time: new Date(),
          updated_at: new Date()
        },
        $inc: senderType === 'user'
          ? { astrologer_unread_count: 1 }
          : { user_unread_count: 1 }
      }
    );
    
    await client.close();
    
    // Format message for broadcast
    const formattedMessage = {
      _id: result.insertedId.toString(),
      ...message
    };
    
    // Send to all participants in the chat room
    io.to(`chat_${sessionId}`).emit('new_message', formattedMessage);
    
    // Also send to user rooms for notifications
    const receiverId = senderType === 'user' ? session.astrologer_id : session.user_id;
    io.to(`user_${receiverId}`).emit('message_notification', {
      sessionId,
      message: formattedMessage
    });
    
    console.log(`💬 Message sent in session ${sessionId} by ${senderId}`);
  } catch (error) {
    console.error('❌ Send message error:', error);
    socket.emit('message_error', { error: 'Failed to send message' });
  }
}

async function handleTypingStart(socket, data) {
  const { sessionId } = data;
  const userId = socket.data.userId;
  const userType = socket.data.userType;
  
  socket.to(`chat_${sessionId}`).emit('typing_start', { 
    userId, 
    userType,
    sessionId 
  });
}

async function handleTypingStop(socket, data) {
  const { sessionId } = data;
  const userId = socket.data.userId;
  const userType = socket.data.userType;
  
  socket.to(`chat_${sessionId}`).emit('typing_stop', { 
    userId, 
    userType,
    sessionId 
  });
}

async function handleMarkMessagesRead(socket, data) {
  try {
    const { sessionId, messageIds } = data;
    const userId = socket.data.userId;
    const userType = socket.data.userType;
    
    const { client, db } = await getDbConnection();
    
    // Update read status
    const updateField = userType === 'user' ? 'read_by_user' : 'read_by_astrologer';
    await db.collection('chat_messages').updateMany(
      { 
        _id: { $in: messageIds.map(id => new ObjectId(id)) },
        session_id: sessionId 
      },
      { $set: { [updateField]: true } }
    );
    
    // Reset unread count in unified sessions collection
    const unreadField = userType === 'user' ? 'user_unread_count' : 'astrologer_unread_count';
    await db.collection('sessions').updateOne(
      { _id: new ObjectId(sessionId), session_type: 'chat' },
      { $set: { [unreadField]: 0 } }
    );
    
    await client.close();
    
    // Notify sender about read receipt
    socket.to(`chat_${sessionId}`).emit('messages_read', { 
      messageIds, 
      readBy: userType 
    });
    
  } catch (error) {
    console.error('❌ Mark messages read error:', error);
  }
}

// WebRTC Call Management handlers
async function handleInitiateCall(socket, data) {
  try {
    // Handle both parameter formats from Flutter app
    const { 
      callType = 'voice', 
      sessionId, 
      astrologerId, 
      targetUserId, // Alternative parameter name from WebRTC service
      userId, 
      callerName 
    } = data;
    const callerId = socket.data.userId;
    const callerType = socket.data.userType;
    
    // Use either astrologerId or targetUserId
    const receiverId = astrologerId || targetUserId;
    
    if (!receiverId) {
      console.error('❌ No receiver ID provided');
      socket.emit('call_error', { error: 'Receiver ID is required' });
      return;
    }
    
    console.log('📞 Call initiation:', data);
    
    const { client, db } = await getDbConnection();
    
    // Check if a call session already exists in unified sessions collection
    const sessionType = callType === 'video' ? 'video_call' : 'voice_call';
    const existingSession = await db.collection('sessions').findOne({
      session_id: sessionId,
      session_type: sessionType,
      status: { $in: ['pending', 'ringing', 'active'] }
    });

    if (existingSession) {
      console.log(`ℹ️ Call session already exists for ${sessionId}, returning existing call`);
      const existingCallId = existingSession._id.toString();

      // Just confirm to caller without creating duplicate
      socket.emit('call_initiated', {
        callId: existingCallId,
        sessionId,
        status: 'initiated'
      });

      await client.close();
      return;
    }

    // Get caller and receiver details from database
    let resolvedCallerName = callerName;
    const caller = await db.collection('users').findOne({ user_id: callerId });
    const receiver = await db.collection('users').findOne({ user_id: receiverId });

    if (!resolvedCallerName || resolvedCallerName === 'Unknown') {
      resolvedCallerName = caller?.full_name || caller?.name || 'Unknown Caller';
      console.log(`📞 Resolved caller name: "${resolvedCallerName}"`);
    }

    // Determine user_id and astrologer_id based on caller type
    const sessionUserId = callerType === 'customer' ? callerId : receiverId;
    const sessionAstrologerId = callerType === 'astrologer' ? callerId : receiverId;

    // Get rate from astrologer
    const astrologer = callerType === 'astrologer' ? caller : receiver;
    const ratePerMinute = callType === 'video'
      ? (astrologer?.video_call_rate || astrologer?.call_rate || 15)
      : (astrologer?.call_rate || 10);

    // Create session in unified sessions collection with proper structure
    const callSession = {
      session_id: sessionId,
      session_type: sessionType, // 'voice_call' or 'video_call'
      user_id: sessionUserId,
      astrologer_id: sessionAstrologerId,
      status: 'pending', // pending -> ringing -> active -> completed
      rate_per_minute: ratePerMinute,

      // Call metadata
      caller_id: callerId,
      caller_name: resolvedCallerName,
      caller_type: callerType,
      receiver_id: receiverId,

      // Timing
      start_time: null,
      end_time: null,
      duration_minutes: 0,
      total_amount: 0,

      // Chat fields (null for calls)
      last_message: null,
      last_message_time: null,
      user_unread_count: 0,
      astrologer_unread_count: 0,

      // Call-specific
      call_quality_rating: null,
      connection_id: null,

      billing_updated_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('sessions').insertOne(callSession);
    const callId = result.insertedId.toString();
    
    await client.close();
    
    // Store active call
    activeCalls.set(callId, {
      callId,
      sessionId,
      callerId,
      callerName: resolvedCallerName,
      callerType,
      receiverId,
      receiverType: 'astrologer',
      callType,
      status: 'initiated',
      startTime: new Date()
    });
    
    // Notify receiver about incoming call with proper caller name
    const incomingCallData = {
      callId,
      sessionId,
      callType,
      callerId,
      callerType,
      callerName: resolvedCallerName
    };
    
    console.log('📞 Emitting incoming_call to receiver with data:', incomingCallData);
    io.to(`user_${receiverId}`).emit('incoming_call', incomingCallData);
    
    // Confirm to caller
    console.log(`🔥 DEBUG: About to emit call_initiated with sessionId: ${sessionId}`);
    socket.emit('call_initiated', {
      callId,
      sessionId,
      status: 'initiated'
    });
    console.log(`🔥 DEBUG: Emitted call_initiated event`);
    
    console.log(`📞 Call initiated: ${callId} from ${callerId} (${resolvedCallerName}) to ${receiverId}`);
  } catch (error) {
    console.error('❌ Initiate call error:', error);
    socket.emit('call_error', { error: 'Failed to initiate call' });
  }
}

async function handleAnswerCall(socket, data) {
  try {
    const { callId, sessionId } = data;
    const answererId = socket.data.userId;
    
    console.log('✅ Call answered:', data);
    
    const callInfo = activeCalls.get(callId);
    if (!callInfo) {
      socket.emit('call_error', { error: 'Call not found' });
      return;
    }
    
    // Update call status
    callInfo.status = 'answered';
    callInfo.answerTime = new Date();
    activeCalls.set(callId, callInfo);
    
    // Update database - unified sessions collection
    const { client, db } = await getDbConnection();
    await db.collection('sessions').updateOne(
      { _id: new ObjectId(callId) },
      {
        $set: {
          status: 'active',
          start_time: new Date(),
          updated_at: new Date()
        }
      }
    );
    await client.close();

    // Notify caller
    io.to(`user_${callInfo.callerId}`).emit('call_answered', {
      callId,
      sessionId,
      answererId,
      status: 'answered'
    });
    
    // Confirm to answerer
    socket.emit('call_answered', {
      callId,
      sessionId,
      status: 'answered'
    });
    
    console.log(`✅ Call answered: ${callId} by ${answererId}`);
  } catch (error) {
    console.error('❌ Answer call error:', error);
    socket.emit('call_error', { error: 'Failed to answer call' });
  }
}

async function handleRejectCall(socket, data) {
  try {
    const { callId, sessionId } = data;
    const rejecterId = socket.data.userId;
    
    console.log('❌ Call rejected:', data);
    
    const callInfo = activeCalls.get(callId);
    if (!callInfo) {
      socket.emit('call_error', { error: 'Call not found' });
      return;
    }
    
    // Update database - unified sessions collection
    const { client, db } = await getDbConnection();
    await db.collection('sessions').updateOne(
      { _id: new ObjectId(callId) },
      {
        $set: {
          status: 'rejected',
          end_time: new Date(),
          updated_at: new Date()
        }
      }
    );
    await client.close();

    // Remove from active calls
    activeCalls.delete(callId);

    // Notify caller
    io.to(`user_${callInfo.callerId}`).emit('call_rejected', {
      callId,
      sessionId,
      rejecterId,
      status: 'rejected'
    });

    console.log(`❌ Call rejected: ${callId} by ${rejecterId}`);
  } catch (error) {
    console.error('❌ Reject call error:', error);
    socket.emit('call_error', { error: 'Failed to reject call' });
  }
}

async function handleEndCall(socket, data) {
  try {
    const { callId, sessionId } = data;
    const enderId = socket.data.userId;
    
    console.log('📴 Call ended:', data);
    
    const callInfo = activeCalls.get(callId);
    if (callInfo) {
      // Calculate call duration
      const duration = new Date() - new Date(callInfo.startTime);
      const durationMinutes = Math.ceil(duration / 60000); // Convert to minutes, round up

      // Update database - unified sessions collection
      const { client, db } = await getDbConnection();

      // Update session to completed status
      await db.collection('sessions').updateOne(
        { _id: new ObjectId(callId) },
        {
          $set: {
            status: 'completed',
            end_time: new Date(),
            duration_minutes: durationMinutes,
            ended_by: enderId,
            updated_at: new Date()
          }
        }
      );
      console.log(`✅ Session ${callId} marked as completed`);

      await client.close();
      
      // Notify other participant
      const otherUserId = callInfo.callerId === enderId ? callInfo.receiverId : callInfo.callerId;
      io.to(`user_${otherUserId}`).emit('call_ended', {
        callId,
        sessionId,
        endedBy: enderId,
        duration: Math.floor(duration / 1000),
        status: 'ended'
      });
      
      // Remove from active calls
      activeCalls.delete(callId);
      
      console.log(`📴 Call ended: ${callId} by ${enderId}, duration: ${Math.floor(duration / 1000)}s`);
    }
  } catch (error) {
    console.error('❌ End call error:', error);
    socket.emit('call_error', { error: 'Failed to end call' });
  }
}

async function handleWebRTCOffer(socket, data) {
  const { sessionId, offer, targetUserId } = data;
  io.to(`user_${targetUserId}`).emit('webrtc_offer', { 
    sessionId, 
    offer,
    fromUserId: socket.data.userId 
  });
}

async function handleWebRTCAnswer(socket, data) {
  const { sessionId, answer, targetUserId } = data;
  io.to(`user_${targetUserId}`).emit('webrtc_answer', { 
    sessionId, 
    answer,
    fromUserId: socket.data.userId 
  });
}

async function handleWebRTCIceCandidate(socket, data) {
  const { sessionId, candidate, targetUserId } = data;
  io.to(`user_${targetUserId}`).emit('webrtc_ice_candidate', { 
    sessionId, 
    candidate,
    fromUserId: socket.data.userId 
  });
}

async function handleGetOnlineStatus(socket, data) {
  const { userIds } = data;
  const onlineStatuses = {};
  
  for (const userId of userIds) {
    const socketId = userSocketMap.get(userId);
    onlineStatuses[userId] = !!socketId && connectedUsers.has(socketId);
  }
  
  socket.emit('online_status', { statuses: onlineStatuses });
}

async function handleDisconnect(socket) {
  try {
    console.log('🔌 User disconnected:', socket.id);
    
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo) return;
    
    const { userId, userType } = userInfo;
    
    // Update database - all users are in 'users' collection
    const { client, db } = await getDbConnection();
    
    await db.collection('users').updateOne(
      { user_id: userId },
      { 
        $set: { 
          is_online: false, 
          last_seen: new Date() 
        },
        $unset: { socket_id: "" }
      }
    );
    
    await client.close();
    
    // Remove from maps
    connectedUsers.delete(socket.id);
    userSocketMap.delete(userId);
    
    // Notify others about offline status
    socket.broadcast.emit('user_offline', { userId, userType });
    
    console.log(`🔴 User ${userId} (${userType}) disconnected`);
  } catch (error) {
    console.error('❌ Disconnect error:', error);
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down Socket.IO server...');
  server.close(() => {
    console.log('✅ Socket.IO server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down Socket.IO server...');
  server.close(() => {
    console.log('✅ Socket.IO server shut down gracefully');
    process.exit(0);
  });
});