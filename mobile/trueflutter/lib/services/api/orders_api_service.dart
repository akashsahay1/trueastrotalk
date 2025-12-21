import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../models/address.dart';
import 'endpoints.dart';

class OrdersApiService {
  final Dio _dio;

  OrdersApiService(this._dio);

  // Get user's orders
  Future<Map<String, dynamic>> getOrders({
    required String userId,
    String userType = 'customer',
    String? status,
    int limit = 20,
    int page = 1,
  }) async {
    try {
      debugPrint('📡 Making API call to get orders:');
      debugPrint('  - userId: $userId');
      debugPrint('  - endpoint: ${ApiEndpoints.orders}');
      
      final response = await _dio.get(
        ApiEndpoints.orders,
        queryParameters: {
          'userId': userId, // This should be custom user_id like 'user_1756540752442_2s0gyae9'
          'userType': userType,
          if (status != null) 'status': status,
          'limit': limit,
          'page': page,
        },
      );
      
      debugPrint('📡 API Response:');
      debugPrint('  - Status Code: ${response.statusCode}');
      debugPrint('  - Success: ${response.data['success']}');
      debugPrint('  - Orders Count: ${(response.data['orders'] as List?)?.length ?? 0}');

      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> ordersJson = response.data['orders'] ?? [];
        final List<Order> orders = ordersJson
            .map((json) => Order.fromJson(json))
            .toList();

        return {
          'success': true,
          'orders': orders,
          'pagination': response.data['pagination'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch orders',
          'orders': <Order>[],
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
        'orders': <Order>[],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
        'orders': <Order>[],
      };
    }
  }

  // Create new order
  Future<Map<String, dynamic>> createOrder({
    required String userId,
    required List<Map<String, dynamic>> items,
    required Address shippingAddress,
    required String paymentMethod,
    Map<String, dynamic>? paymentDetails,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.orders,
        data: {
          'user_id': userId,
          'items': items,
          'shipping_address': shippingAddress.toJson(),
          'payment_method': paymentMethod,
          if (paymentDetails != null) 'payment_details': paymentDetails,
        },
      );

      if (response.statusCode == 201 && response.data['success']) {
        try {
          final orderData = response.data['order'];
          if (orderData == null) {
            throw Exception('Order data is null in response');
          }
          final Order order = Order.fromJson(orderData);
          return {
            'success': true,
            'order': order,
            'order_id': response.data['order_id'],
            'message': response.data['message'],
          };
        } catch (e) {
          debugPrint('❌ Error parsing order response: $e');
          debugPrint('❌ Response data: ${response.data}');
          rethrow;
        }
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to create order',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  // Get single order details
  Future<Map<String, dynamic>> getOrder({
    required String orderId,
    required String userId,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.orderById(orderId),
        queryParameters: {'userId': userId},
      );

      if (response.statusCode == 200 && response.data['success']) {
        final Order order = Order.fromJson(response.data['order']);
        return {
          'success': true,
          'order': order,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Order not found',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  // Update order status (for admin/astrologer)
  Future<Map<String, dynamic>> updateOrderStatus({
    required String orderId,
    String? status,
    String? trackingNumber,
    String? adminId,
    String? razorpayOrderId,
    String? paymentId,
    String? paymentStatus,
  }) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.orderById(orderId),
        data: {
          if (status != null) 'status': status,
          if (trackingNumber != null) 'tracking_number': trackingNumber,
          if (adminId != null) 'admin_id': adminId,
          if (razorpayOrderId != null) 'razorpay_order_id': razorpayOrderId,
          if (paymentId != null) 'payment_id': paymentId,
          if (paymentStatus != null) 'payment_status': paymentStatus,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'order': response.data['order'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to update order status',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  // Cancel order
  Future<Map<String, dynamic>> cancelOrder({
    required String orderId,
    required String userId,
    String? reason,
  }) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.orderById(orderId),
        data: {
          'status': 'cancelled',
          'user_id': userId,
          if (reason != null) 'cancellation_reason': reason,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'order': response.data['order'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to cancel order',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  // Get order summary for checkout
  Future<Map<String, dynamic>> getOrderSummary({
    required String userId,
    required List<Map<String, dynamic>> items,
    required Address shippingAddress,
    double gstRate = 18.0,
  }) async {
    try {
      // This could be a separate endpoint or calculated client-side
      // For now, we'll calculate it client-side
      double subtotal = 0;
      for (final item in items) {
        subtotal += (item['price'] as double) * (item['quantity'] as int);
      }

      final double shipping = subtotal >= 500 ? 0 : 50; // Free shipping above ₹500
      final double tax = subtotal * (gstRate / 100); // Dynamic GST
      final double total = subtotal + shipping + tax;

      return {
        'success': true,
        'summary': {
          'subtotal': subtotal,
          'shipping': shipping,
          'tax': tax,
          'total': total,
          'total_items': items.fold<int>(0, (sum, item) => sum + (item['quantity'] as int)),
          'formatted_subtotal': '₹${subtotal.toStringAsFixed(0)}',
          'formatted_shipping': '₹${shipping.toStringAsFixed(0)}',
          'formatted_tax': '₹${tax.toStringAsFixed(0)}',
          'formatted_total': '₹${total.toStringAsFixed(0)}',
        },
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Failed to calculate order summary: $e',
      };
    }
  }

  String _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout. Please try again.';
      case DioExceptionType.badResponse:
        if (e.response?.data != null && e.response!.data['message'] != null) {
          return e.response!.data['message'];
        }
        return 'Server error. Please try again later.';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      case DioExceptionType.connectionError:
        return 'No internet connection. Please check your network.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}