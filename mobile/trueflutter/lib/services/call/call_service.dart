import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../models/call.dart';
import '../../models/enums.dart';
import '../api/calls_api_service.dart';
import '../auth/auth_service.dart';
import '../socket/socket_service.dart';
import '../service_locator.dart';

class CallService extends ChangeNotifier {
  static CallService? _instance;
  static CallService get instance => _instance ??= CallService._();

  CallService._();

  final CallsApiService _callsApiService = getIt<CallsApiService>();
  final SocketService _socketService = SocketService.instance;
  final AuthService _authService = getIt<AuthService>();

  // Stream subscriptions for call events
  StreamSubscription<Map<String, dynamic>>? _incomingCallSubscription;
  StreamSubscription<Map<String, dynamic>>? _callAnsweredSubscription;
  StreamSubscription<Map<String, dynamic>>? _callRejectedSubscription;
  StreamSubscription<Map<String, dynamic>>? _callEndedSubscription;
  StreamSubscription<Map<String, dynamic>>? _callErrorSubscription;

  // Current call sessions
  List<CallSession> _callSessions = [];
  CallSession? _activeCallSession;
  
  // Call screen tracking
  bool _isCallScreenActive = false;
  Map<String, dynamic>? _activeCallData;
  
  // Getters
  List<CallSession> get callSessions => List.unmodifiable(_callSessions);
  CallSession? get activeCallSession => _activeCallSession;
  bool get isCallScreenActive => _isCallScreenActive;
  Map<String, dynamic>? get activeCallData => _activeCallData;

  /// Initialize call service
  Future<void> initialize() async {
    try {
      debugPrint('🚀 Initializing CallService');

      // Ensure socket is connected with retry logic
      await _socketService.ensureConnected(maxRetries: 3);

      // Setup socket listeners for call events
      _setupSocketListeners();

      // Load existing call sessions (don't fail initialization if this fails)
      try {
        await loadCallSessions();
      } catch (e) {
        debugPrint('⚠️ Failed to load call history, continuing anyway: $e');
        _callSessions = [];
      }

    } catch (e) {
      debugPrint('❌ Failed to initialize CallService: $e');
      rethrow;
    }
  }

  /// Setup socket event listeners for call-specific events using streams
  void _setupSocketListeners() {
    // Cancel any existing subscriptions first
    _cancelSocketSubscriptions();

    // Listen for incoming calls via stream
    _incomingCallSubscription = _socketService.incomingCallStream.listen((data) {
      debugPrint('📞 [CALL_SERVICE] Incoming call from stream: $data');
      _handleIncomingCall(data);
    });

    // Listen for call answered via stream
    _callAnsweredSubscription = _socketService.callAnsweredStream.listen((data) {
      debugPrint('✅ [CALL_SERVICE] Call answered from stream: $data');
      _handleCallAnswered(data);
    });

    // Listen for call rejected via stream
    _callRejectedSubscription = _socketService.callRejectedStream.listen((data) {
      debugPrint('❌ [CALL_SERVICE] Call rejected from stream: $data');
      _handleCallRejected(data);
    });

    // Listen for call ended via stream
    _callEndedSubscription = _socketService.callEndedStream.listen((data) {
      debugPrint('📴 [CALL_SERVICE] Call ended from stream: $data');
      _handleCallEnded(data);
    });

    // Listen for call errors via stream
    _callErrorSubscription = _socketService.callErrorStream.listen((data) {
      debugPrint('❌ [CALL_SERVICE] Call error from stream: $data');
      _handleCallError(data);
    });
  }

