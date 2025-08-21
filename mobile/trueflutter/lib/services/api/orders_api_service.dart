import 'package:dio/dio.dart';
import '../../models/order.dart';
import '../../models/address.dart';
import 'endpoints.dart';

class OrdersApiService {
  final Dio _dio;

  OrdersApiService(this._dio);

  // Get user's orders
  Future<Map<String, dynamic>> getOrders({
    required String userId,
    String userType = 'user',
    String? status,
    int limit = 20,
    int page = 1,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.orders,
        queryParameters: {
          'userId': userId,
          'userType': userType,
          if (status != null) 'status': status,
          'limit': limit,
          'page': page,
        },
      );

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
        final Order order = Order.fromJson(response.data['order']);
        return {
          'success': true,
          'order': order,
          'order_id': response.data['order_id'],
          'message': response.data['message'],
        };
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
    required String status,
    String? trackingNumber,
    String? adminId,
  }) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.orderById(orderId),
        data: {
          'status': status,
          if (trackingNumber != null) 'tracking_number': trackingNumber,
          if (adminId != null) 'admin_id': adminId,
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
  }) async {
    try {
      // This could be a separate endpoint or calculated client-side
      // For now, we'll calculate it client-side
      double subtotal = 0;
      for (final item in items) {
        subtotal += (item['price'] as double) * (item['quantity'] as int);
      }

      final double shipping = subtotal >= 500 ? 0 : 50; // Free shipping above ₹500
      final double tax = subtotal * 0.18; // 18% GST
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