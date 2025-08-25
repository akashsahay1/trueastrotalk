import 'dart:io';
import 'dart:math';
import 'dart:convert';

/// Simple End-to-End Testing Script for TrueAstroTalk Mobile App
/// 
/// This script creates test data for:
/// 1. 10 Astrologers with complete profiles
/// 2. 10 Customers with different profile types
/// 3. Generates test scenarios for manual/automated testing
class SimpleE2ETest {
  static const String baseUrl = 'http://localhost:4000/api';
  static const int astrologerCount = 10;
  static const int customerCount = 10;
  
  final Random random = Random();
  final List<Map<String, dynamic>> testAstrologers = [];
  final List<Map<String, dynamic>> testCustomers = [];
  final List<String> testLogs = [];

  // Test data arrays
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

  /// Generate comprehensive test data
  Future<void> generateTestData() async {
    _log('🚀 Starting E2E Test Data Generation');
    
    // Generate astrologers
    for (int i = 1; i <= astrologerCount; i++) {
      final astrologer = _generateAstrologer(i);
      testAstrologers.add(astrologer);
      _log('✨ Generated astrologer: ${astrologer['full_name']}');
    }
    
    // Generate customers
    for (int i = 1; i <= customerCount; i++) {
      final customer = _generateCustomer(i);
      testCustomers.add(customer);
      _log('✨ Generated customer: ${customer['full_name']}');
    }
    
    // Generate test scenarios
    await _generateTestScenarios();
    
    // Save test data to files
    await _saveTestDataToFiles();
    
    _log('✅ Test data generation complete!');
  }

  /// Generate astrologer test data
  Map<String, dynamic> _generateAstrologer(int index) {
    final firstName = firstNames[random.nextInt(firstNames.length)];
    final lastName = lastNames[random.nextInt(lastNames.length)];
    final email = 'astrologer$index@testastro.com';
    final phone = '+91${9000000000 + index}';
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    
    return {
      'id': index,
      'user_type': 'astrologer',
      'full_name': '$firstName $lastName',
      'email': email,
      'phone': phone,
      'password': 'TestAstro${index}23',
      'city': cities[random.nextInt(cities.length)],
      'state': 'Maharashtra',
      'country': 'India',
      'date_of_birth': _generateRandomDate(25, 65),
      'experience_years': random.nextInt(20) + 1,
      'bio': 'Experienced ${astrologerSkills[random.nextInt(astrologerSkills.length)]} practitioner with ${random.nextInt(20) + 1} years of expertise in guiding people through life\'s challenges.',
      'skills': _getRandomSkills(),
      'languages': _getRandomLanguages(),
      'call_rate': (random.nextInt(50) + 10).toDouble(),
      'chat_rate': (random.nextInt(30) + 5).toDouble(),
      'video_rate': (random.nextInt(70) + 15).toDouble(),
      'qualification': 'Master in Astrology, Certified Vedic Astrologer',
      'specialization': astrologerSkills[random.nextInt(astrologerSkills.length)],
      'profile_image_type': index % 2 == 0 ? 'app_upload' : 'none',
      'created_timestamp': timestamp,
      'test_scenarios': _generateAstrologerScenarios(),
    };
  }

  /// Generate customer test data
  Map<String, dynamic> _generateCustomer(int index) {
    final firstName = firstNames[random.nextInt(firstNames.length)];
    final lastName = lastNames[random.nextInt(lastNames.length)];
    final email = 'customer$index@testuser.com';
    final phone = '+91${8000000000 + index}';
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    
    // Determine profile image type
    String profileImageType;
    String? googleProfileUrl;
    
    if (index % 3 == 0) {
      profileImageType = 'gmail_profile';
      googleProfileUrl = 'https://lh3.googleusercontent.com/a/test-profile-$index.jpg';
    } else if (index % 3 == 1) {
      profileImageType = 'app_upload';
    } else {
      profileImageType = 'none';
    }
    
    return {
      'id': index,
      'user_type': 'user',
      'full_name': '$firstName $lastName',
      'email': email,
      'phone': phone,
      'password': 'TestUser${index}23',
      'city': cities[random.nextInt(cities.length)],
      'state': 'Karnataka',
      'country': 'India',
      'date_of_birth': _generateRandomDate(18, 70),
      'time_of_birth': '${random.nextInt(12) + 1}:${random.nextInt(60).toString().padLeft(2, '0')} ${random.nextBool() ? 'AM' : 'PM'}',
      'place_of_birth': cities[random.nextInt(cities.length)],
      'gender': random.nextBool() ? 'Male' : 'Female',
      'marital_status': ['Single', 'Married', 'Divorced'][random.nextInt(3)],
      'profile_image_type': profileImageType,
      'google_profile_url': googleProfileUrl,
      'created_timestamp': timestamp,
      'test_scenarios': _generateCustomerScenarios(),
    };
  }

