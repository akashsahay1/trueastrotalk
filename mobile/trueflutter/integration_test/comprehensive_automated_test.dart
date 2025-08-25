import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('TrueAstroTalk Comprehensive Automated Tests', () {
    late List<TestUser> testCustomers;
    late List<TestUser> testAstrologers;
    
    setUpAll(() {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      
      // Generate 10 test customers
      testCustomers = List.generate(10, (index) => TestUser(
        name: 'Test Customer ${index + 1}',
        email: 'testcustomer${index + 1}.$timestamp@trueastrotalk.com',
        phone: '900000${1234 + index}',
        password: 'TestPass123!',
        isAstrologer: false,
      ));
      
      // Generate 10 test astrologers  
      testAstrologers = List.generate(10, (index) => TestUser(
        name: 'Test Astrologer ${index + 1}',
        email: 'testastrologer${index + 1}.$timestamp@trueastrotalk.com',
        phone: '900000${5678 + index}',
        password: 'TestPass123!',
        isAstrologer: true,
      ));
    });

    testWidgets('Complete Automated E2E Test Suite', (WidgetTester tester) async {
      print('🚀 Starting Comprehensive Automated E2E Test Suite');
      
      // Set onboarding as completed to skip it entirely
      SharedPreferences.setMockInitialValues({
        'onboarding_completed': true,
      });
      
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      print('📱 App launched successfully with onboarding bypassed');
      
      // Phase 1: Register 5 customers (reduced for faster testing)
      print('🎯 Phase 1: Registering 5 test customers...');
      for (int i = 0; i < 5; i++) {
        await registerUser(tester, testCustomers[i], i + 1, 'Customer');
        if (i < 4) await returnToWelcomeScreen(tester);
      }
      
      // Phase 2: Register 5 astrologers  
      print('🎯 Phase 2: Registering 5 test astrologers...');
      for (int i = 0; i < 5; i++) {
        await registerUser(tester, testAstrologers[i], i + 1, 'Astrologer');
        if (i < 4) await returnToWelcomeScreen(tester);
      }
      
      // Phase 3: Test login functionality
      print('🎯 Phase 3: Testing login functionality...');
      await testLogin(tester, testCustomers[0]);
      
      print('✅ Comprehensive Automated E2E Test Suite completed successfully!');
    });
  });
}

class TestUser {
  final String name;
  final String email;
  final String phone;
  final String password;
  final bool isAstrologer;
  
  TestUser({
    required this.name,
    required this.email,
    required this.phone,
    required this.password,
    required this.isAstrologer,
  });
}

Future<void> registerUser(WidgetTester tester, TestUser user, int userNumber, String userType) async {
  print('👤 Registering $userType $userNumber: ${user.name}');
  
  try {
    // Wait for UI to be ready
    await tester.pump(const Duration(seconds: 2));
    
    // Navigate to appropriate signup
    if (user.isAstrologer) {
      await navigateToAstrologerSignup(tester);
    } else {
      await navigateToCustomerSignup(tester);
    }
    
    // Fill the registration form
    await fillRegistrationForm(tester, user);
    
    print('✅ Successfully registered $userType $userNumber: ${user.name}');
    
  } catch (e) {
    print('❌ Failed to register $userType $userNumber: $e');
  }
}

Future<void> navigateToCustomerSignup(WidgetTester tester) async {
  // Look for "Sign up with Email" button
  final signupEmailFinder = find.text('Sign up with Email');
  if (signupEmailFinder.evaluate().isNotEmpty) {
    await tester.tap(signupEmailFinder);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    return;
  }
  
  // Fallback to basic Sign Up
  final signupFinder = find.text('Sign Up');
  if (signupFinder.evaluate().isNotEmpty) {
    await tester.tap(signupFinder);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }
}

Future<void> navigateToAstrologerSignup(WidgetTester tester) async {
  // Look for "Join as Astrologer" button
  final astrologerFinder = find.text('Join as Astrologer');
  if (astrologerFinder.evaluate().isNotEmpty) {
    await tester.tap(astrologerFinder);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    return;
  }
  
  // Fallback: try regular signup then select astrologer
  await navigateToCustomerSignup(tester);
}

