import 'package:flutter/foundation.dart';
import '../../models/order.dart';
import '../../models/user.dart';
// import '../api/user_api_service.dart'; // TODO: Uncomment when implementing real API
// import '../service_locator.dart'; // TODO: Uncomment when needed

class EmailService {
  static EmailService? _instance;
  static EmailService get instance => _instance ??= EmailService._();
  
  EmailService._();

  // final UserApiService _userApiService = getIt<UserApiService>(); // TODO: Will be used for real API calls

  /// Send order confirmation email
  Future<EmailResult> sendOrderConfirmationEmail({
    required Order order,
    required User user,
    required String authToken,
  }) async {
    try {
      debugPrint('📧 Sending order confirmation email for order ${order.orderNumber}');

      // final emailData = _buildOrderConfirmationEmailData(order, user); // TODO: Use when implementing real API
      
      // TODO: Call backend API to send email
      // final response = await _userApiService.sendOrderConfirmationEmail(
      //   authToken,
      //   emailData,
      // );

      // Simulate API call for now
      await Future.delayed(const Duration(seconds: 1));

      debugPrint('✅ Order confirmation email sent successfully');
      return EmailResult.success('Order confirmation email sent successfully');
    } catch (e) {
      debugPrint('❌ Failed to send order confirmation email: $e');
      return EmailResult.error('Failed to send order confirmation email: $e');
    }
  }

  /// Send order status update email
  Future<EmailResult> sendOrderStatusUpdateEmail({
    required Order order,
    required User user,
    required String authToken,
    required OrderStatus previousStatus,
  }) async {
    try {
      debugPrint('📧 Sending order status update email for order ${order.orderNumber}');

      // final emailData = _buildOrderStatusUpdateEmailData(order, user, previousStatus); // TODO: Use when implementing real API
      
      // TODO: Call backend API to send email
      // final response = await _userApiService.sendOrderStatusUpdateEmail(
      //   authToken,
      //   emailData,
      // );

      // Simulate API call for now
      await Future.delayed(const Duration(seconds: 1));

      debugPrint('✅ Order status update email sent successfully');
      return EmailResult.success('Order status update email sent successfully');
    } catch (e) {
      debugPrint('❌ Failed to send order status update email: $e');
      return EmailResult.error('Failed to send order status update email: $e');
    }
  }

  /// Send order cancellation email
  Future<EmailResult> sendOrderCancellationEmail({
    required Order order,
    required User user,
    required String authToken,
    String? cancellationReason,
  }) async {
    try {
      debugPrint('📧 Sending order cancellation email for order ${order.orderNumber}');

      // final emailData = _buildOrderCancellationEmailData(order, user, cancellationReason); // TODO: Use when implementing real API
      
      // TODO: Call backend API to send email
      // final response = await _userApiService.sendOrderCancellationEmail(
      //   authToken,
      //   emailData,
      // );

      // Simulate API call for now
      await Future.delayed(const Duration(seconds: 1));

      debugPrint('✅ Order cancellation email sent successfully');
      return EmailResult.success('Order cancellation email sent successfully');
    } catch (e) {
      debugPrint('❌ Failed to send order cancellation email: $e');
      return EmailResult.error('Failed to send order cancellation email: $e');
    }
  }

  /// Send order delivery notification email
  Future<EmailResult> sendOrderDeliveryEmail({
    required Order order,
    required User user,
    required String authToken,
  }) async {
    try {
      debugPrint('📧 Sending order delivery email for order ${order.orderNumber}');

      // final emailData = _buildOrderDeliveryEmailData(order, user); // TODO: Use when implementing real API
      
      // TODO: Call backend API to send email
      // final response = await _userApiService.sendOrderDeliveryEmail(
      //   authToken,
      //   emailData,
      // );

      // Simulate API call for now
      await Future.delayed(const Duration(seconds: 1));

      debugPrint('✅ Order delivery email sent successfully');
      return EmailResult.success('Order delivery email sent successfully');
    } catch (e) {
      debugPrint('❌ Failed to send order delivery email: $e');
      return EmailResult.error('Failed to send order delivery email: $e');
    }
  }

  /// Build order confirmation email data
  Map<String, dynamic> _buildOrderConfirmationEmailData(Order order, User user) {
    return {
      'template': 'order_confirmation',
      'to': user.email,
      'subject': 'Order Confirmation - ${order.orderNumber}',
      'data': {
        'user_name': user.name,
        'order_number': order.orderNumber,
        'order_date': order.formattedOrderDate,
        'total_amount': order.formattedTotal,
        'payment_method': order.paymentMethodDisplayName,
        'payment_status': order.paymentStatusDisplayName,
        'shipping_address': {
          'name': order.shippingAddress.fullName,
          'phone': order.shippingAddress.phoneNumber,
          'address': order.shippingAddress.fullAddress,
        },
        'items': order.items.map((item) => {
          'name': item.productName,
          'quantity': item.quantity,
          'price': item.formattedPrice,
          'total': item.formattedTotalPrice,
          'category': item.category,
        }).toList(),
        'order_summary': {
          'subtotal': order.formattedSubtotal,
          'shipping': order.formattedShipping,
          'tax': order.formattedTax,
          'total': order.formattedTotal,
        },
        'expected_delivery': order.formattedDeliveryDate,
        'tracking_number': order.trackingNumber,
        'support_email': 'support@trueastrotalk.com',
        'support_phone': '+91-XXX-XXX-XXXX',
      },
    };
  }

