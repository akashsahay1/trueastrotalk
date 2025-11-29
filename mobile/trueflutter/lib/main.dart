import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'firebase_options.dart';
import 'common/themes/app_theme.dart';
import 'config/config.dart';
import 'screens/onboarding.dart';
import 'screens/welcome.dart';
import 'screens/auth/unified_auth_screen.dart';
import 'screens/auth/signup_completion_screen.dart';
import 'screens/otp_verification.dart';
import 'screens/signup.dart';
import 'screens/home.dart';
import 'screens/orders_list.dart';
import 'screens/consultation_details_screen.dart';
import 'screens/astrologer_consultations_screen.dart';
import 'services/service_locator.dart';
import 'services/auth/auth_service.dart';
import 'services/local/local_storage_service.dart';
import 'services/cart_service.dart';
import 'services/network/dio_client.dart';
import 'services/payment/razorpay_service.dart';
import 'services/deep_link_service.dart';
import 'services/app_info_service.dart';
import 'services/api/user_api_service.dart';

/// Firebase background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Initialize Firebase if not already initialized
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('🔔 Handling background message: ${message.messageId}');
  // Handle the message in background
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

  // Initialize Firebase
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('❌ Firebase initialization failed: $e');
  }

  // Setup service locator for dependency injection
  setupServiceLocator();

  // Initialize local storage
  final localStorage = getIt<LocalStorageService>();
  await localStorage.init();

  // Initialize cart service
  final cartService = getIt<CartService>();
  await cartService.initialize();

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

class TrueAstrotalkApp extends StatelessWidget {
  const TrueAstrotalkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: Config.appName,
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey, // Global navigator key for deep linking
      // Theme configuration
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,

      // Initial route - Check auth state
      home: const AuthWrapper(),

      // Routes
      routes: {
        '/onboarding': (context) => const OnboardingScreen(),
        '/welcome': (context) => const WelcomeScreen(),

        // Unified auth flow
        '/auth': (context) => const UnifiedAuthScreen(),
        '/signup-completion': (context) => const SignupCompletionScreen(),
        '/otp-verification': (context) => const OTPVerificationScreen(),

        // Astrologer signup (uses advanced multi-page form)
        '/astrologer-signup': (context) => const SignupScreen(isAdvanced: true),

        // Home screens
        '/home': (context) => const HomeScreen(),
        '/customer/home': (context) => const HomeScreen(),
        '/astrologer/dashboard': (context) => const HomeScreen(),
        '/astrologer/pending': (context) => const Scaffold(
          body: Center(child: Text('Astrologer Account Pending Approval')),
        ),

        // Other screens
        '/orders': (context) => const OrdersListScreen(),
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
      // User is logged in, show the home screen (it handles role-based UI internally)
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
