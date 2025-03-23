import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trueastrotalk/config/environment.dart';

class ApiService {
  // Base URL for your Laravel API
  final String baseUrl = Environment.baseApiUrl;

  // Get the auth token from shared preferences
  Future<String> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_token') ?? '';
  }

  // Helper method for GET requests
  Future<Map<String, dynamic>> get(String endpoint) async {
    final Uri uri = Uri.parse('$baseUrl/$endpoint');
    final token = await getAuthToken();

    try {
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Helper method for POST requests
  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> data) async {
    final token = await getAuthToken();
    final Uri uri = Uri.parse('$baseUrl/$endpoint');

    try {
      final response = await http.post(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Helper method for PUT requests
  Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> data, {String? token}) async {
    final Uri uri = Uri.parse('$baseUrl/$endpoint');

    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      final response = await http.put(
        uri,
        headers: headers,
        body: jsonEncode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Helper method to handle HTTP responses
  Map<String, dynamic> _handleResponse(http.Response response) {
    try {
      final data = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data is Map<String, dynamic>
            ? data
            : {
                'success': true,
                'data': data,
              };
      } else {
        return {
          'success': false,
          'status_code': response.statusCode,
          'message': data['message'] ?? 'An error occurred',
          'errors': data['errors'] ?? {},
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error parsing response: ${e.toString()}',
      };
    }
  }
}
