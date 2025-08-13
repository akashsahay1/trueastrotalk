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
        // Try to get fresh user data from API
        _currentUser = await _userApiService.getCurrentUser(savedToken);
      } catch (e) {
        // If API call fails, try to load from local storage as fallback
        try {
          final savedUserData = prefs.getString('user_data');
          if (savedUserData != null) {
            final userJson = jsonDecode(savedUserData) as Map<String, dynamic>;
            _currentUser = app_user.User.fromJson(userJson);
            // Keep the token but user data might be stale
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

  // Simple register method for the new onboarding signup flow
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
    String? specializations,
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
      // Convert TimeOfDay to string if provided
      String? timeOfBirthStr;
      if (timeOfBirth != null) {
        timeOfBirthStr = '${timeOfBirth.hour.toString().padLeft(2, '0')}:${timeOfBirth.minute.toString().padLeft(2, '0')}';
      }

      // Convert UserType to role string
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
        specializations: specializations,
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
      // For astrologer, this is actually success - they need admin approval
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
    String? specializations,
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
      // Try to register the user
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
        specializations: specializations,
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

      // If astrologer registration is successful, upload profile image if provided
      if (user.role == UserRole.astrologer) {
        if (profileImagePath != null) {
          try {
            // Upload profile image using public upload API
            final imageUrl = await _uploadProfileImage(profileImagePath, user.id);
            if (imageUrl != null) {
              // Update the user's profile_image field in database
              await _updateUserProfileImage(user.id, imageUrl);
              // Update the local user object
              // Note: We can't easily update the User object here without modifying the model
            }
          } catch (imageError) {
            // Don't fail registration if image upload fails
          }
        }
        throw AstrologerRegistrationSuccessException(newUser: user);
      }

      // For successful customer registration, automatically log them in
      if (user.role == UserRole.customer) {
        // Since we just registered successfully, we need to get a token
        // Let's login the user to get the token
        try {
          final loginResult = await _userApiService.loginUser(email: email, password: authType == 'google' ? null : password, authType: authType, googleAccessToken: googleAccessToken);

          final loggedInUser = loginResult['user'] as app_user.User;
          final token = loginResult['token'] as String;

          await _saveAuthData(loggedInUser, token);

          // Upload profile image if provided
          if (profileImagePath != null) {
            try {
              final updatedUser = await _userApiService.updateUserProfile(
                token: token,
                userData: {}, // No additional data to update
                profileImagePath: profileImagePath,
              );
              // Update stored user data with the new profile image
              await _saveAuthData(updatedUser, token);
              return updatedUser;
            } catch (imageError) {
              // Don't fail login if image upload fails, just log the error
            }
          }

          return loggedInUser;
        } catch (loginError) {
          // If login fails, just return the user without setting auth data
          return user;
        }
      }

      return user;
    } catch (e) {
      // Check if it's a "user exists" error
      if (e.toString().contains('Email already exists') || e.toString().contains('already exists')) {
        // Try to login with the existing user to get their details
        try {
          final loginResult = await _userApiService.loginUser(email: email, password: authType == 'google' ? null : password, authType: authType, googleAccessToken: googleAccessToken);

          final existingUser = loginResult['user'] as app_user.User;
          final token = loginResult['token'] as String;

          // Handle based on user role and registration attempt
          if (role.toLowerCase() == 'customer' && existingUser.role == UserRole.customer) {
            // Customer exists, update their profile and log them in
            // Update their profile with new information
            final updatedProfileData = <String, dynamic>{};
            if (phone.isNotEmpty) updatedProfileData['phone_number'] = phone;
            if (dateOfBirth != null) updatedProfileData['date_of_birth'] = dateOfBirth.toIso8601String();
            if (timeOfBirth != null) updatedProfileData['time_of_birth'] = timeOfBirth;
            if (placeOfBirth != null) updatedProfileData['place_of_birth'] = placeOfBirth;

            if (updatedProfileData.isNotEmpty || profileImagePath != null) {
              try {
                await _userApiService.updateUserProfile(token: token, userData: updatedProfileData, profileImagePath: profileImagePath);
              } catch (updateError) {
                // Continue even if update fails
              }
            }

            throw CustomerExistsException(existingUser: existingUser, token: token);
          } else if (role.toLowerCase() == 'astrologer' && existingUser.role == UserRole.astrologer) {
            // Astrologer exists, show popup with existing user info
            throw AstrologerExistsException(existingUser: existingUser);
          }
        } catch (loginError) {
          // If login fails, it means the user exists but can't be logged in
          // Fall through to original registration error
        }
      }

      // For astrologer registration success, re-throw the special exception
      if (e is AstrologerRegistrationSuccessException) {
        rethrow;
      }

      // For customer/astrologer exists exceptions, re-throw them
      if (e is CustomerExistsException || e is AstrologerExistsException) {
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

        // Allow login if account is active AND (verified OR verification status is not explicitly rejected)
        if (user.accountStatus != AccountStatus.active) {
          throw Exception('Your astrologer account is ${user.displayStatus.toLowerCase()}. Please wait for admin approval.');
        }
        
        // Only block if explicitly rejected, allow unverified for now
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
      final GoogleSignIn googleSignIn = GoogleSignIn.instance;

      // Initialize Google Sign-In with scopes
      await googleSignIn.initialize();

      // Check if authenticate is supported
      if (!googleSignIn.supportsAuthenticate()) {
        throw Exception('Google Sign-In authenticate is not supported on this device');
      }

      // Clear any previous sign-in to force account picker
      await googleSignIn.signOut();

      // Single authenticate call with pre-authorized scopes
      final GoogleSignInAccount authenticatedUser = await googleSignIn.authenticate();

      // Check if user already has authorization for basic scopes
      const List<String> scopes = ['email', 'profile'];
      GoogleSignInClientAuthorization? existingAuth = await authenticatedUser.authorizationClient.authorizationForScopes(scopes);

      String accessToken;
      if (existingAuth != null) {
        // Use existing authorization
        accessToken = existingAuth.accessToken;
      } else {
        // This shouldn't happen with basic scopes, but handle it
        final GoogleSignInClientAuthorization newAuth = await authenticatedUser.authorizationClient.authorizeScopes(scopes);
        accessToken = newAuth.accessToken;
      }

      return await _processGoogleUser(authenticatedUser, accessToken);
    } on GoogleSignUpRequiredException {
      // Re-throw GoogleSignUpRequiredException without wrapping it
      rethrow;
    } catch (e) {
      String errorMessage = 'Google Sign In failed: ${e.toString()}';

      // Handle specific Google Sign-In configuration errors
      if (e.toString().contains('No active configuration')) {
        errorMessage = 'Google Sign-In not configured properly. Please contact support.';
      } else if (e.toString().contains('SIGN_IN_REQUIRED') || e.toString().contains('canceled')) {
        errorMessage = 'Google Sign In was cancelled by user';
      } else if (e.toString().contains('NETWORK_ERROR')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (e.toString().contains('INVALID_ACCOUNT')) {
        errorMessage = 'Invalid Google account. Please try with a different account.';
      }

      throw Exception(errorMessage);
    }
  }

  Future<app_user.User> _processGoogleUser(GoogleSignInAccount googleUser, String accessToken) async {
    // Get Google profile image URL
    String? profileImageUrl = googleUser.photoUrl;
    if (profileImageUrl != null) {
      // Ensure we get a high-quality image by modifying the URL
      if (profileImageUrl.contains('=s96')) {
        profileImageUrl = profileImageUrl.replaceAll('=s96', '=s400');
      } else if (!profileImageUrl.contains('=s')) {
        profileImageUrl = '$profileImageUrl=s400';
      }
    }

    // Try to login with Google OAuth first
    try {
      final loginResult = await _userApiService.loginUser(email: googleUser.email, authType: 'google', googleAccessToken: accessToken, googlePhotoUrl: profileImageUrl, googleDisplayName: googleUser.displayName);

      final user = loginResult['user'] as app_user.User;
      final token = loginResult['token'] as String;

      await _saveAuthData(user, token);
      return user;
    } catch (loginError) {
      // User doesn't exist - throw specific exception with Google data
      // This will be caught by the UI to navigate to signup screen
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
      if (_authToken != null) {
        await _userApiService.logoutUser(_authToken!);
      }
    } catch (e) {
      debugPrint('Logout API call failed: ${e.toString()}');
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
  }

  bool get needsProfileCompletion {
    return _currentUser?.role == UserRole.astrologer && _currentUser?.accountStatus == AccountStatus.profileIncomplete;
  }

  bool get isAstrologerVerified {
    return _currentUser?.role == UserRole.astrologer && _currentUser?.accountStatus == AccountStatus.active && _currentUser?.verificationStatus == VerificationStatus.verified;
  }

  String get userDisplayName => _currentUser?.name ?? 'User';

  String get userRoleDisplay => _currentUser?.role.displayName ?? 'User';

  // Method to set current user (used when logging in existing users during registration)
  Future<void> setCurrentUser(app_user.User user, String token) async {
    await _saveAuthData(user, token);
  }

  // Method to refresh current user data from API
  Future<app_user.User?> refreshCurrentUser() async {
    if (_authToken == null) return null;
    
    try {
      final freshUser = await _userApiService.getCurrentUser(_authToken!);
      _currentUser = freshUser;
      await _saveUserData(freshUser);
      return freshUser;
    } catch (e) {
      debugPrint('Failed to refresh user data: $e');
      return _currentUser; // Return cached user if refresh fails
    }
  }

  // Get astrologer options (languages, qualifications, skills)
  Future<Map<String, List<String>>> getAstrologerOptions() async {
    return await _userApiService.getAstrologerOptions();
  }

  // Upload profile image using public upload API
  Future<String?> _uploadProfileImage(String imagePath, String userId) async {
    return await _userApiService.uploadPublicImage(imagePath, userId);
  }

  // Update user's profile image URL in database
  Future<void> _updateUserProfileImage(String userId, String imageUrl) async {
    return await _userApiService.updateUserProfileImage(userId, imageUrl);
  }
}
