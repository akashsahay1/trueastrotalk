const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { MongoClient, ObjectId } = require('mongodb');
const admin = require('firebase-admin');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Accept connections from all network interfaces
const port = process.env.PORT || 4001;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require('./service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('🔥 Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
}

// Connected users storage
const connectedUsers = new Map();

// Create Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(handler);
  
  // Create Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allow all origins for development - restrict in production
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle user authentication (Flutter app uses this)
    socket.on('authenticate', async (data) => {
      try {
        const { userId, userType } = data;
        console.log(`🔐 [SOCKET] authenticate event: userId=${userId}, userType=${userType}`);

        // Store user connection
        connectedUsers.set(socket.id, {
          socketId: socket.id,
          userId: userId,
          userType: userType,
          isOnline: true
        });

        // Join user to their personal room
        socket.join(`user_${userId}`);
        console.log(`🔌 [SOCKET] User ${userId} (${userType}) joined room: user_${userId}`);

        // Join astrologers to astrologer room
        if (userType === 'astrologer') {
          socket.join('astrologers');
          console.log(`🔌 [SOCKET] Astrologer ${userId} also joined room: astrologers`);
        }

        socket.emit('authenticated', { success: true, userId, userType });
        console.log(`✅ [SOCKET] User ${userId} authenticated successfully`);

      } catch (error) {
        console.error('❌ Authentication error:', error);
        socket.emit('authentication_error', { error: 'Authentication failed' });
      }
    });

    // Handle call initiation
    socket.on('initiate_call', async (data) => {
      try {
        const { sessionId, callerId, callerName, callerType, callType } = data;
        console.log('📞 [CALL] initiate_call received:', JSON.stringify(data, null, 2));

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Get call session from unified sessions collection
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId),
          session_type: { $in: ['voice_call', 'video_call'] }
        });

        if (!session) {
          console.log('❌ [CALL] Session not found:', sessionId);
          socket.emit('call_error', { error: 'Call session not found' });
          await client.close();
          return;
        }

        // Update call status to ringing
        await db.collection('sessions').updateOne(
          { _id: new ObjectId(sessionId) },
          { $set: { status: 'ringing', updated_at: new Date() } }
        );

        // Determine receiver
        const receiverId = callerType === 'customer' ? session.astrologer_id : session.user_id;
        console.log(`📞 [CALL] Receiver ID: ${receiverId}`);

        // Get receiver info for push notification
        const receiver = await db.collection('users').findOne({ user_id: receiverId });
        await client.close();

        console.log(`📞 [CALL] Receiver FCM token: ${receiver?.fcm_token ? 'EXISTS (' + receiver.fcm_token.substring(0, 20) + '...)' : 'NOT SET'}`);

        // Emit incoming call to receiver via socket
        console.log(`📞 [CALL] Emitting 'incoming_call' to room: user_${receiverId}`);
        io.to(`user_${receiverId}`).emit('incoming_call', {
          sessionId,
          callerId,
          callerType,
          callType,
          callerName: callerName || 'Unknown',
          timestamp: new Date()
        });
        console.log(`✅ [CALL] incoming_call event emitted to user_${receiverId}`);

        // Send FCM push notification for incoming call
        if (receiver?.fcm_token) {
          try {
            const message = {
              token: receiver.fcm_token,
              notification: {
                title: `Incoming ${callType || 'voice'} call`,
                body: `${callerName || 'Someone'} is calling you`
              },
              data: {
                type: 'incoming_call',
                sessionId: String(sessionId || ''),
                callerId: String(callerId || ''),
                callerName: String(callerName || 'Unknown'),
                callerType: String(callerType || 'user'),
                callType: String(callType || 'voice')
              },
              android: {
                priority: 'high',
                notification: {
                  channelId: 'incoming_calls',
                  priority: 'max',
                  defaultSound: true,
                  defaultVibrateTimings: true
                }
              },
              apns: {
                payload: {
                  aps: {
                    alert: {
                      title: `Incoming ${callType} call`,
                      body: `${callerName || 'Someone'} is calling you`
                    },
                    sound: 'default',
                    badge: 1,
                    'content-available': 1
                  }
                },
                headers: {
                  'apns-priority': '10',
                  'apns-push-type': 'alert'
                }
              }
            };

            await admin.messaging().send(message);
            console.log(`📱 [CALL] FCM push notification sent to ${receiverId}`);
          } catch (fcmError) {
            console.error('❌ [CALL] FCM notification error:', fcmError.message);
          }
        } else {
          console.log('⚠️ [CALL] No FCM token for receiver, push notification not sent');
        }

      } catch (error) {
        console.error('❌ [CALL] initiate_call error:', error);
        socket.emit('call_error', { error: 'Failed to initiate call' });
      }
    });

    // Handle call answer
    socket.on('answer_call', async (data) => {
      try {
        const { sessionId } = data;
        console.log('✅ [CALL] answer_call received:', JSON.stringify(data, null, 2));

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Get call session
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId),
          session_type: { $in: ['voice_call', 'video_call'] }
        });

        if (!session) {
          console.log('❌ [CALL] Session not found for answer:', sessionId);
          socket.emit('call_error', { error: 'Call session not found' });
          await client.close();
          return;
        }

        // Update call status to connected
        await db.collection('sessions').updateOne(
          { _id: new ObjectId(sessionId) },
          { $set: { status: 'connected', started_at: new Date(), updated_at: new Date() } }
        );
        await client.close();

        // Find the caller (initiator) to notify them
        const callerId = session.user_id;
        console.log(`✅ [CALL] Notifying caller ${callerId} that call was answered`);

        // Emit call_answered to the caller so they can start WebRTC offer
        io.to(`user_${callerId}`).emit('call_answered', {
          sessionId,
          answeredAt: new Date()
        });

        console.log(`✅ [CALL] call_answered emitted to user_${callerId}`);

      } catch (error) {
        console.error('❌ [CALL] answer_call error:', error);
        socket.emit('call_error', { error: 'Failed to answer call' });
      }
    });

    // Handle call rejection
    socket.on('reject_call', async (data) => {
      try {
        const { sessionId, reason } = data;
        console.log('❌ [CALL] reject_call received:', JSON.stringify(data, null, 2));

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Get call session
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId),
          session_type: { $in: ['voice_call', 'video_call'] }
        });

        if (session) {
          // Update call status to rejected
          await db.collection('sessions').updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { status: 'rejected', end_reason: reason || 'rejected', updated_at: new Date() } }
          );

          // Notify the caller
          const callerId = session.user_id;
          io.to(`user_${callerId}`).emit('call_rejected', {
            sessionId,
            reason: reason || 'Call was rejected'
          });
          console.log(`❌ [CALL] call_rejected emitted to user_${callerId}`);
        }

        await client.close();

      } catch (error) {
        console.error('❌ [CALL] reject_call error:', error);
      }
    });

    // Handle call end
    socket.on('end_call', async (data) => {
      try {
        const { sessionId, endedBy } = data;
        console.log('📴 [CALL] end_call received:', JSON.stringify(data, null, 2));

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Get call session
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId),
          session_type: { $in: ['voice_call', 'video_call'] }
        });

        if (session) {
          // Update call status to completed
          await db.collection('sessions').updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { status: 'completed', ended_at: new Date(), updated_at: new Date() } }
          );

          // Notify both parties
          const userId = session.user_id;
          const astrologerId = session.astrologer_id;

          io.to(`user_${userId}`).emit('call_ended', { sessionId, endedBy });
          io.to(`user_${astrologerId}`).emit('call_ended', { sessionId, endedBy });
          console.log(`📴 [CALL] call_ended emitted to both parties`);
        }

        await client.close();

      } catch (error) {
        console.error('❌ [CALL] end_call error:', error);
      }
    });

    // Handle WebRTC offer
    socket.on('webrtc_offer', (data) => {
      const { sessionId, targetUserId, offer } = data;
      console.log(`📤 [WEBRTC] Forwarding offer to user_${targetUserId}`);

      // Get the sender's user ID from connectedUsers
      const senderInfo = connectedUsers.get(socket.id);
      const fromUserId = senderInfo?.userId;

      io.to(`user_${targetUserId}`).emit('webrtc_offer', {
        sessionId,
        offer,
        fromUserId
      });
    });

    // Handle WebRTC answer
    socket.on('webrtc_answer', (data) => {
      const { sessionId, targetUserId, answer } = data;
      console.log(`📤 [WEBRTC] Forwarding answer to user_${targetUserId}`);

      // Get the sender's user ID from connectedUsers
      const senderInfo = connectedUsers.get(socket.id);
      const fromUserId = senderInfo?.userId;

      io.to(`user_${targetUserId}`).emit('webrtc_answer', {
        sessionId,
        answer,
        fromUserId
      });
    });

    // Handle WebRTC ICE candidate
    socket.on('webrtc_ice_candidate', (data) => {
      const { sessionId, targetUserId, candidate } = data;
      console.log(`🧊 [WEBRTC] Forwarding ICE candidate to user_${targetUserId}`);

      io.to(`user_${targetUserId}`).emit('webrtc_ice_candidate', {
        sessionId,
        candidate
      });
    });

    // Handle user joining (legacy - for customers and astrologers)
    socket.on('join_user', (data) => {
      const { userId, userType } = data;
      console.log(`👤 ${userType} ${userId} joined`);

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // Join astrologers to astrologer room for broadcasts
      if (userType === 'astrologer') {
        socket.join('astrologers');

        // Broadcast that astrologer is online
        socket.broadcast.emit('astrologer_online', {
          astrologerId: userId,
          status: 'online'
        });
      }
    });

    // Handle chat initiation (customer requesting chat with astrologer)
    socket.on('initiate_chat', async (data) => {
      try {
        const { astrologerId } = data;
        const userInfo = connectedUsers.get(socket.id);
        const userId = userInfo?.userId;
        const userType = userInfo?.userType;

        console.log(`💬 [CHAT] initiate_chat received: userId=${userId}, astrologerId=${astrologerId}, userType=${userType}`);

        // Only customers can initiate chat
        if (!userId || userType !== 'customer') {
          console.log('❌ [CHAT] Only customers can initiate chat');
          socket.emit('chat_error', { error: 'Only customers can initiate chat sessions' });
          return;
        }

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Get user details
        const user = await db.collection('users').findOne({ user_id: userId });
        if (!user) {
          console.log(`❌ [CHAT] User not found: ${userId}`);
          socket.emit('chat_error', { error: 'User not found' });
          await client.close();
          return;
        }

        // Get astrologer details
        const astrologer = await db.collection('users').findOne({
          user_id: astrologerId,
          user_type: 'astrologer'
        });

        if (!astrologer) {
          console.log(`❌ [CHAT] Astrologer not found: ${astrologerId}`);
          socket.emit('chat_error', { error: 'Astrologer not found' });
          await client.close();
          return;
        }

        if (!astrologer.is_online) {
          socket.emit('chat_error', { error: 'Astrologer is currently offline' });
          await client.close();
          return;
        }

        // Check for existing active/pending session
        const existingSession = await db.collection('sessions').findOne({
          session_type: 'chat',
          user_id: userId,
          astrologer_id: astrologerId,
          status: { $in: ['pending', 'active', 'ringing'] }
        });

        if (existingSession) {
          console.log(`💬 [CHAT] Existing session found: ${existingSession._id}, status: ${existingSession.status}`);

          // Get astrologer details for the response
          const astrologer = await db.collection('users').findOne({ user_id: astrologerId });

          socket.emit('chat_initiated', {
            sessionId: existingSession._id.toString(),
            status: existingSession.status,
            message: 'Session already exists',
            astrologerName: astrologer?.full_name || 'Astrologer',
            astrologerAvatar: astrologer?.profile_picture
          });

          // If session is active, also notify astrologer to open chat
          if (existingSession.status === 'active') {
            io.to(`user_${astrologerId}`).emit('chat_resumed', {
              sessionId: existingSession._id.toString(),
              userId: userId,
              userName: user.full_name || 'Customer'
            });
            console.log(`💬 [CHAT] Notified astrologer to resume chat`);
          }

          await client.close();
          return;
        }

        // Create new chat session with 'ringing' status
        const sessionId = new ObjectId();
        const chatSession = {
          _id: sessionId,
          session_type: 'chat',
          user_id: userId,
          astrologer_id: astrologerId,
          status: 'ringing',
          rate_per_minute: astrologer.chat_rate || 30,
          start_time: null,
          end_time: null,
          duration_minutes: 0,
          total_amount: 0,
          last_message: null,
          last_message_time: null,
          user_unread_count: 0,
          astrologer_unread_count: 0,
          billing_updated_at: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        await db.collection('sessions').insertOne(chatSession);
        console.log(`💬 [CHAT] Session created: ${sessionId}`);

        await client.close();

        // Prepare incoming chat data for astrologer
        const incomingChatData = {
          sessionId: sessionId.toString(),
          userId: userId,
          userName: user.full_name || 'Customer',
          userAvatar: user.profile_picture,
          chatRate: astrologer.chat_rate || 30,
          timestamp: new Date()
        };

        // Notify astrologer via socket
        console.log(`💬 [CHAT] Emitting incoming_chat to user_${astrologerId}`);
        io.to(`user_${astrologerId}`).emit('incoming_chat', incomingChatData);

        // Confirm to customer
        socket.emit('chat_initiated', {
          sessionId: sessionId.toString(),
          status: 'ringing',
          astrologerName: astrologer.full_name,
          astrologerAvatar: astrologer.profile_picture,
          chatRate: astrologer.chat_rate || 30
        });

        console.log(`✅ [CHAT] Chat request sent from ${user.full_name} to ${astrologer.full_name}`);

      } catch (error) {
        console.error('❌ [CHAT] initiate_chat error:', error);
        socket.emit('chat_error', { error: 'Failed to initiate chat' });
      }
    });

    // Handle chat acceptance (astrologer accepting chat request)
    socket.on('accept_chat', async (data) => {
      try {
        const { sessionId } = data;
        const userInfo = connectedUsers.get(socket.id);
        const astrologerId = userInfo?.userId;

        console.log(`✅ [CHAT] accept_chat received: sessionId=${sessionId}, astrologerId=${astrologerId}`);

        if (!sessionId) {
          socket.emit('chat_error', { error: 'Session ID required' });
          return;
        }

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Get session - accept both 'ringing' and 'pending' status
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId),
          session_type: 'chat',
          status: { $in: ['ringing', 'pending'] }
        });

        if (!session) {
          console.log(`❌ [CHAT] Session not found or already processed: ${sessionId}`);
          // Log more details for debugging
          const anySession = await db.collection('sessions').findOne({ _id: new ObjectId(sessionId) });
          if (anySession) {
            console.log(`❌ [CHAT] Session exists but has status: ${anySession.status}, type: ${anySession.session_type}`);
          }
          socket.emit('chat_error', { error: 'Chat session not found or already processed' });
          await client.close();
          return;
        }

        console.log(`💬 [CHAT] Found session: status=${session.status}, astrologer_id=${session.astrologer_id}`);

        // Verify astrologer is the one receiving this chat
        if (session.astrologer_id !== astrologerId) {
          console.log(`❌ [CHAT] Unauthorized: session.astrologer_id=${session.astrologer_id}, astrologerId=${astrologerId}`);
          socket.emit('chat_error', { error: 'Unauthorized to accept this chat' });
          await client.close();
          return;
        }

        // Update session to active
        await db.collection('sessions').updateOne(
          { _id: new ObjectId(sessionId) },
          {
            $set: {
              status: 'active',
              start_time: new Date(),
              updated_at: new Date()
            }
          }
        );

        // Get astrologer name for notification
        const astrologer = await db.collection('users').findOne({ user_id: astrologerId });
        await client.close();

        console.log(`✅ [CHAT] Chat accepted: ${sessionId} by ${astrologer?.full_name}`);

        // Notify customer that chat was accepted
        const chatAcceptedData = {
          sessionId,
          astrologerId,
          astrologerName: astrologer?.full_name || 'Astrologer'
        };

        io.to(`user_${session.user_id}`).emit('chat_accepted', chatAcceptedData);
        socket.emit('chat_accepted', { sessionId, userId: session.user_id });

        console.log(`✅ [CHAT] chat_accepted emitted to user_${session.user_id}`);

      } catch (error) {
        console.error('❌ [CHAT] accept_chat error:', error);
        socket.emit('chat_error', { error: 'Failed to accept chat' });
      }
    });

    // Handle chat rejection (astrologer rejecting chat request)
    socket.on('reject_chat', async (data) => {
      try {
        const { sessionId, reason = 'busy' } = data;
        const userInfo = connectedUsers.get(socket.id);
        const astrologerId = userInfo?.userId;

        console.log(`❌ [CHAT] reject_chat received: sessionId=${sessionId}, astrologerId=${astrologerId}`);

        if (!sessionId) {
          socket.emit('chat_error', { error: 'Session ID required' });
          return;
        }

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Get session - accept both 'ringing' and 'pending' status
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId),
          session_type: 'chat',
          status: { $in: ['ringing', 'pending'] }
        });

        if (!session) {
          console.log(`❌ [CHAT] Session not found or already processed: ${sessionId}`);
          socket.emit('chat_error', { error: 'Chat session not found or already processed' });
          await client.close();
          return;
        }

        // Verify astrologer is the one receiving this chat
        if (session.astrologer_id !== astrologerId) {
          socket.emit('chat_error', { error: 'Unauthorized to reject this chat' });
          await client.close();
          return;
        }

        // Update session to rejected
        await db.collection('sessions').updateOne(
          { _id: new ObjectId(sessionId) },
          {
            $set: {
              status: 'rejected',
              rejection_reason: reason,
              updated_at: new Date()
            }
          }
        );

        // Get astrologer name for notification
        const astrologer = await db.collection('users').findOne({ user_id: astrologerId });
        await client.close();

        console.log(`❌ [CHAT] Chat rejected: ${sessionId} by ${astrologer?.full_name}, reason: ${reason}`);

        // Notify customer that chat was rejected
        const chatRejectedData = {
          sessionId,
          reason,
          astrologerName: astrologer?.full_name || 'Astrologer'
        };

        io.to(`user_${session.user_id}`).emit('chat_rejected', chatRejectedData);
        socket.emit('chat_rejected', { sessionId, success: true });

        console.log(`❌ [CHAT] chat_rejected emitted to user_${session.user_id}`);

      } catch (error) {
        console.error('❌ [CHAT] reject_chat error:', error);
        socket.emit('chat_error', { error: 'Failed to reject chat' });
      }
    });

    // Handle joining a chat session room
    socket.on('join_chat_session', async (data) => {
      try {
        const { sessionId } = data;
        const userInfo = connectedUsers.get(socket.id);

        if (!sessionId) {
          socket.emit('chat_error', { error: 'Session ID required' });
          return;
        }

        console.log(`🏠 [CHAT] User ${userInfo?.userId} joining chat session: ${sessionId}`);

        // Join the socket room for this chat session
        socket.join(`chat_${sessionId}`);

        // Store current chat session in socket data
        socket.chatSessionId = sessionId;

        socket.emit('joined_chat_session', { sessionId, success: true });
        console.log(`✅ [CHAT] User ${userInfo?.userId} joined chat room: chat_${sessionId}`);

      } catch (error) {
        console.error('❌ [CHAT] join_chat_session error:', error);
        socket.emit('chat_error', { error: 'Failed to join chat session' });
      }
    });

    // Handle leaving a chat session room
    socket.on('leave_chat_session', async (data) => {
      try {
        const { sessionId } = data;
        const userInfo = connectedUsers.get(socket.id);

        if (!sessionId) {
          return;
        }

        console.log(`🚪 [CHAT] User ${userInfo?.userId} leaving chat session: ${sessionId}`);

        // Leave the socket room
        socket.leave(`chat_${sessionId}`);
        socket.chatSessionId = null;

        socket.emit('left_chat_session', { sessionId, success: true });

      } catch (error) {
        console.error('❌ [CHAT] leave_chat_session error:', error);
      }
    });

    // Handle ending a chat session
    socket.on('end_chat_session', async (data) => {
      const client = new MongoClient(MONGODB_URL);
      try {
        const { chatSessionId } = data;
        const userInfo = connectedUsers.get(socket.id);

        if (!chatSessionId) {
          socket.emit('chat_error', { error: 'Chat session ID required' });
          return;
        }

        console.log(`🔚 [CHAT] Ending chat session: ${chatSessionId} by ${userInfo?.userId}`);

        await client.connect();
        const db = client.db(DB_NAME);

        // Get session from database
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(chatSessionId),
          session_type: 'chat'
        });

        if (!session) {
          socket.emit('chat_error', { error: 'Chat session not found' });
          await client.close();
          return;
        }

        // Calculate final duration and amount
        const endTime = new Date();
        const startTime = new Date(session.start_time);
        const durationMs = endTime - startTime;
        const durationMinutes = Math.ceil(durationMs / 60000);
        const totalAmount = durationMinutes * (session.rate_per_minute || 0);

        // Update session in database
        await db.collection('sessions').updateOne(
          { _id: new ObjectId(chatSessionId) },
          {
            $set: {
              status: 'completed',
              end_time: endTime,
              duration_minutes: durationMinutes,
              total_amount: totalAmount,
              updated_at: endTime
            }
          }
        );

        await client.close();

        // Notify both users that chat has ended
        const chatEndedData = {
          sessionId: chatSessionId,
          status: 'completed',
          endTime: endTime.toISOString(),
          durationMinutes,
          totalAmount,
          endedBy: userInfo?.userId
        };

        // Emit to chat room
        io.to(`chat_${chatSessionId}`).emit('chat_ended', chatEndedData);

        // Also emit to individual users
        io.to(`user_${session.user_id}`).emit('chat_ended', chatEndedData);
        io.to(`user_${session.astrologer_id}`).emit('chat_ended', chatEndedData);

        console.log(`✅ [CHAT] Chat session ${chatSessionId} ended. Duration: ${durationMinutes} min, Amount: ₹${totalAmount}`);

      } catch (error) {
        console.error('❌ [CHAT] end_chat_session error:', error);
        socket.emit('chat_error', { error: 'Failed to end chat session' });
        try { await client.close(); } catch (e) {}
      }
    });

    // Handle chat messages (supports both old and new format)
    socket.on('send_message', async (data) => {
      const client = new MongoClient(MONGODB_URL);
      try {
        const userInfo = connectedUsers.get(socket.id);

        // Support both formats: new (sessionId, content) and old (consultationId, message)
        const sessionId = data.sessionId || data.consultationId;
        const content = data.content || data.message;
        const messageType = data.messageType || 'text';
        const senderId = userInfo?.userId || data.senderId;

        if (!sessionId || !content) {
          socket.emit('chat_error', { error: 'Session ID and content are required' });
          return;
        }

        console.log(`💬 [CHAT] Message in session ${sessionId} from ${senderId}: ${content.substring(0, 50)}...`);

        await client.connect();
        const db = client.db(DB_NAME);

        // Get session to find the other participant
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId)
        });

        if (!session) {
          socket.emit('chat_error', { error: 'Chat session not found' });
          await client.close();
          return;
        }

        // Determine receiver based on sender
        const receiverId = senderId === session.user_id ? session.astrologer_id : session.user_id;
        const senderType = senderId === session.user_id ? 'user' : 'astrologer';

        // Create message object
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date();

        const messageData = {
          id: messageId,
          chat_session_id: sessionId,
          sender_id: senderId,
          sender_name: userInfo?.userType === 'astrologer' ? 'Astrologer' : 'Customer',
          sender_type: senderType,
          type: messageType,
          content: content,
          is_read: false,
          timestamp: timestamp.toISOString()
        };

        // Update session's last message
        await db.collection('sessions').updateOne(
          { _id: new ObjectId(sessionId) },
          {
            $set: {
              last_message: content,
              last_message_time: timestamp,
              updated_at: timestamp
            },
            $inc: {
              [senderType === 'customer' ? 'astrologer_unread_count' : 'user_unread_count']: 1
            }
          }
        );

        await client.close();

        // Emit 'new_message' to chat room (Flutter listens for this)
        io.to(`chat_${sessionId}`).emit('new_message', messageData);

        // Also emit to individual users in case they're not in the chat room
        io.to(`user_${receiverId}`).emit('new_message', messageData);

        // Send confirmation back to sender
        socket.emit('message_sent', {
          sessionId,
          messageId,
          timestamp: timestamp.toISOString()
        });

        console.log(`✅ [CHAT] Message sent to chat_${sessionId} and user_${receiverId}`);

      } catch (error) {
        console.error('❌ [CHAT] send_message error:', error);
        socket.emit('chat_error', { error: 'Failed to send message' });
        try { await client.close(); } catch (e) {}
      }
    });

    // Handle consultation status updates
    socket.on('consultation_status', (data) => {
      const { consultationId, status, participants } = data;
      
      console.log(`📞 Consultation ${consultationId} status: ${status}`);
      
      // Notify all participants
      participants.forEach(userId => {
        io.to(`user_${userId}`).emit('consultation_update', {
          consultationId,
          status,
          timestamp: new Date().toISOString()
        });
      });
    });

    // Handle astrologer online/offline status
    socket.on('astrologer_status', (data) => {
      const { astrologerId, status } = data;
      
      console.log(`🟢 Astrologer ${astrologerId} is now ${status}`);
      
      // Broadcast status to all customers
      socket.broadcast.emit('astrologer_status_update', {
        astrologerId,
        status,
        timestamp: new Date().toISOString()
      });
    });

    // Handle typing indicators (supports both old and new format)
    socket.on('typing_start', async (data) => {
      const client = new MongoClient(MONGODB_URL);
      try {
        const userInfo = connectedUsers.get(socket.id);
        const sessionId = data.sessionId || data.consultationId;
        const senderId = userInfo?.userId || data.senderId;

        if (!sessionId) return;

        await client.connect();
        const db = client.db(DB_NAME);

        // Get session to find the other participant
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId)
        });

        await client.close();

        if (session) {
          const receiverId = senderId === session.user_id ? session.astrologer_id : session.user_id;

          // Emit to chat room and receiver - use 'customer' as default
          io.to(`chat_${sessionId}`).emit('typing_start', {
            chatSessionId: sessionId,
            userId: senderId,
            userType: userInfo?.userType || 'customer'
          });
          io.to(`user_${receiverId}`).emit('typing_start', {
            chatSessionId: sessionId,
            userId: senderId,
            userType: userInfo?.userType || 'customer'
          });
        }
      } catch (error) {
        console.error('❌ [CHAT] typing_start error:', error);
        try { await client.close(); } catch (e) {}
      }
    });

    socket.on('typing_stop', async (data) => {
      const client = new MongoClient(MONGODB_URL);
      try {
        const userInfo = connectedUsers.get(socket.id);
        const sessionId = data.sessionId || data.consultationId;
        const senderId = userInfo?.userId || data.senderId;

        if (!sessionId) return;

        await client.connect();
        const db = client.db(DB_NAME);

        // Get session to find the other participant
        const session = await db.collection('sessions').findOne({
          _id: new ObjectId(sessionId)
        });

        await client.close();

        if (session) {
          const receiverId = senderId === session.user_id ? session.astrologer_id : session.user_id;

          // Emit to chat room and receiver - use 'customer' as default
          io.to(`chat_${sessionId}`).emit('typing_stop', {
            chatSessionId: sessionId,
            userId: senderId,
            userType: userInfo?.userType || 'customer'
          });
          io.to(`user_${receiverId}`).emit('typing_stop', {
            chatSessionId: sessionId,
            userId: senderId,
            userType: userInfo?.userType || 'customer'
          });
        }
      } catch (error) {
        console.error('❌ [CHAT] typing_stop error:', error);
        try { await client.close(); } catch (e) {}
      }
    });

    // Handle notifications
    socket.on('send_notification', (data) => {
      const { userId, notification } = data;
      
      io.to(`user_${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });
  });

  // Start the server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`📡 Socket.IO ready for real-time connections`);

    // Signal PM2 that app is ready (for graceful reload)
    if (process.send) {
      process.send('ready');
    }
  });

  // Graceful shutdown handler
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    httpServer.close(() => {
      console.log('✅ HTTP server closed');

      // Close all socket connections
      io.close(() => {
        console.log('✅ Socket.IO server closed');

        // Close database connections (already handled by DatabaseService)
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      });
    });

    // Force shutdown after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // PM2 graceful reload
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      gracefulShutdown('PM2 shutdown');
    }
  });
});