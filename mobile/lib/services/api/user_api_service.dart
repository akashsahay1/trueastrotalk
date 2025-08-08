import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';
import '../../models/user.dart';
import '../../models/enums.dart';
import '../../models/product.dart';
import 'endpoints.dart';

class UserApiService {
  final Dio _dio;

  UserApiService(this._dio);

  // Register user with email/password
  Future<User> registerUser({required String name, required String email, required String password, required String phone, required UserRole role, DateTime? dateOfBirth, String? timeOfBirth, String? placeOfBirth, String? authType = 'email', String? googleIdToken, String? googleAccessToken, String? experience, String? bio, String? languages, String? specializations}) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.register,
        data: {
          'full_name': name,
          'email_address': email,
          'password': password,
          'phone_number': phone.isNotEmpty ? phone : '',
          'user_type': role.value,
          'auth_type': authType ?? 'email',
          'date_of_birth': dateOfBirth?.toIso8601String(),
          'time_of_birth': timeOfBirth,
          'place_of_birth': placeOfBirth,
          'google_id_token': googleIdToken,
          'google_access_token': googleAccessToken,
          if (experience != null && experience.isNotEmpty) 'experience_years': experience,
          if (bio != null && bio.isNotEmpty) 'bio': bio,
          if (languages != null && languages.isNotEmpty) 'languages': languages,
          if (specializations != null && specializations.isNotEmpty) 'specializations': specializations,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        // Handle different response formats
        final userData = response.data['data'] ?? response.data;
        return User.fromJson(userData);
      } else {
        throw Exception('Registration failed: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Login user with email/password or Google OAuth
  Future<Map<String, dynamic>> loginUser({required String email, String? password, String? authType, String? googleAccessToken, String? googlePhotoUrl, String? googleDisplayName}) async {
    try {
      final response = await _dio.post(ApiEndpoints.login, data: {
        'email_address': email, 
        if (password != null) 'password': password, 
        if (authType != null) 'auth_type': authType, 
        if (googleAccessToken != null) 'google_access_token': googleAccessToken, 
        if (googlePhotoUrl != null) 'google_photo_url': googlePhotoUrl,
        if (googleDisplayName != null) 'google_display_name': googleDisplayName
      });

      if (response.statusCode == 200) {
        // Handle different response formats
        final responseData = response.data['data'] ?? response.data;
        final userData = responseData['user'] ?? responseData;
        final token = responseData['token'] ?? '';
        return {'user': User.fromJson(userData), 'token': token};
      } else {
        debugPrint('🚨 DEBUG: Login failed with status: ${response.statusCode}');
        debugPrint('🚨 DEBUG: Error response: ${response.data}');
        throw Exception('Login failed: ${response.data['message']}');
      }
    } on DioException catch (e) {
      debugPrint('🚨 DEBUG: DioException during login:');
      debugPrint('   - Status Code: ${e.response?.statusCode}');
      debugPrint('   - Response Data: ${e.response?.data}');
      debugPrint('   - Error Type: ${e.type}');
      debugPrint('   - Error Message: ${e.message}');
      debugPrint('   - Request URI: ${e.requestOptions.uri}');
      debugPrint('   - Request Data: ${e.requestOptions.data}');
      throw _handleDioException(e);
    }
  }

  // Google OAuth - Exchange Google token for app token
  Future<Map<String, dynamic>> googleSignIn({required String googleIdToken, required String googleAccessToken, String role = 'customer'}) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.googleAuth,
        data: {
          'google_id_token': googleIdToken,
          'google_access_token': googleAccessToken,
          'role': role, // Default role for new users
        },
      );

      if (response.statusCode == 200) {
        return {'user': User.fromJson(response.data['user']), 'token': response.data['token'], 'is_new_user': response.data['is_new_user'] ?? false};
      } else {
        throw Exception('Google sign in failed: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get current user profile
  Future<User> getCurrentUser(String token) async {
    try {
      final response = await _dio.get('/users/profile', options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        // Handle different response formats
        final userData = response.data['user'] ?? response.data['data'] ?? response.data;
        return User.fromJson(userData);
      } else {
        throw Exception('Failed to get user profile: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Update user profile (supports both JSON and multipart data)
  Future<User> updateUserProfile({
    required String token, 
    required Map<String, dynamic> userData,
    String? profileImagePath,
  }) async {
    try {
      dynamic requestData;
      Options requestOptions;

      if (profileImagePath != null) {
        // Create FormData when profile image is included
        final fileName = profileImagePath.split('/').last;
        final extension = fileName.toLowerCase().split('.').last;
        
        String? contentType;
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          case 'heic':
            contentType = 'image/heic';
            break;
          case 'heif':
            contentType = 'image/heif';
            break;
        }

        debugPrint('🖼️ Updating profile with image: $fileName (type: $contentType)');

        final formData = FormData.fromMap({
          'profile_image': await MultipartFile.fromFile(
            profileImagePath,
            filename: fileName,
            contentType: contentType != null ? MediaType.parse(contentType) : null,
          ),
          // Add all other profile fields
          ...userData,
        });

        requestData = formData;
        requestOptions = Options(
          headers: {'Authorization': 'Bearer $token'},
          contentType: 'multipart/form-data',
        );
      } else {
        // Use JSON when no image
        requestData = userData;
        requestOptions = Options(
          headers: {'Authorization': 'Bearer $token'},
        );
      }

      final response = await _dio.put(
        '/users/profile',
        data: requestData,
        options: requestOptions,
      );

      debugPrint('✅ Profile update response: ${response.statusCode}');

      if (response.statusCode == 200) {
        // Handle different response formats
        final userData = response.data['user'] ?? response.data['data'] ?? response.data;
        return User.fromJson(userData);
      } else {
        throw Exception('Failed to update profile: ${response.data['message']}');
      }
    } on DioException catch (e) {
      debugPrint('❌ Profile update error: ${e.response?.statusCode} - ${e.response?.data}');
      throw _handleDioException(e);
    }
  }

  // Check user verification status (for astrologers)
  Future<Map<String, dynamic>> checkVerificationStatus(String token) async {
    try {
      final response = await _dio.get('/users/verification-status', options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        return {'verification_status': response.data['verification_status'], 'account_status': response.data['account_status'], 'rejection_reason': response.data['rejection_reason'], 'can_login': response.data['can_login'] ?? false};
      } else {
        throw Exception('Failed to check verification status: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Refresh JWT token
  Future<String> refreshToken(String refreshToken) async {
    try {
      final response = await _dio.post(ApiEndpoints.refreshToken, data: {'refresh_token': refreshToken});

      if (response.statusCode == 200) {
        return response.data['token'];
      } else {
        throw Exception('Token refresh failed: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Logout user
  Future<void> logoutUser(String token) async {
    try {
      await _dio.post(ApiEndpoints.logout, options: Options(headers: {'Authorization': 'Bearer $token'}));
    } on DioException catch (e) {
      // Logout should succeed even if API call fails
      // Log the error but don't throw exception
      debugPrint('Logout API call failed: ${e.message}');
    }
  }

  // Get customer wallet balance
  Future<Map<String, dynamic>> getWalletBalance(String token) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.customerWalletBalance,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to get wallet balance: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get available astrologers
  Future<Map<String, dynamic>> getAvailableAstrologers({
    int limit = 10,
    int offset = 0,
    bool onlineOnly = false,
    String? specialization,
  }) async {
    try {
      final queryParams = {
        'limit': limit.toString(),
        'offset': offset.toString(),
        'online_only': onlineOnly.toString(),
        if (specialization != null) 'specialization': specialization,
      };

      final response = await _dio.get(
        ApiEndpoints.astrologersAvailable,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to get astrologers: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }


  // Get featured products
  Future<List<Product>> getFeaturedProducts({int limit = 6}) async {
    try {
      final queryParams = {
        'limit': limit.toString(),
        'featured': 'true',
      };

      final response = await _dio.get(
        ApiEndpoints.adminProducts,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final productsData = response.data['products'] as List<dynamic>;
        return productsData.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Failed to get featured products: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Handle Dio exceptions and convert to user-friendly messages
  String _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        return 'Connection timeout. Please check your internet connection.';
      case DioExceptionType.sendTimeout:
        return 'Send timeout. Please try again.';
      case DioExceptionType.receiveTimeout:
        return 'Receive timeout. Please try again.';
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = e.response?.data['message'] ?? 'Unknown error occurred';

        switch (statusCode) {
          case 400:
            return 'Bad request: $message';
          case 401:
            return 'Invalid credentials. Please check your email and password.';
          case 403:
            return 'Account verification pending. Please wait for admin approval.';
          case 404:
            return 'User not found. Please check your email.';
          case 409:
            return 'Email already exists. Please use a different email.';
          case 422:
            return 'Invalid data: $message';
          case 500:
            return 'Server error. Please try again later.';
          default:
            return message;
        }
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      case DioExceptionType.connectionError:
        return 'Connection error. Please check your internet connection.';
      case DioExceptionType.unknown:
        return 'Network error. Please check your internet connection.';
      case DioExceptionType.badCertificate:
        return 'SSL certificate error. Please check your connection.';
    }
  }
}
