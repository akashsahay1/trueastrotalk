import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import '../../models/chat.dart';
import '../../models/user.dart';
import '../../config/config.dart';
import '../service_locator.dart';
import '../local/local_storage_service.dart';

class SocketService extends ChangeNotifier {
  static SocketService? _instance;
  static SocketService get instance => _instance ??= SocketService._();
  
  SocketService._();

  socket_io.Socket? _socket;
  final LocalStorageService _localStorage = getIt<LocalStorageService>();
  
  // Connection state
  bool _isConnected = false;
  bool _isConnecting = false;
  String? _currentChatSessionId;
  User? _currentUser;
  
  // Activity tracking
  Timer? _heartbeatTimer;
  DateTime _lastActivity = DateTime.now();
  static const int _heartbeatIntervalSeconds = 30; // Send heartbeat every 30 seconds
  
  // Stream controllers for real-time data
  final StreamController<ChatMessage> _messageStreamController = 
      StreamController<ChatMessage>.broadcast();
  final StreamController<ChatSession> _sessionUpdateStreamController = 
      StreamController<ChatSession>.broadcast();
  final StreamController<bool> _connectionStreamController = 
      StreamController<bool>.broadcast();
  final StreamController<Map<String, dynamic>> _typingStreamController = 
      StreamController<Map<String, dynamic>>.broadcast();

  // Getters
  bool get isConnected => _isConnected;
  bool get isConnecting => _isConnecting;
  String? get currentChatSessionId => _currentChatSessionId;
  
  // Streams
  Stream<ChatMessage> get messageStream => _messageStreamController.stream;
  Stream<ChatSession> get sessionUpdateStream => _sessionUpdateStreamController.stream;
  Stream<bool> get connectionStream => _connectionStreamController.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingStreamController.stream;

  /// Initialize socket connection
  Future<void> connect({String? serverUrl}) async {
    if (_isConnected || _isConnecting) return;
    
    _isConnecting = true;
    notifyListeners();
    
    try {
      // Get auth token and user info
      final authToken = await _localStorage.getAuthToken();
      final userMap = _localStorage.getUserMap();
      if (userMap != null) {
        _currentUser = User.fromJson(userMap);
      }
      
      if (authToken == null || _currentUser == null) {
        throw Exception('User not authenticated');
      }
      
      // Socket.IO server URL (use provided or from config)
      final socketUrl = serverUrl ?? await Config.socketUrl;
      
      debugPrint('🔌 Connecting to Socket.IO server: $socketUrl');
      
      // Initialize socket with authentication
      _socket = socket_io.io(socketUrl, 
        socket_io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .setAuth({
            'token': authToken,
            'userId': _currentUser!.id,
            'userType': 'user',
          })
          .build()
      );
      
      // Setup event listeners
      _setupEventListeners();
      
    } catch (e) {
      _isConnecting = false;
      debugPrint('❌ Socket connection failed: $e');
      notifyListeners();
      rethrow;
    }
  }

  /// Setup socket event listeners
  void _setupEventListeners() {
    if (_socket == null) return;
    
    // Connection events
    _socket!.onConnect((_) {
      debugPrint('✅ Socket connected successfully');
      _isConnected = true;
      _isConnecting = false;
      _connectionStreamController.add(true);
      _startHeartbeat();
      notifyListeners();
    });
    
    _socket!.onDisconnect((_) {
      debugPrint('🔌 Socket disconnected');
      _isConnected = false;
      _isConnecting = false;
      _stopHeartbeat();
      _connectionStreamController.add(false);
      notifyListeners();
    });
    
    _socket!.onConnectError((error) {
      debugPrint('❌ Socket connection error: $error');
      _isConnected = false;
      _isConnecting = false;
      _connectionStreamController.add(false);
      notifyListeners();
    });
    
    // Authentication events
    _socket!.on('authenticated', (data) {
      debugPrint('✅ Socket authenticated: $data');
    });
    
    _socket!.on('authentication_error', (data) {
      debugPrint('❌ Socket authentication error: $data');
    });

    // Chat events
    _socket!.on('new_message', (data) {
      debugPrint('📨 Received new message: $data');
      try {
        final message = ChatMessage.fromJson(data);
        _messageStreamController.add(message);
      } catch (e) {
        debugPrint('❌ Failed to parse message: $e');
      }
    });
    
    _socket!.on('chat_history', (data) {
      debugPrint('📚 Received chat history: ${data['messages']?.length ?? 0} messages');
    });
    
    _socket!.on('typing_start', (data) {
      debugPrint('✍️ User typing: $data');
      _typingStreamController.add({...data, 'isTyping': true});
    });
    
    _socket!.on('typing_stop', (data) {
      debugPrint('✋ User stopped typing: $data');
      _typingStreamController.add({...data, 'isTyping': false});
    });
    
    _socket!.on('messages_read', (data) {
      debugPrint('👁️ Messages marked as read: $data');
    });
    
    // WebRTC Call events
    _socket!.on('incoming_call', (data) {
      debugPrint('📞 Incoming call: $data');
    });
    
    _socket!.on('call_initiated', (data) {
      debugPrint('📞 Call initiated: $data');
    });
    
    _socket!.on('call_answered', (data) {
      debugPrint('✅ Call answered: $data');
    });
    
    _socket!.on('call_rejected', (data) {
      debugPrint('❌ Call rejected: $data');
    });
    
    _socket!.on('call_ended', (data) {
      debugPrint('📴 Call ended: $data');
    });
    
    // WebRTC Signaling events
    _socket!.on('webrtc_offer', (data) {
      debugPrint('📨 WebRTC offer received: $data');
    });
    
    _socket!.on('webrtc_answer', (data) {
      debugPrint('📨 WebRTC answer received: $data');
    });
    
    _socket!.on('webrtc_ice_candidate', (data) {
      debugPrint('🧊 ICE candidate received: $data');
    });
    
    // Presence events
    _socket!.on('user_online', (data) {
      debugPrint('🟢 User online: $data');
    });
    
    _socket!.on('user_offline', (data) {
      debugPrint('🔴 User offline: $data');
    });
    
    // Error events
    _socket!.on('error', (error) {
      debugPrint('❌ Socket error: $error');
    });
  }

