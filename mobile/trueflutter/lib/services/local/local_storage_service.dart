import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocalStorageService {
  late SharedPreferences _prefs;
  static const _secureStorage = FlutterSecureStorage(aOptions: AndroidOptions());

  // Keys for storage
  static const String _authTokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';
  static const String _userTypeKey = 'user_type';
  static const String _isLoggedInKey = 'is_logged_in';
  static const String _userDataKey = 'user_data';
  static const String _astrologerOptionsKey = 'astrologer_options';
  static const String _astrologerOptionsCacheTimeKey = 'astrologer_options_cache_time';

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Auth Token Methods (secure storage)
  Future<void> saveAuthToken(String token) async {
    await _secureStorage.write(key: _authTokenKey, value: token);
  }

  Future<String?> getAuthToken() async {
    return await _secureStorage.read(key: _authTokenKey);
  }

  Future<void> removeAuthToken() async {
    await _secureStorage.delete(key: _authTokenKey);
  }

  // User Login State (regular storage)
  Future<void> setLoggedIn(bool isLoggedIn) async {
    await _prefs.setBool(_isLoggedInKey, isLoggedIn);
  }

  bool isLoggedIn() {
    return _prefs.getBool(_isLoggedInKey) ?? false;
  }

  // User ID
  Future<void> saveUserId(String userId) async {
    await _prefs.setString(_userIdKey, userId);
  }

  String? getUserId() {
    return _prefs.getString(_userIdKey);
  }

  // User Type
  Future<void> saveUserType(String userType) async {
    await _prefs.setString(_userTypeKey, userType);
  }

  String? getUserType() {
    return _prefs.getString(_userTypeKey);
  }

  // User Data (JSON string)
  Future<void> saveUserData(String userData) async {
    await _prefs.setString(_userDataKey, userData);
  }

  String? getUserData() {
    return _prefs.getString(_userDataKey);
  }

  // Clear all user data (logout)
  Future<void> clearUserData() async {
    await _secureStorage.delete(key: _authTokenKey);
    await _prefs.remove(_userIdKey);
    await _prefs.remove(_userTypeKey);
    await _prefs.remove(_isLoggedInKey);
    await _prefs.remove(_userDataKey);
    // Also clear astrologer options cache on logout
    await clearAstrologerOptionsCache();
  }

  // Generic methods for other data
  Future<void> saveString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }

  Future<void> saveBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  Future<void> saveInt(String key, int value) async {
    await _prefs.setInt(key, value);
  }

  int? getInt(String key) {
    return _prefs.getInt(key);
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  // Astrologer Options Cache (with expiration)
  Future<void> saveAstrologerOptions(Map<String, List<String>> options) async {
    final jsonString = _encodeAstrologerOptions(options);
    await _prefs.setString(_astrologerOptionsKey, jsonString);
    await _prefs.setInt(_astrologerOptionsCacheTimeKey, DateTime.now().millisecondsSinceEpoch);
  }

  Map<String, List<String>>? getCachedAstrologerOptions({Duration maxAge = const Duration(hours: 24)}) {
    final cacheTimeMillis = _prefs.getInt(_astrologerOptionsCacheTimeKey);
    if (cacheTimeMillis == null) {
      return null;
    }

    final cacheTime = DateTime.fromMillisecondsSinceEpoch(cacheTimeMillis);
    final isExpired = DateTime.now().difference(cacheTime) > maxAge;

    if (isExpired) {
      // Cache expired, remove it
      _prefs.remove(_astrologerOptionsKey);
      _prefs.remove(_astrologerOptionsCacheTimeKey);
      return null;
    }

    final jsonString = _prefs.getString(_astrologerOptionsKey);
    if (jsonString == null) {
      return null;
    }

    final decoded = _decodeAstrologerOptions(jsonString);
    return decoded;
  }

  Future<void> clearAstrologerOptionsCache() async {
    await _prefs.remove(_astrologerOptionsKey);
    await _prefs.remove(_astrologerOptionsCacheTimeKey);
  }

  // Helper methods for encoding/decoding astrologer options
  String _encodeAstrologerOptions(Map<String, List<String>> options) {
    return '${options['languages']?.join('|') ?? ''}|||${options['skills']?.join('|') ?? ''}';
  }

  Map<String, List<String>> _decodeAstrologerOptions(String encoded) {
    final parts = encoded.split('|||');
    return {'languages': parts.isNotEmpty && parts[0].isNotEmpty ? parts[0].split('|') : <String>[], 'skills': parts.length > 1 && parts[1].isNotEmpty ? parts[1].split('|') : <String>[]};
  }
}
