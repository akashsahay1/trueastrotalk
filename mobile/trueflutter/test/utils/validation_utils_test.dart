import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Validation Utils', () {
    group('Phone number validation', () {
      test('should validate Indian phone numbers', () {
        expect(isValidPhoneNumber('+919876543210'), true);
        expect(isValidPhoneNumber('+91 9876543210'), true);
        expect(isValidPhoneNumber('+91-9876-543-210'), true);
        expect(isValidPhoneNumber('9876543210'), false); // Missing country code
        expect(isValidPhoneNumber('+91987654321'), false); // Too short (11 digits only)
        expect(isValidPhoneNumber('+9198765432101'), false); // Too long (13 digits)
      });

      test('should validate international phone numbers', () {
        expect(isValidPhoneNumber('+1234567890'), true);
        expect(isValidPhoneNumber('+44123456789'), true);
        expect(isValidPhoneNumber('+861234567890'), true);
        expect(isValidPhoneNumber('+123'), false); // Too short
        expect(isValidPhoneNumber('+12345678901234567'), false); // Too long
      });

      test('should reject invalid formats', () {
        expect(isValidPhoneNumber(''), false);
        expect(isValidPhoneNumber('abc123'), false);
        expect(isValidPhoneNumber('++911234567890'), false);
        expect(isValidPhoneNumber('+91abc1234567'), false);
      });

      test('should format phone numbers correctly', () {
        expect(formatPhoneNumber('+91 9876 543 210'), '+919876543210');
        expect(formatPhoneNumber('91-9876-543-210'), '+919876543210');
        expect(formatPhoneNumber(' +91  9876543210 '), '+919876543210');
        expect(formatPhoneNumber('9876543210'), '+919876543210'); // Add default country code
      });
    });

    group('Email validation', () {
      test('should validate correct email formats', () {
        expect(isValidEmail('test@example.com'), true);
        expect(isValidEmail('user.name@domain.co.uk'), true);
        expect(isValidEmail('user+tag@example.org'), true);
        expect(isValidEmail('123@domain.com'), true);
        expect(isValidEmail('user.name+tag123@example-domain.com'), true);
      });

      test('should reject invalid email formats', () {
        expect(isValidEmail(''), false);
        expect(isValidEmail('invalid-email'), false);
        expect(isValidEmail('test@'), false);
        expect(isValidEmail('@domain.com'), false);
        expect(isValidEmail('test.domain.com'), false);
        expect(isValidEmail('test@domain'), false);
        expect(isValidEmail('test @domain.com'), false);
        expect(isValidEmail('test@domain .com'), false);
      });

      test('should handle edge cases', () {
        expect(isValidEmail('a@b.co'), true); // Minimum valid email
        expect(isValidEmail('test@domain.c'), false); // Single letter TLD
        expect(isValidEmail('test@domain..com'), false); // Double dots
        expect(isValidEmail('.test@domain.com'), false); // Starting with dot
        expect(isValidEmail('test.@domain.com'), false); // Ending with dot before @
      });
    });

    group('Password validation', () {
      test('should validate strong passwords', () {
        expect(isValidPassword('Password123!'), true);
        expect(isValidPassword('MySecure@Pass9'), true);
        expect(isValidPassword('Complex#123Pass'), true);
        expect(isValidPassword('Str0ng!Password'), true);
      });

      test('should reject weak passwords', () {
        expect(isValidPassword('password'), false); // No uppercase, numbers, symbols
        expect(isValidPassword('PASSWORD'), false); // No lowercase, numbers, symbols
        expect(isValidPassword('Password'), false); // No numbers, symbols
        expect(isValidPassword('Password123'), false); // No symbols
        expect(isValidPassword('Password!'), false); // No numbers
        expect(isValidPassword('Pass1!'), false); // Too short
      });

      test('should provide detailed validation errors', () {
        final errors1 = getPasswordValidationErrors('weak');
        expect(errors1.length, greaterThan(0));
        expect(errors1.any((error) => error.contains('8 characters')), true);
        expect(errors1.any((error) => error.contains('uppercase')), true);

        final errors2 = getPasswordValidationErrors('StrongPass123!');
        expect(errors2.length, 0);
      });

      test('should check password strength levels', () {
        expect(getPasswordStrength('weak'), PasswordStrength.weak);
        expect(getPasswordStrength('Password1'), PasswordStrength.medium);
        expect(getPasswordStrength('StrongPass123!'), PasswordStrength.strong);
      });
    });

    group('Name validation', () {
      test('should validate proper names', () {
        expect(isValidName('John Doe'), true);
        expect(isValidName('राहुल शर्मा'), true); // Hindi names
        expect(isValidName('O\'Connor'), true); // Names with apostrophes
        expect(isValidName('Jean-Pierre'), true); // Names with hyphens
        expect(isValidName('Dr. Smith'), true); // Names with periods
      });

      test('should reject invalid names', () {
        expect(isValidName(''), false);
        expect(isValidName('123'), false);
        expect(isValidName('John123'), false);
        expect(isValidName('   '), false);
        expect(isValidName('A'), false); // Too short
      });

      test('should handle edge cases', () {
        expect(isValidName('X Æ A-12'), false); // Special characters
        expect(isValidName('John  Doe'), true); // Multiple spaces should be allowed
        expect(isValidName(' John Doe '), true); // Leading/trailing spaces
      });
    });

    group('Age validation', () {
      test('should validate age ranges', () {
        expect(isValidAge(25), true);
        expect(isValidAge(18), true); // Minimum age
        expect(isValidAge(100), true); // Maximum reasonable age
        expect(isValidAge(17), false); // Under minimum
        expect(isValidAge(121), false); // Over maximum
        expect(isValidAge(-5), false); // Negative age
      });
    });

    group('Date validation', () {
      test('should validate birth dates', () {
        final validDate = DateTime.now().subtract(const Duration(days: 365 * 25));
        final futureDate = DateTime.now().add(const Duration(days: 1));
        final tooOldDate = DateTime.now().subtract(const Duration(days: 365 * 150));

        expect(isValidBirthDate(validDate), true);
        expect(isValidBirthDate(futureDate), false);
        expect(isValidBirthDate(tooOldDate), false);
      });

      test('should calculate age from birth date', () {
        final birthDate = DateTime.now().subtract(const Duration(days: 365 * 25));
        final age = calculateAge(birthDate);
        
        expect(age, closeTo(25, 1)); // Allow 1 year tolerance for leap years
      });
    });

    group('OTP validation', () {
      test('should validate OTP format', () {
        expect(isValidOTP('123456'), true);
        expect(isValidOTP('000000'), true);
        expect(isValidOTP('12345'), false); // Too short
        expect(isValidOTP('1234567'), false); // Too long
        expect(isValidOTP('12345a'), false); // Contains letters
        expect(isValidOTP(''), false); // Empty
      });
    });

    group('URL validation', () {
      test('should validate URLs', () {
        expect(isValidURL('https://example.com'), true);
        expect(isValidURL('http://example.com'), true);
        expect(isValidURL('https://subdomain.example.com/path'), true);
        expect(isValidURL('example.com'), false); // Missing protocol
        expect(isValidURL('invalid-url'), false);
        expect(isValidURL(''), false);
      });
    });
  });
}

