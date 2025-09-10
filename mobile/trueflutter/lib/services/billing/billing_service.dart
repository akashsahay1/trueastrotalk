import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../models/call.dart';
import '../../models/astrologer.dart';
import '../wallet/wallet_service.dart';
import '../service_locator.dart';
import '../local/local_storage_service.dart';
import '../api/user_api_service.dart';

/// Billing service for real-time call and chat billing
class BillingService extends ChangeNotifier {
  static BillingService? _instance;
  static BillingService get instance => _instance ??= BillingService._();
  
  BillingService._();

  final WalletService _walletService = getIt<WalletService>();
  final LocalStorageService _localStorage = getIt<LocalStorageService>();
  final UserApiService _userApiService = getIt<UserApiService>();

  // Active billing sessions
  Timer? _billingTimer;
  String? _activeSessionId;
  String? _activeSessionType; // 'call' or 'chat'
  double? _currentRate;
  DateTime? _sessionStartTime;
  double _totalBilled = 0.0;
  int _elapsedSeconds = 0;
  bool _isLowBalance = false;

  // Billing configuration
  static const int _billingIntervalSeconds = 60; // Bill every minute
  static const int _lowBalanceThreshold = 120; // 2 minutes warning

  // Getters
  double get totalBilled => _totalBilled;
  int get elapsedSeconds => _elapsedSeconds;
  Duration get elapsedDuration => Duration(seconds: _elapsedSeconds);
  String? get activeSessionId => _activeSessionId;
  String? get activeSessionType => _activeSessionType;
  bool get isSessionActive => _activeSessionId != null;
  bool get isLowBalance => _isLowBalance;

  /// Start billing for a call session
  Future<bool> startCallBilling({
    required String sessionId,
    required Astrologer astrologer,
    required CallType callType,
    String? userId,
  }) async {
    try {
      debugPrint('💰 Starting call billing for session: $sessionId');

      // Determine rate and session type based on call type
      final double ratePerMinute;
      final String sessionType;
      switch (callType) {
        case CallType.video:
          ratePerMinute = astrologer.videoRate;
          sessionType = 'video';
          break;
        case CallType.voice:
          ratePerMinute = astrologer.callRate;
          sessionType = 'call';
          break;
      }

      return await _startBilling(
        sessionId: sessionId,
        sessionType: sessionType,
        ratePerMinute: ratePerMinute,
        astrologerId: astrologer.id,
        userId: userId,
      );
    } catch (e) {
      debugPrint('❌ Failed to start call billing: $e');
      return false;
    }
  }

  /// Start billing for a chat session
  Future<bool> startChatBilling({
    required String sessionId,
    required Astrologer astrologer,
  }) async {
    try {
      debugPrint('💰 Starting chat billing for session: $sessionId');

      return await _startBilling(
        sessionId: sessionId,
        sessionType: 'chat',
        ratePerMinute: astrologer.chatRate,
      );
    } catch (e) {
      debugPrint('❌ Failed to start chat billing: $e');
      return false;
    }
  }

  /// Internal method to start billing
  Future<bool> _startBilling({
    required String sessionId,
    required String sessionType,
    required double ratePerMinute,
    String? astrologerId,
    String? userId,
  }) async {
    // Stop any existing billing session
    await stopBilling();

    // Check if user has sufficient balance
    if (!_walletService.hasSufficientBalanceForMinimumDuration(ratePerMinute)) {
      debugPrint('❌ Insufficient balance for billing');
      return false;
    }

    // Create session record on server if astrologerId and userId are provided
    if (astrologerId != null && userId != null) {
      try {
        debugPrint('🔧 Creating session record: sessionId=$sessionId, sessionType=$sessionType, astrologerId=$astrologerId, userId=$userId');
        final token = await _localStorage.getAuthToken();
        if (token != null) {
          final result = await _userApiService.createSession(
            token,
            sessionId: sessionId,
            sessionType: sessionType,
            astrologerId: astrologerId,
            userId: userId,
          );
          debugPrint('📝 Session record created on server successfully: $result');
        } else {
          debugPrint('❌ No auth token available for session creation');
          throw Exception('No authentication token available');
        }
      } catch (e) {
        debugPrint('❌ Failed to create session record: $e');
        debugPrint('❌ Session creation failed - billing updates will fail!');
        // Don't continue if session creation fails - this will cause billing issues
        throw Exception('Session creation failed: $e');
      }
    } else {
      debugPrint('❌ Missing required parameters for session creation: astrologerId=$astrologerId, userId=$userId');
      throw Exception('Missing astrologerId or userId for session creation');
    }

    // Initialize billing session
    _activeSessionId = sessionId;
    _activeSessionType = sessionType;
    _currentRate = ratePerMinute;
    _sessionStartTime = DateTime.now();
    _totalBilled = 0.0;
    _elapsedSeconds = 0;
    _isLowBalance = false;

    // Start billing timer
    _startBillingTimer();

    debugPrint('✅ Billing started: $ratePerMinute/min for $sessionType session');
    notifyListeners();
    return true;
  }