  /// Generate astrologer test scenarios
  List<Map<String, dynamic>> _generateAstrologerScenarios() {
    return [
      {
        'scenario': 'Complete Registration',
        'steps': [
          'Open app and navigate to astrologer signup',
          'Fill all required fields including professional details',
          'Upload profile image (50% of users)',
          'Accept terms and conditions',
          'Submit registration',
          'Verify email if required',
          'Wait for admin approval'
        ],
        'expected': 'Successfully registered and account pending approval',
      },
      {
        'scenario': 'Profile Login and Setup',
        'steps': [
          'Login with generated credentials',
          'Complete profile information',
          'Set consultation rates',
          'Configure availability schedule',
          'Upload required documents',
          'Set online status'
        ],
        'expected': 'Profile completed and ready to receive consultations',
      },
      {
        'scenario': 'Handle Consultation Requests',
        'steps': [
          'Receive chat consultation request',
          'Accept consultation',
          'Conduct chat session',
          'End session and submit feedback',
          'Check earnings update'
        ],
        'expected': 'Consultation completed and payment received',
      },
      {
        'scenario': 'Call Session Management',
        'steps': [
          'Receive voice call request',
          'Accept incoming call',
          'Conduct voice consultation',
          'End call session',
          'Verify payment and earnings'
        ],
        'expected': 'Call session completed successfully',
      },
      {
        'scenario': 'Wallet and Earnings',
        'steps': [
          'Check current wallet balance',
          'View transaction history',
          'Request payout/withdrawal',
          'Track earnings over time',
          'Review payment details'
        ],
        'expected': 'Wallet operations working correctly',
      },
      {
        'scenario': 'Profile Management',
        'steps': [
          'Update profile information',
          'Change profile picture',
          'Modify consultation rates',
          'Update availability schedule',
          'Edit skills and languages'
        ],
        'expected': 'Profile updated successfully',
      },
    ];
  }

  /// Generate customer test scenarios
  List<Map<String, dynamic>> _generateCustomerScenarios() {
    return [
      {
        'scenario': 'User Registration',
        'steps': [
          'Open app and choose user signup',
          'Fill personal information',
          'Set profile image (Gmail/App upload/None based on type)',
          'Provide birth details for astrology',
          'Accept terms and complete registration',
          'Verify account if required'
        ],
        'expected': 'Successfully registered and can access app',
      },
      {
        'scenario': 'Profile Login and Setup',
        'steps': [
          'Login with credentials',
          'Complete profile information',
          'Add birth details (time, place)',
          'Set preferences and interests',
          'Explore app features'
        ],
        'expected': 'Profile setup completed',
      },
      {
        'scenario': 'Browse and Select Astrologers',
        'steps': [
          'Browse available astrologers',
          'Filter by skills, languages, rates',
          'View astrologer profiles',
          'Check reviews and ratings',
          'Select astrologer for consultation'
        ],
        'expected': 'Successfully found suitable astrologer',
      },
      {
        'scenario': 'Wallet Management',
        'steps': [
          'Check wallet balance',
          'Add money to wallet',
          'Complete payment process',
          'Verify balance update',
          'View transaction history'
        ],
        'expected': 'Wallet operations successful',
      },
      {
        'scenario': 'Chat Consultation',
        'steps': [
          'Select astrologer for chat',
          'Initiate chat session',
          'Conduct chat consultation',
          'End session',
          'Provide rating and review'
        ],
        'expected': 'Chat consultation completed successfully',
      },
      {
        'scenario': 'Voice Call Consultation',
        'steps': [
          'Select astrologer for call',
          'Initiate voice call',
          'Conduct voice consultation',
          'End call',
          'Submit feedback and rating'
        ],
        'expected': 'Voice consultation completed successfully',
      },
      {
        'scenario': 'History and Reviews',
        'steps': [
          'View consultation history',
          'Check past sessions details',
          'Review submitted ratings',
          'Manage favorite astrologers',
          'Check spending history'
        ],
        'expected': 'History and review features working',
      },
    ];
  }

