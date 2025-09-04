import 'dart:convert';
import 'package:http/http.dart' as http;
import '../service_locator.dart';
import '../auth/auth_service.dart';
import '../../config/config.dart';

class AppConfigService {
  static final AppConfigService _instance = AppConfigService._internal();
  factory AppConfigService() => _instance;
  AppConfigService._internal();

  static AppConfigService get instance => _instance;

  // Cached configuration
  Map<String, dynamic>? _cachedConfig;
  DateTime? _lastFetched;
  static const Duration _cacheValidityDuration = Duration(minutes: 30);

  /// Get GST rate from app configuration
  Future<double> getGSTRate() async {
    try {
      final config = await _getAppConfig();
      return (config['commission']?['gstRate'] ?? 18).toDouble();
    } catch (e) {
      print('Error getting GST rate: $e');
      return 18.0; // Default fallback
    }
  }

  /// Fetch app configuration from API
  Future<Map<String, dynamic>> _getAppConfig() async {
    // Return cached config if valid
    if (_cachedConfig != null && 
        _lastFetched != null && 
        DateTime.now().difference(_lastFetched!) < _cacheValidityDuration) {
      return _cachedConfig!;
    }

    try {
      final authService = getIt<AuthService>();
      final token = authService.authToken;
      
      if (token == null) {
        throw Exception('Authentication token not available');
      }

      final baseUrl = await Config.baseUrl;
      final response = await http.get(
        Uri.parse('$baseUrl/app-config'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          _cachedConfig = data['config'];
          _lastFetched = DateTime.now();
          return _cachedConfig!;
        } else {
          throw Exception(data['message'] ?? 'Failed to fetch app configuration');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to fetch app configuration');
      }
    } catch (e) {
      print('Error fetching app configuration: $e');
      rethrow;
    }
  }

  /// Clear cached configuration (useful for forcing refresh)
  void clearCache() {
    _cachedConfig = null;
    _lastFetched = null;
  }
}