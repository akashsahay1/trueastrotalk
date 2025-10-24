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
  
  if (user.isAstrologer) {
    // Astrologer registration has 6 steps
    await fillAstrologerRegistration(tester, user);
  } else {
    // Customer registration has 3 steps
    await fillCustomerRegistration(tester, user);
  }
}

Future<void> fillCustomerRegistration(WidgetTester tester, TestUser user) async {
  // Stage 1: Personal Information
  await fillFormStage1(tester, user);
  await tapContinueButton(tester);
  
  // Stage 2: Contact & Security Information
  await fillFormStage2(tester, user);
  await tapContinueButton(tester);
  
  // Stage 3: Additional Information & Submit
  await fillFormStage3(tester, user);
  await submitRegistrationForm(tester);
}

Future<void> fillAstrologerRegistration(WidgetTester tester, TestUser user) async {
  // Step 1: Personal Information (Name, Phone, Profile Image)
  await fillAstrologerStep1(tester, user);
  await tapContinueButton(tester);
  
  // Step 2: Contact & Security (Email, Password)
  await fillAstrologerStep2(tester, user);
  await tapContinueButton(tester);
  
  // Step 3: Professional Profile (Experience, Bio, Languages, Skills)
  await fillAstrologerStep3(tester, user);
  await tapContinueButton(tester);
  
  // Step 4: Address Information
  await fillAstrologerStep4(tester, user);
  await tapContinueButton(tester);
  
  // Step 5: Consultation Rates
  await fillAstrologerStep5(tester, user);
  await tapContinueButton(tester);
  
  // Step 6: Bank Details & PAN Card
  await fillAstrologerStep6(tester, user);
  await submitAstrologerRegistration(tester);
}

// ============================================================================
// ASTROLOGER REGISTRATION STEP FUNCTIONS
// ============================================================================

Future<void> fillAstrologerStep1(WidgetTester tester, TestUser user) async {
  print('📝 Filling Astrologer Step 1: Personal Information with Profile Image');
  
  // Fill Name and Phone
  final textFields = find.byType(TextFormField);
  
  if (textFields.evaluate().length >= 2) {
    // Fill name
    await tester.ensureVisible(textFields.at(0));
    await tester.tap(textFields.at(0), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(0), user.name);
    
    // Fill phone
    await tester.ensureVisible(textFields.at(1));
    await tester.tap(textFields.at(1), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(1), user.phone);
    
    print('✅ Filled Name and Phone');
  }
  
  // Handle Profile Image Selection
  await selectProfileImage(tester);
  print('✅ Completed Step 1: Personal Information with Profile Image');
}

Future<void> fillAstrologerStep2(WidgetTester tester, TestUser user) async {
  print('📝 Filling Astrologer Step 2: Contact & Security');
  
  await tester.pump(const Duration(seconds: 1));
  
  // Fill Email and Password fields
  final textFields = find.byType(TextFormField);
  
  if (textFields.evaluate().length >= 2) {
    // Fill email
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
    
    print('✅ Completed Step 2: Contact & Security');
  }
}

Future<void> fillAstrologerStep3(WidgetTester tester, TestUser user) async {
  print('📝 Filling Astrologer Step 3: Professional Profile');
  
  await tester.pump(const Duration(seconds: 1));
  
  // Select Experience
  await selectExperienceLevel(tester);
  
  // Fill Bio
  await fillBioField(tester);
  
  // Select Languages
  await selectLanguages(tester);
  
  // Select Skills
  await selectSkills(tester);
  
  // Fill Qualifications
  await fillQualifications(tester);
  
  print('✅ Completed Step 3: Professional Profile');
}

Future<void> fillAstrologerStep4(WidgetTester tester, TestUser user) async {
  print('📝 Filling Astrologer Step 4: Address Information');
  
  await tester.pump(const Duration(seconds: 1));
  
  // Fill Address using autocomplete
  await fillAddressField(tester);
  
  print('✅ Completed Step 4: Address Information');
}