  /// Generate comprehensive test scenarios
  Future<void> _generateTestScenarios() async {
    _log('📋 Generating comprehensive test scenarios...');
    
    final scenarios = <Map<String, dynamic>>[];
    
    // Cross-user interaction scenarios
    scenarios.addAll([
      {
        'title': 'Complete User Journey - Astrologer Perspective',
        'description': 'Full workflow from astrologer registration to earning money',
        'participants': ['Astrologer 1'],
        'steps': [
          'Register as astrologer with profile image',
          'Complete professional profile',
          'Get admin approval',
          'Login and set online status',
          'Configure rates and availability',
          'Receive first consultation request',
          'Complete consultation successfully',
          'Check earnings and wallet',
          'Manage profile and settings',
        ],
        'success_criteria': [
          'Registration successful',
          'Profile approved by admin',
          'Can receive consultations',
          'Earnings reflected correctly',
          'Profile management working',
        ]
      },
      {
        'title': 'Complete User Journey - Customer Perspective',
        'description': 'Full workflow from customer registration to consultation',
        'participants': ['Customer 1', 'Astrologer 2'],
        'steps': [
          'Register as customer (with Gmail profile)',
          'Complete personal profile',
          'Add money to wallet',
          'Browse and select astrologer',
          'Initiate chat consultation',
          'Complete consultation session',
          'Provide rating and review',
          'Check consultation history',
        ],
        'success_criteria': [
          'Registration with Gmail profile successful',
          'Wallet operations working',
          'Can find and contact astrologers',
          'Consultation completed successfully',
          'History tracking working',
        ]
      },
      {
        'title': 'Multi-User Interaction Test',
        'description': 'Test interactions between multiple users',
        'participants': ['5 Customers', '3 Astrologers'],
        'steps': [
          'All users register and complete profiles',
          'Customers add money to wallets',
          'Astrologers go online',
          'Multiple simultaneous chat sessions',
          'Multiple simultaneous call sessions',
          'Cross-rating and reviews',
          'Check all earnings and transactions',
        ],
        'success_criteria': [
          'All registrations successful',
          'Simultaneous sessions work',
          'No payment conflicts',
          'All earnings calculated correctly',
        ]
      },
      {
        'title': 'Profile Image Testing',
        'description': 'Test different profile image scenarios',
        'participants': ['Various users'],
        'steps': [
          'Test app-based image uploads',
          'Test Gmail profile image integration',
          'Test profile image updates',
          'Test image display across app',
          'Test image optimization',
        ],
        'success_criteria': [
          'App uploads work correctly',
          'Gmail profiles display properly',
          'Images optimized correctly',
          'No broken image links',
        ]
      },
    ]);
    
    // Save scenarios
    final scenariosFile = File('./test_scenarios.json');
    await scenariosFile.writeAsString(
      const JsonEncoder.withIndent('  ').convert(scenarios)
    );
    
    _log('✅ Test scenarios generated and saved');
  }

  /// Save all test data to files
  Future<void> _saveTestDataToFiles() async {
    _log('💾 Saving test data to files...');
    
    // Create test data directory
    final testDir = Directory('./test_data');
    if (!testDir.existsSync()) {
      testDir.createSync(recursive: true);
    }
    
    // Save astrologers data
    final astrologersFile = File('./test_data/astrologers.json');
    await astrologersFile.writeAsString(
      const JsonEncoder.withIndent('  ').convert(testAstrologers)
    );
    
    // Save customers data
    final customersFile = File('./test_data/customers.json');
    await customersFile.writeAsString(
      const JsonEncoder.withIndent('  ').convert(testCustomers)
    );
    
    // Create CSV files for easy viewing
    await _createCSVFiles();
    
    // Create test execution script
    await _createTestExecutionScript();
    
    // Create manual testing checklist
    await _createManualTestingChecklist();
    
    _log('✅ All test data files created');
  }