  /// Start the billing timer
  void _startBillingTimer() {
    _billingTimer?.cancel();
    
    _billingTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      if (_activeSessionId == null || _currentRate == null) {
        timer.cancel();
        return;
      }

      _elapsedSeconds++;
      
      // Bill every minute
      if (_elapsedSeconds % _billingIntervalSeconds == 0) {
        final minutesPassed = _elapsedSeconds ~/ _billingIntervalSeconds;
        await _processBilling(minutesPassed);
      }

      // Check for low balance warning
      _checkLowBalanceWarning();

      notifyListeners();
    });
  }

  /// Process billing for completed minutes
  Future<void> _processBilling(int totalMinutes) async {
    if (_currentRate == null || _activeSessionId == null) return;

    try {
      final amountForThisMinute = _currentRate!;
      
      // Check if wallet has sufficient balance
      if (_walletService.currentBalance < amountForThisMinute) {
        debugPrint('❌ Insufficient balance during call, ending session');
        await _handleInsufficientBalance();
        return;
      }

      // Send billing update to server - this will deduct from wallet on server
      try {
        await _sendBillingUpdate(totalMinutes, _totalBilled + amountForThisMinute);
        _totalBilled += amountForThisMinute;
        
        // Refresh local wallet balance after server deduction
        await _walletService.refreshBalance();
        debugPrint('💰 Billed ₹$amountForThisMinute (Total: ₹$_totalBilled)');
      } catch (e) {
        debugPrint('❌ Failed to process billing update: $e');
        await _handleInsufficientBalance();
      }
    } catch (e) {
      debugPrint('❌ Error processing billing: $e');
    }
  }

  /// Send billing update to server
  Future<void> _sendBillingUpdate(int minutes, double totalAmount) async {
    try {
      debugPrint('🔄 Sending billing update: sessionId=$_activeSessionId, sessionType=$_activeSessionType, minutes=$minutes, amount=₹$totalAmount');
      final token = await _localStorage.getAuthToken();
      if (token == null) {
        debugPrint('❌ No auth token available for billing update');
        throw Exception('No authentication token available');
      }

      final result = await _userApiService.updateSessionBilling(
        token,
        sessionId: _activeSessionId!,
        sessionType: _activeSessionType!,
        durationMinutes: minutes,
        totalAmount: totalAmount,
      );
      debugPrint('📊 Sent billing update successfully: $minutes min, ₹$totalAmount - Response: $result');
    } catch (e) {
      debugPrint('❌ Failed to send billing update: $e');
      rethrow; // Re-throw to let caller handle
    }
  }

  /// Check for low balance warning
  void _checkLowBalanceWarning() {
    if (_currentRate == null) return;

    final remainingMinutes = (_walletService.currentBalance / _currentRate!).floor();
    final remainingSeconds = remainingMinutes * 60;
    
    if (remainingSeconds <= _lowBalanceThreshold && !_isLowBalance) {
      _isLowBalance = true;
      _onLowBalance?.call(remainingMinutes);
      debugPrint('⚠️ Low balance warning: $remainingMinutes minutes remaining');
    }
  }

  /// Handle insufficient balance during session
  Future<void> _handleInsufficientBalance() async {
    debugPrint('❌ Insufficient balance, ending session');
    _onInsufficientBalance?.call();
    await stopBilling();
  }

  /// Stop billing for current session
  Future<void> stopBilling() async {
    if (_activeSessionId == null) return;

    try {
      debugPrint('🛑 Stopping billing for session: $_activeSessionId');

      // Cancel timer
      _billingTimer?.cancel();
      _billingTimer = null;

      // Process final billing for partial minute
      if (_elapsedSeconds > 0 && _currentRate != null) {
        final totalMinutes = (_elapsedSeconds / 60).ceil(); // Round up partial minutes
        final finalAmount = totalMinutes * _currentRate!;

        // Send final billing update - this will deduct from wallet on server
        try {
          await _sendBillingUpdate(totalMinutes, finalAmount);
          _totalBilled = finalAmount;
          
          // Refresh local wallet balance after server deduction
          await _walletService.refreshBalance();
          debugPrint('💰 Final billing: ₹$finalAmount ($totalMinutes minutes)');
        } catch (e) {
          debugPrint('❌ CRITICAL: Failed to process final billing: $e');
          debugPrint('❌ This means customer was NOT charged and astrologer will NOT be paid!');
          // Keep local billing as-is but alert about the critical failure
          rethrow; // Let the caller know billing failed
        }
      }

      // Create billing summary
      final summary = BillingSummary(
        sessionId: _activeSessionId!,
        sessionType: _activeSessionType!,
        startTime: _sessionStartTime!,
        endTime: DateTime.now(),
        durationSeconds: _elapsedSeconds,
        ratePerMinute: _currentRate!,
        totalAmount: _totalBilled,
      );

      // Notify about session end
      _onBillingComplete?.call(summary);

      // Reset state
      _activeSessionId = null;
      _activeSessionType = null;
      _currentRate = null;
      _sessionStartTime = null;
      _totalBilled = 0.0;
      _elapsedSeconds = 0;
      _isLowBalance = false;

      notifyListeners();
    } catch (e) {
      debugPrint('❌ Error stopping billing: $e');
    }
  }

  /// Calculate estimated remaining time based on current balance
  Duration getEstimatedRemainingTime() {
    if (_currentRate == null || _currentRate! <= 0) return Duration.zero;
    
    final remainingMinutes = (_walletService.currentBalance / _currentRate!).floor();
    return Duration(minutes: remainingMinutes);
  }

  /// Get current billing rate per minute
  double? getCurrentRate() => _currentRate;

  /// Get formatted elapsed time
  String getFormattedElapsedTime() {
    final duration = Duration(seconds: _elapsedSeconds);
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);
    
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    } else {
      return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
  }

  /// Get formatted total billed amount
  String getFormattedTotalBilled() => '₹${_totalBilled.toStringAsFixed(2)}';

  // Callbacks for UI updates
  Function(int remainingMinutes)? _onLowBalance;
  Function()? _onInsufficientBalance;
  Function(BillingSummary summary)? _onBillingComplete;

  /// Set callback for low balance warning
  void setLowBalanceCallback(Function(int remainingMinutes)? callback) {
    _onLowBalance = callback;
  }

  /// Set callback for insufficient balance
  void setInsufficientBalanceCallback(Function()? callback) {
    _onInsufficientBalance = callback;
  }

  /// Set callback for billing completion
  void setBillingCompleteCallback(Function(BillingSummary summary)? callback) {
    _onBillingComplete = callback;
  }

  @override
  void dispose() {
    _billingTimer?.cancel();
    super.dispose();
  }
}

