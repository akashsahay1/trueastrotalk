import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app_links/app_links.dart';
import 'package:trueastrotalk/models/astrologer.dart';
import 'package:trueastrotalk/screens/chatmessage.dart';
import 'package:trueastrotalk/screens/chatrequest.dart';
import 'package:trueastrotalk/screens/forgotpass.dart';
import 'dart:async';
import 'dart:io' show Platform;
import 'package:trueastrotalk/screens/init.dart';
import 'package:trueastrotalk/screens/intro.dart';
import 'package:trueastrotalk/screens/login.dart';
import 'package:trueastrotalk/screens/newpassword.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:trueastrotalk/screens/signup.dart';
import 'package:trueastrotalk/services/astrologer.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:trueastrotalk/services/tokens.dart';

// Define global FlutterLocalNotificationsPlugin for showing notifications when app is in foreground
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

// Background message handler - must be top-level function
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");
}

// Helper function to detect iOS simulator
Future<bool> _isIOSSimulator() async {
  if (!Platform.isIOS) return false;

  DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
  IosDeviceInfo iosInfo = await deviceInfo.iosInfo;

  return !iosInfo.isPhysicalDevice;
}

// Setup Firebase messaging with simulator check
Future<void> setupFirebaseMessaging() async {
  try {
    // Skip FCM setup for iOS simulators
    if (Platform.isIOS) {
      bool isSimulator = await _isIOSSimulator();
      if (isSimulator) {
        print('Running on iOS simulator - skipping FCM token setup');
        return;
      }
    }

    // Request notification permissions for iOS
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    print('User notification settings: ${settings.authorizationStatus}');

    // Wait a moment for permissions to be processed
    await Future.delayed(Duration(milliseconds: 500));

    // Get and update FCM token using the service
    await TokenService().refreshAndUpdateFCMToken();

    // Listen for token refresh
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
      print('FCM Token refreshed: $newToken');
      await TokenService().refreshAndUpdateFCMToken();
    });
  } catch (e) {
    print('Error in setupFirebaseMessaging: $e');
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp();

  // Set up background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Setup Firebase messaging with simulator check
  await setupFirebaseMessaging();

  // Initialize local notifications for foreground notifications
  const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
  const DarwinInitializationSettings initializationSettingsIOS = DarwinInitializationSettings();
  const InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
    iOS: initializationSettingsIOS,
  );
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  // Verify FCM token exists
  final prefs = await SharedPreferences.getInstance();
  final fcmToken = prefs.getString('fcm_token');
  if (fcmToken != null) {
    print('FCM token exists: $fcmToken');
  } else {
    print('FCM token does not exist');
  }

  // Get first launch status
  final isFirstLaunch = prefs.getBool('first_launch') ?? true;

  runApp(TrueAstrotalk(isFirstLaunch: isFirstLaunch));
}

class TrueAstrotalk extends StatefulWidget {
  final bool isFirstLaunch;
  const TrueAstrotalk({super.key, required this.isFirstLaunch});

  @override
  TrueAstrotalkState createState() => TrueAstrotalkState();
}

class TrueAstrotalkState extends State<TrueAstrotalk> {
  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;
  Uri? _initialDeepLink;

