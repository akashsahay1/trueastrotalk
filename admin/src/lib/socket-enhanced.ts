import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO, Socket } from 'socket.io';
import { MongoClient, ObjectId, Db } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

// Type definitions
interface UserConnection {
  socketId: string;
  userId: string;
  userType: 'user' | 'astrologer';
  isOnline: boolean;
  lastSeen: Date;
}

interface CallData {
  from?: string;
  to?: string;
  roomId?: string;
  callId?: string;
  targetUserId?: string;
  callType?: string;
  reason?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  sessionId?: string;
  userId?: string;
  astrologerId?: string;
  duration?: number;
  action?: string;
}

interface MessageData {
  roomId?: string;
  sessionId?: string;
  message?: string;
  content?: string;
  messageType?: string;
  imageUrl?: string;
  voiceUrl?: string;
  from?: string;
  to?: string;
  timestamp?: Date;
}

interface _SocketAuth {
  userId?: string;
  userType?: 'user' | 'astrologer';
  token?: string;
}

interface ChatSessionData {
  sessionId: string;
  userId?: string;
}

interface TypingData {
  sessionId: string;
  userId: string;
}

interface MessagesReadData {
  sessionId: string;
  messageIds: string[];
}

interface OnlineStatusData {
  userIds: string[];
}

interface CallSession {
  sessionId: string;
  userId: string;
  astrologerId: string;
  status: 'ringing' | 'active' | 'ended' | 'rejected';
  callType: 'voice' | 'video';
  startTime?: Date;
  endTime?: Date;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates: RTCIceCandidateInit[];
}

interface ChatMessage {
  session_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'user' | 'astrologer';
  message_type: 'text' | 'image' | 'voice' | 'system';
  content: string;
  image_url?: string;
  voice_url?: string;
  read_by_user: boolean;
  read_by_astrologer: boolean;
  timestamp: Date;
  created_at: Date;
}

// Connected users storage
const connectedUsers = new Map<string, UserConnection>();

// Active calls storage with enhanced WebRTC support
const activeCalls = new Map<string, CallSession>();

// User to socket mapping for quick lookups
const userSocketMap = new Map<string, string>();

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to verify JWT token
async function verifyToken(token: string): Promise<{ userId: string; userType: string; iat?: number; exp?: number } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return typeof decoded === 'object' && decoded !== null ? decoded as { userId: string; userType: string; iat?: number; exp?: number } : null;
  } catch {
    return null;
  }
}

// Helper function to get database connection
async function getDbConnection(): Promise<{ client: MongoClient; db: Db }> {
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  return { client, db };
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
  } else {
    const io = new ServerIO(res.socket.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });
    
    res.socket.server.io = io;

    // Middleware for authentication
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }
        
        const decoded = await verifyToken(token);
        if (!decoded) {
          return next(new Error('Invalid token'));
        }
        socket.data.userId = decoded.userId || (decoded as Record<string, unknown>).id as string;
        socket.data.userType = (decoded as Record<string, unknown>).role === 'astrologer' ? 'astrologer' : 'user';
        next();
      } catch {
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket: Socket) => {

      // Auto-authenticate on connection
      handleAuthentication(socket);

      // Chat handlers
      socket.on('join_chat_session', (data) => handleJoinChatSession(socket, data));
      socket.on('leave_chat_session', (data) => handleLeaveChatSession(socket, data));
      socket.on('send_message', (data) => handleSendMessage(socket, io, data));
      socket.on('typing_start', (data) => handleTypingStart(socket, io, data));
      socket.on('typing_stop', (data) => handleTypingStop(socket, io, data));
      socket.on('mark_messages_read', (data) => handleMarkMessagesRead(socket, io, data));

      // WebRTC Call handlers
      socket.on('initiate_call', (data) => handleInitiateCall(socket, io, data));
      socket.on('answer_call', (data) => handleAnswerCall(socket, io, data));
      socket.on('reject_call', (data) => handleRejectCall(socket, io, data));
      socket.on('end_call', (data) => handleEndCall(socket, io, data));
      
      // WebRTC Signaling handlers
      socket.on('webrtc_offer', (data) => handleWebRTCOffer(socket, io, data));
      socket.on('webrtc_answer', (data) => handleWebRTCAnswer(socket, io, data));
      socket.on('webrtc_ice_candidate', (data) => handleWebRTCIceCandidate(socket, io, data));
      socket.on('webrtc_renegotiate', (data) => handleWebRTCRenegotiate(socket, io, data));
      
      // Presence handlers
      socket.on('get_online_status', (data) => handleGetOnlineStatus(socket, data));
      socket.on('disconnect', () => handleDisconnect(socket, io));
    });
  }
  res.end();
}

