import 'package:flutter/foundation.dart';
import 'enums.dart';

class User {
  // Basic user fields
  final String id;
  final String? phone;
  final String? email;
  final String name;
  final UserRole role;
  final AccountStatus accountStatus;
  final VerificationStatus verificationStatus;
  final AuthType authType; // How user signed up: email, google, phone, apple, facebook, twitter
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? verifiedAt;
  final String? verifiedBy;
  final String? rejectionReason;

  // Customer-specific fields
  final double? walletBalance;
  final DateTime? dateOfBirth;
  final String? timeOfBirth;
  final String? placeOfBirth;

  // Additional user fields
  final String? gender;
  final String? address;
  final String? city;
  final String? state;
  final String? country;
  final String? zip;

  // Astrologer-specific fields
  final bool? isOnline;
  final String? bio;
  final String? profilePicture;
  final int? experienceYears;
  final List<String>? languages;
  final List<String>? skills;
  final List<String>? qualifications;
  final List<String>? certifications;

  // Consultation rates for astrologers
  final double? chatRate; // per minute
  final double? callRate; // per minute
  final double? videoRate; // per minute

  // Professional details for astrologers
  final String? education;
  final String? experience;

  // Payment details for astrologers
  final String? upiId;
  final double? totalEarnings;
  final double? pendingPayouts;
  final DateTime? lastPayoutAt;

  // Bank details for astrologers
  final String? accountHolderName;
  final String? accountNumber;
  final String? bankName;
  final String? ifscCode;
  final String? panCardUrl;

  // Rating and reviews
  final double? rating;
  final int? totalReviews;
  final int? totalConsultations;

