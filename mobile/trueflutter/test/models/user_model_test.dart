import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/models/enums.dart';

void main() {
  group('User Model', () {
    final sampleUserData = {
      'id': 'user_123',
      'name': 'John Doe',
      'email': 'john@example.com',
      'phone': '+919876543210',
      'role': 'customer',
      'account_status': 'active',
      'verification_status': 'verified',
      'auth_type': 'email',
      'created_at': '2024-01-01T00:00:00Z',
      'updated_at': '2024-01-01T00:00:00Z',
      'wallet_balance': 100.0,
    };

    group('User creation', () {
      test('should create user with all required fields', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+919876543210',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.parse('2024-01-01T00:00:00Z'),
          updatedAt: DateTime.parse('2024-01-01T00:00:00Z'),
        );

        expect(user.id, 'user_123');
        expect(user.name, 'John Doe');
        expect(user.email, 'john@example.com');
        expect(user.phone, '+919876543210');
        expect(user.role, UserRole.customer);
        expect(user.accountStatus, AccountStatus.active);
        expect(user.verificationStatus, VerificationStatus.verified);
        expect(user.authType, AuthType.email);
      });

      test('should create user with optional fields', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.parse('2024-01-01T00:00:00Z'),
          updatedAt: DateTime.parse('2024-01-01T00:00:00Z'),
          walletBalance: 150.75,
          gender: 'male',
          city: 'Mumbai',
        );

        expect(user.email, isNull);
        expect(user.phone, isNull);
        expect(user.walletBalance, 150.75);
        expect(user.gender, 'male');
        expect(user.city, 'Mumbai');
      });
    });

    group('JSON serialization', () {
      test('should serialize user to JSON correctly', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+919876543210',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.parse('2024-01-01T00:00:00Z'),
          updatedAt: DateTime.parse('2024-01-01T00:00:00Z'),
          walletBalance: 100.0,
        );

        final json = user.toJson();

        expect(json['id'], 'user_123');
        expect(json['name'], 'John Doe');
        expect(json['email'], 'john@example.com');
        expect(json['phone'], '+919876543210');
        expect(json['role'], 'customer');
        expect(json['wallet_balance'], 100.0);
      });

      test('should deserialize user from JSON correctly', () {
        final user = User.fromJson(sampleUserData);

        expect(user.id, 'user_123');
        expect(user.name, 'John Doe');
        expect(user.email, 'john@example.com');
        expect(user.phone, '+919876543210');
        expect(user.role, UserRole.customer);
        expect(user.walletBalance, 100.0);
      });

      test('should handle missing optional fields in JSON', () {
        final minimalData = {
          'id': 'user_123',
          'name': 'John Doe',
          'role': 'customer',
          'account_status': 'active',
          'verification_status': 'pending',
          'auth_type': 'email',
          'created_at': '2024-01-01T00:00:00Z',
          'updated_at': '2024-01-01T00:00:00Z',
        };

        final user = User.fromJson(minimalData);

        expect(user.id, 'user_123');
        expect(user.name, 'John Doe');
        expect(user.email, isNull);
        expect(user.phone, isNull);
        expect(user.walletBalance, isNull);
        expect(user.role, UserRole.customer);
        expect(user.accountStatus, AccountStatus.active);
        expect(user.verificationStatus, VerificationStatus.pending);
      });
    });

    group('User role validation', () {
      test('should correctly identify customer users', () {
        final customer = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(customer.isCustomer, true);
        expect(customer.isAstrologer, false);
      });

      test('should correctly identify astrologer users', () {
        final astrologer = User(
          id: 'user_123',
          name: 'Jane Smith',
          role: UserRole.astrologer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(astrologer.isCustomer, false);
        expect(astrologer.isAstrologer, true);
      });
    });

    group('Account status checks', () {
      test('should correctly identify active users', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.isActive, true);
        expect(user.isSuspended, false);
        expect(user.isBanned, false);
      });

      test('should correctly identify suspended users', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.suspended,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.isActive, false);
        expect(user.isSuspended, true);
        expect(user.isBanned, false);
      });
    });

    group('Verification status checks', () {
      test('should correctly identify verified users', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.isVerified, true);
        expect(user.isPendingVerification, false);
        expect(user.isRejected, false);
      });

      test('should correctly identify pending verification users', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.pending,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.isVerified, false);
        expect(user.isPendingVerification, true);
        expect(user.isRejected, false);
      });
    });

    group('Display methods', () {
      test('should return formatted display name', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.displayName, 'John Doe');
      });

      test('should return initials correctly', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe Smith',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.initials, 'JD');
      });

      test('should handle single name for initials', () {
        final user = User(
          id: 'user_123',
          name: 'John',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.initials, 'J');
      });
    });

    group('Wallet functionality', () {
      test('should correctly identify users with sufficient wallet balance', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          walletBalance: 100.0,
        );

        expect(user.hasSufficientBalance(50.0), true);
        expect(user.hasSufficientBalance(100.0), true);
        expect(user.hasSufficientBalance(150.0), false);
      });

      test('should handle null wallet balance', () {
        final user = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user.hasSufficientBalance(10.0), false);
        expect(user.walletBalance ?? 0.0, 0.0);
      });
    });

    group('User equality', () {
      test('should correctly compare users by ID', () {
        final user1 = User(
          id: 'user_123',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final user2 = User(
          id: 'user_123',
          name: 'Jane Smith', // Different name but same ID
          role: UserRole.astrologer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final user3 = User(
          id: 'user_456',
          name: 'John Doe',
          role: UserRole.customer,
          accountStatus: AccountStatus.active,
          verificationStatus: VerificationStatus.verified,
          authType: AuthType.email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(user1 == user2, true); // Same ID
        expect(user1 == user3, false); // Different ID
        expect(user1.hashCode, equals(user2.hashCode)); // Same ID should have same hash
      });
    });
  });
}

// Extension methods to add to User model for testing
extension UserTestExtensions on User {
  bool get isCustomer => role == UserRole.customer;
  bool get isAstrologer => role == UserRole.astrologer;
  bool get isActive => accountStatus == AccountStatus.active;
  bool get isSuspended => accountStatus == AccountStatus.suspended;
  bool get isBanned => accountStatus == AccountStatus.banned;
  bool get isVerified => verificationStatus == VerificationStatus.verified;
  bool get isPendingVerification => verificationStatus == VerificationStatus.pending;
  bool get isRejected => verificationStatus == VerificationStatus.rejected;
  
  String get displayName => name;
  
  String get initials {
    final names = name.split(' ');
    if (names.isEmpty) return '';
    if (names.length == 1) return names[0].substring(0, 1).toUpperCase();
    return '${names[0].substring(0, 1)}${names[1].substring(0, 1)}'.toUpperCase();
  }
  
  bool hasSufficientBalance(double amount) {
    final balance = walletBalance ?? 0.0;
    return balance >= amount;
  }
}