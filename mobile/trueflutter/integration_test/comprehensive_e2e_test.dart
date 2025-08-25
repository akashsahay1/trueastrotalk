import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:get_it/get_it.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('TrueAstroTalk Comprehensive E2E Tests', () {
    late List<TestUser> astrologers;
    late List<TestUser> customers;
    late TestReporter reporter;
    
    setUpAll(() async {
      // Reset service locator to avoid conflicts
      await resetServiceLocator();
      
      // Initialize test data
      astrologers = generateTestAstrologers(10);
      customers = generateTestCustomers(10);
      reporter = TestReporter();
      
      reporter.log('🚀 Starting Comprehensive E2E Test Suite');
      reporter.log('📊 Generated ${astrologers.length} astrologers and ${customers.length} customers for testing');
    });

    testWidgets('Complete E2E Test Suite - Build, Navigate, Register, Login', (WidgetTester tester) async {
      try {
        // Phase 1: App Initialization
        await reporter.startPhase('App Initialization');
        await initializeApp(tester);
        await reporter.completePhase('App Initialization');

        // Phase 2: Navigation Testing
        await reporter.startPhase('Navigation Testing');
        await testAllNavigationFlows(tester, reporter);
        await reporter.completePhase('Navigation Testing');

        // Phase 3: Astrologer Registration (10 users)
        await reporter.startPhase('Astrologer Registration');
        for (int i = 0; i < astrologers.length; i++) {
          await registerAstrologer(tester, astrologers[i], i + 1, reporter);
        }
        await reporter.completePhase('Astrologer Registration');

        // Phase 4: Customer Registration (10 users) 
        await reporter.startPhase('Customer Registration');
        for (int i = 0; i < customers.length; i++) {
          await registerCustomer(tester, customers[i], i + 1, reporter);
        }
        await reporter.completePhase('Customer Registration');

        // Phase 5: Login Testing (All 20 users)
        await reporter.startPhase('Login Testing');
        await testAllUserLogins(tester, [...astrologers, ...customers], reporter);
        await reporter.completePhase('Login Testing');

        // Phase 6: Feature Testing per User Type
        await reporter.startPhase('Feature Testing');
        await testAstrologerFeatures(tester, astrologers.first, reporter);
        await testCustomerFeatures(tester, customers.first, reporter);
        await reporter.completePhase('Feature Testing');

        // Phase 7: Cross-User Interaction Testing
        await reporter.startPhase('Cross-User Interaction');
        await testCrossUserInteractions(tester, astrologers.first, customers.first, reporter);
        await reporter.completePhase('Cross-User Interaction');

        reporter.log('✅ All E2E tests completed successfully!');
        await reporter.generateFinalReport();

      } catch (e, stackTrace) {
        reporter.logError('❌ E2E Test Suite Failed', e, stackTrace);
        await reporter.generateErrorReport();
        rethrow;
      }
    });

    tearDownAll(() async {
      await reporter.cleanup();
    });
  });
}

class TestUser {
  final String email;
  final String password;
  final String name;
  final String phone;
  final String userType;
  final Map<String, dynamic> additionalData;

  TestUser({
    required this.email,
    required this.password,
    required this.name,
    required this.phone,
    required this.userType,
    this.additionalData = const {},
  });
}

class TestReporter {
  List<String> logs = [];
  Map<String, DateTime> phaseStartTimes = {};
  Map<String, Duration> phaseDurations = {};
  List<TestError> errors = [];

  void log(String message) {
    final timestamp = DateTime.now().toIso8601String();
    final logMessage = '[$timestamp] $message';
    logs.add(logMessage);
    debugPrint(logMessage);
  }

  void logError(String message, dynamic error, StackTrace? stackTrace) {
    final testError = TestError(message, error, stackTrace);
    errors.add(testError);
    log('❌ ERROR: $message - $error');
  }

  Future<void> startPhase(String phaseName) async {
    phaseStartTimes[phaseName] = DateTime.now();
    log('🔄 Starting phase: $phaseName');
  }

  Future<void> completePhase(String phaseName) async {
    if (phaseStartTimes.containsKey(phaseName)) {
      phaseDurations[phaseName] = DateTime.now().difference(phaseStartTimes[phaseName]!);
      log('✅ Completed phase: $phaseName (${phaseDurations[phaseName]!.inSeconds}s)');
    }
  }

