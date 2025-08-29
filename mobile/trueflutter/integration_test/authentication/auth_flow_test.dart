import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Authentication Flow Integration Tests', () {
    testWidgets('Complete Customer Registration Flow', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Test data
      const testName = 'Integration Test User';
      const testEmail = 'integration.test@example.com';
      const testPhone = '+919876543210';
      const testPassword = 'TestPass123!';

      // Step 1: App should start with splash screen
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Step 2: Navigate to sign up screen
      final signUpButton = find.text('Sign Up');
      if (signUpButton.evaluate().isEmpty) {
        // If no sign up button, look for "Get Started" or similar
        final getStartedButton = find.textContaining('Get Started')
            .or(find.textContaining('Register'))
            .or(find.textContaining('Create Account'));
        
        if (getStartedButton.evaluate().isNotEmpty) {
          await tester.tap(getStartedButton.first);
          await tester.pumpAndSettle();
        }
      } else {
        await tester.tap(signUpButton);
        await tester.pumpAndSettle();
      }

      // Step 3: Fill registration form
      await _fillRegistrationForm(tester, testName, testEmail, testPhone, testPassword);

      // Step 4: Submit registration
      await _submitRegistration(tester);

      // Step 5: Verify successful registration
      await _verifyRegistrationSuccess(tester);

      print('✅ Customer registration flow completed successfully');
    });

    testWidgets('Customer Login Flow', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Test credentials (use existing test account)
      const testEmail = 'test.customer@example.com';
      const testPassword = 'TestPass123!';

      // Step 1: Navigate to login screen
      await _navigateToLogin(tester);

      // Step 2: Fill login form
      await _fillLoginForm(tester, testEmail, testPassword);

      // Step 3: Submit login
      await _submitLogin(tester);

      // Step 4: Verify successful login
      await _verifyLoginSuccess(tester);

      print('✅ Customer login flow completed successfully');
    });

    testWidgets('Astrologer Registration Flow', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Test data for astrologer
      const astrologerName = 'Dr. Test Astrologer';
      const astrologerEmail = 'astrologer.test@example.com';
      const astrologerPhone = '+919876543211';
      const astrologerPassword = 'AstroPass123!';

      // Step 1: Navigate to astrologer registration
      await _navigateToAstrologerRegistration(tester);

      // Step 2: Fill astrologer registration form
      await _fillAstrologerRegistrationForm(
        tester,
        astrologerName,
        astrologerEmail,
        astrologerPhone,
        astrologerPassword,
      );

      // Step 3: Submit astrologer registration
      await _submitAstrologerRegistration(tester);

      // Step 4: Verify astrologer registration success
      await _verifyAstrologerRegistrationSuccess(tester);

      print('✅ Astrologer registration flow completed successfully');
    });

    testWidgets('Password Reset Flow', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      const testEmail = 'reset.test@example.com';

      // Step 1: Navigate to login screen
      await _navigateToLogin(tester);

      // Step 2: Tap forgot password
      await _tapForgotPassword(tester);

      // Step 3: Fill email for password reset
      await _fillPasswordResetForm(tester, testEmail);

      // Step 4: Submit password reset request
      await _submitPasswordReset(tester);

      // Step 5: Verify password reset initiated
      await _verifyPasswordResetInitiated(tester);

      print('✅ Password reset flow completed successfully');
    });

    testWidgets('Social Login Flow (Google)', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Step 1: Navigate to login screen
      await _navigateToLogin(tester);

      // Step 2: Tap Google sign-in button
      await _tapGoogleSignIn(tester);

      // Step 3: Handle Google sign-in flow (mock/test)
      await _handleGoogleSignInFlow(tester);

      // Step 4: Verify successful social login
      await _verifySocialLoginSuccess(tester);

      print('✅ Social login flow completed successfully');
    });

    testWidgets('Email Verification Flow', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // This test assumes user needs to verify email
      const testEmail = 'verify.test@example.com';

      // Step 1: Complete registration (which should trigger email verification)
      await _completeRegistrationForVerification(tester, testEmail);

      // Step 2: Navigate to email verification screen
      await _navigateToEmailVerification(tester);

      // Step 3: Handle email verification process
      await _handleEmailVerification(tester);

      // Step 4: Verify successful email verification
      await _verifyEmailVerificationSuccess(tester);

      print('✅ Email verification flow completed successfully');
    });

    testWidgets('User Profile Update Flow', (WidgetTester tester) async {
      // Launch the app and login first
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Step 1: Login with test account
      await _quickLogin(tester);

      // Step 2: Navigate to profile screen
      await _navigateToProfile(tester);

      // Step 3: Update profile information
      await _updateProfileInformation(tester);

      // Step 4: Save profile changes
      await _saveProfileChanges(tester);

      // Step 5: Verify profile update success
      await _verifyProfileUpdateSuccess(tester);

      print('✅ Profile update flow completed successfully');
    });

    testWidgets('Logout Flow', (WidgetTester tester) async {
      // Launch the app and login first
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Step 1: Login with test account
      await _quickLogin(tester);

      // Step 2: Navigate to settings/profile menu
      await _navigateToSettingsMenu(tester);

      // Step 3: Tap logout button
      await _tapLogoutButton(tester);

      // Step 4: Confirm logout
      await _confirmLogout(tester);

      // Step 5: Verify successful logout
      await _verifyLogoutSuccess(tester);

      print('✅ Logout flow completed successfully');
    });
  });
}

