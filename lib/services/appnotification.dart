import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trueastrotalk/services/userservice.dart';
import '../models/appnotification.dart';
import '../config/environment.dart';

class AppnotificationService {
  final String baseApiUrl = Environment.baseApiUrl;

  // Get the auth token from shared preferences
  Future<String> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_token') ?? '';
  }

  // Get all astrologers with pagination support
  Future<List<Appnotification>> getNotifications({int limit = 5, int page = 1}) async {
    final token = await UserService().getRequiredToken();
    final response = await http.get(
      Uri.parse('$baseApiUrl/notifications?page=$page&limit=$limit'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    try {
      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        // Check if response has valid structure
        if (responseData['status'] == 1 && responseData.containsKey('notifications')) {
          final notificationsData = responseData['notifications'];
          if (notificationsData['data'] != null && notificationsData['data'] is List) {
            final List<dynamic> notificationsList = notificationsData['data'];
            return notificationsList.map((item) => Appnotification.fromJson(item)).toList();
          }
        }

        // Return empty list if structure doesn't match
        return [];
      } else {
        print('API Error: ${response.statusCode} - ${response.body}');
        throw Exception('Failed to a load notifications: ${response.statusCode}');
      }
    } catch (e) {
      print('Exception in getting notifications ${response.body}');
      return [];
    }
  }

  // Get pagination information for astrologers list
  Future<Map<String, dynamic>> getNotificationsPagination({int page = 1, int limit = 5}) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseApiUrl/notifications?page=$page&limit=$limit'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);

        if (responseData['status'] == 1 && responseData.containsKey('notifications')) {
          final notificationsData = responseData['notifications'];

          // Return pagination data
          return {
            'current_page': notificationsData['current_page'] ?? 1,
            'last_page': notificationsData['last_page'] ?? 1,
            'per_page': notificationsData['per_page'] ?? 10,
            'total': notificationsData['total'] ?? 0,
            'has_more': (notificationsData['current_page'] ?? 1) < (notificationsData['last_page'] ?? 1),
          };
        }

        // Return default pagination if structure doesn't match
        return {'current_page': 1, 'last_page': 1, 'per_page': 10, 'total': 0, 'has_more': false};
      } else {
        throw Exception('Failed to load pagination: ${response.statusCode}');
      }
    } catch (e) {
      // Return default pagination on error
      return {'current_page': 1, 'last_page': 1, 'per_page': 10, 'total': 0, 'has_more': false};
    }
  }
}
