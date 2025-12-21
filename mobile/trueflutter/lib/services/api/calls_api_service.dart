import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../models/call.dart';
import 'endpoints.dart';

class CallsApiService {
  final Dio _dio;

  CallsApiService(this._dio);

  // Get user's call sessions
  Future<Map<String, dynamic>> getCallSessions({
    required String userId,
    String userType = 'user',
    String? status,
    int limit = 20,
    int page = 1,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.calls,
        queryParameters: {
          'userId': userId,
          'userType': userType,
          if (status != null) 'status': status,
          'limit': limit,
          'page': page,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> sessionsJson = response.data['call_sessions'] ?? [];
        final List<CallSession> sessions = sessionsJson
            .map((json) => CallSession.fromJson(json))
            .toList();

        return {
          'success': true,
          'call_sessions': sessions,
          'pagination': response.data['pagination'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch call sessions',
          'call_sessions': <CallSession>[],
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
        'call_sessions': <CallSession>[],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
        'call_sessions': <CallSession>[],
      };
    }
  }

  // Create new call session
  Future<Map<String, dynamic>> createCallSession({
    required String userId,
    required String astrologerId,
    String callType = 'voice', // 'voice' or 'video'
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.calls,
        data: {
          'user_id': userId,
          'astrologer_id': astrologerId,
          'call_type': callType,
        },
      );

      debugPrint('📞 Call API Response: status=${response.statusCode}, data=${response.data}');

      // Handle both 200 (existing session) and 201 (new session)
      if ((response.statusCode == 200 || response.statusCode == 201) && response.data['success'] == true) {
        final CallSession session = CallSession.fromJson(response.data['session']);
        return {
          'success': true,
          'session': session,
          'session_id': response.data['session_id'],
          'message': response.data['message'],
        };
      } else {
        debugPrint('❌ Call API Error: ${response.data}');
        return {
          'success': false,
          'error': response.data['error'] ?? response.data['message'] ?? 'Failed to create call session',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Call API DioException: ${e.message}, response: ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data?['message'] ?? e.response?.data?['error'] ?? _handleDioError(e),
      };
    } catch (e) {
      debugPrint('❌ Call API Unexpected error: $e');
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  // Get call session details
  Future<Map<String, dynamic>> getCallSession({
    required String sessionId,
    required String userId,
    String userType = 'user',
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.callById(sessionId),
        queryParameters: {
          'userId': userId,
          'userType': userType,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        final CallSession session = CallSession.fromJson(response.data['session']);
        return {
          'success': true,
          'session': session,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Call session not found',
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

  // Update call session status
  Future<Map<String, dynamic>> updateCallSession({
    required String sessionId,
    required String action, // 'ring', 'answer', 'reject', 'end', 'rate', 'missed'
    required String userId,
    required String userType,
    String? connectionId,
    int? rating,
  }) async {
    try {
      final Map<String, dynamic> data = {
        'action': action,
        'user_id': userId,
        'user_type': userType,
      };

      if (connectionId != null) data['connection_id'] = connectionId;
      if (rating != null) data['rating'] = rating;

      final response = await _dio.put(
        ApiEndpoints.callById(sessionId),
        data: data,
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'session': response.data['session'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to update call session',
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

  // Ring call (initiate call)
  Future<Map<String, dynamic>> ringCall({
    required String sessionId,
    required String userId,
    required String userType,
  }) async {
    return updateCallSession(
      sessionId: sessionId,
      action: 'ring',
      userId: userId,
      userType: userType,
    );
  }

  // Answer call
  Future<Map<String, dynamic>> answerCall({
    required String sessionId,
    required String userId,
    required String userType,
    String? connectionId,
  }) async {
    return updateCallSession(
      sessionId: sessionId,
      action: 'answer',
      userId: userId,
      userType: userType,
      connectionId: connectionId,
    );
  }

  // Reject call
  Future<Map<String, dynamic>> rejectCall({
    required String sessionId,
    required String userId,
    required String userType,
  }) async {
    return updateCallSession(
      sessionId: sessionId,
      action: 'reject',
      userId: userId,
      userType: userType,
    );
  }

  // End call
  Future<Map<String, dynamic>> endCall({
    required String sessionId,
    required String userId,
    required String userType,
  }) async {
    return updateCallSession(
      sessionId: sessionId,
      action: 'end',
      userId: userId,
      userType: userType,
    );
  }

  // Rate call
  Future<Map<String, dynamic>> rateCall({
    required String sessionId,
    required String userId,
    required String userType,
    required int rating, // 1-5
  }) async {
    return updateCallSession(
      sessionId: sessionId,
      action: 'rate',
      userId: userId,
      userType: userType,
      rating: rating,
    );
  }

  // Mark call as missed
  Future<Map<String, dynamic>> markCallAsMissed({
    required String sessionId,
    required String userId,
    required String userType,
  }) async {
    return updateCallSession(
      sessionId: sessionId,
      action: 'missed',
      userId: userId,
      userType: userType,
    );
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