import 'package:trueastrotalk/config/environment.dart';

class User {
  final int id;
  final String name;
  final String uname;
  final String gender;
  final String dob;
  final String speciality;
  final String experience;
  final double rating;
  final String price;
  final String image;
  final String languages;
  final String? role;
  final String? userAbout;
  final String? userExperience;
  final String? userPhone;

  User({
    this.id = 0,
    this.name = 'Unknown',
    this.uname = 'Unknown',
    this.gender = 'Unknown',
    this.dob = '01-10-1988',
    this.speciality = 'N/A',
    this.experience = 'N/A',
    this.rating = 0.0,
    this.price = 'N/A',
    this.image = 'https://www.trueastrotalk.com/assets/images/avatar-1.jpg',
    this.languages = 'Not specified',
    this.role,
    this.userAbout,
    this.userExperience,
    this.userPhone,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['ID'] ?? json['id'] ?? 0,
      name: _formatName(json),
      uname: _formatUserName(json),
      gender: json['user_gender'] ?? '',
      speciality: json['astro_type'],
      experience: json['user_experience'] ?? '0 years',
      rating: _parseRating(json),
      price: _formatPrice(json),
      image: _formatImageUrl(json),
      languages: json['user_languages'] ?? 'Hindi, English',
      role: json['user_role'],
      userAbout: json['user_about'],
      userExperience: json['user_experience'],
      userPhone: json['user_phone'],
    );
  }

  // Helper methods for JSON parsing
  static String _formatName(Map<String, dynamic> json) {
    final firstName = json['first_name'] ?? '';
    final lastName = json['last_name'] ?? '';

    if (firstName.isNotEmpty && lastName.isNotEmpty) {
      return '$firstName $lastName';
    } else if (firstName.isNotEmpty) {
      return firstName;
    } else if (json['first_name'] != null) {
      return json['first_name'];
    } else {
      return 'Unknown';
    }
  }

  // Helper methods for JSON parsing
  static String _formatUserName(Map<String, dynamic> json) {
    final userName = json['user_name'] ?? '';

    if (userName.isNotEmpty) {
      return '$userName';
    } else {
      return '';
    }
  }

  static double _parseRating(Map<String, dynamic> json) {
    if (json['rating'] != null) {
      try {
        if (json['rating'] is double) {
          return json['rating'];
        } else if (json['rating'] is int) {
          return json['rating'].toDouble();
        } else {
          return double.tryParse(json['rating'].toString()) ?? 4.5;
        }
      } catch (e) {
        return 4.5; // Default rating
      }
    }
    return 4.5; // Default rating
  }

  static String _formatPrice(Map<String, dynamic> json) {
    if (json['astro_charges'] != null) {
      return '₹${json['astro_charges']}/m';
    } else if (json['price'] != null) {
      if (json['price'].toString().contains('₹')) {
        return json['price'];
      } else {
        return '₹${json['price']}/m';
      }
    }
    return '₹40/m'; // Default price
  }

  static String _formatImageUrl(Map<String, dynamic> json) {
    final baseUrl = Environment.baseUrl;
    if (json['user_avatar'] != null && json['user_avatar'].toString().isNotEmpty) {
      final String avatar = json['user_avatar'];
      if (avatar.startsWith('http')) {
        return avatar;
      } else if (avatar.startsWith('uploads/')) {
        return '$baseUrl/${avatar}';
      } else {
        return avatar;
      }
    } else if (json['image'] != null && json['image'].toString().isNotEmpty) {
      return json['image'];
    }
    return 'https://www.trueastrotalk.com/assets/images/avatar-1.jpg';
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'uname': uname,
      'gender': gender,
      'dob': dob,
      'speciality': speciality,
      'experience': experience,
      'rating': rating,
      'price': price,
      'image': image,
      'languages': languages,
      'role': role,
      'userAbout': userAbout,
      'userExperience': userExperience,
      'userPhone': userPhone,
    };
  }
}
