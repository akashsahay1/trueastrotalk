// Load environment variables from .env file
require('dotenv').config();

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

// Initialize Firebase Admin SDK from environment variables
try {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing Firebase environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  // Parse private key - handle both escaped (\n as literal) and actual newlines
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  // Remove any wrapping quotes
  privateKey = privateKey.replace(/^["']|["']$/g, '');

  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: 'googleapis.com'
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('🔥 Firebase Admin SDK initialized for project:', process.env.FIREBASE_PROJECT_ID);
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

        // Strip 'user_' prefix to avoid double prefix in room name
        const roomId = userId?.startsWith('user_') ? userId.substring(5) : userId;

        // Join user to their personal room
        socket.join(`user_${roomId}`);
        console.log(`🔌 [SOCKET] User ${userId} (${userType}) joined room: user_${roomId}`);

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
        // Support both snake_case and camelCase field names
        const sessionId = data.session_id || data.sessionId;
        const callerId = data.caller_id || data.callerId;
        const callerName = data.caller_name || data.callerName;
        const callerType = data.caller_type || data.callerType;
        const callType = data.call_type || data.callType;
        const astrologerId = data.astrologer_id || data.astrologerId;

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
          socket.emit('call_error', { session_id: sessionId, error: 'Call session not found' });
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

        // Strip 'user_' prefix for socket room name to avoid double prefix (user_user_...)
        const receiverRoomId = receiverId && receiverId.startsWith('user_')
          ? receiverId.substring(5)
          : receiverId;

        // Get receiver info for push notification (use original ID with prefix)
        const receiver = await db.collection('users').findOne({ user_id: receiverId });

        // Get caller info (customer) for the astrologer to see
        const caller = await db.collection('users').findOne({ user_id: callerId });

        // Get astrologer info for billing and display
        const astrologer = await db.collection('users').findOne({
          user_id: session.astrologer_id,
          user_type: 'astrologer'
        });
        await client.close();

        console.log(`📞 [CALL] Receiver FCM token: ${receiver?.fcm_token ? 'EXISTS (' + receiver.fcm_token.substring(0, 20) + '...)' : 'NOT SET'}`);

        // Build astrologer object for billing (needed by ActiveCallScreen)
        const astrologerData = astrologer ? {
          id: astrologer.user_id,
          user_id: astrologer.user_id,
          full_name: astrologer.full_name || 'Astrologer',
          profile_image: astrologer.profile_image || '',
          call_rate: astrologer.call_rate || 0,
          video_rate: astrologer.video_rate || 0,
          chat_rate: astrologer.chat_rate || 0,
          rating: astrologer.rating || 0,
          skills: astrologer.skills || [],
          is_online: astrologer.is_online || false
        } : null;

        // Build caller object for the receiver to see
        const callerData = caller ? {
          id: caller.user_id,
          user_id: caller.user_id,
          full_name: caller.full_name || callerName || 'Customer',
          profile_image: caller.profile_image || ''
        } : null;

        // Emit incoming call to receiver via socket with all required data
        console.log(`📞 [CALL] Emitting 'incoming_call' to room: user_${receiverRoomId}`);
        io.to(`user_${receiverRoomId}`).emit('incoming_call', {
          // Use snake_case consistently
          session_id: sessionId,
          caller_id: callerId,
          caller_type: callerType,
          call_type: callType,
          caller_name: callerName || caller?.full_name || 'Unknown',
          caller: callerData,
          astrologer: astrologerData,
          rate_per_minute: session.rate_per_minute || astrologer?.call_rate || 0,
          timestamp: new Date()
        });
        console.log(`✅ [CALL] incoming_call event emitted to user_${receiverRoomId}`);

        // Send FCM push notification for incoming call with high priority
        // This triggers flutter_callkit_incoming to show native call UI
        if (receiver?.fcm_token) {
          try {
            const displayName = callerName || caller?.full_name || 'Unknown Caller';
            const message = {
              token: receiver.fcm_token,
              // Use data-only message for CallKit to handle properly
              data: {
                type: 'incoming_call',
                session_id: String(sessionId || ''),
                caller_id: String(callerId || ''),
                caller_name: String(displayName),
                caller_type: String(callerType || 'customer'),
                call_type: String(callType || 'voice'),
                rate_per_minute: String(session?.rate_per_minute || astrologer?.call_rate || 0),
                // Include astrologer data as JSON string for billing
                astrologer: astrologerData ? JSON.stringify(astrologerData) : '',
                // Required fields for flutter_callkit_incoming
                nameCaller: String(displayName),
                appName: 'True Astrotalk',
                handle: String(callerId || ''),
                avatar: '',
                duration: '45000',
                textAccept: 'Accept',
                textDecline: 'Decline',
                missedCallNotification: 'true',
                isVideo: String(callType === 'video')
              },
              android: {
                priority: 'high',
                ttl: 45000, // 45 seconds TTL matching ring duration
                notification: {
                  channelId: 'incoming_calls',
                  priority: 'max',
                  defaultSound: true,
                  defaultVibrateTimings: true,
                  visibility: 'public',
                  title: `Incoming ${callType || 'voice'} call`,
                  body: `${displayName} is calling you`
                }
              },
              apns: {
                payload: {
                  aps: {
                    alert: {
                      title: `Incoming ${callType || 'voice'} call`,
                      body: `${displayName} is calling you`
                    },
                    sound: 'default',
                    badge: 1,
                    'content-available': 1,
                    'mutable-content': 1
                  }
                },
                headers: {
                  'apns-priority': '10',
                  'apns-push-type': 'alert',
                  'apns-expiration': String(Math.floor(Date.now() / 1000) + 45) // 45 seconds
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
        // Support both snake_case and camelCase
        const sessionId = data.session_id || data.sessionId;
        console.log('✅ [CALL] answer_call received:', JSON.stringify(data, null, 2));

        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // IDEMPOTENCY: Atomically update only if session is still in 'ringing' or 'initiated' state
        // This prevents duplicate processing when answer_call is sent multiple times
        const startTime = new Date();
        const result = await db.collection('sessions').findOneAndUpdate(
          {
            _id: new ObjectId(sessionId),
            session_type: { $in: ['voice_call', 'video_call'] },
            status: { $in: ['ringing', 'initiated'] }  // Only update if not already connected
          },
          {
            $set: { status: 'connected', start_time: startTime, updated_at: new Date() }
          },
          { returnDocument: 'after' }
        );

        const session = result;

        if (!session) {
          // Check if session exists but is already connected (duplicate answer_call)
          const existingSession = await db.collection('sessions').findOne({
            _id: new ObjectId(sessionId),
            session_type: { $in: ['voice_call', 'video_call'] }
          });

          if (existingSession && existingSession.status === 'connected') {
            console.log('⚠️ [CALL] answer_call ignored - session already connected (duplicate):', sessionId);
            await client.close();
            return; // Silently ignore duplicate
          }

          console.log('❌ [CALL] Session not found for answer:', sessionId);
          socket.emit('call_error', { session_id: sessionId, error: 'Call session not found' });
          await client.close();
          return;
        }

        await client.close();

        // Find the caller (initiator) to notify them
        const callerId = session.user_id;
        // Strip 'user_' prefix to avoid double prefix in room name
        const callerRoomId = callerId?.startsWith('user_')
          ? callerId.substring(5)
          : callerId;
        console.log(`✅ [CALL] Notifying caller ${callerId} that call was answered`);

        // Emit call_answered to the caller so they can start WebRTC offer
        io.to(`user_${callerRoomId}`).emit('call_answered', {
          session_id: sessionId,
          start_time: startTime
        });

        console.log(`✅ [CALL] call_answered emitted to user_${callerRoomId}`);

      } catch (error) {
        console.error('❌ [CALL] answer_call error:', error);
        socket.emit('call_error', { error: 'Failed to answer call' });
      }
    });

    // Handle call rejection
    socket.on('reject_call', async (data) => {
      try {
        // Support both snake_case and camelCase
        const sessionId = data.session_id || data.sessionId;
        const reason = data.reason;
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
            { $set: { status: 'rejected', end_reason: reason || 'rejected', end_time: new Date(), updated_at: new Date() } }
          );

          // Notify the caller using snake_case
          const callerId = session.user_id;
          // Strip 'user_' prefix to avoid double prefix in room name
          const callerRoomId = callerId?.startsWith('user_')
            ? callerId.substring(5)
            : callerId;
          io.to(`user_${callerRoomId}`).emit('call_rejected', {
            session_id: sessionId,
            reason: reason || 'Call was rejected'
          });
          console.log(`❌ [CALL] call_rejected emitted to user_${callerRoomId}`);
        }

        await client.close();

      } catch (error) {
        console.error('❌ [CALL] reject_call error:', error);
      }
    });

    // Handle call end
    socket.on('end_call', async (data) => {
      try {
        // Support both snake_case and camelCase
        const sessionId = data.session_id || data.sessionId;
        const endedBy = data.ended_by || data.endedBy;
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
            { $set: { status: 'completed', end_time: new Date(), updated_at: new Date() } }
          );

          // Notify both parties using snake_case
          const userId = session.user_id;
          const astrologerId = session.astrologer_id;

          // Strip 'user_' prefix to avoid double prefix in room names
          const userRoomId = userId?.startsWith('user_')
            ? userId.substring(5)
            : userId;
          const astrologerRoomId = astrologerId?.startsWith('user_')
            ? astrologerId.substring(5)
            : astrologerId;

          io.to(`user_${userRoomId}`).emit('call_ended', { session_id: sessionId, ended_by: endedBy });
          io.to(`user_${astrologerRoomId}`).emit('call_ended', { session_id: sessionId, ended_by: endedBy });
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

      // Strip 'user_' prefix to avoid double prefix (user_user_...)
      const targetRoomId = targetUserId?.startsWith('user_')
        ? targetUserId.substring(5)
        : targetUserId;
      console.log(`📤 [WEBRTC] Forwarding offer to user_${targetRoomId}`);

      // Get the sender's user ID from connectedUsers
      const senderInfo = connectedUsers.get(socket.id);
      const fromUserId = senderInfo?.userId;

      io.to(`user_${targetRoomId}`).emit('webrtc_offer', {
        sessionId,
        offer,
        fromUserId
      });
    });

    // Handle WebRTC answer
    socket.on('webrtc_answer', (data) => {
      const { sessionId, targetUserId, answer } = data;

      // Strip 'user_' prefix to avoid double prefix (user_user_...)
      const targetRoomId = targetUserId?.startsWith('user_')
        ? targetUserId.substring(5)
        : targetUserId;
      console.log(`📤 [WEBRTC] Forwarding answer to user_${targetRoomId}`);

      // Get the sender's user ID from connectedUsers
      const senderInfo = connectedUsers.get(socket.id);
      const fromUserId = senderInfo?.userId;

      io.to(`user_${targetRoomId}`).emit('webrtc_answer', {
        sessionId,
        answer,
        fromUserId
      });
    });

    // Handle WebRTC ICE candidate
    socket.on('webrtc_ice_candidate', (data) => {
      const { sessionId, targetUserId, candidate } = data;

      // Strip 'user_' prefix to avoid double prefix (user_user_...)
      const targetRoomId = targetUserId?.startsWith('user_')
        ? targetUserId.substring(5)
        : targetUserId;
      console.log(`🧊 [WEBRTC] Forwarding ICE candidate to user_${targetRoomId}`);

      io.to(`user_${targetRoomId}`).emit('webrtc_ice_candidate', {
        sessionId,
        candidate
      });
    });

    // Handle user joining (legacy - for customers and astrologers)
    socket.on('join_user', (data) => {
      const { userId, userType } = data;
      console.log(`👤 ${userType} ${userId} joined`);

      // Strip 'user_' prefix to avoid double prefix in room name
      const roomId = userId?.startsWith('user_') ? userId.substring(5) : userId;

      // Join user to their personal room
      socket.join(`user_${roomId}`);

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

          socket.emit('chat_initiated', {
            sessionId: existingSession._id.toString(),
            status: existingSession.status,
            message: 'Session already exists',
            astrologerName: astrologer?.full_name || 'Astrologer',
            astrologerAvatar: astrologer?.profile_picture
          });

          // Strip 'user_' prefix to avoid double prefix in room name
          const astrologerRoomId = astrologerId?.startsWith('user_') ? astrologerId.substring(5) : astrologerId;

          // If session is still ringing, re-notify the astrologer (they may have missed it)
          if (existingSession.status === 'ringing') {
            // Re-send incoming_chat via socket
            const incomingChatData = {
              sessionId: existingSession._id.toString(),
              userId: userId,
              userName: user.full_name || 'Customer',
              userAvatar: user.profile_picture,
              chatRate: astrologer.chat_rate || 30,
              timestamp: new Date()
            };
            console.log(`💬 [CHAT] Re-emitting incoming_chat to user_${astrologerRoomId}`);
            io.to(`user_${astrologerRoomId}`).emit('incoming_chat', incomingChatData);

            // Re-send FCM push notification
            if (astrologer?.fcm_token) {
              try {
                const displayName = user.full_name || 'Customer';
                const message = {
                  token: astrologer.fcm_token,
                  data: {
                    type: 'incoming_chat',
                    session_id: String(existingSession._id),
                    user_id: String(userId),
                    user_name: String(displayName),
                    user_avatar: String(user.profile_picture || ''),
                    chat_rate: String(astrologer.chat_rate || 30),
                    timestamp: new Date().toISOString()
                  },
                  android: {
                    priority: 'high',
                    ttl: 60000,
                    notification: {
                      channelId: 'chat_requests',
                      priority: 'high',
                      defaultSound: true,
                      defaultVibrateTimings: true,
                      visibility: 'public',
                      title: 'New Chat Request',
                      body: `${displayName} wants to chat with you`
                    }
                  },
                  apns: {
                    payload: {
                      aps: {
                        alert: {
                          title: 'New Chat Request',
                          body: `${displayName} wants to chat with you`
                        },
                        sound: 'default',
                        badge: 1,
                        'content-available': 1,
                        'mutable-content': 1
                      }
                    },
                    headers: {
                      'apns-priority': '10',
                      'apns-push-type': 'alert'
                    }
                  }
                };

                await admin.messaging().send(message);
                console.log(`📱 [CHAT] FCM re-notification sent to astrologer ${astrologerId}`);
              } catch (fcmError) {
                console.error('❌ [CHAT] FCM re-notification error:', fcmError.message);
              }
            }
          }

          // If session is active, notify astrologer to open chat
          if (existingSession.status === 'active') {
            io.to(`user_${astrologerRoomId}`).emit('chat_resumed', {
              sessionId: existingSession._id.toString(),
              userId: userId,
              userName: user.full_name || 'Customer'
            });
            console.log(`💬 [CHAT] Notified astrologer to resume chat (room: user_${astrologerRoomId})`);
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
        // Strip 'user_' prefix to avoid double prefix in room name
        const astrologerRoomId = astrologerId?.startsWith('user_') ? astrologerId.substring(5) : astrologerId;
        console.log(`💬 [CHAT] Emitting incoming_chat to user_${astrologerRoomId}`);
        io.to(`user_${astrologerRoomId}`).emit('incoming_chat', incomingChatData);

        // Send FCM push notification to astrologer for incoming chat
        // This ensures they receive notification even if app is in background
        if (astrologer?.fcm_token) {
          try {
            const displayName = user.full_name || 'Customer';
            const message = {
              token: astrologer.fcm_token,
              data: {
                type: 'incoming_chat',
                session_id: String(sessionId),
                user_id: String(userId),
                user_name: String(displayName),
                user_avatar: String(user.profile_picture || ''),
                chat_rate: String(astrologer.chat_rate || 30),
                timestamp: new Date().toISOString()
              },
              android: {
                priority: 'high',
                ttl: 60000, // 60 seconds TTL
                notification: {
                  channelId: 'chat_requests',
                  priority: 'high',
                  defaultSound: true,
                  defaultVibrateTimings: true,
                  visibility: 'public',
                  title: 'New Chat Request',
                  body: `${displayName} wants to chat with you`
                }
              },
              apns: {
                payload: {
                  aps: {
                    alert: {
                      title: 'New Chat Request',
                      body: `${displayName} wants to chat with you`
                    },
                    sound: 'default',
                    badge: 1,
                    'content-available': 1,
                    'mutable-content': 1
                  }
                },
                headers: {
                  'apns-priority': '10',
                  'apns-push-type': 'alert'
                }
              }
            };

            await admin.messaging().send(message);
            console.log(`📱 [CHAT] FCM push notification sent to astrologer ${astrologerId}`);
          } catch (fcmError) {
            console.error('❌ [CHAT] FCM notification error:', fcmError.message);
          }
        } else {
          console.log('⚠️ [CHAT] No FCM token for astrologer, push notification not sent');
        }

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

        // Strip 'user_' prefix to avoid double prefix in room name
        const userRoomId = session.user_id?.startsWith('user_') ? session.user_id.substring(5) : session.user_id;
        io.to(`user_${userRoomId}`).emit('chat_accepted', chatAcceptedData);
        socket.emit('chat_accepted', { sessionId, userId: session.user_id });

        console.log(`✅ [CHAT] chat_accepted emitted to user_${userRoomId}`);

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

        // Strip 'user_' prefix to avoid double prefix in room name
        const userRoomId = session.user_id?.startsWith('user_') ? session.user_id.substring(5) : session.user_id;
        io.to(`user_${userRoomId}`).emit('chat_rejected', chatRejectedData);

        // Send confirmation to astrologer (different event name to avoid showing rejection message)
        socket.emit('chat_reject_success', { sessionId, success: true });

        console.log(`❌ [CHAT] chat_rejected emitted to user_${userRoomId}`);

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
        // Strip 'user_' prefix to avoid double prefix in room name
        const userRoomId = session.user_id?.startsWith('user_') ? session.user_id.substring(5) : session.user_id;
        const astrologerRoomId = session.astrologer_id?.startsWith('user_') ? session.astrologer_id.substring(5) : session.astrologer_id;
        io.to(`user_${userRoomId}`).emit('chat_ended', chatEndedData);
        io.to(`user_${astrologerRoomId}`).emit('chat_ended', chatEndedData);

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
        const content = data.content || data.message || '';
        const messageType = data.messageType || data.type || 'text';
        const imageUrl = data.imageUrl || data.image_url || null;
        const senderId = userInfo?.userId || data.senderId;

        // For text messages, content is required. For image messages, imageUrl is required.
        if (!sessionId) {
          socket.emit('chat_error', { error: 'Session ID is required' });
          return;
        }

        if (messageType === 'text' && !content) {
          socket.emit('chat_error', { error: 'Content is required for text messages' });
          return;
        }

        if (messageType === 'image' && !imageUrl) {
          socket.emit('chat_error', { error: 'Image URL is required for image messages' });
          return;
        }

        const logContent = messageType === 'image' ? `[Image: ${imageUrl}]` : content.substring(0, 50);
        console.log(`💬 [CHAT] Message in session ${sessionId} from ${senderId}: ${logContent}...`);

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
          image_url: imageUrl,
          is_read: false,
          timestamp: timestamp.toISOString()
        };

        // Save message to database
        await db.collection('chat_messages').insertOne({
          ...messageData,
          _id: new ObjectId(),
          created_at: timestamp
        });

        // Update session's last message
        const lastMessagePreview = messageType === 'image' ? '📷 Image' : content;
        await db.collection('sessions').updateOne(
          { _id: new ObjectId(sessionId) },
          {
            $set: {
              last_message: lastMessagePreview,
              last_message_time: timestamp,
              updated_at: timestamp
            },
            $inc: {
              [senderType === 'customer' ? 'astrologer_unread_count' : 'user_unread_count']: 1
            }
          }
        );

        await client.close();

        // Emit 'new_message' to chat room (excluding sender to prevent duplicate)
        // Using socket.to() instead of io.to() excludes the sender
        socket.to(`chat_${sessionId}`).emit('new_message', messageData);

        // Send confirmation back to sender with the message data
        // This allows sender to add the message to their UI
        socket.emit('message_sent', {
          sessionId,
          messageId,
          message: messageData,
          timestamp: timestamp.toISOString()
        });

        console.log(`✅ [CHAT] Message sent to chat_${sessionId} (receiver only)`);

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
        // Strip 'user_' prefix to avoid double prefix in room name
        const userRoomId = userId?.startsWith('user_') ? userId.substring(5) : userId;
        io.to(`user_${userRoomId}`).emit('consultation_update', {
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
          // Strip 'user_' prefix to avoid double prefix in room name
          const receiverRoomId = receiverId?.startsWith('user_') ? receiverId.substring(5) : receiverId;
          io.to(`user_${receiverRoomId}`).emit('typing_start', {
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
          // Strip 'user_' prefix to avoid double prefix in room name
          const receiverRoomId = receiverId?.startsWith('user_') ? receiverId.substring(5) : receiverId;
          io.to(`user_${receiverRoomId}`).emit('typing_stop', {
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

      // Strip 'user_' prefix to avoid double prefix in room name
      const userRoomId = userId?.startsWith('user_') ? userId.substring(5) : userId;
      io.to(`user_${userRoomId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
      // Clean up user from connected users map to prevent memory leak
      connectedUsers.delete(socket.id);
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