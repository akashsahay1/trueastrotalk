import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final String baseUrl;

  ApiService({required this.baseUrl});

  // Get authentication token
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Get headers for API requests
  Future<Map<String, String>> getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
    };
  }

  // Generic GET request
  Future<dynamic> get(String endpoint) async {
    final headers = await getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/$endpoint'),
      headers: headers,
    );

    return _handleResponse(response);
  }

  // Generic POST request
  Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );

    return _handleResponse(response);
  }

  // Generic PUT request
  Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );

    return _handleResponse(response);
  }

  // Generic DELETE request
  Future<dynamic> delete(String endpoint) async {
    final headers = await getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/$endpoint'),
      headers: headers,
    );

    return _handleResponse(response);
  }

  // Handle API response
  dynamic _handleResponse(http.Response response) {
    // Handle different status codes
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Success
      if (response.body.isEmpty) return null;

      try {
        return jsonDecode(response.body);
      } catch (e) {
        // Return raw body if not JSON
        return response.body;
      }
    } else if (response.statusCode == 401) {
      // Unauthorized - handle token expiration
      throw Exception('Unauthorized: Your session has expired. Please login again.');
    } else if (response.statusCode == 402) {
      // Payment required (for wallet)
      throw Exception('Insufficient funds in wallet.');
    } else if (response.statusCode == 403) {
      // Forbidden
      throw Exception('Access denied: You do not have permission for this action.');
    } else if (response.statusCode == 404) {
      // Not found
      throw Exception('Resource not found.');
    } else if (response.statusCode >= 500) {
      // Server error
      throw Exception('Server error occurred. Please try again later.');
    } else {
      // Other errors
      try {
        final errorData = jsonDecode(response.body);
        final errorMessage = errorData['message'] ?? 'Unknown error occurred.';
        throw Exception(errorMessage);
      } catch (e) {
        // Fallback error message
        throw Exception('Error ${response.statusCode}: ${response.reasonPhrase}');
      }
    }
  }

  // Update FCM token
  Future<void> updateFcmToken(String token) async {
    await post('api/notifications/token', body: {'fcm_token': token});
  }
}