  /// Create CSV files for easy viewing
  Future<void> _createCSVFiles() async {
    // Astrologers CSV
    final astrologersCSV = StringBuffer();
    astrologersCSV.writeln('ID,Name,Email,Phone,City,Skills,Experience,Call Rate,Chat Rate,Video Rate,Profile Image Type');
    
    for (final astrologer in testAstrologers) {
      astrologersCSV.writeln(
        '${astrologer['id']},'
        '"${astrologer['full_name']}",'
        '${astrologer['email']},'
        '${astrologer['phone']},'
        '${astrologer['city']},'
        '"${(astrologer['skills'] as List).join('; ')}",'
        '${astrologer['experience_years']},'
        '${astrologer['call_rate']},'
        '${astrologer['chat_rate']},'
        '${astrologer['video_rate']},'
        '${astrologer['profile_image_type']}'
      );
    }
    
    await File('./test_data/astrologers.csv').writeAsString(astrologersCSV.toString());
    
    // Customers CSV
    final customersCSV = StringBuffer();
    customersCSV.writeln('ID,Name,Email,Phone,City,Gender,Marital Status,Profile Image Type,Has Gmail Profile');
    
    for (final customer in testCustomers) {
      customersCSV.writeln(
        '${customer['id']},'
        '"${customer['full_name']}",'
        '${customer['email']},'
        '${customer['phone']},'
        '${customer['city']},'
        '${customer['gender']},'
        '${customer['marital_status']},'
        '${customer['profile_image_type']},'
        '${customer['google_profile_url'] != null ? 'Yes' : 'No'}'
      );
    }
    
    await File('./test_data/customers.csv').writeAsString(customersCSV.toString());
  }