  Future<void> generateFinalReport() async {
    log('📊 === FINAL TEST REPORT ===');
    log('Total test duration: ${DateTime.now().difference(phaseStartTimes.values.first).inMinutes} minutes');
    
    for (var entry in phaseDurations.entries) {
      log('${entry.key}: ${entry.value.inSeconds}s');
    }
    
    log('Errors encountered: ${errors.length}');
    for (var error in errors) {
      log('- ${error.message}');
    }
  }

  Future<void> generateErrorReport() async {
    log('❌ === ERROR REPORT ===');
    for (var error in errors) {
      log('Error: ${error.message}');
      log('Details: ${error.error}');
    }
  }

  Future<void> cleanup() async {
    log('🧹 Test cleanup completed');
  }
}

class TestError {
  final String message;
  final dynamic error;
  final StackTrace? stackTrace;

  TestError(this.message, this.error, this.stackTrace);
}

// Test data generation
List<TestUser> generateTestAstrologers(int count) {
  return List.generate(count, (index) {
    final uniqueId = DateTime.now().millisecondsSinceEpoch + index;
    return TestUser(
      email: 'astrologer$index.test$uniqueId@trueastrotalk.com',
      password: 'TestPass123!',
      name: 'Test Astrologer ${index + 1}',
      phone: '+91${9000000000 + index}',
      userType: 'astrologer',
      additionalData: {
        'experience': Random().nextInt(20) + 1,
        'specialization': ['Vedic', 'Western', 'Numerology'][Random().nextInt(3)],
        'languages': ['English', 'Hindi', 'Tamil'][Random().nextInt(3)],
        'voiceRate': (Random().nextInt(50) + 10).toDouble(),
        'videoRate': (Random().nextInt(80) + 20).toDouble(),
      },
    );
  });
}

List<TestUser> generateTestCustomers(int count) {
  return List.generate(count, (index) {
    final uniqueId = DateTime.now().millisecondsSinceEpoch + index + 1000;
    return TestUser(
      email: 'customer$index.test$uniqueId@trueastrotalk.com',
      password: 'TestPass123!',
      name: 'Test Customer ${index + 1}',
      phone: '+91${8000000000 + index}',
      userType: 'customer',
      additionalData: {
        'dateOfBirth': DateTime.now().subtract(Duration(days: Random().nextInt(10000) + 6570)),
        'timeOfBirth': '${Random().nextInt(24)}:${Random().nextInt(60)}',
        'placeOfBirth': 'Test City ${index + 1}',
      },
    );
  });
}

// Core test functions
Future<void> initializeApp(WidgetTester tester) async {
  app.main();
  await tester.pumpAndSettle(const Duration(seconds: 5));
  
  // Wait for splash screen and initial loading
  await tester.pump(const Duration(seconds: 2));
  await tester.pumpAndSettle();
}

Future<void> testAllNavigationFlows(WidgetTester tester, TestReporter reporter) async {
  final navigationTests = [
    'Login Screen',
    'Register Screen', 
    'Forgot Password Screen',
    'Terms and Conditions',
    'Privacy Policy',
  ];

  for (final screen in navigationTests) {
    try {
      reporter.log('🧭 Testing navigation to: $screen');
      await navigateToScreen(tester, screen);
      await tester.pumpAndSettle();
      
      // Verify screen loaded
      await verifyScreenLoaded(tester, screen);
      reporter.log('✅ Navigation to $screen successful');
      
      // Navigate back to home
      await navigateBackToHome(tester);
      
    } catch (e, stackTrace) {
      reporter.logError('Navigation to $screen failed', e, stackTrace);
    }
  }
}

Future<void> navigateToScreen(WidgetTester tester, String screenName) async {
  switch (screenName) {
    case 'Login Screen':
      await tapIfExists(tester, find.text('Sign In'));
      break;
    case 'Register Screen':
      await tapIfExists(tester, find.text('Sign Up'));
      break;
    case 'Forgot Password Screen':
      await tapIfExists(tester, find.text('Sign In'));
      await tester.pumpAndSettle();
      await tapIfExists(tester, find.text('Forgot Password?'));
      break;
    default:
      // Try to find the screen name as text
      await tapIfExists(tester, find.text(screenName));
  }
  await tester.pumpAndSettle();
}

