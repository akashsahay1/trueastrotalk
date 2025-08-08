import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvironmentConfig {
  static String get environment {
    return dotenv.env['APP_ENVIRONMENT'] ?? 'development';
  }

  static bool get isDevelopment => environment == 'development';
  static bool get isStaging => environment == 'staging';  
  static bool get isProduction => environment == 'production';

  // API URLs based on environment
  static String get baseUrl {
    if (isProduction) {
      return dotenv.env['API_BASE_URL_PRODUCTION'] ?? 'https://www.trueastrotalk.com/api';
    }
    
    // For development, handle localhost differently on different platforms
    if (isDevelopment) {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      if (Platform.isAndroid && !kIsWeb) {
        return dotenv.env['API_BASE_URL']?.replaceAll('localhost', '10.0.2.2') ?? 
               'http://10.0.2.2:3000/api';
      }
      // iOS simulator and physical devices can use localhost
      return dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api';
    }
    
    return dotenv.env['API_BASE_URL_PRODUCTION'] ?? 'https://www.trueastrotalk.com/api';
  }

  static String get socketUrl {
    if (isProduction) {
      return dotenv.env['SOCKET_URL_PRODUCTION'] ?? 'https://www.trueastrotalk.com';
    }
    
    if (isDevelopment) {
      // Android emulator uses 10.0.2.2 to access host machine's localhost  
      if (Platform.isAndroid && !kIsWeb) {
        return dotenv.env['SOCKET_URL']?.replaceAll('localhost', '10.0.2.2') ?? 
               'http://10.0.2.2:3000';
      }
      return dotenv.env['SOCKET_URL'] ?? 'http://localhost:3000';
    }
    
    return dotenv.env['SOCKET_URL_PRODUCTION'] ?? 'https://www.trueastrotalk.com';
  }

  // Firebase configuration
  static String get firebaseProjectId => dotenv.env['FIREBASE_PROJECT_ID'] ?? '';
  static String get firebaseAppIdAndroid => dotenv.env['FIREBASE_APP_ID_ANDROID'] ?? '';
  static String get firebaseAppIdIos => dotenv.env['FIREBASE_APP_ID_IOS'] ?? '';
  static String get firebaseApiKeyAndroid => dotenv.env['FIREBASE_API_KEY_ANDROID'] ?? '';
  static String get firebaseApiKeyIos => dotenv.env['FIREBASE_API_KEY_IOS'] ?? '';
  static String get firebaseSenderId => dotenv.env['FIREBASE_SENDER_ID'] ?? '';

  // Payment gateway
  static String get razorpayKeyId => dotenv.env['RAZORPAY_KEY_ID'] ?? '';

  // Debug settings
  static bool get enableNetworkLogging {
    return dotenv.env['ENABLE_NETWORK_LOGGING']?.toLowerCase() == 'true' || isDevelopment;
  }

  // Platform detection helpers
  static bool get isAndroid => Platform.isAndroid;
  static bool get isIOS => Platform.isIOS;
  static bool get isWindows => Platform.isWindows;
  static bool get isMacOS => Platform.isMacOS;

  static void printConfig() {
    if (kDebugMode) {
      print('🔧 Environment: $environment');
      print('🌐 Base URL: $baseUrl');
      print('📡 Socket URL: $socketUrl');
      print('📱 Platform: ${Platform.operatingSystem}');
      print('🔧 Network Logging: $enableNetworkLogging');
    }
  }
}