  /// Create test execution script
  Future<void> _createTestExecutionScript() async {
    var script = '''#!/bin/bash

# TrueAstroTalk Mobile App E2E Test Execution Script
# Generated: ${DateTime.now().toIso8601String()}

echo "🚀 Starting TrueAstroTalk E2E Testing"
echo "======================================"

# Test Configuration
ADMIN_API_URL="http://localhost:4000/api/admin"
USER_API_URL="http://localhost:4000/api"
ASTROLOGER_COUNT=${astrologerCount}
CUSTOMER_COUNT=${customerCount}

echo "📊 Test Configuration:"
echo "- Astrologers to test: \$ASTROLOGER_COUNT"  
echo "- Customers to test: \$CUSTOMER_COUNT"
echo "- Admin API URL: \$ADMIN_API_URL"
echo "- User API URL: \$USER_API_URL"
echo ""

# Function to test user registration
test_user_registration() {
    local user_type=\$1
    local user_data=\$2
    local test_id=\$3
    
    echo "📝 Testing \$user_type registration (ID: \$test_id)..."
    
    # Make registration API call
    response=\$(curl -s -X POST \\
        -H "Content-Type: application/json" \\
        -d "\$user_data" \\
        "\$USER_API_URL/auth/register")
    
    # Check if successful
    if echo "\$response" | grep -q '"success":true'; then
        echo "✅ \$user_type \$test_id registration successful"
        return 0
    else
        echo "❌ \$user_type \$test_id registration failed"
        echo "Response: \$response"
        return 1
    fi
}

# Function to test user login
test_user_login() {
    local email=\$1
    local password=\$2
    local user_type=\$3
    
    echo "🔐 Testing login for \$email..."
    
    response=\$(curl -s -X POST \\
        -H "Content-Type: application/json" \\
        -d "{\\"email\\":\\"\$email\\",\\"password\\":\\"\$password\\"}" \\
        "\$USER_API_URL/auth/login")
    
    if echo "\$response" | grep -q '"success":true'; then
        echo "✅ Login successful for \$email"
        # Extract token for further tests
        token=\$(echo "\$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo "🎫 Token: \$token"
        return 0
    else
        echo "❌ Login failed for \$email"
        return 1
    fi
}

echo "🎯 Phase 1: Testing User Registrations"
echo "======================================"

# Test astrologer registrations
echo "Testing ${astrologerCount} astrologers..."
astrologer_success=0
''';

    // Add astrologer test calls
    for (final astrologer in testAstrologers) {
      final userData = json.encode({
        'user_type': 'astrologer',
        'full_name': astrologer['full_name'],
        'email': astrologer['email'],
        'phone': astrologer['phone'],
        'password': astrologer['password'],
        'city': astrologer['city'],
        'state': astrologer['state'],
        'country': astrologer['country'],
        'bio': astrologer['bio'],
        'skills': astrologer['skills'],
        'languages': astrologer['languages'],
        'call_rate': astrologer['call_rate'],
        'chat_rate': astrologer['chat_rate'],
        'video_rate': astrologer['video_rate'],
      });

      script += '''
if test_user_registration "Astrologer" '${userData.replaceAll("'", "\\'")}' "${astrologer['id']}"; then
    ((astrologer_success++))
fi
''';
    }

    script += '''

echo "✅ Astrologer registrations completed: \$astrologer_success/${astrologerCount}"

# Test customer registrations  
echo "Testing ${customerCount} customers..."
customer_success=0
''';

    // Add customer test calls
    for (final customer in testCustomers) {
      final userData = json.encode({
        'user_type': 'user',
        'full_name': customer['full_name'],
        'email': customer['email'],
        'phone': customer['phone'],
        'password': customer['password'],
        'city': customer['city'],
        'state': customer['state'],
        'country': customer['country'],
        'date_of_birth': customer['date_of_birth'],
        'time_of_birth': customer['time_of_birth'],
        'place_of_birth': customer['place_of_birth'],
        'gender': customer['gender'],
        'marital_status': customer['marital_status'],
      });

      script += '''
if test_user_registration "Customer" '${userData.replaceAll("'", "\\'")}' "${customer['id']}"; then
    ((customer_success++))
fi
''';
    }

    script += '''

echo "✅ Customer registrations completed: \$customer_success/${customerCount}"

echo ""
echo "🎯 Phase 2: Testing User Logins"
echo "==============================="
''';

    // Add login tests
    for (final astrologer in testAstrologers) {
      script += '''
test_user_login "${astrologer['email']}" "${astrologer['password']}" "astrologer"
''';
    }

    for (final customer in testCustomers) {
      script += '''
test_user_login "${customer['email']}" "${customer['password']}" "customer"  
''';
    }

    script += '''

echo ""
echo "🎯 Phase 3: Manual Testing Instructions"
echo "======================================="
echo "1. Run the Flutter app on device/emulator"
echo "2. Test the generated user accounts manually"
echo "3. Follow the test scenarios in test_scenarios.json"
echo "4. Test profile image functionality:"
echo "   - App upload: Use accounts with 'app_upload' type"
echo "   - Gmail profile: Use accounts with 'gmail_profile' type"
echo "5. Test cross-user interactions (chat, calls, payments)"
echo ""
echo "📊 Test Summary:"
echo "================"
echo "- Astrologer Success Rate: \$astrologer_success/${astrologerCount}"
echo "- Customer Success Rate: \$customer_success/${customerCount}"
echo "- Total Users Created: \$((\$astrologer_success + \$customer_success))/${astrologerCount + customerCount}"
echo ""
echo "🎉 E2E Testing Script Complete!"

# Check if server is running
if ! curl -s "\$USER_API_URL/health" > /dev/null 2>&1; then
    echo ""
    echo "⚠️  WARNING: Server not responding at \$USER_API_URL"
    echo "   Please ensure the backend server is running before executing tests"
fi
''';

    await File('./test_data/run_tests.sh').writeAsString(script);
    
    // Make executable
    await Process.run('chmod', ['+x', './test_data/run_tests.sh']);
  }

