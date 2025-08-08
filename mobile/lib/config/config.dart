import 'environment_config.dart';

class Config {
  // App Information
  static const String appName = 'True Astrotalk';
  static const String packageName = 'com.trueastrotalk.user';
  static const String version = '1.0.0';
  static const int buildNumber = 1;

  // API Configuration - Using environment-based configuration
  static String get baseUrl => EnvironmentConfig.baseUrl;
  static String get socketUrl => EnvironmentConfig.socketUrl;

  // Request timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);

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
  static const bool enableLogger = false; // Set to true for debugging
  static const bool enableNetworkLogs = false; // Set to true for debugging
  static const bool enablePerformanceMonitoring = true;

  // Retry configuration
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 1);
}