/// Billing summary for completed sessions
class BillingSummary {
  final String sessionId;
  final String sessionType;
  final DateTime startTime;
  final DateTime endTime;
  final int durationSeconds;
  final double ratePerMinute;
  final double totalAmount;

  BillingSummary({
    required this.sessionId,
    required this.sessionType,
    required this.startTime,
    required this.endTime,
    required this.durationSeconds,
    required this.ratePerMinute,
    required this.totalAmount,
  });

  Duration get duration => Duration(seconds: durationSeconds);
  int get durationMinutes => (durationSeconds / 60).ceil();
  
  String get formattedDuration {
    final duration = Duration(seconds: durationSeconds);
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);
    
    if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }
  
  String get formattedAmount => '₹${totalAmount.toStringAsFixed(2)}';
  
  Map<String, dynamic> toJson() {
    return {
      'sessionId': sessionId,
      'sessionType': sessionType,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'durationSeconds': durationSeconds,
      'durationMinutes': durationMinutes,
      'ratePerMinute': ratePerMinute,
      'totalAmount': totalAmount,
    };
  }
}

/// Extension for WalletService to add billing-specific methods
extension WalletServiceBilling on WalletService {
  /// Check if user has sufficient balance for minimum duration (1 minute)
  bool hasSufficientBalanceForMinimumDuration(double ratePerMinute) {
    return currentBalance >= ratePerMinute;
  }

  /// Check if balance is running low during session
  bool isBalanceLowDuringSession(double ratePerMinute, int warningMinutes) {
    return currentBalance <= (ratePerMinute * warningMinutes);
  }
}