import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('TrueAstroTalk Bypass Onboarding Tests', () {
    testWidgets('Bypass Onboarding and Test Registration', (WidgetTester tester) async {
      print('🚀 Starting Bypass Onboarding Test');
      
      // Set onboarding as completed before launching app
      SharedPreferences.setMockInitialValues({
        'onboarding_completed': true,
      });
      
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      
      print('📱 App launched with onboarding bypassed');
      
      // Wait for the app to settle and show login/welcome screen
      await tester.pump(const Duration(seconds: 3));
      
      print('🔍 Looking for UI elements...');
      await describeCurrentScreen(tester);
      
      // Test navigation to signup
      await attemptSignupNavigation(tester);
      
      print('✅ Bypass Onboarding Test completed!');
    });
  });
}

Future<void> describeCurrentScreen(WidgetTester tester) async {
  print('📊 Current Screen Analysis:');
  
  // Check common UI elements
  final commonElements = [
    'Skip',
    'Get Started',
    'Next',
    'Sign In',
    'Sign Up',
    'Login',
    'Register',
    'Welcome',
    'True Astrotalk',
    'Continue with Google',
    'Sign up with Email',
    'Already have an account',
    'Join as Astrologer',
  ];
  
  for (final element in commonElements) {
    final finder = find.text(element);
    if (finder.evaluate().isNotEmpty) {
      print('✅ Found: $element');
    }
  }
  
  // Check for buttons
  final elevatedButtons = find.byType(ElevatedButton);
  final textButtons = find.byType(TextButton);
  final inkWells = find.byType(InkWell);
  
  print('📱 UI Components:');
  print('   ElevatedButtons: ${elevatedButtons.evaluate().length}');
  print('   TextButtons: ${textButtons.evaluate().length}');
  print('   InkWells: ${inkWells.evaluate().length}');
  
  // Try to find text fields
  final textFields = find.byType(TextFormField);
  final textFieldsAlt = find.byType(TextField);
  print('   TextFormFields: ${textFields.evaluate().length}');
  print('   TextFields: ${textFieldsAlt.evaluate().length}');
}

Future<void> attemptSignupNavigation(WidgetTester tester) async {
  print('🎯 Attempting to navigate to signup...');
  
  // Strategy 1: Look for "Sign up with Email" (from welcome.dart)
  final signupEmailFinder = find.text('Sign up with Email');
  if (signupEmailFinder.evaluate().isNotEmpty) {
    print('✅ Found "Sign up with Email" button');
    await tester.tap(signupEmailFinder);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    
    await describeCurrentScreen(tester);
    await testRegistrationForm(tester);
    return;
  }
  
  // Strategy 2: Look for basic "Sign Up" 
  final signupFinder = find.text('Sign Up');
  if (signupFinder.evaluate().isNotEmpty) {
    print('✅ Found "Sign Up" button');
    await tester.tap(signupFinder);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    
    await describeCurrentScreen(tester);
    await testRegistrationForm(tester);
    return;
  }
  
  // Strategy 3: Look for "Join as Astrologer"
  final astrologerFinder = find.text('Join as Astrologer');
  if (astrologerFinder.evaluate().isNotEmpty) {
    print('✅ Found "Join as Astrologer" button');
    await tester.tap(astrologerFinder);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    
    await describeCurrentScreen(tester);
    await testRegistrationForm(tester);
    return;
  }
  
  // Strategy 4: Try tapping ElevatedButtons
  final elevatedButtons = find.byType(ElevatedButton);
  if (elevatedButtons.evaluate().isNotEmpty) {
    print('🔄 Trying ElevatedButton taps...');
    for (int i = 0; i < elevatedButtons.evaluate().length; i++) {
      try {
        await tester.tap(elevatedButtons.at(i));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('✅ Tapped ElevatedButton $i');
        
        // Check if we moved to signup
        if (find.text('Full Name').evaluate().isNotEmpty ||
            find.text('Name').evaluate().isNotEmpty ||
            find.byType(TextFormField).evaluate().length > 1) {
          print('✅ Appears to be on registration form!');
          await testRegistrationForm(tester);
          return;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  print('⚠️ Could not find signup navigation');
}

Future<void> testRegistrationForm(WidgetTester tester) async {
  print('📝 Testing registration form...');
  
  await tester.pump(const Duration(seconds: 2));
  
  // Describe form fields available
  final textFields = find.byType(TextFormField);
  print('📋 Found ${textFields.evaluate().length} form fields');
  
  // Test data
  final testData = [
    'Test Customer ${DateTime.now().millisecondsSinceEpoch}',
    '9876543210', 
    'testcustomer.${DateTime.now().millisecondsSinceEpoch}@trueastrotalk.com',
    'TestPass123!'
  ];
  
  // Fill available fields
  for (int i = 0; i < textFields.evaluate().length && i < testData.length; i++) {
    try {
      await tester.tap(textFields.at(i));
      await tester.pumpAndSettle(const Duration(milliseconds: 500));
      await tester.enterText(textFields.at(i), testData[i]);
      await tester.pumpAndSettle(const Duration(milliseconds: 500));
      print('✅ Filled field $i with: ${testData[i]}');
    } catch (e) {
      print('⚠️ Could not fill field $i: $e');
    }
  }
  
  // Look for submit buttons
  final submitButtons = ['Continue', 'Next', 'Create Account', 'Sign Up', 'Register'];
  
  for (final buttonText in submitButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      try {
        print('✅ Found submit button: $buttonText');
        await tester.tap(finder);
        await tester.pumpAndSettle(const Duration(seconds: 3));
        print('✅ Tapped $buttonText - form submitted');
        
        // Check result
        await describeCurrentScreen(tester);
        break;
      } catch (e) {
        print('⚠️ Could not tap $buttonText: $e');
      }
    }
  }
  
  print('✅ Registration form test completed');
}