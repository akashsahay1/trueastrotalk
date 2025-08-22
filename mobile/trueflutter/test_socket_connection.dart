import 'dart:io';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

/// Test Socket.IO connection with JWT authentication
void main() async {
  print('🔌 Testing Socket.IO Connection with Authentication');
  
  // First, get a valid JWT token by logging in
  print('\n1. Getting JWT token...');
  final dio = Dio();
  dio.options.baseUrl = 'http://localhost:4000/api';
  
  try {
    final loginResponse = await dio.post('/auth/login', data: {
      'email_address': 'astro1@trueastrotalk.com',
      'password': 'Astro243@#\$',
    });
    
    print('📊 Login response: ${loginResponse.data}');
    
    final token = loginResponse.data['data']?['access_token'];
    final user = loginResponse.data['data']?['user'];
    
    if (token == null || user == null) {
      print('❌ Missing token or user data');
      exit(1);
    }
    
    print('✅ Login successful! User: ${user['full_name']}');
    print('🔑 JWT Token: ${token.toString().substring(0, 20)}...');
    
    // Now test Socket.IO connection
    print('\n2. Testing Socket.IO connection...');
    
    final socket = socket_io.io('http://localhost:4001', 
      socket_io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableAutoConnect()
        .setAuth({
          'token': token,
          'userId': user['_id'],
          'userType': 'astrologer',
        })
        .build()
    );
    
    // Setup event listeners
    socket.onConnect((_) {
      print('✅ Socket connected successfully!');
      
      // Test joining a chat session
      socket.emit('join_chat_session', {
        'sessionId': '676b8b9f2f1b2c3d4e5f6789',
      });
      
      // Test sending a message
      socket.emit('send_message', {
        'sessionId': '676b8b9f2f1b2c3d4e5f6789',
        'content': 'Hello from Dart Socket.IO test!',
        'messageType': 'text',
      });
      
      print('✅ Test events sent!');
    });
    
    socket.onDisconnect((_) {
      print('🔌 Socket disconnected');
    });
    
    socket.onConnectError((error) {
      print('❌ Socket connection error: $error');
    });
    
    socket.on('authenticated', (data) {
      print('✅ Socket authenticated: $data');
    });
    
    socket.on('authentication_error', (data) {
      print('❌ Socket authentication error: $data');
    });
    
    socket.on('new_message', (data) {
      print('📨 New message received: $data');
    });
    
    socket.on('chat_history', (data) {
      final messageCount = data['messages']?.length ?? 0;
      print('📚 Chat history received: $messageCount messages');
    });
    
    // Keep connection alive for testing
    print('⏳ Waiting for connection events...');
    await Future.delayed(const Duration(seconds: 15));
    
    socket.disconnect();
    print('🔌 Test completed!');
    
  } catch (e) {
    print('❌ Test failed: $e');
  }
  
  exit(0);
}