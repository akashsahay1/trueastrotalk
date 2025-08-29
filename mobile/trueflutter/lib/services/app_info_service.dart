import 'package:package_info_plus/package_info_plus.dart';
import 'package:flutter/foundation.dart';

class AppInfoService {
  static PackageInfo? _packageInfo;
  
  /// Initialize package info
  static Future<void> initialize() async {
    try {
      _packageInfo = await PackageInfo.fromPlatform();
      debugPrint('📱 App Info Initialized: ${_packageInfo?.appName} v${_packageInfo?.version}');
    } catch (e) {
      debugPrint('❌ Failed to initialize app info: $e');
    }
  }
  
  /// Get app version
  static String get appVersion {
    return _packageInfo?.version ?? '1.0.0';
  }
  
  /// Get app build number
  static String get buildNumber {
    return _packageInfo?.buildNumber ?? '1';
  }
  
  /// Get app name
  static String get appName {
    return _packageInfo?.appName ?? 'TrueAstroTalk';
  }
  
  /// Get package name
  static String get packageName {
    return _packageInfo?.packageName ?? 'com.trueastrotalk.app';
  }
  
  /// Get full version string (version + build)
  static String get fullVersion {
    return '$appVersion+$buildNumber';
  }
  
  /// Get platform-specific app version string
  static String get platformVersion {
    final platform = _getPlatform();
    return '$appVersion+$buildNumber ($platform)';
  }
  
  /// Get current platform
  static String _getPlatform() {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'android';
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      return 'ios';
    } else {
      return 'web';
    }
  }
  
  /// Check if app info is initialized
  static bool get isInitialized => _packageInfo != null;
  
  /// Extract screen name from a route name
  static String? extractScreenName(String? routeName) {
    if (routeName == null || routeName.isEmpty) return null;
    
    // Remove leading slash
    String screenName = routeName.startsWith('/') ? routeName.substring(1) : routeName;
    
    // Handle nested routes (e.g., "/home/profile" -> "profile")
    if (screenName.contains('/')) {
      screenName = screenName.split('/').last;
    }
    
    // Convert to readable format (e.g., "product_details" -> "Product Details")
    screenName = screenName.replaceAll('_', ' ').replaceAll('-', ' ');
    screenName = screenName.split(' ').map((word) => 
      word.isEmpty ? word : word[0].toUpperCase() + word.substring(1)
    ).join(' ');
    
    return screenName.isEmpty ? null : screenName;
  }
}