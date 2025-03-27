import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:trueastrotalk/config/environment.dart';

class TokenService {
  // Singleton pattern
  static final TokenService _instance = TokenService._internal();
  factory TokenService() => _instance;
  TokenService._internal();

  // Function to refresh and update FCM token
  Future<String?> refreshAndUpdateFCMToken() async {
    try {
      // Get current token
      String? currentToken = await FirebaseMessaging.instance.getToken();

      if (currentToken == null || currentToken.isEmpty) {
        print('Unable to get FCM token');
        return null;
      }

      // Save to shared preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', currentToken);
      print('FCM token refreshed: $currentToken');

      // Send to backend if user is logged in
      final userToken = prefs.getString('user_token');
      if (userToken != null) {
        await _sendTokenToBackend(currentToken, userToken);
      }

      return currentToken;
    } catch (e) {
      print('Error refreshing FCM token: $e');
      return null;
    }
  }

  // Function to send token to backend
  Future<bool> _sendTokenToBackend(String fcmToken, String userToken) async {
    try {
      final response = await http.post(
        Uri.parse('${Environment.baseApiUrl}/user/update-fcm-token'),
        headers: {
          'Authorization': 'Bearer $userToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': fcmToken,
          'platform': Platform.isIOS ? 'ios' : 'android',
          'model': Platform.localeName,
          'os_version': Platform.operatingSystemVersion,
          'app_version': '1.0.0',
        }),
      );

      if (response.statusCode == 200) {
        print('FCM token successfully sent to backend');
        return true;
      } else {
        print('Failed to send FCM token to backend: ${response.statusCode}');
        print('Response: ${response.body}');
        return false;
      }
    } catch (e) {
      print('Error sending FCM token to backend: $e');
      return false;
    }
  }

  // Function to clear token from backend
  Future<bool> removeFCMTokenFromBackend() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');
      final fcmToken = prefs.getString('fcm_token');

      if (userToken == null || fcmToken == null) {
        return false;
      }

      final response = await http.post(
        Uri.parse('${Environment.baseApiUrl}/user/remove-fcm-token'),
        headers: {
          'Authorization': 'Bearer $userToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'fcm_token': fcmToken,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error removing FCM token: $e');
      return false;
    }
  }

  // Function to get the saved FCM token
  Future<String?> getSavedFCMToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('fcm_token');
  }
}