  /// Build order status update email data
  Map<String, dynamic> _buildOrderStatusUpdateEmailData(
    Order order, 
    User user, 
    OrderStatus previousStatus,
  ) {
    return {
      'template': 'order_status_update',
      'to': user.email,
      'subject': 'Order Update - ${order.orderNumber}',
      'data': {
        'user_name': user.name,
        'order_number': order.orderNumber,
        'previous_status': previousStatus.name,
        'current_status': order.statusDisplayName,
        'order_date': order.formattedOrderDate,
        'total_amount': order.formattedTotal,
        'tracking_number': order.trackingNumber,
        'expected_delivery': order.formattedDeliveryDate,
        'shipping_address': {
          'name': order.shippingAddress.fullName,
          'phone': order.shippingAddress.phoneNumber,
          'address': order.shippingAddress.fullAddress,
        },
        'items_count': order.totalItems,
        'support_email': 'support@trueastrotalk.com',
        'support_phone': '+91-XXX-XXX-XXXX',
      },
    };
  }

  /// Build order cancellation email data
  Map<String, dynamic> _buildOrderCancellationEmailData(
    Order order, 
    User user, 
    String? cancellationReason,
  ) {
    return {
      'template': 'order_cancellation',
      'to': user.email,
      'subject': 'Order Cancelled - ${order.orderNumber}',
      'data': {
        'user_name': user.name,
        'order_number': order.orderNumber,
        'order_date': order.formattedOrderDate,
        'total_amount': order.formattedTotal,
        'cancellation_reason': cancellationReason ?? 'Cancelled by customer',
        'payment_method': order.paymentMethodDisplayName,
        'refund_info': order.paymentMethod == PaymentMethod.razorpay 
            ? 'Refund will be processed within 5-7 business days'
            : 'No payment was made for this order',
        'items': order.items.map((item) => {
          'name': item.productName,
          'quantity': item.quantity,
          'total': item.formattedTotalPrice,
        }).toList(),
        'support_email': 'support@trueastrotalk.com',
        'support_phone': '+91-XXX-XXX-XXXX',
      },
    };
  }

  /// Build order delivery email data
  Map<String, dynamic> _buildOrderDeliveryEmailData(Order order, User user) {
    return {
      'template': 'order_delivered',
      'to': user.email,
      'subject': 'Order Delivered - ${order.orderNumber}',
      'data': {
        'user_name': user.name,
        'order_number': order.orderNumber,
        'delivery_date': order.deliveredDate?.day != null 
            ? '${order.deliveredDate!.day}/${order.deliveredDate!.month}/${order.deliveredDate!.year}'
            : 'Today',
        'total_amount': order.formattedTotal,
        'items_count': order.totalItems,
        'shipping_address': {
          'name': order.shippingAddress.fullName,
          'phone': order.shippingAddress.phoneNumber,
          'address': order.shippingAddress.shortAddress,
        },
        'feedback_request': true,
        'support_email': 'support@trueastrotalk.com',
        'support_phone': '+91-XXX-XXX-XXXX',
      },
    };
  }

  /// Get email template preview (for testing)
  String getOrderConfirmationEmailPreview(Order order, User user) {
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>Order Confirmation</title>
</head>
<body>
    <h1>Order Confirmation</h1>
    <p>Dear ${user.name},</p>
    <p>Thank you for your order! Your order has been confirmed.</p>
    
    <h2>Order Details</h2>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>Order Date:</strong> ${order.formattedOrderDate}</p>
    <p><strong>Total Amount:</strong> ${order.formattedTotal}</p>
    
    <h3>Items Ordered</h3>
    ${order.items.map((item) => '''
    <div>
        <p>${item.productName} - Qty: ${item.quantity} - ${item.formattedTotalPrice}</p>
    </div>
    ''').join('')}
    
    <h3>Shipping Address</h3>
    <p>${order.shippingAddress.fullName}<br>
    ${order.shippingAddress.phoneNumber}<br>
    ${order.shippingAddress.fullAddress}</p>
    
    <p>Expected Delivery: ${order.formattedDeliveryDate}</p>
    
    <p>Best regards,<br>True AstroTalk Team</p>
</body>
</html>
    ''';
  }
}

class EmailResult {
  final bool isSuccess;
  final String message;
  final Map<String, dynamic>? data;

  EmailResult._({
    required this.isSuccess,
    required this.message,
    this.data,
  });

  factory EmailResult.success(String message, {Map<String, dynamic>? data}) {
    return EmailResult._(
      isSuccess: true,
      message: message,
      data: data,
    );
  }

  factory EmailResult.error(String message) {
    return EmailResult._(
      isSuccess: false,
      message: message,
    );
  }
}