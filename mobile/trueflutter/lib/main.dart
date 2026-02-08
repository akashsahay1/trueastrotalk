import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_callkit_incoming/flutter_callkit_incoming.dart';
import 'package:flutter_callkit_incoming/entities/entities.dart';
import 'package:uuid/uuid.dart';
import 'firebase_options.dart';
import 'config/config.dart';
import 'screens/onboarding/onboarding.dart';
import 'screens/onboarding/welcome.dart';
import 'screens/auth/login.dart';
import 'screens/auth/signup_completion.dart';
import 'screens/auth/otp_verification.dart';
import 'screens/auth/signup.dart';
import 'screens/home/home.dart';
import 'screens/shop/orders_list.dart';
import 'screens/wallet/wallet.dart';
import 'screens/consultation/details.dart';
import 'screens/astrologer/consultations.dart';
import 'services/service_locator.dart';
import 'services/auth/auth_service.dart';
import 'services/theme/theme_service.dart';
import 'services/local/local_storage_service.dart';
import 'services/network/dio_client.dart';
import 'services/payment/razorpay_service.dart';
import 'services/deep_link_service.dart';
import 'services/app_info_service.dart';
import 'services/api/user_api_service.dart';

/// Firebase background message handler - must be top-level function
/// This shows native CallKit UI for incoming calls when app is in background/killed
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Only initialize Firebase if not already initialized (prevents duplicate-app error on Android)
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  }
  debugPrint('🔔 Handling background message: ${message.messageId}');
  debugPrint('🔔 Message data: ${message.data}');

  // Check if this is an incoming call notification
  final data = message.data;
  final notificationType = data['type'];

  if (notificationType == 'incoming_call') {
    debugPrint('📞 Incoming call notification received in background');
    await _showCallKitIncoming(data);
  }
}

/// Show native CallKit incoming call UI
Future<void> _showCallKitIncoming(Map<String, dynamic> data) async {
  try {
    final uuid = const Uuid().v4();
    final callerName = data['caller_name'] ?? data['nameCaller'] ?? 'Unknown Caller';
    final callType = data['call_type'] ?? 'voice';
    final sessionId = data['session_id'] ?? '';
    final callerId = data['caller_id'] ?? '';

    // Parse astrologer data if available
    Map<String, dynamic>? astrologerData;
    if (data['astrologer'] != null && data['astrologer'].toString().isNotEmpty) {
      try {
        astrologerData = jsonDecode(data['astrologer']);
      } catch (e) {
        debugPrint('⚠️ Failed to parse astrologer data: $e');
      }
    }

    // Prepare extra data to pass through CallKit
    final Map<String, dynamic> extra = {
      'type': 'incoming_call',
      'caller_id': callerId,
      'caller_name': callerName,
      'call_type': callType,
      'session_id': sessionId,
      'rate_per_minute': data['rate_per_minute'] ?? '0',
      if (astrologerData != null) 'astrologer': astrologerData,
    };

    final params = CallKitParams(
      id: uuid,
      nameCaller: callerName,
      appName: 'True Astrotalk',
      avatar: null,
      handle: callerId,
      type: callType == 'video' ? 1 : 0, // 0 = audio, 1 = video
      textAccept: 'Accept',
      textDecline: 'Decline',
      missedCallNotification: const NotificationParams(
        showNotification: true,
        isShowCallback: false,
        subtitle: 'Missed call',
        callbackText: 'Call back',
      ),
      duration: 45000, // Ring for 45 seconds
      extra: extra,
      headers: <String, dynamic>{},
      android: const AndroidParams(
        isCustomNotification: false,
        isShowLogo: true,
        ringtonePath: 'system_ringtone_default',
        backgroundColor: '#FF6A1B',
        backgroundUrl: null,
        actionColor: '#4CAF50',
        textColor: '#ffffff',
        incomingCallNotificationChannelName: 'Incoming Calls',
        missedCallNotificationChannelName: 'Missed Calls',
        isShowCallID: false,
        isShowFullLockedScreen: true,
      ),
      ios: const IOSParams(
        iconName: 'CallKitLogo',
        handleType: 'generic',
        supportsVideo: true,
        maximumCallGroups: 1,
        maximumCallsPerCallGroup: 1,
        audioSessionMode: 'default',
        audioSessionActive: true,
        audioSessionPreferredSampleRate: 44100.0,
        audioSessionPreferredIOBufferDuration: 0.005,
        supportsDTMF: false,
        supportsHolding: false,
        supportsGrouping: false,
        supportsUngrouping: false,
        ringtonePath: 'system_ringtone_default',
      ),
    );

    await FlutterCallkitIncoming.showCallkitIncoming(params);
    debugPrint('📞 CallKit incoming call shown from background handler');
  } catch (e) {
    debugPrint('❌ Failed to show CallKit from background: $e');
  }
}

/// Initialize app dependencies during splash screen
Future<void> _initializeAppDependencies() async {
  try {
    debugPrint('🔧 Initializing app dependencies...');

    // Fetch and cache astrologer options (skills and languages)
    final userApiService = getIt<UserApiService>();
    final options = await userApiService.getAstrologerOptions();

    // Save to SharedPreferences for offline access
    final prefs = await SharedPreferences.getInstance();
    final skills = options['skills'] ?? <String>[];
    final languages = options['languages'] ?? <String>[];

    await prefs.setStringList('astrologer_skills', skills);
    await prefs.setStringList('astrologer_languages', languages);

    debugPrint('✅ Dependencies initialized successfully'); 
    debugPrint('   Skills: ${skills.length}, Languages: ${languages.length}');
  } catch (e) {
    // Log error but don't block app launch
    debugPrint('⚠️ Failed to initialize dependencies: $e');
    debugPrint('   App will continue with cached data if available');
  }
}

