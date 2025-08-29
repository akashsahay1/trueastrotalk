import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../themes/app_colors.dart';
import '../../services/api/error_reporting_service.dart';

class AppError {
  final String userMessage;
  final String? technicalDetails;
  final ErrorType type;
  final String? actionText;
  final VoidCallback? action;

  AppError({
    required this.userMessage,
    this.technicalDetails,
    required this.type,
    this.actionText,
    this.action,
  });
}

enum ErrorType {
  network,
  authentication,
  validation,
  payment,
  server,
  permission,
  notFound,
  general,
}

class ErrorHandler {
  /// Convert any exception to user-friendly AppError
  static AppError handleError(dynamic error, {String? context}) {
    if (error is DioException) {
      return _handleDioError(error, context);
    }

    final errorString = error.toString().toLowerCase();
    
    // Network connectivity errors
    if (_isNetworkError(errorString)) {
      return AppError(
        userMessage: 'No internet connection. Please check your network and try again.',
        technicalDetails: error.toString(),
        type: ErrorType.network,
        actionText: 'Retry',
      );
    }

    // Authentication errors
    if (_isAuthError(errorString)) {
      return AppError(
        userMessage: 'Authentication failed. Please log in again.',
        technicalDetails: error.toString(),
        type: ErrorType.authentication,
        actionText: 'Login',
      );
    }

    // Google Sign-In specific errors
    if (_isGoogleSignInError(errorString)) {
      return _handleGoogleSignInError(errorString, error.toString());
    }

    // Payment errors
    if (_isPaymentError(errorString)) {
      return AppError(
        userMessage: 'Payment failed. Please try again or contact support.',
        technicalDetails: error.toString(),
        type: ErrorType.payment,
        actionText: 'Retry',
      );
    }

    // Server errors
    if (_isServerError(errorString)) {
      return AppError(
        userMessage: 'Server is temporarily unavailable. Please try again later.',
        technicalDetails: error.toString(),
        type: ErrorType.server,
        actionText: 'Retry',
      );
    }

    // Permission errors
    if (_isPermissionError(errorString)) {
      return AppError(
        userMessage: 'Permission denied. Please check your settings.',
        technicalDetails: error.toString(),
        type: ErrorType.permission,
        actionText: 'Settings',
      );
    }

    // Validation errors (usually should not reach here, but just in case)
    if (_isValidationError(errorString)) {
      return AppError(
        userMessage: 'Please check your input and try again.',
        technicalDetails: error.toString(),
        type: ErrorType.validation,
      );
    }

    // Default fallback for unknown errors
    return AppError(
      userMessage: _getContextualMessage(context),
      technicalDetails: error.toString(),
      type: ErrorType.general,
      actionText: 'Try Again',
    );
  }

  /// Handle DioException specifically
  static AppError _handleDioError(DioException error, String? context) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return AppError(
          userMessage: 'Connection timed out. Please check your internet and try again.',
          technicalDetails: error.toString(),
          type: ErrorType.network,
          actionText: 'Retry',
        );

      case DioExceptionType.connectionError:
        return AppError(
          userMessage: 'Unable to connect to server. Please check your internet connection.',
          technicalDetails: error.toString(),
          type: ErrorType.network,
          actionText: 'Retry',
        );

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        if (statusCode == 401) {
          return AppError(
            userMessage: 'Session expired. Please log in again.',
            technicalDetails: error.toString(),
            type: ErrorType.authentication,
            actionText: 'Login',
          );
        } else if (statusCode == 403) {
          return AppError(
            userMessage: 'Access denied. You don\'t have permission to perform this action.',
            technicalDetails: error.toString(),
            type: ErrorType.permission,
          );
        } else if (statusCode == 404) {
          return AppError(
            userMessage: 'The requested information could not be found.',
            technicalDetails: error.toString(),
            type: ErrorType.notFound,
          );
        } else if (statusCode != null && statusCode >= 500) {
          return AppError(
            userMessage: 'Server error. Our team has been notified. Please try again later.',
            technicalDetails: error.toString(),
            type: ErrorType.server,
            actionText: 'Retry',
          );
        }
        break;

      case DioExceptionType.cancel:
        return AppError(
          userMessage: 'Request was cancelled.',
          technicalDetails: error.toString(),
          type: ErrorType.general,
        );

