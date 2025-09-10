import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'config.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';

class PaymentConfig {
  static PaymentConfig? _instance;
  static PaymentConfig get instance => _instance ??= PaymentConfig._();

  PaymentConfig._();

  String? _razorpayKeyId;
  String? _environment;

  String? get razorpayKeyId => _razorpayKeyId;
  String? get environment => _environment;

  /// Initialize payment configuration from server
  /// This securely fetches only the public key from the backend
  Future<void> initialize() async {
    try {
      await _loadFromServer();
    } catch (e) {
      debugPrint('Failed to load payment config from server: $e');
      // For development fallback, you could add local config here
      rethrow;
    }
  }

  /// Load payment config from server API
  /// This is the secure approach - credentials stay on server
  Future<void> _loadFromServer() async {
    try {
      // Get authentication token
      final authService = getIt<AuthService>();
      final token = authService.authToken;

      if (token == null) {
        throw Exception('User not authenticated. Please login first.');
      }

      final dio = Dio();
      final baseUrl = await Config.baseUrl;

      // Get app configuration from authenticated endpoint
      final response = await dio.get(
        '$baseUrl/app-config',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        final data = response.data;

        if (data['success'] == true && data['config'] != null) {
          final config = data['config'];

          _razorpayKeyId = config['razorpay']?['keyId'];
          _environment = config['razorpay']?['environment'] ?? 'test';

          if (_razorpayKeyId?.isEmpty ?? true) {
            throw Exception(
              'Razorpay Key ID not found in server configuration',
            );
          }

          debugPrint('✅ Payment config loaded from server');
          debugPrint('   Environment: $_environment');
          debugPrint('   Key ID: ${_razorpayKeyId?.substring(0, 12)}...');
        } else {
          throw Exception('Invalid response format from server');
        }
      } else {
        throw Exception('Failed to fetch config: HTTP ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to load payment config from server: $e');
    }
  }

  /// Get Razorpay options for payment
  Map<String, dynamic> getRazorpayOptions({
    required double amount,
    required String orderId,
    required String customerName,
    required String customerEmail,
    required String customerPhone,
    String? description,
  }) {
    if (_razorpayKeyId?.isEmpty ?? true) {
      throw Exception('Razorpay not configured. Call initialize() first.');
    }

    return {
      'key': _razorpayKeyId,
      'amount': (amount * 100).toInt(), // Amount in paise
      'name': 'True Astrotalk',
      'order_id': orderId,
      'description': description ?? 'Payment',
      'timeout': 300, // 5 minutes
      'prefill': {
        'contact': customerPhone,
        'email': customerEmail,
        'name': customerName,
      },
      'theme': {
        'color': '#2196F3', // Your app primary color
      },
      'method': {'netbanking': true, 'card': true, 'wallet': true, 'upi': true},
    };
  }

  /// Clear credentials from memory (call on logout)
  void clearCredentials() {
    _razorpayKeyId = null;
    _environment = null;
  }
}
