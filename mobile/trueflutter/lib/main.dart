import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'firebase_options.dart';
import 'common/themes/app_theme.dart';
import 'config/config.dart';
import 'screens/onboarding.dart';
import 'screens/welcome.dart';
import 'screens/login.dart';
import 'screens/signup.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/home.dart';
import 'screens/orders_list.dart';
import 'services/service_locator.dart';
import 'services/auth/auth_service.dart';
import 'services/local/local_storage_service.dart';
import 'services/cart_service.dart';
import 'services/network/dio_client.dart';
import 'services/payment/razorpay_service.dart';
import 'services/notifications/notification_service.dart';
import 'services/deep_link_service.dart';
import 'services/app_info_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

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
        '/login': (context) => const LoginScreen(),
        '/signup': (context) => const SignupScreen(),
        '/register': (context) => const SignupScreen(),
        '/astrologer-signup': (context) => const SignupScreen(isAdvanced: true),
        '/home': (context) => const HomeScreen(),
        '/customer/home': (context) => const HomeScreen(),
        '/astrologer/dashboard': (context) => const HomeScreen(),
        '/astrologer/pending': (context) => const Scaffold(
          body: Center(child: Text('Astrologer Account Pending Approval')),
        ),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/orders': (context) => const OrdersListScreen(),
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
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
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