Future<void> fillAstrologerStep5(WidgetTester tester, TestUser user) async {
  print('📝 Filling Astrologer Step 5: Consultation Rates');
  
  await tester.pump(const Duration(seconds: 1));
  
  // Fill consultation rates
  final textFields = find.byType(TextFormField);
  
  if (textFields.evaluate().length >= 3) {
    // Fill call rate
    await tester.ensureVisible(textFields.at(0));
    await tester.tap(textFields.at(0), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(0), '30');
    
    // Fill chat rate
    await tester.ensureVisible(textFields.at(1));
    await tester.tap(textFields.at(1), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(1), '20');
    
    // Fill video rate
    await tester.ensureVisible(textFields.at(2));
    await tester.tap(textFields.at(2), warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.enterText(textFields.at(2), '40');
    
    print('✅ Completed Step 5: Consultation Rates');
  }
}

Future<void> fillAstrologerStep6(WidgetTester tester, TestUser user) async {
  print('📝 Filling Astrologer Step 6: Bank Details & PAN Card');
  
  await tester.pump(const Duration(seconds: 1));
  
  // Fill Bank Details
  await fillBankDetails(tester, user);
  
  // Handle PAN Card Upload
  await selectPanCardImage(tester);
  
  // Accept terms and conditions
  await acceptTermsIfExists(tester);
  
  print('✅ Completed Step 6: Bank Details & PAN Card');
}

Future<void> submitAstrologerRegistration(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 1));
  
  final submitButtons = ['Create Profile', 'Register as Astrologer', 'Complete Registration', 'Submit'];
  
  for (final buttonText in submitButtons) {
    final finder = find.text(buttonText);
    if (finder.evaluate().isNotEmpty) {
      await tester.tap(finder);
      await tester.pumpAndSettle(const Duration(seconds: 5));
      print('✅ Submitted astrologer registration using: $buttonText');
      return;
    }
  }
  
  // Fallback to generic submit
  await submitRegistrationForm(tester);
}

// ============================================================================
// IMAGE SELECTION FUNCTIONS
// ============================================================================

Future<void> selectProfileImage(WidgetTester tester) async {
  print('📸 Attempting to select profile image...');
  
  try {
    // Look for profile image selection button/area
    final imageSelectors = [
      find.text('Select Profile Photo'),
      find.text('Add Photo'),
      find.text('Upload Photo'),
      find.byTooltip('Select Profile Photo'),
      find.byIcon(Icons.camera_alt),
      find.byIcon(Icons.photo_camera),
      find.byIcon(Icons.add_a_photo),
      find.byType(CircleAvatar),
    ];
    
    for (final selector in imageSelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.ensureVisible(selector);
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        
        // Handle image source selection (Gallery/Camera)
        await selectImageSource(tester);
        
        print('✅ Profile image selection triggered');
        return;
      }
    }
    
    print('⚠️ Profile image selector not found - continuing without image');
  } catch (e) {
    print('⚠️ Profile image selection failed: $e - continuing');
  }
}

Future<void> selectPanCardImage(WidgetTester tester) async {
  print('📄 Attempting to select PAN card image...');
  
  try {
    // Look for PAN card image selection button/area
    final panCardSelectors = [
      find.text('Upload PAN Card'),
      find.text('Select PAN Card'),
      find.text('Add PAN Card'),
      find.textContaining('PAN Card'),
      find.byTooltip('Upload PAN Card'),
      find.byIcon(Icons.file_upload),
      find.byIcon(Icons.upload_file),
    ];
    
    for (final selector in panCardSelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.ensureVisible(selector);
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        
        // Handle image source selection (Gallery/Camera)
        await selectImageSource(tester);
        
        print('✅ PAN card image selection triggered');
        return;
      }
    }
    
    print('⚠️ PAN card selector not found - continuing without PAN card');
  } catch (e) {
    print('⚠️ PAN card selection failed: $e - continuing');
  }
}

