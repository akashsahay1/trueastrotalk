import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import '../screens/reset_password_screen.dart';
import 'service_locator.dart';
import 'api/user_api_service.dart';

class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  StreamSubscription<Uri>? _linkSubscription;
  late UserApiService _userApiService;
  late AppLinks _appLinks;

  void initialize() {
    _userApiService = getIt<UserApiService>();
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
    
    // Handle password reset links
    if (_isPasswordResetLink(uri)) {
      _handlePasswordResetLink(uri);
    }
  }

  bool _isPasswordResetLink(Uri uri) {
    return (uri.scheme == 'trueastrotalk' && uri.host == 'reset-password') ||
           (uri.scheme == 'https' && 
            uri.host == 'trueastrotalk.com' && 
            uri.path.startsWith('/reset-password'));
  }

  void _handlePasswordResetLink(Uri uri) {
    final token = uri.queryParameters['token'];
    
    if (token == null || token.isEmpty) {
      debugPrint('Password reset link missing token');
      return;
    }

    // Navigate to password reset screen
    _navigateToPasswordReset(token);
  }

  void _navigateToPasswordReset(String token) {
    // Get the current context from navigator
    final context = navigatorKey.currentContext;
    if (context != null) {
      // First verify the token
      _verifyTokenAndNavigate(context, token);
    }
  }

  Future<void> _verifyTokenAndNavigate(BuildContext context, String token) async {
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      final result = await _userApiService.verifyResetToken(token);
      
      // Dismiss loading dialog
      if (context.mounted) {
        Navigator.of(context).pop();
      }

      if (result['success']) {
        // Navigate to password reset screen
        if (context.mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (context) => ResetPasswordScreen(
                token: token,
                email: result['email'] ?? '',
              ),
            ),
            (route) => route.isFirst, // Keep only the first route
          );
        }
      } else {
        // Show error message
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Invalid or expired reset link'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      // Dismiss loading dialog
      if (context.mounted) {
        Navigator.of(context).pop();
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error verifying reset link. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void dispose() {
    _linkSubscription?.cancel();
  }
}

// Global navigator key for accessing context from services
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();