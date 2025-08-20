import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../config/payment_config.dart';
import '../../models/user.dart';
import '../api/user_api_service.dart';
import '../auth/auth_service.dart';
import '../service_locator.dart';

class RazorpayService {
  static RazorpayService? _instance;
  static RazorpayService get instance => _instance ??= RazorpayService._();
  
  RazorpayService._();

  Razorpay? _razorpay;
  
  /// Initialize Razorpay service
  void initialize() {
    _razorpay = Razorpay();
  }

  /// Process wallet recharge payment
  Future<PaymentResult> processWalletRecharge({
    required BuildContext context,
    required double amount,
    required User user,
    required Function(String paymentId, String orderId) onSuccess,
    required Function(PaymentFailureResponse response) onError,
  }) async {
    try {
      if (_razorpay == null) {
        throw Exception('Razorpay not initialized');
      }

      // Get services
      final authService = getIt<AuthService>();
      final userApiService = getIt<UserApiService>();
      final token = authService.authToken;

      if (token == null) {
        throw Exception('Authentication token not available');
      }

      debugPrint('🔄 Creating Razorpay order for ₹$amount');

      // Create order on backend first
      // Keep receipt under 40 characters (Razorpay limit)
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final shortUserId = user.id.length > 8 
          ? user.id.substring(user.id.length - 8) 
          : user.id; // Use full ID if shorter than 8 chars
      final receipt = 'w_${shortUserId}_$timestamp';
      final finalReceipt = receipt.length > 40 ? receipt.substring(0, 40) : receipt;
      
      final orderData = await userApiService.createRazorpayOrder(
        token,
        amount: amount,
        receipt: finalReceipt,
      );

      final orderId = orderData['id'] as String;
      debugPrint('✅ Razorpay order created: $orderId');

      // Get Razorpay options with real order ID
      final options = PaymentConfig.instance.getRazorpayOptions(
        amount: amount,
        orderId: orderId,
        customerName: user.name,
        customerEmail: user.email ?? '',
        customerPhone: user.phone ?? '',
      );

      // Set up payment callbacks
      _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse response) {
        _handlePaymentSuccess(response, orderId, onSuccess);
      });

      _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
        _handlePaymentError(response, onError);
      });

      _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse response) {
        _handleExternalWallet(response);
      });

      debugPrint('🚀 Opening Razorpay checkout');
      // Open Razorpay checkout
      _razorpay!.open(options);

      return PaymentResult.processing();
    } catch (e) {
      debugPrint('❌ Failed to initialize payment: $e');
      return PaymentResult.error('Failed to initialize payment: $e');
    }
  }

  void _handlePaymentSuccess(
    PaymentSuccessResponse response, 
    String orderId,
    Function(String paymentId, String orderId) onSuccess
  ) {
    try {
      onSuccess(response.paymentId ?? '', orderId);
    } catch (e) {
      debugPrint('Error handling payment success: $e');
    }
  }

  void _handlePaymentError(
    PaymentFailureResponse response,
    Function(PaymentFailureResponse response) onError
  ) {
    try {
      debugPrint('🚨 Razorpay Payment Error:');
      debugPrint('   Code: ${response.code}');
      debugPrint('   Message: ${response.message}');
      debugPrint('   Description: ${response.error}');
      onError(response);
    } catch (e) {
      debugPrint('Error handling payment error: $e');
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint('External wallet: ${response.walletName}');
  }

  /// Clean up resources
  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
  }
}

class PaymentResult {
  final bool isSuccess;
  final bool isProcessing;
  final String? message;
  final String? paymentId;
  final String? orderId;

  PaymentResult._({
    required this.isSuccess,
    required this.isProcessing,
    this.message,
    this.paymentId,
    this.orderId,
  });

  factory PaymentResult.success({
    required String paymentId,
    required String orderId,
    String? message,
  }) {
    return PaymentResult._(
      isSuccess: true,
      isProcessing: false,
      message: message,
      paymentId: paymentId,
      orderId: orderId,
    );
  }

  factory PaymentResult.error(String message) {
    return PaymentResult._(
      isSuccess: false,
      isProcessing: false,
      message: message,
    );
  }

  factory PaymentResult.processing() {
    return PaymentResult._(
      isSuccess: false,
      isProcessing: true,
      message: 'Processing payment...',
    );
  }
}