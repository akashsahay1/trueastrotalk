import 'enums.dart';

class Astrologer {
  final String id;
  final String fullName;
  final String emailAddress;
  final String? phoneNumber;
  final String? profileImageId; // Reference to media collection
  final String? socialProfileImageUrl; // External URL from Google OAuth
  final String? profileImage; // Resolved image URL (computed field)
  final String? bio;
  final List<String> qualifications;
  final List<String> languages;
  final List<String> skills;
  final int experienceYears;
  final bool isOnline;
  final String? accountStatus;
  final VerificationStatus verificationStatus;
  final bool isAvailable;
  final double rating;
  final int totalReviews;
  final int totalConsultations;
  final double chatRate;
  final double callRate;
  final double videoRate;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Astrologer({
    required this.id,
    required this.fullName,
    required this.emailAddress,
    this.phoneNumber,
    this.profileImageId,
    this.socialProfileImageUrl,
    this.profileImage,
    this.bio,
    required this.qualifications,
    required this.languages,
    required this.skills,
    required this.experienceYears,
    required this.isOnline,
    required this.accountStatus,
    required this.verificationStatus,
    required this.isAvailable,
    required this.rating,
    required this.totalReviews,
    required this.totalConsultations,
    required this.chatRate,
    required this.callRate,
    required this.videoRate,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Astrologer.fromJson(Map<String, dynamic> json) {
    return Astrologer(
      id: json['id']!.toString(),
      fullName: json['full_name']!.toString(),
      emailAddress: json['email_address']!.toString(),
      phoneNumber: json['phone_number']?.toString(),
      profileImageId: json['profile_image_id']?.toString(),
      socialProfileImageUrl: json['social_profile_image_url']?.toString(),
      profileImage: json['profile_image']?.toString(), // This will be the resolved URL from backend
      bio: json['bio']?.toString(),
      qualifications: _parseStringList(json['qualifications']),
      languages: _parseStringList(json['languages']),
      skills: _parseStringList(json['skills']),
      experienceYears: _parseInt(json['experience_years']),
      isOnline: _parseBool(json['is_online']),
      accountStatus: json['account_status']?.toString(),
      verificationStatus: _parseVerificationStatus(json),
      isAvailable: _parseBool(json['is_available']),
      rating: _parseDouble(json['rating']),
      totalReviews: _parseInt(json['total_reviews']),
      totalConsultations: _parseInt(json['total_consultations']),
      chatRate: _parseDouble(json['chat_rate']),
      callRate: _parseDouble(json['call_rate']),
      videoRate: _parseDouble(json['video_rate']),
      createdAt: DateTime.parse(json['created_at']!.toString()),
      updatedAt: DateTime.parse(json['updated_at']!.toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email_address': emailAddress,
      'phone_number': phoneNumber,
      'profile_image_id': profileImageId,
      'social_profile_image_url': socialProfileImageUrl,
      'profile_image': profileImage, // Include resolved URL if available
      'bio': bio,
      'qualifications': qualifications,
      'languages': languages,
      'skills': skills,
      'experience_years': experienceYears,
      'is_online': isOnline,
      'account_status': accountStatus,
      'verification_status': verificationStatus.value,
      'is_available': isAvailable,
      'rating': rating,
      'total_reviews': totalReviews,
      'total_consultations': totalConsultations,
      'chat_rate': chatRate,
      'call_rate': callRate,
      'video_rate': videoRate,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // Helper methods for safe type parsing
  static double _parseDouble(dynamic value) {
    if (value == null) throw Exception('Required double value is null');
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      final parsed = double.tryParse(value);
      if (parsed == null) throw Exception('Invalid double value: $value');
      return parsed;
    }
    throw Exception('Cannot parse double from: $value');
  }

  static int _parseInt(dynamic value) {
    if (value == null) throw Exception('Required int value is null');
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      final parsed = int.tryParse(value);
      if (parsed == null) throw Exception('Invalid int value: $value');
      return parsed;
    }
    throw Exception('Cannot parse int from: $value');
  }

  static bool _parseBool(dynamic value) {
    if (value == null) throw Exception('Required bool value is null');
    if (value is bool) return value;
    if (value is String) {
      return value.toLowerCase() == 'true' || value == '1';
    }
    if (value is int) return value == 1;
    throw Exception('Cannot parse bool from: $value');
  }

  static List<String> _parseStringList(dynamic value) {
    if (value == null) throw Exception('Required string list value is null');
    if (value is List) {
      return value.map((e) => e!.toString()).toList();
    }
    if (value is String) {
      // Handle comma-separated string
      if (value.isEmpty) throw Exception('String list cannot be empty');
      return value.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    }
    throw Exception('Cannot parse string list from: $value');
  }

  static VerificationStatus _parseVerificationStatus(Map<String, dynamic> json) {
    // Parse verification_status field
    final explicitStatus = json['verification_status']?.toString();
    if (explicitStatus == null || explicitStatus.isEmpty) {
      throw Exception('Required verification_status is missing');
    }
    return VerificationStatusExtension.fromString(explicitStatus);
  }

  // Helper getters
  String get displayName => fullName;
  String get qualificationsText => qualifications.join(', ');
  String get languagesText => languages.join(', ');
  String get skillsText => skills.join(', ');
  String get experienceText => '$experienceYears+ years';
  String get ratingText => rating.toStringAsFixed(1);
  String get onlineStatusText => isOnline ? 'Online' : 'Offline';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Astrologer && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'Astrologer(id: $id, name: $fullName, online: $isOnline)';
  }
}
