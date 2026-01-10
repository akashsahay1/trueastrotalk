import 'dart:io';
import 'package:dio/dio.dart';
import '../../models/chat.dart';
import 'endpoints.dart';

class ChatApiService {
  final Dio _dio;

  ChatApiService(this._dio);

  // Get user's chat sessions
  Future<Map<String, dynamic>> getChatSessions({
    required String userId,
    String userType = 'customer',
    String? status,
    int limit = 20,
    int page = 1,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.chat,
        queryParameters: {
          'userId': userId,
          'userType': userType,
          if (status != null) 'status': status,
          'limit': limit,
          'page': page,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> sessionsJson = response.data['chat_sessions'] ?? [];
        final List<ChatSession> sessions = sessionsJson
            .map((json) => ChatSession.fromJson(json))
            .toList();

        return {
          'success': true,
          'chat_sessions': sessions,
          'pagination': response.data['pagination'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch chat sessions',
          'chat_sessions': <ChatSession>[],
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
        'chat_sessions': <ChatSession>[],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
        'chat_sessions': <ChatSession>[],
      };
    }
  }

  // Create new chat session
  Future<Map<String, dynamic>> createChatSession({
    required String userId,
    required String astrologerId,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.chat,
        data: {
          'user_id': userId,
          'astrologer_id': astrologerId,
        },
      );

      if (response.statusCode == 201 && response.data['success']) {
        final ChatSession session = ChatSession.fromJson(response.data['session']);
        return {
          'success': true,
          'session': session,
          'session_id': response.data['session_id'],
          'message': response.data['message'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to create chat session',
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

  // Get chat session details
  Future<Map<String, dynamic>> getChatSession({
    required String sessionId,
    required String userId,
    String userType = 'customer',
    int messagesLimit = 50,
    int messagesPage = 1,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.chatById(sessionId),
        queryParameters: {
          'userId': userId,
          'userType': userType,
          'messagesLimit': messagesLimit,
          'messagesPage': messagesPage,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        final ChatSession session = ChatSession.fromJson(response.data['session']);
        return {
          'success': true,
          'session': session,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Chat session not found',
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

  // Update chat session status
  Future<Map<String, dynamic>> updateChatSession({
    required String sessionId,
    required String action, // 'accept', 'reject', 'end'
    required String userId,
    required String userType,
  }) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.chatById(sessionId),
        data: {
          'action': action,
          'user_id': userId,
          'user_type': userType,
        },
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
          'error': response.data['error'] ?? 'Failed to update chat session',
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

  // Send message
  Future<Map<String, dynamic>> sendMessage({
    required String sessionId,
    required String senderId,
    required String senderName,
    required String senderType,
    String messageType = 'text',
    String? content,
    String? imageUrl,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.chatMessages,
        data: {
          'session_id': sessionId,
          'sender_id': senderId,
          'sender_name': senderName,
          'sender_type': senderType,
          'message_type': messageType,
          if (content != null) 'content': content,
          if (imageUrl != null) 'image_url': imageUrl,
        },
      );

      if (response.statusCode == 201 && response.data['success']) {
        final ChatMessage message = ChatMessage.fromJson(response.data['message_data']);
        return {
          'success': true,
          'message': message,
          'message_data': response.data['message_data'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to send message',
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

  // Get messages for session
  Future<Map<String, dynamic>> getMessages({
    required String sessionId,
    String? userId,
    String? userType,
    int limit = 50,
    int page = 1,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {
        'sessionId': sessionId,
        'limit': limit,
        'page': page,
      };

      if (userId != null) queryParams['userId'] = userId;
      if (userType != null) queryParams['userType'] = userType;

      final response = await _dio.get(
        ApiEndpoints.chatMessages,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> messagesJson = response.data['messages'] ?? [];
        final List<ChatMessage> messages = messagesJson
            .map((json) => ChatMessage.fromJson(json))
            .toList();

        return {
          'success': true,
          'messages': messages,
          'pagination': response.data['pagination'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch messages',
          'messages': <ChatMessage>[],
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
        'messages': <ChatMessage>[],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
        'messages': <ChatMessage>[],
      };
    }
  }

  // Mark messages as read
  Future<Map<String, dynamic>> markMessagesAsRead({
    required List<String> messageIds,
    required String userId,
    required String userType,
  }) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.chatMessages,
        data: {
          'message_ids': messageIds,
          'user_id': userId,
          'user_type': userType,
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
          'error': response.data['error'] ?? 'Failed to mark messages as read',
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

  // Upload chat attachment
  Future<Map<String, dynamic>> uploadAttachment({
    required File file,
    required String sessionId,
  }) async {
    try {
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
        'session_id': sessionId,
      });

      final response = await _dio.post(
        ApiEndpoints.chatAttachments,
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
        ),
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'image_url': response.data['data']['image_url'],
          'file_path': response.data['data']['file_path'],
          'file_id': response.data['data']['file_id'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to upload attachment',
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