import 'enums.dart';

class Astrologer {
  final String id;
  final String fullName;
  final String emailAddress;
  final String? phoneNumber;
  final String? profileImage;
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
      id: json['id']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? '',
      emailAddress: json['email_address']?.toString() ?? '',
      phoneNumber: json['phone_number']?.toString(),
      profileImage: json['profile_image']?.toString(),
      bio: json['bio']?.toString(),
      qualifications: _parseStringList(json['qualifications']) ?? [],
      languages: _parseStringList(json['languages']) ?? [],
      skills: _parseStringList(json['skills']) ?? [],
      experienceYears: _parseInt(json['experience_years']) ?? 0,
      isOnline: _parseBool(json['is_online']) ?? false,
      accountStatus: json['account_status']?.toString(),
      verificationStatus: _parseVerificationStatus(json),
      isAvailable: _parseBool(json['is_available']) ?? false,
      rating: _parseDouble(json['rating']) ?? 0.0,
      totalReviews: _parseInt(json['total_reviews']) ?? 0,
      totalConsultations: _parseInt(json['total_consultations']) ?? 0,
      chatRate: _parseDouble(json['chat_rate']) ?? 0.0,
      callRate: _parseDouble(json['call_rate']) ?? 0.0,
      videoRate: _parseDouble(json['video_rate']) ?? 0.0,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now() : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email_address': emailAddress,
      'phone_number': phoneNumber,
      'profile_image': profileImage,
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
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value);
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

  static List<String>? _parseStringList(dynamic value) {
    if (value == null) return null;
    if (value is List) {
      return value.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList();
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