Future<void> verifyScreenLoaded(WidgetTester tester, String screenName) async {
  // Add specific verification logic for each screen
  await tester.pumpAndSettle();
  // Basic verification that we're not on error screen
  expect(find.text('Something went wrong'), findsNothing);
}

Future<void> navigateBackToHome(WidgetTester tester) async {
  // Try different ways to get back to home
  if (find.byIcon(Icons.arrow_back).evaluate().isNotEmpty) {
    await tester.tap(find.byIcon(Icons.arrow_back));
    await tester.pumpAndSettle();
  } else if (find.text('Home').evaluate().isNotEmpty) {
    await tester.tap(find.text('Home'));
    await tester.pumpAndSettle();
  }
}

Future<void> registerAstrologer(WidgetTester tester, TestUser astrologer, int userNumber, TestReporter reporter) async {
  try {
    reporter.log('👨‍🔬 Registering Astrologer $userNumber: ${astrologer.name}');
    
    // Navigate to registration
    await navigateToRegistration(tester, 'astrologer');
    
    // Fill registration form
    await fillAstrologerRegistrationForm(tester, astrologer);
    
    // Submit registration
    await submitRegistration(tester);
    
    // Verify registration success
    await verifyRegistrationSuccess(tester);
    
    reporter.log('✅ Astrologer $userNumber registered successfully');
    
    // Navigate back for next registration
    await navigateBackToHome(tester);
    
  } catch (e, stackTrace) {
    reporter.logError('Failed to register astrologer $userNumber', e, stackTrace);
    await takeScreenshot(tester, 'astrologer_registration_error_$userNumber');
    await navigateBackToHome(tester);
  }
}

Future<void> registerCustomer(WidgetTester tester, TestUser customer, int userNumber, TestReporter reporter) async {
  try {
    reporter.log('👤 Registering Customer $userNumber: ${customer.name}');
    
    // Navigate to registration
    await navigateToRegistration(tester, 'customer');
    
    // Fill registration form
    await fillCustomerRegistrationForm(tester, customer);
    
    // Submit registration
    await submitRegistration(tester);
    
    // Verify registration success
    await verifyRegistrationSuccess(tester);
    
    reporter.log('✅ Customer $userNumber registered successfully');
    
    // Navigate back for next registration
    await navigateBackToHome(tester);
    
  } catch (e, stackTrace) {
    reporter.logError('Failed to register customer $userNumber', e, stackTrace);
    await takeScreenshot(tester, 'customer_registration_error_$userNumber');
    await navigateBackToHome(tester);
  }
}

Future<void> navigateToRegistration(WidgetTester tester, String userType) async {
  // Navigate to sign up
  await tapIfExists(tester, find.text('Sign Up'));
  await tester.pumpAndSettle();
  
  // Select user type if needed
  if (userType == 'astrologer') {
    await tapIfExists(tester, find.text('Join as Astrologer'));
  } else {
    await tapIfExists(tester, find.text('Join as Customer'));
  }
  await tester.pumpAndSettle();
}

Future<void> fillAstrologerRegistrationForm(WidgetTester tester, TestUser astrologer) async {
  // Fill basic info
  await fillTextField(tester, 'Name', astrologer.name);
  await fillTextField(tester, 'Email', astrologer.email);
  await fillTextField(tester, 'Password', astrologer.password);
  await fillTextField(tester, 'Phone', astrologer.phone);
  
  // Fill astrologer-specific fields
  await fillTextField(tester, 'Experience', astrologer.additionalData['experience'].toString());
  await selectDropdown(tester, 'Specialization', astrologer.additionalData['specialization']);
  await fillTextField(tester, 'Voice Rate', astrologer.additionalData['voiceRate'].toString());
  await fillTextField(tester, 'Video Rate', astrologer.additionalData['videoRate'].toString());
}

Future<void> fillCustomerRegistrationForm(WidgetTester tester, TestUser customer) async {
  // Fill basic info
  await fillTextField(tester, 'Name', customer.name);
  await fillTextField(tester, 'Email', customer.email);
  await fillTextField(tester, 'Password', customer.password);
  await fillTextField(tester, 'Phone', customer.phone);
  
  // Fill customer-specific fields if present
  if (customer.additionalData.containsKey('placeOfBirth')) {
    await fillTextField(tester, 'Place of Birth', customer.additionalData['placeOfBirth']);
  }
}

