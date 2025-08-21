import 'package:dio/dio.dart';
import '../../models/cart.dart';
import 'endpoints.dart';

class CartApiService {
  final Dio _dio;

  CartApiService(this._dio);

  // Get user's cart
  Future<Map<String, dynamic>> getCart(String userId) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.cart,
        queryParameters: {'userId': userId},
      );

      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> cartItemsJson = response.data['cart_items'] ?? [];
        final List<CartItem> cartItems = cartItemsJson
            .map((json) => CartItem.fromApiJson(json))
            .toList();

        return {
          'success': true,
          'cart_items': cartItems,
          'cart_summary': response.data['cart_summary'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch cart',
          'cart_items': <CartItem>[],
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
        'cart_items': <CartItem>[],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
        'cart_items': <CartItem>[],
      };
    }
  }

  // Add item to cart
  Future<Map<String, dynamic>> addToCart({
    required String userId,
    required String productId,
    required int quantity,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.cart,
        data: {
          'user_id': userId,
          'product_id': productId,
          'quantity': quantity,
        },
      );

      if (response.statusCode == 201 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'cart_item_id': response.data['cart_item_id'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to add item to cart',
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

  // Update cart item quantity
  Future<Map<String, dynamic>> updateCartItem({
    required String cartItemId,
    required String userId,
    required int quantity,
  }) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.cart,
        data: {
          'cart_item_id': cartItemId,
          'user_id': userId,
          'quantity': quantity,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to update cart item',
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

  // Remove item from cart
  Future<Map<String, dynamic>> removeFromCart({
    required String cartItemId,
    required String userId,
  }) async {
    try {
      final response = await _dio.delete(
        ApiEndpoints.cart,
        queryParameters: {
          'cartItemId': cartItemId,
          'userId': userId,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to remove item from cart',
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

  // Clear entire cart
  Future<Map<String, dynamic>> clearCart(String userId) async {
    try {
      final response = await _dio.delete(
        ApiEndpoints.cart,
        queryParameters: {
          'userId': userId,
          'clearAll': 'true',
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to clear cart',
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