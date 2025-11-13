import 'package:flutter/foundation.dart';
import '../api/user_api_service.dart';
import '../service_locator.dart';
import '../local/local_storage_service.dart';
import '../../models/astrologer.dart';

class WalletService extends ChangeNotifier {
  static WalletService? _instance;
  static WalletService get instance => _instance ??= WalletService._();
  
  WalletService._();

  final UserApiService _userApiService = getIt<UserApiService>();
  final LocalStorageService _localStorage = getIt<LocalStorageService>();

  double _currentBalance = 0.0;
  bool _isLoading = false;

  double get currentBalance => _currentBalance;
  bool get isLoading => _isLoading;

  /// Load wallet balance from API
  Future<void> loadWalletBalance() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) {
        _currentBalance = 0.0;
        _isLoading = false;
        notifyListeners();
        return;
      }

      // Use unified wallet balance API for both customers and astrologers
      final response = await _userApiService.getWalletBalance(token);
      
      // Admin API returns: { wallet_balance: number, user_name: string, user_email: string }
      _currentBalance = (response['wallet_balance'] ?? 0.0).toDouble();
      debugPrint('💰 Wallet balance loaded: ₹${_currentBalance.toStringAsFixed(2)}');
    } catch (e) {
      debugPrint('❌ Failed to load wallet balance: $e');
      debugPrint('❌ Error details: ${e.toString()}');
      _currentBalance = 0.0;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Check if user has sufficient balance for chat (minimum 5 minutes)
  bool hasSufficientBalanceForChat(Astrologer astrologer) {
    final minimumRequired = calculateMinimumChatAmount(astrologer);
    return _currentBalance >= minimumRequired;
  }

  /// Check if user has sufficient balance for call (minimum 5 minutes)
  bool hasSufficientBalanceForCall(Astrologer astrologer, String callType) {
    final minimumRequired = calculateMinimumCallAmount(astrologer, callType);
    return _currentBalance >= minimumRequired;
  }

  /// Calculate minimum amount required for 5 minutes of chat
  double calculateMinimumChatAmount(Astrologer astrologer) {
    // Chat rate is per minute, minimum 5 minutes
    return astrologer.chatRate * 5.0;
  }

  /// Calculate minimum amount required for 5 minutes of call
  double calculateMinimumCallAmount(Astrologer astrologer, String callType) {
    // Use different rates for voice/video calls, minimum 5 minutes
    final double ratePerMinute;
    if (callType == 'video') {
      ratePerMinute = astrologer.videoRate;
    } else {
      ratePerMinute = astrologer.callRate; // voice call rate
    }
    
    return ratePerMinute * 5.0;
  }

  /// Get insufficient balance message for chat
  String getInsufficientChatBalanceMessage(Astrologer astrologer) {
    final required = calculateMinimumChatAmount(astrologer);
    final shortfall = required - _currentBalance;
    
    return 'Insufficient wallet balance!\n'
           'Required: ₹${required.toStringAsFixed(2)} (for 5 min chat)\n'
           'Current: ₹${_currentBalance.toStringAsFixed(2)}\n'
           'Add ₹${shortfall.toStringAsFixed(2)} to continue';
  }

  /// Get insufficient balance message for call
  String getInsufficientCallBalanceMessage(Astrologer astrologer, String callType) {
    final required = calculateMinimumCallAmount(astrologer, callType);
    final shortfall = required - _currentBalance;
    
    final callTypeText = callType == 'video' ? 'video call' : 'voice call';
    
    return 'Insufficient wallet balance!\n'
           'Required: ₹${required.toStringAsFixed(2)} (for 5 min $callTypeText)\n'
           'Current: ₹${_currentBalance.toStringAsFixed(2)}\n'
           'Add ₹${shortfall.toStringAsFixed(2)} to continue';
  }

  /// Deduct amount from wallet (called during chat/call)
  Future<bool> deductAmount(double amount, String description) async {
    // For now, just update local balance - implement API call later
    if (_currentBalance >= amount) {
      _currentBalance -= amount;
      notifyListeners();
      debugPrint('💰 Deducted ₹$amount from wallet: $description');
      return true;
    }
    return false;
  }

  /// Refresh wallet balance from server
  Future<void> refreshBalance() async {
    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) return;

      final response = await _userApiService.getWalletBalance(token);
      // response is already the data object from getWalletBalance
      _currentBalance = (response['wallet_balance'] ?? 0.0).toDouble();
      notifyListeners();
      debugPrint('💰 Wallet balance refreshed: ₹$_currentBalance');
    } catch (e) {
      debugPrint('❌ Failed to refresh wallet balance: $e');
    }
  }

  /// Add amount to wallet (for recharge)
  Future<bool> addAmount(double amount, String transactionId) async {
    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) return false;

      await _userApiService.rechargeWallet(
        token,
        amount: amount,
        paymentMethod: 'razorpay',
        paymentId: transactionId,
      );

      _currentBalance += amount;
      notifyListeners();
      debugPrint('💰 Added ₹$amount to wallet');
      return true;
    } catch (e) {
      debugPrint('❌ Failed to add wallet amount: $e');
      return false;
    }
  }

  /// Get wallet transaction history
  Future<List<Map<String, dynamic>>> getTransactionHistory() async {
    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) return [];

      final response = await _userApiService.getWalletTransactions(token);
      return List<Map<String, dynamic>>.from(response['transactions'] ?? []);
    } catch (e) {
      debugPrint('❌ Failed to load transaction history: $e');
      return [];
    }
  }

  /// Calculate estimated call/chat duration based on current balance
  Duration getEstimatedDuration(Astrologer astrologer, String type) {
    double ratePerMinute;
    
    switch (type) {
      case 'chat':
        ratePerMinute = astrologer.chatRate;
        break;
      case 'video':
        ratePerMinute = astrologer.videoRate;
        break;
      case 'voice':
      default:
        ratePerMinute = astrologer.callRate;
        break;
    }

    if (ratePerMinute <= 0) return Duration.zero;
    
    final minutesAvailable = (_currentBalance / ratePerMinute).floor();
    return Duration(minutes: minutesAvailable);
  }

  /// Format balance for display
  String get formattedBalance => '₹${_currentBalance.toStringAsFixed(2)}';

  /// Check if wallet needs recharge (below minimum threshold)
  bool get needsRecharge => _currentBalance < 100.0; // Configurable threshold

  /// Initialize wallet service (call this on app start)
  Future<void> initialize() async {
    await loadWalletBalance();
  }
}