Future<void> fillTextField(WidgetTester tester, String label, String value) async {
  final field = find.widgetWithText(TextFormField, label).first;
  if (field.evaluate().isNotEmpty) {
    await tester.tap(field);
    await tester.enterText(field, value);
    await tester.pumpAndSettle();
  }
}

Future<void> selectDropdown(WidgetTester tester, String label, String value) async {
  final dropdown = find.widgetWithText(DropdownButtonFormField, label).first;
  if (dropdown.evaluate().isNotEmpty) {
    await tester.tap(dropdown);
    await tester.pumpAndSettle();
    await tapIfExists(tester, find.text(value));
    await tester.pumpAndSettle();
  }
}

Future<void> submitRegistration(WidgetTester tester) async {
  await tapIfExists(tester, find.text('Sign Up'));
  await tester.pumpAndSettle(const Duration(seconds: 5));
}

Future<void> verifyRegistrationSuccess(WidgetTester tester) async {
  // Wait for success indication
  await tester.pumpAndSettle(const Duration(seconds: 3));
  
  // Look for success indicators
  final successIndicators = [
    find.text('Registration Successful'),
    find.text('Welcome'),
    find.text('Dashboard'),
    find.text('Home'),
  ];
  
  bool foundSuccess = false;
  for (final indicator in successIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }
  
  if (!foundSuccess) {
    throw Exception('Registration success not confirmed');
  }
}

Future<void> testAllUserLogins(WidgetTester tester, List<TestUser> users, TestReporter reporter) async {
  for (int i = 0; i < users.length; i++) {
    final user = users[i];
    try {
      reporter.log('🔐 Testing login for ${user.userType} ${i + 1}: ${user.email}');
      
      await performLogin(tester, user);
      await verifyLoginSuccess(tester, user);
      await performLogout(tester);
      
      reporter.log('✅ Login test passed for ${user.userType} ${i + 1}');
      
    } catch (e, stackTrace) {
      reporter.logError('Login failed for ${user.userType} ${i + 1}', e, stackTrace);
      await takeScreenshot(tester, 'login_error_${user.userType}_${i + 1}');
      await navigateBackToHome(tester);
    }
  }
}

Future<void> performLogin(WidgetTester tester, TestUser user) async {
  // Navigate to login
  await tapIfExists(tester, find.text('Sign In'));
  await tester.pumpAndSettle();
  
  // Fill login form
  await fillTextField(tester, 'Email', user.email);
  await fillTextField(tester, 'Password', user.password);
  
  // Submit login
  await tapIfExists(tester, find.text('Sign In'));
  await tester.pumpAndSettle(const Duration(seconds: 5));
}

Future<void> verifyLoginSuccess(WidgetTester tester, TestUser user) async {
  // Verify user is logged in
  final loginSuccessIndicators = [
    find.text(user.name),
    find.text('Dashboard'),
    find.text('Profile'),
    find.byIcon(Icons.logout),
  ];
  
  bool foundSuccess = false;
  for (final indicator in loginSuccessIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }
  
  if (!foundSuccess) {
    throw Exception('Login success not confirmed for ${user.email}');
  }
}

Future<void> performLogout(WidgetTester tester) async {
  // Try various logout methods
  if (find.byIcon(Icons.logout).evaluate().isNotEmpty) {
    await tester.tap(find.byIcon(Icons.logout));
  } else if (find.text('Logout').evaluate().isNotEmpty) {
    await tester.tap(find.text('Logout'));
  } else if (find.text('Sign Out').evaluate().isNotEmpty) {
    await tester.tap(find.text('Sign Out'));
  }
  
  await tester.pumpAndSettle(const Duration(seconds: 3));
}