// Handler functions

async function handleAuthentication(socket: Socket) {
  try {
    const userId = socket.data.userId;
    const userType = socket.data.userType;
    
    // Store user connection
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId,
      userType,
      isOnline: true,
      lastSeen: new Date()
    });
    
    // Update user-socket mapping
    userSocketMap.set(userId, socket.id);
    
    // Join user to their personal room
    socket.join(`user_${userId}`);
    
    // Join type-specific room
    socket.join(userType === 'astrologer' ? 'astrologers' : 'users');
    
    // Update online status in database
    const { client, db } = await getDbConnection();
    
    if (userType === 'astrologer') {
      await db.collection('astrologers').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            is_online: true, 
            last_seen: new Date(),
            socket_id: socket.id 
          } 
        }
      );
    } else {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            is_online: true, 
            last_seen: new Date(),
            socket_id: socket.id 
          } 
        }
      );
    }
    
    await client.close();
    
    socket.emit('authenticated', { 
      success: true, 
      userId, 
      userType,
      socketId: socket.id 
    });
    
    // Notify others about online status
    socket.broadcast.emit('user_online', { userId, userType });
    
  } catch (error) {
    console.error('Authentication error:', error);
    socket.emit('authentication_error', { error: 'Authentication failed' });
  }
}

async function handleJoinChatSession(socket: Socket, data: ChatSessionData) {
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
    
  } catch (error) {
    console.error('Join chat session error:', error);
    socket.emit('chat_error', { error: 'Failed to join chat session' });
  }
}

async function handleLeaveChatSession(socket: Socket, data: ChatSessionData) {
  try {
    const { sessionId } = data;
    socket.leave(`chat_${sessionId}`);
  } catch (error) {
    console.error('Leave chat session error:', error);
  }
}

