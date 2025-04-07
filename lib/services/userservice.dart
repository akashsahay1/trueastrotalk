import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/models/user.dart';

class UserService {
  static const String _userKey = 'user_data';
  static const String _tokenKey = 'user_token';
  static const String _isLoggedInKey = 'is_logged_in';
  static String _baseApiUrl = Environment.baseApiUrl;

  // Save user data and token
  Future<void> saveUserSession(User user, String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    await prefs.setString(_tokenKey, token);
    await prefs.setBool(_isLoggedInKey, true);
  }

  // Get current user
  Future<User?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userData = prefs.getString(_userKey);
    if (userData != null) {
      return User.fromJson(jsonDecode(userData));
    }
    return null;
  }

  // Get token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Get required token
  Future<String> getRequiredToken() async {
    final token = await getToken();
    if (token == null) {
      throw Exception('Authentication token not found');
    }
    return token;
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isLoggedInKey) ?? false;
  }

  // Get all astrologers with pagination support
  Future<List<User>> getAstrologers({int limit = 5, int page = 1}) async {
    final token = await getRequiredToken();

    try {
      final response = await http.get(
        Uri.parse('$_baseApiUrl/astrologers?page=$page&limit=$limit'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        // Parse the response
        final Map<String, dynamic> responseData = json.decode(response.body);

        // Check if response has valid structure
        if (responseData['status'] == 1 && responseData.containsKey('astrologers')) {
          // Get the astrologers data object which contains the pagination and data array
          final astrologersData = responseData['astrologers'];

          // Check if the data array exists and is a list
          if (astrologersData['data'] != null && astrologersData['data'] is List) {
            // Map each JSON object to an Astrologer object
            final List<dynamic> astrologersList = astrologersData['data'];
            return astrologersList.map((item) => User.fromJson(item)).toList();
          }
        }

        // Return empty list if structure doesn't match
        return [];
      } else {
        print('API Error: ${response.statusCode} - ${response.body}');
        throw Exception('Failed to load astrologers: ${response.statusCode}');
      }
    } catch (e) {
      print('Exception in getAstrologers: $e');
      // Return dummy data when API fails or during development
      return [];
    }
  }

  // Get astrologers by category
  Future<List<User>> getAstrologersByCategory(String category, {int limit = 10, int page = 1}) async {
    final token = await getRequiredToken();

    try {
      final response = await http.get(
        Uri.parse('$_baseApiUrl/astrologers/category/$category?page=$page&limit=$limit'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);

        // Structure might be different for categories, adjust as needed
        if (responseData['status'] == 1 && responseData.containsKey('data')) {
          final List<dynamic> astrologersList = responseData['data'];
          return astrologersList.map((item) => User.fromJson(item)).toList();
        }

        return [];
      } else {
        throw Exception('Failed to load astrologers by category: ${response.statusCode}');
      }
    } catch (e) {
      return [];
    }
  }

  // Search astrologers
  Future<List<User>> searchAstrologers(String query) async {
    final token = await getRequiredToken();

    try {
      final response = await http.get(
        Uri.parse('$_baseApiUrl/astrologers/search?query=$query'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);

        if (responseData['status'] == 1 && responseData.containsKey('data')) {
          final List<dynamic> astrologersList = responseData['data'];
          return astrologersList.map((item) => User.fromJson(item)).toList();
        }

        return [];
      } else {
        throw Exception('Failed to search astrologers: ${response.statusCode}');
      }
    } catch (e) {
      return [];
    }
  }

  // Get astrologer details by ID
  Future<User> getAstrologerById(int id) async {
    final token = await getRequiredToken();

    try {
      final response = await http.get(
        Uri.parse('$_baseApiUrl/astrologers/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);

        if (responseData['status'] == 1 && responseData.containsKey('data')) {
          return User.fromJson(responseData['data']);
        } else {
          throw Exception('Astrologer data is null or invalid format');
        }
      } else {
        throw Exception('Failed to load astrologer details: ${response.statusCode}');
      }
    } catch (e) {
      // Return a dummy astrologer with the requested ID
      final allAstrologers = [];
      return allAstrologers.firstWhere((a) => a.id == id, orElse: () => allAstrologers.first);
    }
  }

  // Get pagination information for astrologers list
  Future<Map<String, dynamic>> getAstrologersPagination({int page = 1, int limit = 5}) async {
    final token = await getRequiredToken();

    try {
      final response = await http.get(
        Uri.parse('$_baseApiUrl/astrologers?page=$page&limit=$limit'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);

        if (responseData['status'] == 1 && responseData.containsKey('astrologers')) {
          final astrologersData = responseData['astrologers'];

          // Return pagination data
          return {
            'current_page': astrologersData['current_page'] ?? 1,
            'last_page': astrologersData['last_page'] ?? 1,
            'per_page': astrologersData['per_page'] ?? 10,
            'total': astrologersData['total'] ?? 0,
            'has_more': (astrologersData['current_page'] ?? 1) < (astrologersData['last_page'] ?? 1),
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

  // Logout user
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    await prefs.remove(_tokenKey);
    await prefs.setBool(_isLoggedInKey, false);
  }
}
