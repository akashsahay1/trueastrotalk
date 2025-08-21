import 'package:dio/dio.dart';
import '../../models/product.dart';
import 'endpoints.dart';

class ProductsApiService {
  final Dio _dio;

  ProductsApiService(this._dio);

  // Get all products with filtering
  Future<Map<String, dynamic>> getProducts({
    String? category,
    String? search,
    double? minPrice,
    double? maxPrice,
    bool? inStock,
    String sortBy = 'created_at',
    String sortOrder = 'desc',
    int limit = 20,
    int page = 1,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {
        'sortBy': sortBy,
        'sortOrder': sortOrder,
        'limit': limit,
        'page': page,
      };

      if (category != null) queryParams['category'] = category;
      if (search != null) queryParams['search'] = search;
      if (minPrice != null) queryParams['minPrice'] = minPrice;
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice;
      if (inStock != null) queryParams['inStock'] = inStock;

      final response = await _dio.get(
        ApiEndpoints.products,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> productsJson = response.data['products'];
        final List<Product> products = productsJson
            .map((json) => Product.fromJson(json))
            .toList();

        return {
          'success': true,
          'products': products,
          'categories': response.data['categories'] ?? [],
          'pagination': response.data['pagination'],
          'filters': response.data['filters'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch products',
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

  // Get single product details
  Future<Map<String, dynamic>> getProduct(String productId) async {
    try {
      final response = await _dio.get(ApiEndpoints.productById(productId));

      if (response.statusCode == 200 && response.data['success']) {
        final Product product = Product.fromJson(response.data['product']);
        return {
          'success': true,
          'product': product,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Product not found',
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

  // Get featured products
  Future<Map<String, dynamic>> getFeaturedProducts({int limit = 10}) async {
    return getProducts(limit: limit, sortBy: 'is_featured', sortOrder: 'desc');
  }

  // Get bestseller products
  Future<Map<String, dynamic>> getBestsellerProducts({int limit = 10}) async {
    return getProducts(limit: limit, sortBy: 'is_bestseller', sortOrder: 'desc');
  }

  // Search products
  Future<Map<String, dynamic>> searchProducts(String query, {int limit = 20}) async {
    return getProducts(search: query, limit: limit);
  }

  // Get products by category
  Future<Map<String, dynamic>> getProductsByCategory(String category, {int limit = 20}) async {
    return getProducts(category: category, limit: limit);
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