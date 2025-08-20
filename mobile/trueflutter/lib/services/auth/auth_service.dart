import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:convert';
import '../../models/user.dart' as app_user;
import '../../models/enums.dart';
import '../api/user_api_service.dart';

class AuthResult {
  final bool success;
  final String? message;
  final app_user.User? user;
  final String? token;

  AuthResult({required this.success, this.message, this.user, this.token});

  factory AuthResult.success({String? message, app_user.User? user, String? token}) {
    return AuthResult(success: true, message: message, user: user, token: token);
  }

  factory AuthResult.failure({required String message}) {
    return AuthResult(success: false, message: message);
  }
}

class GoogleSignUpRequiredException implements Exception {
  final String name;
  final String email;
  final String accessToken;

  GoogleSignUpRequiredException({required this.name, required this.email, required this.accessToken});

  @override
  String toString() => 'Google user needs to complete signup';
}

class CustomerExistsException implements Exception {
  final app_user.User existingUser;
  final String token;

  CustomerExistsException({required this.existingUser, required this.token});

  @override
  String toString() => 'Customer with this email already exists';
}

class AstrologerExistsException implements Exception {
  final app_user.User existingUser;

  AstrologerExistsException({required this.existingUser});

  @override
  String toString() => 'Astrologer with this email already exists';
}

class AstrologerRegistrationSuccessException implements Exception {
  final app_user.User newUser;

  AstrologerRegistrationSuccessException({required this.newUser});

  @override
  String toString() => 'Astrologer registration successful - pending verification';
}

class AuthService {
  final UserApiService _userApiService;

  app_user.User? _currentUser;
  String? _authToken;

  AuthService(this._userApiService);

  app_user.User? get currentUser => _currentUser;
  String? get authToken => _authToken;
  bool get isLoggedIn => _currentUser != null && _authToken != null;

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('auth_token');