async function handleSendMessage(socket: Socket, io: ServerIO, data: MessageData) {
  try {
    const { sessionId, content, messageType = 'text', imageUrl, voiceUrl } = data;
    const senderId = socket.data.userId;
    const senderType = socket.data.userType;
    
    if (!sessionId) {
      return;
    }
    
    const { client, db } = await getDbConnection();
    
    // Get session details
    const session = await db.collection('chat_sessions').findOne({ 
      _id: new ObjectId(sessionId) 
    });
    
    if (!session) {
      socket.emit('message_error', { error: 'Session not found' });
      await client.close();
      return;
    }
    
    // Get sender details - all users are in 'users' collection
    const sender = await db.collection('users').findOne({ 
      _id: new ObjectId(senderId) 
    });
    
    if (!sender) {
      console.error(`❌ Sender not found: ${senderId}`);
      socket.emit('message_error', { error: 'Sender not found' });
      await client.close();
      return;
    }

    const senderName = sender.full_name;
    
    // Create message
    const message: ChatMessage = {
      session_id: sessionId,
      sender_id: senderId,
      sender_name: senderName,
      sender_type: senderType,
      message_type: messageType as 'text' | 'image' | 'system' | 'voice',
      content: content || '',
      image_url: imageUrl,
      voice_url: voiceUrl,
      read_by_user: senderType === 'user',
      read_by_astrologer: senderType === 'astrologer',
      timestamp: new Date(),
      created_at: new Date()
    };
    
    const result = await db.collection('chat_messages').insertOne(message);
    
    // Update session
    await db.collection('chat_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
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
    
  } catch (error) {
    console.error('Send message error:', error);
    socket.emit('message_error', { error: 'Failed to send message' });
  }
}

async function handleTypingStart(socket: Socket, io: ServerIO, data: TypingData) {
  const { sessionId } = data;
  const userId = socket.data.userId;
  const userType = socket.data.userType;
  
  socket.to(`chat_${sessionId}`).emit('typing_start', { 
    userId, 
    userType,
    sessionId 
  });
}

async function handleTypingStop(socket: Socket, io: ServerIO, data: TypingData) {
  const { sessionId } = data;
  const userId = socket.data.userId;
  const userType = socket.data.userType;
  
  socket.to(`chat_${sessionId}`).emit('typing_stop', { 
    userId, 
    userType,
    sessionId 
  });
}

async function handleMarkMessagesRead(socket: Socket, io: ServerIO, data: MessagesReadData) {
  try {
    const { sessionId, messageIds } = data;
    const userType = socket.data.userType;
    
    const { client, db } = await getDbConnection();
    
    // Update read status
    const updateField = userType === 'user' ? 'read_by_user' : 'read_by_astrologer';
    await db.collection('chat_messages').updateMany(
      { 
        _id: { $in: messageIds.map((id: string) => new ObjectId(id)) },
        session_id: sessionId 
      },
      { $set: { [updateField]: true } }
    );
    
    // Reset unread count
    const unreadField = userType === 'user' ? 'user_unread_count' : 'astrologer_unread_count';
    await db.collection('chat_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { [unreadField]: 0 } }
    );
    
    await client.close();
    
    // Notify sender about read receipt
    socket.to(`chat_${sessionId}`).emit('messages_read', { 
      messageIds, 
      readBy: userType 
    });
    
  } catch (error) {
    console.error('Mark messages read error:', error);
  }
}

async function handleInitiateCall(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { targetUserId, callType = 'voice' } = data;
    const callerId = socket.data.userId;
    const callerType = socket.data.userType;
    
    // Generate unique session ID for this call
    const sessionId = new ObjectId().toString();
    
    const { client, db } = await getDbConnection();
    
    // Get caller and target user details - both are in 'users' collection
    const caller = await db.collection('users').findOne({ 
      _id: new ObjectId(callerId) 
    }, {
      projection: { 
        full_name: 1, 
        name: 1, 
        email: 1, 
        email_address: 1,
        profile_picture: 1, 
        video_rate: 1, 
        call_rate: 1,
        phone_number: 1,
        user_type: 1
      }
    });
    
    const target = await db.collection('users').findOne({ 
      _id: new ObjectId(targetUserId) 
    }, {
      projection: { 
        full_name: 1, 
        name: 1, 
        email: 1, 
        email_address: 1,
        profile_picture: 1, 
        video_rate: 1, 
        call_rate: 1,
        phone_number: 1,
        user_type: 1
      }
    });
    
    if (!target) {
      socket.emit('call_error', { error: 'Target user not found' });
      await client.close();
      return;
    }

    if (!caller) {
      console.error(`❌ Caller not found: ${callerId} in users collection`);
      socket.emit('call_error', { error: 'Caller not found' });
      await client.close();
      return;
    }

    // Validate user types match expected caller/target types
    const targetType = callerType === 'astrologer' ? 'user' : 'astrologer';
    
    if (caller.user_type !== callerType) {
      console.error(`❌ Caller type mismatch: expected ${callerType}, got ${caller.user_type}`);
      socket.emit('call_error', { error: 'Caller type validation failed' });
      await client.close();
      return;
    }
    
    if (target.user_type !== targetType) {
      console.error(`❌ Target type mismatch: expected ${targetType}, got ${target.user_type}`);
      socket.emit('call_error', { error: 'Target type validation failed' });
      await client.close();
      return;
    }

    // Debug logging for name resolution
    
    // Create call session in database
    const callSession = {
      _id: new ObjectId(sessionId),
      user_id: callerType === 'user' ? callerId : targetUserId,
      astrologer_id: callerType === 'astrologer' ? callerId : targetUserId,
      caller_id: callerId,
      caller_type: callerType,
      caller_name: caller.full_name, // Add caller name to session
      target_name: target.full_name, // Add target name to session
      call_type: callType as 'voice' | 'video',
      status: 'ringing',
      rate_per_minute: callerType === 'astrologer' 
        ? (callType === 'video' ? caller.video_rate : caller.call_rate) 
        : (callType === 'video' ? target.video_rate : target.call_rate),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('call_sessions').insertOne(callSession);
    await client.close();
    
    // Store active call
    activeCalls.set(sessionId, {
      sessionId,
      userId: callSession.user_id as string,
      astrologerId: callSession.astrologer_id as string,
      status: 'ringing',
      callType: callType as 'voice' | 'video',
      iceCandidates: []
    });
    
    // Send call notification to target
    io.to(`user_${targetUserId}`).emit('incoming_call', {
      sessionId,
      callerId,
      callerName: caller.full_name, // Direct access - no fallbacks needed
      callerType,
      callType: callType as 'voice' | 'video',
      callerAvatar: caller?.profile_picture,
      timestamp: new Date()
    });
    
    // Confirm to caller
    socket.emit('call_initiated', { 
      sessionId, 
      status: 'ringing',
      targetName: target.full_name, // Direct access - no fallbacks needed
      targetAvatar: target?.profile_picture
    });
    
  } catch (error) {
    console.error('Initiate call error:', error);
    socket.emit('call_error', { error: 'Failed to initiate call' });
  }
}

async function handleAnswerCall(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { sessionId } = data;
    const userId = socket.data.userId;
    
    if (!sessionId) {
      socket.emit('call_error', { error: 'Session ID required' });
      return;
    }
    
    const call = activeCalls.get(sessionId);
    if (!call) {
      socket.emit('call_error', { error: 'Call session not found' });
      return;
    }
    
    // Update call status
    const { client, db } = await getDbConnection();
    await db.collection('call_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          status: 'active',
          start_time: new Date(),
          answered_by: userId,
          updated_at: new Date()
        }
      }
    );
    await client.close();
    
    // Update active call
    call.status = 'active';
    call.startTime = new Date();
    
    // Notify both participants
    io.to(`user_${call.userId}`).emit('call_answered', { sessionId });
    io.to(`user_${call.astrologerId}`).emit('call_answered', { sessionId });
    
  } catch (error) {
    console.error('Answer call error:', error);
    socket.emit('call_error', { error: 'Failed to answer call' });
  }
}

