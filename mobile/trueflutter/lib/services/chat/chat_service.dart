import 'package:flutter/foundation.dart';
import '../../models/chat.dart';
import '../../models/enums.dart';
import '../api/chat_api_service.dart';
import '../auth/auth_service.dart';
import '../socket/socket_service.dart';
import '../service_locator.dart';

class ChatService extends ChangeNotifier {
  static ChatService? _instance;
  static ChatService get instance => _instance ??= ChatService._();
  
  ChatService._();

  final ChatApiService _chatApiService = getIt<ChatApiService>();
  final SocketService _socketService = SocketService.instance;
  
  // Current chat sessions and messages
  List<ChatSession> _chatSessions = [];
  final Map<String, List<ChatMessage>> _messagesBySession = {};
  ChatSession? _activeChatSession;
  
  // Getters
  List<ChatSession> get chatSessions => List.unmodifiable(_chatSessions);
  ChatSession? get activeChatSession => _activeChatSession;
  
  List<ChatMessage> getMessagesForSession(String sessionId) {
    return _messagesBySession[sessionId] ?? [];
  }

  /// Initialize chat service
  Future<void> initialize() async {
    try {
      debugPrint('🚀 Initializing ChatService');

      // Ensure socket is connected with retry logic
      await _socketService.ensureConnected(maxRetries: 3);

      // Listen to socket events
      _setupSocketListeners();

      // Load existing chat sessions
      await loadChatSessions();

    } catch (e) {
      debugPrint('❌ Failed to initialize ChatService: $e');
      rethrow;
    }
  }

  /// Setup socket event listeners
  void _setupSocketListeners() {
    // Listen for new messages
    _socketService.messageStream.listen((message) {
      _handleNewMessage(message);
    });

    // Listen for session updates
    _socketService.sessionUpdateStream.listen((session) {
      _handleSessionUpdate(session);
    });

    // Listen for incoming chat requests (for astrologers)
    _socketService.incomingChatStream.listen((data) {
      _handleIncomingChat(data);
    });

    // Listen for chat accepted (for customers)
    _socketService.chatAcceptedStream.listen((data) {
      _handleChatAccepted(data);
    });

    // Listen for chat rejected (for customers)
    _socketService.chatRejectedStream.listen((data) {
      _handleChatRejected(data);
    });
  }

  /// Handle incoming chat request (for astrologers)
  void _handleIncomingChat(Map<String, dynamic> data) {
    debugPrint('💬 Handling incoming chat: $data');
    // This will be handled by the notification service to show incoming chat UI
    notifyListeners();
  }

  /// Handle chat accepted (for customers)
  void _handleChatAccepted(Map<String, dynamic> data) {
    debugPrint('✅ Chat accepted: $data');
    final sessionId = data['sessionId']?.toString();
    if (sessionId != null && _activeChatSession?.id == sessionId) {
      // Update session status if needed
      notifyListeners();
    }
  }

  /// Handle chat rejected (for customers)
  void _handleChatRejected(Map<String, dynamic> data) {
    debugPrint('❌ Chat rejected: $data');
    final sessionId = data['sessionId']?.toString();
    if (sessionId != null) {
      // Update session status
      final index = _chatSessions.indexWhere((s) => s.id == sessionId);
      if (index != -1) {
        // Session was rejected, remove from active
        if (_activeChatSession?.id == sessionId) {
          _activeChatSession = null;
        }
      }
      notifyListeners();
    }
  }

  /// Handle new incoming message
  void _handleNewMessage(ChatMessage message) {
    debugPrint('📨 Handling new message: ${message.content}');
    
    // Add message to the appropriate session
    final sessionId = message.chatSessionId;
    if (!_messagesBySession.containsKey(sessionId)) {
      _messagesBySession[sessionId] = [];
    }
    
    _messagesBySession[sessionId]!.add(message);
    
    // Update last message in session
    final sessionIndex = _chatSessions.indexWhere((s) => s.id == sessionId);
    if (sessionIndex != -1) {
      // Note: In a real implementation, you would update the session with the new last message
      // For now, we'll just notify listeners
      notifyListeners();
    }
    
    notifyListeners();
  }

