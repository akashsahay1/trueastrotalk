// Socket.IO Test Script
// Use this in browser console to test Socket.IO connection

function testSocketConnection() {
  console.log('🔌 Testing Socket.IO connection...');
  
  const socket = io('https://trueastrotalk.com', {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    forceNew: true,
    auth: {
      test: true  // This enables test mode authentication
    }
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected successfully!');
    console.log('Socket ID:', socket.id);
  });

  socket.on('authenticated', (data) => {
    console.log('🔐 Authentication successful:', data);
  });

  socket.on('test-response', (data) => {
    console.log('📥 Test response received:', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.log('❌ Socket.IO connection error:', error);
  });

  // Test emitting a message
  setTimeout(() => {
    if (socket.connected) {
      socket.emit('test-message', { message: 'Hello from admin panel!' });
      console.log('📤 Test message sent');
    }
  }, 2000);

  return socket;
}

// Auto-test when this script is loaded
if (typeof io !== 'undefined') {
  console.log('Socket.IO client library loaded');
  // Uncomment the line below to auto-test on page load
  // testSocketConnection();
} else {
  console.log('❌ Socket.IO client library not loaded');
}