  /// Cancel all socket subscriptions
  void _cancelSocketSubscriptions() {
    _incomingCallSubscription?.cancel();
    _callAnsweredSubscription?.cancel();
    _callRejectedSubscription?.cancel();
    _callEndedSubscription?.cancel();
    _callErrorSubscription?.cancel();
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

  /// Handle call ended
  void _handleCallEnded(dynamic data) {
    try {
      debugPrint('📵 Call ended: $data');
      // Support both snake_case and camelCase for backward compatibility
      final callId = (data['session_id'] ?? data['callId'])?.toString();

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

      // Clear call screen state
      _isCallScreenActive = false;
      _activeCallData = null;

      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to handle call ended: $e');
    }
  }

  /// Handle call answered (when astrologer accepts the call)
  void _handleCallAnswered(dynamic data) {
    try {
      debugPrint('✅ Call answered: $data');
      // Support both snake_case and camelCase
      final callId = (data['session_id'] ?? data['callId'])?.toString();

      if (callId != null) {
        final index = _callSessions.indexWhere((s) => s.id == callId);
        if (index != -1) {
          // Update call status to active
          final updatedSession = CallSession.fromJson({
            ..._callSessions[index].toJson(),
            'status': 'active',
            'start_time': data['start_time'] ?? DateTime.now().toIso8601String(),
          });
          _callSessions[index] = updatedSession;

          // Update active call session
          if (_activeCallSession?.id == callId) {
            _activeCallSession = updatedSession;
          }
        }
      }

      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to handle call answered: $e');
    }
  }

  /// Handle call rejected (when astrologer rejects the call)
  void _handleCallRejected(dynamic data) {
    try {
      debugPrint('❌ Call rejected: $data');
      // Support both snake_case and camelCase
      final callId = (data['session_id'] ?? data['callId'])?.toString();
      final reason = data['reason']?.toString() ?? 'rejected';

      if (callId != null) {
        final index = _callSessions.indexWhere((s) => s.id == callId);
        if (index != -1) {
          // Update call status to rejected
          final updatedSession = CallSession.fromJson({
            ..._callSessions[index].toJson(),
            'status': reason == 'busy' ? 'busy' : 'rejected',
            'end_time': DateTime.now().toIso8601String(),
          });
          _callSessions[index] = updatedSession;

          // Clear active call if it's the one that was rejected
          if (_activeCallSession?.id == callId) {
            _activeCallSession = null;
          }
        }
      }

      // Clear call screen state
      _isCallScreenActive = false;
      _activeCallData = null;

      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to handle call rejected: $e');
    }
  }

  /// Handle call errors
  void _handleCallError(dynamic data) {
    try {
      debugPrint('❌ Call error: $data');
      final callId = (data['session_id'] ?? data['callId'])?.toString();
      final error = data['error']?.toString() ?? 'Unknown error';

      if (callId != null) {
        final index = _callSessions.indexWhere((s) => s.id == callId);
        if (index != -1) {
          // Update call status to failed
          final updatedSession = CallSession.fromJson({
            ..._callSessions[index].toJson(),
            'status': 'failed',
            'end_time': DateTime.now().toIso8601String(),
          });
          _callSessions[index] = updatedSession;

          // Clear active call if it had an error
          if (_activeCallSession?.id == callId) {
            _activeCallSession = null;
          }
        }
      }

      // Clear call screen state
      _isCallScreenActive = false;
      _activeCallData = null;

      debugPrint('❌ Call error details: $error');
      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to handle call error: $e');
    }
  }

  /// Load call sessions from API
  Future<void> loadCallSessions() async {
    try {
      debugPrint('📋 Loading call sessions');
      
      final userId = _getCurrentUserId();
      if (userId == null) {
        debugPrint('⚠️ No user ID found, cannot load call sessions');
        _callSessions = [];
        notifyListeners();
        return;
      }

      // Use actual user role instead of hardcoded value
      final userType = _authService.currentUser?.role.value ?? 'customer';
      final result = await _callsApiService.getCallSessions(
        userId: userId,
        userType: userType,
      );
      
      if (result['success']) {
        _callSessions = result['call_sessions'];
        debugPrint('✅ Loaded ${_callSessions.length} call sessions');
      } else {
        debugPrint('❌ Failed to load call sessions: ${result['error']}');
        _callSessions = [];
      }
      
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Failed to load call sessions: $e');
      _callSessions = [];
      notifyListeners();
    }
  }

  /// Start a new call session with an astrologer
  Future<CallSession> startCallSession(String astrologerId, CallType callType) async {
    try {
      debugPrint('📞 Starting ${callType.name} call with astrologer: $astrologerId');

      // Ensure socket is connected before starting call
      if (!_socketService.isConnected) {
        debugPrint('🔌 Socket not connected, attempting to connect...');
        await _socketService.ensureConnected(maxRetries: 3);
      }

      final userId = _getCurrentUserId();
      if (userId == null) {
        throw Exception('User not logged in');
      }

      final result = await _callsApiService.createCallSession(
        userId: userId,
        astrologerId: astrologerId,
        callType: callType == CallType.video ? 'video' : 'voice',
      );

      if (result['success']) {
        final session = result['session'] as CallSession;
        debugPrint('📞 Call session created: ${session.id}');

        // Add to sessions list
        _callSessions.insert(0, session);
        _activeCallSession = session;

        // Emit call request via socket using SocketService method
        await _socketService.initiateCallSession(
          sessionId: session.id,
          astrologerId: astrologerId,
          callType: callType.name.toLowerCase(),
        );

        notifyListeners();
        return session;
      } else {
        throw Exception(result['error'] ?? 'Failed to create call session');
      }

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

      // Emit accept call via socket using SocketService method
      await _socketService.answerCallSession(callSessionId);

      notifyListeners();

    } catch (e) {
      debugPrint('❌ Failed to accept call: $e');
      rethrow;
    }
  }

  /// Reject an incoming call
  Future<void> rejectCall(String callSessionId, {String reason = 'rejected'}) async {
    try {
      debugPrint('❌ Rejecting call: $callSessionId');

      // Emit reject call via socket using SocketService method
      await _socketService.rejectCallSession(callSessionId, reason: reason);

      // Update local session status
      final index = _callSessions.indexWhere((s) => s.id == callSessionId);
      if (index != -1) {
        final updatedSession = CallSession.fromJson({
          ..._callSessions[index].toJson(),
          'status': 'rejected',
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

      // Emit end call via socket using SocketService method
      await _socketService.endCallSession(callSessionId);

      // Clear active call
      if (_activeCallSession?.id == callSessionId) {
        _activeCallSession = null;
      }

      // Clear call screen state
      _isCallScreenActive = false;
      _activeCallData = null;

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

        // Emit join call via socket using snake_case fields
        _socketService.emit('join_call', {
          'session_id': callSessionId,
          'room_id': session.roomId,
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
    // This would typically show a full-screen incoming call interface
    // You can implement this with a navigation to a call screen or overlay
    debugPrint('📞 Incoming call from: ${callSession.astrologer.fullName}');
    // Navigator.push(context, MaterialPageRoute(builder: (_) => IncomingCallScreen(callSession)));
  }

  /// Set active call screen data
  void setCallScreenActive(Map<String, dynamic> callData) {
    _isCallScreenActive = true;
    _activeCallData = callData;
    notifyListeners();
    debugPrint('📱 Call screen set as active');
  }

  /// Clear active call screen data
  void clearCallScreenActive() {
    _isCallScreenActive = false;
    _activeCallData = null;
    notifyListeners();
    debugPrint('📱 Call screen cleared');
  }

  /// Check if there's an active call to return to
  bool get hasActiveCallToReturn => _isCallScreenActive && _activeCallData != null;

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
  
  /// Cleanup all active calls - call this before logout or app close
  Future<void> cleanup() async {
    try {
      debugPrint('🧹 Cleaning up CallService...');

      // End any active call
      if (_activeCallSession != null) {
        try {
          await endCall(_activeCallSession!.id);
        } catch (e) {
          debugPrint('⚠️ Error ending active call during cleanup: $e');
        }
      }

      // Clear all state
      _activeCallSession = null;
      _isCallScreenActive = false;
      _activeCallData = null;
      _callSessions.clear();

      notifyListeners();
      debugPrint('✅ CallService cleanup completed');
    } catch (e) {
      debugPrint('❌ Error during CallService cleanup: $e');
    }
  }

  /// Cleanup
  @override
  void dispose() {
    // Cancel socket subscriptions
    _cancelSocketSubscriptions();
    cleanup();
    super.dispose();
  }
}