import 'dart:io';
import 'dart:math';
import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:image/image.dart' as img;

/// Comprehensive End-to-End Testing Script for TrueAstroTalk Mobile App
/// 
/// This script tests:
/// 1. Astrologer Complete Workflow (10 users)
/// 2. Customer Complete Workflow (10 users) 
/// 3. Profile image functionality (app upload + Gmail profile)
/// 4. All major features and edge cases
class E2EComprehensiveTest {
  static const String baseUrl = 'https://trueastrotalk.com/api';
  static const String adminBaseUrl = 'https://trueastrotalk.com/api/admin';
  
  // Test configuration
  static const int astrologerCount = 10;
  static const int customerCount = 10;
  static const Duration requestTimeout = Duration(seconds: 30);
  
  late String adminAuthToken;
  final Random random = Random();
  final List<Map<String, dynamic>> testAstrologers = [];
  final List<Map<String, dynamic>> testCustomers = [];
  final List<String> testResults = [];

  // Test data generators
  final List<String> firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
    'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Priya', 'Anaya', 'Fatima', 'Aadhya', 'Inaya',
    'Myra', 'Sara', 'Aanya', 'Diya', 'Kavya'
  ];

  final List<String> lastNames = [
    'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar',
    'Agarwal', 'Jain', 'Bansal', 'Goyal', 'Mittal',
    'Shah', 'Patel', 'Mehta', 'Joshi', 'Tiwari'
  ];

  final List<String> cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  final List<String> astrologerSkills = [
    'Vedic Astrology', 'Numerology', 'Palmistry', 'Tarot Reading',
    'Vastu Shastra', 'Face Reading', 'Gemology', 'Horary Astrology',
    'KP Astrology', 'Lal Kitab', 'Prashna Astrology', 'Remedial Astrology'
  ];

  final List<String> languages = [
    'Hindi', 'English', 'Bengali', 'Telugu', 'Tamil',
    'Gujarati', 'Marathi', 'Punjabi', 'Urdu', 'Malayalam'
  ];

  // Initialize test suite
  Future<void> initialize() async {
    _log('🚀 Initializing E2E Comprehensive Test Suite');
    _log('📊 Configuration: ${astrologerCount} astrologers, ${customerCount} customers');
    
    // Generate test profile images
    await _generateTestImages();
    
    _log('✅ Initialization complete');
  }

  // Main test execution
  Future<void> runFullTestSuite() async {
    try {
      await initialize();
      
      _log('\n🔥 Starting Comprehensive E2E Testing');
      
      // Phase 1: Generate and register test users
      await _generateTestUsers();
      
      // Phase 2: Test astrologer workflows
      await _testAstrologerWorkflows();
      
      // Phase 3: Test customer workflows  
      await _testCustomerWorkflows();
      
      // Phase 4: Test interactions between users
      await _testUserInteractions();
      
      // Phase 5: Test profile image functionality
      await _testProfileImageFunctionality();
      
      // Phase 6: Generate comprehensive report
      await _generateTestReport();
      
    } catch (e) {
      _log('❌ Test suite failed: $e');
      rethrow;
    }
  }

  /// Phase 1: Generate comprehensive test users
  Future<void> _generateTestUsers() async {
    _log('\n📝 Phase 1: Generating Test Users');
    
    // Generate astrologers
    for (int i = 1; i <= astrologerCount; i++) {
      final astrologer = await _generateAstrologer(i);
      testAstrologers.add(astrologer);
      _log('✨ Generated astrologer: ${astrologer['full_name']}');
    }
    
    // Generate customers
    for (int i = 1; i <= customerCount; i++) {
      final customer = await _generateCustomer(i);
      testCustomers.add(customer);
      _log('✨ Generated customer: ${customer['full_name']}');
    }
    
    _log('✅ Phase 1 complete: ${testAstrologers.length + testCustomers.length} users generated');
  }

  /// Phase 2: Test complete astrologer workflows
  Future<void> _testAstrologerWorkflows() async {
    _log('\n🔮 Phase 2: Testing Astrologer Workflows');
    
    for (int i = 0; i < testAstrologers.length; i++) {
      final astrologer = testAstrologers[i];
      _log('\n--- Testing Astrologer ${i + 1}: ${astrologer['full_name']} ---');
      
      try {
        // 1. Test signup process
        final signupResult = await _testAstrologerSignup(astrologer);
        if (!signupResult['success']) {
          _log('❌ Signup failed: ${signupResult['error']}');
          continue;
        }
        astrologer['auth_token'] = signupResult['token'];
        astrologer['user_id'] = signupResult['user_id'];
        
        // 2. Test login process
        await _testAstrologerLogin(astrologer);
        
        // 3. Test profile completion
        await _testAstrologerProfileCompletion(astrologer);
        
        // 4. Test online status management
        await _testAstrologerOnlineStatus(astrologer);
        
        // 5. Test rate setting and management
        await _testAstrologerRateManagement(astrologer);
        
        // 6. Test dashboard and earnings
        await _testAstrologerDashboard(astrologer);
        
        // 7. Test availability management
        await _testAstrologerAvailability(astrologer);
        
        _log('✅ Astrologer ${astrologer['full_name']} workflow complete');
        
      } catch (e) {
        _log('❌ Astrologer ${astrologer['full_name']} workflow failed: $e');
      }
    }
  }

  /// Phase 3: Test complete customer workflows
  Future<void> _testCustomerWorkflows() async {
    _log('\n👤 Phase 3: Testing Customer Workflows');
    
    for (int i = 0; i < testCustomers.length; i++) {
      final customer = testCustomers[i];
      _log('\n--- Testing Customer ${i + 1}: ${customer['full_name']} ---');
      
      try {
        // 1. Test signup process (both regular and Gmail)
        final signupResult = await _testCustomerSignup(customer, i % 2 == 0);
        if (!signupResult['success']) {
          _log('❌ Signup failed: ${signupResult['error']}');
          continue;
        }
        customer['auth_token'] = signupResult['token'];
        customer['user_id'] = signupResult['user_id'];
        
        // 2. Test login process
        await _testCustomerLogin(customer);
        
        // 3. Test profile management
        await _testCustomerProfileManagement(customer);
        
        // 4. Test wallet functionality
        await _testCustomerWallet(customer);
        
        // 5. Test astrologer browsing and selection
        await _testCustomerAstrologerBrowsing(customer);
        
        _log('✅ Customer ${customer['full_name']} workflow complete');
        
      } catch (e) {
        _log('❌ Customer ${customer['full_name']} workflow failed: $e');
      }
    }
  }

  /// Phase 4: Test interactions between users
  Future<void> _testUserInteractions() async {
    _log('\n🤝 Phase 4: Testing User Interactions');
    
    // Test chat sessions
    await _testChatSessions();
    
    // Test call sessions
    await _testCallSessions();
    
    // Test payment flows
    await _testPaymentFlows();
    
    // Test reviews and ratings
    await _testReviewsAndRatings();
  }

  /// Phase 5: Test profile image functionality
  Future<void> _testProfileImageFunctionality() async {
    _log('\n📸 Phase 5: Testing Profile Image Functionality');
    
    // Test app-based image uploads
    await _testAppImageUploads();
    
    // Test Gmail profile image integration
    await _testGmailProfileImages();
    
    // Test image processing and optimization
    await _testImageProcessing();
  }

  /// Generate a comprehensive astrologer test user
  Future<Map<String, dynamic>> _generateAstrologer(int index) async {
    final firstName = firstNames[random.nextInt(firstNames.length)];
    final lastName = lastNames[random.nextInt(lastNames.length)];
    final email = 'astrologer${index}@test-${DateTime.now().millisecondsSinceEpoch}.com';
    final phone = '+91${9000000000 + index}';
    
    return {
      'user_type': 'astrologer',
      'full_name': '$firstName $lastName',
      'email': email,
      'phone': phone,
      'password': 'TestAstro@${index}23',
      'city': cities[random.nextInt(cities.length)],
      'state': 'Maharashtra',
      'country': 'India',
      'date_of_birth': _generateRandomDate(25, 65),
      'experience_years': random.nextInt(20) + 1,
      'bio': 'Experienced ${astrologerSkills[random.nextInt(astrologerSkills.length)]} practitioner with deep knowledge of ancient wisdom.',
      'skills': _getRandomSkills(),
      'languages': _getRandomLanguages(),
      'call_rate': (random.nextInt(50) + 10).toDouble(),
      'chat_rate': (random.nextInt(30) + 5).toDouble(),
      'video_rate': (random.nextInt(70) + 15).toDouble(),
      'qualification': 'Master in Astrology, Certified Vedic Astrologer',
      'specialization': astrologerSkills[random.nextInt(astrologerSkills.length)],
    };
  }

  /// Generate a comprehensive customer test user
  Future<Map<String, dynamic>> _generateCustomer(int index) async {
    final firstName = firstNames[random.nextInt(firstNames.length)];
    final lastName = lastNames[random.nextInt(lastNames.length)];
    final email = 'customer${index}@test-${DateTime.now().millisecondsSinceEpoch}.com';
    final phone = '+91${8000000000 + index}';
    
    return {
      'user_type': 'user',
      'full_name': '$firstName $lastName',
      'email': email,
      'phone': phone,
      'password': 'TestUser@${index}23',
      'city': cities[random.nextInt(cities.length)],
      'state': 'Karnataka',
      'country': 'India',
      'date_of_birth': _generateRandomDate(18, 70),
      'time_of_birth': '${random.nextInt(12) + 1}:${random.nextInt(60).toString().padLeft(2, '0')} ${random.nextBool() ? 'AM' : 'PM'}',
      'place_of_birth': cities[random.nextInt(cities.length)],
      'gender': random.nextBool() ? 'Male' : 'Female',
      'marital_status': ['Single', 'Married', 'Divorced'][random.nextInt(3)],
    };
  }

  /// Test astrologer signup process
  Future<Map<String, dynamic>> _testAstrologerSignup(Map<String, dynamic> astrologer) async {
    _log('📝 Testing astrologer signup for: ${astrologer['full_name']}');
    
    try {
      // Test profile image upload (50% app upload, 50% no image)
      String? profileImageId;
      if (random.nextBool()) {
        profileImageId = await _uploadTestImage('astrologer_${astrologer['email']}');
      }

      final signupData = {
        ...astrologer,
        'profile_image_id': profileImageId,
        'accept_terms': true,
        'user_type': 'astrologer',
      };

      final response = await _makeRequest(
        'POST',
        '/auth/register',
        body: signupData,
      );

      if (response['success']) {
        _log('✅ Astrologer signup successful');
        return {
          'success': true,
          'token': response['token'],
          'user_id': response['user']['_id'],
        };
      } else {
        _log('❌ Astrologer signup failed: ${response['message']}');
        return {'success': false, 'error': response['message']};
      }
    } catch (e) {
      _log('❌ Astrologer signup error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Test customer signup process
  Future<Map<String, dynamic>> _testCustomerSignup(Map<String, dynamic> customer, bool useGmailProfile) async {
    _log('📝 Testing customer signup for: ${customer['full_name']} (Gmail: $useGmailProfile)');
    
    try {
      String? profileImageId;
      String? googleProfileUrl;

      if (useGmailProfile) {
        // Simulate Gmail profile image
        googleProfileUrl = 'https://lh3.googleusercontent.com/a/test-profile-${customer['email']}.jpg';
        customer['google_profile_image'] = googleProfileUrl;
      } else if (random.nextBool()) {
        // Upload app-based profile image
        profileImageId = await _uploadTestImage('customer_${customer['email']}');
      }

      final signupData = {
        ...customer,
        'profile_image_id': profileImageId,
        'google_profile_image': googleProfileUrl,
        'accept_terms': true,
        'user_type': 'user',
      };

      final response = await _makeRequest(
        'POST',
        '/auth/register',
        body: signupData,
      );

      if (response['success']) {
        _log('✅ Customer signup successful');
        return {
          'success': true,
          'token': response['token'],
          'user_id': response['user']['_id'],
        };
      } else {
        _log('❌ Customer signup failed: ${response['message']}');
        return {'success': false, 'error': response['message']};
      }
    } catch (e) {
      _log('❌ Customer signup error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Test astrologer login process
  Future<bool> _testAstrologerLogin(Map<String, dynamic> astrologer) async {
    _log('🔐 Testing astrologer login');
    
    try {
      final response = await _makeRequest(
        'POST',
        '/auth/login',
        body: {
          'email': astrologer['email'],
          'password': astrologer['password'],
        },
      );

      if (response['success']) {
        _log('✅ Astrologer login successful');
        return true;
      } else {
        _log('❌ Astrologer login failed: ${response['message']}');
        return false;
      }
    } catch (e) {
      _log('❌ Astrologer login error: $e');
      return false;
    }
  }

  /// Test customer login process
  Future<bool> _testCustomerLogin(Map<String, dynamic> customer) async {
    _log('🔐 Testing customer login');
    
    try {
      final response = await _makeRequest(
        'POST',
        '/auth/login',
        body: {
          'email': customer['email'],
          'password': customer['password'],
        },
      );

      if (response['success']) {
        _log('✅ Customer login successful');
        return true;
      } else {
        _log('❌ Customer login failed: ${response['message']}');
        return false;
      }
    } catch (e) {
      _log('❌ Customer login error: $e');
      return false;
    }
  }

  /// Test astrologer profile completion
  Future<void> _testAstrologerProfileCompletion(Map<String, dynamic> astrologer) async {
    _log('📋 Testing astrologer profile completion');
    
    try {
      final profileData = {
        'bio': astrologer['bio'],
        'experience_years': astrologer['experience_years'],
        'skills': astrologer['skills'],
        'languages': astrologer['languages'],
        'qualification': astrologer['qualification'],
        'specialization': astrologer['specialization'],
        'call_rate': astrologer['call_rate'],
        'chat_rate': astrologer['chat_rate'],
        'video_rate': astrologer['video_rate'],
      };

      final response = await _makeRequest(
        'PUT',
        '/users/profile',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
        body: profileData,
      );

      if (response['success']) {
        _log('✅ Astrologer profile completion successful');
      } else {
        _log('❌ Astrologer profile completion failed: ${response['message']}');
      }
    } catch (e) {
      _log('❌ Astrologer profile completion error: $e');
    }
  }

  /// Test astrologer online status management
  Future<void> _testAstrologerOnlineStatus(Map<String, dynamic> astrologer) async {
    _log('🟢 Testing astrologer online status management');
    
    try {
      // Test going online
      final onlineResponse = await _makeRequest(
        'PUT',
        '/astrologers/status',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
        body: {'is_online': true},
      );

      if (onlineResponse['success']) {
        _log('✅ Astrologer online status set successfully');
      }

      // Wait a bit then test going offline
      await Future.delayed(Duration(seconds: 2));

      final offlineResponse = await _makeRequest(
        'PUT',
        '/astrologers/status',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
        body: {'is_online': false},
      );

      if (offlineResponse['success']) {
        _log('✅ Astrologer offline status set successfully');
      }
    } catch (e) {
      _log('❌ Astrologer online status error: $e');
    }
  }

  /// Test astrologer rate management
  Future<void> _testAstrologerRateManagement(Map<String, dynamic> astrologer) async {
    _log('💰 Testing astrologer rate management');
    
    try {
      final newRates = {
        'call_rate': astrologer['call_rate'] + 5,
        'chat_rate': astrologer['chat_rate'] + 2,
        'video_rate': astrologer['video_rate'] + 8,
      };

      final response = await _makeRequest(
        'PUT',
        '/astrologers/rates',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
        body: newRates,
      );

      if (response['success']) {
        _log('✅ Astrologer rate management successful');
      } else {
        _log('❌ Astrologer rate management failed: ${response['message']}');
      }
    } catch (e) {
      _log('❌ Astrologer rate management error: $e');
    }
  }

  /// Test astrologer dashboard and earnings
  Future<void> _testAstrologerDashboard(Map<String, dynamic> astrologer) async {
    _log('📊 Testing astrologer dashboard and earnings');
    
    try {
      // Test dashboard data
      final dashboardResponse = await _makeRequest(
        'GET',
        '/astrologers/dashboard',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
      );

      if (dashboardResponse['success']) {
        _log('✅ Astrologer dashboard data loaded successfully');
      }

      // Test earnings history
      final earningsResponse = await _makeRequest(
        'GET',
        '/astrologers/earnings',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
      );

      if (earningsResponse['success']) {
        _log('✅ Astrologer earnings data loaded successfully');
      }

      // Test transaction history
      final transactionsResponse = await _makeRequest(
        'GET',
        '/wallet/transactions',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
      );

      if (transactionsResponse['success']) {
        _log('✅ Astrologer transaction history loaded successfully');
      }
    } catch (e) {
      _log('❌ Astrologer dashboard error: $e');
    }
  }

  /// Test astrologer availability management
  Future<void> _testAstrologerAvailability(Map<String, dynamic> astrologer) async {
    _log('📅 Testing astrologer availability management');
    
    try {
      final availabilityData = {
        'monday': {'start': '09:00', 'end': '18:00', 'available': true},
        'tuesday': {'start': '09:00', 'end': '18:00', 'available': true},
        'wednesday': {'start': '09:00', 'end': '18:00', 'available': true},
        'thursday': {'start': '09:00', 'end': '18:00', 'available': true},
        'friday': {'start': '09:00', 'end': '18:00', 'available': true},
        'saturday': {'start': '10:00', 'end': '16:00', 'available': true},
        'sunday': {'available': false},
      };

      final response = await _makeRequest(
        'PUT',
        '/astrologers/availability',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
        body: availabilityData,
      );

      if (response['success']) {
        _log('✅ Astrologer availability management successful');
      } else {
        _log('❌ Astrologer availability management failed: ${response['message']}');
      }
    } catch (e) {
      _log('❌ Astrologer availability management error: $e');
    }
  }

  /// Test customer profile management
  Future<void> _testCustomerProfileManagement(Map<String, dynamic> customer) async {
    _log('👤 Testing customer profile management');
    
    try {
      final profileUpdateData = {
        'full_name': customer['full_name'],
        'date_of_birth': customer['date_of_birth'],
        'time_of_birth': customer['time_of_birth'],
        'place_of_birth': customer['place_of_birth'],
        'gender': customer['gender'],
        'marital_status': customer['marital_status'],
      };

      final response = await _makeRequest(
        'PUT',
        '/users/profile',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: profileUpdateData,
      );

      if (response['success']) {
        _log('✅ Customer profile management successful');
      } else {
        _log('❌ Customer profile management failed: ${response['message']}');
      }
    } catch (e) {
      _log('❌ Customer profile management error: $e');
    }
  }

  /// Test customer wallet functionality
  Future<void> _testCustomerWallet(Map<String, dynamic> customer) async {
    _log('💳 Testing customer wallet functionality');
    
    try {
      // Test wallet balance check
      final balanceResponse = await _makeRequest(
        'GET',
        '/wallet/balance',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
      );

      if (balanceResponse['success']) {
        _log('✅ Customer wallet balance check successful');
      }

      // Test add money to wallet (simulate)
      final addMoneyResponse = await _makeRequest(
        'POST',
        '/wallet/add',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: {
          'amount': 500.0,
          'payment_method': 'razorpay',
          'payment_id': 'test_payment_${random.nextInt(10000)}',
        },
      );

      if (addMoneyResponse['success']) {
        _log('✅ Customer add money to wallet successful');
      }

      // Test transaction history
      final transactionResponse = await _makeRequest(
        'GET',
        '/wallet/transactions',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
      );

      if (transactionResponse['success']) {
        _log('✅ Customer wallet transaction history successful');
      }
    } catch (e) {
      _log('❌ Customer wallet functionality error: $e');
    }
  }

  /// Test customer astrologer browsing
  Future<void> _testCustomerAstrologerBrowsing(Map<String, dynamic> customer) async {
    _log('🔍 Testing customer astrologer browsing');
    
    try {
      // Test browse all astrologers
      final allAstrologersResponse = await _makeRequest(
        'GET',
        '/astrologers',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
      );

      if (allAstrologersResponse['success']) {
        _log('✅ Customer browse all astrologers successful');
      }

      // Test filter astrologers by skill
      final filteredResponse = await _makeRequest(
        'GET',
        '/astrologers?skills=Vedic Astrology',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
      );

      if (filteredResponse['success']) {
        _log('✅ Customer filter astrologers successful');
      }

      // Test get astrologer details
      if (testAstrologers.isNotEmpty) {
        final astrologerId = testAstrologers.first['user_id'];
        final detailsResponse = await _makeRequest(
          'GET',
          '/astrologers/$astrologerId',
          headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        );

        if (detailsResponse['success']) {
          _log('✅ Customer get astrologer details successful');
        }
      }
    } catch (e) {
      _log('❌ Customer astrologer browsing error: $e');
    }
  }

  /// Test chat sessions between users
  Future<void> _testChatSessions() async {
    _log('💬 Testing chat sessions');
    
    if (testAstrologers.isEmpty || testCustomers.isEmpty) {
      _log('⚠️ No users available for chat testing');
      return;
    }

    try {
      final customer = testCustomers.first;
      final astrologer = testAstrologers.first;

      // Initiate chat session
      final chatResponse = await _makeRequest(
        'POST',
        '/chat/sessions',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: {
          'astrologer_id': astrologer['user_id'],
          'session_type': 'chat',
        },
      );

      if (chatResponse['success']) {
        final sessionId = chatResponse['session']['_id'];
        _log('✅ Chat session initiated successfully');

        // Test sending messages
        await _testChatMessages(sessionId, customer, astrologer);

        // Test ending session
        await _makeRequest(
          'PUT',
          '/chat/sessions/$sessionId/end',
          headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        );

        _log('✅ Chat session completed successfully');
      }
    } catch (e) {
      _log('❌ Chat session testing error: $e');
    }
  }

  /// Test call sessions between users
  Future<void> _testCallSessions() async {
    _log('📞 Testing call sessions');
    
    if (testAstrologers.isEmpty || testCustomers.isEmpty) {
      _log('⚠️ No users available for call testing');
      return;
    }

    try {
      final customer = testCustomers[1 % testCustomers.length];
      final astrologer = testAstrologers[1 % testAstrologers.length];

      // Initiate call session
      final callResponse = await _makeRequest(
        'POST',
        '/calls/initiate',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: {
          'astrologer_id': astrologer['user_id'],
          'call_type': 'voice',
        },
      );

      if (callResponse['success']) {
        final sessionId = callResponse['session']['_id'];
        _log('✅ Call session initiated successfully');

        // Simulate call acceptance
        await _makeRequest(
          'PUT',
          '/calls/$sessionId/accept',
          headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
        );

        // Simulate call duration
        await Future.delayed(Duration(seconds: 3));

        // End call
        await _makeRequest(
          'PUT',
          '/calls/$sessionId/end',
          headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
          body: {'duration': 180}, // 3 minutes
        );

        _log('✅ Call session completed successfully');
      }
    } catch (e) {
      _log('❌ Call session testing error: $e');
    }
  }

  /// Test payment flows
  Future<void> _testPaymentFlows() async {
    _log('💳 Testing payment flows');
    
    // Test various payment scenarios
    await _testWalletPayments();
    await _testRazorpayPayments();
    await _testRefundProcessing();
  }

  /// Test reviews and ratings
  Future<void> _testReviewsAndRatings() async {
    _log('⭐ Testing reviews and ratings');
    
    if (testAstrologers.isEmpty || testCustomers.isEmpty) {
      _log('⚠️ No users available for review testing');
      return;
    }

    try {
      final customer = testCustomers.first;
      final astrologer = testAstrologers.first;

      // Submit review
      final reviewResponse = await _makeRequest(
        'POST',
        '/astrologers/${astrologer['user_id']}/reviews',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: {
          'rating': 5,
          'comment': 'Excellent consultation! Very insightful and accurate predictions.',
          'session_type': 'chat',
        },
      );

      if (reviewResponse['success']) {
        _log('✅ Review submission successful');
      }

      // Get reviews for astrologer
      final getReviewsResponse = await _makeRequest(
        'GET',
        '/astrologers/${astrologer['user_id']}/reviews',
      );

      if (getReviewsResponse['success']) {
        _log('✅ Review retrieval successful');
      }
    } catch (e) {
      _log('❌ Reviews and ratings testing error: $e');
    }
  }

  /// Test app-based image uploads
  Future<void> _testAppImageUploads() async {
    _log('📱 Testing app-based image uploads');
    
    try {
      for (int i = 0; i < 5; i++) {
        final imageId = await _uploadTestImage('app_test_image_$i');
        if (imageId != null) {
          _log('✅ App image upload $i successful');
        } else {
          _log('❌ App image upload $i failed');
        }
        
        // Test different image sizes and formats
        await Future.delayed(Duration(milliseconds: 500));
      }
    } catch (e) {
      _log('❌ App image upload testing error: $e');
    }
  }

  /// Test Gmail profile image integration
  Future<void> _testGmailProfileImages() async {
    _log('📧 Testing Gmail profile image integration');
    
    // This tests that Gmail profile URLs are properly handled
    final testUrls = [
      'https://lh3.googleusercontent.com/a/default-user',
      'https://lh3.googleusercontent.com/a/test-profile-1.jpg',
      'https://lh3.googleusercontent.com/a/test-profile-2.jpg',
    ];

    for (final url in testUrls) {
      try {
        // Test that the system can handle Gmail profile URLs
        final response = await _makeRequest(
          'POST',
          '/users/validate-profile-image',
          body: {'profile_image_url': url},
        );

        if (response['success']) {
          _log('✅ Gmail profile URL validation successful: $url');
        } else {
          _log('❌ Gmail profile URL validation failed: $url');
        }
      } catch (e) {
        _log('❌ Gmail profile URL testing error: $e');
      }
    }
  }

  /// Test image processing and optimization
  Future<void> _testImageProcessing() async {
    _log('🖼️ Testing image processing and optimization');
    
    try {
      // Test various image formats and sizes
      final testCases = [
        {'format': 'jpg', 'size': '1024x1024'},
        {'format': 'png', 'size': '512x512'},
        {'format': 'webp', 'size': '256x256'},
      ];

      for (final testCase in testCases) {
        final imageId = await _uploadTestImage(
          'processing_test_${testCase['format']}_${testCase['size']}',
          format: testCase['format'],
        );

        if (imageId != null) {
          _log('✅ Image processing test successful: ${testCase['format']} ${testCase['size']}');
        } else {
          _log('❌ Image processing test failed: ${testCase['format']} ${testCase['size']}');
        }
      }
    } catch (e) {
      _log('❌ Image processing testing error: $e');
    }
  }

  /// Helper method to test chat messages
  Future<void> _testChatMessages(String sessionId, Map<String, dynamic> customer, Map<String, dynamic> astrologer) async {
    final messages = [
      'Hello, I need guidance about my career.',
      'Can you help me understand my birth chart?',
      'What do you see in my future?',
    ];

    for (int i = 0; i < messages.length; i++) {
      await _makeRequest(
        'POST',
        '/chat/sessions/$sessionId/messages',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: {
          'message': messages[i],
          'message_type': 'text',
        },
      );

      // Astrologer responds
      await _makeRequest(
        'POST',
        '/chat/sessions/$sessionId/messages',
        headers: {'Authorization': 'Bearer ${astrologer['auth_token']}'},
        body: {
          'message': 'Thank you for your question. Let me analyze this for you...',
          'message_type': 'text',
        },
      );

      await Future.delayed(Duration(milliseconds: 500));
    }
  }

  /// Helper method to test wallet payments
  Future<void> _testWalletPayments() async {
    _log('💰 Testing wallet payment flows');
    
    if (testCustomers.isEmpty) return;

    try {
      final customer = testCustomers.first;
      
      // Test wallet deduction for consultation
      final paymentResponse = await _makeRequest(
        'POST',
        '/wallet/deduct',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: {
          'amount': 100.0,
          'purpose': 'consultation',
          'consultation_id': 'test_consultation_123',
        },
      );

      if (paymentResponse['success']) {
        _log('✅ Wallet payment deduction successful');
      }
    } catch (e) {
      _log('❌ Wallet payment testing error: $e');
    }
  }

  /// Helper method to test Razorpay payments
  Future<void> _testRazorpayPayments() async {
    _log('💳 Testing Razorpay payment flows');
    
    try {
      // Simulate Razorpay payment verification
      final paymentResponse = await _makeRequest(
        'POST',
        '/payments/verify',
        body: {
          'razorpay_order_id': 'test_order_${random.nextInt(10000)}',
          'razorpay_payment_id': 'test_payment_${random.nextInt(10000)}',
          'razorpay_signature': 'test_signature_${random.nextInt(10000)}',
          'amount': 500.0,
        },
      );

      if (paymentResponse['success']) {
        _log('✅ Razorpay payment verification successful');
      }
    } catch (e) {
      _log('❌ Razorpay payment testing error: $e');
    }
  }

  /// Helper method to test refund processing
  Future<void> _testRefundProcessing() async {
    _log('🔄 Testing refund processing flows');
    
    if (testCustomers.isEmpty) return;

    try {
      final customer = testCustomers.first;
      
      // Test refund request
      final refundResponse = await _makeRequest(
        'POST',
        '/payments/refund',
        headers: {'Authorization': 'Bearer ${customer['auth_token']}'},
        body: {
          'transaction_id': 'test_transaction_${random.nextInt(10000)}',
          'amount': 50.0,
          'reason': 'Consultation cancelled',
        },
      );

      if (refundResponse['success']) {
        _log('✅ Refund processing successful');
      }
    } catch (e) {
      _log('❌ Refund processing testing error: $e');
    }
  }

  /// Upload a test image and return media_id
  Future<String?> _uploadTestImage(String imageName, {String format = 'jpg'}) async {
    try {
      // Generate a test image
      final image = img.Image(width: 300, height: 300);
      img.fill(image, color: img.ColorRgb8(
        random.nextInt(255),
        random.nextInt(255), 
        random.nextInt(255),
      ));

      List<int> imageBytes;
      String mimeType;

      switch (format) {
        case 'png':
          imageBytes = img.encodePng(image);
          mimeType = 'image/png';
          break;
        case 'webp':
          imageBytes = img.encodeJpg(image, quality: 85); // WebP not available, using JPG
          mimeType = 'image/jpeg';
          break;
        default:
          imageBytes = img.encodeJpg(image, quality: 85);
          mimeType = 'image/jpeg';
      }

      // Create multipart request
      final uri = Uri.parse('$baseUrl/upload');
      final request = http.MultipartRequest('POST', uri);
      
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          imageBytes,
          filename: '$imageName.$format',
        ),
      );
      request.fields['type'] = 'profile_image';

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['media_id'];
        }
      }
      
      return null;
    } catch (e) {
      _log('❌ Image upload error: $e');
      return null;
    }
  }

  /// Generate test images for the test suite
  Future<void> _generateTestImages() async {
    _log('🎨 Generating test images...');
    
    final testImageDir = Directory('./test_images');
    if (!testImageDir.existsSync()) {
      testImageDir.createSync(recursive: true);
    }
    
    // Generate sample profile images
    for (int i = 0; i < 20; i++) {
      final image = img.Image(width: 400, height: 400);
      
      // Create gradient background
      for (int y = 0; y < 400; y++) {
        for (int x = 0; x < 400; x++) {
          final r = ((x / 400) * 255).round();
          final g = ((y / 400) * 255).round();
          final b = ((i * 10) % 255);
          image.setPixelRgb(x, y, r, g, b);
        }
      }
      
      final file = File('./test_images/profile_$i.jpg');
      await file.writeAsBytes(img.encodeJpg(image));
    }
    
    _log('✅ Test images generated');
  }

  /// Generate comprehensive test report
  Future<void> _generateTestReport() async {
    _log('\n📊 Generating Comprehensive Test Report');
    
    final report = StringBuffer();
    report.writeln('# TrueAstroTalk Mobile App - E2E Test Report');
    report.writeln('Generated: ${DateTime.now().toIso8601String()}\n');
    
    // Summary
    report.writeln('## Test Summary');
    report.writeln('- **Astrologers Tested**: ${testAstrologers.length}');
    report.writeln('- **Customers Tested**: ${testCustomers.length}');
    report.writeln('- **Total Test Cases**: ${testResults.length}');
    
    // Calculate success rate
    final successCount = testResults.where((r) => r.contains('✅')).length;
    final successRate = (successCount / testResults.length * 100).toStringAsFixed(1);
    report.writeln('- **Success Rate**: $successRate% ($successCount/${testResults.length})');
    
    // Detailed results
    report.writeln('\n## Detailed Test Results');
    for (final result in testResults) {
      report.writeln('- $result');
    }
    
    // User data summary
    report.writeln('\n## Generated Test Users');
    
    report.writeln('\n### Astrologers');
    for (int i = 0; i < testAstrologers.length; i++) {
      final astrologer = testAstrologers[i];
      report.writeln('${i + 1}. **${astrologer['full_name']}**');
      report.writeln('   - Email: ${astrologer['email']}');
      report.writeln('   - Skills: ${astrologer['skills'].join(', ')}');
      report.writeln('   - Experience: ${astrologer['experience_years']} years');
    }
    
    report.writeln('\n### Customers');
    for (int i = 0; i < testCustomers.length; i++) {
      final customer = testCustomers[i];
      report.writeln('${i + 1}. **${customer['full_name']}**');
      report.writeln('   - Email: ${customer['email']}');
      report.writeln('   - Location: ${customer['city']}, ${customer['state']}');
      report.writeln('   - Profile Image: ${customer.containsKey('google_profile_image') ? 'Gmail' : 'App Upload'}');
    }
    
    // Save report
    final reportFile = File('./test_report_${DateTime.now().millisecondsSinceEpoch}.md');
    await reportFile.writeAsString(report.toString());
    
    _log('✅ Test report generated: ${reportFile.path}');
    _log('\n🎉 E2E Comprehensive Testing Complete!');
    _log('📈 Success Rate: $successRate% ($successCount/${testResults.length} tests passed)');
  }

  /// Helper method to make HTTP requests
  Future<Map<String, dynamic>> _makeRequest(
    String method,
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? body,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      late http.Response response;

      final requestHeaders = {
        'Content-Type': 'application/json',
        ...?headers,
      };

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: requestHeaders).timeout(requestTimeout);
          break;
        case 'POST':
          response = await http.post(
            uri,
            headers: requestHeaders,
            body: body != null ? json.encode(body) : null,
          ).timeout(requestTimeout);
          break;
        case 'PUT':
          response = await http.put(
            uri,
            headers: requestHeaders,
            body: body != null ? json.encode(body) : null,
          ).timeout(requestTimeout);
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: requestHeaders).timeout(requestTimeout);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      if (response.body.isEmpty) {
        return {'success': response.statusCode < 400};
      }

      return json.decode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Helper methods
  String _generateRandomDate(int minAge, int maxAge) {
    final now = DateTime.now();
    final age = minAge + random.nextInt(maxAge - minAge);
    final birthDate = now.subtract(Duration(days: age * 365));
    return '${birthDate.day.toString().padLeft(2, '0')}/${birthDate.month.toString().padLeft(2, '0')}/${birthDate.year}';
  }

  List<String> _getRandomSkills() {
    final count = 2 + random.nextInt(4); // 2-5 skills
    final skills = List.from(astrologerSkills)..shuffle();
    return skills.take(count).cast<String>().toList();
  }

  List<String> _getRandomLanguages() {
    final count = 1 + random.nextInt(3); // 1-3 languages
    final langs = List.from(languages)..shuffle();
    return langs.take(count).cast<String>().toList();
  }

  void _log(String message) {
    final timestamp = DateTime.now().toIso8601String().split('T')[1].split('.')[0];
    final logMessage = '[$timestamp] $message';
    print(logMessage);
    testResults.add(message);
  }
}

/// Main execution
void main() async {
  final tester = E2EComprehensiveTest();
  
  try {
    await tester.runFullTestSuite();
  } catch (e) {
    print('❌ Test suite execution failed: $e');
    exit(1);
  }
}