import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../config/config.dart';

class DioClient {
  static late Dio _dio;
  
  static Dio get instance => _dio;

  static void initialize() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Config.baseUrl,
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

    // Add error handling interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (DioException error, ErrorInterceptorHandler handler) {
          debugPrint('DIO Error: ${error.message}');
          debugPrint('DIO Error Response: ${error.response?.data}');
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