import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/astrologer.dart';
import '../config/environment.dart';

class AstrologerService {
  final String baseApiUrl = Environment.baseApiUrl;

  // Get the auth token from shared preferences
  Future<String> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token') ?? '';
  }

  // Get all astrologers with pagination support
  Future<List<Astrologer>> getAstrologers({int limit = 5, int page = 1}) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseApiUrl/astrologers?page=$page&limit=$limit'),
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
            return astrologersList.map((item) => Astrologer.fromJson(item)).toList();
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
  Future<List<Astrologer>> getAstrologersByCategory(String category, {int limit = 10, int page = 1}) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseApiUrl/astrologers/category/$category?page=$page&limit=$limit'),
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
          return astrologersList.map((item) => Astrologer.fromJson(item)).toList();
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
  Future<List<Astrologer>> searchAstrologers(String query) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseApiUrl/astrologers/search?query=$query'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);

        if (responseData['status'] == 1 && responseData.containsKey('data')) {
          final List<dynamic> astrologersList = responseData['data'];
          return astrologersList.map((item) => Astrologer.fromJson(item)).toList();
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
  Future<Astrologer> getAstrologerById(int id) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseApiUrl/astrologers/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);

        if (responseData['status'] == 1 && responseData.containsKey('data')) {
          return Astrologer.fromJson(responseData['data']);
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

  // Get featured/top astrologers
  Future<List<Astrologer>> getFeaturedAstrologers({int limit = 5}) async {
    try {
      final allAstrologers = await getAstrologers(limit: 20);

      // Sort by rating descending and take the top 'limit' astrologers
      allAstrologers.sort((a, b) => b.rating.compareTo(a.rating));
      return allAstrologers.take(limit).toList();
    } catch (e) {
      return [];
    }
  }

  // Get pagination information for astrologers list
  Future<Map<String, dynamic>> getAstrologersPagination({int page = 1, int limit = 5}) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseApiUrl/astrologers?page=$page&limit=$limit'),
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
}
