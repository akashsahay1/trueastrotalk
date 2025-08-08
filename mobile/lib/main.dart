import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'common/themes/app_theme.dart';
import 'config/config.dart';
import 'config/environment_config.dart';
import 'screens/onboarding.dart';
import 'screens/login.dart';
import 'screens/signup.dart';
import 'screens/home.dart';
import 'services/service_locator.dart';
import 'services/auth/auth_service.dart';
import 'models/enums.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: ".env");

  // Print environment configuration (debug only)
  EnvironmentConfig.printConfig();

  // Initialize Firebase
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (e) {
    // Firebase already initialized
  }

  // Setup service locator for dependency injection
  setupServiceLocator();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: Brightness.light, systemNavigationBarColor: Colors.transparent, systemNavigationBarIconBrightness: Brightness.dark));

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);

  runApp(const TrueAstrotalkApp());
}

class TrueAstrotalkApp extends StatelessWidget {
  const TrueAstrotalkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: Config.appName,
      debugShowCheckedModeBanner: false,

      // Theme configuration
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,

      // Initial route - Check auth state
      home: const AuthWrapper(),

      // Routes
      routes: {
        '/onboarding': (context) => const OnboardingScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const SignupScreen(),
        '/astrologer-signup': (context) => const SignupScreen(isAdvanced: true),
        '/customer/home': (context) => const CustomerHomeScreen(),
        '/astrologer/dashboard': (context) => const Scaffold(body: Center(child: Text('Dashboard - Coming Soon'))),
        '/forgot-password': (context) => const Scaffold(body: Center(child: Text('Forgot Password - Coming Soon'))),
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

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _checkAuthState();
  }

  Future<void> _checkAuthState() async {
    try {
      await _authService.initialize();
      setState(() {
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
      // User is logged in, check their role
      if (_authService.currentUser?.role == UserRole.customer) {
        return const CustomerHomeScreen();
      } else if (_authService.currentUser?.role == UserRole.astrologer) {
        // For astrologers, we might want to check verification status
        return const Scaffold(body: Center(child: Text('Astrologer Dashboard - Coming Soon')));
      }
    }

    // User is not logged in, show onboarding
    return const OnboardingScreen();
  }
}
