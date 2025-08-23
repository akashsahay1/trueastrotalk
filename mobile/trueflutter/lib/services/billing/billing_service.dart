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
  }) async {
    try {
      debugPrint('💰 Starting call billing for session: $sessionId');

      // Determine rate based on call type
      final double ratePerMinute;
      switch (callType) {
        case CallType.video:
          ratePerMinute = astrologer.videoRate;
          break;
        case CallType.voice:
          ratePerMinute = astrologer.callRate;
          break;
      }

      return await _startBilling(
        sessionId: sessionId,
        sessionType: 'call',
        ratePerMinute: ratePerMinute,
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
  }) async {
    // Stop any existing billing session
    await stopBilling();

    // Check if user has sufficient balance
    if (!_walletService.hasSufficientBalanceForMinimumDuration(ratePerMinute)) {
      debugPrint('❌ Insufficient balance for billing');
      return false;
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

      // Deduct from wallet
      final success = await _walletService.deductAmount(
        amountForThisMinute,
        '${_activeSessionType!.toUpperCase()} - Session $_activeSessionId (Minute $totalMinutes)',
      );

      if (success) {
        _totalBilled += amountForThisMinute;
        debugPrint('💰 Billed ₹$amountForThisMinute (Total: ₹$_totalBilled)');
        
        // Send billing update to server
        await _sendBillingUpdate(totalMinutes, _totalBilled);
      } else {
        debugPrint('❌ Failed to deduct amount from wallet');
        await _handleInsufficientBalance();
      }
    } catch (e) {
      debugPrint('❌ Error processing billing: $e');
    }
  }

  /// Send billing update to server
  Future<void> _sendBillingUpdate(int minutes, double totalAmount) async {
    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) return;

      await _userApiService.updateSessionBilling(
        token,
        sessionId: _activeSessionId!,
        sessionType: _activeSessionType!,
        durationMinutes: minutes,
        totalAmount: totalAmount,
      );
      debugPrint('📊 Sent billing update: $minutes min, ₹$totalAmount');
    } catch (e) {
      debugPrint('❌ Failed to send billing update: $e');
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
        final remainingAmount = finalAmount - _totalBilled;

        if (remainingAmount > 0 && _walletService.currentBalance >= remainingAmount) {
          await _walletService.deductAmount(
            remainingAmount,
            '${_activeSessionType!.toUpperCase()} - Session $_activeSessionId (Final billing)',
          );
          _totalBilled = finalAmount;
        }

        // Send final billing update
        await _sendBillingUpdate(totalMinutes, _totalBilled);
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