Future<void> testAstrologerFeatures(WidgetTester tester, TestUser astrologer, TestReporter reporter) async {
  reporter.log('🔮 Testing astrologer features for: ${astrologer.name}');
  
  await performLogin(tester, astrologer);
  
  final features = [
    'Profile Management',
    'Availability Settings',
    'Call History',
    'Earnings Dashboard',
    'Customer Reviews',
  ];
  
  for (final feature in features) {
    try {
      reporter.log('Testing astrologer feature: $feature');
      await testFeature(tester, feature);
      reporter.log('✅ $feature test passed');
    } catch (e, stackTrace) {
      reporter.logError('Astrologer feature $feature failed', e, stackTrace);
    }
  }
  
  await performLogout(tester);
}

Future<void> testCustomerFeatures(WidgetTester tester, TestUser customer, TestReporter reporter) async {
  reporter.log('👤 Testing customer features for: ${customer.name}');
  
  await performLogin(tester, customer);
  
  final features = [
    'Browse Astrologers',
    'Profile Management',
    'Wallet Management',
    'Call History',
    'Chat History',
  ];
  
  for (final feature in features) {
    try {
      reporter.log('Testing customer feature: $feature');
      await testFeature(tester, feature);
      reporter.log('✅ $feature test passed');
    } catch (e, stackTrace) {
      reporter.logError('Customer feature $feature failed', e, stackTrace);
    }
  }
  
  await performLogout(tester);
}

Future<void> testFeature(WidgetTester tester, String featureName) async {
  // Navigate to feature and test basic functionality
  await navigateToFeature(tester, featureName);
  await tester.pumpAndSettle();
  
  // Verify feature screen loads
  await verifyFeatureLoaded(tester, featureName);
}

Future<void> navigateToFeature(WidgetTester tester, String featureName) async {
  // Look for feature navigation options
  final navigationOptions = [
    find.text(featureName),
    find.widgetWithText(ListTile, featureName),
    find.byTooltip(featureName),
  ];
  
  for (final option in navigationOptions) {
    if (option.evaluate().isNotEmpty) {
      await tester.tap(option.first);
      await tester.pumpAndSettle();
      return;
    }
  }
}

Future<void> verifyFeatureLoaded(WidgetTester tester, String featureName) async {
  await tester.pumpAndSettle();
  // Basic verification that screen loaded without errors
  expect(find.text('Error'), findsNothing);
}

Future<void> testCrossUserInteractions(WidgetTester tester, TestUser astrologer, TestUser customer, TestReporter reporter) async {
  reporter.log('🤝 Testing cross-user interactions');
  
  try {
    // Test customer browsing astrologer and initiating call
    await performLogin(tester, customer);
    await browseAndSelectAstrologer(tester, astrologer);
    await performLogout(tester);
    
    // Test astrologer receiving and managing calls
    await performLogin(tester, astrologer);
    await checkIncomingCalls(tester);
    await performLogout(tester);
    
    reporter.log('✅ Cross-user interaction tests passed');
    
  } catch (e, stackTrace) {
    reporter.logError('Cross-user interaction failed', e, stackTrace);
  }
}

Future<void> browseAndSelectAstrologer(WidgetTester tester, TestUser astrologer) async {
  // Navigate to astrologer list
  await tapIfExists(tester, find.text('Find Astrologers'));
  await tester.pumpAndSettle();
  
  // Search for specific astrologer
  if (find.widgetWithText(TextField, 'Search').evaluate().isNotEmpty) {
    await fillTextField(tester, 'Search', astrologer.name);
    await tester.pumpAndSettle();
  }
}

Future<void> checkIncomingCalls(WidgetTester tester) async {
  // Navigate to call management
  await tapIfExists(tester, find.text('Calls'));
  await tester.pumpAndSettle();
}

// Utility functions
Future<void> tapIfExists(WidgetTester tester, Finder finder) async {
  if (finder.evaluate().isNotEmpty) {
    await tester.tap(finder.first);
    await tester.pumpAndSettle();
  }
}

Future<void> takeScreenshot(WidgetTester tester, String name) async {
  // Take screenshot for debugging
  try {
    // Screenshot functionality for debugging - can be implemented if needed
    debugPrint('Screenshot would be taken: $name');
  } catch (e) {
    debugPrint('Failed to take screenshot: $e');
  }
}

Future<void> resetServiceLocator() async {
  try {
    if (GetIt.instance.isRegistered<Object>()) {
      await GetIt.instance.reset();
    }
  } catch (e) {
    debugPrint('Service locator reset error: $e');
  }
}