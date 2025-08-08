import 'package:flutter/material.dart';

class AppColors {
  // Primary Brand Color
  static const Color primary = Color(0xFF1877F2); // Facebook Blue
  static const Color primaryLight = Color(0xFF42A5F5);
  static const Color primaryDark = Color(0xFF1565C0);
  
  // Secondary Colors
  static const Color secondary = Color(0xFFFF9800); // Orange
  static const Color secondaryLight = Color(0xFFFFB74D);
  static const Color secondaryDark = Color(0xFFF57C00);
  
  // Accent Colors
  static const Color accent = Color(0xFF4CAF50); // Green
  static const Color accentLight = Color(0xFF81C784);
  static const Color accentDark = Color(0xFF388E3C);
  
  // Neutral Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey50 = Color(0xFFFAFAFA);
  static const Color grey100 = Color(0xFFF5F5F5);
  static const Color grey200 = Color(0xFFEEEEEE);
  static const Color grey300 = Color(0xFFE0E0E0);
  static const Color grey400 = Color(0xFFBDBDBD);
  static const Color grey500 = Color(0xFF9E9E9E);
  static const Color grey600 = Color(0xFF757575);
  static const Color grey700 = Color(0xFF616161);
  static const Color grey800 = Color(0xFF424242);
  static const Color grey900 = Color(0xFF212121);
  
  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color error = Color(0xFFF44336);
  static const Color info = Color(0xFF2196F3);
  
  // Background Colors
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1E1E1E);
  
  // Text Colors
  static const Color textPrimaryLight = Color(0xFF212121);
  static const Color textSecondaryLight = Color(0xFF757575);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFBDBDBD);
  
  // Border Colors
  static const Color borderLight = Color(0xFFE0E0E0);
  static const Color borderDark = Color(0xFF424242);
  
  // Divider Colors
  static const Color dividerLight = Color(0xFFBDBDBD);
  static const Color dividerDark = Color(0xFF616161);
  
  // Astrology Specific Colors
  static const Color zodiacFire = Color(0xFFFF6B35); // Aries, Leo, Sagittarius
  static const Color zodiacEarth = Color(0xFF8BC34A); // Taurus, Virgo, Capricorn
  static const Color zodiacAir = Color(0xFF03DAC6); // Gemini, Libra, Aquarius
  static const Color zodiacWater = Color(0xFF3F51B5); // Cancer, Scorpio, Pisces
  
  // Chat Colors
  static const Color chatBubbleUser = Color(0xFF1877F2);
  static const Color chatBubbleAstrologer = Color(0xFFE0E0E0);
  static const Color chatBubbleUserText = Color(0xFFFFFFFF);
  static const Color chatBubbleAstrologerText = Color(0xFF212121);
  
  // Status Colors for Astrologers
  static const Color onlineStatus = Color(0xFF4CAF50);
  static const Color offlineStatus = Color(0xFF9E9E9E);
  static const Color busyStatus = Color(0xFFFF9800);
  
  // Wallet & Payment Colors
  static const Color walletBalance = Color(0xFF4CAF50);
  static const Color paymentSuccess = Color(0xFF4CAF50);
  static const Color paymentPending = Color(0xFFFF9800);
  static const Color paymentFailed = Color(0xFFF44336);

  // Alias colors for backward compatibility
  static const Color background = backgroundLight;
  static const Color lightGray = grey300;
  static const Color textPrimary = textPrimaryLight;
  static const Color textSecondary = textSecondaryLight;
}