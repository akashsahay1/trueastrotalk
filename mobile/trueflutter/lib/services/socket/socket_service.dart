import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import '../../models/chat.dart';
import '../../models/user.dart';
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
      
      // Socket.IO server URL (use provided or default)
      final socketUrl = serverUrl ?? 'http://localhost:3001';
      
      debugPrint('🔌 Connecting to Socket.IO server: $socketUrl');
      
      // Initialize socket with authentication
      _socket = socket_io.io(socketUrl, 
        socket_io.OptionBuilder()
          .setTransports(['websocket'])
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
      notifyListeners();
    });
    
    _socket!.onDisconnect((_) {
      debugPrint('🔌 Socket disconnected');
      _isConnected = false;
      _isConnecting = false;
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
    
    _socket!.on('session_updated', (data) {
      debugPrint('🔄 Session updated: $data');
      try {
        final session = ChatSession.fromJson(data);
        _sessionUpdateStreamController.add(session);
      } catch (e) {
        debugPrint('❌ Failed to parse session update: $e');
      }
    });
    
    _socket!.on('user_typing', (data) {
      debugPrint('✍️ User typing: $data');
      _typingStreamController.add(data);
    });
    
    _socket!.on('user_stopped_typing', (data) {
      debugPrint('✋ User stopped typing: $data');
      _typingStreamController.add(data);
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
    
    _socket!.emit('join_chat', {
      'chatSessionId': chatSessionId,
      'userId': _currentUser!.id,
      'userType': 'user',
    });
  }

  /// Leave current chat session room
  Future<void> leaveChatSession() async {
    if (!_isConnected || _socket == null || _currentChatSessionId == null) {
      return;
    }
    
    debugPrint('🚪 Leaving chat session: $_currentChatSessionId');
    
    _socket!.emit('leave_chat', {
      'chatSessionId': _currentChatSessionId,
      'userId': _currentUser!.id,
    });
    
    _currentChatSessionId = null;
  }

  /// Send a text message
  Future<void> sendMessage(String chatSessionId, String content) async {
    if (!_isConnected || _socket == null) {
      throw Exception('Socket not connected');
    }
    
    debugPrint('💬 Sending message: $content');
    
    final messageData = {
      'chatSessionId': chatSessionId,
      'senderId': _currentUser!.id,
      'senderName': _currentUser!.name,
      'senderType': 'user',
      'type': 'text',
      'content': content,
      'timestamp': DateTime.now().toIso8601String(),
    };
    
    _socket!.emit('send_message', messageData);
  }

  /// Send typing indicator
  Future<void> sendTyping(String chatSessionId, bool isTyping) async {
    if (!_isConnected || _socket == null) return;
    
    final typingData = {
      'chatSessionId': chatSessionId,
      'userId': _currentUser!.id,
      'userName': _currentUser!.name,
      'userType': 'user',
      'isTyping': isTyping,
    };
    
    _socket!.emit(isTyping ? 'typing' : 'stop_typing', typingData);
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
      'chatSessionId': chatSessionId,
      'messageIds': messageIds,
      'userId': _currentUser!.id,
    });
  }

  /// Disconnect socket
  Future<void> disconnect() async {
    debugPrint('🔌 Disconnecting socket');
    
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

  /// Cleanup resources
  @override
  void dispose() {
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