// Helper methods for authentication flow steps

Future<void> _fillRegistrationForm(
  WidgetTester tester,
  String name,
  String email,
  String phone,
  String password,
) async {
  // Fill name field
  final nameField = find.byKey(const Key('name_field'))
      .or(find.widgetWithText(TextFormField, 'Full Name'))
      .or(find.widgetWithText(TextField, 'Name'));
  
  if (nameField.evaluate().isNotEmpty) {
    await tester.enterText(nameField.first, name);
    await tester.pump();
  }

  // Fill email field
  final emailField = find.byKey(const Key('email_field'))
      .or(find.widgetWithText(TextFormField, 'Email'))
      .or(find.widgetWithText(TextField, 'Email'));
  
  if (emailField.evaluate().isNotEmpty) {
    await tester.enterText(emailField.first, email);
    await tester.pump();
  }

  // Fill phone field
  final phoneField = find.byKey(const Key('phone_field'))
      .or(find.widgetWithText(TextFormField, 'Phone'))
      .or(find.widgetWithText(TextField, 'Phone Number'));
  
  if (phoneField.evaluate().isNotEmpty) {
    await tester.enterText(phoneField.first, phone);
    await tester.pump();
  }

  // Fill password field
  final passwordField = find.byKey(const Key('password_field'))
      .or(find.widgetWithText(TextFormField, 'Password'))
      .or(find.widgetWithText(TextField, 'Password'));
  
  if (passwordField.evaluate().isNotEmpty) {
    await tester.enterText(passwordField.first, password);
    await tester.pump();
  }

  await tester.pumpAndSettle();
}

