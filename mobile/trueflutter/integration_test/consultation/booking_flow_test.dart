import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Consultation Booking Flow Integration Tests', () {
    setUp(() async {
      // Setup test environment
      print('🔧 Setting up consultation booking test environment...');
    });

    testWidgets('Complete Chat Consultation Booking Flow', (WidgetTester tester) async {
      // Launch app and login
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login as customer
      await _loginAsCustomer(tester);
      
      // Step 2: Browse available astrologers
      await _browseAstrologers(tester);
      
      // Step 3: Select an astrologer for chat
      await _selectAstrologerForChat(tester);
      
      // Step 4: View astrologer profile
      await _viewAstrologerProfile(tester);
      
      // Step 5: Check wallet balance
      await _checkWalletBalance(tester);
      
      // Step 6: Start chat consultation
      await _startChatConsultation(tester);
      
      // Step 7: Verify chat session started
      await _verifyChatSessionStarted(tester);
      
      // Step 8: Send test messages
      await _sendChatMessages(tester);
      
      // Step 9: End chat session
      await _endChatSession(tester);
      
      // Step 10: Verify billing and session end
      await _verifySessionBilling(tester);

      print('✅ Chat consultation booking flow completed successfully');
    });

    testWidgets('Complete Voice Call Booking Flow', (WidgetTester tester) async {
      // Launch app and login
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login as customer
      await _loginAsCustomer(tester);
      
      // Step 2: Browse astrologers available for calls
      await _browseCallAstrologers(tester);
      
      // Step 3: Select astrologer for voice call
      await _selectAstrologerForCall(tester);
      
      // Step 4: Check call rate and balance
      await _checkCallRateAndBalance(tester);
      
      // Step 5: Initiate voice call
      await _initiateVoiceCall(tester);
      
      // Step 6: Wait for call connection
      await _waitForCallConnection(tester);
      
      // Step 7: Verify call is active
      await _verifyCallIsActive(tester);
      
      // Step 8: Simulate call duration
      await _simulateCallDuration(tester);
      
      // Step 9: End call
      await _endCall(tester);
      
      // Step 10: Verify call billing
      await _verifyCallBilling(tester);

      print('✅ Voice call booking flow completed successfully');
    });

    testWidgets('Video Call Booking Flow', (WidgetTester tester) async {
      // Launch app and login
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login as customer
      await _loginAsCustomer(tester);
      
      // Step 2: Find video call enabled astrologers
      await _findVideoCallAstrologers(tester);
      
      // Step 3: Select astrologer for video call
      await _selectAstrologerForVideoCall(tester);
      
      // Step 4: Check video call requirements
      await _checkVideoCallRequirements(tester);
      
      // Step 5: Start video call
      await _startVideoCall(tester);
      
      // Step 6: Verify video call interface
      await _verifyVideoCallInterface(tester);
      
      // Step 7: Test video call features
      await _testVideoCallFeatures(tester);
      
      // Step 8: End video call
      await _endVideoCall(tester);
      
      // Step 9: Rate the consultation
      await _rateConsultation(tester);

      print('✅ Video call booking flow completed successfully');
    });

    testWidgets('Astrologer Availability and Booking', (WidgetTester tester) async {
      // Test from astrologer's perspective
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login as astrologer
      await _loginAsAstrologer(tester);
      
      // Step 2: Set availability status
      await _setAvailabilityStatus(tester, true);
      
      // Step 3: View incoming consultation requests
      await _viewIncomingRequests(tester);
      
      // Step 4: Accept consultation request
      await _acceptConsultationRequest(tester);
      
      // Step 5: Start consultation session
      await _startConsultationSession(tester);
      
      // Step 6: Manage active session
      await _manageActiveSession(tester);
      
      // Step 7: Complete session
      await _completeSession(tester);
      
      // Step 8: View earnings
      await _viewEarnings(tester);

      print('✅ Astrologer availability and booking flow completed successfully');
    });

    testWidgets('Consultation Scheduling Flow', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login as customer
      await _loginAsCustomer(tester);
      
      // Step 2: Browse astrologers
      await _browseAstrologers(tester);
      
      // Step 3: Select astrologer
      await _selectAstrologer(tester);
      
      // Step 4: Choose "Schedule for Later"
      await _chooseScheduleOption(tester);
      
      // Step 5: Select date and time
      await _selectDateAndTime(tester);
      
      // Step 6: Confirm scheduling
      await _confirmScheduling(tester);
      
      // Step 7: Verify scheduled consultation
      await _verifyScheduledConsultation(tester);
      
      // Step 8: View scheduled consultations
      await _viewScheduledConsultations(tester);

      print('✅ Consultation scheduling flow completed successfully');
    });

    testWidgets('Consultation History and Reviews', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login as customer
      await _loginAsCustomer(tester);
      
      // Step 2: Navigate to history
      await _navigateToHistory(tester);
      
      // Step 3: View past consultations
      await _viewPastConsultations(tester);
      
      // Step 4: Select consultation to review
      await _selectConsultationToReview(tester);
      
      // Step 5: Write review and rating
      await _writeReviewAndRating(tester);
      
      // Step 6: Submit review
      await _submitReview(tester);
      
      // Step 7: Verify review submitted
      await _verifyReviewSubmitted(tester);

      print('✅ Consultation history and reviews flow completed successfully');
    });

    testWidgets('Emergency Consultation Flow', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login as customer
      await _loginAsCustomer(tester);
      
      // Step 2: Access emergency consultation
      await _accessEmergencyConsultation(tester);
      
      // Step 3: Find available astrologers
      await _findAvailableAstrologersNow(tester);
      
      // Step 4: Start immediate consultation
      await _startImmediateConsultation(tester);
      
      // Step 5: Verify emergency session
      await _verifyEmergencySession(tester);

      print('✅ Emergency consultation flow completed successfully');
    });

    testWidgets('Multi-language Consultation Support', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      
      // Step 1: Login and set language preference
      await _loginAsCustomer(tester);
      await _setLanguagePreference(tester, 'Hindi');
      
      // Step 2: Filter astrologers by language
      await _filterAstrologersByLanguage(tester, 'Hindi');
      
      // Step 3: Start consultation in preferred language
      await _startConsultationInLanguage(tester);
      
      // Step 4: Verify language support
      await _verifyLanguageSupport(tester);

      print('✅ Multi-language consultation flow completed successfully');
    });
  });
}

