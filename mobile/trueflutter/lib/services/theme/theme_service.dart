import 'package:flutter/material.dart';
import '../../common/themes/app_theme.dart';
import '../../models/user.dart';
import '../auth/auth_service.dart';
import '../service_locator.dart';

/// Service that manages theme based on user type
/// - Customers get red accent theme
/// - Astrologers get green accent theme
class ThemeService extends ChangeNotifier {
  ThemeData _currentTheme = AppTheme.lightTheme;
  bool _isAstrologer = false;

  ThemeData get currentTheme => _currentTheme;
  bool get isAstrologer => _isAstrologer;

  /// Initialize theme based on current user
  void initialize() {
    _updateThemeForUser(getIt<AuthService>().currentUser);
  }

  /// Update theme when user changes
  void updateForUser(User? user) {
    _updateThemeForUser(user);
  }

  void _updateThemeForUser(User? user) {
    final isAstrologer = user?.isAstrologer ?? false;

    if (isAstrologer != _isAstrologer) {
      _isAstrologer = isAstrologer;
      _currentTheme = isAstrologer
          ? AppTheme.astrologerLightTheme
          : AppTheme.lightTheme;
      notifyListeners();
    }
  }

  /// Reset to default (customer) theme
  void reset() {
    _isAstrologer = false;
    _currentTheme = AppTheme.lightTheme;
    notifyListeners();
  }
}
