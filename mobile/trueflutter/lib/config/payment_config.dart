import 'dart:convert';
import 'package:flutter/services.dart';

class PaymentConfig {
  static PaymentConfig? _instance;
  static PaymentConfig get instance => _instance ??= PaymentConfig._();
  
  PaymentConfig._();

  String? _razorpayKeyId;
  String? _razorpayKeySecret;

  String? get razorpayKeyId => _razorpayKeyId;
  String? get razorpayKeySecret => _razorpayKeySecret;

  /// Initialize payment configuration from secure storage
  /// This should be called during app initialization
  Future<void> initialize() async {
    try {
      // Try to load from assets first (for development)
      await _loadFromAssets();
    } catch (e) {
      // If assets loading fails, try environment variables or secure storage
      await _loadFromEnvironment();
    }
  }

  /// Load payment config from assets/payment_config.json
  /// This file should NOT be committed to version control
  /// Add it to .gitignore
  Future<void> _loadFromAssets() async {
    try {
      final String response = await rootBundle.loadString('assets/config/payment_config.json');
      final Map<String, dynamic> data = json.decode(response);
      
      _razorpayKeyId = data['razorpay_key_id'];
      _razorpayKeySecret = data['razorpay_key_secret'];
      
      if (_razorpayKeyId?.isEmpty ?? true) {
        throw Exception('Razorpay Key ID not found');
      }
    } catch (e) {
      throw Exception('Failed to load payment config from assets: $e');
    }
  }

  /// Load payment config from environment variables or secure storage
  /// This is the recommended approach for production
  Future<void> _loadFromEnvironment() async {
    // In a real production app, you would:
    // 1. Use flutter_secure_storage to store encrypted credentials
    // 2. Fetch credentials from a secure backend API during login
    // 3. Use platform-specific secure storage (Keychain on iOS, Keystore on Android)
    
    // For now, using placeholder values
    // These should be replaced with actual secure credential loading
    _razorpayKeyId = const String.fromEnvironment(
      'RAZORPAY_KEY_ID',
      defaultValue: '', // Empty default - will be loaded securely
    );
    
    _razorpayKeySecret = const String.fromEnvironment(
      'RAZORPAY_KEY_SECRET',
      defaultValue: '', // Empty default - will be loaded securely
    );

    if (_razorpayKeyId?.isEmpty ?? true) {
      throw Exception('Razorpay credentials not configured');
    }
  }

  /// Get Razorpay options for payment
  Map<String, dynamic> getRazorpayOptions({
    required double amount,
    required String orderId,
    required String customerName,
    required String customerEmail,
    required String customerPhone,
  }) {
    if (_razorpayKeyId?.isEmpty ?? true) {
      throw Exception('Razorpay not configured. Call initialize() first.');
    }

    return {
      'key': _razorpayKeyId,
      'amount': (amount * 100).toInt(), // Amount in paise
      'name': 'TrueAstroTalk',
      'order_id': orderId,
      'description': 'Wallet Recharge',
      'timeout': 300, // 5 minutes
      'prefill': {
        'contact': customerPhone,
        'email': customerEmail,
        'name': customerName,
      },
      'theme': {
        'color': '#2196F3', // Your app primary color
      },
      'method': {
        'netbanking': true,
        'card': true,
        'wallet': true,
        'upi': true,
      },
    };
  }

  /// Clear credentials from memory (call on logout)
  void clearCredentials() {
    _razorpayKeyId = null;
    _razorpayKeySecret = null;
  }
}

/// Example payment_config.json structure:
/// {
///   "razorpay_key_id": "rzp_test_your_key_id_here",
///   "razorpay_key_secret": "your_secret_key_here"
/// }
/// 
/// IMPORTANT: Add assets/config/payment_config.json to .gitignore
/// Never commit payment credentials to version control