  /// Handle session updates
  void _handleSessionUpdate(ChatSession session) {
    debugPrint('🔄 Handling session update: ${session.id}');
    
    final index = _chatSessions.indexWhere((s) => s.id == session.id);
    if (index != -1) {
      _chatSessions[index] = session;
    } else {
      _chatSessions.insert(0, session);
    }
    
    // Update active session if it matches
    if (_activeChatSession?.id == session.id) {
      _activeChatSession = session;
    }
    
    notifyListeners();
  }

  /// Load chat sessions from API
  Future<void> loadChatSessions() async {
    try {
      debugPrint('📋 Loading chat sessions');
      
      // Get current user ID (you should get this from your auth service)
      final userId = _getCurrentUserId();
      if (userId == null) {
        debugPrint('⚠️ No user ID found, cannot load chat sessions');
        _chatSessions = [];
        notifyListeners();
        return;
      }

      // Use actual user role instead of hardcoded value
      final authService = getIt<AuthService>();
      final userType = authService.currentUser?.role.value ?? 'customer';
      final result = await _chatApiService.getChatSessions(
        userId: userId,
        userType: userType,
      );
      
      if (result['success']) {
        _chatSessions = result['chat_sessions'];
        debugPrint('✅ Loaded ${_chatSessions.length} chat sessions');
      } else {
        debugPrint('❌ Failed to load chat sessions: ${result['error']}');
        _chatSessions = [];
      }
      
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Failed to load chat sessions: $e');
      _chatSessions = [];
      notifyListeners();
    }
  }

  /// Start a new chat session with an astrologer
  /// This initiates a chat request that the astrologer must accept
  Future<ChatSession> startChatSession(String astrologerId) async {
    try {
      debugPrint('🎯 Starting chat session with astrologer: $astrologerId');

      // Ensure socket is connected before starting chat
      if (!_socketService.isConnected) {
        debugPrint('🔌 Socket not connected, attempting to connect...');
        await _socketService.ensureConnected(maxRetries: 3);
      }

      final userId = _getCurrentUserId();
      if (userId == null) {
        throw Exception('User not logged in');
      }

      // First, create the session via API (validates wallet balance, astrologer availability, etc.)
      final result = await _chatApiService.createChatSession(
        userId: userId,
        astrologerId: astrologerId,
      );

      if (result['success']) {
        final session = result['session'] as ChatSession;
        debugPrint('💬 [CHAT] Session created successfully: ${session.id}');

        // Add to sessions list
        _chatSessions.insert(0, session);
        _activeChatSession = session;

        // Emit initiate_chat via socket to notify astrologer (like calls do)
        debugPrint('💬 [CHAT] Emitting initiate_chat via socket');
        debugPrint('💬 [CHAT] Socket connected: ${_socketService.isConnected}');
        await _socketService.initiateChatSession(astrologerId);
        debugPrint('💬 [CHAT] Socket event emitted successfully');

        notifyListeners();
        return session;
      } else {
        throw Exception(result['error'] ?? 'Failed to create chat session');
      }

    } catch (e) {
      debugPrint('❌ Failed to start chat session: $e');
      rethrow;
    }
  }

  /// Send a message in the current chat session
  Future<void> sendMessage(String sessionId, String content) async {
    try {
      if (content.trim().isEmpty) return;
      
      debugPrint('💬 Sending message: $content');
      
      // Send via socket
      await _socketService.sendMessage(sessionId, content);
      
    } catch (e) {
      debugPrint('❌ Failed to send message: $e');
      rethrow;
    }
  }

