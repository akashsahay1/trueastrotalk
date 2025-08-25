const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Accept connections from all network interfaces
const port = process.env.PORT || 4000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(handler);
  
  // Create Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:4000", "http://192.168.0.124:4000", "https://www.trueastrotalk.com"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle user joining (for customers and astrologers)
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
  });
});