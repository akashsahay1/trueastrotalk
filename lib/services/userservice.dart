import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trueastrotalk/models/user.dart';

class UserService {
  static const String _userKey = 'user_data';
  static const String _tokenKey = 'user_token';
  static const String _isLoggedInKey = 'is_logged_in';

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

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isLoggedInKey) ?? false;
  }

  // Logout user
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    await prefs.remove(_tokenKey);
    await prefs.setBool(_isLoggedInKey, false);
  }
}