Future<void> _submitRegistration(WidgetTester tester) async {
  final submitButton = find.text('Sign Up')
      .or(find.text('Register'))
      .or(find.text('Create Account'))
      .or(find.byKey(const Key('submit_registration')));

  if (submitButton.evaluate().isNotEmpty) {
    await tester.tap(submitButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }
}

Future<void> _verifyRegistrationSuccess(WidgetTester tester) async {
  // Look for success indicators
  final successIndicators = [
    find.text('Registration Successful'),
    find.text('Welcome'),
    find.text('Account Created'),
    find.textContaining('Verification'),
    find.byIcon(Icons.check_circle),
  ];

  bool foundSuccess = false;
  for (final indicator in successIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }

  expect(foundSuccess, true, reason: 'Registration success indicator not found');
}

Future<void> _navigateToLogin(WidgetTester tester) async {
  // Look for login button or link
  final loginButton = find.text('Login')
      .or(find.text('Sign In'))
      .or(find.textContaining('Already have an account'))
      .or(find.byKey(const Key('login_button')));

  if (loginButton.evaluate().isNotEmpty) {
    await tester.tap(loginButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _fillLoginForm(WidgetTester tester, String email, String password) async {
  // Fill email field
  final emailField = find.byKey(const Key('login_email_field'))
      .or(find.widgetWithText(TextFormField, 'Email'))
      .or(find.widgetWithText(TextField, 'Email'));
  
  if (emailField.evaluate().isNotEmpty) {
    await tester.enterText(emailField.first, email);
    await tester.pump();
  }

  // Fill password field
  final passwordField = find.byKey(const Key('login_password_field'))
      .or(find.widgetWithText(TextFormField, 'Password'))
      .or(find.widgetWithText(TextField, 'Password'));
  
  if (passwordField.evaluate().isNotEmpty) {
    await tester.enterText(passwordField.first, password);
    await tester.pump();
  }

  await tester.pumpAndSettle();
}

Future<void> _submitLogin(WidgetTester tester) async {
  final loginButton = find.text('Login')
      .or(find.text('Sign In'))
      .or(find.byKey(const Key('submit_login')));

  if (loginButton.evaluate().isNotEmpty) {
    await tester.tap(loginButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }
}

Future<void> _verifyLoginSuccess(WidgetTester tester) async {
  // Look for home screen or dashboard indicators
  final homeIndicators = [
    find.text('Home'),
    find.text('Dashboard'),
    find.text('Welcome back'),
    find.byIcon(Icons.home),
    find.byKey(const Key('home_screen')),
  ];

  bool foundHome = false;
  for (final indicator in homeIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundHome = true;
      break;
    }
  }

  expect(foundHome, true, reason: 'Login success - home screen not found');
}

Future<void> _navigateToAstrologerRegistration(WidgetTester tester) async {
  // Look for astrologer registration option
  final astrologerButton = find.text('Join as Astrologer')
      .or(find.text('Astrologer Registration'))
      .or(find.text('Become an Astrologer'))
      .or(find.byKey(const Key('astrologer_signup')));

  if (astrologerButton.evaluate().isNotEmpty) {
    await tester.tap(astrologerButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _fillAstrologerRegistrationForm(
  WidgetTester tester,
  String name,
  String email,
  String phone,
  String password,
) async {
  // Fill basic information (similar to customer registration)
  await _fillRegistrationForm(tester, name, email, phone, password);

  // Fill astrologer-specific fields
  final experienceField = find.byKey(const Key('experience_field'))
      .or(find.widgetWithText(TextFormField, 'Experience'))
      .or(find.widgetWithText(TextField, 'Years of Experience'));
  
  if (experienceField.evaluate().isNotEmpty) {
    await tester.enterText(experienceField.first, '5');
    await tester.pump();
  }

  // Select specializations
  final specializationField = find.text('Love & Relationships')
      .or(find.text('Career'))
      .or(find.byKey(const Key('specialization_love')));
  
  if (specializationField.evaluate().isNotEmpty) {
    await tester.tap(specializationField.first);
    await tester.pump();
  }

  await tester.pumpAndSettle();
}

Future<void> _submitAstrologerRegistration(WidgetTester tester) async {
  final submitButton = find.text('Submit Application')
      .or(find.text('Register as Astrologer'))
      .or(find.byKey(const Key('submit_astrologer_registration')));

  if (submitButton.evaluate().isNotEmpty) {
    await tester.tap(submitButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }
}

Future<void> _verifyAstrologerRegistrationSuccess(WidgetTester tester) async {
  final successIndicators = [
    find.text('Application Submitted'),
    find.text('Under Review'),
    find.text('Thank you'),
    find.textContaining('verification'),
  ];

  bool foundSuccess = false;
  for (final indicator in successIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }

  expect(foundSuccess, true, reason: 'Astrologer registration success not found');
}

Future<void> _tapForgotPassword(WidgetTester tester) async {
  final forgotPasswordLink = find.text('Forgot Password?')
      .or(find.textContaining('Forgot'))
      .or(find.byKey(const Key('forgot_password')));

  if (forgotPasswordLink.evaluate().isNotEmpty) {
    await tester.tap(forgotPasswordLink.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _fillPasswordResetForm(WidgetTester tester, String email) async {
  final emailField = find.byKey(const Key('reset_email_field'))
      .or(find.widgetWithText(TextFormField, 'Email'))
      .or(find.widgetWithText(TextField, 'Email'));
  
  if (emailField.evaluate().isNotEmpty) {
    await tester.enterText(emailField.first, email);
    await tester.pumpAndSettle();
  }
}

Future<void> _submitPasswordReset(WidgetTester tester) async {
  final resetButton = find.text('Reset Password')
      .or(find.text('Send Reset Link'))
      .or(find.byKey(const Key('submit_reset')));

  if (resetButton.evaluate().isNotEmpty) {
    await tester.tap(resetButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 2));
  }
}

Future<void> _verifyPasswordResetInitiated(WidgetTester tester) async {
  final successIndicators = [
    find.text('Reset Link Sent'),
    find.text('Check your email'),
    find.textContaining('sent to your email'),
  ];

  bool foundSuccess = false;
  for (final indicator in successIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }

  expect(foundSuccess, true, reason: 'Password reset confirmation not found');
}

// Additional helper methods for other authentication flows...
Future<void> _tapGoogleSignIn(WidgetTester tester) async {
  final googleButton = find.text('Continue with Google')
      .or(find.textContaining('Google'))
      .or(find.byKey(const Key('google_signin')));

  if (googleButton.evaluate().isNotEmpty) {
    await tester.tap(googleButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _handleGoogleSignInFlow(WidgetTester tester) async {
  // In integration tests, this would be mocked
  // For now, just wait and assume success
  await tester.pumpAndSettle(const Duration(seconds: 2));
}

Future<void> _verifySocialLoginSuccess(WidgetTester tester) async {
  await _verifyLoginSuccess(tester);
}

Future<void> _completeRegistrationForVerification(WidgetTester tester, String email) async {
  // Simplified registration for email verification test
  await _fillRegistrationForm(tester, 'Test User', email, '+919876543210', 'TestPass123!');
  await _submitRegistration(tester);
}

Future<void> _navigateToEmailVerification(WidgetTester tester) async {
  // Usually automatic after registration
  await tester.pumpAndSettle();
}

Future<void> _handleEmailVerification(WidgetTester tester) async {
  // Mock email verification process
  final verifyButton = find.text('Verify Email')
      .or(find.text('Resend'))
      .or(find.byKey(const Key('verify_email')));

  if (verifyButton.evaluate().isNotEmpty) {
    await tester.tap(verifyButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _verifyEmailVerificationSuccess(WidgetTester tester) async {
  final successIndicators = [
    find.text('Email Verified'),
    find.text('Verification Successful'),
    find.byIcon(Icons.verified),
  ];

  bool foundSuccess = false;
  for (final indicator in successIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }

  expect(foundSuccess, true, reason: 'Email verification success not found');
}

Future<void> _quickLogin(WidgetTester tester) async {
  // Quick login for other tests
  await _navigateToLogin(tester);
  await _fillLoginForm(tester, 'test@example.com', 'TestPass123!');
  await _submitLogin(tester);
}

Future<void> _navigateToProfile(WidgetTester tester) async {
  final profileButton = find.byIcon(Icons.person)
      .or(find.text('Profile'))
      .or(find.byKey(const Key('profile_tab')));

  if (profileButton.evaluate().isNotEmpty) {
    await tester.tap(profileButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _updateProfileInformation(WidgetTester tester) async {
  final editButton = find.text('Edit')
      .or(find.byIcon(Icons.edit))
      .or(find.byKey(const Key('edit_profile')));

  if (editButton.evaluate().isNotEmpty) {
    await tester.tap(editButton.first);
    await tester.pumpAndSettle();
  }

  // Update name field
  final nameField = find.byKey(const Key('profile_name_field'))
      .or(find.widgetWithText(TextFormField, 'Name'));
  
  if (nameField.evaluate().isNotEmpty) {
    await tester.enterText(nameField.first, 'Updated Test User');
    await tester.pump();
  }
}

Future<void> _saveProfileChanges(WidgetTester tester) async {
  final saveButton = find.text('Save')
      .or(find.text('Update'))
      .or(find.byKey(const Key('save_profile')));

  if (saveButton.evaluate().isNotEmpty) {
    await tester.tap(saveButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _verifyProfileUpdateSuccess(WidgetTester tester) async {
  final successIndicators = [
    find.text('Profile Updated'),
    find.text('Changes Saved'),
    find.text('Updated Test User'),
  ];

  bool foundSuccess = false;
  for (final indicator in successIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }

  expect(foundSuccess, true, reason: 'Profile update success not found');
}

Future<void> _navigateToSettingsMenu(WidgetTester tester) async {
  final menuButton = find.byIcon(Icons.menu)
      .or(find.byIcon(Icons.more_vert))
      .or(find.text('Settings'))
      .or(find.byKey(const Key('settings_menu')));

  if (menuButton.evaluate().isNotEmpty) {
    await tester.tap(menuButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _tapLogoutButton(WidgetTester tester) async {
  final logoutButton = find.text('Logout')
      .or(find.text('Sign Out'))
      .or(find.byKey(const Key('logout_button')));

  if (logoutButton.evaluate().isNotEmpty) {
    await tester.tap(logoutButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _confirmLogout(WidgetTester tester) async {
  final confirmButton = find.text('Confirm')
      .or(find.text('Yes'))
      .or(find.text('Logout'))
      .or(find.byKey(const Key('confirm_logout')));

  if (confirmButton.evaluate().isNotEmpty) {
    await tester.tap(confirmButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _verifyLogoutSuccess(WidgetTester tester) async {
  // Should be back to login/welcome screen
  final loginIndicators = [
    find.text('Login'),
    find.text('Sign In'),
    find.text('Welcome'),
    find.text('Get Started'),
  ];

  bool foundLogin = false;
  for (final indicator in loginIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundLogin = true;
      break;
    }
  }

  expect(foundLogin, true, reason: 'Logout success - login screen not found');
}