  // Global navigation key to use for navigation from outside of widgets
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    initDeepLinks();
    setupPushNotifications();
  }

  void setupPushNotifications() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print("Got a message in the foreground!");
      print("Message data: ${message.data}");

      // Extract notification details
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      // Show notification if there is a notification payload
      if (notification != null) {
        print("Message notification: ${notification.title}");
        print("Message notification: ${notification.body}");

        // Show a local notification
        flutterLocalNotificationsPlugin.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              'high_importance_channel',
              'High Importance Notifications',
              channelDescription: 'This channel is used for important notifications.',
              importance: Importance.high,
              priority: Priority.high,
              icon: android?.smallIcon,
            ),
            iOS: const DarwinNotificationDetails(),
          ),
          payload: message.data.toString(),
        );
      }
    });

    // Handle notification tap when app is in background or terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print("Notification tapped!");
      print("Message data: ${message.data}");

      // Handle navigation based on notification data
      _handleNotificationNavigation(message.data);
    });

    // Check if the app was launched from a notification
    FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        print("App launched from notification!");
        print("Message data: ${message.data}");

        // Handle navigation after app initializes
        Future.delayed(Duration(seconds: 1), () {
          _handleNotificationNavigation(message.data);
        });
      }
    });
  }

  void _handleNotificationNavigation(Map<String, dynamic> data) {
    if (data.containsKey('chat_id')) {
      final chatId = data['chat_id'];
      final astrologerId = data['astrologer_id'];

      if (navigatorKey.currentState != null) {
        AstrologerService().getAstrologerById(astrologerId).then(
          (astrologer) {
            navigatorKey.currentState!.push(
              MaterialPageRoute(
                builder: (context) => ChatScreen(
                  astrologer: astrologer,
                  chatId: chatId,
                ),
              ),
            );
          },
        );
      }
    } else if (data.containsKey('request_id')) {
      final astrologer = data['astrologer_id'];
      if (navigatorKey.currentState != null) {
        navigatorKey.currentState!.push(
          MaterialPageRoute(
            builder: (context) => ChatRequestScreen(
              astrologer: astrologer,
            ),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  Future<void> initDeepLinks() async {
    _appLinks = AppLinks();
    // Get the initial link if the app was launched with one
    final appLink = await _appLinks.getInitialLink();
    if (appLink != null) {
      setState(() {
        _initialDeepLink = appLink;
      });
    }
    // Handle app links while the app is running
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      setState(() {
        _initialDeepLink = uri;
      });
    });
  }

  // Determine initial route based on deep links and first launch status
  String _determineInitialRoute() {
    // Check if there's a deep link for password reset
    if (_initialDeepLink != null && _initialDeepLink!.scheme == 'trueastrotalk' && _initialDeepLink!.host == 'resetpassword') {
      final token = _initialDeepLink!.queryParameters['token'];
      final email = _initialDeepLink!.queryParameters['email'];
      if (token != null && email != null) {
        // Return a route string that will be caught by onGenerateRoute
        return '/resetpassword?token=$token&email=$email';
      }
    }

    // If no valid deep link, use the original logic
    return widget.isFirstLaunch ? '/intro' : '/home';
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'True Astrotalk',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFFE70D),
        ),
        useMaterial3: true,
      ),
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey, // Set navigator key for outside navigation
      initialRoute: _determineInitialRoute(),
      routes: {
        '/intro': (context) => const Intro(),
        '/signup': (context) => const Signup(),
        '/login': (context) => const Login(),
        '/forgotpass': (context) => const Forgotpass(),
        '/home': (context) => const Init(initialIndex: 0, arguments: null),
        '/astrologers': (context) => const Init(initialIndex: 1),
        '/calls': (context) => const Init(initialIndex: 2),
        '/chats': (context) => const Init(initialIndex: 3),
        '/profile': (context) => const Init(initialIndex: 4),
        '/notifications': (context) => const Init(initialIndex: 5),
        '/wallet': (context) => const Init(initialIndex: 6),
        '/about': (context) => const Init(initialIndex: 7),
        '/terms': (context) => const Init(initialIndex: 8),
        '/help': (context) => const Init(initialIndex: 9),
        '/astrologer-details': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          final Astrologer astrologer = args['astrologer'] as Astrologer;
          return Init(initialIndex: 10, arguments: astrologer);
        },
        '/chatrequest': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          final astrologer = args['astrologer'] as Astrologer;
          return ChatRequestScreen(astrologer: astrologer);
        },
      },
      onGenerateRoute: (settings) {
        // Handle dynamic routes like password reset
        if (settings.name?.startsWith('/resetpassword') ?? false) {
          // Extract parameters from route
          final uri = Uri.parse(settings.name!);
          final token = uri.queryParameters['token'];
          final email = uri.queryParameters['email'];
          if (token != null && email != null) {
            return MaterialPageRoute(
              builder: (context) => Newpassword(token: token, email: email),
            );
          }
        }
        return null;
      },
    );
  }
}
