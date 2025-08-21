import 'package:flutter/foundation.dart';
import '../../models/call.dart';
// import '../api/user_api_service.dart'; // TODO: Uncomment when implementing real API
import '../socket/socket_service.dart';
// import '../service_locator.dart'; // TODO: Uncomment when needed

class CallService extends ChangeNotifier {
  static CallService? _instance;
  static CallService get instance => _instance ??= CallService._();
  
  CallService._();

  // final UserApiService _apiService = getIt<UserApiService>(); // TODO: Will be used for real API calls
  final SocketService _socketService = SocketService.instance;
  
  // Current call sessions
  List<CallSession> _callSessions = [];
  CallSession? _activeCallSession;
  
  // Getters
  List<CallSession> get callSessions => List.unmodifiable(_callSessions);
  CallSession? get activeCallSession => _activeCallSession;

  /// Initialize call service
  Future<void> initialize() async {
    try {
      debugPrint('🚀 Initializing CallService');
      
      // Connect to socket service if not already connected
      if (!_socketService.isConnected) {
        await _socketService.connect();
      }
      
      // Setup socket listeners for call events
      _setupSocketListeners();
      
      // Load existing call sessions
      await loadCallSessions();
      
    } catch (e) {
      debugPrint('❌ Failed to initialize CallService: $e');
      rethrow;
    }
  }

  /// Setup socket event listeners for call-specific events
  void _setupSocketListeners() {
    // Listen for incoming calls
    _socketService.on('incoming_call', (data) {
      _handleIncomingCall(data);
    });
    
    // Listen for call status updates
    _socketService.on('call_status_updated', (data) {
      _handleCallStatusUpdate(data);
    });
    
    // Listen for call ended
    _socketService.on('call_ended', (data) {
      _handleCallEnded(data);
    });
    
    // Listen for call connection updates
    _socketService.on('call_connection_update', (data) {
      _handleCallConnectionUpdate(data);
    });
  }

  /// Handle incoming call
  void _handleIncomingCall(dynamic data) {
    try {
      debugPrint('📞 Incoming call: $data');
      final callSession = CallSession.fromJson(data);
      
      // Add to call sessions if not already present
      final index = _callSessions.indexWhere((s) => s.id == callSession.id);
      if (index == -1) {
        _callSessions.insert(0, callSession);
      } else {
        _callSessions[index] = callSession;
      }
      
      notifyListeners();
      
      // Show incoming call UI (you would implement this)
      _showIncomingCallUI(callSession);
      
    } catch (e) {
      debugPrint('❌ Failed to handle incoming call: $e');
    }
  }

  /// Handle call status updates
  void _handleCallStatusUpdate(dynamic data) {
    try {
      debugPrint('🔄 Call status update: $data');
      final callSession = CallSession.fromJson(data);
      
      final index = _callSessions.indexWhere((s) => s.id == callSession.id);
      if (index != -1) {
        _callSessions[index] = callSession;
      } else {
        _callSessions.insert(0, callSession);
      }
      
      // Update active call session if it matches
      if (_activeCallSession?.id == callSession.id) {
        _activeCallSession = callSession;
      }
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to handle call status update: $e');
    }
  }

  /// Handle call ended
  void _handleCallEnded(dynamic data) {
    try {
      debugPrint('📵 Call ended: $data');
      final callId = data['callId']?.toString();
      
      if (callId != null) {
        final index = _callSessions.indexWhere((s) => s.id == callId);
        if (index != -1) {
          // Update call status to completed
          final updatedSession = CallSession.fromJson({
            ..._callSessions[index].toJson(),
            'status': 'completed',
            'end_time': DateTime.now().toIso8601String(),
          });
          _callSessions[index] = updatedSession;
          
          // Clear active call if it's the one that ended
          if (_activeCallSession?.id == callId) {
            _activeCallSession = null;
          }
        }
      }
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to handle call ended: $e');
    }
  }

  /// Handle call connection updates (e.g., network issues, reconnection)
  void _handleCallConnectionUpdate(dynamic data) {
    debugPrint('🔗 Call connection update: $data');
    // Handle connection quality updates, reconnections, etc.
    notifyListeners();
  }

  /// Load call sessions from API
  Future<void> loadCallSessions() async {
    try {
      debugPrint('📋 Loading call sessions');
      
      // TODO: Call actual API endpoint
      // final sessions = await _apiService.getCallSessions();
      // _callSessions = sessions;
      
      // For now, create some mock data for testing
      _callSessions = [];
      
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Failed to load call sessions: $e');
      rethrow;
    }
  }

