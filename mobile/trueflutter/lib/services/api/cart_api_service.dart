import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
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
        // Server returns cart data under 'cart' key with 'items' sub-key
        final cartData = response.data['cart'];
        final List<dynamic> cartItemsJson = cartData?['items'] ?? [];
        
        // Parse raw JSON data into CartItem objects
        final List<CartItem> cartItems = cartItemsJson
            .map<CartItem>((itemData) => CartItem.fromApiJson(itemData as Map<String, dynamic>))
            .toList();

        return {
          'success': true,
          'cart_items': cartItems,
          'cart_summary': cartData?['totals'],
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
    debugPrint('🛒 CartApiService.addToCart called with userId: $userId, productId: $productId, quantity: $quantity');
    debugPrint('🛒 API endpoint: ${ApiEndpoints.cart}');
    
    try {
      final requestData = {
        'user_id': userId,
        'product_id': productId,
        'quantity': quantity,
      };
      debugPrint('🛒 API addToCart request data: $requestData');
      debugPrint('🛒 About to make POST request to ${ApiEndpoints.cart}');
      
      final response = await _dio.post(
        ApiEndpoints.cart,
        data: requestData,
      );
      
      debugPrint('🛒 API addToCart response: ${response.statusCode} - ${response.data}');

      if ((response.statusCode == 200 || response.statusCode == 201) && response.data['success']) {
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
      debugPrint('🛒 DioException in addToCart: ${e.type} - ${e.message}');
      debugPrint('🛒 DioException response: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      debugPrint('🛒 Unexpected error in addToCart: $e');
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