  const User({
    // Basic user fields
    required this.id,
    this.phone,
    this.email,
    required this.name,
    required this.role,
    required this.accountStatus,
    required this.verificationStatus,
    required this.authType,
    required this.createdAt,
    required this.updatedAt,
    this.verifiedAt,
    this.verifiedBy,
    this.rejectionReason,

    // Customer-specific fields
    this.walletBalance,
    this.dateOfBirth,
    this.timeOfBirth,
    this.placeOfBirth,

    // Additional user fields
    this.gender,
    this.address,
    this.city,
    this.state,
    this.country,
    this.zip,

    // Astrologer-specific fields
    this.isOnline,
    this.bio,
    this.profilePicture,
    this.experienceYears,
    this.languages,
    this.skills,
    this.qualifications,
    this.certifications,

    // Consultation rates for astrologers
    this.chatRate,
    this.callRate,
    this.videoRate,

    // Professional details for astrologers
    this.education,
    this.experience,

    // Payment details for astrologers
    this.upiId,
    this.totalEarnings,
    this.pendingPayouts,
    this.lastPayoutAt,

    // Bank details for astrologers
    this.accountHolderName,
    this.accountNumber,
    this.bankName,
    this.ifscCode,
    this.panCardUrl,

    // Rating and reviews
    this.rating,
    this.totalReviews,
    this.totalConsultations,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    try {
      debugPrint('🔍 User.fromJson parsing data: ${json.keys.join(', ')}');
      
      // Test each field parsing individually to catch exact failure point
      String testId;
      String? testPhone;
      String? testEmail; 
      String testName;
      UserRole testRole;
      AccountStatus testAccountStatus;
      VerificationStatus testVerificationStatus;
      AuthType testAuthType;
      
      try {
        testId = json['id']?.toString() ?? '';
        debugPrint('✅ ID parsing successful: $testId');
      } catch (e) {
        debugPrint('❌ ID parsing failed: $e');
        rethrow;
      }
      
      try {
        testPhone = json['phone_number']?.toString();
        debugPrint('✅ Phone parsing successful: $testPhone');
      } catch (e) {
        debugPrint('❌ Phone parsing failed: $e');
        rethrow;
      }
      
      try {
        testEmail = json['email_address']?.toString() ?? json['email']?.toString();
        debugPrint('✅ Email parsing successful: $testEmail');
      } catch (e) {
        debugPrint('❌ Email parsing failed: $e');
        rethrow;
      }
      
      try {
        testName = json['full_name']?.toString() ?? json['name']?.toString() ?? '';
        debugPrint('✅ Name parsing successful: $testName');
      } catch (e) {
        debugPrint('❌ Name parsing failed: $e');
        rethrow;
      }
      
      try {
        testRole = UserRoleExtension.fromString(json['user_type']?.toString() ?? json['role']?.toString() ?? 'customer');
        debugPrint('✅ Role parsing successful: $testRole');
      } catch (e) {
        debugPrint('❌ Role parsing failed with user_type: ${json['user_type']}, role: ${json['role']}');
        debugPrint('❌ Role parsing error: $e');
        rethrow;
      }
      
      try {
        testAccountStatus = AccountStatusExtension.fromString(json['account_status']?.toString() ?? 'active');
        debugPrint('✅ Account status parsing successful: $testAccountStatus');
      } catch (e) {
        debugPrint('❌ Account status parsing failed with: ${json['account_status']}');
        debugPrint('❌ Account status parsing error: $e');
        rethrow;
      }
      
      try {
        testVerificationStatus = _parseVerificationStatus(json);
        debugPrint('✅ Verification status parsing successful: $testVerificationStatus');
      } catch (e) {
        debugPrint('❌ Verification status parsing failed with: ${json['verification_status']}');
        debugPrint('❌ Verification status parsing error: $e');
        rethrow;
      }
      
      try {
        testAuthType = AuthTypeExtension.fromString(json['auth_type']?.toString() ?? 'email');
        debugPrint('✅ Auth type parsing successful: $testAuthType');
      } catch (e) {
        debugPrint('❌ Auth type parsing failed with: ${json['auth_type']}');
        debugPrint('❌ Auth type parsing error: $e');
        rethrow;
      }

      return User(
        // Basic user fields (using tested variables)
        id: testId,
        phone: testPhone,
        email: testEmail,
        name: testName,
        role: testRole,
        accountStatus: testAccountStatus,
        verificationStatus: testVerificationStatus,
        authType: testAuthType,
        createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'].toString()) : DateTime.now(),
        updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at'].toString()) : DateTime.now(),
        verifiedAt: json['verified_at'] != null ? DateTime.parse(json['verified_at'].toString()) : null,
        verifiedBy: json['verified_by']?.toString(),
        rejectionReason: json['rejection_reason']?.toString(),

        // Customer-specific fields
        walletBalance: _parseDouble(json['wallet_balance']),
        dateOfBirth: json['date_of_birth'] != null ? DateTime.tryParse(json['date_of_birth'].toString()) : null,
        timeOfBirth: json['time_of_birth']?.toString() ?? json['birth_time']?.toString(),
        placeOfBirth: json['place_of_birth']?.toString() ?? json['birth_place']?.toString(),

        // Additional user fields
        gender: json['gender']?.toString(),
        address: json['address']?.toString(),
        city: json['city']?.toString(),
        state: json['state']?.toString(),
        country: json['country']?.toString(),
        zip: json['zip']?.toString(),

        // Astrologer-specific fields
        isOnline: _parseBool(json['is_online']),
        bio: json['bio']?.toString(),
        profilePicture: _getProfilePicture(json),
        experienceYears: _parseInt(json['experience_years']),
        languages: _parseStringListOrString(json['languages']),
        skills: _parseStringListOrString(json['skills']),
        qualifications: _parseStringListOrString(json['qualifications']) ?? _parseStringListOrString(json['specializations']),
        certifications: _parseStringListOrString(json['certifications']),

        // Consultation rates
        chatRate: _parseDouble(json['chat_rate']),
        callRate: _parseDouble(json['call_rate']),
        videoRate: _parseDouble(json['video_rate']),

        // Professional details
        education: json['education']?.toString(),
        experience: json['experience']?.toString(),

        // Payment details
        upiId: json['upi_id']?.toString(),
        totalEarnings: _parseDouble(json['total_earnings']),
        pendingPayouts: _parseDouble(json['pending_payouts']),
        lastPayoutAt: json['last_payout_at'] != null ? DateTime.tryParse(json['last_payout_at'].toString()) : null,

        // Bank details - from flat fields (as returned by API)
        accountHolderName: json['account_holder_name']?.toString(),
        accountNumber: json['account_number']?.toString(),
        bankName: json['bank_name']?.toString(),
        ifscCode: json['ifsc_code']?.toString(),
        panCardUrl: json['pan_card_url']?.toString(),

        // Rating and reviews
        rating: _parseDouble(json['rating']),
        totalReviews: _parseInt(json['total_reviews']),
        totalConsultations: _parseInt(json['total_consultations']),
      );
    } catch (e, stackTrace) {
      debugPrint('❌ Error parsing User.fromJson: $e');
      debugPrint('📋 JSON data: $json');
      debugPrint('🔍 Stack trace: $stackTrace');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      // Basic user fields
      'id': id,
      'phone': phone,
      'email': email,
      'name': name,
      'role': role.value,
      'account_status': accountStatus.value,
      'verification_status': verificationStatus.value,
      'auth_type': authType.value,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'verified_at': verifiedAt?.toIso8601String(),
      'verified_by': verifiedBy,
      'rejection_reason': rejectionReason,

      // Customer-specific fields
      'wallet_balance': walletBalance,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'time_of_birth': timeOfBirth,
      'place_of_birth': placeOfBirth,

      // Additional user fields
      'gender': gender,
      'address': address,
      'city': city,
      'state': state,
      'country': country,
      'zip': zip,

      // Astrologer-specific fields
      'is_online': isOnline,
      'bio': bio,
      'profile_picture': profilePicture,
      'experience_years': experienceYears,
      'languages': languages,
      'skills': skills,
      'qualifications': qualifications,
      'certifications': certifications,

      // Consultation rates
      'chat_rate': chatRate,
      'call_rate': callRate,
      'video_rate': videoRate,

      // Professional details
      'education': education,
      'experience': experience,

      // Payment details
      'upi_id': upiId,
      'total_earnings': totalEarnings,
      'pending_payouts': pendingPayouts,
      'last_payout_at': lastPayoutAt?.toIso8601String(),

      // Bank details
      'account_holder_name': accountHolderName,
      'account_number': accountNumber,
      'bank_name': bankName,
      'ifsc_code': ifscCode,
      'pan_card_url': panCardUrl,

      // Rating and reviews
      'rating': rating,
      'total_reviews': totalReviews,
      'total_consultations': totalConsultations,
    };
  }

  User copyWith({
    String? id,
    String? phone,
    String? email,
    String? name,
    UserRole? role,
    AccountStatus? accountStatus,
    VerificationStatus? verificationStatus,
    AuthType? authType,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? verifiedAt,
    String? verifiedBy,
    String? rejectionReason,

    // Customer-specific fields
    double? walletBalance,
    DateTime? dateOfBirth,
    String? timeOfBirth,
    String? placeOfBirth,

    // Additional user fields
    String? gender,
    String? address,
    String? city,
    String? state,
    String? country,
    String? zip,

    // Astrologer-specific fields
    bool? isOnline,
    String? bio,
    String? profilePicture,
    int? experienceYears,
    List<String>? languages,
    List<String>? skills,
    List<String>? qualifications,
    List<String>? certifications,

    // Consultation rates
    double? chatRate,
    double? callRate,
    double? videoRate,

    // Professional details
    String? education,
    String? experience,
    String? sampleVideoUrl,
    List<String>? certificateUrls,
    String? identityDocumentUrl,

    // Payment details
    String? upiId,
    double? totalEarnings,
    double? pendingPayouts,
    DateTime? lastPayoutAt,

    // Bank details
    String? accountHolderName,
    String? accountNumber,
    String? bankName,
    String? ifscCode,
    String? panCardUrl,

    // Rating and reviews
    double? rating,
    int? totalReviews,
    int? totalConsultations,
  }) {
    return User(
      // Basic user fields
      id: id ?? this.id,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      accountStatus: accountStatus ?? this.accountStatus,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      authType: authType ?? this.authType,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      verifiedBy: verifiedBy ?? this.verifiedBy,
      rejectionReason: rejectionReason ?? this.rejectionReason,

      // Customer-specific fields
      walletBalance: walletBalance ?? this.walletBalance,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      timeOfBirth: timeOfBirth ?? this.timeOfBirth,
      placeOfBirth: placeOfBirth ?? this.placeOfBirth,

      // Additional user fields
      gender: gender ?? this.gender,
      address: address ?? this.address,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      zip: zip ?? this.zip,

      // Astrologer-specific fields
      isOnline: isOnline ?? this.isOnline,
      bio: bio ?? this.bio,
      profilePicture: profilePicture ?? this.profilePicture,
      experienceYears: experienceYears ?? this.experienceYears,
      languages: languages ?? this.languages,
      skills: skills ?? this.skills,
      qualifications: qualifications ?? this.qualifications,
      certifications: certifications ?? this.certifications,

      // Consultation rates
      chatRate: chatRate ?? this.chatRate,
      callRate: callRate ?? this.callRate,
      videoRate: videoRate ?? this.videoRate,

      // Professional details
      education: education ?? this.education,
      experience: experience ?? this.experience,

      // Payment details
      upiId: upiId ?? this.upiId,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      pendingPayouts: pendingPayouts ?? this.pendingPayouts,
      lastPayoutAt: lastPayoutAt ?? this.lastPayoutAt,

      // Bank details
      accountHolderName: accountHolderName ?? this.accountHolderName,
      accountNumber: accountNumber ?? this.accountNumber,
      bankName: bankName ?? this.bankName,
      ifscCode: ifscCode ?? this.ifscCode,
      panCardUrl: panCardUrl ?? this.panCardUrl,

      // Rating and reviews
      rating: rating ?? this.rating,
      totalReviews: totalReviews ?? this.totalReviews,
      totalConsultations: totalConsultations ?? this.totalConsultations,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is User && other.id == id;
  }

  @override
  int get hashCode {
    return id.hashCode;
  }

  @override
  String toString() {
    return 'User(id: $id, name: $name, email: $email, role: $role)';
  }

  // Helper getters
  bool get isCustomer => role == UserRole.customer;
  bool get isAstrologer => role == UserRole.astrologer;
  bool get isAdmin => role == UserRole.administrator;
  bool get isManager => role == UserRole.manager;

  bool get isEmailVerified => verificationStatus == VerificationStatus.verified;
  bool get isActive => accountStatus == AccountStatus.active;
  bool get isInactive => accountStatus == AccountStatus.inactive;
  bool get isSuspended => accountStatus == AccountStatus.suspended;
  bool get isBanned => accountStatus == AccountStatus.banned;

  // For astrologers
  bool get canProvideConsultations => isAstrologer && isActive && isEmailVerified && (isOnline ?? false);

  // For customers
  bool get canBookConsultations => isCustomer && isActive && isEmailVerified;

  // Check if astrologer profile is complete
  bool get isProfileComplete {
    if (isCustomer) {
      // For customers, profile is complete if basic details exist
      return name.isNotEmpty && (phone != null || email != null);
    } else if (isAstrologer) {
      // If astrologer is already verified by admin, consider profile complete
      // This allows verified astrologers to log in without re-entering details
      if (verificationStatus == VerificationStatus.verified) {
        return true;
      }
      // For new/pending astrologers, check if required professional fields are filled
      return name.isNotEmpty &&
          (phone != null || email != null) &&
          bio != null && bio!.isNotEmpty &&
          (experienceYears != null && experienceYears! > 0) &&
          languages != null && languages!.isNotEmpty &&
          skills != null && skills!.isNotEmpty &&
          ((chatRate != null && chatRate! > 0) ||
           (callRate != null && callRate! > 0) ||
           (videoRate != null && videoRate! > 0));
    }
    // For other roles (admin, manager)
    return name.isNotEmpty && (phone != null || email != null);
  }

  String get displayRole {
    switch (role) {
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

  String get displayStatus {
    switch (accountStatus) {
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

  String get displayVerificationStatus {
    switch (verificationStatus) {
      case VerificationStatus.pending:
        return 'Pending';
      case VerificationStatus.verified:
        return 'Verified';
      case VerificationStatus.rejected:
        return 'Rejected';
    }
  }

  // Helper methods for safe type parsing
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      if (value.isEmpty) return null;
      return double.tryParse(value);
    }
    return null;
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      if (value.isEmpty) return null;
      // Try parsing as int first, then as double and convert to int
      final intResult = int.tryParse(value);
      if (intResult != null) return intResult;
      final doubleResult = double.tryParse(value);
      return doubleResult?.toInt();
    }
    return null;
  }

  static bool? _parseBool(dynamic value) {
    if (value == null) return null;
    if (value is bool) return value;
    if (value is String) {
      return value.toLowerCase() == 'true' || value == '1';
    }
    if (value is int) return value == 1;
    return null;
  }


  static List<String>? _parseStringListOrString(dynamic value) {
    if (value == null) return null;
    if (value is List) {
      return value.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList();
    }
    if (value is String) {
      if (value.isEmpty) return null;
      // Split string by comma and trim whitespace
      return value.split(',').map((e) => e.trim()).where((s) => s.isNotEmpty).toList();
    }
    return null;
  }

  static VerificationStatus _parseVerificationStatus(Map<String, dynamic> json) {
    // Parse verification_status field
    final explicitStatus = json['verification_status']?.toString();
    if (explicitStatus != null && explicitStatus.isNotEmpty) {
      return VerificationStatusExtension.fromString(explicitStatus);
    }

    // Default fallback if verification_status is missing
    return VerificationStatus.pending;
  }

  static String? _getProfilePicture(Map<String, dynamic> json) {
    // Priority order: social_profile_image (for Google users), then profile_picture/profile_image
    final fields = [
      'social_profile_image',
      'profile_picture', 
      'profile_image'
    ];
    
    for (final field in fields) {
      final value = json[field]?.toString();
      if (value != null && value.isNotEmpty) {
        return value;
      }
    }
    
    return null;
  }
}
