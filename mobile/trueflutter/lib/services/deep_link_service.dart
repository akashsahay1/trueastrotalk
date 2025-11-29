import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';

class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  StreamSubscription<Uri>? _linkSubscription;
  late AppLinks _appLinks;

  void initialize() {
    _appLinks = AppLinks();
    _initializeAppLinks();
  }

  void _initializeAppLinks() {
    // Handle app launch from link when app is closed
    _handleInitialLink();

    // Handle app navigation when app is already running
    _linkSubscription = _appLinks.uriLinkStream.listen(
      _handleIncomingLink,
      onError: (err) {
        debugPrint('Deep link error: $err');
      },
    );
  }

  Future<void> _handleInitialLink() async {
    try {
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _handleIncomingLink(initialUri);
      }
    } catch (e) {
      debugPrint('Failed to get initial link: $e');
    }
  }

  void _handleIncomingLink(Uri uri) {
    debugPrint('Deep link received: $uri');

    // Handle other deep links here as needed
    // Password reset links are no longer supported (OTP-based auth only)
  }

  void dispose() {
    _linkSubscription?.cancel();
  }
}

// Global navigator key for accessing context from services
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
