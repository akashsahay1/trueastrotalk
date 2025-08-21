import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

// Connected users storage
const connectedUsers = new Map<string, {
  socketId: string;
  userId: string;
  userType: 'user' | 'astrologer';
  isOnline: boolean;
}>();

// Active calls storage
const activeCalls = new Map<string, {
  sessionId: string;
  userId: string;
  astrologerId: string;
  status: 'ringing' | 'active';
  startTime?: Date;
}>();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new ServerIO(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        try {
          const { userId, userType, token } = data;
          
          // Verify user token here if needed
          // For now, we'll trust the client-side authentication
          
          // Store user connection
          connectedUsers.set(socket.id, {
            socketId: socket.id,
            userId: userId,
            userType: userType,
            isOnline: true
          });

          // Join user to their personal room
          socket.join(`user_${userId}`);
          
          // Join astrologers to astrologer room
          if (userType === 'astrologer') {
            socket.join('astrologers');
            
            // Update astrologer online status in database
            const client = new MongoClient(MONGODB_URL);
            await client.connect();
            const db = client.db(DB_NAME);
            await db.collection('astrologers').updateOne(
              { _id: new ObjectId(userId) },
              { $set: { is_online: true, last_seen: new Date() } }
            );
            await client.close();
          }

          socket.emit('authenticated', { success: true, userId, userType });
          console.log(`User ${userId} (${userType}) authenticated`);

        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', { error: 'Authentication failed' });
        }
      });

      // Handle chat message sending
      socket.on('send_message', async (data) => {
        try {
          const { sessionId, senderId, senderName, senderType, messageType, content, imageUrl } = data;
          
          const client = new MongoClient(MONGODB_URL);
          await client.connect();
          const db = client.db(DB_NAME);
          
          // Get session details
          const session = await db.collection('chat_sessions').findOne({ _id: new ObjectId(sessionId) });
          if (!session) {
            socket.emit('message_error', { error: 'Session not found' });
            await client.close();
            return;
          }

          // Create message
          const messageData = {
            session_id: sessionId,
            sender_id: senderId,
            sender_name: senderName,
            sender_type: senderType,
            message_type: messageType || 'text',
            content: content || '',
            image_url: imageUrl || null,
            read_by_user: senderType === 'user',
            read_by_astrologer: senderType === 'astrologer',
            timestamp: new Date(),
            created_at: new Date()
          };

          const result = await db.collection('chat_messages').insertOne(messageData);
          
          // Update session
          const updateData: Record<string, unknown> = {
            last_message: content || '[Image]',
            last_message_time: new Date(),
            updated_at: new Date()
          };

          if (senderType === 'user') {
            updateData.$inc = { astrologer_unread_count: 1 };
          } else {
            updateData.$inc = { user_unread_count: 1 };
          }

          await db.collection('chat_sessions').updateOne(
            { _id: new ObjectId(sessionId) },
            updateData.$inc ? 
              { $set: { ...updateData, $inc: undefined }, $inc: updateData.$inc } :
              { $set: updateData }
          );

          await client.close();

          // Format message for broadcast
          const formattedMessage = {
            _id: result.insertedId.toString(),
            session_id: sessionId,
            sender_id: senderId,
            sender_name: senderName,
            sender_type: senderType,
            message_type: messageType,
            content: content,
            image_url: imageUrl,
            read_by_user: messageData.read_by_user,
            read_by_astrologer: messageData.read_by_astrologer,
            timestamp: messageData.timestamp
          };

          // Send to session participants
          io.to(`user_${session.user_id}`).emit('new_message', formattedMessage);
          io.to(`user_${session.astrologer_id}`).emit('new_message', formattedMessage);

        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      // Handle incoming call
      socket.on('initiate_call', async (data) => {
        try {
          const { sessionId, callerId, callerType, callType } = data;
          
          const client = new MongoClient(MONGODB_URL);
          await client.connect();
          const db = client.db(DB_NAME);
          
          // Get call session
          const session = await db.collection('call_sessions').findOne({ _id: new ObjectId(sessionId) });
          if (!session) {
            socket.emit('call_error', { error: 'Call session not found' });
            await client.close();
            return;
          }

          // Update call status to ringing
          await db.collection('call_sessions').updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { status: 'ringing', updated_at: new Date() } }
          );

          await client.close();

          // Store active call
          activeCalls.set(sessionId, {
            sessionId,
            userId: session.user_id,
            astrologerId: session.astrologer_id,
            status: 'ringing'
          });

          // Determine receiver
          const receiverId = callerType === 'user' ? session.astrologer_id : session.user_id;
          
          // Send call notification to receiver
          io.to(`user_${receiverId}`).emit('incoming_call', {
            sessionId,
            callerId,
            callerType,
            callType,
            callerName: callerType === 'user' ? 'User' : 'Astrologer',
            timestamp: new Date()
          });

          socket.emit('call_initiated', { sessionId, status: 'ringing' });

        } catch (error) {
          console.error('Initiate call error:', error);
          socket.emit('call_error', { error: 'Failed to initiate call' });
        }
      });

      // Handle call answer
      socket.on('answer_call', async (data) => {
        try {
          const { sessionId, userId } = data;
          
          const call = activeCalls.get(sessionId);
          if (!call) {
            socket.emit('call_error', { error: 'Call session not found' });
            return;
          }

          // Update call status in database
          const client = new MongoClient(MONGODB_URL);
          await client.connect();
          const db = client.db(DB_NAME);
          
          await db.collection('call_sessions').updateOne(
            { _id: new ObjectId(sessionId) },
            { 
              $set: { 
                status: 'active',
                start_time: new Date(),
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
      });

      // Handle call rejection
      socket.on('reject_call', async (data) => {
        try {
          const { sessionId, userId } = data;
          
          const call = activeCalls.get(sessionId);
          if (!call) {
            socket.emit('call_error', { error: 'Call session not found' });
            return;
          }

          // Update call status in database
          const client = new MongoClient(MONGODB_URL);
          await client.connect();
          const db = client.db(DB_NAME);
          
          await db.collection('call_sessions').updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { status: 'rejected', updated_at: new Date() } }
          );

          await client.close();

          // Remove from active calls
          activeCalls.delete(sessionId);

          // Notify both participants
          io.to(`user_${call.userId}`).emit('call_rejected', { sessionId });
          io.to(`user_${call.astrologerId}`).emit('call_rejected', { sessionId });

        } catch (error) {
          console.error('Reject call error:', error);
          socket.emit('call_error', { error: 'Failed to reject call' });
        }
      });

      // Handle call end
      socket.on('end_call', async (data) => {
        try {
          const { sessionId, userId } = data;
          
          const call = activeCalls.get(sessionId);
          if (!call) {
            socket.emit('call_error', { error: 'Call session not found' });
            return;
          }

          // Calculate duration and billing if call was active
          if (call.status === 'active' && call.startTime) {
            const endTime = new Date();
            const durationMs = endTime.getTime() - call.startTime.getTime();
            const durationMinutes = Math.ceil(durationMs / (1000 * 60));

            const client = new MongoClient(MONGODB_URL);
            await client.connect();
            const db = client.db(DB_NAME);
            
            const session = await db.collection('call_sessions').findOne({ _id: new ObjectId(sessionId) });
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

            await client.close();
          }

          // Remove from active calls
          activeCalls.delete(sessionId);

          // Notify both participants
          io.to(`user_${call.userId}`).emit('call_ended', { sessionId });
          io.to(`user_${call.astrologerId}`).emit('call_ended', { sessionId });

        } catch (error) {
          console.error('End call error:', error);
          socket.emit('call_error', { error: 'Failed to end call' });
        }
      });

      // Handle WebRTC signaling
      socket.on('webrtc_offer', (data) => {
        const { sessionId, offer, targetUserId } = data;
        io.to(`user_${targetUserId}`).emit('webrtc_offer', { sessionId, offer });
      });

      socket.on('webrtc_answer', (data) => {
        const { sessionId, answer, targetUserId } = data;
        io.to(`user_${targetUserId}`).emit('webrtc_answer', { sessionId, answer });
      });

      socket.on('webrtc_ice_candidate', (data) => {
        const { sessionId, candidate, targetUserId } = data;
        io.to(`user_${targetUserId}`).emit('webrtc_ice_candidate', { sessionId, candidate });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          // Update astrologer offline status
          if (userInfo.userType === 'astrologer') {
            try {
              const client = new MongoClient(MONGODB_URL);
              await client.connect();
              const db = client.db(DB_NAME);
              await db.collection('astrologers').updateOne(
                { _id: new ObjectId(userInfo.userId) },
                { $set: { is_online: false, last_seen: new Date() } }
              );
              await client.close();
            } catch (error) {
              console.error('Error updating astrologer offline status:', error);
            }
          }

          // Remove from connected users
          connectedUsers.delete(socket.id);
        }
      });
    });
  }
  res.end();
}