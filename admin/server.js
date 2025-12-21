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
      origin: ["http://localhost:4001", "http://192.168.0.124:4001", "https://admin.trueastrotalk.com", "http://localhost:4002"],
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
        const receiverId = callerType === 'user' ? session.astrologer_id : session.user_id;
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

    // Handle chat messages
    socket.on('send_message', (data) => {
      const { consultationId, senderId, receiverId, message, messageType = 'text' } = data;
      
      console.log(`💬 Message in consultation ${consultationId}: ${senderId} → ${receiverId}`);
      
      // Send message to the receiver
      io.to(`user_${receiverId}`).emit('receive_message', {
        consultationId,
        senderId,
        message,
        messageType,
        timestamp: new Date().toISOString()
      });
      
      // Send confirmation back to sender
      socket.emit('message_sent', {
        consultationId,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
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

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { consultationId, senderId, receiverId } = data;
      io.to(`user_${receiverId}`).emit('user_typing', {
        consultationId,
        userId: senderId,
        typing: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { consultationId, senderId, receiverId } = data;
      io.to(`user_${receiverId}`).emit('user_typing', {
        consultationId,
        userId: senderId,
        typing: false
      });
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