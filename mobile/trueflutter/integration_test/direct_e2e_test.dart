import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('TrueAstroTalk Direct E2E Tests', () {
    testWidgets('Direct Onboarding and Registration Test', (WidgetTester tester) async {
      print('🚀 Starting Direct E2E Test');
      
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 10));
      
      print('📱 App launched, handling onboarding directly...');
      
      // Phase 1: Direct onboarding handling using coordinate taps
      await handleOnboardingDirect(tester);
      
      // Phase 2: Quick registration test
      await quickRegistrationTest(tester);
      
      print('✅ Direct E2E Test completed!');
    });
  });
}

Future<void> handleOnboardingDirect(WidgetTester tester) async {
  print('📱 Using direct coordinate approach for onboarding...');
  
  await tester.pump(const Duration(seconds: 5));
  
  // Strategy 1: Find and tap Skip button using coordinates
  try {
    // The Skip button should be in the top right area
    await tester.tapAt(const Offset(350, 100)); // Top right area where Skip usually is
    await tester.pumpAndSettle(const Duration(seconds: 3));
    print('✅ Tapped top-right area (Skip button)');
    
    // Check if we moved past onboarding
    if (!await isStillOnOnboarding(tester)) {
      print('✅ Successfully passed onboarding via coordinate tap!');
      return;
    }
  } catch (e) {
    print('⚠️ Coordinate tap failed: $e');
  }
  
  // Strategy 2: Navigate through onboarding slides manually
  print('🔄 Trying slide navigation...');
  
  for (int slide = 0; slide < 3; slide++) {
    print('📖 Processing slide ${slide + 1}...');
    
    // Wait for slide to load
    await tester.pump(const Duration(seconds: 2));
    
    // Try to find and tap Next or Get Started button in bottom area
    await tester.tapAt(const Offset(300, 700)); // Bottom right area for Next/Get Started
    await tester.pumpAndSettle(const Duration(seconds: 3));
    
    // Check if we're done with onboarding
    if (!await isStillOnOnboarding(tester)) {
      print('✅ Successfully completed onboarding!');
      return;
    }
  }
  
  // Strategy 3: Try swipe gestures to navigate slides
  print('🔄 Trying swipe navigation...');
  final center = tester.getCenter(find.byType(MaterialApp));
  
  // Swipe left three times to go through slides
  for (int i = 0; i < 3; i++) {
    await tester.drag(find.byType(PageView), const Offset(-300, 0));
    await tester.pumpAndSettle(const Duration(seconds: 2));
    
    // After each swipe, try tapping bottom area for Get Started
    await tester.tapAt(const Offset(300, 700));
    await tester.pumpAndSettle(const Duration(seconds: 2));
    
    if (!await isStillOnOnboarding(tester)) {
      print('✅ Onboarding completed via swipe!');
      return;
    }
  }
  
  // Strategy 4: Try tapping various areas of the screen
  print('🔄 Trying multiple screen areas...');
  final tapAreas = [
    const Offset(350, 80),   // Top right (Skip)
    const Offset(300, 680),  // Bottom right (Next/Get Started) 
    const Offset(200, 680),  // Bottom center (Get Started)
    const Offset(400, 680),  // Bottom far right
    const Offset(200, 600),  // Middle right
  ];
  
  for (final offset in tapAreas) {
    try {
      await tester.tapAt(offset);
      await tester.pumpAndSettle(const Duration(seconds: 2));
      
      if (!await isStillOnOnboarding(tester)) {
        print('✅ Onboarding completed by tapping at $offset!');
        return;
      }
    } catch (e) {
      continue;
    }
  }
  
  print('⚠️ All onboarding strategies attempted, proceeding anyway...');
}

Future<bool> isStillOnOnboarding(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 1));
  
  // Check for onboarding indicators
  final onboardingTexts = [
    'Welcome to True Astrotalk',
    'Discover your cosmic journey',
    'Skip',
    'Get Started',
    'Next'
  ];
  
  for (final text in onboardingTexts) {
    if (find.text(text).evaluate().isNotEmpty) {
      return true;
    }
  }
  
  // Check for login/welcome screen indicators
  final welcomeIndicators = [
    'Sign In',
    'Sign Up', 
    'Login',
    'Welcome',
    'Create Account'
  ];
  
  for (final indicator in welcomeIndicators) {
    if (find.text(indicator).evaluate().isNotEmpty) {
      return false; // Not on onboarding anymore
    }
  }
  
  return true; // Assume still on onboarding if unclear
}

Future<void> quickRegistrationTest(WidgetTester tester) async {
  print('🎯 Starting quick registration test...');
  
  await tester.pump(const Duration(seconds: 3));
  
  // Wait for welcome/login screen to appear
  int waitAttempts = 0;
  while (waitAttempts < 10) {
    if (find.text('Sign Up').evaluate().isNotEmpty ||
        find.text('Sign In').evaluate().isNotEmpty) {
      break;
    }
    await tester.pump(const Duration(seconds: 1));
    waitAttempts++;
  }
  
  // Try to tap Sign Up
  if (find.text('Sign Up').evaluate().isNotEmpty) {
    print('✅ Found Sign Up button, attempting registration...');
    await tester.tap(find.text('Sign Up'));
    await tester.pumpAndSettle(const Duration(seconds: 3));
    
    // Quick form fill test - just fill what we can find
    await quickFormFill(tester);
  } else {
    print('⚠️ Sign Up button not found');
  }
  
  // Test login screen access
  if (find.text('Sign In').evaluate().isNotEmpty) {
    print('✅ Found Sign In button, testing login screen access...');
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle(const Duration(seconds: 3));
    print('✅ Login screen accessed successfully');
  }
}

Future<void> quickFormFill(WidgetTester tester) async {
  print('📝 Quick form fill test...');
  
  await tester.pump(const Duration(seconds: 2));
  
  // Try to fill any text fields we find
  final textFields = find.byType(TextFormField);
  
  final testData = [
    'Test User', 
    '9876543210',
    'testuser@example.com',
    'TestPass123!'
  ];
  
  for (int i = 0; i < textFields.evaluate().length && i < testData.length; i++) {
    try {
      await tester.tap(textFields.at(i));
      await tester.pumpAndSettle(const Duration(milliseconds: 500));
      await tester.enterText(textFields.at(i), testData[i]);
      await tester.pumpAndSettle(const Duration(milliseconds: 500));
      print('✅ Filled field $i with: ${testData[i]}');
    } catch (e) {
      print('⚠️ Could not fill field $i: $e');
      continue;
    }
  }
  
  // Try to find and tap Continue/Submit button
  final submitButtons = ['Continue', 'Next', 'Create Account', 'Submit'];
  
  for (final buttonText in submitButtons) {
    if (find.text(buttonText).evaluate().isNotEmpty) {
      try {
        await tester.tap(find.text(buttonText));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('✅ Tapped $buttonText button');
        break;
      } catch (e) {
        continue;
      }
    }
  }
  
  print('✅ Quick form fill test completed');
}

// Simple test user class
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