  /// Create manual testing checklist
  Future<void> _createManualTestingChecklist() async {
    var checklist = '''
# TrueAstroTalk Mobile App - Manual Testing Checklist

## Pre-Testing Setup
- [ ] Backend server running at http://localhost:4000
- [ ] Mobile app installed on device/emulator
- [ ] Test data files generated (${testAstrologers.length} astrologers, ${testCustomers.length} customers)

## Phase 1: Astrologer Testing (${testAstrologers.length} users)

### For each astrologer account:
''';

    for (int i = 0; i < testAstrologers.length; i++) {
      final astrologer = testAstrologers[i];
      checklist += '''

#### Astrologer ${i + 1}: ${astrologer['full_name']}
**Credentials:** ${astrologer['email']} / ${astrologer['password']}
**Profile Image:** ${astrologer['profile_image_type']}

##### Registration & Setup
- [ ] Complete astrologer signup process
- [ ] ${astrologer['profile_image_type'] == 'app_upload' ? 'Upload profile image from gallery/camera' : 'Skip profile image upload'}
- [ ] Fill professional details (skills: ${(astrologer['skills'] as List).join(', ')})
- [ ] Set consultation rates (Call: ₹${astrologer['call_rate']}, Chat: ₹${astrologer['chat_rate']})
- [ ] Verify email registration if required
- [ ] Wait for admin approval (check admin panel)

##### Login & Profile Management  
- [ ] Login with generated credentials
- [ ] Complete profile information
- [ ] Update availability schedule
- [ ] Set online status
- [ ] Edit profile details

##### Consultation Handling
- [ ] Receive chat consultation request
- [ ] Accept and conduct chat session
- [ ] End session properly
- [ ] Check earnings update
- [ ] Receive voice call request
- [ ] Accept and conduct call session
- [ ] End call properly

##### Wallet & Earnings
- [ ] Check wallet balance
- [ ] View transaction history
- [ ] Verify consultation earnings
- [ ] Test withdrawal/payout process

##### Profile Image Testing
- [ ] ${astrologer['profile_image_type'] == 'app_upload' ? 'Verify uploaded image displays correctly' : 'Verify default avatar shows'}
- [ ] Update profile image
- [ ] Check image in astrologer listings
''';
    }

    checklist += '''

## Phase 2: Customer Testing (${testCustomers.length} users)

### For each customer account:
''';

    for (int i = 0; i < testCustomers.length; i++) {
      final customer = testCustomers[i];
      checklist += '''

#### Customer ${i + 1}: ${customer['full_name']}
**Credentials:** ${customer['email']} / ${customer['password']}
**Profile Image:** ${customer['profile_image_type']}
${customer['google_profile_url'] != null ? '**Gmail Profile:** ${customer['google_profile_url']}' : ''}

##### Registration & Setup
- [ ] Complete customer signup process
- [ ] ${customer['profile_image_type'] == 'gmail_profile' ? 'Login with Gmail and verify profile image from Google' : customer['profile_image_type'] == 'app_upload' ? 'Upload profile image from device' : 'Complete registration without profile image'}
- [ ] Fill birth details (DOB: ${customer['date_of_birth']}, Time: ${customer['time_of_birth']})
- [ ] Complete profile information

##### Login & Profile Management
- [ ] Login with generated credentials  
- [ ] ${customer['profile_image_type'] == 'gmail_profile' ? 'Verify Gmail profile image displays correctly' : 'Verify profile image setup'}
- [ ] Update personal information
- [ ] Manage account settings

##### Astrologer Interaction
- [ ] Browse available astrologers
- [ ] Filter astrologers by skills/language
- [ ] View astrologer detailed profiles
- [ ] Check astrologer reviews and ratings

##### Wallet Management
- [ ] Check initial wallet balance
- [ ] Add money to wallet (₹500 test amount)
- [ ] Verify payment process
- [ ] Check transaction history

##### Consultation Experience
- [ ] Select astrologer for chat consultation
- [ ] Initiate chat session
- [ ] Conduct consultation
- [ ] End session and provide rating
- [ ] Select astrologer for voice call
- [ ] Initiate call session
- [ ] Complete call consultation
- [ ] Submit feedback and review

##### History & Reviews
- [ ] View consultation history
- [ ] Check spending history
- [ ] Review submitted ratings
- [ ] Manage favorite astrologers

##### Profile Image Testing
- [ ] ${customer['profile_image_type'] == 'gmail_profile' ? 'Verify Gmail profile image loads and displays correctly' : customer['profile_image_type'] == 'app_upload' ? 'Verify uploaded image displays correctly' : 'Verify default avatar shows'}
- [ ] Update profile image
- [ ] Test image persistence across app sections
''';
    }

    checklist += '''

## Phase 3: Cross-User Testing

### Multi-User Scenarios
- [ ] Test simultaneous chat sessions (3+ concurrent)
- [ ] Test simultaneous call sessions (2+ concurrent) 
- [ ] Verify no payment conflicts during concurrent sessions
- [ ] Test customer switching between astrologers
- [ ] Test astrologer handling multiple customers

### Profile Image Comprehensive Testing
- [ ] Gmail profile images load correctly in all app sections
- [ ] App uploaded images display properly in listings
- [ ] Image updates reflect across the entire app
- [ ] No broken image links or loading issues
- [ ] Image optimization working correctly

### Payment & Wallet Testing
- [ ] Test wallet deductions during consultations
- [ ] Verify astrologer earnings calculations
- [ ] Test refund scenarios
- [ ] Check transaction history accuracy
- [ ] Test edge cases (insufficient balance, payment failures)

### Admin Panel Integration
- [ ] Verify new astrologer registrations appear in admin panel
- [ ] Test astrologer approval process
- [ ] Check user management features
- [ ] Verify consultation session logs
- [ ] Test media management for uploaded images

## Phase 4: Edge Cases & Error Handling

### Registration Edge Cases
- [ ] Duplicate email registration attempts
- [ ] Invalid phone number formats
- [ ] Weak password handling
- [ ] Large profile image uploads
- [ ] Invalid Gmail profile URLs

### Session Management
- [ ] Network interruption during consultations
- [ ] App backgrounding during active sessions
- [ ] Multiple device login attempts
- [ ] Session timeout handling

### Payment Edge Cases  
- [ ] Insufficient wallet balance scenarios
- [ ] Payment gateway failures
- [ ] Concurrent payment attempts
- [ ] Refund processing

## Testing Summary

### Success Metrics
- [ ] ${testAstrologers.length}/${testAstrologers.length} astrologers can register successfully
- [ ] ${testCustomers.length}/${testCustomers.length} customers can register successfully  
- [ ] All profile image types (Gmail, app upload, none) work correctly
- [ ] Chat and call consultations complete successfully
- [ ] Payment and wallet operations function properly
- [ ] No critical bugs or app crashes
- [ ] Performance acceptable under concurrent load

### Generated Test Data Files
- `./test_data/astrologers.json` - Complete astrologer test data
- `./test_data/customers.json` - Complete customer test data
- `./test_data/astrologers.csv` - Astrologer data in CSV format  
- `./test_data/customers.csv` - Customer data in CSV format
- `./test_data/run_tests.sh` - Automated test execution script
- `./test_scenarios.json` - Detailed test scenarios

### Notes
- Test on both Android and iOS if possible
- Monitor server logs during testing
- Document any issues found during testing
- Verify database consistency after testing
- Check memory usage and performance
''';

    await File('./test_data/manual_testing_checklist.md').writeAsString(checklist);
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
    return skills.take(count).toList().cast<String>();
  }