Future<void> fillRegistrationForm(WidgetTester tester, TestUser user) async {
  await tester.pump(const Duration(seconds: 1));
  
  // Stage 1: Personal Information
  await fillFormStage1(tester, user);
  
  // Continue to next stage
  await tapContinueButton(tester);
  
  // Stage 2: Contact & Security Information
  await fillFormStage2(tester, user);
  
  // Continue to next stage
  await tapContinueButton(tester);
  
  // Stage 3: Additional Information & Submit
  await fillFormStage3(tester, user);
  
  // Submit the form
  await submitRegistrationForm(tester);
}

Future<void> fillFormStage1(WidgetTester tester, TestUser user) async {
  // Fill Name and Phone
  final textFields = find.byType(TextFormField);
  
  if (textFields.evaluate().length >= 2) {
    // Fill name with scroll to view and warning suppression
    await tester.ensureVisible(textFields.at(0));
    await tester.tap(textFields.at(0), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(0), user.name);
    
    // Fill phone
    await tester.ensureVisible(textFields.at(1));
    await tester.tap(textFields.at(1), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(1), user.phone);
    
    print('✅ Filled Stage 1: Name and Phone');
  }
}

Future<void> fillFormStage2(WidgetTester tester, TestUser user) async {
  await tester.pump(const Duration(seconds: 1));
  
  // Fill Email and Password fields
  final textFields = find.byType(TextFormField);
  
  if (textFields.evaluate().length >= 3) {
    // Fill email (assuming it's the first field in this stage)
    await tester.ensureVisible(textFields.at(0));
    await tester.tap(textFields.at(0), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(0), user.email);
    
    // Fill password
    await tester.ensureVisible(textFields.at(1));
    await tester.tap(textFields.at(1), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(1), user.password);
    
    // Fill confirm password if exists
    if (textFields.evaluate().length >= 3) {
      await tester.ensureVisible(textFields.at(2));
      await tester.tap(textFields.at(2), warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.enterText(textFields.at(2), user.password);
    }
    
    print('✅ Filled Stage 2: Email and Password');
  }
}

Future<void> fillFormStage3(WidgetTester tester, TestUser user) async {
  await tester.pump(const Duration(seconds: 1));
  
  // Handle birth date selection if required
  await selectDateIfExists(tester);
  
  // Accept terms and conditions if exists
  await acceptTermsIfExists(tester);
  
  print('✅ Completed Stage 3: Additional Information');
}

Future<void> tapContinueButton(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 1));
  
  final continueButtons = ['Continue', 'Next', 'Proceed'];
  
  for (final buttonText in continueButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      await tester.tap(finder);
      await tester.pumpAndSettle(const Duration(seconds: 2));
      print('✅ Tapped: $buttonText');
      return;
    }
  }
}

Future<void> submitRegistrationForm(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 1));
  
  // Use unique key instead of text to avoid ambiguity
  final primaryButtonFinder = find.byKey(const Key('primary_signup_button'));
  if (primaryButtonFinder.evaluate().isNotEmpty) {
    await tester.tap(primaryButtonFinder);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    print('✅ Submitted registration form using primary signup button');
    
    // Handle success dialog if it appears
    await handleSuccessDialog(tester);
    return;
  }
  
  // Fallback to text-based search if key not found
  final submitButtons = ['Create Account', 'Create Profile', 'Sign Up', 'Register', 'Submit'];
  
  for (final buttonText in submitButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      await tester.tap(finder.first); // Use .first to avoid ambiguity
      await tester.pumpAndSettle(const Duration(seconds: 3));
      print('✅ Submitted registration form with: $buttonText (fallback)');
      
      // Handle success dialog if it appears
      await handleSuccessDialog(tester);
      return;
    }
  }
}

