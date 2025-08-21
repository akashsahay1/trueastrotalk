import 'package:dio/dio.dart';
import 'endpoints.dart';

class NotificationsApiService {
  final Dio _dio;

  NotificationsApiService(this._dio);

  // Send email notification
  Future<Map<String, dynamic>> sendEmailNotification({
    required String type,
    required String recipientEmail,
    required String recipientName,
    required Map<String, dynamic> data,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.emailNotifications,
        data: {
          'type': type,
          'recipient_email': recipientEmail,
          'recipient_name': recipientName,
          'data': data,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'message_id': response.data['message_id'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to send email',
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

  // Send push notification
  Future<Map<String, dynamic>> sendPushNotification({
    required String type,
    required String recipientId,
    required String recipientType,
    required String title,
    required String message,
    Map<String, dynamic>? data,
    String sound = 'default',
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.pushNotifications,
        data: {
          'type': type,
          'recipient_id': recipientId,
          'recipient_type': recipientType,
          'title': title,
          'message': message,
          if (data != null) 'data': data,
          'sound': sound,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'notification_id': response.data['notification_id'],
          'sent_via_fcm': response.data['sent_via_fcm'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to send notification',
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

  // Get user notifications
  Future<Map<String, dynamic>> getNotifications({
    required String recipientId,
    String recipientType = 'user',
    bool? isRead,
    String? type,
    int limit = 50,
    int page = 1,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {
        'recipientId': recipientId,
        'recipientType': recipientType,
        'limit': limit,
        'page': page,
      };

      if (isRead != null) queryParams['isRead'] = isRead.toString();
      if (type != null) queryParams['type'] = type;

      final response = await _dio.get(
        ApiEndpoints.pushNotifications,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'notifications': response.data['notifications'],
          'unread_count': response.data['unread_count'],
          'pagination': response.data['pagination'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch notifications',
          'notifications': [],
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
        'notifications': [],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
        'notifications': [],
      };
    }
  }

  // Mark notifications as read
  Future<Map<String, dynamic>> markNotificationsAsRead({
    required String recipientId,
    List<String>? notificationIds,
    bool markAll = false,
  }) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.pushNotifications,
        data: {
          'recipient_id': recipientId,
          if (notificationIds != null) 'notification_ids': notificationIds,
          'mark_all': markAll,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'updated_count': response.data['updated_count'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to mark notifications as read',
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