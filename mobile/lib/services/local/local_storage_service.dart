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
}
