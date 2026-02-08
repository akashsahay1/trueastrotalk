import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/config.dart';

/// Callback type for auth failure events (user deleted, session expired, etc.)
typedef AuthFailureCallback = Future<void> Function(String reason);

class DioClient {
  static late Dio _dio;
  static bool _isRefreshing = false;
  static final List<Function> _pendingRequests = [];

  /// Callback to be invoked when authentication fails (user deleted, token invalid, etc.)
  static AuthFailureCallback? onAuthFailure;

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
        onError: (DioException error, ErrorInterceptorHandler handler) async {
          debugPrint('DIO Error: ${error.message}');
          debugPrint('DIO Error Response: ${error.response?.data}');

          // Check if this is a USER_NOT_FOUND error (user deleted from database)
          if (_isUserNotFoundError(error)) {
            debugPrint('🚨 User not found in database - triggering auth failure');
            await _handleAuthFailure('User account not found');
            handler.next(error);
            return;
          }

          // Handle 401 Unauthorized - try to refresh token
          if (error.response?.statusCode == 401) {
            debugPrint('🔄 Got 401 error - attempting token refresh');

            // If already refreshing, queue the request
            if (_isRefreshing) {
              debugPrint('⏳ Token refresh already in progress, queuing request');
              return;
            }

            _isRefreshing = true;

            try {
              // Get refresh token from storage
              final prefs = await SharedPreferences.getInstance();
              final refreshToken = prefs.getString('refresh_token');

              if (refreshToken == null) {
                debugPrint('❌ No refresh token available - user needs to login');
                await _handleAuthFailure('Session expired');
                handler.next(error);
                return;
              }

              // Attempt to refresh the token
              final response = await Dio().post(
                '${Config.baseUrlSync}/auth/refresh',
                data: {'refresh_token': refreshToken},
              );

              if (response.statusCode == 200) {
                final data = response.data['data'];
                final newToken = data['access_token'] as String;
                final newRefreshToken = data['refresh_token'] as String;
                debugPrint('✅ Token refreshed successfully');

                // Update the tokens in storage and Dio client
                await prefs.setString('auth_token', newToken);
                await prefs.setString('refresh_token', newRefreshToken);
                setAuthToken(newToken);

                // Retry the original request with new token
                final requestOptions = error.requestOptions;
                requestOptions.headers['Authorization'] = 'Bearer $newToken';

                final retryResponse = await _dio.request(
                  requestOptions.path,
                  options: Options(
                    method: requestOptions.method,
                    headers: requestOptions.headers,
                  ),
                  data: requestOptions.data,
                  queryParameters: requestOptions.queryParameters,
                );

                handler.resolve(retryResponse);
              } else {
                debugPrint('❌ Token refresh failed with status: ${response.statusCode}');
                await _handleAuthFailure('Session expired');
                handler.next(error);
              }
            } catch (refreshError) {
              debugPrint('❌ Token refresh failed: $refreshError');
              await _handleAuthFailure('Session expired');
              handler.next(error);
            } finally {
              _isRefreshing = false;
              // Process any pending requests
              for (final request in _pendingRequests) {
                request();
              }
              _pendingRequests.clear();
            }
          } else {
            handler.next(error);
          }
        },
      ),
    );
  }

  /// Check if the error indicates the user was not found (deleted from database)
  /// or account is inactive (banned/deleted status)
  static bool _isUserNotFoundError(DioException error) {
    final statusCode = error.response?.statusCode;
    // Check for 401 or 404 with user-related error codes
    if (statusCode == 401 || statusCode == 404) {
      final data = error.response?.data;
      if (data is Map) {
        final errorCode = data['error']?.toString() ?? '';
        if (errorCode == 'USER_NOT_FOUND' ||
            errorCode == 'ACCOUNT_NOT_FOUND' ||
            errorCode == 'ACCOUNT_INACTIVE' ||
            data['message']?.toString().contains('not found') == true ||
            data['message']?.toString().contains('deleted') == true) {
          return true;
        }
      }
    }
    return false;
  }

  /// Handle authentication failure - clear data and notify callback
  static Future<void> _handleAuthFailure(String reason) async {
    debugPrint('🔐 Handling auth failure: $reason');

    // Clear auth token from Dio
    clearAuthToken();

    // Clear stored auth data
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('refresh_token');
      await prefs.remove('user_data');
      debugPrint('🗑️ Cleared stored auth data');
    } catch (e) {
      debugPrint('⚠️ Failed to clear stored auth data: $e');
    }

    // Notify callback if set
    if (onAuthFailure != null) {
      try {
        await onAuthFailure!(reason);
      } catch (e) {
        debugPrint('⚠️ Auth failure callback error: $e');
      }
    }
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