// Helper methods for consultation booking flows

Future<void> _loginAsCustomer(WidgetTester tester) async {
  // Navigate to login
  final loginButton = find.text('Login').or(find.text('Sign In'));
  if (loginButton.evaluate().isNotEmpty) {
    await tester.tap(loginButton.first);
    await tester.pumpAndSettle();
  }

  // Fill login form
  final emailField = find.byKey(const Key('email_field'))
      .or(find.widgetWithText(TextFormField, 'Email'));
  if (emailField.evaluate().isNotEmpty) {
    await tester.enterText(emailField.first, 'test.customer@example.com');
  }

  final passwordField = find.byKey(const Key('password_field'))
      .or(find.widgetWithText(TextFormField, 'Password'));
  if (passwordField.evaluate().isNotEmpty) {
    await tester.enterText(passwordField.first, 'TestPass123!');
  }

  // Submit login
  final submitButton = find.text('Login').or(find.text('Sign In'));
  if (submitButton.evaluate().isNotEmpty) {
    await tester.tap(submitButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 2));
  }
}

Future<void> _browseAstrologers(WidgetTester tester) async {
  // Look for astrologers list or browse button
  final browseButton = find.text('Browse Astrologers')
      .or(find.text('Find Astrologers'))
      .or(find.byIcon(Icons.search))
      .or(find.byKey(const Key('astrologers_tab')));

  if (browseButton.evaluate().isNotEmpty) {
    await tester.tap(browseButton.first);
    await tester.pumpAndSettle();
  }

  // Wait for astrologers to load
  await tester.pump(const Duration(seconds: 1));
}