// Pre-compiled regular expressions
// ignore: deprecated_member_use
final _nonPhoneCharsRegex = RegExp(r'[^\+\d]');
// ignore: deprecated_member_use
final _phoneRegex = RegExp(r'^\+[1-9]\d{6,14}$');
// ignore: deprecated_member_use
final _emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
// ignore: deprecated_member_use
final _upperCaseRegex = RegExp(r'[A-Z]');
// ignore: deprecated_member_use
final _lowerCaseRegex = RegExp(r'[a-z]');
// ignore: deprecated_member_use
final _digitRegex = RegExp(r'[0-9]');
// ignore: deprecated_member_use
final _specialCharRegex = RegExp(r'[!@#\$&*~]');
// ignore: deprecated_member_use
final _otpRegex = RegExp(r'^\d{6}$');

// Validation utility functions
bool isValidPhoneNumber(String phone) {
  final cleanPhone = phone.replaceAll(_nonPhoneCharsRegex, '');
  return _phoneRegex.hasMatch(cleanPhone);
}

String formatPhoneNumber(String phone) {
  String cleaned = phone.replaceAll(_nonPhoneCharsRegex, '');
  if (!cleaned.startsWith('+')) {
    // If it starts with 91, don't add another +91
    if (cleaned.startsWith('91') && cleaned.length == 12) {
      cleaned = '+$cleaned';
    } else {
      cleaned = '+91$cleaned'; // Default to India
    }
  }
  return cleaned;
}

bool isValidEmail(String email) {
  return _emailRegex.hasMatch(email.trim());
}

bool isValidPassword(String password) {
  if (password.length < 8) return false;
  if (!password.contains(_upperCaseRegex)) return false;
  if (!password.contains(_lowerCaseRegex)) return false;
  if (!password.contains(_digitRegex)) return false;
  if (!password.contains(_specialCharRegex)) return false;
  return true;
}

List<String> getPasswordValidationErrors(String password) {
  List<String> errors = [];

  if (password.length < 8) {
    errors.add('Password must be at least 8 characters long');
  }
  if (!password.contains(_upperCaseRegex)) {
    errors.add('Password must contain at least one uppercase letter');
  }
  if (!password.contains(_lowerCaseRegex)) {
    errors.add('Password must contain at least one lowercase letter');
  }
  if (!password.contains(_digitRegex)) {
    errors.add('Password must contain at least one number');
  }
  if (!password.contains(_specialCharRegex)) {
    errors.add('Password must contain at least one special character');
  }

  return errors;
}

enum PasswordStrength { weak, medium, strong }

PasswordStrength getPasswordStrength(String password) {
  int score = 0;

  if (password.length >= 8) score++;
  if (password.contains(_upperCaseRegex)) score++;
  if (password.contains(_lowerCaseRegex)) score++;
  if (password.contains(_digitRegex)) score++;
  if (password.contains(_specialCharRegex)) score++;

  if (score <= 2) return PasswordStrength.weak;
  if (score <= 4) return PasswordStrength.medium;
  return PasswordStrength.strong;
}

bool isValidName(String name) {
  final trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (trimmed.contains(_digitRegex)) return false;
  return true;
}

bool isValidAge(int age) {
  return age >= 18 && age <= 120;
}

bool isValidBirthDate(DateTime birthDate) {
  final now = DateTime.now();
  final minDate = now.subtract(const Duration(days: 365 * 120));
  final maxDate = now.subtract(const Duration(days: 365 * 18));

  return birthDate.isAfter(minDate) && birthDate.isBefore(maxDate);
}

int calculateAge(DateTime birthDate) {
  final now = DateTime.now();
  int age = now.year - birthDate.year;

  if (now.month < birthDate.month ||
      (now.month == birthDate.month && now.day < birthDate.day)) {
    age--;
  }

  return age;
}

bool isValidOTP(String otp) {
  if (otp.length != 6) return false;
  return _otpRegex.hasMatch(otp);
}

bool isValidURL(String url) {
  try {
    final uri = Uri.parse(url);
    return uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https');
  } catch (e) {
    return false;
  }
}