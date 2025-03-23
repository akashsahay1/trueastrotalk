import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/astrologer.dart';
import '../config/environment.dart';

class AstrologerService {
  final String baseUrl = Environment.baseApiUrl;

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
        Uri.parse('$baseUrl/astrologers?page=$page&limit=$limit'),
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
      return _getDummyAstrologers();
    }
  }

  // Get astrologers by category
  Future<List<Astrologer>> getAstrologersByCategory(String category, {int limit = 10, int page = 1}) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/astrologers/category/$category?page=$page&limit=$limit'),
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
      // Filter dummy data by category
      final allAstrologers = _getDummyAstrologers();
      return allAstrologers.where((astrologer) => astrologer.speciality.toLowerCase() == category.toLowerCase() || astrologer.astroType?.toLowerCase() == category.toLowerCase()).toList();
    }
  }

  // Search astrologers
  Future<List<Astrologer>> searchAstrologers(String query) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/astrologers/search?query=$query'),
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
      // Search in dummy data
      final allAstrologers = _getDummyAstrologers();
      final lowercaseQuery = query.toLowerCase();

      return allAstrologers.where((astrologer) => astrologer.name.toLowerCase().contains(lowercaseQuery) || astrologer.speciality.toLowerCase().contains(lowercaseQuery) || astrologer.languages.toLowerCase().contains(lowercaseQuery)).toList();
    }
  }

  // Get astrologer details by ID
  Future<Astrologer> getAstrologerById(int id) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/astrologers/$id'),
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
      final allAstrologers = _getDummyAstrologers();
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
      return _getDummyAstrologers().take(limit).toList();
    }
  }

  // Get pagination information for astrologers list
  Future<Map<String, dynamic>> getAstrologersPagination({int page = 1, int limit = 5}) async {
    final token = await getAuthToken();

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/astrologers?page=$page&limit=$limit'),
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

  // Dummy data for fallback or development
  List<Astrologer> _getDummyAstrologers() {
    return [
      Astrologer(
        id: 1,
        name: 'Acharya Vinod',
        speciality: 'Vedic Astrology',
        experience: '15 years',
        rating: 4.8,
        price: '₹40/min',
        image: 'assets/images/avatar.jpg',
        isOnline: true,
        languages: 'Hindi, English, Bangla',
        astroType: 'Vedic',
        userAbout: 'Expert in Vedic astrology with 15+ years of experience',
        userExperience: '15 years',
        userPhone: '1234567890',
      ),
      Astrologer(
        id: 2,
        name: 'Sunita Sharma',
        speciality: 'Tarot Reading',
        experience: '10 years',
        rating: 4.6,
        price: '₹35/min',
        image: 'assets/images/avatar.jpg',
        isOnline: true,
        languages: 'Hindi, English, Bangla',
        astroType: 'Tarot',
        userAbout: 'Professional tarot card reader and spiritual guide',
        userExperience: '10 years',
        userPhone: '2345678901',
      ),
      Astrologer(
        id: 3,
        name: 'Guru Patel',
        speciality: 'Numerology',
        experience: '8 years',
        rating: 4.5,
        price: '₹30/min',
        image: 'assets/images/avatar.jpg',
        isOnline: false,
        languages: 'Hindi, English',
        astroType: 'Numerology',
        userAbout: 'Numbers expert who can help you understand your life path',
        userExperience: '8 years',
        userPhone: '3456789012',
      ),
      Astrologer(
        id: 4,
        name: 'Dr. Meena Kapoor',
        speciality: 'Palmistry',
        experience: '12 years',
        rating: 4.9,
        price: '₹45/min',
        image: 'assets/images/avatar.jpg',
        isOnline: true,
        languages: 'Hindi, Bangla',
        astroType: 'Palmistry',
        userAbout: 'Expert in reading palm lines and predicting future',
        userExperience: '12 years',
        userPhone: '4567890123',
      ),
      Astrologer(
        id: 5,
        name: 'Pandit Rajesh',
        speciality: 'Vaastu Shastra',
        experience: '20 years',
        rating: 4.7,
        price: '₹50/min',
        image: 'assets/images/avatar.jpg',
        isOnline: false,
        languages: 'Hindi, English',
        astroType: 'Vaastu',
        userAbout: 'Vaastu expert who can help improve your home energy',
        userExperience: '20 years',
        userPhone: '5678901234',
      ),
    ];
  }
}