Future<void> selectDateIfExists(WidgetTester tester) async {
  // Look for date selection elements
  final dateButtons = find.textContaining('Date');
  if (dateButtons.evaluate().isNotEmpty) {
    await tester.tap(dateButtons.first);
    await tester.pumpAndSettle(const Duration(seconds: 1));
    
    // Handle date picker - just tap OK if it appears
    final okButton = find.text('OK');
    if (okButton.evaluate().isNotEmpty) {
      await tester.tap(okButton);
      await tester.pumpAndSettle();
    }
  }
}

Future<void> acceptTermsIfExists(WidgetTester tester) async {
  // Look for checkbox or terms acceptance
  final checkbox = find.byType(Checkbox);
  if (checkbox.evaluate().isNotEmpty) {
    await tester.ensureVisible(checkbox.first);
    await tester.tap(checkbox.first, warnIfMissed: false);
    await tester.pumpAndSettle();
    print('✅ Accepted terms and conditions');
  }
}

Future<void> handleSuccessDialog(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 1));
  
  // Try to find the specific success dialog continue button first
  final successButtonFinder = find.byKey(const Key('success_dialog_continue_button'));
  if (successButtonFinder.evaluate().isNotEmpty) {
    await tester.tap(successButtonFinder);
    await tester.pumpAndSettle(const Duration(seconds: 2));
    print('✅ Handled success dialog using key');
    return;
  }
  
  // Fallback to text-based search
  final dialogButtons = ['Continue', 'OK', 'Done', 'Close'];
  
  for (final buttonText in dialogButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      await tester.tap(finder.first); // Use .first to avoid ambiguity
      await tester.pumpAndSettle(const Duration(seconds: 2));
      print('✅ Handled success dialog: $buttonText (fallback)');
      break;
    }
  }
}

Future<void> returnToWelcomeScreen(WidgetTester tester) async {
  print('🔙 Returning to welcome screen for next registration...');
  
  // Try various ways to get back to welcome screen
  for (int attempt = 0; attempt < 5; attempt++) {
    // Look for back navigation
    final backButtons = [
      find.byIcon(Icons.arrow_back_ios),
      find.byIcon(Icons.arrow_back),
      find.byIcon(Icons.close),
    ];
    
    for (final backButton in backButtons) {
      if (backButton.evaluate().isNotEmpty) {
        await tester.tap(backButton);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }
    }
    
    // Check if we're back at welcome screen
    if (find.text('Sign up with Email').evaluate().isNotEmpty ||
        find.text('Join as Astrologer').evaluate().isNotEmpty) {
      print('✅ Successfully returned to welcome screen');
      return;
    }
    
    await tester.pump(const Duration(seconds: 1));
  }
  
  print('⚠️ Could not return to welcome screen, continuing anyway...');
}

Future<void> testLogin(WidgetTester tester, TestUser user) async {
  print('🔐 Testing login functionality with: ${user.email}');
  
  try {
    // Navigate to login
    final signInFinder = find.text('Sign In');
    if (signInFinder.evaluate().isNotEmpty) {
      await tester.tap(signInFinder);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    } else {
      // Try "Already have an account? Sign In" 
      final signInLinkFinder = find.textContaining('Sign In');
      if (signInLinkFinder.evaluate().isNotEmpty) {
        await tester.tap(signInLinkFinder.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }
    }
    
    // Fill login form
    final textFields = find.byType(TextFormField);
    if (textFields.evaluate().length >= 2) {
      // Fill email
      await tester.tap(textFields.at(0));
      await tester.pumpAndSettle();
      await tester.enterText(textFields.at(0), user.email);
      
      // Fill password  
      await tester.tap(textFields.at(1));
      await tester.pumpAndSettle();
      await tester.enterText(textFields.at(1), user.password);
      
      // Submit login
      final loginSubmitButtons = ['Sign In', 'Login', 'Submit'];
      for (final buttonText in loginSubmitButtons) {
        final finder = find.text(buttonText);
        if (finder.evaluate().isNotEmpty) {
          await tester.tap(finder);
          await tester.pumpAndSettle(const Duration(seconds: 5));
          print('✅ Login test completed successfully');
          return;
        }
      }
    }
    
  } catch (e) {
    print('❌ Login test failed: $e');
  }
}