  /// Join a chat session room
  Future<void> joinChatSession(String chatSessionId) async {
    if (!_isConnected || _socket == null) {
      throw Exception('Socket not connected');
    }
    
    debugPrint('🏠 Joining chat session: $chatSessionId');
    _currentChatSessionId = chatSessionId;
    
    _socket!.emit('join_chat_session', {
      'sessionId': chatSessionId,
    });
  }

  /// Leave current chat session room
  Future<void> leaveChatSession() async {
    if (!_isConnected || _socket == null || _currentChatSessionId == null) {
      return;
    }
    
    debugPrint('🚪 Leaving chat session: $_currentChatSessionId');
    
    _socket!.emit('leave_chat_session', {
      'sessionId': _currentChatSessionId,
    });
    
    _currentChatSessionId = null;
  }

  /// Send a text message
  Future<void> sendMessage(String chatSessionId, String content, {String messageType = 'text', String? imageUrl, String? voiceUrl}) async {
    if (!_isConnected || _socket == null) {
      throw Exception('Socket not connected');
    }
    
    debugPrint('💬 Sending message: $content');
    
    final messageData = {
      'sessionId': chatSessionId,
      'content': content,
      'messageType': messageType,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (voiceUrl != null) 'voiceUrl': voiceUrl,
    };
    
    _socket!.emit('send_message', messageData);
  }

  /// Send typing indicator
  Future<void> sendTyping(String chatSessionId, bool isTyping) async {
    if (!_isConnected || _socket == null) return;
    
    final typingData = {
      'sessionId': chatSessionId,
    };
    
    _socket!.emit(isTyping ? 'typing_start' : 'typing_stop', typingData);
  }

  /// Start a new chat session
  Future<void> startChatSession(String astrologerId) async {
    if (!_isConnected || _socket == null) {
      throw Exception('Socket not connected');
    }
    
    debugPrint('🎯 Starting new chat session with astrologer: $astrologerId');
    
    _socket!.emit('start_chat_session', {
      'userId': _currentUser!.id,
      'astrologerId': astrologerId,
      'sessionType': 'chat',
    });
  }

  /// End current chat session
  Future<void> endChatSession(String chatSessionId) async {
    if (!_isConnected || _socket == null) {
      throw Exception('Socket not connected');
    }
    
    debugPrint('🔚 Ending chat session: $chatSessionId');
    
    _socket!.emit('end_chat_session', {
      'chatSessionId': chatSessionId,
      'userId': _currentUser!.id,
    });
  }

  /// Mark messages as read
  Future<void> markMessagesAsRead(String chatSessionId, List<String> messageIds) async {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('mark_messages_read', {
      'sessionId': chatSessionId,
      'messageIds': messageIds,
    });
  }

  /// Disconnect socket
  Future<void> disconnect() async {
    debugPrint('🔌 Disconnecting socket');
    
    _stopHeartbeat();
    await leaveChatSession();
    
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    
    _isConnected = false;
    _isConnecting = false;
    _currentChatSessionId = null;
    _currentUser = null;
    
    notifyListeners();
  }

  /// Start heartbeat to maintain connection and track activity
  void _startHeartbeat() {
    _stopHeartbeat(); // Stop any existing timer
    
    _heartbeatTimer = Timer.periodic(Duration(seconds: _heartbeatIntervalSeconds), (timer) {
      if (_isConnected && _socket != null) {
        _lastActivity = DateTime.now();
        _socket!.emit('heartbeat', {
          'timestamp': _lastActivity.millisecondsSinceEpoch,
          'userId': _currentUser?.id,
        });
        debugPrint('💓 Heartbeat sent');
      } else {
        _stopHeartbeat();
      }
    });
  }

  /// Stop heartbeat timer
  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  /// Update activity timestamp (call this when user performs any action)
  void updateActivity() {
    _lastActivity = DateTime.now();
  }

  /// Cleanup resources
  @override
  void dispose() {
    _stopHeartbeat();
    disconnect();
    _messageStreamController.close();
    _sessionUpdateStreamController.close();
    _connectionStreamController.close();
    _typingStreamController.close();
    super.dispose();
  }

  /// Reconnect socket
  Future<void> reconnect() async {
    await disconnect();
    await Future.delayed(const Duration(seconds: 2));
    await connect();
  }

  /// Get connection status message
  String get connectionStatusMessage {
    if (_isConnecting) return 'Connecting...';
    if (_isConnected) return 'Connected';
    return 'Disconnected';
  }

  /// Emit socket event (for use by other services)
  void emit(String event, dynamic data) {
    if (_socket != null && _isConnected) {
      _socket!.emit(event, data);
    }
  }

  /// Listen to socket event (for use by other services)
  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  /// Remove socket event listener (for use by other services)
  void off(String event) {
    _socket?.off(event);
  }
}