  /// Join a chat session (set as active and join socket room)
  Future<void> joinChatSession(String sessionId, {ChatSession? session}) async {
    try {
      debugPrint('🏠 Joining chat session: $sessionId');

      // Try to find the session in local list, or use provided session
      ChatSession? foundSession;
      try {
        foundSession = _chatSessions.firstWhere((s) => s.id == sessionId);
      } catch (_) {
        // Not found in local list
        foundSession = session;
      }

      if (foundSession != null) {
        _activeChatSession = foundSession;
        // Add to local list if not already there
        if (!_chatSessions.any((s) => s.id == sessionId)) {
          _chatSessions.insert(0, foundSession);
        }
      }

      // Join socket room
      await _socketService.joinChatSession(sessionId);

      // Load messages for this session if not already loaded
      if (!_messagesBySession.containsKey(sessionId)) {
        await loadMessagesForSession(sessionId);
      }

      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to join chat session: $e');
      rethrow;
    }
  }

  /// Leave the current chat session
  Future<void> leaveChatSession() async {
    try {
      debugPrint('🚪 Leaving chat session');
      
      // Leave socket room
      await _socketService.leaveChatSession();
      
      _activeChatSession = null;
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to leave chat session: $e');
    }
  }

  /// End a chat session
  Future<void> endChatSession(String sessionId) async {
    try {
      debugPrint('🔚 Ending chat session: $sessionId');

      // End via socket
      await _socketService.endChatSession(sessionId);

      // Update local session status
      final index = _chatSessions.indexWhere((s) => s.id == sessionId);
      if (index != -1) {
        // Note: In a real implementation, you would update the session status
        // For now, we'll just leave it as is
      }

      // Leave if it's the active session
      if (_activeChatSession?.id == sessionId) {
        await leaveChatSession();
      }

    } catch (e) {
      debugPrint('❌ Failed to end chat session: $e');
      rethrow;
    }
  }

  /// Accept an incoming chat session (for astrologers)
  Future<void> acceptChatSession(String sessionId) async {
    try {
      debugPrint('✅ Accepting chat session: $sessionId');

      // Accept via socket
      await _socketService.acceptChatSession(sessionId);

      // Join the chat room
      await _socketService.joinChatSession(sessionId);

      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to accept chat session: $e');
      rethrow;
    }
  }

  /// Reject an incoming chat session (for astrologers)
  Future<void> rejectChatSession(String sessionId, {String reason = 'busy'}) async {
    try {
      debugPrint('❌ Rejecting chat session: $sessionId');

      // Reject via socket
      await _socketService.rejectChatSession(sessionId, reason: reason);

      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to reject chat session: $e');
      rethrow;
    }
  }

  /// Load messages for a specific session
  Future<void> loadMessagesForSession(String sessionId) async {
    try {
      debugPrint('📨 Loading messages for session: $sessionId');
      
      final userId = _getCurrentUserId();
      
      // Get actual user type from auth service
      final authService = getIt<AuthService>();
      final userType = authService.currentUser?.role.value ?? 'customer';

      final result = await _chatApiService.getMessages(
        sessionId: sessionId,
        userId: userId,
        userType: userType,
      );
      
      if (result['success']) {
        _messagesBySession[sessionId] = result['messages'];
        debugPrint('✅ Loaded ${result['messages'].length} messages for session $sessionId');
      } else {
        debugPrint('❌ Failed to load messages: ${result['error']}');
        _messagesBySession[sessionId] = [];
      }
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to load messages: $e');
      _messagesBySession[sessionId] = [];
      notifyListeners();
    }
  }

  /// Send typing indicator
  Future<void> sendTyping(String sessionId, bool isTyping) async {
    await _socketService.sendTyping(sessionId, isTyping);
  }

  /// Mark messages as read
  Future<void> markMessagesAsRead(String sessionId, List<String> messageIds) async {
    await _socketService.markMessagesAsRead(sessionId, messageIds);
    notifyListeners();
  }

  /// Get current user ID from auth service
  String? _getCurrentUserId() {
    try {
      final authService = getIt<AuthService>();
      return authService.currentUser?.id;
    } catch (e) {
      debugPrint('❌ Error getting current user ID: $e');
      return null;
    }
  }

  /// Cleanup
  @override
  void dispose() {
    _socketService.disconnect();
    super.dispose();
  }
}