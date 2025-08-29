import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../service_locator.dart';
import '../auth/auth_service.dart';
import '../network/dio_client.dart';
import '../app_info_service.dart';
import 'endpoints.dart';

class ErrorReportingService {
  static final AuthService _authService = getIt<AuthService>();

  /// Report an error to the backend for monitoring
  static Future<void> reportError({
    required String errorType,
    required String errorMessage,
    String? technicalDetails,
    String? stackTrace,
    String? screenName,
    String? context,
    String severity = 'medium',
  }) async {
    try {
      // Don't report errors in debug mode to avoid spam
      if (kDebugMode) {
        return;
      }

      // Get user info if available
      final userInfo = await _getUserInfo();

      final errorData = {
        'error_type': errorType,
        'error_message': errorMessage,
        'technical_details': technicalDetails,
        'stack_trace': stackTrace,
        'screen_name': screenName,
        'context': context,
        'severity': severity,
        'user_id': userInfo['user_id'],
        'user_type': userInfo['user_type'],
      };

      await DioClient.instance.post(
        ApiEndpoints.reportError,
        data: errorData,
        options: Options(
          headers: {
            'x-app-version': AppInfoService.fullVersion,
            'x-platform': _getPlatform(),
          },
        ),
      );

      debugPrint('✅ Error reported successfully');
    } catch (e) {
      // Don't throw errors when reporting errors to avoid infinite loops
      debugPrint('❌ Failed to report error: $e');
    }
  }

  /// Report performance metric to backend
  static Future<void> reportPerformanceMetric({
    required String metricType,
    required double value,
    Map<String, dynamic>? details,
  }) async {
    try {
      // Don't report in debug mode
      if (kDebugMode) {
        return;
      }

      final metricData = {
        'metric_type': metricType,
        'value': value,
        'details': details ?? {},
      };

      await DioClient.instance.post(
        ApiEndpoints.reportPerformance,
        data: metricData,
      );

      debugPrint('✅ Performance metric reported: $metricType = $value');
    } catch (e) {
      debugPrint('❌ Failed to report performance metric: $e');
    }
  }

  /// Report app crash
  static Future<void> reportAppCrash({
    required String crashMessage,
    String? stackTrace,
    String? screenName,
  }) async {
    await reportError(
      errorType: 'general',
      errorMessage: 'App crashed: $crashMessage',
      technicalDetails: stackTrace,
      screenName: screenName,
      context: 'app_crash',
      severity: 'critical',
    );

    await reportPerformanceMetric(
      metricType: 'app_crashes',
      value: 1,
      details: {
        'crash_message': crashMessage,
        'screen': screenName,
      },
    );
  }

  /// Report network error with response time
  static Future<void> reportNetworkError({
    required String endpoint,
    required String errorMessage,
    int? responseTime,
    int? statusCode,
  }) async {
    await reportError(
      errorType: 'network',
      errorMessage: 'Network error on $endpoint: $errorMessage',
      technicalDetails: 'Status: $statusCode, Response Time: ${responseTime}ms',
      context: 'network_request',
      severity: statusCode != null && statusCode >= 500 ? 'high' : 'medium',
    );

    if (responseTime != null) {
      await reportPerformanceMetric(
        metricType: 'response_time',
        value: responseTime.toDouble(),
        details: {
          'endpoint': endpoint,
          'status_code': statusCode,
          'success': statusCode != null && statusCode < 400,
        },
      );
    }
  }

  /// Report authentication error
  static Future<void> reportAuthError({
    required String errorMessage,
    String? technicalDetails,
    String? context,
  }) async {
    await reportError(
      errorType: 'authentication',
      errorMessage: errorMessage,
      technicalDetails: technicalDetails,
      context: context ?? 'authentication',
      severity: 'high',
    );
  }

  /// Report payment error
  static Future<void> reportPaymentError({
    required String errorMessage,
    String? transactionId,
    double? amount,
  }) async {
    await reportError(
      errorType: 'payment',
      errorMessage: errorMessage,
      technicalDetails: 'Transaction ID: $transactionId, Amount: $amount',
      context: 'payment',
      severity: 'critical',
    );
  }

  /// Get user information for error reporting
  static Future<Map<String, String?>> _getUserInfo() async {
    try {
      final user = _authService.currentUser;
      return {
        'user_id': user?.id,
        'user_type': user?.role.toString().split('.').last,
      };
    } catch (e) {
      return {
        'user_id': null,
        'user_type': 'unknown',
      };
    }
  }

  /// Get current platform
  static String _getPlatform() {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'android';
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      return 'ios';
    } else {
      return 'web';
    }
  }
}