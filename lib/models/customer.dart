import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/models/astrologer.dart';

class Customer {
  final int id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phoneNumber;
  final String? avatar;
  final String role; // 'customer', 'astrologer', etc.
  final bool isOnline;
  final String? userAbout;
  final String? userExperience;
  final String? userLanguages;
  final String? astroType;
  final double? astroCharges;

  // Computed property for full name
  String get name => '$firstName $lastName';

  Customer({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phoneNumber,
    this.avatar,
    required this.role,
    this.isOnline = false,
    this.userAbout,
    this.userExperience,
    this.userLanguages,
    this.astroType,
    this.astroCharges,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['ID'] ?? json['id'] ?? 0,
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['user_email'] ?? json['email'] ?? '',
      phoneNumber: json['user_phone'] ?? json['phone_number'],
      avatar: _formatAvatarUrl(json),
      role: json['user_role'] ?? json['role'] ?? 'customer',
      isOnline: json['is_online'] == true || json['is_online'] == 1 || false,
      userAbout: json['user_about'],
      userExperience: json['user_experience'],
      userLanguages: json['user_languages'],
      astroType: json['astro_type'],
      astroCharges: _parseCharges(json),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone_number': phoneNumber,
      'avatar': avatar,
      'role': role,
      'is_online': isOnline,
      'user_about': userAbout,
      'user_experience': userExperience,
      'user_languages': userLanguages,
      'astro_type': astroType,
      'astro_charges': astroCharges,
    };
  }

  // Helper method to format avatar URL
  static String? _formatAvatarUrl(Map<String, dynamic> json) {
    final baseUrl = Environment.baseUrl;
    if (json['user_avatar'] != null && json['user_avatar'].toString().isNotEmpty) {
      final String avatar = json['user_avatar'];
      if (avatar.startsWith('http')) {
        return avatar;
      } else if (avatar.startsWith('uploads/')) {
        return '$baseUrl/$avatar';
      } else {
        return avatar;
      }
    }
    return null;
  }

  // Helper method to parse astrologer charges
  static double? _parseCharges(Map<String, dynamic> json) {
    if (json['astro_charges'] != null) {
      try {
        if (json['astro_charges'] is double) {
          return json['astro_charges'];
        } else if (json['astro_charges'] is int) {
          return json['astro_charges'].toDouble();
        } else {
          return double.tryParse(json['astro_charges'].toString());
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Convert user to astrologer (if the user is an astrologer)
  Astrologer toAstrologer() {
    // Only convert if the user is an astrologer
    if (role != 'astrologer') {
      throw Exception('Cannot convert a non-astrologer user to an Astrologer model');
    }

    return Astrologer(
      id: id,
      name: name,
      speciality: astroType ?? 'Astrology',
      experience: userExperience ?? '0 years',
      rating: 4.5, // You may want to get this from somewhere else
      price: '₹${astroCharges?.toStringAsFixed(0) ?? "40"}/min',
      image: avatar ?? 'https://trueastrologgers.avenuxtechspire.com/assets/images/avatar-1.jpg',
      isOnline: isOnline,
      languages: userLanguages ?? 'Hindi, English',
      astroType: astroType,
      userAbout: userAbout,
      userExperience: userExperience,
      userPhone: phoneNumber,
    );
  }
}
