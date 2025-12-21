import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';
import '../../models/user.dart';
import '../../models/enums.dart';
import '../../models/product.dart';
import '../../models/astrologer.dart';
import '../local/local_storage_service.dart';
import 'endpoints.dart';
import '../../common/utils/error_handler.dart';

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
    String? gender,
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
    String? accountHolderName,
    String? accountNumber,
    String? bankName,
    String? ifscCode,
    String? panCardImagePath,
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
        if (gender != null && gender.isNotEmpty) 'gender': gender,
        'google_id_token': googleIdToken,
        'google_access_token': googleAccessToken,
        if (experience != null && experience.isNotEmpty) 'experience_years': experience,
        if (bio != null && bio.isNotEmpty) 'bio': bio,
        if (qualifications != null && qualifications.isNotEmpty) 'qualifications': qualifications.split(', '),
        if (languages != null && languages.isNotEmpty) 'languages': languages.split(', '),
        if (skills != null && skills.isNotEmpty) 'skills': skills.split(', '),
        if (address != null && address.isNotEmpty) 'address': address,
        if (city != null && city.isNotEmpty) 'city': city,
        if (state != null && state.isNotEmpty) 'state': state,
        if (country != null && country.isNotEmpty) 'country': country,
        if (zip != null && zip.isNotEmpty) 'zip': zip,
        if (callRate != null) 'call_rate': callRate,
        if (chatRate != null) 'chat_rate': chatRate,
        if (videoRate != null) 'video_rate': videoRate,
        // Send bank details as a nested object for astrologers
        if (role == UserRole.astrologer && 
            accountHolderName != null && accountHolderName.isNotEmpty &&
            accountNumber != null && accountNumber.isNotEmpty &&
            bankName != null && bankName.isNotEmpty &&
            ifscCode != null && ifscCode.isNotEmpty) 
          'bank_details': {
            'account_holder_name': accountHolderName,
            'account_number': accountNumber,
            'bank_name': bankName,
            'ifsc_code': ifscCode,
          },
        // Add default commission percentage for astrologers
        if (role == UserRole.astrologer)
          'commission_percentage': {
            'call': 25,
            'chat': 25,
            'video': 25,
          },
      };

      // Check if we have files to upload
      dynamic finalRequestData = requestData;
      Options? requestOptions;

      if (profileImagePath != null || panCardImagePath != null) {
        // Use FormData for multipart upload
        final formData = FormData();
        
        // Add all fields to FormData
        requestData.forEach((key, value) {
          if (value != null) {
            // Convert objects and arrays to JSON strings for FormData
            if (value is Map || value is List) {
              formData.fields.add(MapEntry(key, json.encode(value)));
            } else {
              formData.fields.add(MapEntry(key, value.toString()));
            }
          }
        });
        
        // Add profile image if provided
        if (profileImagePath != null) {
          final fileName = profileImagePath.split('/').last;
          formData.files.add(MapEntry(
            'profile_image',
            await MultipartFile.fromFile(profileImagePath, filename: fileName),
          ));
          debugPrint('📸 Adding profile image to registration: $fileName');
        }
        
        // Add PAN card image if provided (for astrologers)
        if (panCardImagePath != null && role == UserRole.astrologer) {
          final fileName = panCardImagePath.split('/').last;
          formData.files.add(MapEntry(
            'pan_card_image',
            await MultipartFile.fromFile(panCardImagePath, filename: fileName),
          ));
          debugPrint('📄 Adding PAN card to registration: $fileName');
        }
        
        finalRequestData = formData;
        requestOptions = Options(
          contentType: 'multipart/form-data',
        );
      }

      // Send registration request
      final response = await _dio.post(
        ApiEndpoints.register, 
        data: finalRequestData,
        options: requestOptions,
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        // Handle different response formats
        final userData = response.data['data'] ?? response.data;
        final user = User.fromJson(userData);
        
        // Profile image is now handled during registration via FormData
        if (userData['profile_image_id'] != null) {
          debugPrint('✅ Profile image uploaded successfully with media_id: ${userData['profile_image_id']}');
        }

        return user;
      } else {
        throw Exception('Registration failed: ${response.data['message']}');
      }
    } on DioException {
      // Let the DioException bubble up so ErrorHandler can properly extract the message
      rethrow;
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
        final token = responseData['access_token'] ?? responseData['token'] ?? '';
        final refreshToken = responseData['refresh_token'] ?? '';

        debugPrint('🔍 Login API Response - User Data:');
        debugPrint('🔍 Raw response: ${response.data}');
        debugPrint('🔍 User data: $userData');
        debugPrint('   Raw userData: $userData');
        debugPrint('   date_of_birth: ${userData['date_of_birth']}');
        debugPrint('   birth_time: ${userData['birth_time']}');
        debugPrint('   birth_place: ${userData['birth_place']}');
        debugPrint('   profile_image: ${userData['profile_image']}');
        debugPrint('   Access Token: ${token.length > 10 ? '${token.substring(0, 10)}...' : token}');
        debugPrint('   Refresh Token: ${refreshToken.length > 10 ? '${refreshToken.substring(0, 10)}...' : refreshToken}');

        return {'user': User.fromJson(userData), 'token': token, 'refresh_token': refreshToken};
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

      // Check for USER_NOT_REGISTERED error (404 response for Google sign-in)
      if (e.response?.statusCode == 404 && e.response?.data != null) {
        final responseData = e.response!.data;
        if (responseData is Map && responseData['error'] == 'USER_NOT_REGISTERED') {
          debugPrint('✅ User not registered - throwing specific exception');
          throw Exception('USER_NOT_REGISTERED: ${responseData['message']}');
        }
      }

      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Google OAuth - Exchange Google token for app token
  Future<Map<String, dynamic>> googleSignIn({required String googleIdToken, required String googleAccessToken, String role = 'customer'}) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.login,
        data: {
          'email_address': '', // Will be extracted from Google token
          'auth_type': 'google',
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Get current user profile
  Future<User> getCurrentUser(String token) async {
    try {
      // Note: Authorization header is now set globally in DioClient
      final response = await _dio.get('/users/profile');

      if (response.statusCode == 200) {
        // Handle different response formats
        final userData = response.data['user'] ?? response.data['data'] ?? response.data;
        return User.fromJson(userData);
      } else {
        throw Exception('Failed to get user profile: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Update user profile (supports both JSON and multipart data)
  Future<User> updateUserProfile({required String token, required Map<String, dynamic> userData, String? profileImagePath, String? panCardImagePath}) async {
    try {
      dynamic requestData;
      Options requestOptions;

      if (profileImagePath != null || panCardImagePath != null) {
        // Create FormData when any image is included
        final formDataMap = <String, dynamic>{};
        
        // Add profile image if provided
        if (profileImagePath != null) {
          final fileName = profileImagePath.split('/').last;
          final extension = fileName.toLowerCase().split('.').last;
          String? contentType = _getContentType(extension);
          
          debugPrint('🖼️ Updating profile with image: $fileName (type: $contentType)');
          
          formDataMap['profile_image'] = await MultipartFile.fromFile(
            profileImagePath,
            filename: fileName,
            contentType: contentType != null ? MediaType.parse(contentType) : null,
          );
        }

        // Add PAN card image if provided
        if (panCardImagePath != null) {
          final fileName = panCardImagePath.split('/').last;
          final extension = fileName.toLowerCase().split('.').last;
          String? contentType = _getContentType(extension);
          
          debugPrint('🆔 Updating profile with PAN card image: $fileName (type: $contentType)');
          
          formDataMap['pan_card_image'] = await MultipartFile.fromFile(
            panCardImagePath,
            filename: fileName,
            contentType: contentType != null ? MediaType.parse(contentType) : null,
          );
        }

        // Add all other profile fields
        formDataMap.addAll(userData);

        final formData = FormData.fromMap(formDataMap);
        requestData = formData;
        requestOptions = Options(contentType: 'multipart/form-data');
      } else {
        // Use JSON when no images
        requestData = userData;
        requestOptions = Options();
      }

      // Note: Authorization header is now set globally in DioClient
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
      // Let DioException bubble up for proper error handling
      rethrow;
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Refresh JWT token
  Future<String> refreshToken(String refreshToken) async {
    try {
      final response = await _dio.post(ApiEndpoints.refreshToken, data: {'refresh_token': refreshToken});

      if (response.statusCode == 200) {
        // Backend returns { success: true, data: { access_token, refresh_token, ... } }
        final data = response.data['data'] ?? response.data;
        return data['access_token'] ?? data['token'] ?? '';
      } else {
        throw Exception('Token refresh failed: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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
      debugPrint('🔍 Requesting wallet balance from: ${ApiEndpoints.userWalletBalance}');
      final response = await _dio.get(ApiEndpoints.userWalletBalance, options: Options(headers: {'Authorization': 'Bearer $token'}));

      if (response.statusCode == 200) {
        debugPrint('✅ Wallet balance API response: ${response.data}');
        if (response.data['success'] == true && response.data['data'] != null) {
          return response.data['data'];
        } else {
          debugPrint('❌ Unexpected response format: ${response.data}');
          throw Exception('Invalid wallet balance response format');
        }
      } else {
        throw Exception('Failed to get wallet balance: ${response.data['message']}');
      }
    } on DioException catch (e) {
      debugPrint('❌ Wallet balance API error: ${e.response?.statusCode} - ${e.response?.data}');
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Get customer wallet transactions
  Future<Map<String, dynamic>> getWalletTransactions(String token, {int limit = 20, int offset = 0}) async {
    try {
      final queryParams = {'limit': limit.toString(), 'offset': offset.toString()};
      final response = await _dio.get(
        ApiEndpoints.userWalletTransactions, 
        queryParameters: queryParams,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to get wallet transactions: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  /// Get astrologer consultation history
  Future<Map<String, dynamic>> getAstrologerConsultations({int limit = 20, int page = 1, String? status, String? type}) async {
    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final queryParams = <String, String>{
        'limit': limit.toString(),
        'page': page.toString(),
      };
      if (status != null) queryParams['status'] = status;
      if (type != null) queryParams['type'] = type;

      final response = await _dio.get(
        ApiEndpoints.astrologerConsultations,
        queryParameters: queryParams,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        // Transform to match customer history format
        final data = response.data['data'];
        final consultations = data['consultations'] as List<dynamic>? ?? [];

        // Map astrologer consultations to customer history format
        final mappedConsultations = consultations.map((c) {
          // Map session type to consultation type
          String consultationType = 'call';
          final sessionType = c['type'] ?? c['service_type'] ?? '';
          if (sessionType == 'chat') {
            consultationType = 'chat';
          } else if (sessionType == 'video_call') {
            consultationType = 'video';
          } else {
            consultationType = 'call';
          }

          // Format duration
          final durationMinutes = c['duration_minutes'] ?? 0;
          final durationStr = '$durationMinutes min';

          return <String, dynamic>{
            'id': c['consultation_id'] ?? c['id'] ?? '',
            'session_id': c['consultation_id'] ?? c['id'] ?? '',
            'consultation_id': c['consultation_id'] ?? c['id'] ?? '',
            // For history screen (uses astrologer_* fields)
            'astrologer_id': c['client_id'] ?? '',
            'astrologer_name': c['client_name'] ?? 'Unknown Client',
            'astrologer_image': c['client_image'],
            // For consultations screen (uses client_* fields)
            'client_id': c['client_id'] ?? '',
            'client_name': c['client_name'] ?? 'Unknown Client',
            'client_image': c['client_image'],
            'client_phone': c['client_phone'],
            'client_email': c['client_email'],
            'type': consultationType,
            'duration': durationStr,
            'duration_minutes': durationMinutes,
            'amount': c['total_amount'] ?? c['amount'] ?? 0,
            'total_amount': c['total_amount'] ?? c['amount'] ?? 0,
            'created_at': c['created_at'] ?? c['scheduled_time'],
            'scheduled_time': c['scheduled_time'] ?? c['created_at'],
            'status': c['status'] ?? 'completed',
            'rating': c['rating'],
            'review': c['review'],
          };
        }).toList();

        return {
          'success': true,
          'consultations': mappedConsultations,
          'has_more': data['pagination']?['has_next'] ?? data['has_more'] ?? false,
          'total_count': data['pagination']?['total_consultations'] ?? data['total'] ?? 0,
        };
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load consultations');
      }
    } on DioException catch (e) {
      debugPrint('❌ Astrologer consultations API error: ${e.message}');
      rethrow;
    }
  }

  // Create Razorpay order
  Future<Map<String, dynamic>> createRazorpayOrder(String token, {required double amount, String? currency, String? receipt, String? purpose, String? orderType}) async {
    try {
      final requestData = {
        'amount': amount,
        'currency': currency ?? 'INR',
        if (receipt != null) 'receipt': receipt,
        'purpose': purpose ?? 'wallet_recharge',
        'order_type': orderType ?? 'wallet',
      };

      debugPrint('🔄 Creating Razorpay order: amount=$amount, receipt=$receipt');

      final response = await _dio.post(
        '/payments/razorpay/create-order',
        data: requestData,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Razorpay order created successfully: ${response.data['data']['id']}');
        return response.data['data'];
      } else {
        debugPrint('❌ Failed to create Razorpay order: ${response.data}');
        throw Exception('Failed to create Razorpay order: ${response.data['message']}');
      }
    } on DioException catch (e) {
      debugPrint('❌ DioException creating Razorpay order:');
      debugPrint('   Status: ${e.response?.statusCode}');
      debugPrint('   Response: ${e.response?.data}');

      // Extract user-friendly error message from response
      final responseData = e.response?.data;
      if (responseData is Map) {
        final message = responseData['message'] ?? responseData['error'] ?? 'Payment service error';
        throw Exception(message);
      }

      // Let DioException bubble up for proper error handling
      rethrow;
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
        ApiEndpoints.userWalletRecharge,
        data: requestData,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['data'];
      } else {
        throw Exception('Failed to recharge wallet: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Get available astrologers
  Future<Map<String, dynamic>> getAvailableAstrologers({int limit = 10, int offset = 0, bool onlineOnly = false, bool featuredOnly = true, String? specialization}) async {
    try {
      final queryParams = {
        'limit': limit.toString(), 
        'offset': offset.toString(), 
        'online_only': onlineOnly.toString(),
        'featured': featuredOnly.toString()
      };

      final response = await _dio.get(ApiEndpoints.astrologersAvailable, queryParameters: queryParams);

      if (response.statusCode == 200) {
        debugPrint('🔍 Astrologers API Response: ${response.data}');
        
        final data = response.data['data'];
        if (data != null && data['astrologers'] is List) {
          final astrologers = data['astrologers'] as List;
          debugPrint('📊 Found ${astrologers.length} astrologers');
          for (int i = 0; i < astrologers.length && i < 3; i++) {
            final astrologer = astrologers[i];
            debugPrint('🖼️ Astrologer ${astrologer['full_name']}: profileImage = ${astrologer['profile_image']}');
          }
        }
        
        return data;
      } else {
        throw Exception('Failed to get astrologers: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  /// Get astrologer dashboard data including stats, earnings, and recent activity
  Future<Map<String, dynamic>> getAstrologerDashboard() async {
    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await _dio.get(
        ApiEndpoints.astrologerDashboard,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        debugPrint('📊 Dashboard data loaded successfully');

        // Extract stats for easy access
        final stats = data['stats'] ?? {};
        final earnings = stats['earnings'] ?? {};
        final chatSessions = stats['chat_sessions'] ?? {};
        final callSessions = stats['call_sessions'] ?? {};

        return {
          'success': true,
          'profile': data['profile'],
          'today_consultations': (chatSessions['today'] ?? 0) + (callSessions['today'] ?? 0),
          'total_consultations': (chatSessions['total'] ?? 0) + (callSessions['total'] ?? 0),
          'today_earnings': (earnings['today'] ?? 0).toDouble(),
          'total_earnings': (earnings['total'] ?? 0).toDouble(),
          'this_week_earnings': (earnings['this_week'] ?? 0).toDouble(),
          'this_month_earnings': (earnings['this_month'] ?? 0).toDouble(),
          'recent_activity': data['recent_activity'],
          'charts': data['charts'],
          'raw_data': data, // Full response for detailed views
        };
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load dashboard');
      }
    } on DioException catch (e) {
      debugPrint('❌ Dashboard API error: ${e.message}');
      rethrow;
    }
  }

  // Get featured products
  Future<List<Product>> getFeaturedProducts({int limit = 6}) async {
    try {
      final queryParams = {'limit': limit.toString(), 'featured': 'true'};

      final response = await _dio.get(ApiEndpoints.products, queryParameters: queryParams);

      if (response.statusCode == 200) {
        final productsData = response.data['products'] as List<dynamic>;
        return productsData.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Failed to get featured products: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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

      final response = await _dio.get(ApiEndpoints.products, queryParameters: queryParams);

      if (response.statusCode == 200) {
        final productsData = response.data['products'] as List<dynamic>;
        return productsData.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Failed to get products: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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
        final responseData = response.data;
        if (responseData == null) {
          throw Exception('No data received from astrologer options API');
        }
        
        // The API returns data directly, not nested under 'data'
        final options = {
          'languages': List<String>.from(responseData['languages'] ?? []),
          'skills': List<String>.from(responseData['skills'] ?? [])
        };
        
        // Cache the result
        await _localStorage.saveAstrologerOptions(options);
        
        
        return options;
      } else {
        throw Exception('Failed to get astrologer options: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Update astrologer online status
  Future<Map<String, dynamic>> updateAstrologerOnlineStatus(String token, bool isOnline) async {
    try {
      final response = await _dio.put(
        '/astrologers/dashboard',
        data: {'is_online': isOnline},
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Status updated successfully',
          'isOnline': isOnline,
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to update status',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Online status update error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'message': 'Failed to update online status',
      };
    }
  }

  // Get astrologer wallet/earnings data
  Future<Map<String, dynamic>> getAstrologerEarnings(String token, {
    String period = 'month',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'period': period,
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      final response = await _dio.get(
        ApiEndpoints.astrologerEarnings, 
        queryParameters: queryParams,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to get astrologer earnings: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Get astrologer earnings history (alias for backward compatibility)
  Future<Map<String, dynamic>> getAstrologerEarningsHistory(String token, {int limit = 10, int offset = 0}) async {
    // Convert offset to page
    final page = (offset / limit).floor() + 1;
    return getAstrologerEarnings(token, page: page, limit: limit);
  }

  // Update consultation (join, end, add notes, cancel)
  Future<Map<String, dynamic>> updateConsultation(String token, {
    required String consultationId,
    required String action,
    String? notes,
    String? sessionType,
  }) async {
    try {
      final requestData = {
        'consultation_id': consultationId,
        'action': action,
        if (notes != null) 'notes': notes,
        if (sessionType != null) 'session_type': sessionType,
      };

      final response = await _dio.put(
        ApiEndpoints.astrologerConsultations,
        data: requestData,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Consultation updated successfully',
          'data': response.data['data'] ?? {},
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to update consultation',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Update consultation API error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'message': _handleDioException(e),
      };
    }
  }

  // Request withdrawal
  Future<Map<String, dynamic>> requestWithdrawal(String token, {
    required double amount,
    required String withdrawalMethod,
    required Map<String, dynamic> accountDetails,
  }) async {
    try {
      final requestData = {
        'amount': amount,
        'withdrawal_method': withdrawalMethod,
        'account_details': accountDetails,
      };

      final response = await _dio.post(
        ApiEndpoints.astrologerEarnings,
        data: requestData,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Withdrawal request submitted successfully',
          'data': response.data['data'] ?? {},
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to submit withdrawal request',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Withdrawal request API error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'message': _handleDioException(e),
      };
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
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

  // Update astrologer UPI details
  Future<Map<String, dynamic>> updateAstrologerUpiDetails(String token, String upiId) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.astrologerWalletUpiDetails,
        data: {'upi_id': upiId},
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        return response.data['data'] ?? response.data;
      } else {
        throw Exception('Failed to update UPI details: ${response.data['message']}');
      }
    } on DioException {
      // Let DioException bubble up for proper error handling
      rethrow;
    }
  }

  // Request astrologer payout
  Future<Map<String, dynamic>> requestAstrologerPayout(
    String token, {
    required double amount,
    required String withdrawalMethod,
    required Map<String, dynamic> accountDetails,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.astrologerEarnings,
        data: {
          'amount': amount,
          'withdrawal_method': withdrawalMethod,
          'account_details': accountDetails,
        },
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to request payout',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Payout request API error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'message': _handleDioException(e),
      };
    }
  }

  /// Update FCM token on server
  Future<Map<String, dynamic>> updateFcmToken(
    String token, {
    required String fcmToken,
  }) async {
    try {
      final response = await _dio.patch(
        ApiEndpoints.updateFcmToken,
        data: {
          'fcmToken': fcmToken,
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to update FCM token: ${response.data['message']}');
      }
    } on DioException catch (e) {
      final errorMessage = _handleDioException(e);
      throw Exception(errorMessage);
    }
  }

  /// Create a new session record
  Future<Map<String, dynamic>> createSession(
    String token, {
    required String sessionId,
    required String sessionType,
    required String astrologerId,
    required String userId,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.sessions,
        data: {
          'sessionId': sessionId,
          'sessionType': sessionType,
          'astrologerId': astrologerId,
          'userId': userId,
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to create session: ${response.data['message']}');
      }
    } on DioException catch (e) {
      final errorMessage = _handleDioException(e);
      throw Exception(errorMessage);
    }
  }

  /// Update session billing information
  Future<Map<String, dynamic>> updateSessionBilling(
    String token, {
    required String sessionId,
    required String sessionType,
    required int durationMinutes,
    required double totalAmount,
  }) async {
    try {
      final response = await _dio.patch(
        ApiEndpoints.updateSessionBilling,
        data: {
          'sessionId': sessionId,
          'sessionType': sessionType,
          'durationMinutes': durationMinutes,
          'totalAmount': totalAmount,
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to update session billing: ${response.data['message']}');
      }
    } on DioException catch (e) {
      final errorMessage = _handleDioException(e);
      throw Exception(errorMessage);
    }
  }

  /// End a session and mark it as complete
  Future<Map<String, dynamic>> endSession(
    String token, {
    required String sessionId,
    required int durationMinutes,
    required double totalAmount,
  }) async {
    try {
      final response = await _dio.patch(
        '${ApiEndpoints.sessions}/$sessionId/end',
        data: {
          'durationMinutes': durationMinutes,
          'totalAmount': totalAmount,
          'status': 'completed',
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Failed to end session: ${response.data['message']}');
      }
    } on DioException catch (e) {
      final errorMessage = _handleDioException(e);
      throw Exception(errorMessage);
    }
  }

  // Forgot Password - Send reset email
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _dio.post('/auth/forgot-password', data: {
        'email': email,
      });

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Password reset email sent successfully',
          'resetToken': response.data['reset_token'], // For deep linking
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to send reset email',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Forgot password error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'message': _handleDioException(e),
      };
    }
  }

  // Reset Password with token
  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      if (newPassword != confirmPassword) {
        return {
          'success': false,
          'message': 'Passwords do not match',
        };
      }

      final response = await _dio.post('/auth/reset-password', data: {
        'token': token,
        'password': newPassword,
        'password_confirmation': confirmPassword,
      });

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Password reset successfully',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to reset password',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Reset password error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'message': _handleDioException(e),
      };
    }
  }

  // Verify reset token
  Future<Map<String, dynamic>> verifyResetToken(String token) async {
    try {
      final response = await _dio.post('/auth/verify-reset-token', data: {
        'token': token,
      });

      if (response.statusCode == 200) {
        return {
          'success': true,
          'email': response.data['email'],
          'message': 'Token is valid',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Invalid or expired token',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Verify reset token error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'message': _handleDioException(e),
      };
    }
  }

  // Change password
  Future<void> changePassword({required String token, required String currentPassword, required String newPassword}) async {
    final response = await _dio.post(
      ApiEndpoints.changePassword,
      data: {
        'current_password': currentPassword,
        'new_password': newPassword,
      },
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to change password: ${response.data['message']}');
    }
  }

  // Unified Authentication Methods (New)

  /// Send OTP to email or phone for unified authentication
  Future<Map<String, dynamic>> sendUnifiedOTP({
    required String identifier,
    required String authType, // 'email' or 'phone'
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.sendOtp,
        data: {
          'identifier': identifier,
          'auth_type': authType,
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'OTP sent successfully',
          'otp_sent_to': response.data['otp_sent_to'] ?? identifier,
          'expiry_seconds': response.data['expiry_seconds'] ?? 300,
          'testing_mode': response.data['testing_mode'] ?? false,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to send OTP',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Send Unified OTP error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
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
      final response = await _dio.post(
        ApiEndpoints.verifyOtp,
        data: {
          'identifier': identifier,
          'otp': otp,
          'auth_type': authType,
        },
      );

      if (response.statusCode == 200) {
        // Debug: Log the raw response to understand what backend returns
        debugPrint('🔍 verifyUnifiedOTP - Raw API Response:');
        debugPrint('   user_exists: ${response.data['user_exists']}');
        debugPrint('   requires_signup: ${response.data['requires_signup']}');
        if (response.data['user'] != null) {
          final userData = response.data['user'];
          debugPrint('   user.user_type: ${userData['user_type']}');
          debugPrint('   user.role: ${userData['role']}');
          debugPrint('   user.verification_status: ${userData['verification_status']}');
          debugPrint('   user.account_status: ${userData['account_status']}');
          debugPrint('   user.full_name: ${userData['full_name']}');
        } else {
          debugPrint('   user: null (new user signup flow)');
        }

        return {
          'success': true,
          'message': response.data['message'] ?? 'OTP verified successfully',
          'user_exists': response.data['user_exists'] ?? false,
          'requires_signup': response.data['requires_signup'] ?? true,
          'identifier': response.data['identifier'] ?? identifier,
          // If user exists, return login tokens
          if (response.data['user'] != null) 'user': User.fromJson(response.data['user']),
          if (response.data['access_token'] != null) 'access_token': response.data['access_token'],
          if (response.data['refresh_token'] != null) 'refresh_token': response.data['refresh_token'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Invalid OTP',
          'remaining_attempts': response.data['remaining_attempts'],
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Verify Unified OTP error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
        'remaining_attempts': e.response?.data['remaining_attempts'],
      };
    }
  }

  /// Link an additional auth method (email or phone) to existing account
  Future<Map<String, dynamic>> linkAccount({
    required String token,
    required String linkType, // 'email' or 'phone'
    required String identifier,
    required String otp,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.linkAccount,
        data: {
          'link_type': linkType,
          'identifier': identifier,
          'otp': otp,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Account linked successfully',
          'user': User.fromJson(response.data['user']),
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to link account',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Link account error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
      };
    }
  }

  // Phone Authentication Methods (Legacy - kept for backward compatibility)

  /// Send OTP to phone number for verification (signup)
  @Deprecated('Use sendUnifiedOTP with authType="phone" instead')
  Future<Map<String, dynamic>> sendOTP(String phoneNumber) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.sendOtp,
        data: {'phone_number': phoneNumber},
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'OTP sent successfully',
          'phone_number': response.data['phone_number'],
          'expiry_seconds': response.data['expiry_seconds'],
          'testing_mode': response.data['testing_mode'] ?? false,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to send OTP',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Send OTP error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
      };
    }
  }

  /// Send OTP to phone number for login
  Future<Map<String, dynamic>> sendOTPForLogin(String phoneNumber) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.sendOtp,
        data: {
          'identifier': phoneNumber,
          'auth_type': 'phone',
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'OTP sent successfully',
          'phone_number': response.data['phone_number'],
          'expiry_seconds': response.data['expiry_seconds'],
          'testing_mode': response.data['testing_mode'] ?? false,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to send OTP',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Send OTP for login error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
      };
    }
  }

  /// Verify OTP code for phone number
  Future<Map<String, dynamic>> verifyOTP(String phoneNumber, String otp) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.verifyOtp,
        data: {
          'phone_number': phoneNumber,
          'otp': otp,
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'OTP verified successfully',
          'phone_number': response.data['phone_number'],
          'phone_verified': response.data['phone_verified'] ?? true,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Invalid OTP',
          'remaining_attempts': response.data['remaining_attempts'],
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Verify OTP error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
        'remaining_attempts': e.response?.data['remaining_attempts'],
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
      final data = {
        'phone_number': phoneNumber,
        'full_name': fullName,
        'user_type': userType,
      };

      // Add optional birth details if provided
      if (dateOfBirth != null) data['date_of_birth'] = dateOfBirth;
      if (timeOfBirth != null) data['time_of_birth'] = timeOfBirth;
      if (placeOfBirth != null && placeOfBirth.isNotEmpty) {
        data['place_of_birth'] = placeOfBirth;
      }
      if (gender != null) data['gender'] = gender;

      final response = await _dio.post(
        ApiEndpoints.sendOtp,
        data: {
          'identifier': data['phone_number'],
          'auth_type': 'phone',
        },
      );

      if (response.statusCode == 200) {
        final userData = response.data['user'];
        final user = User.fromJson(userData);

        return {
          'success': true,
          'message': response.data['message'] ?? 'Account created successfully',
          'user': user,
          'access_token': response.data['access_token'],
          'refresh_token': response.data['refresh_token'],
          'token_type': response.data['token_type'] ?? 'Bearer',
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to create account',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Phone signup error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
      };
    }
  }

  /// Complete phone login and fetch user data with tokens
  Future<Map<String, dynamic>> phoneLoginComplete(String phoneNumber) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.login,
        data: {
          'identifier': phoneNumber,
          'auth_type': 'phone',
        },
      );

      if (response.statusCode == 200) {
        final userData = response.data['user'];
        final user = User.fromJson(userData);

        return {
          'success': true,
          'message': response.data['message'] ?? 'Login successful',
          'user': user,
          'access_token': response.data['access_token'],
          'refresh_token': response.data['refresh_token'],
          'token_type': response.data['token_type'] ?? 'Bearer',
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to login',
        };
      }
    } on DioException catch (e) {
      debugPrint('❌ Phone login complete error: ${e.response?.statusCode} - ${e.response?.data}');
      return {
        'success': false,
        'error': e.response?.data['error'] ?? _handleDioException(e),
      };
    }
  }

  // Helper method to get content type for images
  String? _getContentType(String extension) {
    switch (extension.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      case 'heif':
        return 'image/heif';
      default:
        return null;
    }
  }

  // Handle Dio exceptions and convert to user-friendly messages
  String _handleDioException(DioException e) {
    // Use our comprehensive error handler from ErrorHandler class
    final appError = ErrorHandler.handleError(e, context: 'api');
    
    // For specific Google sign-in flow, preserve USER_NOT_REGISTERED errors
    if (e.type == DioExceptionType.badResponse && e.response?.statusCode == 404) {
      final errorData = e.response?.data;
      if (errorData is Map && errorData['error'] == 'USER_NOT_REGISTERED') {
        // Preserve the original USER_NOT_REGISTERED error for Google signup flow
        throw Exception('USER_NOT_REGISTERED: ${errorData['message'] ?? 'User not registered'}');
      }
    }
    
    return appError.userMessage.isNotEmpty ? appError.userMessage : 'An error occurred. Please try again.';
  }
}