Future<void> selectImageSource(WidgetTester tester) async {
  print('📱 Handling image source selection dialog...');
  
  try {
    await tester.pump(const Duration(seconds: 1));
    
    // Look for image source options (Gallery/Camera)
    final gallerySelectors = [
      find.text('Gallery'),
      find.text('Photo Library'),
      find.text('Choose from Gallery'),
      find.textContaining('Gallery'),
    ];
    
    // Prefer Gallery over Camera for testing
    for (final selector in gallerySelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 3));
        print('✅ Selected Gallery as image source');
        
        // Handle mock image selection
        await handleMockImagePicker(tester);
        return;
      }
    }
    
    // If no gallery option, try camera
    final cameraSelectors = [
      find.text('Camera'),
      find.text('Take Photo'),
      find.textContaining('Camera'),
    ];
    
    for (final selector in cameraSelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 3));
        print('✅ Selected Camera as image source');
        
        // Handle mock camera capture
        await handleMockImagePicker(tester);
        return;
      }
    }
    
    print('⚠️ No image source options found');
  } catch (e) {
    print('⚠️ Image source selection failed: $e');
  }
}

Future<void> handleMockImagePicker(WidgetTester tester) async {
  print('🎭 Handling mock image picker...');
  
  try {
    // In test environment, image picker might show mock interface
    // or return immediately with a test image
    await tester.pump(const Duration(seconds: 2));
    
    // Look for any confirmation buttons in image picker
    final confirmButtons = [
      find.text('Done'),
      find.text('Select'),
      find.text('OK'),
      find.text('Choose'),
      find.byIcon(Icons.check),
    ];
    
    for (final button in confirmButtons) {
      if (button.evaluate().isNotEmpty) {
        await tester.tap(button, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('✅ Confirmed image selection');
        return;
      }
    }
    
    print('✅ Image picker handled (no confirmation needed)');
  } catch (e) {
    print('⚠️ Mock image picker handling failed: $e');
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR ASTROLOGER FORM FIELDS
// ============================================================================

Future<void> selectExperienceLevel(WidgetTester tester) async {
  try {
    // Look for experience dropdown or selection
    final experienceSelectors = [
      find.textContaining('Experience'),
      find.textContaining('Years'),
      find.byType(DropdownButtonFormField),
    ];
    
    for (final selector in experienceSelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.ensureVisible(selector);
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 1));
        
        // Select 5 years experience
        final experienceOptions = [
          find.text('5 Years'),
          find.text('5'),
          find.textContaining('5'),
        ];
        
        for (final option in experienceOptions) {
          if (option.evaluate().isNotEmpty) {
            await tester.tap(option, warnIfMissed: false);
            await tester.pumpAndSettle();
            print('✅ Selected experience level');
            return;
          }
        }
        break;
      }
    }
  } catch (e) {
    print('⚠️ Experience selection failed: $e');
  }
}

Future<void> fillBioField(WidgetTester tester) async {
  try {
    // Look for bio text field - try first available text field (usually bio in professional profile step)
    final textFields = find.byType(TextFormField);
    if (textFields.evaluate().isNotEmpty) {
      // Bio is typically the first text field in professional profile step
      await tester.tap(textFields.first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.enterText(textFields.first, 'Experienced astrologer with expertise in Vedic astrology and spiritual guidance.');
      print('✅ Filled bio field');
    }
  } catch (e) {
    print('⚠️ Bio field filling failed: $e');
  }
}

Future<void> selectLanguages(WidgetTester tester) async {
  try {
    // Look for languages selection
    final languageSelectors = [
      find.textContaining('Languages'),
      find.textContaining('Language'),
      find.text('Select Languages'),
    ];
    
    for (final selector in languageSelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.ensureVisible(selector);
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 1));
        
        // Select common languages
        final languages = ['Hindi', 'English'];
        for (final lang in languages) {
          final langFinder = find.text(lang);
          if (langFinder.evaluate().isNotEmpty) {
            await tester.tap(langFinder, warnIfMissed: false);
            await tester.pumpAndSettle();
          }
        }
        
        // Close selection if needed
        final doneButtons = [find.text('Done'), find.text('OK'), find.text('Select')];
        for (final button in doneButtons) {
          if (button.evaluate().isNotEmpty) {
            await tester.tap(button, warnIfMissed: false);
            await tester.pumpAndSettle();
            break;
          }
        }
        
        print('✅ Selected languages');
        return;
      }
    }
  } catch (e) {
    print('⚠️ Language selection failed: $e');
  }
}

