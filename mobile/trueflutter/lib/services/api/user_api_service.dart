import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';
import '../../models/user.dart';
import '../../models/enums.dart';
import '../../models/product.dart';
import '../../models/astrologer.dart';
import '../local/local_storage_service.dart';
import 'endpoints.dart';

class UserApiService {
  final Dio _dio;
  final LocalStorageService _localStorage;

  UserApiService(this._dio, this._localStorage);

  // Register user with email/password
  Future<User> registerUser({
    required String name,
    required String email,
    required String password,
    required String phone,
    required UserRole role,
    DateTime? dateOfBirth,
    String? timeOfBirth,
    String? placeOfBirth,
    String? authType = 'email',
    String? googleIdToken,
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
      final requestData = <String, dynamic>{
        'full_name': name,
        'email_address': email,
        if (authType != 'google') 'password': password,
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
        if (qualifications != null && qualifications.isNotEmpty) 'qualifications': qualifications,
        if (languages != null && languages.isNotEmpty) 'languages': languages,
        if (skills != null && skills.isNotEmpty) 'skills': skills,
        if (address != null && address.isNotEmpty) 'address': address,
        if (city != null && city.isNotEmpty) 'city': city,
        if (state != null && state.isNotEmpty) 'state': state,
        if (country != null && country.isNotEmpty) 'country': country,
        if (zip != null && zip.isNotEmpty) 'zip': zip,
        if (callRate != null) 'call_rate': callRate,
        if (chatRate != null) 'chat_rate': chatRate,
        if (videoRate != null) 'video_rate': videoRate,
      };

      // First, register without profile image (JSON only)
      final response = await _dio.post(ApiEndpoints.register, data: requestData);

      if (response.statusCode == 201 || response.statusCode == 200) {
        // Handle different response formats
        final userData = response.data['data'] ?? response.data;
        final user = User.fromJson(userData);

        // If profile image was provided, update the profile with the image
        // But only for customers (astrologers need admin approval first)
        if (profileImagePath != null && role == UserRole.customer) {
          try {
            // For customers, we can immediately update profile with image
            // For astrologers, skip image upload since they need admin approval
            debugPrint('🖼️ Uploading profile image for customer after registration');

            // Note: This would require a token, but customers get logged in automatically
            // For now, we'll skip the image upload during registration
            // The image will be uploaded when they update their profile later
            debugPrint('⚠️ Profile image will be uploaded on profile update');
          } catch (imageError) {
            // Don't fail registration if image upload fails
            debugPrint('⚠️ Profile image upload failed: $imageError');
          }
        }

        return user;
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
      final requestData = {
        'email_address': email,
        if (password != null) 'password': password,
        if (authType != null) 'auth_type': authType,
        if (googleAccessToken != null) 'google_access_token': googleAccessToken,
        if (googlePhotoUrl != null) 'google_photo_url': googlePhotoUrl,
        if (googleDisplayName != null) 'google_display_name': googleDisplayName,
      };

      debugPrint('🔍 Login Request Data:');
      debugPrint('   Email: $email');
      debugPrint('   Auth Type: $authType');
      debugPrint('   Google Photo URL: $googlePhotoUrl');
      debugPrint('   Google Display Name: $googleDisplayName');

      final response = await _dio.post(ApiEndpoints.login, data: requestData);

      if (response.statusCode == 200) {
        // Handle different response formats
        final responseData = response.data['data'] ?? response.data;
        final userData = responseData['user'] ?? responseData;
        final token = responseData['token'] ?? '';

        debugPrint('🔍 Login API Response - User Data:');
        debugPrint('🔍 Raw response: ${response.data}');
        debugPrint('🔍 User data: $userData');
        debugPrint('   Raw userData: $userData');
        debugPrint('   date_of_birth: ${userData['date_of_birth']}');
        debugPrint('   birth_time: ${userData['birth_time']}');
        debugPrint('   birth_place: ${userData['birth_place']}');
        debugPrint('   profile_image: ${userData['profile_image']}');

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
  Future<User> updateUserProfile({required String token, required Map<String, dynamic> userData, String? profileImagePath}) async {
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
          'profile_image': await MultipartFile.fromFile(profileImagePath, filename: fileName, contentType: contentType != null ? MediaType.parse(contentType) : null),
          // Add all other profile fields
          ...userData,
        });

        requestData = formData;
        requestOptions = Options(headers: {'Authorization': 'Bearer $token'}, contentType: 'multipart/form-data');
      } else {
        // Use JSON when no image
        requestData = userData;
        requestOptions = Options(headers: {'Authorization': 'Bearer $token'});
      }

      final response = await _dio.put('/users/profile', data: requestData, options: requestOptions);

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
      final response = await _dio.get(ApiEndpoints.customerWalletBalance, options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to get wallet balance: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get customer wallet transactions
  Future<Map<String, dynamic>> getWalletTransactions(String token, {int limit = 20, int offset = 0}) async {
    try {
      final queryParams = {'limit': limit.toString(), 'offset': offset.toString()};
      final response = await _dio.get(
        ApiEndpoints.customerWalletTransactions, 
        queryParameters: queryParams,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to get wallet transactions: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get customer consultation history
  Future<Map<String, dynamic>> getConsultationHistory(String token, {int limit = 20, int offset = 0, String? type}) async {
    try {
      final queryParams = {'limit': limit.toString(), 'offset': offset.toString()};
      if (type != null) {
        queryParams['type'] = type;
      }
      
      final response = await _dio.get(
        ApiEndpoints.customerConsultationsHistory, 
        queryParameters: queryParams,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to get consultation history: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Create Razorpay order
  Future<Map<String, dynamic>> createRazorpayOrder(String token, {required double amount, String? currency, String? receipt}) async {
    try {
      final requestData = {
        'amount': amount,
        'currency': currency ?? 'INR',
        if (receipt != null) 'receipt': receipt,
      };

      final response = await _dio.post(
        '/payments/razorpay/create-order',
        data: requestData,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to create Razorpay order: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Wallet recharge
  Future<Map<String, dynamic>> rechargeWallet(String token, {required double amount, required String paymentMethod, String? paymentId}) async {
    try {
      final requestData = {
        'amount': amount,
        'payment_method': paymentMethod,
        if (paymentId != null) 'payment_id': paymentId,
      };

      final response = await _dio.post(
        ApiEndpoints.customerWalletRecharge,
        data: requestData,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to recharge wallet: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get available astrologers
  Future<Map<String, dynamic>> getAvailableAstrologers({int limit = 10, int offset = 0, bool onlineOnly = false, String? specialization}) async {
    try {
      final queryParams = {'limit': limit.toString(), 'offset': offset.toString(), 'online_only': onlineOnly.toString()};

      final response = await _dio.get(ApiEndpoints.astrologersAvailable, queryParameters: queryParams);

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to get astrologers: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get astrologer by ID
  Future<Astrologer> getAstrologerById(String astrologerId) async {
    try {
      final response = await _dio.get(ApiEndpoints.astrologerProfileById(astrologerId));

      if (response.statusCode == 200) {
        return Astrologer.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to get astrologer details: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get featured products
  Future<List<Product>> getFeaturedProducts({int limit = 6}) async {
    try {
      final queryParams = {'limit': limit.toString(), 'featured': 'true'};

      final response = await _dio.get(ApiEndpoints.adminProducts, queryParameters: queryParams);

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

  // Get all products with optional pagination and filters
  Future<List<Product>> getAllProducts({
    int? limit,
    int? offset,
    String? category,
    String? search,
    bool? inStock,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      
      if (limit != null) queryParams['limit'] = limit.toString();
      if (offset != null) queryParams['offset'] = offset.toString();
      if (category != null && category != 'All') queryParams['category'] = category;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (inStock != null) queryParams['in_stock'] = inStock.toString();

      final response = await _dio.get(ApiEndpoints.adminProducts, queryParameters: queryParams);

      if (response.statusCode == 200) {
        final productsData = response.data['products'] as List<dynamic>;
        return productsData.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Failed to get products: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get astrologer options (languages, qualifications, skills)
  Future<Map<String, List<String>>> getAstrologerOptions() async {
    
    // Check cache first
    final cachedOptions = _localStorage.getCachedAstrologerOptions();
    if (cachedOptions != null) {
      return cachedOptions;
    }

    // Cache miss, fetch from API
    try {
      
      final response = await _dio.get(ApiEndpoints.publicAstrologerOptions);

      if (response.statusCode == 200) {
        final data = response.data['data'] as Map<String, dynamic>;
        final options = {
          'languages': List<String>.from(data['languages'] ?? []),
          'skills': List<String>.from(data['skills'] ?? [])
        };
        
        // Cache the result
        await _localStorage.saveAstrologerOptions(options);
        
        
        return options;
      } else {
        throw Exception('Failed to get astrologer options: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Upload image using public upload API
  Future<String?> uploadPublicImage(String imagePath, String userId) async {
    try {
      final fileName = imagePath.split('/').last;
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

      final formData = FormData.fromMap({'file': await MultipartFile.fromFile(imagePath, filename: fileName, contentType: contentType != null ? MediaType.parse(contentType) : null), 'file_type': 'profile_image', 'uploaded_by': userId, 'associated_record': userId});

      final response = await _dio.post(
        '/api/upload',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData['success'] == true) {
          return responseData['file_path'] as String?;
        }
      }

      throw Exception('Upload failed: ${response.data}');
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Update user's profile image URL using existing user update API
  Future<void> updateUserProfileImage(String userId, String imageUrl) async {
    try {
      final response = await _dio.put(
        '/api/users/$userId',
        data: {'profile_image': imageUrl},
        options: Options(contentType: 'application/json'),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update profile image: ${response.data}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get astrologer dashboard data
  Future<Map<String, dynamic>> getAstrologerDashboard(String token) async {
    try {
      final response = await _dio.get(ApiEndpoints.astrologerProfile, options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to get astrologer dashboard: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get astrologer wallet/earnings data
  Future<Map<String, dynamic>> getAstrologerEarnings(String token) async {
    try {
      final response = await _dio.get(ApiEndpoints.astrologerWalletBalance, options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to get astrologer earnings: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get astrologer earnings history
  Future<Map<String, dynamic>> getAstrologerEarningsHistory(String token, {int limit = 10, int offset = 0}) async {
    try {
      final queryParams = {'limit': limit.toString(), 'offset': offset.toString()};

      final response = await _dio.get(
        ApiEndpoints.astrologerWalletEarningsHistory,
        queryParameters: queryParams,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to get earnings history: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get pending consultation requests for astrologer
  Future<Map<String, dynamic>> getPendingConsultations(String token) async {
    try {
      final response = await _dio.get(ApiEndpoints.astrologerConsultationsPending, options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to get pending consultations: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Toggle astrologer online status
  Future<Map<String, dynamic>> toggleOnlineStatus(String token, bool isOnline) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.astrologerOnlineStatus,
        data: {'is_online': isOnline},
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to update online status: ${response.data['message']}');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  // Get astrologer statistics (consultations, ratings, etc.)
  Future<Map<String, dynamic>> getAstrologerStatistics(String token) async {
    try {
      // This might be part of the profile endpoint or a separate statistics endpoint
      final response = await _dio.get('${ApiEndpoints.astrologerProfile}/statistics', options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to get astrologer statistics: ${response.data['message']}');
      }
    } on DioException {
      // If statistics endpoint doesn't exist, return default values
      return {'today_consultations': 0, 'total_consultations': 0, 'average_rating': 0.0, 'total_reviews': 0};
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