async function handleRejectCall(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { sessionId, reason = 'busy' } = data;
    
    if (!sessionId) {
      socket.emit('call_error', { error: 'Session ID required' });
      return;
    }
    
    const call = activeCalls.get(sessionId);
    if (!call) {
      socket.emit('call_error', { error: 'Call session not found' });
      return;
    }
    
    // Update call status
    const { client, db } = await getDbConnection();
    await db.collection('call_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date()
        }
      }
    );
    await client.close();
    
    // Remove from active calls
    activeCalls.delete(sessionId);
    
    // Notify both participants
    io.to(`user_${call.userId}`).emit('call_rejected', { sessionId, reason });
    io.to(`user_${call.astrologerId}`).emit('call_rejected', { sessionId, reason });
    
  } catch (error) {
    console.error('Reject call error:', error);
    socket.emit('call_error', { error: 'Failed to reject call' });
  }
}

async function handleEndCall(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { sessionId } = data;
    
    if (!sessionId) {
      console.error('End call: sessionId is required');
      socket.emit('call_error', { error: 'Session ID is required' });
      return;
    }
    
    const call = activeCalls.get(sessionId);
    if (!call) {
      // Call might have already ended
      return;
    }
    
    const { client, db } = await getDbConnection();
    
    // Calculate duration and billing if call was active
    if (call.status === 'active' && call.startTime) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - call.startTime.getTime();
      const durationMinutes = Math.ceil(durationMs / (1000 * 60));
      
      const session = await db.collection('call_sessions').findOne({ 
        _id: new ObjectId(sessionId) 
      });
      
      const totalAmount = durationMinutes * (session?.rate_per_minute || 0);
      
      await db.collection('call_sessions').updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            status: 'completed',
            end_time: endTime,
            duration_minutes: durationMinutes,
            total_amount: Math.round(totalAmount * 100) / 100,
            updated_at: new Date()
          }
        }
      );
      
      // Deduct from user wallet if needed
      if (totalAmount > 0) {
        await db.collection('users').updateOne(
          { _id: new ObjectId(call.userId) },
          { $inc: { wallet_balance: -totalAmount } }
        );
        
        // Add to astrologer earnings
        await db.collection('astrologers').updateOne(
          { _id: new ObjectId(call.astrologerId) },
          { $inc: { total_earnings: totalAmount } }
        );
        
        // Create transaction record
        await db.collection('transactions').insertOne({
          user_id: call.userId,
          astrologer_id: call.astrologerId,
          session_id: sessionId,
          type: 'call',
          amount: totalAmount,
          duration_minutes: durationMinutes,
          status: 'completed',
          created_at: new Date()
        });
      }
    } else {
      // Call was not answered or was cancelled
      await db.collection('call_sessions').updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            status: 'ended',
            end_time: new Date(),
            updated_at: new Date()
          }
        }
      );
    }
    
    await client.close();
    
    // Remove from active calls
    activeCalls.delete(sessionId);
    
    // Notify both participants
    io.to(`user_${call.userId}`).emit('call_ended', { sessionId });
    io.to(`user_${call.astrologerId}`).emit('call_ended', { sessionId });
    
  } catch (error) {
    console.error('End call error:', error);
    socket.emit('call_error', { error: 'Failed to end call' });
  }
}