void main() async {
  // Preserve the native splash screen
  final widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  debugPrint('🚀 Starting app initialization...');

  // Initialize network client with auto IP detection
  await DioClient.initialize();

  // Initialize app info service
  await AppInfoService.initialize();

  // Print configuration in debug mode
  await Config.printConfig();

  // Initialize Firebase (handles duplicate-app error gracefully during hot reload)
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      debugPrint('✅ Firebase initialized successfully');
    } else {
      debugPrint('✅ Firebase already initialized, reusing existing app');
    }

    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } on FirebaseException catch (e) {
    // Handle duplicate-app error gracefully - Firebase is already initialized
    if (e.code == 'duplicate-app') {
      debugPrint('✅ Firebase already initialized (duplicate-app), continuing...');
    } else {
      debugPrint('❌ Firebase initialization failed: $e');
    }
  } catch (e) {
    debugPrint('❌ Firebase initialization failed: $e');
  }

  // Setup service locator for dependency injection
  setupServiceLocator();

  // Initialize local storage
  final localStorage = getIt<LocalStorageService>();
  await localStorage.init();

  // Note: Cart service initialization moved to after user login (in AuthService)
  // This prevents fetching GST rate before user is authenticated

  // Initialize payment services (without server config - will load when user logs in)
  try {
    debugPrint('🔧 Initializing RazorpayService...');
    RazorpayService.instance.initialize();
    debugPrint('✅ Payment services initialized successfully');
  } catch (e) {
    debugPrint('❌ Payment service initialization failed: $e');
  }

  // Initialize app dependencies (astrologer options, etc.)
  await _initializeAppDependencies();

  debugPrint('✅ App initialization complete!');

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize deep linking service
  DeepLinkService().initialize();

  runApp(const TrueAstrotalkApp());
}

class TrueAstrotalkApp extends StatefulWidget {
  const TrueAstrotalkApp({super.key});

  @override
  State<TrueAstrotalkApp> createState() => _TrueAstrotalkAppState();
}

class _TrueAstrotalkAppState extends State<TrueAstrotalkApp> {
  late final ThemeService _themeService;

  @override
  void initState() {
    super.initState();
    _themeService = getIt<ThemeService>();
    _themeService.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    _themeService.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: Config.appName,
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey, // Global navigator key for deep linking
      // Theme configuration - dynamic based on user type
      theme: _themeService.currentTheme,
      themeMode: ThemeMode.light,

      // Initial route - Check auth state
      home: const AuthWrapper(),

      // Routes
      routes: {
        '/onboarding': (context) => const OnboardingScreen(),
        '/welcome': (context) => const WelcomeScreen(),

        // Unified auth flow
        '/auth': (context) => const LoginScreen(),
        '/signup-completion': (context) => const SignupCompletionScreen(),
        '/otp-verification': (context) => const OTPVerificationScreen(),

        // Astrologer signup (simplified quick signup)
        '/astrologer-signup': (context) => const AstrologerSignupScreen(),

        // Home screens
        '/home': (context) => const HomeScreen(),
        '/customer/home': (context) => const HomeScreen(),
        '/astrologer/dashboard': (context) => const HomeScreen(),
        '/astrologer/pending': (context) => const Scaffold(
          body: Center(child: Text('Astrologer Account Pending Approval')),
        ),

        // Other screens
        '/orders': (context) => const OrdersListScreen(),
        '/wallet': (context) => const WalletScreen(),
      },

      // Handle routes with arguments
      onGenerateRoute: (settings) {
        if (settings.name == '/consultation-details') {
          final args = settings.arguments as Map<String, dynamic>?;
          if (args != null && args['consultation'] is ConsultationItem) {
            return MaterialPageRoute(
              builder: (context) => ConsultationDetailsScreen(
                consultation: args['consultation'] as ConsultationItem,
                isAstrologer: args['isAstrologer'] as bool? ?? false,
              ),
            );
          }
        }
        return null;
      },

      // Builder for global configurations
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(1.0), // Prevent text scaling
          ),
          child: child!,
        );
      },
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  late final AuthService _authService;
  bool _isLoading = true;
  bool _isOnboardingCompleted = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _checkInitialState();
  }

  Future<void> _checkInitialState() async {
    try {
      // Check if onboarding has been completed
      final prefs = await SharedPreferences.getInstance();
      final onboardingCompleted =
          prefs.getBool('onboarding_completed') ?? false;

      // Initialize auth service
      await _authService.initialize();

      setState(() {
        _isOnboardingCompleted = onboardingCompleted;
        _isLoading = false;
      });

      // Remove native splash screen now that app is ready
      FlutterNativeSplash.remove();
      debugPrint('🎨 Native splash removed - app ready!');
    } catch (e) {
      setState(() {
        _isLoading = false;
      });

      // Remove splash even if there's an error
      FlutterNativeSplash.remove();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      // Native splash is still showing, return empty scaffold
      return const Scaffold(
        backgroundColor: Colors.white,
        body: SizedBox.shrink(),
      );
    }

    if (_authService.isLoggedIn) {
      final user = _authService.currentUser;

      // Check if profile is complete (has full_name)
      if (user?.name == null || user!.name.isEmpty) {
        // Profile incomplete, go to signup completion
        return const SignupCompletionScreen();
      }

      // User is logged in with complete profile, show the home screen
      return const HomeScreen();
    }

    // User is not logged in
    if (!_isOnboardingCompleted) {
      // First time user - show onboarding
      return const OnboardingScreen();
    }

    // Returning user who has seen onboarding - show welcome screen
    return const WelcomeScreen();
  }
}
