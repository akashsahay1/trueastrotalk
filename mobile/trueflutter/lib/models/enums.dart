import 'package:flutter/foundation.dart';

// User type enumeration (for signup flow)
enum UserType {
  customer,
  astrologer,
}

// User role enumeration (matches database user_type field)
enum UserRole {
  customer,
  astrologer,
  administrator, // Changed from 'admin' to match database
  manager,
}

// Authentication type enumeration
enum AuthType {
  email,
  google,
  phone,
  apple,
  facebook,
  twitter,
  other, // For future auth methods
}

// Account status enumeration (matches database account_status field)
enum AccountStatus {
  active,
  inactive,
  suspended,
  banned,
}

// Verification status enumeration
enum VerificationStatus {
  pending,
  verified,
  rejected,
}

// Consultation type enumeration
enum ConsultationType {
  chat,
  voice,
  video,
}

// Consultation status enumeration
enum ConsultationStatus {
  pending,
  active,
  completed,
  cancelled,
}

// Payment status enumeration
enum PaymentStatus {
  pending,
  completed,
  failed,
  refunded,
}

// Transaction type enumeration
enum TransactionType {
  recharge,
  consultation,
  payout,
  refund,
}

// Online status enumeration for astrologers
enum OnlineStatus {
  online,
  offline,
  busy,
}

// Extensions for enum values
extension UserRoleExtension on UserRole {
  String get name {
    switch (this) {
      case UserRole.customer:
        return 'Customer';
      case UserRole.astrologer:
        return 'Astrologer';
      case UserRole.administrator:
        return 'Administrator';
      case UserRole.manager:
        return 'Manager';
    }
  }
  
  String get displayName {
    switch (this) {
      case UserRole.customer:
        return 'Customer';
      case UserRole.astrologer:
        return 'Astrologer';
      case UserRole.administrator:
        return 'Administrator';
      case UserRole.manager:
        return 'Manager';
    }
  }

  String get value {
    switch (this) {
      case UserRole.customer:
        return 'customer';
      case UserRole.astrologer:
        return 'astrologer';
      case UserRole.administrator:
        return 'administrator'; // Match database field exactly
      case UserRole.manager:
        return 'manager';
    }
  }

  static UserRole fromString(String value) {
    switch (value.toLowerCase()) {
      case 'customer':
        return UserRole.customer;
      case 'astrologer':
        return UserRole.astrologer;
      case 'administrator':
      case 'admin': // Handle both for API compatibility
        return UserRole.administrator;
      case 'manager':
        return UserRole.manager;
      default:
        debugPrint('⚠️ Unknown user role: $value, defaulting to customer');
        return UserRole.customer;
    }
  }
}

extension AccountStatusExtension on AccountStatus {
  String get name {
    switch (this) {
      case AccountStatus.active:
        return 'Active';
      case AccountStatus.inactive:
        return 'Inactive';
      case AccountStatus.suspended:
        return 'Suspended';
      case AccountStatus.banned:
        return 'Banned';
    }
  }

  String get value {
    switch (this) {
      case AccountStatus.active:
        return 'active';
      case AccountStatus.inactive:
        return 'inactive';
      case AccountStatus.suspended:
        return 'suspended';
      case AccountStatus.banned:
        return 'banned';
    }
  }

  static AccountStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'active':
        return AccountStatus.active;
      case 'inactive':
        return AccountStatus.inactive;
      case 'suspended':
        return AccountStatus.suspended;
      case 'banned':
        return AccountStatus.banned;
      default:
        debugPrint('⚠️ Unknown account status: $value, defaulting to active');
        return AccountStatus.active; // Default to active instead of throwing
    }
  }
}

extension ConsultationTypeExtension on ConsultationType {
  String get name {
    switch (this) {
      case ConsultationType.chat:
        return 'Chat';
      case ConsultationType.voice:
        return 'Voice Call';
      case ConsultationType.video:
        return 'Video Call';
    }
  }

  String get value {
    switch (this) {
      case ConsultationType.chat:
        return 'chat';
      case ConsultationType.voice:
        return 'voice';
      case ConsultationType.video:
        return 'video';
    }
  }

  static ConsultationType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'chat':
        return ConsultationType.chat;
      case 'voice':
        return ConsultationType.voice;
      case 'video':
        return ConsultationType.video;
      default:
        debugPrint('⚠️ Unknown consultation type: $value, defaulting to chat');
        return ConsultationType.chat; // Default to chat instead of throwing
    }
  }
}

extension VerificationStatusExtension on VerificationStatus {
  String get name {
    switch (this) {
      case VerificationStatus.pending:
        return 'Pending';
      case VerificationStatus.verified:
        return 'Verified';
      case VerificationStatus.rejected:
        return 'Rejected';
    }
  }

  String get value {
    switch (this) {
      case VerificationStatus.pending:
        return 'pending';
      case VerificationStatus.verified:
        return 'verified';
      case VerificationStatus.rejected:
        return 'rejected';
    }
  }

  static VerificationStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return VerificationStatus.pending;
      case 'verified':
        return VerificationStatus.verified;
      case 'rejected':
        return VerificationStatus.rejected;
      default:
        return VerificationStatus.pending; // Default to pending
    }
  }
}

extension AuthTypeExtension on AuthType {
  String get name {
    switch (this) {
      case AuthType.email:
        return 'Email';
      case AuthType.google:
        return 'Google';
      case AuthType.phone:
        return 'Phone';
      case AuthType.apple:
        return 'Apple';
      case AuthType.facebook:
        return 'Facebook';
      case AuthType.twitter:
        return 'Twitter';
      case AuthType.other:
        return 'Other';
    }
  }

  String get value {
    switch (this) {
      case AuthType.email:
        return 'email';
      case AuthType.google:
        return 'google';
      case AuthType.phone:
        return 'phone';
      case AuthType.apple:
        return 'apple';
      case AuthType.facebook:
        return 'facebook';
      case AuthType.twitter:
        return 'twitter';
      case AuthType.other:
        return 'other';
    }
  }

  static AuthType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'email':
        return AuthType.email;
      case 'google':
        return AuthType.google;
      case 'phone':
        return AuthType.phone;
      case 'apple':
        return AuthType.apple;
      case 'facebook':
        return AuthType.facebook;
      case 'twitter':
        return AuthType.twitter;
      default:
        return AuthType.other; // Default to 'other' instead of throwing error
    }
  }
}