  List<String> _getRandomLanguages() {
    final count = 1 + random.nextInt(3); // 1-3 languages
    final langs = List.from(languages)..shuffle();
    return langs.take(count).toList().cast<String>();
  }

  void _log(String message) {
    final timestamp = DateTime.now().toIso8601String().split('T')[1].split('.')[0];
    final logMessage = '[$timestamp] $message';
    print(logMessage);
    testLogs.add(message);
  }
}

/// Main execution
void main() async {
  final tester = SimpleE2ETest();
  
  try {
    await tester.generateTestData();
    
    print('\n🎉 E2E Test Data Generation Complete!');
    print('📁 Generated files:');
    print('  - ./test_data/astrologers.json (${tester.testAstrologers.length} astrologers)');  
    print('  - ./test_data/customers.json (${tester.testCustomers.length} customers)');
    print('  - ./test_data/astrologers.csv');
    print('  - ./test_data/customers.csv');
    print('  - ./test_data/run_tests.sh (automated test script)');
    print('  - ./test_data/manual_testing_checklist.md');
    print('  - ./test_scenarios.json');
    print('\n🚀 Next Steps:');
    print('1. Run: chmod +x ./test_data/run_tests.sh');
    print('2. Execute: ./test_data/run_tests.sh');
    print('3. Follow manual testing checklist');
    print('4. Test profile images (Gmail + App uploads)');
    
  } catch (e) {
    print('❌ Test data generation failed: $e');
    exit(1);
  }
}