      case DioExceptionType.unknown:
      case DioExceptionType.badCertificate:
        return AppError(
          userMessage: 'Connection failed. Please try again.',
          technicalDetails: error.toString(),
          type: ErrorType.network,
          actionText: 'Retry',
        );
    }

    return AppError(
      userMessage: _getContextualMessage(context),
      technicalDetails: error.toString(),
      type: ErrorType.general,
      actionText: 'Try Again',
    );
  }

  /// Handle Google Sign-In errors gracefully
  static AppError _handleGoogleSignInError(String errorString, String technicalDetails) {
    if (errorString.contains('cancelled') || errorString.contains('aborted_by_user')) {
      // User intentionally cancelled - don't show as error
      return AppError(
        userMessage: '', // Empty message means don't show any error
        technicalDetails: technicalDetails,
        type: ErrorType.general,
      );
    }

    if (errorString.contains('network_error') || errorString.contains('sign_in_failed')) {
      return AppError(
        userMessage: 'Google Sign-In failed. Please check your internet connection and try again.',
        technicalDetails: technicalDetails,
        type: ErrorType.network,
        actionText: 'Retry',
      );
    }

    if (errorString.contains('sign_in_required')) {
      return AppError(
        userMessage: 'Google Sign-In is required to continue.',
        technicalDetails: technicalDetails,
        type: ErrorType.authentication,
        actionText: 'Sign In',
      );
    }

    return AppError(
      userMessage: 'Google Sign-In encountered an issue. Please try again.',
      technicalDetails: technicalDetails,
      type: ErrorType.authentication,
      actionText: 'Try Again',
    );
  }

  /// Get contextual error messages based on operation
  static String _getContextualMessage(String? context) {
    switch (context?.toLowerCase()) {
      case 'login':
        return 'Login failed. Please check your credentials and try again.';
      case 'registration':
      case 'signup':
        return 'Registration failed. Please try again or contact support.';
      case 'profile':
        return 'Failed to update profile. Please try again.';
      case 'payment':
        return 'Payment could not be processed. Please try again.';
      case 'wallet':
        return 'Wallet operation failed. Please try again.';
      case 'consultation':
        return 'Consultation could not be loaded. Please try again.';
      case 'chat':
        return 'Chat service is temporarily unavailable. Please try again.';
      case 'call':
        return 'Call could not be initiated. Please check your connection and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /// Check if error is network-related
  static bool _isNetworkError(String error) {
    return error.contains('socketexception') ||
           error.contains('network') ||
           error.contains('timeout') ||
           error.contains('connection') ||
           error.contains('unreachable') ||
           error.contains('dns') ||
           error.contains('httpsexception');
  }

  /// Check if error is authentication-related
  static bool _isAuthError(String error) {
    return error.contains('unauthorized') ||
           error.contains('authentication') ||
           error.contains('token') ||
           error.contains('session') ||
           error.contains('401');
  }

  /// Check if error is Google Sign-In related
  static bool _isGoogleSignInError(String error) {
    return error.contains('google') ||
           error.contains('sign_in') ||
           error.contains('gms') ||
           error.contains('play_services');
  }

  /// Check if error is payment-related
  static bool _isPaymentError(String error) {
    return error.contains('payment') ||
           error.contains('razorpay') ||
           error.contains('transaction') ||
           error.contains('billing');
  }

  /// Check if error is server-related
  static bool _isServerError(String error) {
    return error.contains('500') ||
           error.contains('502') ||
           error.contains('503') ||
           error.contains('server') ||
           error.contains('internal error');
  }

  /// Check if error is permission-related
  static bool _isPermissionError(String error) {
    return error.contains('permission') ||
           error.contains('forbidden') ||
           error.contains('403') ||
           error.contains('access denied');
  }

  /// Check if error is validation-related
  static bool _isValidationError(String error) {
    return error.contains('validation') ||
           error.contains('invalid') ||
           error.contains('required') ||
           error.contains('format');
  }

  /// Show error to user with appropriate UI
  static void showError(BuildContext context, AppError error) {
    if (error.userMessage.isEmpty) {
      // Don't show anything for intentional cancellations
      return;
    }

    final snackBar = SnackBar(
      content: Text(error.userMessage),
      backgroundColor: _getErrorColor(error.type),
      behavior: SnackBarBehavior.floating,
      action: error.action != null && error.actionText != null
          ? SnackBarAction(
              label: error.actionText!,
              onPressed: error.action!,
              textColor: Colors.white,
            )
          : null,
      duration: const Duration(seconds: 4),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  /// Get appropriate color for error type
  static Color _getErrorColor(ErrorType type) {
    switch (type) {
      case ErrorType.network:
        return AppColors.warning;
      case ErrorType.authentication:
        return AppColors.primary;
      case ErrorType.payment:
        return AppColors.error;
      case ErrorType.server:
        return AppColors.error;
      case ErrorType.permission:
        return AppColors.warning;
      case ErrorType.validation:
        return AppColors.info;
      case ErrorType.notFound:
        return AppColors.warning;
      case ErrorType.general:
        return AppColors.error;
    }
  }

  /// Log error for debugging (in development) and crash reporting (in production)
  static void logError(AppError error, {StackTrace? stackTrace, Map<String, dynamic>? additionalData, String? context, String? screenName}) {
    // In development: print to console
    debugPrint('=== ERROR ===');
    debugPrint('Type: ${error.type}');
    debugPrint('User Message: ${error.userMessage}');
    debugPrint('Technical Details: ${error.technicalDetails}');
    if (additionalData != null) {
      debugPrint('Additional Data: $additionalData');
    }
    if (stackTrace != null) {
      debugPrint('Stack Trace: $stackTrace');
    }
    debugPrint('=============');

    // Report error to backend monitoring system
    _reportErrorToBackend(error, stackTrace, context, screenName);
  }

  /// Report error to backend monitoring system
  static void _reportErrorToBackend(AppError error, StackTrace? stackTrace, String? context, String? screenName) {
    try {
      // Determine severity based on error type
      String severity = 'medium';
      if (error.type == ErrorType.server || error.type == ErrorType.payment) {
        severity = 'critical';
      } else if (error.type == ErrorType.authentication || error.type == ErrorType.permission) {
        severity = 'high';
      } else if (error.type == ErrorType.network || error.type == ErrorType.validation) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      ErrorReportingService.reportError(
        errorType: error.type.toString().split('.').last,
        errorMessage: error.userMessage,
        technicalDetails: error.technicalDetails,
        stackTrace: stackTrace?.toString(),
        screenName: screenName,
        context: context,
        severity: severity,
      );
    } catch (e) {
      // Don't let error reporting fail the main flow
      debugPrint('Failed to report error to backend: $e');
    }
  }
}