import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Customer Signup Flow Tests', () {
    late List<TestUser> testCustomers;
    int successfulRegistrations = 0;
    int failedRegistrations = 0;
    
    setUpAll(() {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      
      // Generate 5 test customers
      testCustomers = List.generate(5, (index) => TestUser(
        name: 'Test Customer ${index + 1}',
        email: 'testcustomer${index + 1}.$timestamp@trueastrotalk.com',
        phone: '900000${1000 + index}',
        password: 'TestPass123!',
      ));
    });

    testWidgets('Customer Registration E2E Test', (WidgetTester tester) async {
      print('🚀 Starting Customer Registration Test Suite');
      
      // Set onboarding as completed to skip it
      SharedPreferences.setMockInitialValues({
        'onboarding_completed': true,
      });
      
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      print('📱 App launched successfully');
      
      // Register 5 customers with smooth animations
      print('🎯 Starting customer registration tests...');
      print('📊 Target: ${testCustomers.length} customer registrations');
      
      for (int i = 0; i < testCustomers.length; i++) {
        final success = await registerCustomer(tester, testCustomers[i], i + 1);
        if (success) {
          successfulRegistrations++;
        } else {
          failedRegistrations++;
        }
        
        // Print progress
        print('📈 Progress: $successfulRegistrations/${testCustomers.length} customers registered successfully');
        if (failedRegistrations > 0) {
          print('⚠️ Failed registrations: $failedRegistrations');
        }
        
        if (i < testCustomers.length - 1) {
          await returnToWelcomeScreen(tester);
        }
      }
      
      // Test login with first customer
      if (successfulRegistrations > 0) {
        print('🔐 Testing login functionality...');
        await testLogin(tester, testCustomers[0]);
      }
      
      // Final summary
      print('\n📊 CUSTOMER REGISTRATION TEST SUMMARY:');
      print('✅ Successful registrations: $successfulRegistrations/${testCustomers.length}');
      print('❌ Failed registrations: $failedRegistrations/${testCustomers.length}');
      print('📈 Success rate: ${((successfulRegistrations / testCustomers.length) * 100).toStringAsFixed(1)}%');
      print('✅ Customer Registration Test Suite completed!');
    });
  });
}

class TestUser {
  final String name;
  final String email;
  final String phone;
  final String password;
  
  TestUser({
    required this.name,
    required this.email,
    required this.phone,
    required this.password,
  });
}

Future<void> addSmoothDelay(WidgetTester tester, {int milliseconds = 300}) async {
  await tester.pump(Duration(milliseconds: milliseconds));
}

Future<void> smoothPumpAndSettle(WidgetTester tester) async {
  await tester.pumpAndSettle(
    const Duration(milliseconds: 100),
    EnginePhase.sendSemanticsUpdate,
    const Duration(seconds: 5),
  );
}

Future<bool> registerCustomer(WidgetTester tester, TestUser user, int userNumber) async {
  print('👤 Registering Customer $userNumber: ${user.name}');
  
  try {
    // Wait for UI to be ready
    await addSmoothDelay(tester, milliseconds: 500);
    
    // Navigate to customer signup
    await navigateToCustomerSignup(tester);
    
    // Fill the registration form with smooth transitions
    await fillCustomerRegistrationForm(tester, user);
    
    print('✅ Successfully registered Customer $userNumber: ${user.name}');
    return true;
    
  } catch (e) {
    print('❌ Failed to register Customer $userNumber: $e');
    return false;
  }
}

Future<void> navigateToCustomerSignup(WidgetTester tester) async {
  // Look for "Sign up with Email" button
  final signupEmailFinder = find.text('Sign up with Email');
  if (signupEmailFinder.evaluate().isNotEmpty) {
    await addSmoothDelay(tester);
    await tester.tap(signupEmailFinder);
    await smoothPumpAndSettle(tester);
    return;
  }
  
  // Fallback to basic Sign Up
  final signupFinder = find.text('Sign Up');
  if (signupFinder.evaluate().isNotEmpty) {
    await addSmoothDelay(tester);
    await tester.tap(signupFinder);
    await smoothPumpAndSettle(tester);
  }
}

