import 'dart:io';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

/// Test WebRTC call functionality through Socket.IO
void main() async {
  print('📞 Testing WebRTC Call Functionality');
  
  // First, get JWT tokens for two users (astrologer and regular user)
  print('\n1. Getting JWT tokens for both users...');
  final dio = Dio();
  dio.options.baseUrl = 'http://localhost:4000/api';
  
  String? astrologerToken;
  String? userToken;
  Map<String, dynamic>? astrologerUser;
  Map<String, dynamic>? regularUser;
  
  try {
    // Login as astrologer
    final astrologerLogin = await dio.post('/auth/login', data: {
      'email_address': 'astro1@trueastrotalk.com',
      'password': 'Astro243@#\$',
    });
    
    astrologerToken = astrologerLogin.data['data']?['access_token'];
    astrologerUser = astrologerLogin.data['data']?['user'];
    
    print('✅ Astrologer login: ${astrologerUser?['full_name']}');
    
    // Try to login as a regular user (we might need to create one first)
    try {
      final userLogin = await dio.post('/auth/login', data: {
        'email_address': 'user1@trueastrotalk.com',
        'password': 'User123@#\$',
      });
      
      userToken = userLogin.data['data']?['access_token'];
      regularUser = userLogin.data['data']?['user'];
      print('✅ Regular user login: ${regularUser?['full_name']}');
      
    } catch (e) {
      print('⚠️  Regular user login failed, will simulate with astrologer for now');
      userToken = astrologerToken;
      regularUser = astrologerUser;
    }
    
    if (astrologerToken == null || userToken == null) {
      print('❌ Failed to get required tokens');
      exit(1);
    }
    
    // Now test WebRTC call flow
    print('\n2. Setting up Socket.IO connections for both users...');
    
    // Create Socket.IO connections for both users
    final astrologerSocket = socket_io.io('http://localhost:4001', 
      socket_io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableAutoConnect()
        .setAuth({
          'token': astrologerToken,
          'userId': astrologerUser!['_id'] ?? astrologerUser['id'],
          'userType': 'astrologer',
        })
        .build()
    );
    
    final userSocket = socket_io.io('http://localhost:4001', 
      socket_io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableAutoConnect()
        .setAuth({
          'token': userToken,
          'userId': regularUser!['_id'] ?? regularUser['id'],
          'userType': 'user',
        })
        .build()
    );
    
    // Setup event listeners for astrologer
    astrologerSocket.onConnect((_) {
      print('✅ Astrologer socket connected');
    });
    
    astrologerSocket.on('authenticated', (data) {
      print('✅ Astrologer authenticated: \$data');
    });
    
    astrologerSocket.on('incoming_call', (data) {
      print('📞 Astrologer received incoming call: \$data');
      
      // Answer the call after a short delay
      Future.delayed(Duration(seconds: 2), () {
        print('✅ Astrologer answering call...');
        astrologerSocket.emit('answer_call', {
          'callId': data['callId'],
          'sessionId': data['sessionId'],
        });
      });
    });
    
    astrologerSocket.on('call_initiated', (data) {
      print('📞 Call initiated: \$data');
    });
    
    astrologerSocket.on('call_answered', (data) {
      print('✅ Call answered: \$data');
    });
    
    astrologerSocket.on('webrtc_offer', (data) {
      print('📨 Astrologer received WebRTC offer: \$data');
      
      // Send back an answer
      astrologerSocket.emit('webrtc_answer', {
        'sessionId': data['sessionId'],
        'answer': {
          'type': 'answer',
          'sdp': 'v=0\r\no=- 123456789 123456789 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n...'
        },
        'targetUserId': data['fromUserId'],
      });
    });
    
    astrologerSocket.on('webrtc_answer', (data) {
      print('📨 Astrologer received WebRTC answer: \$data');
    });
    
    astrologerSocket.on('webrtc_ice_candidate', (data) {
      print('🧊 Astrologer received ICE candidate: \$data');
    });
    
    // Setup event listeners for user
    userSocket.onConnect((_) {
      print('✅ User socket connected');
    });
    
    userSocket.on('authenticated', (data) {
      print('✅ User authenticated: \$data');
      
      // Start testing call flow after both users are connected
      Future.delayed(Duration(seconds: 2), () {
        if (regularUser != null && astrologerUser != null) {
          testCallFlow(userSocket, astrologerSocket, regularUser!, astrologerUser!);
        }
      });
    });
    
    userSocket.on('call_initiated', (data) {
      print('📞 User call initiated: \$data');
    });
    
    userSocket.on('call_answered', (data) {
      print('✅ User received call answered: \$data');
    });
    
    userSocket.on('webrtc_offer', (data) {
      print('📨 User received WebRTC offer: \$data');
    });
    
    userSocket.on('webrtc_answer', (data) {
      print('📨 User received WebRTC answer: \$data');
    });
    
    userSocket.on('webrtc_ice_candidate', (data) {
      print('🧊 User received ICE candidate: \$data');
    });
    
    // Keep connections alive for testing
    print('⏳ Waiting for call flow to complete...');
    await Future.delayed(const Duration(seconds: 20));
    
    // Cleanup
    astrologerSocket.disconnect();
    userSocket.disconnect();
    print('🔌 Test completed!');
    
  } catch (e) {
    print('❌ Test failed: \$e');
  }
  
  exit(0);
}

void testCallFlow(socket_io.Socket userSocket, socket_io.Socket astrologerSocket, 
                  Map<String, dynamic> user, Map<String, dynamic> astrologer) {
  print('\n3. Testing call initiation flow...');
  
  final sessionId = 'test-session-${DateTime.now().millisecondsSinceEpoch}';
  final astrologerId = astrologer['_id'] ?? astrologer['id'];
  final userId = user['_id'] ?? user['id'];
  
  // Step 1: User initiates a call
  print('📞 User initiating call to astrologer...');
  userSocket.emit('initiate_call', {
    'callType': 'video',
    'sessionId': sessionId,
    'astrologerId': astrologerId,
    'userId': userId,
  });
  
  // Step 2: Send WebRTC offer after call initiation
  Future.delayed(Duration(seconds: 3), () {
    print('📨 User sending WebRTC offer...');
    userSocket.emit('webrtc_offer', {
      'sessionId': sessionId,
      'offer': {
        'type': 'offer',
        'sdp': 'v=0\r\no=- 123456789 123456789 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n...'
      },
      'targetUserId': astrologerId,
    });
  });
  
  // Step 3: Send ICE candidates
  Future.delayed(Duration(seconds: 5), () {
    print('🧊 User sending ICE candidates...');
    userSocket.emit('webrtc_ice_candidate', {
      'sessionId': sessionId,
      'candidate': {
        'candidate': 'candidate:1 1 UDP 2122252543 192.168.1.100 54400 typ host',
        'sdpMLineIndex': 0,
        'sdpMid': 'video'
      },
      'targetUserId': astrologerId,
    });
  });
  
  // Step 4: Test ending the call
  Future.delayed(Duration(seconds: 10), () {
    print('📴 User ending call...');
    userSocket.emit('end_call', {
      'sessionId': sessionId,
      'callId': sessionId,
    });
  });
}