    if (savedToken != null) {
      try {
        _authToken = savedToken;
        _currentUser = await _userApiService.getCurrentUser(savedToken);
      } catch (e) {
        try {
          final savedUserData = prefs.getString('user_data');
          if (savedUserData != null) {
            final userJson = jsonDecode(savedUserData) as Map<String, dynamic>;
            _currentUser = app_user.User.fromJson(userJson);
            debugPrint('Loaded user data from local storage as fallback');
          } else {
            await _clearAuthData();
          }
        } catch (localError) {
          await _clearAuthData();
        }
      }
    }
  }

  Future<AuthResult> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required UserType userType,
    DateTime? dateOfBirth,
    TimeOfDay? timeOfBirth,
    String? placeOfBirth,
    String? experience,
    String? bio,
    String? languages,
    String? qualifications,
    String? skills,
    String? address,
    String? city,
    String? state,
    String? country,
    String? zip,
    double? callRate,
    double? chatRate,
    double? videoRate,
    String? profileImagePath,
  }) async {
    try {
      String? timeOfBirthStr;
      if (timeOfBirth != null) {
        timeOfBirthStr = '${timeOfBirth.hour.toString().padLeft(2, '0')}:${timeOfBirth.minute.toString().padLeft(2, '0')}';
      }

      final role = userType == UserType.customer ? 'customer' : 'astrologer';

      final user = await registerWithEmailPassword(
        name: name,
        email: email,
        password: password,
        phone: phone,
        role: role,
        dateOfBirth: dateOfBirth,
        timeOfBirth: timeOfBirthStr,
        placeOfBirth: placeOfBirth,
        experience: experience,
        bio: bio,
        languages: languages,
        qualifications: qualifications,
        skills: skills,
        address: address,
        city: city,
        state: state,
        country: country,
        zip: zip,
        callRate: callRate,
        chatRate: chatRate,
        videoRate: videoRate,
        profileImagePath: profileImagePath,
      );

      return AuthResult.success(message: 'Registration successful', user: user);
    } on AstrologerRegistrationSuccessException catch (e) {
      return AuthResult.success(message: 'Astrologer registration submitted successfully. Please wait for admin approval.', user: e.newUser);
    } catch (e) {
      return AuthResult.failure(message: e.toString());
    }
  }

  Future<app_user.User> registerWithEmailPassword({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String role,
    DateTime? dateOfBirth,
    String? timeOfBirth,
    String? placeOfBirth,
    String? authType,
    String? googleAccessToken,
    String? experience,
    String? bio,
    String? languages,
    String? qualifications,
    String? skills,
    String? address,
    String? city,
    String? state,
    String? country,
    String? zip,
    double? callRate,
    double? chatRate,
    double? videoRate,
    String? profileImagePath,
  }) async {
    try {
      final user = await _userApiService.registerUser(
        name: name,
        email: email,
        password: password,
        phone: phone,
        role: UserRoleExtension.fromString(role),
        dateOfBirth: dateOfBirth,
        timeOfBirth: timeOfBirth,
        placeOfBirth: placeOfBirth,
        authType: authType,
        googleAccessToken: googleAccessToken,
        experience: experience,
        bio: bio,
        languages: languages,
        qualifications: qualifications,
        skills: skills,
        address: address,
        city: city,
        state: state,
        country: country,
        zip: zip,
        callRate: callRate,
        chatRate: chatRate,
        videoRate: videoRate,
        profileImagePath: profileImagePath,
      );

      if (user.role == UserRole.astrologer) {
        if (profileImagePath != null) {
          try {
            final imageUrl = await _uploadProfileImage(profileImagePath, user.id);
            if (imageUrl != null) {
              await _updateUserProfileImage(user.id, imageUrl);
            }
          } catch (imageError) {
            debugPrint('Profile image upload failed: $imageError');
          }
        }
        throw AstrologerRegistrationSuccessException(newUser: user);
      }

      if (user.role == UserRole.customer) {
        try {
          final loginResult = await _userApiService.loginUser(email: email, password: authType == 'google' ? null : password, authType: authType, googleAccessToken: googleAccessToken);

          final loggedInUser = loginResult['user'] as app_user.User;
          final token = loginResult['token'] as String;

          await _saveAuthData(loggedInUser, token);

          if (profileImagePath != null) {
            try {
              final updatedUser = await _userApiService.updateUserProfile(token: token, userData: {}, profileImagePath: profileImagePath);
              await _saveAuthData(updatedUser, token);
              return updatedUser;
            } catch (imageError) {
              debugPrint('Profile image update failed: $imageError');
            }
          }

          return loggedInUser;
        } catch (loginError) {
          return user;
        }
      }

      return user;
    } catch (e) {
      if (e.toString().contains('Email already exists') || e.toString().contains('already exists')) {
        try {
          final loginResult = await _userApiService.loginUser(email: email, password: authType == 'google' ? null : password, authType: authType, googleAccessToken: googleAccessToken);

          final existingUser = loginResult['user'] as app_user.User;
          final token = loginResult['token'] as String;

          if (role.toLowerCase() == 'customer' && existingUser.role == UserRole.customer) {
            final updatedProfileData = <String, dynamic>{};
            if (phone.isNotEmpty) updatedProfileData['phone_number'] = phone;
            if (dateOfBirth != null) updatedProfileData['date_of_birth'] = dateOfBirth.toIso8601String();
            if (timeOfBirth != null) updatedProfileData['time_of_birth'] = timeOfBirth;
            if (placeOfBirth != null) updatedProfileData['place_of_birth'] = placeOfBirth;

            if (updatedProfileData.isNotEmpty || profileImagePath != null) {
              try {
                await _userApiService.updateUserProfile(token: token, userData: updatedProfileData, profileImagePath: profileImagePath);
              } catch (updateError) {
                debugPrint('Profile update failed: $updateError');
              }
            }

            throw CustomerExistsException(existingUser: existingUser, token: token);
          } else if (role.toLowerCase() == 'astrologer' && existingUser.role == UserRole.astrologer) {
            throw AstrologerExistsException(existingUser: existingUser);
          }
        } catch (loginError) {
          debugPrint('Login for existing user failed: $loginError');
        }
      }

      if (e is AstrologerRegistrationSuccessException || e is CustomerExistsException || e is AstrologerExistsException) {
        rethrow;
      }

      throw Exception('Registration failed: ${e.toString()}');
    }
  }

  Future<app_user.User> signInWithEmailPassword({required String email, required String password}) async {
    try {
      final result = await _userApiService.loginUser(email: email, password: password);

      final user = result['user'] as app_user.User;
      final token = result['token'] as String;

      if (user.role == UserRole.astrologer) {
        debugPrint('🔍 Astrologer login check - Account Status: ${user.accountStatus}, Verification Status: ${user.verificationStatus}');

        if (user.accountStatus != AccountStatus.active) {
          throw Exception('Your astrologer account is ${user.displayStatus.toLowerCase()}. Please wait for admin approval.');
        }

        if (user.verificationStatus == VerificationStatus.rejected) {
          throw Exception('Your astrologer account verification was rejected. Please contact support.');
        }
      }

      await _saveAuthData(user, token);
      return user;
    } catch (e) {
      throw Exception('Login failed: ${e.toString()}');
    }
  }

  Future<app_user.User> signInWithGoogle() async {
    try {
      // Initialize Google Sign-In
      await GoogleSignIn.instance.initialize();

      // Check if authentication is supported
      if (!GoogleSignIn.instance.supportsAuthenticate()) {
        throw Exception('Google Sign-In authentication not supported on this platform');
      }

      GoogleSignInAccount? googleUser;

      // Listen for authentication events
      final subscription = GoogleSignIn.instance.authenticationEvents.listen((event) {
        if (event is GoogleSignInAuthenticationEventSignIn) {
          googleUser = event.user;
        }
      });

      try {
        // Start the authentication flow
        await GoogleSignIn.instance.authenticate(scopeHint: ['email', 'profile']);

        // Wait a moment for the event to be processed
        await Future.delayed(const Duration(milliseconds: 100));

        if (googleUser == null) {
          throw Exception('Sign in was canceled by user');
        }

        // Get the authentication tokens
        final GoogleSignInAuthentication googleAuth = googleUser!.authentication;

        if (googleAuth.idToken == null) {
          throw Exception('Failed to get Google ID token');
        }

        return await _processGoogleUser(googleUser!, googleAuth.idToken!);
      } finally {
        await subscription.cancel();
      }
    } on PlatformException catch (e) {
      throw Exception('Platform error during Google Sign-In: ${e.message}');
    } catch (e) {
      throw Exception('Google Sign-In failed: ${e.toString()}');
    }
  }

  Future<app_user.User> _processGoogleUser(GoogleSignInAccount googleUser, String accessToken) async {
    String? profileImageUrl = googleUser.photoUrl;
    if (profileImageUrl != null && profileImageUrl.contains('=s96')) {
      profileImageUrl = profileImageUrl.replaceAll('=s96', '=s400');
    }

    debugPrint('🔍 Google User Data:');
    debugPrint('   Email: ${googleUser.email}');
    debugPrint('   Name: ${googleUser.displayName}');
    debugPrint('   Original Photo URL: ${googleUser.photoUrl}');
    debugPrint('   Enhanced Photo URL: $profileImageUrl');

    try {
      final loginResult = await _userApiService.loginUser(email: googleUser.email, authType: 'google', googleAccessToken: accessToken, googlePhotoUrl: profileImageUrl, googleDisplayName: googleUser.displayName);

      final user = loginResult['user'] as app_user.User;
      final token = loginResult['token'] as String;

      debugPrint('🔍 Backend Response:');
      debugPrint('   User profile picture from backend: ${user.profilePicture}');
      debugPrint('   Auth type: ${user.authType}');

      // For Google users, save the Google photo URL separately for use in UI
      if (user.authType == AuthType.google && profileImageUrl != null && profileImageUrl.isNotEmpty) {
        await _saveGooglePhotoUrl(profileImageUrl);
      }

      await _saveAuthData(user, token);
      return user;
    } catch (loginError) {
      throw GoogleSignUpRequiredException(name: googleUser.displayName ?? googleUser.email.split('@')[0], email: googleUser.email, accessToken: accessToken);
    }
  }

  Future<Map<String, dynamic>> checkVerificationStatus() async {
    if (_authToken == null) {
      throw Exception('User not authenticated');
    }

    try {
      return await _userApiService.checkVerificationStatus(_authToken!);
    } catch (e) {
      throw Exception('Failed to check verification status: ${e.toString()}');
    }
  }

  Future<void> signOut() async {
    try {
      // Sign out from Google if signed in
      await GoogleSignIn.instance.disconnect();

      // Sign out from your backend
      if (_authToken != null) {
        await _userApiService.logoutUser(_authToken!);
      }
    } catch (e) {
      debugPrint('Logout failed: ${e.toString()}');
    } finally {
      await _clearAuthData();
    }
  }

  Future<app_user.User> updateUserProfile(Map<String, dynamic> userData, {String? profileImagePath}) async {
    if (_authToken == null) {
      throw Exception('User not authenticated');
    }

    try {
      final updatedUser = await _userApiService.updateUserProfile(token: _authToken!, userData: userData, profileImagePath: profileImagePath);

      _currentUser = updatedUser;
      await _saveUserData(updatedUser);
      return updatedUser;
    } catch (e) {
      throw Exception('Failed to update profile: ${e.toString()}');
    }
  }

  Future<void> refreshAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString('refresh_token');

    if (refreshToken == null) {
      throw Exception('No refresh token available');
    }

    try {
      final newToken = await _userApiService.refreshToken(refreshToken);
      _authToken = newToken;
      await prefs.setString('auth_token', newToken);
    } catch (e) {
      await _clearAuthData();
      throw Exception('Token refresh failed: ${e.toString()}');
    }
  }

  Future<void> _saveAuthData(app_user.User user, String token) async {
    _currentUser = user;
    _authToken = token;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await _saveUserData(user);
  }

  Future<void> _saveUserData(app_user.User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(user.toJson()));
  }

  Future<void> _clearAuthData() async {
    _currentUser = null;
    _authToken = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_data');
    await _clearGooglePhotoUrl();
  }

  bool get needsProfileCompletion {
    return _currentUser?.role == UserRole.astrologer && _currentUser?.accountStatus == AccountStatus.profileIncomplete;
  }

  bool get isAstrologerVerified {
    return _currentUser?.role == UserRole.astrologer && _currentUser?.accountStatus == AccountStatus.active && _currentUser?.verificationStatus == VerificationStatus.verified;
  }

  String get userDisplayName => _currentUser?.name ?? 'User';

  String get userRoleDisplay => _currentUser?.role.displayName ?? 'User';

  Future<void> setCurrentUser(app_user.User user, String token) async {
    await _saveAuthData(user, token);
  }

  Future<app_user.User?> refreshCurrentUser() async {
    if (_authToken == null) return null;

    try {
      final freshUser = await _userApiService.getCurrentUser(_authToken!);
      _currentUser = freshUser;
      await _saveUserData(freshUser);
      return freshUser;
    } catch (e) {
      debugPrint('Failed to refresh user data: $e');
      return _currentUser;
    }
  }

  Future<Map<String, List<String>>> getAstrologerOptions() async {
    return await _userApiService.getAstrologerOptions();
  }

  Future<String?> _uploadProfileImage(String imagePath, String userId) async {
    return await _userApiService.uploadPublicImage(imagePath, userId);
  }

  Future<void> _updateUserProfileImage(String userId, String imageUrl) async {
    return await _userApiService.updateUserProfileImage(userId, imageUrl);
  }

  // Save Google photo URL locally for Google users
  Future<void> _saveGooglePhotoUrl(String googlePhotoUrl) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('google_photo_url', googlePhotoUrl);
  }

  // Get saved Google photo URL for Google users
  Future<String?> getGooglePhotoUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('google_photo_url');
  }

  // Clear Google photo URL (when user signs out or switches to non-Google auth)
  Future<void> _clearGooglePhotoUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('google_photo_url');
  }
}
