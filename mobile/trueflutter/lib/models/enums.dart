import 'package:flutter/foundation.dart';

// User type enumeration (for signup flow)
enum UserType {
  customer,
  astrologer,
}

// User role enumeration 
enum UserRole {
  customer,
  astrologer,
  admin,
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

// Account status enumeration
enum AccountStatus {
  pending,
  profileIncomplete,
  submitted,
  verified,
  active,
  suspended,
  rejected,
}

// Verification status enumeration
enum VerificationStatus {
  pending,
  verified,
  rejected,
  unverified, // Keep for backward compatibility
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
      case UserRole.admin:
        return 'Admin';
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
      case UserRole.admin:
        return 'Administrator';
      case UserRole.manager:
        return 'Manager';
    }
  }

  String get value {
    switch (this) {
      case UserRole.customer:
        return 'customer'; // Server expects 'customer'
      case UserRole.astrologer:
        return 'astrologer';
      case UserRole.admin:
        return 'admin';
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
      case 'admin':
        return UserRole.admin;
      case 'manager':
        return UserRole.manager;
      default:
        debugPrint('⚠️ Unknown user role: $value, defaulting to customer');
        return UserRole.customer; // Default to customer instead of throwing
    }
  }
}

extension AccountStatusExtension on AccountStatus {
  String get name {
    switch (this) {
      case AccountStatus.pending:
        return 'Pending';
      case AccountStatus.profileIncomplete:
        return 'Profile Incomplete';
      case AccountStatus.submitted:
        return 'Submitted';
      case AccountStatus.verified:
        return 'Verified';
      case AccountStatus.active:
        return 'Active';
      case AccountStatus.suspended:
        return 'Suspended';
      case AccountStatus.rejected:
        return 'Rejected';
    }
  }

  String get value {
    switch (this) {
      case AccountStatus.pending:
        return 'pending';
      case AccountStatus.profileIncomplete:
        return 'profile_incomplete';
      case AccountStatus.submitted:
        return 'submitted';
      case AccountStatus.verified:
        return 'verified';
      case AccountStatus.active:
        return 'active';
      case AccountStatus.suspended:
        return 'suspended';
      case AccountStatus.rejected:
        return 'rejected';
    }
  }

  static AccountStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return AccountStatus.pending;
      case 'profile_incomplete':
        return AccountStatus.profileIncomplete;
      case 'submitted':
        return AccountStatus.submitted;
      case 'verified':
        return AccountStatus.verified;
      case 'active':
        return AccountStatus.active;
      case 'suspended':
        return AccountStatus.suspended;
      case 'rejected':
        return AccountStatus.rejected;
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
      case VerificationStatus.unverified:
        return 'Unverified';
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
      case VerificationStatus.unverified:
        return 'unverified';
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
      case 'unverified':
        return VerificationStatus.unverified;
      default:
        return VerificationStatus.pending; // Default to pending instead of throwing
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