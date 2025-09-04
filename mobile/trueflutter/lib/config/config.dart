import 'dart:io';
import 'package:flutter/foundation.dart';

class Config {
  // App Information
  static const String appName = 'True Astrotalk';
  static const String packageName = 'com.trueastrotalk.user';
  static const String version = '1.0.0';
  static const int buildNumber = 1;

  // Environment Mode - Change this to switch between local and production
  static const String appMode = 'production'; // 'local' or 'production'

  static bool get isDevelopment => appMode == 'local';
  static bool get isProduction => appMode == 'production';

  // Auto-detect local IP for development
  static String? _cachedLocalIP;

  static Future<String> _getLocalIP() async {
    // For development, use your Mac's actual IP address so iOS can connect
    if (isDevelopment) {
      _cachedLocalIP = '192.168.0.124'; // Your Mac's IP for iOS to connect
      return _cachedLocalIP!;
    }

    // For production, use production server
    return 'localhost';
  }

  // API Configuration - Simplified
  static Future<String> get baseUrl async {
    if (isProduction) {
      return 'https://admin.trueastrotalk.com/api';
    }

    // Development mode - connect to admin panel API
    final ip = await _getLocalIP();
    return 'http://$ip:4001/api';
  }

  static Future<String> get socketUrl async {
    if (isProduction) {
      return 'https://admin.trueastrotalk.com';
    }

    // Development mode - connect to admin panel
    final ip = await _getLocalIP();
    return 'http://$ip:4001';
  }

  // Synchronous versions for immediate use (uses cached IP or localhost)
  static String get baseUrlSync {
    if (isProduction) {
      return 'https://admin.trueastrotalk.com/api';
    }

    final ip = _cachedLocalIP ?? (Platform.isAndroid ? '10.0.2.2' : 'localhost');
    return 'http://$ip:4001/api';
  }

  static String get socketUrlSync {
    if (isProduction) {
      return 'https://admin.trueastrotalk.com';
    }

    final ip = _cachedLocalIP ?? (Platform.isAndroid ? '10.0.2.2' : 'localhost');
    return 'http://$ip:4001';
  }

  // Request timeouts (increased for E2E testing and slower networks)
  static const Duration connectTimeout = Duration(seconds: 60);
  static const Duration receiveTimeout = Duration(seconds: 60);
  static const Duration sendTimeout = Duration(seconds: 60);

  // App constants
  static const Duration splashScreenDuration = Duration(seconds: 3);
  static const Duration otpTimeout = Duration(seconds: 30);
  static const Duration sessionTimeout = Duration(minutes: 30);

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 50;

  // File upload limits
  static const int maxImageSizeBytes = 5 * 1024 * 1024; // 5MB
  static const int maxVideoSizeBytes = 50 * 1024 * 1024; // 50MB
  static const int maxDocumentSizeBytes = 10 * 1024 * 1024; // 10MB

  // Supported file formats
  static const List<String> supportedImageFormats = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> supportedVideoFormats = ['mp4', 'mov', 'avi'];
  static const List<String> supportedDocumentFormats = ['pdf', 'doc', 'docx'];

  // External service configuration
  static const String razorpayKeyId = String.fromEnvironment('RAZORPAY_KEY_ID', defaultValue: 'rzp_test_key');
  static const String agoraAppId = String.fromEnvironment('AGORA_APP_ID', defaultValue: '');
  static const String firebaseVapidKey = String.fromEnvironment('FIREBASE_VAPID_KEY', defaultValue: '');

  // Feature flags
  static const bool enablePushNotifications = true;
  static const bool enableAnalytics = true;
  static const bool enableCrashlytics = true;
  static const bool enableVideoCall = true;
  static const bool enableVoiceCall = true;
  static const bool enableChat = true;
  static const bool enableKundliGeneration = true;

  // App URLs
  static const String websiteUrl = 'https://www.trueastrotalk.com';
  static const String supportEmail = 'support@trueastrotalk.com';
  static const String privacyPolicyUrl = '$websiteUrl/privacy-policy';
  static const String termsOfServiceUrl = '$websiteUrl/terms-of-service';
  static const String helpUrl = '$websiteUrl/help';

  // Social media URLs
  static const String facebookUrl = 'https://facebook.com/trueastrotalk';
  static const String twitterUrl = 'https://twitter.com/trueastrotalk';
  static const String instagramUrl = 'https://instagram.com/trueastrotalk';
  static const String youtubeUrl = 'https://youtube.com/trueastrotalk';

  // App store URLs
  static const String playStoreUrl = 'https://play.google.com/store/apps/details?id=$packageName';
  static const String appStoreUrl = 'https://apps.apple.com/app/true-astrotalk/id123456789';

  // Debug settings
  static const bool enableLogger = appMode == 'local';
  static const bool enableNetworkLogs = appMode == 'local';
  static const bool enablePerformanceMonitoring = true;

  // Retry configuration
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 1);

  // Debug helper to print current configuration
  static Future<void> printConfig() async {
    if (isDevelopment) {
      final baseUrl = await Config.baseUrl;
      final socketUrl = await Config.socketUrl;
      if (kDebugMode) {
        debugPrint('🔧 Environment: ${isDevelopment ? 'Development' : 'Production'}');
        debugPrint('🌐 Base URL: $baseUrl');
        debugPrint('📡 Socket URL: $socketUrl');
        debugPrint('📱 Platform: ${Platform.operatingSystem}');
        if (_cachedLocalIP != null) {
          debugPrint('🏠 Detected Local IP: $_cachedLocalIP');
        }
      }
    }
  }
}