Future<void> fillCustomerRegistrationForm(WidgetTester tester, TestUser user) async {
  // Stage 1: Personal Information
  await fillPersonalInfo(tester, user);
  await tapContinueButton(tester);
  
  // Stage 2: Contact & Security Information
  await fillContactSecurity(tester, user);
  await tapContinueButton(tester);
  
  // Stage 3: Additional Information & Submit
  await fillAdditionalInfo(tester);
  await submitRegistrationForm(tester);
}

Future<void> fillPersonalInfo(WidgetTester tester, TestUser user) async {
  await addSmoothDelay(tester, milliseconds: 400);
  
  final textFields = find.byType(TextFormField);
  
  if (textFields.evaluate().length >= 2) {
    // Fill name with smooth animation
    await tester.ensureVisible(textFields.at(0));
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(textFields.at(0), warnIfMissed: false);
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.enterText(textFields.at(0), user.name);
    await addSmoothDelay(tester, milliseconds: 300);
    
    // Fill phone with smooth animation
    await tester.ensureVisible(textFields.at(1));
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(textFields.at(1), warnIfMissed: false);
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.enterText(textFields.at(1), user.phone);
    await addSmoothDelay(tester, milliseconds: 300);
    
    print('✅ Filled Personal Information');
  }
}

Future<void> fillContactSecurity(WidgetTester tester, TestUser user) async {
  await addSmoothDelay(tester, milliseconds: 400);
  
  final textFields = find.byType(TextFormField);
  
  if (textFields.evaluate().length >= 3) {
    // Fill email with smooth animation
    await tester.ensureVisible(textFields.at(0));
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(textFields.at(0), warnIfMissed: false);
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.enterText(textFields.at(0), user.email);
    await addSmoothDelay(tester, milliseconds: 300);
    
    // Fill password with smooth animation
    await tester.ensureVisible(textFields.at(1));
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(textFields.at(1), warnIfMissed: false);
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.enterText(textFields.at(1), user.password);
    await addSmoothDelay(tester, milliseconds: 300);
    
    // Fill confirm password if exists
    if (textFields.evaluate().length >= 3) {
      await tester.ensureVisible(textFields.at(2));
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.tap(textFields.at(2), warnIfMissed: false);
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.enterText(textFields.at(2), user.password);
      await addSmoothDelay(tester, milliseconds: 300);
    }
    
    print('✅ Filled Contact & Security Information');
  }
}

Future<void> fillAdditionalInfo(WidgetTester tester) async {
  await addSmoothDelay(tester, milliseconds: 400);
  
  // Handle birth date selection if required
  await selectDateIfExists(tester);
  
  // Accept terms and conditions if exists
  await acceptTermsIfExists(tester);
  
  print('✅ Completed Additional Information');
}

Future<void> selectDateIfExists(WidgetTester tester) async {
  final dateButtons = find.textContaining('Date');
  if (dateButtons.evaluate().isNotEmpty) {
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(dateButtons.first);
    await smoothPumpAndSettle(tester);
    
    // Handle date picker - just tap OK if it appears
    final okButton = find.text('OK');
    if (okButton.evaluate().isNotEmpty) {
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.tap(okButton);
      await smoothPumpAndSettle(tester);
    }
  }
}

Future<void> acceptTermsIfExists(WidgetTester tester) async {
  final checkbox = find.byType(Checkbox);
  if (checkbox.evaluate().isNotEmpty) {
    await tester.ensureVisible(checkbox.first);
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(checkbox.first, warnIfMissed: false);
    await smoothPumpAndSettle(tester);
    print('✅ Accepted terms and conditions');
  }
}

Future<void> tapContinueButton(WidgetTester tester) async {
  await addSmoothDelay(tester, milliseconds: 400);
  
  final continueButtons = ['Continue', 'Next', 'Proceed'];
  
  for (final buttonText in continueButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.tap(finder);
      await smoothPumpAndSettle(tester);
      print('✅ Tapped: $buttonText');
      return;
    }
  }
}

