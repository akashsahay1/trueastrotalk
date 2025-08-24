import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../config/config.dart';

class DioClient {
  static late Dio _dio;
  
  static Dio get instance => _dio;

  static Future<void> initialize() async {
    // Initialize IP detection for development
    await Config.baseUrl; // This triggers IP detection and caching
    
    _dio = Dio(
      BaseOptions(
        baseUrl: Config.baseUrlSync, // Use sync version after IP is cached
        connectTimeout: Config.connectTimeout,
        receiveTimeout: Config.receiveTimeout,
        sendTimeout: Config.sendTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add custom selective logging interceptor (only in debug mode)
    if (kDebugMode) {
      _dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
            // Only log essential request info - much cleaner
            final path = options.path.split('?')[0]; // Remove query params for cleaner logs
            debugPrint('🔄 ${options.method} $path');
            handler.next(options);
          },
          onResponse: (Response response, ResponseInterceptorHandler handler) {
            // Only log status for errors or important endpoints
            final path = response.requestOptions.path.split('?')[0];
            if (response.statusCode != 200 && response.statusCode != 201) {
              debugPrint('⚠️ ${response.statusCode} $path');
            }
            handler.next(response);
          },
        ),
      );
    }

    // Add error handling interceptor with automatic token refresh
    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (DioException error, ErrorInterceptorHandler handler) {
          debugPrint('DIO Error: ${error.message}');
          debugPrint('DIO Error Response: ${error.response?.data}');
          
          // Handle 401 Unauthorized - token might be expired
          if (error.response?.statusCode == 401) {
            debugPrint('🔄 Token may be expired - clearing auth data');
            // Clear the token to force re-login
            clearAuthToken();
          }
          
          handler.next(error);
        },
      ),
    );
  }

  // Method to update authorization header
  static void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  // Method to clear authorization header
  static void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
}