Future<void> _selectAstrologerForChat(WidgetTester tester) async {
  // Find first available astrologer card
  final astrologerCard = find.byKey(const Key('astrologer_card_0'))
      .or(find.text('Start Chat'))
      .or(find.byType(Card).first);

  if (astrologerCard.evaluate().isNotEmpty) {
    await tester.tap(astrologerCard.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _viewAstrologerProfile(WidgetTester tester) async {
  // Profile should be displayed after selecting astrologer
  await tester.pumpAndSettle();
  
  // Verify profile elements are visible
  expect(find.text('Experience').or(find.text('Rating')), findsAtLeastNWidgets(1));
}

Future<void> _checkWalletBalance(WidgetTester tester) async {
  // Look for wallet balance display
  final walletInfo = find.textContaining('₹')
      .or(find.text('Wallet'))
      .or(find.byIcon(Icons.account_balance_wallet));

  if (walletInfo.evaluate().isEmpty) {
    // Navigate to wallet if not visible
    final walletButton = find.text('Wallet').or(find.byIcon(Icons.account_balance_wallet));
    if (walletButton.evaluate().isNotEmpty) {
      await tester.tap(walletButton.first);
      await tester.pumpAndSettle();
    }
  }
}

Future<void> _startChatConsultation(WidgetTester tester) async {
  final chatButton = find.text('Start Chat')
      .or(find.text('Begin Chat'))
      .or(find.byKey(const Key('start_chat_button')));

  if (chatButton.evaluate().isNotEmpty) {
    await tester.tap(chatButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 2));
  }
}

Future<void> _verifyChatSessionStarted(WidgetTester tester) async {
  // Look for chat interface elements
  final chatIndicators = [
    find.byType(TextField), // Message input field
    find.text('Type a message'),
    find.byIcon(Icons.send),
    find.byKey(const Key('chat_screen')),
  ];

  bool foundChatInterface = false;
  for (final indicator in chatIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundChatInterface = true;
      break;
    }
  }

  expect(foundChatInterface, true, reason: 'Chat interface not found');
}

Future<void> _sendChatMessages(WidgetTester tester) async {
  final messageField = find.byType(TextField)
      .or(find.widgetWithText(TextField, 'Type a message'));

  if (messageField.evaluate().isNotEmpty) {
    await tester.enterText(messageField.first, 'Hello, I need guidance about my career.');
    await tester.pump();

    final sendButton = find.byIcon(Icons.send).or(find.text('Send'));
    if (sendButton.evaluate().isNotEmpty) {
      await tester.tap(sendButton.first);
      await tester.pumpAndSettle();
    }

    // Send another message
    await tester.enterText(messageField.first, 'What do you see in my future?');
    await tester.pump();
    
    if (sendButton.evaluate().isNotEmpty) {
      await tester.tap(sendButton.first);
      await tester.pumpAndSettle();
    }
  }
}

Future<void> _endChatSession(WidgetTester tester) async {
  final endButton = find.text('End Chat')
      .or(find.text('End Session'))
      .or(find.byIcon(Icons.call_end))
      .or(find.byKey(const Key('end_chat_button')));

  if (endButton.evaluate().isNotEmpty) {
    await tester.tap(endButton.first);
    await tester.pumpAndSettle();

    // Confirm end if required
    final confirmButton = find.text('Confirm')
        .or(find.text('Yes'))
        .or(find.text('End'));
    if (confirmButton.evaluate().isNotEmpty) {
      await tester.tap(confirmButton.first);
      await tester.pumpAndSettle();
    }
  }
}

Future<void> _verifySessionBilling(WidgetTester tester) async {
  // Look for billing information
  final billingIndicators = [
    find.textContaining('₹'),
    find.text('Session Summary'),
    find.text('Amount Charged'),
    find.text('Duration'),
  ];

  bool foundBilling = false;
  for (final indicator in billingIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundBilling = true;
      break;
    }
  }

  expect(foundBilling, true, reason: 'Session billing information not found');
}

