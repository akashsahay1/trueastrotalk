// ignore_for_file: deprecated_member_use

/// Centralized validation patterns to avoid RegExp deprecation warnings.
/// These static patterns are created once and reused throughout the app.
///
/// Note: The deprecation warning about RegExp becoming 'final' is about
/// preventing subclassing of RegExp, not about using RegExp itself.
/// Using RegExp directly is still the correct approach for pattern matching.
class ValidationPatterns {
  ValidationPatterns._();

  // Email patterns
  static final emailPattern = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
  static final emailSimplePattern = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  // Phone patterns
  static final nonDigitsPattern = RegExp(r'[^\d]');
  static final phoneCharactersPattern = RegExp(r'^[\+\d\s\-\(\)]+$');
  static final startsWithDigitPattern = RegExp(r'^\d');
  static final phoneInputPattern = RegExp(r'[\d\+\s\-\(\)]');
  static final nonDigitExceptPlusPattern = RegExp(r'[^\d\+]');

  // Password patterns
  static final uppercasePattern = RegExp(r'[A-Z]');
  static final lowercasePattern = RegExp(r'[a-z]');
  static final digitPattern = RegExp(r'\d');
  static final digitsOnlyPattern = RegExp(r'^\d+$');
  static final specialCharPattern = RegExp(r'[!@#$%^&*()_+\-=\[\]{};:"|,.<>/?]');
  static final passwordComplexityPattern = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)');

  // Financial patterns
  static final decimalInputPattern = RegExp(r'^\d+\.?\d{0,2}');
  static final alphanumericUpperPattern = RegExp(r'[A-Z0-9]');
  static final ifscPattern = RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$');

  // Misc patterns
  static final exceptionMessagePattern = RegExp(r'Exception: (.+)');
  static final productIdPattern = RegExp(r'Product ([a-f0-9]{24})');

  // Helper methods for common validations
  static bool hasUppercase(String value) => uppercasePattern.hasMatch(value);
  static bool hasLowercase(String value) => lowercasePattern.hasMatch(value);
  static bool hasDigit(String value) => digitPattern.hasMatch(value);
  static bool hasSpecialChar(String value) => specialCharPattern.hasMatch(value);
  static bool isValidEmail(String value) => emailPattern.hasMatch(value);
  static bool isValidEmailSimple(String value) => emailSimplePattern.hasMatch(value);
  static bool isValidIfsc(String value) => ifscPattern.hasMatch(value.toUpperCase());
  static bool isDigitsOnly(String value) => digitsOnlyPattern.hasMatch(value);
  static bool isPhoneInput(String value) => phoneCharactersPattern.hasMatch(value);
  static bool startsWithDigit(String value) => startsWithDigitPattern.hasMatch(value);
  static bool meetsPasswordComplexity(String value) => passwordComplexityPattern.hasMatch(value);

  /// Removes all non-digit characters from a string
  static String removeNonDigits(String value) => value.replaceAll(nonDigitsPattern, '');

  /// Removes all non-digit characters except + from a string (for phone numbers)
  static String cleanPhoneNumber(String value) => value.replaceAll(nonDigitExceptPlusPattern, '');

  /// Extracts exception message from error string
  static String? extractExceptionMessage(String errorString) {
    final match = exceptionMessagePattern.firstMatch(errorString);
    return match?.group(1);
  }

  /// Extracts product ID from error message
  static String? extractProductId(String errorMessage) {
    final match = productIdPattern.firstMatch(errorMessage);
    return match?.group(1);
  }
}
