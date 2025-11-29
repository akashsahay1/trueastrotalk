import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:convert';
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
    // First, try to extract backend error message
    String? backendMessage = _extractBackendErrorMessage(error);

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

        // Handle 429 (Rate Limiting) specially to include retry time
        if (statusCode == 429) {
          // Rate limiting - use backend message but enhance with retry time if available
          String message = backendMessage ?? 'Too many attempts. Please wait before trying again.';

          // Try to extract retryAfter from response and enhance the message
          final responseData = error.response?.data;
          if (responseData is Map<String, dynamic> && responseData.containsKey('retryAfter')) {
            final retryAfter = responseData['retryAfter'];
            if (retryAfter != null && backendMessage != null && !backendMessage.contains('second') && !backendMessage.contains('minute') && !backendMessage.contains('hour')) {
              // Only enhance if backend message doesn't already include time
              final retrySeconds = retryAfter is int ? retryAfter :
                                  retryAfter is double ? retryAfter.toInt() :
                                  int.tryParse(retryAfter.toString()) ?? 0;

              if (retrySeconds > 0) {
                // Append specific wait time to backend message
                if (retrySeconds < 60) {
                  message = '$backendMessage ($retrySeconds second${retrySeconds == 1 ? '' : 's'})';
                } else if (retrySeconds < 3600) {
                  final minutes = (retrySeconds / 60).ceil();
                  message = '$backendMessage ($minutes minute${minutes == 1 ? '' : 's'})';
                } else {
                  final hours = (retrySeconds / 3600).ceil();
                  message = '$backendMessage ($hours hour${hours == 1 ? '' : 's'})';
                }
              }
            }
          }

          return AppError(
            userMessage: message,
            technicalDetails: error.toString(),
            type: ErrorType.validation,
            actionText: 'OK',
          );
        }

        // If we have a backend error message, use it for other client errors (400-499)
        if (backendMessage != null && statusCode != null && statusCode >= 400 && statusCode < 500) {
          return AppError(
            userMessage: backendMessage,
            technicalDetails: error.toString(),
            type: _getErrorTypeFromStatusCode(statusCode),
            actionText: 'Try Again',
          );
        }

        // Handle specific status codes with fallback messages
        if (statusCode == 401) {
          return AppError(
            userMessage: backendMessage ?? 'Session expired. Please log in again.',
            technicalDetails: error.toString(),
            type: ErrorType.authentication,
            actionText: 'Login',
          );
        } else if (statusCode == 403) {
          return AppError(
            userMessage: backendMessage ?? 'Access denied. You don\'t have permission to perform this action.',
            technicalDetails: error.toString(),
            type: ErrorType.permission,
          );
        } else if (statusCode == 404) {
          return AppError(
            userMessage: backendMessage ?? 'The requested information could not be found.',
            technicalDetails: error.toString(),
            type: ErrorType.notFound,
          );
        } else if (statusCode != null && statusCode >= 500) {
          return AppError(
            userMessage: backendMessage ?? 'Server error. Our team has been notified. Please try again later.',
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

    // If we have a backend message but no specific status code handling, use it
    if (backendMessage != null) {
      return AppError(
        userMessage: backendMessage,
        technicalDetails: error.toString(),
        type: ErrorType.general,
        actionText: 'Try Again',
      );
    }

    return AppError(
      userMessage: _getContextualMessage(context),
      technicalDetails: error.toString(),
      type: ErrorType.general,
      actionText: 'Try Again',
    );
  }

  /// Extract error message from backend response
  static String? _extractBackendErrorMessage(DioException error) {
    try {
      final responseData = error.response?.data;
      if (responseData == null) return null;

      // Handle different response formats
      if (responseData is Map<String, dynamic>) {
        // Priority 1: Check for 'message' field (our backend format)
        if (responseData.containsKey('message') && responseData['message'] is String) {
          final message = responseData['message'] as String;
          if (message.isNotEmpty) {
            return message;
          }
        }
        
        // Priority 2: Check for 'error' field and convert if it's an error code
        if (responseData.containsKey('error') && responseData['error'] is String) {
          final error = responseData['error'] as String;
          if (error.isNotEmpty) {
            // Check if it looks like an error code (all caps with underscores)
            if (_isErrorCode(error)) {
              // Convert error code to user-friendly message
              return _convertErrorCodeToMessage(error);
            } else if (!error.contains('_') && error.length > 5) {
              // If error is already a readable message
              return error;
            }
          }
        }

        // Priority 3: Check for error details array
        if (responseData.containsKey('details') && responseData['details'] is List) {
          final details = responseData['details'] as List;
          if (details.isNotEmpty && details[0] is String) {
            return details[0] as String;
          }
        }
      }

      // Handle string responses
      if (responseData is String && responseData.isNotEmpty) {
        try {
          // Try to parse as JSON
          final jsonData = json.decode(responseData);
          if (jsonData is Map<String, dynamic> && jsonData.containsKey('message')) {
            return jsonData['message'] as String?;
          }
        } catch (_) {
          // If it's not JSON, treat as plain string message
          if (responseData.length < 200) {  // Reasonable message length
            return responseData;
          }
        }
      }
    } catch (e) {
      // If extraction fails, return null to fall back to default messages
      debugPrint('Error extracting backend message: $e');
    }

    return null;
  }

  /// Check if string looks like an error code (all caps with underscores)
  static bool _isErrorCode(String value) {
    if (value.isEmpty) return false;
    for (int i = 0; i < value.length; i++) {
      final char = value[i];
      if (!((char.codeUnitAt(0) >= 65 && char.codeUnitAt(0) <= 90) || char == '_')) {
        return false;
      }
    }
    return true;
  }

  /// Convert backend error codes to user-friendly messages
  static String _convertErrorCodeToMessage(String errorCode) {
    switch (errorCode.toUpperCase()) {
      case 'USER_EXISTS':
      case 'EMAIL_EXISTS':
        return 'An account with this email already exists. Try logging in instead.';
      case 'PHONE_EXISTS':
        return 'An account with this phone number already exists. Try logging in instead.';
      case 'WEAK_PASSWORD':
        return 'Password is too weak. Please use a stronger password.';
      case 'INVALID_EMAIL':
        return 'Please enter a valid email address.';
      case 'INVALID_PHONE':
        return 'Please enter a valid phone number.';
      case 'MISSING_REQUIRED_FIELDS':
        return 'Please fill in all required fields.';
      case 'INVALID_USER_TYPE':
        return 'Please select a valid user type.';
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password. Please check and try again.';
      case 'INVALID_CURRENT_PASSWORD':
        return 'Current password is incorrect. Please check and try again.';
      case 'ACCOUNT_NOT_FOUND':
        return 'No account found with this information.';
      case 'ACCOUNT_DISABLED':
        return 'Your account has been disabled. Please contact support.';
      case 'TOO_MANY_REQUESTS':
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many attempts. Please wait and try again later.';
      case 'VALIDATION_ERROR':
        return 'Please check your information and try again.';
      default:
        // For unknown error codes, make them more readable
        return errorCode.toLowerCase()
            .replaceAll('_', ' ')
            .split(' ')
            .map((word) => word.isNotEmpty ? word[0].toUpperCase() + word.substring(1) : word)
            .join(' ');
    }
  }

  /// Get error type based on status code
  static ErrorType _getErrorTypeFromStatusCode(int statusCode) {
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode == 401) return ErrorType.authentication;
      if (statusCode == 403) return ErrorType.permission;
      if (statusCode == 404) return ErrorType.notFound;
      if (statusCode == 422) return ErrorType.validation;
      return ErrorType.validation; // Most 4xx are validation/client errors
    } else if (statusCode >= 500) {
      return ErrorType.server;
    }
    return ErrorType.general;
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