async function handleWebRTCOffer(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { sessionId, offer, targetUserId } = data;
    
    if (!sessionId) {
      console.error('WebRTC offer: sessionId is required');
      socket.emit('call_error', { error: 'Session ID is required' });
      return;
    }
    
    const call = activeCalls.get(sessionId);
    if (call && offer) {
      call.offer = offer;
    }
    
    io.to(`user_${targetUserId}`).emit('webrtc_offer', { 
      sessionId, 
      offer,
      fromUserId: socket.data.userId 
    });
    
  } catch (error) {
    console.error('WebRTC offer error:', error);
  }
}

async function handleWebRTCAnswer(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { sessionId, answer, targetUserId } = data;
    
    if (!sessionId) {
      console.error('WebRTC answer: sessionId is required');
      socket.emit('call_error', { error: 'Session ID is required' });
      return;
    }
    
    const call = activeCalls.get(sessionId);
    if (call && answer) {
      call.answer = answer;
    }
    
    io.to(`user_${targetUserId}`).emit('webrtc_answer', { 
      sessionId, 
      answer,
      fromUserId: socket.data.userId 
    });
    
  } catch (error) {
    console.error('WebRTC answer error:', error);
  }
}

async function handleWebRTCIceCandidate(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { sessionId, candidate, targetUserId } = data;
    
    if (!sessionId) {
      console.error('WebRTC ICE candidate: sessionId is required');
      socket.emit('call_error', { error: 'Session ID is required' });
      return;
    }
    
    if (!candidate) {
      console.error('WebRTC ICE candidate: candidate is required');
      socket.emit('call_error', { error: 'ICE candidate is required' });
      return;
    }
    
    const call = activeCalls.get(sessionId);
    if (call) {
      call.iceCandidates.push(candidate);
    }
    
    io.to(`user_${targetUserId}`).emit('webrtc_ice_candidate', { 
      sessionId, 
      candidate,
      fromUserId: socket.data.userId 
    });
    
  } catch (error) {
    console.error('WebRTC ICE candidate error:', error);
  }
}

async function handleWebRTCRenegotiate(socket: Socket, io: ServerIO, data: CallData) {
  try {
    const { sessionId, offer, targetUserId } = data;
    
    io.to(`user_${targetUserId}`).emit('webrtc_renegotiate', { 
      sessionId, 
      offer,
      fromUserId: socket.data.userId 
    });
    
  } catch (error) {
    console.error('WebRTC renegotiate error:', error);
  }
}

async function handleGetOnlineStatus(socket: Socket, data: OnlineStatusData) {
  try {
    const { userIds } = data;
    const onlineStatuses: Record<string, boolean> = {};
    
    for (const userId of userIds) {
      const socketId = userSocketMap.get(userId);
      onlineStatuses[userId] = !!socketId && connectedUsers.has(socketId);
    }
    
    socket.emit('online_status', { statuses: onlineStatuses });
  } catch (error) {
    console.error('Get online status error:', error);
  }
}

async function handleDisconnect(socket: Socket, io: ServerIO) {
  try {
    
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo) return;
    
    const { userId, userType } = userInfo;
    
    // Update database
    const { client, db } = await getDbConnection();
    
    const collection = userType === 'astrologer' ? 'astrologers' : 'users';
    await db.collection(collection).updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          is_online: false, 
          last_seen: new Date() 
        },
        $unset: { socket_id: "" }
      }
    );
    
    // End any active calls
    for (const [sessionId, call] of activeCalls.entries()) {
      if (call.userId === userId || call.astrologerId === userId) {
        // Force end the call
        await handleEndCall(socket, io, { sessionId });
      }
    }
    
    await client.close();
    
    // Remove from maps
    connectedUsers.delete(socket.id);
    userSocketMap.delete(userId);
    
    // Notify others about offline status
    socket.broadcast.emit('user_offline', { userId, userType });
    
  } catch (error) {
    console.error('Disconnect error:', error);
  }
}