class User {
  final int ID;
  final int? authorId;
  final String salution;
  final String firstName;
  final String lastName;
  final String userGender;
  final String? userDob;
  final String userName;
  final String userEmail;
  final String userPassword;
  final String userRole;
  final String authType;
  final String? authToken;
  final String? astroType;
  final String? astroCharges;
  final String? userLanguages;
  final String? userExperience;
  final String? userBirthtime;
  final String? userBirthplace;
  final String? userPhone;
  final String? userCountry;
  final String? userState;
  final String? userCity;
  final String? userAbout;
  final String? userAvatar;
  final String userRegistered;
  final String? firebaseToken;
  final String? razorpayContactId;
  final String? razorpayFundAccountId;
  final String createdAt;
  final String updatedAt;

  User({
    required this.ID,
    this.authorId,
    required this.salution,
    required this.firstName,
    required this.lastName,
    required this.userGender,
    this.userDob,
    required this.userName,
    required this.userEmail,
    required this.userPassword,
    required this.userRole,
    required this.authType,
    this.authToken,
    this.astroType,
    this.astroCharges,
    this.userLanguages,
    this.userExperience,
    this.userBirthtime,
    this.userBirthplace,
    this.userPhone,
    this.userCountry,
    this.userState,
    this.userCity,
    this.userAbout,
    this.userAvatar,
    required this.userRegistered,
    this.firebaseToken,
    this.razorpayContactId,
    this.razorpayFundAccountId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      ID: json['ID'] as int,
      authorId: json['author_id'] != null ? json['author_id'] as int : null,
      salution: json['salution'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      userGender: json['user_gender'] as String,
      userDob: json['user_dob'] as String?,
      userName: json['user_name'] as String,
      userEmail: json['user_email'] as String,
      userPassword: json['user_password'] ?? '', // Password likely isn't returned in API
      userRole: json['user_role'] as String,
      authType: json['auth_type'] as String,
      authToken: json['auth_token'] as String?,
      astroType: json['astro_type'] as String?,
      astroCharges: json['astro_charges'] as String?,
      userLanguages: json['user_languages'] as String?,
      userExperience: json['user_experience'] as String?,
      userBirthtime: json['user_birthtime'] as String?,
      userBirthplace: json['user_birthplace'] as String?,
      userPhone: json['user_phone'] as String?,
      userCountry: json['user_country'] as String?,
      userState: json['user_state'] as String?,
      userCity: json['user_city'] as String?,
      userAbout: json['user_about'] as String?,
      userAvatar: json['user_avatar'] as String?,
      userRegistered: json['user_registered'] as String,
      firebaseToken: json['firebase_token'] as String?,
      razorpayContactId: json['razorpay_contact_id'] as String?,
      razorpayFundAccountId: json['razorpay_fund_account_id'] as String?,
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'ID': ID,
      'author_id': authorId,
      'salution': salution,
      'first_name': firstName,
      'last_name': lastName,
      'user_gender': userGender,
      'user_dob': userDob,
      'user_name': userName,
      'user_email': userEmail,
      'user_password': userPassword,
      'user_role': userRole,
      'auth_type': authType,
      'auth_token': authToken,
      'astro_type': astroType,
      'astro_charges': astroCharges,
      'user_languages': userLanguages,
      'user_experience': userExperience,
      'user_birthtime': userBirthtime,
      'user_birthplace': userBirthplace,
      'user_phone': userPhone,
      'user_country': userCountry,
      'user_state': userState,
      'user_city': userCity,
      'user_about': userAbout,
      'user_avatar': userAvatar,
      'user_registered': userRegistered,
      'firebase_token': firebaseToken,
      'razorpay_contact_id': razorpayContactId,
      'razorpay_fund_account_id': razorpayFundAccountId,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
