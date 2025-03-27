import 'dart:async';
import '../models/session.dart';
import '../services/sessions.dart';
import '../services/webrtc.dart';
import '../services/notification.dart';

class CallCoordinator {
  final SessionService _sessionService;
  final WebRTCService _webRTCService;
  final NotificationService _notificationService;

  // Current call state
  AstrologerSession? _currentSession;
  SessionCall? _currentCall;
  Timer? _callDurationTimer;
  int _callDurationSeconds = 0;
  int _callDurationMinutes = 0;
  bool _isCustomer = false;

  // Event callbacks
  Function(int minutes)? onRemainingTimeChanged;
  Function()? onTimeExhausted;
  Function()? onCallConnected;
  Function()? onCallEnded;

  CallCoordinator({
    required SessionService sessionService,
    required WebRTCService webRTCService,
    required NotificationService notificationService,
  })  : _sessionService = sessionService,
        _webRTCService = webRTCService,
        _notificationService = notificationService;

  // Initialize with user ID
  Future<void> initialize(String userId, bool isCustomer) async {
    _isCustomer = isCustomer;
    _webRTCService.setUserId(userId);
    await _webRTCService.createStream();

    // Set up event handlers
    _webRTCService.onCallConnected = () {
      onCallConnected?.call();
    };

    _webRTCService.onCallEnded = () {
      _endCurrentCall();
      onCallEnded?.call();
    };
  }

  // Check if customer has an active session with this astrologer
  Future<bool> hasActiveSession(int astrologerId) async {
    final session = await _sessionService.getActiveSessionForAstrologer(astrologerId);
    return session != null;
  }

  // Get remaining minutes with this astrologer
  Future<int> getRemainingMinutes(int astrologerId) async {
    final session = await _sessionService.getActiveSessionForAstrologer(astrologerId);
    return session?.remainingMinutes ?? 0;
  }

  // Purchase a new time block session
  Future<AstrologerSession> purchaseSession(int astrologerId, int minutes, double amount) async {
    return await _sessionService.purchaseSession(astrologerId, minutes, amount);
  }

  // Start a call (customer side)
  Future<void> startCall(int astrologerId) async {
    // Check if there's an active session
    _currentSession = await _sessionService.getActiveSessionForAstrologer(astrologerId);

    if (_currentSession == null) {
      throw Exception('No active session with this astrologer. Please purchase time first.');
    }

    if (_currentSession!.remainingMinutes <= 0) {
      throw Exception('No time remaining with this astrologer. Please purchase more time.');
    }

    // Start a call within the session
    _currentCall = await _sessionService.startSessionCall(_currentSession!.id);

    // Start WebRTC call
    await _webRTCService.makeCall(
      _currentCall!.id.toString(),
      astrologerId.toString(),
    );

    // Start tracking time
    _startCallTimer();
  }

  // Answer incoming call (astrologer side)
  Future<void> answerCall(String callId, String customerId) async {
    _notificationService.stopRingtone();
    await _webRTCService.answerCall(callId, customerId);
  }

  // Reject incoming call
  Future<void> rejectCall(String callId) async {
    _notificationService.stopRingtone();
    await _webRTCService.rejectCall(callId);
  }

  // End current call
  Future<void> endCall() async {
    await _webRTCService.endCall();
    _endCurrentCall();
  }

  // Update session after call ends
  Future<void> _endCurrentCall() async {
    _stopCallTimer();

    if (_currentCall != null && _currentSession != null && _isCustomer) {
      try {
        // Calculate exact minutes used
        final minutesUsed = (_callDurationSeconds / 60).ceil();

        // Update session in backend
        _currentSession = await _sessionService.endSessionCall(
          _currentCall!.id,
          minutesUsed,
        );

        // Reset current call
        _currentCall = null;
        _callDurationSeconds = 0;
        _callDurationMinutes = 0;
      } catch (e) {
        print('Error ending call: $e');
      }
    }
  }

  // Start tracking call time
  void _startCallTimer() {
    _callDurationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _callDurationSeconds++;

      // Check if a minute has passed
      if (_callDurationSeconds % 60 == 0) {
        _callDurationMinutes++;

        // Notify about remaining time change
        if (_currentSession != null) {
          final remainingMinutes = _currentSession!.remainingMinutes - _callDurationMinutes;
          onRemainingTimeChanged?.call(remainingMinutes);

          // Check if time is exhausted
          if (remainingMinutes <= 0) {
            onTimeExhausted?.call();
            endCall(); // Automatically end the call
          }
        }
      }
    });
  }

  // Stop call timer
  void _stopCallTimer() {
    _callDurationTimer?.cancel();
    _callDurationTimer = null;
  }
}