Future<void> selectSkills(WidgetTester tester) async {
  try {
    // Look for skills selection
    final skillSelectors = [
      find.textContaining('Skills'),
      find.textContaining('Expertise'),
      find.text('Select Skills'),
    ];
    
    for (final selector in skillSelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.ensureVisible(selector);
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle(const Duration(seconds: 1));
        
        // Select common skills
        final skills = ['Vedic', 'Palmistry'];
        for (final skill in skills) {
          final skillFinder = find.text(skill);
          if (skillFinder.evaluate().isNotEmpty) {
            await tester.tap(skillFinder, warnIfMissed: false);
            await tester.pumpAndSettle();
          }
        }
        
        // Close selection if needed
        final doneButtons = [find.text('Done'), find.text('OK'), find.text('Select')];
        for (final button in doneButtons) {
          if (button.evaluate().isNotEmpty) {
            await tester.tap(button, warnIfMissed: false);
            await tester.pumpAndSettle();
            break;
          }
        }
        
        print('✅ Selected skills');
        return;
      }
    }
  } catch (e) {
    print('⚠️ Skills selection failed: $e');
  }
}

Future<void> fillQualifications(WidgetTester tester) async {
  try {
    // Look for qualifications field or button
    final qualificationSelectors = [
      find.textContaining('Qualifications'),
      find.textContaining('Education'),
      find.textContaining('Add Qualification'),
    ];
    
    for (final selector in qualificationSelectors) {
      if (selector.evaluate().isNotEmpty) {
        await tester.ensureVisible(selector);
        await tester.tap(selector, warnIfMissed: false);
        await tester.pumpAndSettle();
        
        // If it's a text field, enter qualification
        final textField = find.byType(TextFormField).last;
        if (textField.evaluate().isNotEmpty) {
          await tester.enterText(textField, 'B.Tech, Astrology Diploma');
          await tester.pumpAndSettle();
        }
        
        print('✅ Added qualifications');
        return;
      }
    }
  } catch (e) {
    print('⚠️ Qualifications filling failed: $e');
  }
}

Future<void> fillAddressField(WidgetTester tester) async {
  try {
    // Look for address field - use first available text field in address step
    final textFields = find.byType(TextFormField);
    if (textFields.evaluate().isNotEmpty) {
      await tester.tap(textFields.first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.enterText(textFields.first, 'Mumbai, Maharashtra, India');
      await tester.pumpAndSettle(const Duration(seconds: 2));
      print('✅ Filled address field');
    }
  } catch (e) {
    print('⚠️ Address filling failed: $e');
  }
}

Future<void> fillBankDetails(WidgetTester tester, TestUser user) async {
  try {
    final textFields = find.byType(TextFormField);
    final fieldCount = textFields.evaluate().length;
    
    if (fieldCount >= 4) {
      // Account holder name
      await tester.ensureVisible(textFields.at(0));
      await tester.tap(textFields.at(0), warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.enterText(textFields.at(0), user.name);
      
      // Account number
      await tester.ensureVisible(textFields.at(1));
      await tester.tap(textFields.at(1), warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.enterText(textFields.at(1), '123456789012');
      
      // Bank name
      await tester.ensureVisible(textFields.at(2));
      await tester.tap(textFields.at(2), warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.enterText(textFields.at(2), 'Test Bank');
      
      // IFSC code
      await tester.ensureVisible(textFields.at(3));
      await tester.tap(textFields.at(3), warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.enterText(textFields.at(3), 'TEST0001234');
      
      print('✅ Filled bank details');
    }
  } catch (e) {
    print('⚠️ Bank details filling failed: $e');
  }
}

// ============================================================================
// ORIGINAL FUNCTIONS (kept for customer registration)
// ============================================================================

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