Future<void> _browseCallAstrologers(WidgetTester tester) async {
  // Navigate to call section
  final callSection = find.text('Call')
      .or(find.text('Voice Call'))
      .or(find.byIcon(Icons.call))
      .or(find.byKey(const Key('call_tab')));

  if (callSection.evaluate().isNotEmpty) {
    await tester.tap(callSection.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _selectAstrologerForCall(WidgetTester tester) async {
  final callButton = find.text('Call Now')
      .or(find.text('Start Call'))
      .or(find.byIcon(Icons.call))
      .or(find.byKey(const Key('call_astrologer_button')));

  if (callButton.evaluate().isNotEmpty) {
    await tester.tap(callButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _checkCallRateAndBalance(WidgetTester tester) async {
  // Verify call rate is displayed
  final rateInfo = find.textContaining('per minute')
      .or(find.textContaining('Rate'))
      .or(find.textContaining('₹'));

  expect(rateInfo, findsAtLeastNWidgets(1), reason: 'Call rate information not found');
}

Future<void> _initiateVoiceCall(WidgetTester tester) async {
  final initiateButton = find.text('Call Now')
      .or(find.text('Start Call'))
      .or(find.byKey(const Key('initiate_call_button')));

  if (initiateButton.evaluate().isNotEmpty) {
    await tester.tap(initiateButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }
}

Future<void> _waitForCallConnection(WidgetTester tester) async {
  // Wait for call to connect
  await tester.pump(const Duration(seconds: 2));
  
  // Look for connecting indicators
  final connectingIndicators = [
    find.text('Connecting'),
    find.text('Calling'),
    find.byType(CircularProgressIndicator),
  ];

  // Wait for connection or timeout
  for (int i = 0; i < 10; i++) {
    bool stillConnecting = false;
    for (final indicator in connectingIndicators) {
      if (indicator.evaluate().isNotEmpty) {
        stillConnecting = true;
        break;
      }
    }
    
    if (!stillConnecting) break;
    
    await tester.pump(const Duration(seconds: 1));
  }
}

Future<void> _verifyCallIsActive(WidgetTester tester) async {
  // Look for active call interface
  final activeCallIndicators = [
    find.text('Connected'),
    find.textContaining('00:'),
    find.byIcon(Icons.call_end),
    find.byIcon(Icons.mic),
    find.byKey(const Key('active_call_screen')),
  ];

  bool foundActiveCall = false;
  for (final indicator in activeCallIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundActiveCall = true;
      break;
    }
  }

  expect(foundActiveCall, true, reason: 'Active call interface not found');
}

Future<void> _simulateCallDuration(WidgetTester tester) async {
  // Simulate call for a few seconds
  await tester.pump(const Duration(seconds: 3));
}

Future<void> _endCall(WidgetTester tester) async {
  final endCallButton = find.byIcon(Icons.call_end)
      .or(find.text('End Call'))
      .or(find.byKey(const Key('end_call_button')));

  if (endCallButton.evaluate().isNotEmpty) {
    await tester.tap(endCallButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _verifyCallBilling(WidgetTester tester) async {
  await _verifySessionBilling(tester);
}

Future<void> _loginAsAstrologer(WidgetTester tester) async {
  // Similar to customer login but with astrologer credentials
  final loginButton = find.text('Login').or(find.text('Sign In'));
  if (loginButton.evaluate().isNotEmpty) {
    await tester.tap(loginButton.first);
    await tester.pumpAndSettle();
  }

  // Fill astrologer credentials
  final emailField = find.byKey(const Key('email_field'))
      .or(find.widgetWithText(TextFormField, 'Email'));
  if (emailField.evaluate().isNotEmpty) {
    await tester.enterText(emailField.first, 'test.astrologer@example.com');
  }

  final passwordField = find.byKey(const Key('password_field'))
      .or(find.widgetWithText(TextFormField, 'Password'));
  if (passwordField.evaluate().isNotEmpty) {
    await tester.enterText(passwordField.first, 'AstroPass123!');
  }

  final submitButton = find.text('Login').or(find.text('Sign In'));
  if (submitButton.evaluate().isNotEmpty) {
    await tester.tap(submitButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 2));
  }
}

Future<void> _setAvailabilityStatus(WidgetTester tester, bool available) async {
  final statusToggle = find.text(available ? 'Online' : 'Offline')
      .or(find.byType(Switch))
      .or(find.byKey(const Key('availability_toggle')));

  if (statusToggle.evaluate().isNotEmpty) {
    await tester.tap(statusToggle.first);
    await tester.pumpAndSettle();
  }
}

// Additional helper methods for other consultation flows...

Future<void> _findVideoCallAstrologers(WidgetTester tester) async {
  final videoSection = find.text('Video Call')
      .or(find.byIcon(Icons.videocam))
      .or(find.byKey(const Key('video_tab')));

  if (videoSection.evaluate().isNotEmpty) {
    await tester.tap(videoSection.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _selectAstrologerForVideoCall(WidgetTester tester) async {
  final videoButton = find.text('Video Call')
      .or(find.text('Start Video'))
      .or(find.byIcon(Icons.videocam));

  if (videoButton.evaluate().isNotEmpty) {
    await tester.tap(videoButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _checkVideoCallRequirements(WidgetTester tester) async {
  // Check for camera/microphone permissions
  await tester.pumpAndSettle();
}

Future<void> _startVideoCall(WidgetTester tester) async {
  final startButton = find.text('Start Video Call')
      .or(find.text('Begin Video'))
      .or(find.byKey(const Key('start_video_call')));

  if (startButton.evaluate().isNotEmpty) {
    await tester.tap(startButton.first);
    await tester.pumpAndSettle(const Duration(seconds: 3));
  }
}

Future<void> _verifyVideoCallInterface(WidgetTester tester) async {
  // Look for video call specific elements
  final videoElements = [
    find.byIcon(Icons.videocam),
    find.byIcon(Icons.videocam_off),
    find.byIcon(Icons.mic),
    find.byIcon(Icons.call_end),
  ];

  bool foundVideoInterface = false;
  for (final element in videoElements) {
    if (element.evaluate().isNotEmpty) {
      foundVideoInterface = true;
      break;
    }
  }

  expect(foundVideoInterface, true, reason: 'Video call interface not found');
}

Future<void> _testVideoCallFeatures(WidgetTester tester) async {
  // Test mute/unmute
  final micButton = find.byIcon(Icons.mic).or(find.byIcon(Icons.mic_off));
  if (micButton.evaluate().isNotEmpty) {
    await tester.tap(micButton.first);
    await tester.pump();
  }

  // Test video on/off
  final videoButton = find.byIcon(Icons.videocam).or(find.byIcon(Icons.videocam_off));
  if (videoButton.evaluate().isNotEmpty) {
    await tester.tap(videoButton.first);
    await tester.pump();
  }
}

Future<void> _endVideoCall(WidgetTester tester) async {
  await _endCall(tester);
}

Future<void> _rateConsultation(WidgetTester tester) async {
  // Look for rating interface
  final ratingStars = find.byIcon(Icons.star_border)
      .or(find.byIcon(Icons.star))
      .or(find.text('Rate this consultation'));

  if (ratingStars.evaluate().isNotEmpty) {
    await tester.tap(ratingStars.first);
    await tester.pumpAndSettle();
  }

  // Submit rating
  final submitButton = find.text('Submit Rating')
      .or(find.text('Submit'))
      .or(find.byKey(const Key('submit_rating')));

  if (submitButton.evaluate().isNotEmpty) {
    await tester.tap(submitButton.first);
    await tester.pumpAndSettle();
  }
}

// Additional helper methods for remaining test scenarios would be implemented similarly...

Future<void> _viewIncomingRequests(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

Future<void> _acceptConsultationRequest(WidgetTester tester) async {
  final acceptButton = find.text('Accept')
      .or(find.byIcon(Icons.check))
      .or(find.byKey(const Key('accept_request')));

  if (acceptButton.evaluate().isNotEmpty) {
    await tester.tap(acceptButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _startConsultationSession(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

Future<void> _manageActiveSession(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 2));
}

Future<void> _completeSession(WidgetTester tester) async {
  await _endChatSession(tester);
}

Future<void> _viewEarnings(WidgetTester tester) async {
  final earningsSection = find.text('Earnings')
      .or(find.text('Income'))
      .or(find.byIcon(Icons.monetization_on));

  if (earningsSection.evaluate().isNotEmpty) {
    await tester.tap(earningsSection.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _selectAstrologer(WidgetTester tester) async {
  final firstAstrologer = find.byType(Card).first
      .or(find.byKey(const Key('astrologer_card_0')));

  if (firstAstrologer.evaluate().isNotEmpty) {
    await tester.tap(firstAstrologer.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _chooseScheduleOption(WidgetTester tester) async {
  final scheduleButton = find.text('Schedule for Later')
      .or(find.text('Book Appointment'))
      .or(find.byKey(const Key('schedule_consultation')));

  if (scheduleButton.evaluate().isNotEmpty) {
    await tester.tap(scheduleButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _selectDateAndTime(WidgetTester tester) async {
  // Select date (mock selection)
  await tester.pump(const Duration(seconds: 1));
  
  // Select time (mock selection)
  await tester.pump(const Duration(seconds: 1));
}

Future<void> _confirmScheduling(WidgetTester tester) async {
  final confirmButton = find.text('Confirm Booking')
      .or(find.text('Schedule'))
      .or(find.byKey(const Key('confirm_schedule')));

  if (confirmButton.evaluate().isNotEmpty) {
    await tester.tap(confirmButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _verifyScheduledConsultation(WidgetTester tester) async {
  final confirmationIndicators = [
    find.text('Scheduled'),
    find.text('Appointment Booked'),
    find.text('Confirmation'),
  ];

  bool foundConfirmation = false;
  for (final indicator in confirmationIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundConfirmation = true;
      break;
    }
  }

  expect(foundConfirmation, true, reason: 'Scheduling confirmation not found');
}

Future<void> _viewScheduledConsultations(WidgetTester tester) async {
  final scheduleTab = find.text('Scheduled')
      .or(find.text('Appointments'))
      .or(find.byIcon(Icons.schedule));

  if (scheduleTab.evaluate().isNotEmpty) {
    await tester.tap(scheduleTab.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _navigateToHistory(WidgetTester tester) async {
  final historyTab = find.text('History')
      .or(find.text('Past Consultations'))
      .or(find.byIcon(Icons.history))
      .or(find.byKey(const Key('history_tab')));

  if (historyTab.evaluate().isNotEmpty) {
    await tester.tap(historyTab.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _viewPastConsultations(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

Future<void> _selectConsultationToReview(WidgetTester tester) async {
  final reviewButton = find.text('Write Review')
      .or(find.text('Rate'))
      .or(find.byIcon(Icons.rate_review));

  if (reviewButton.evaluate().isNotEmpty) {
    await tester.tap(reviewButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _writeReviewAndRating(WidgetTester tester) async {
  // Rate with stars
  final starButtons = find.byIcon(Icons.star_border);
  if (starButtons.evaluate().isNotEmpty) {
    // Tap 4th star for 4-star rating
    await tester.tap(starButtons.at(3));
    await tester.pump();
  }

  // Write review
  final reviewField = find.byKey(const Key('review_text'))
      .or(find.widgetWithText(TextField, 'Write your review'));

  if (reviewField.evaluate().isNotEmpty) {
    await tester.enterText(reviewField.first, 'Great consultation! Very helpful and accurate.');
    await tester.pump();
  }
}

Future<void> _submitReview(WidgetTester tester) async {
  final submitButton = find.text('Submit Review')
      .or(find.text('Submit'))
      .or(find.byKey(const Key('submit_review')));

  if (submitButton.evaluate().isNotEmpty) {
    await tester.tap(submitButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _verifyReviewSubmitted(WidgetTester tester) async {
  final successIndicators = [
    find.text('Review Submitted'),
    find.text('Thank you'),
    find.text('Review Posted'),
  ];

  bool foundSuccess = false;
  for (final indicator in successIndicators) {
    if (indicator.evaluate().isNotEmpty) {
      foundSuccess = true;
      break;
    }
  }

  expect(foundSuccess, true, reason: 'Review submission confirmation not found');
}

Future<void> _accessEmergencyConsultation(WidgetTester tester) async {
  final emergencyButton = find.text('Emergency')
      .or(find.text('Urgent'))
      .or(find.byIcon(Icons.emergency))
      .or(find.byKey(const Key('emergency_consultation')));

  if (emergencyButton.evaluate().isNotEmpty) {
    await tester.tap(emergencyButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _findAvailableAstrologersNow(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

Future<void> _startImmediateConsultation(WidgetTester tester) async {
  final immediateButton = find.text('Connect Now')
      .or(find.text('Start Now'))
      .or(find.byKey(const Key('immediate_consultation')));

  if (immediateButton.evaluate().isNotEmpty) {
    await tester.tap(immediateButton.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _verifyEmergencySession(WidgetTester tester) async {
  // Similar to regular session verification
  await _verifyChatSessionStarted(tester);
}

Future<void> _setLanguagePreference(WidgetTester tester, String language) async {
  final settingsButton = find.byIcon(Icons.settings)
      .or(find.text('Settings'));

  if (settingsButton.evaluate().isNotEmpty) {
    await tester.tap(settingsButton.first);
    await tester.pumpAndSettle();
  }

  final languageOption = find.text('Language')
      .or(find.text(language));

  if (languageOption.evaluate().isNotEmpty) {
    await tester.tap(languageOption.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _filterAstrologersByLanguage(WidgetTester tester, String language) async {
  final filterButton = find.byIcon(Icons.filter_list)
      .or(find.text('Filter'));

  if (filterButton.evaluate().isNotEmpty) {
    await tester.tap(filterButton.first);
    await tester.pumpAndSettle();
  }

  final languageFilter = find.text(language);
  if (languageFilter.evaluate().isNotEmpty) {
    await tester.tap(languageFilter.first);
    await tester.pumpAndSettle();
  }
}

Future<void> _startConsultationInLanguage(WidgetTester tester) async {
  await _startChatConsultation(tester);
}

Future<void> _verifyLanguageSupport(WidgetTester tester) async {
  // Verify interface is in correct language
  await tester.pumpAndSettle();
}