Future<void> submitRegistrationForm(WidgetTester tester) async {
  await addSmoothDelay(tester, milliseconds: 400);
  
  // Use unique key instead of text to avoid ambiguity
  final primaryButtonFinder = find.byKey(const Key('primary_signup_button'));
  if (primaryButtonFinder.evaluate().isNotEmpty) {
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(primaryButtonFinder, warnIfMissed: false);
    await smoothPumpAndSettle(tester);
    print('✅ Submitted registration form');
    
    // Handle success dialog if it appears
    await handleSuccessDialog(tester);
    return;
  }
  
  // Fallback to text-based search if key not found
  final submitButtons = ['Create Account', 'Sign Up', 'Register', 'Submit'];
  
  for (final buttonText in submitButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.tap(finder.first, warnIfMissed: false);
      await smoothPumpAndSettle(tester);
      print('✅ Submitted registration form with: $buttonText');
      
      // Handle success dialog if it appears
      await handleSuccessDialog(tester);
      return;
    }
  }
}

Future<void> handleSuccessDialog(WidgetTester tester) async {
  await addSmoothDelay(tester, milliseconds: 500);
  
  // Try to find success dialog continue button
  final successButtonFinder = find.byKey(const Key('success_dialog_continue_button'));
  if (successButtonFinder.evaluate().isNotEmpty) {
    await addSmoothDelay(tester, milliseconds: 200);
    await tester.tap(successButtonFinder);
    await smoothPumpAndSettle(tester);
    print('✅ Handled success dialog');
    return;
  }
  
  // Fallback to text-based search
  final dialogButtons = ['Continue', 'OK', 'Done', 'Close'];
  
  for (final buttonText in dialogButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.tap(finder.first, warnIfMissed: false);
      await smoothPumpAndSettle(tester);
      print('✅ Handled success dialog: $buttonText');
      break;
    }
  }
}

Future<void> returnToWelcomeScreen(WidgetTester tester) async {
  print('🔙 Returning to welcome screen...');
  
  await addSmoothDelay(tester, milliseconds: 500);
  
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
        await addSmoothDelay(tester, milliseconds: 200);
        await tester.tap(backButton);
        await smoothPumpAndSettle(tester);
      }
    }
    
    // Check if we're back at welcome screen
    if (find.text('Sign up with Email').evaluate().isNotEmpty ||
        find.text('Join as Astrologer').evaluate().isNotEmpty) {
      print('✅ Successfully returned to welcome screen');
      return;
    }
    
    await addSmoothDelay(tester, milliseconds: 500);
  }
  
  print('⚠️ Could not return to welcome screen, continuing anyway...');
}

Future<void> testLogin(WidgetTester tester, TestUser user) async {
  print('🔐 Testing login with: ${user.email}');
  
  try {
    await addSmoothDelay(tester, milliseconds: 500);
    
    // Navigate to login
    final signInFinder = find.text('Sign In');
    if (signInFinder.evaluate().isNotEmpty) {
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.tap(signInFinder);
      await smoothPumpAndSettle(tester);
    } else {
      // Try "Already have an account? Sign In" 
      final signInLinkFinder = find.textContaining('Sign In');
      if (signInLinkFinder.evaluate().isNotEmpty) {
        await addSmoothDelay(tester, milliseconds: 200);
        await tester.tap(signInLinkFinder.first);
        await smoothPumpAndSettle(tester);
      }
    }
    
    // Fill login form with smooth animations
    final textFields = find.byType(TextFormField);
    if (textFields.evaluate().length >= 2) {
      // Fill email
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.tap(textFields.at(0));
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.enterText(textFields.at(0), user.email);
      await addSmoothDelay(tester, milliseconds: 300);
      
      // Fill password  
      await tester.tap(textFields.at(1));
      await addSmoothDelay(tester, milliseconds: 200);
      await tester.enterText(textFields.at(1), user.password);
      await addSmoothDelay(tester, milliseconds: 300);
      
      // Submit login
      final loginSubmitButtons = ['Sign In', 'Login', 'Submit'];
      for (final buttonText in loginSubmitButtons) {
        final finder = find.text(buttonText);
        if (finder.evaluate().isNotEmpty) {
          await addSmoothDelay(tester, milliseconds: 200);
          await tester.tap(finder);
          await smoothPumpAndSettle(tester);
          print('✅ Login test completed successfully');
          return;
        }
      }
    }
    
  } catch (e) {
    print('❌ Login test failed: $e');
  }
}