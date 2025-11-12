import 'package:flutter/material.dart';

class AppColors {
  // Primary Brand Color - Red Theme
  static const Color primary = Color(0xFFFE0000); // Bright Red
  static const Color primaryLight = Color(0xFFFF4D4D); // Light Red
  static const Color primaryDark = Color(0xFFB30000); // Dark Red

  // Secondary Colors - Golden/Cosmic Theme
  static const Color secondary = Color(0xFFF59E0B); // Amber-500
  static const Color secondaryLight = Color(0xFFFBBF24); // Amber-400
  static const Color secondaryDark = Color(0xFFD97706); // Amber-600

  // Accent Colors - Mystical Green
  static const Color accent = Color(0xFF10B981); // Emerald-500
  static const Color accentLight = Color(0xFF34D399); // Emerald-400
  static const Color accentDark = Color(0xFF059669); // Emerald-600

  // Neutral Colors - Warmer Greys
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey50 = Color(0xFFFAFAFA);
  static const Color grey100 = Color(0xFFF4F4F5); // Zinc-100
  static const Color grey200 = Color(0xFFE4E4E7); // Zinc-200
  static const Color grey300 = Color(0xFFD4D4D8); // Zinc-300
  static const Color grey400 = Color(0xFFA1A1AA); // Zinc-400
  static const Color grey500 = Color(0xFF71717A); // Zinc-500
  static const Color grey600 = Color(0xFF52525B); // Zinc-600
  static const Color grey700 = Color(0xFF3F3F46); // Zinc-700
  static const Color grey800 = Color(0xFF27272A); // Zinc-800
  static const Color grey900 = Color(0xFF18181B); // Zinc-900

  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color error = Color(0xFFF44336);
  static const Color info = Color(0xFF2196F3);

  // Background Colors - Gradient-friendly
  static const Color backgroundLight = Color(0xFFFAFAFA);
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1E1E1E);

  // Gradient Colors for Mystical Theme
  static const Color gradientStart = Color(0xFFFE0000); 
  static const Color gradientMiddle = Color(0xFFFF4D4D);
  static const Color gradientEnd = Color(0xFFB30000);

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
  static const Color zodiacFire = Color(0xFFFF6B35); 
  static const Color zodiacEarth = Color(
    0xFF8BC34A,
  ); // Taurus, Virgo, Capricorn
  static const Color zodiacAir = Color(0xFF03DAC6); 
  static const Color zodiacWater = Color(0xFF3F51B5);

  // Chat Colors
  static const Color chatBubbleUser = Color(0xFFFE0000);
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