  /// Start a new call session with an astrologer
  Future<CallSession> startCallSession(String astrologerId, CallType callType) async {
    try {
      debugPrint('📞 Starting ${callType.name} call with astrologer: $astrologerId');
      
      // TODO: Call API to create call session and get room details
      // final session = await _apiService.createCallSession(astrologerId, callType);
      
      // Create mock session for now
      final session = CallSession(
        id: 'call_${DateTime.now().millisecondsSinceEpoch}',
        user: _getCurrentUser(),
        astrologer: _getMockAstrologer(astrologerId),
        callType: callType,
        status: CallStatus.ringing,
        ratePerMinute: callType == CallType.video ? 15.0 : 10.0,
        startTime: DateTime.now(),
        durationMinutes: 0,
        totalAmount: 0.0,
        roomId: 'room_${DateTime.now().millisecondsSinceEpoch}',
        token: 'token_${DateTime.now().millisecondsSinceEpoch}',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // Add to sessions list
      _callSessions.insert(0, session);
      _activeCallSession = session;
      
      // Emit call request via socket
      _socketService.emit('start_call_session', {
        'callSessionId': session.id,
        'userId': session.user.id,
        'astrologerId': astrologerId,
        'callType': callType.name.toLowerCase(),
        'roomId': session.roomId,
      });
      
      notifyListeners();
      return session;
      
    } catch (e) {
      debugPrint('❌ Failed to start call session: $e');
      rethrow;
    }
  }

  /// Accept an incoming call
  Future<void> acceptCall(String callSessionId) async {
    try {
      debugPrint('✅ Accepting call: $callSessionId');
      
      final session = _callSessions.firstWhere(
        (s) => s.id == callSessionId,
        orElse: () => throw Exception('Call session not found'),
      );
      
      _activeCallSession = session;
      
      // Emit accept call via socket
      _socketService.emit('accept_call', {
        'callSessionId': callSessionId,
      });
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to accept call: $e');
      rethrow;
    }
  }

  /// Reject an incoming call
  Future<void> rejectCall(String callSessionId) async {
    try {
      debugPrint('❌ Rejecting call: $callSessionId');
      
      // Emit reject call via socket
      _socketService.emit('reject_call', {
        'callSessionId': callSessionId,
      });
      
      // Update local session status
      final index = _callSessions.indexWhere((s) => s.id == callSessionId);
      if (index != -1) {
        final updatedSession = CallSession.fromJson({
          ..._callSessions[index].toJson(),
          'status': 'cancelled',
        });
        _callSessions[index] = updatedSession;
      }
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to reject call: $e');
      rethrow;
    }
  }

  /// End the current call
  Future<void> endCall(String callSessionId) async {
    try {
      debugPrint('📵 Ending call: $callSessionId');
      
      // Emit end call via socket
      _socketService.emit('end_call_session', {
        'callSessionId': callSessionId,
      });
      
      // Clear active call
      if (_activeCallSession?.id == callSessionId) {
        _activeCallSession = null;
      }
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Failed to end call: $e');
      rethrow;
    }
  }

  /// Join an active call (for reconnection scenarios)
  Future<void> joinCall(String callSessionId) async {
    try {
      debugPrint('🔄 Joining call: $callSessionId');
      
      final session = _callSessions.firstWhere(
        (s) => s.id == callSessionId,
        orElse: () => throw Exception('Call session not found'),
      );
      
      if (session.canJoin) {
        _activeCallSession = session;
        
        // Emit join call via socket
        _socketService.emit('join_call', {
          'callSessionId': callSessionId,
          'roomId': session.roomId,
        });
        
        notifyListeners();
      } else {
        throw Exception('Cannot join call in current status: ${session.status.name}');
      }
      
    } catch (e) {
      debugPrint('❌ Failed to join call: $e');
      rethrow;
    }
  }

  /// Show incoming call UI (to be implemented with a proper call screen overlay)
  void _showIncomingCallUI(CallSession callSession) {
    // TODO: Implement incoming call overlay UI
    // This would typically show a full-screen incoming call interface
    debugPrint('📞 Should show incoming call UI for: ${callSession.astrologer.fullName}');
  }

  /// Get mock data - Replace with real implementation
  dynamic _getCurrentUser() {
    return {
      'id': 'user123',
      'name': 'Test User',
      'email': 'test@example.com',
    };
  }
  
  dynamic _getMockAstrologer(String astrologerId) {
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
    _activeCallSession = null;
    super.dispose();
  }
}