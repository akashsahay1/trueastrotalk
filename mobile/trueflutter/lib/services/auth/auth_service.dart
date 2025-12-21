import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:convert';
import '../../models/user.dart' as app_user;
import '../../models/enums.dart';
import '../api/user_api_service.dart';
import '../network/dio_client.dart';
import '../local/local_storage_service.dart';
import '../service_locator.dart';
import '../socket/socket_service.dart';
import '../call/call_service.dart';
import '../notifications/notification_service.dart';
import '../cart_service.dart';
import '../../config/payment_config.dart';
import '../../common/utils/error_handler.dart';

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
  final String idToken;

  GoogleSignUpRequiredException({required this.name, required this.email, required this.accessToken, required this.idToken});

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
  final LocalStorageService _localStorage = getIt<LocalStorageService>();

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
        // Set the global auth token in Dio client
        DioClient.setAuthToken(savedToken);
        // Also save to secure storage for socket service
        await _localStorage.saveAuthToken(savedToken);
        _currentUser = await _userApiService.getCurrentUser(savedToken);
        // Save user data to local storage for socket service
        if (_currentUser != null) {
          await _saveUserData(_currentUser!);
          // Initialize cart service after user is restored
          try {
            final cartService = getIt<CartService>();
            await cartService.initialize();
          } catch (e) {
            debugPrint('⚠️ CartService initialization failed: $e');
          }
        }
      } catch (e) {
        debugPrint('🔄 Token validation failed during init: $e');
        try {
          // Try to refresh the token
          await refreshAuthToken();
          if (_authToken != null) {
            _currentUser = await _userApiService.getCurrentUser(_authToken!);
            // Save user data to local storage for socket service
            if (_currentUser != null) {
              await _saveUserData(_currentUser!);
            }
            return;
          }
        } catch (refreshError) {
          debugPrint('🔄 Token refresh failed: $refreshError');
        }

        // Fall back to local storage
        try {
          final savedUserData = prefs.getString('user_data');
          if (savedUserData != null) {
            final userJson = jsonDecode(savedUserData) as Map<String, dynamic>;
            _currentUser = app_user.User.fromJson(userJson);
            // Also sync to local storage service for socket
            await _localStorage.saveUserMap(userJson);
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
    String? gender,
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
    String? accountHolderName,
    String? accountNumber,
    String? bankName,
    String? ifscCode,
    String? panCardImagePath,
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
        gender: gender,
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
        accountHolderName: accountHolderName,
        accountNumber: accountNumber,
        bankName: bankName,
        ifscCode: ifscCode,
        panCardImagePath: panCardImagePath,
      );

      return AuthResult.success(message: 'Registration successful', user: user);
    } on AstrologerRegistrationSuccessException catch (e) {
      return AuthResult.success(message: 'Astrologer registration submitted successfully. Please wait for admin approval.', user: e.newUser);
    } catch (e) {
      // Handle registration errors gracefully
      final appError = ErrorHandler.handleError(e, context: 'registration');
      return AuthResult.failure(message: appError.userMessage.isNotEmpty 
          ? appError.userMessage 
          : 'Registration failed. Please try again.');
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
    String? gender,
    String? authType,
    String? googleAccessToken,
    String? googleIdToken,
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
    String? accountHolderName,
    String? accountNumber,
    String? bankName,
    String? ifscCode,
    String? panCardImagePath,
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
        gender: gender,
        authType: authType,
        googleAccessToken: googleAccessToken,
        googleIdToken: googleIdToken,
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
        accountHolderName: accountHolderName,
        accountNumber: accountNumber,
        bankName: bankName,
        ifscCode: ifscCode,
        panCardImagePath: panCardImagePath,
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
          final refreshToken = loginResult['refresh_token'] as String? ?? '';

          await _saveAuthData(loggedInUser, token, refreshToken);

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

      // Handle registration errors gracefully
      final appError = ErrorHandler.handleError(e, context: 'registration');
      throw Exception(appError.userMessage.isNotEmpty 
          ? appError.userMessage 
          : 'Registration failed. Please try again.');
    }
  }

  Future<app_user.User> signInWithEmailPassword({required String email, required String password}) async {
    try {
      final result = await _userApiService.loginUser(email: email, password: password);

      final user = result['user'] as app_user.User;
      final token = result['token'] as String;
      final refreshToken = result['refresh_token'] as String? ?? '';

      if (user.role == UserRole.astrologer) {
        debugPrint('🔍 Astrologer login check - Account Status: ${user.accountStatus}, Verification Status: ${user.verificationStatus}');

        if (user.accountStatus != AccountStatus.active) {
          throw Exception('Your astrologer account is ${user.displayStatus.toLowerCase()}. Please wait for admin approval.');
        }

        if (user.verificationStatus == VerificationStatus.rejected) {
          throw Exception('Your astrologer account verification was rejected. Please contact support.');
        }
      }

      await _saveAuthData(user, token, refreshToken);
      return user;
    } catch (e) {
      // Handle login errors gracefully
      final appError = ErrorHandler.handleError(e, context: 'login');
      throw Exception(appError.userMessage.isNotEmpty 
          ? appError.userMessage 
          : 'Login failed. Please check your credentials and try again.');
    }
  }

  Future<app_user.User> signInWithGoogle() async {
    try {
      debugPrint('🔵 AuthService: Starting Google Sign-In');
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

        debugPrint('🔵 AuthService: Processing Google user...');
        debugPrint('🔑 Google ID Token: ${googleAuth.idToken != null ? 'Present' : 'Missing'}');
        return await _processGoogleUser(googleUser!, googleAuth.idToken!);
      } finally {
        await subscription.cancel();
      }
    } on PlatformException catch (e) {
      debugPrint('🚨 AuthService: Platform exception: ${e.message}');
      throw Exception('Platform error during Google Sign-In: ${e.message}');
    } on GoogleSignUpRequiredException {
      // Rethrow GoogleSignUpRequiredException so it can be caught by the UI
      debugPrint('🎯 AuthService: Caught and rethrowing GoogleSignUpRequiredException');
      rethrow;
    } catch (e) {
      debugPrint('🚨 AuthService: Generic exception in signInWithGoogle: ${e.runtimeType} - $e');

      // Check if user cancelled Google Sign-In
      final errorString = e.toString().toLowerCase();
      if (errorString.contains('canceled') ||
          errorString.contains('cancelled') ||
          errorString.contains('aborted_by_user') ||
          errorString.contains('cancelled by user') ||
          e.toString().contains('GoogleSignInExceptionCode.canceled')) {
        debugPrint('🚫 User cancelled Google Sign-In - no error message needed');
        // Return silently without throwing an exception or showing error
        return Future.error('USER_CANCELLED');
      }

      // Handle Google Sign-In errors gracefully
      final appError = ErrorHandler.handleError(e, context: 'login');
      throw Exception(appError.userMessage.isNotEmpty
          ? appError.userMessage
          : 'Google Sign-In failed. Please try again.');
    }
  }

  Future<app_user.User> _processGoogleUser(GoogleSignInAccount googleUser, String idToken) async {
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
      final loginResult = await _userApiService.loginUser(email: googleUser.email, authType: 'google', googleAccessToken: idToken, googlePhotoUrl: profileImageUrl, googleDisplayName: googleUser.displayName);

      final user = loginResult['user'] as app_user.User;
      final token = loginResult['token'] as String;
      final refreshToken = loginResult['refresh_token'] as String? ?? '';

      debugPrint('🔍 Backend Response:');
      debugPrint('   User profile picture from backend: ${user.profilePicture}');
      debugPrint('   Auth type: ${user.authType}');


      await _saveAuthData(user, token, refreshToken);
      return user;
    } catch (loginError) {
      debugPrint('🔍 Login error for Google user: $loginError');
      // Check if this is specifically a USER_NOT_REGISTERED error
      if (loginError.toString().contains('USER_NOT_REGISTERED')) {
        debugPrint('✅ Confirmed USER_NOT_REGISTERED - throwing GoogleSignUpRequiredException');
        throw GoogleSignUpRequiredException(name: googleUser.displayName ?? googleUser.email.split('@')[0], email: googleUser.email, accessToken: idToken, idToken: idToken);
      }
      // For other login errors, rethrow
      debugPrint('❌ Other login error: $loginError');
      rethrow;
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
      // IMPORTANT: Cleanup active calls before disconnecting socket
      // This prevents call errors and unexpected disconnections
      try {
        final callService = CallService.instance;
        await callService.cleanup();
        debugPrint('📞 Cleaned up active calls before logout');
      } catch (e) {
        debugPrint('Call cleanup error: $e');
      }

      // Disconnect socket after call cleanup
      try {
        final socketService = getIt<SocketService>();
        await socketService.disconnect();
        debugPrint('🔌 Disconnected socket');
      } catch (e) {
        debugPrint('Socket disconnect error: $e');
      }

      // Sign out from Google if signed in
      try {
        await GoogleSignIn.instance.disconnect();
      } catch (e) {
        debugPrint('Google sign out error: $e');
      }

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

  Future<app_user.User> updateUserProfile(Map<String, dynamic> userData, {String? profileImagePath, String? panCardImagePath}) async {
    if (_authToken == null) {
      throw Exception('User not authenticated');
    }

    try {
      final updatedUser = await _userApiService.updateUserProfile(token: _authToken!, userData: userData, profileImagePath: profileImagePath, panCardImagePath: panCardImagePath);

      _currentUser = updatedUser;
      await _saveUserData(updatedUser);
      return updatedUser;
    } catch (e) {
      // If we get a 401 error, try to refresh token first
      if (e.toString().contains('401') || e.toString().contains('AUTHENTICATION_REQUIRED')) {
        debugPrint('🔄 Got 401 error, attempting to refresh token or clear auth');
        try {
          await refreshAuthToken();
          // Try the request again with fresh token
          final updatedUser = await _userApiService.updateUserProfile(token: _authToken!, userData: userData, profileImagePath: profileImagePath, panCardImagePath: panCardImagePath);
          _currentUser = updatedUser;
          await _saveUserData(updatedUser);
          return updatedUser;
        } catch (refreshError) {
          // Token refresh failed, user needs to log in again
          debugPrint('🚨 Token refresh failed, clearing auth data');
          await _clearAuthData();
          throw Exception('Session expired. Please log in again.');
        }
      }
      throw Exception('Failed to update profile: ${e.toString()}');
    }
  }

  Future<void> refreshAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString('refresh_token');

    if (refreshToken == null) {
      debugPrint('🔄 No refresh token available - user needs to login again');
      await _clearAuthData();
      throw Exception('No refresh token available');
    }

    try {
      final newToken = await _userApiService.refreshToken(refreshToken);
      _authToken = newToken;
      // Update the global auth token in Dio client
      DioClient.setAuthToken(newToken);
      await prefs.setString('auth_token', newToken);
      debugPrint('✅ Token refreshed successfully');
    } catch (e) {
      debugPrint('🚨 Token refresh failed: $e');
      await _clearAuthData();
      throw Exception('Token refresh failed: ${e.toString()}');
    }
  }

  Future<void> _saveAuthData(app_user.User user, String token, [String? refreshToken]) async {
    _currentUser = user;
    _authToken = token;
    
    // Set the global auth token in Dio client
    DioClient.setAuthToken(token);

    // Save to both SharedPreferences (for compatibility) and LocalStorageService (for socket service)
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await _localStorage.saveAuthToken(token); // Save to secure storage for socket service
    
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await prefs.setString('refresh_token', refreshToken);
      debugPrint('🔐 Saved refresh token: ${refreshToken.length > 10 ? '${refreshToken.substring(0, 10)}...' : refreshToken}');
    }
    await _saveUserData(user);
    
    // Initialize PaymentConfig after successful login
    try {
      debugPrint('🔧 Initializing PaymentConfig...');
      await PaymentConfig.instance.initialize();
      debugPrint('✅ PaymentConfig initialized successfully');
    } catch (e) {
      debugPrint('⚠️ PaymentConfig initialization failed: $e');
      // Don't throw error - payment config is not critical for basic app functionality
    }

    // Initialize CartService after successful login (to fetch GST rate)
    try {
      debugPrint('🛒 Initializing CartService...');
      final cartService = getIt<CartService>();
      await cartService.initialize();
      debugPrint('✅ CartService initialized successfully');
    } catch (e) {
      debugPrint('⚠️ CartService initialization failed: $e');
      // Don't throw error - cart service is not critical for basic app functionality
    }

    // Update FCM token on server with the fresh auth token
    try {
      debugPrint('🔔 Updating FCM token on server...');
      final notificationService = NotificationService();
      final fcmToken = notificationService.fcmToken;
      if (fcmToken != null && fcmToken.isNotEmpty) {
        await _userApiService.updateFcmToken(token, fcmToken: fcmToken);
        debugPrint('✅ FCM token updated successfully');
      } else {
        debugPrint('⚠️ No FCM token available to update');
      }
    } catch (e) {
      debugPrint('⚠️ FCM token update failed: $e');
      // Don't throw error - FCM token update is not critical
    }
  }

  Future<void> _saveUserData(app_user.User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(user.toJson()));
    await _localStorage.saveUserMap(user.toJson()); // Save to local storage for socket service
    await _localStorage.saveUserId(user.id); // Save user ID for API calls
  }

  Future<void> _clearAuthData() async {
    _currentUser = null;
    _authToken = null;
    
    // Clear the global auth token in Dio client
    DioClient.clearAuthToken();

    // Clear from both SharedPreferences and LocalStorageService
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_data');
    
    await _localStorage.removeAuthToken();
    await _localStorage.clearUserMap();
    
    // Clear PaymentConfig credentials
    PaymentConfig.instance.clearCredentials();
    debugPrint('🔧 PaymentConfig credentials cleared');
  }

  bool get needsProfileCompletion {
    return _currentUser?.role == UserRole.astrologer && _currentUser?.accountStatus == AccountStatus.inactive;
  }

  bool get isAstrologerVerified {
    return _currentUser?.role == UserRole.astrologer && _currentUser?.accountStatus == AccountStatus.active && _currentUser?.verificationStatus == VerificationStatus.verified;
  }

  String get userDisplayName => _currentUser?.name ?? 'User';

  String get userRoleDisplay => _currentUser?.role.displayName ?? 'User';

  Future<void> setCurrentUser(app_user.User user, String token) async {
    await _saveAuthData(user, token);
  }

  /// Update the online status locally (used by astrologer toggle)
  void updateOnlineStatus(bool isOnline) {
    if (_currentUser != null) {
      _currentUser = _currentUser!.copyWith(isOnline: isOnline);
    }
  }

  Future<app_user.User?> refreshCurrentUser({bool preserveOnlineStatus = true}) async {
    if (_authToken == null) return null;

    try {
      // Preserve the current online status before refresh
      final currentOnlineStatus = _currentUser?.isOnline;

      final freshUser = await _userApiService.getCurrentUser(_authToken!);

      // If preserveOnlineStatus is true and we had a previous online status, keep it
      if (preserveOnlineStatus && currentOnlineStatus != null) {
        _currentUser = freshUser.copyWith(isOnline: currentOnlineStatus);
      } else {
        _currentUser = freshUser;
      }

      await _saveUserData(_currentUser!);
      return _currentUser;
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

  Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    if (_authToken == null) {
      throw Exception('User not authenticated');
    }

    // Let the userApiService handle the error and propagate it naturally
    // The ErrorHandler will take care of converting DioExceptions to user-friendly messages
    await _userApiService.changePassword(
      token: _authToken!,
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }

  // Phone Authentication Methods

  // Unified Authentication Methods (New)

  /// Send OTP to email or phone for unified authentication
  Future<Map<String, dynamic>> sendUnifiedOTP({
    required String identifier,
    required String authType,
  }) async {
    try {
      return await _userApiService.sendUnifiedOTP(
        identifier: identifier,
        authType: authType,
      );
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'send-otp');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to send OTP. Please try again.'
      };
    }
  }

  /// Verify OTP for unified authentication (email or phone)
  Future<Map<String, dynamic>> verifyUnifiedOTP({
    required String identifier,
    required String otp,
    required String authType,
  }) async {
    try {
      final result = await _userApiService.verifyUnifiedOTP(
        identifier: identifier,
        otp: otp,
        authType: authType,
      );

      // If user exists, save auth data
      if (result['success'] && result['user'] != null) {
        final user = result['user'] as app_user.User;
        final token = result['access_token'] as String;
        final refreshToken = result['refresh_token'] as String? ?? '';

        await _saveAuthData(user, token, refreshToken);
      }

      return result;
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'verify-otp');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to verify OTP. Please try again.'
      };
    }
  }

  /// Link an additional auth method (email or phone) to existing account
  Future<Map<String, dynamic>> linkAccount({
    required String token,
    required String linkType,
    required String identifier,
    required String otp,
  }) async {
    try {
      final result = await _userApiService.linkAccount(
        token: token,
        linkType: linkType,
        identifier: identifier,
        otp: otp,
      );

      // Update current user if successful
      if (result['success'] && result['user'] != null) {
        _currentUser = result['user'] as app_user.User;
        await _saveUserData(_currentUser!);
      }

      return result;
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'link-account');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to link account. Please try again.'
      };
    }
  }

  /// Get current auth token
  Future<String?> getAuthToken() async {
    return _authToken;
  }

  // Legacy Phone Authentication Methods (for backward compatibility)

  /// Send OTP to phone number for verification (signup)
  @Deprecated('Use sendUnifiedOTP with authType="phone" instead')
  Future<Map<String, dynamic>> sendOTP(String phoneNumber) async {
    try {
      return await _userApiService.sendOTP(phoneNumber);
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'send-otp');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to send OTP. Please try again.'
      };
    }
  }

  /// Send OTP to phone number for login
  Future<Map<String, dynamic>> sendOTPForLogin(String phoneNumber) async {
    try {
      return await _userApiService.sendOTPForLogin(phoneNumber);
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'send-otp-login');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to send OTP. Please try again.'
      };
    }
  }

  /// Verify OTP code for phone number
  Future<Map<String, dynamic>> verifyOTP(String phoneNumber, String otp) async {
    try {
      return await _userApiService.verifyOTP(phoneNumber, otp);
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'verify-otp');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to verify OTP. Please try again.'
      };
    }
  }

  /// Complete phone signup and create user account
  Future<Map<String, dynamic>> phoneSignUp(
    String phoneNumber,
    String fullName,
    String userType, {
    String? dateOfBirth,
    String? timeOfBirth,
    String? placeOfBirth,
    String? gender,
  }) async {
    try {
      final result = await _userApiService.phoneSignUp(
        phoneNumber,
        fullName,
        userType,
        dateOfBirth: dateOfBirth,
        timeOfBirth: timeOfBirth,
        placeOfBirth: placeOfBirth,
        gender: gender,
      );

      if (result['success']) {
        final user = result['user'] as app_user.User;
        final token = result['access_token'] as String;
        final refreshToken = result['refresh_token'] as String? ?? '';

        await _saveAuthData(user, token, refreshToken);

        return {
          'success': true,
          'user': user,
          'token': token,
        };
      }

      return result;
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'phone-signup');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to create account. Please try again.'
      };
    }
  }

  /// Complete phone login and fetch user data with tokens
  Future<Map<String, dynamic>> phoneLoginComplete(String phoneNumber) async {
    try {
      final result = await _userApiService.phoneLoginComplete(phoneNumber);

      if (result['success']) {
        final user = result['user'] as app_user.User;
        final token = result['access_token'] as String;
        final refreshToken = result['refresh_token'] as String? ?? '';

        await _saveAuthData(user, token, refreshToken);

        return {
          'success': true,
          'user': user,
          'token': token,
        };
      }

      return result;
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'phone-login-complete');
      return {
        'success': false,
        'error': appError.userMessage.isNotEmpty
            ? appError.userMessage
            : 'Failed to login. Please try again.'
      };
    }
  }

}
