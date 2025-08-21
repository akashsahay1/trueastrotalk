import 'package:flutter/foundation.dart';
import '../../models/chat.dart';
// import '../api/user_api_service.dart'; // TODO: Uncomment when implementing real API
import '../socket/socket_service.dart';
// import '../service_locator.dart'; // TODO: Uncomment when needed

class ChatService extends ChangeNotifier {
  static ChatService? _instance;
  static ChatService get instance => _instance ??= ChatService._();
  
  ChatService._();

  // final UserApiService _apiService = getIt<UserApiService>(); // TODO: Will be used for real API calls
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
      
      // Connect to socket service
      await _socketService.connect();
      
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
      
      // TODO: Call actual API endpoint
      // final sessions = await _apiService.getChatSessions();
      // _chatSessions = sessions;
      
      // For now, create some mock data for testing
      _chatSessions = [];
      
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Failed to load chat sessions: $e');
      rethrow;
    }
  }

  /// Start a new chat session with an astrologer
  Future<ChatSession> startChatSession(String astrologerId) async {
    try {
      debugPrint('🎯 Starting chat session with astrologer: $astrologerId');
      
      // TODO: Call API to create chat session
      // final session = await _apiService.createChatSession(astrologerId);
      
      // Create mock session for now
      final session = ChatSession(
        id: 'chat_${DateTime.now().millisecondsSinceEpoch}',
        user: _getCurrentUser(), // You'd get this from auth service
        astrologer: _getMockAstrologer(astrologerId), // You'd get this from API
        status: ChatStatus.active,
        ratePerMinute: 5.0,
        startTime: DateTime.now(),
        durationMinutes: 0,
        totalAmount: 0.0,
        unreadCount: 0,
        messages: [],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // Add to sessions list
      _chatSessions.insert(0, session);
      _activeChatSession = session;
      
      // Join socket room
      await _socketService.joinChatSession(session.id);
      
      // Send welcome system message
      await _socketService.sendMessage(
        session.id,
        'Chat session started with ${session.astrologer.fullName}',
      );
      
      notifyListeners();
      return session;
      
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
  Future<void> joinChatSession(String sessionId) async {
    try {
      debugPrint('🏠 Joining chat session: $sessionId');
      
      // Find the session
      final session = _chatSessions.firstWhere(
        (s) => s.id == sessionId,
        orElse: () => throw Exception('Chat session not found'),
      );
      
      _activeChatSession = session;
      
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

  /// Load messages for a specific session
  Future<void> loadMessagesForSession(String sessionId) async {
    try {
      debugPrint('📨 Loading messages for session: $sessionId');
      
      // TODO: Call API to get messages
      // final messages = await _apiService.getChatMessages(sessionId);
      // _messagesBySession[sessionId] = messages;
      
      // For now, initialize empty message list
      _messagesBySession[sessionId] = [];
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to load messages: $e');
      rethrow;
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

  /// Get mock data - Replace with real implementation
  // Note: These are temporary mock methods for development
  
  // ignore: unused_element
  dynamic _getCurrentUser() {
    // TODO: Get from auth service
    return {
      'id': 'user123',
      'name': 'Test User',
      'email': 'test@example.com',
    };
  }
  
  // ignore: unused_element
  dynamic _getMockAstrologer(String astrologerId) {
    // TODO: Get from API
    return {
      'id': astrologerId,
      'full_name': 'Astrologer Name',
      'email_address': 'astrologer@example.com',
      'qualifications': [],
      'languages': ['English'],
      'skills': ['Vedic Astrology'],
      'experience_years': 5,
      'is_online': true,
      'verification_status': 'verified',
      'is_available': true,
      'rating': 4.5,
      'total_reviews': 100,
      'total_consultations': 500,
      'chat_rate': 5.0,
      'call_rate': 10.0,
      'video_rate': 15.0,
      'created_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  /// Cleanup
  @override
  void dispose() {
    _socketService.disconnect();
    super.dispose();
  }
}