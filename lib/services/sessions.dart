// File: lib/services/session_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/session.dart';

class SessionService {
  final String baseUrl;

  SessionService({required this.baseUrl});

  // Get auth token
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Get headers for API requests
  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
    };
  }

  // Purchase a new time block session
  Future<AstrologerSession> purchaseSession(int astrologerId, int minutes, double amount) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/api/sessions/purchase'),
      headers: headers,
      body: jsonEncode({
        'astrologer_id': astrologerId,
        'minutes': minutes,
        'amount': amount,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return AstrologerSession.fromJson(jsonDecode(response.body));
    } else if (response.statusCode == 402) {
      throw Exception('Insufficient wallet balance');
    } else {
      throw Exception('Failed to purchase session: ${response.body}');
    }
  }

  // Get all active sessions for the current user
  Future<List<AstrologerSession>> getActiveSessions() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/api/sessions/active'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => AstrologerSession.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load active sessions');
    }
  }

  // Get session details by ID
  Future<AstrologerSession> getSessionById(int sessionId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/api/sessions/$sessionId'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return AstrologerSession.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to get session details');
    }
  }

  // Get active session for a specific astrologer (if exists)
  Future<AstrologerSession?> getActiveSessionForAstrologer(int astrologerId) async {
    try {
      final sessions = await getActiveSessions();
      for (var session in sessions) {
        if (session.astrologerId == astrologerId && session.isActive) {
          return session;
        }
      }
      return null; // No active session found
    } catch (e) {
      print('Error getting active session: $e');
      return null;
    }
  }

  // Start a call within a session
  Future<SessionCall> startSessionCall(int sessionId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/api/sessions/$sessionId/call/start'),
      headers: headers,
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return SessionCall.fromJson(jsonDecode(response.body));
    } else if (response.statusCode == 403) {
      throw Exception('No time remaining in this session');
    } else {
      throw Exception('Failed to start call: ${response.body}');
    }
  }

  // End a call and update remaining time
  Future<AstrologerSession> endSessionCall(int callId, int durationMinutes) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/api/sessions/call/$callId/end'),
      headers: headers,
      body: jsonEncode({
        'duration_minutes': durationMinutes,
      }),
    );

    if (response.statusCode == 200) {
      return AstrologerSession.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to end call: ${response.body}');
    }
  }

  // Check if any time is available for calling an astrologer
  Future<bool> hasCallTimeAvailable(int astrologerId) async {
    try {
      final session = await getActiveSessionForAstrologer(astrologerId);
      return session != null && session.remainingMinutes > 0;
    } catch (e) {
      return false;
    }
  }

  // Get available call time in minutes
  Future<int> getAvailableCallTime(int astrologerId) async {
    try {
      final session = await getActiveSessionForAstrologer(astrologerId);
      return session?.remainingMinutes ?? 0;
    } catch (e) {
      return 0;
    }
  }
}
