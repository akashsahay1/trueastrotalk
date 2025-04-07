import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app_links/app_links.dart';
import 'package:trueastrotalk/config/colors.dart';
import 'package:trueastrotalk/screens/astrologer_chat_request.dart';
import 'package:trueastrotalk/screens/chatmessage.dart';
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
import 'package:device_info_plus/device_info_plus.dart';
import 'package:trueastrotalk/services/tokens.dart';
import 'package:trueastrotalk/services/userservice.dart';

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

  runApp(TrueAstrotalk());
}

class TrueAstrotalk extends StatefulWidget {
  const TrueAstrotalk({super.key});

  @override
  TrueAstrotalkState createState() => TrueAstrotalkState();
}

class TrueAstrotalkState extends State<TrueAstrotalk> {
  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;
  Uri? _initialDeepLink;
  String? _initialRoute;
  final UserService _userService = UserService();

  // Global navigation key to use for navigation from outside of widgets
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    initDeepLinks();
    setupPushNotifications(navigatorKey);
    _determineInitialRoute();
  }

  void _handleNotificationNavigation(Map<String, dynamic> data, GlobalKey<NavigatorState> navigatorKey) {
    print("⚡ Handling notification navigation with data: $data");

    try {
      if (data.containsKey('request_id')) {
        // Convert string values to integers
        final int astrologerId = int.parse(data['astrologer_id'].toString());
        final String requestId = data['request_id'].toString();
        final String customerId = data['customer_id'].toString();

        print("astrologerId: $astrologerId");
        print("requestId: $requestId");
        print("customerId: $customerId");

        print("🔍 Navigating to chat request screen with requestId: $requestId");

        if (navigatorKey.currentState != null) {
          // For chat requests, we might not need the astrologer details
          // if they're provided on the request screen
          print("👉 Pushing route to chat request screen");
          UserService().getAstrologerById(astrologerId).then(
            (astrologer) {
              print("👉 Pushing route to chat screen");
              navigatorKey.currentState!.push(
                MaterialPageRoute(
                  builder: (context) => AstrologerChatRequestScreen(
                    astrologer: astrologer,
                    requestId: requestId,
                  ),
                  settings: const RouteSettings(name: '/chat'),
                ),
              );
            },
          ).catchError((error) {
            print("❌ Error fetching astrologer: $error");
          });
        } else {
          print("❌ Navigator state is null");
        }
      } else if (data.containsKey('chat_id')) {
        final String chatId = data['chat_id'].toString();
        final int astrologerId = int.parse(data['astrologer_id'].toString());

        print("🔍 Navigating to chat screen with chatId: $chatId, astrologerId: $astrologerId");

        if (navigatorKey.currentState != null) {
          UserService().getAstrologerById(astrologerId).then(
            (astrologer) {
              print("👉 Pushing route to chat screen");
              navigatorKey.currentState!.push(
                MaterialPageRoute(
                  builder: (context) => ChatScreen(
                    astrologer: astrologer,
                    chatId: chatId,
                  ),
                  settings: const RouteSettings(name: '/chat'),
                ),
              );
            },
          ).catchError((error) {
            print("❌ Error fetching astrologer: $error");
          });
        } else {
          print("❌ Navigator state is null");
        }
      } else {
        print("⚠️ No recognized navigation data in notification: $data");
      }
    } catch (e) {
      print("🛑 Error in navigation handler: $e");
      print("🛑 Data that caused the error: $data");
    }
  }

// Improved payload parsing function with error handling
  void handleNotificationPayload(String? payload, GlobalKey<NavigatorState> navigatorKey) {
    if (payload == null || payload.isEmpty) {
      print('Empty payload received');
      return;
    }

    print('Raw payload: $payload');

    try {
      // First try to parse as JSON
      try {
        Map<String, dynamic> jsonData = jsonDecode(payload);
        print('Successfully parsed JSON payload: $jsonData');

        // Only proceed with navigation if we have data
        if (jsonData.isNotEmpty) {
          // Call navigation handler with the parsed data
          _handleNotificationNavigation(jsonData, navigatorKey);
        }
        return;
      } catch (jsonError) {
        print('Not valid JSON, falling back to manual parsing: $jsonError');
      }

      // If JSON parsing fails, fallback to manual parsing
      Map<String, dynamic> data = {};

      // Clean up the payload string
      String cleanPayload = payload.replaceAll('{', '').replaceAll('}', '').trim();

      print('Cleaned payload: $cleanPayload');

      // Split by comma, but make sure we don't split values that might contain commas
      List<String> entries = [];

      // Track current entry and whether we're inside a quoted string
      String currentEntry = '';
      bool insideQuotes = false;

      for (int i = 0; i < cleanPayload.length; i++) {
        String char = cleanPayload[i];

        if (char == '"' || char == "'") {
          insideQuotes = !insideQuotes;
          currentEntry += char;
        } else if (char == ',' && !insideQuotes) {
          // Only split on commas that are not inside quotes
          entries.add(currentEntry.trim());
          currentEntry = '';
        } else {
          currentEntry += char;
        }
      }

      // Add the last entry
      if (currentEntry.isNotEmpty) {
        entries.add(currentEntry.trim());
      }

      print('Split entries: $entries');

      // Now process each key-value pair
      for (String entry in entries) {
        // Find the first colon that's not inside quotes
        int colonIndex = -1;
        insideQuotes = false;

        for (int i = 0; i < entry.length; i++) {
          if (entry[i] == '"' || entry[i] == "'") {
            insideQuotes = !insideQuotes;
          } else if (entry[i] == ':' && !insideQuotes && colonIndex == -1) {
            colonIndex = i;
          }
        }

        if (colonIndex == -1) {
          print('No colon found in entry: $entry');
          continue;
        }

        String key = entry.substring(0, colonIndex).trim();
        String value = entry.substring(colonIndex + 1).trim();

        // Clean up keys and values - remove any quotes
        key = key.replaceAll('"', '').replaceAll("'", '').trim();
        value = value.replaceAll('"', '').replaceAll("'", '').trim();

        print('Parsed key: "$key", value: "$value"');

        // Add to data map
        data[key] = value;
      }

      print('Final parsed data: $data');

      // Now handle the navigation with the parsed data
      if (data.isNotEmpty) {
        // Only one navigation attempt per payload
        _handleNotificationNavigation(data, navigatorKey);
      } else {
        print('No valid data parsed from payload');
      }
    } catch (e) {
      print('Error parsing notification payload: $e');
      print('Payload that caused error: $payload');
    }
  }

  void setupPushNotifications(GlobalKey<NavigatorState> navigatorKey) {
    // Initialize notification channels
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications.',
      importance: Importance.high,
    );

    // Create the channel on Android
    flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(channel);

    // Configure local notification click handling
    flutterLocalNotificationsPlugin.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        handleNotificationPayload(response.payload, navigatorKey);
      },
    );

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print("🔔 Got a message in the foreground!");
      print("Message data: ${message.data}");

      // Ensure data values are strings
      final formattedData = Map<String, String>.from(message.data.map((key, value) => MapEntry(key, value.toString())));

      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null) {
        print("Notification title: ${notification.title}");
        print("Notification body: ${notification.body}");

        // Convert data map to JSON string
        final jsonPayload = jsonEncode(formattedData);
        print("Creating local notification with payload: $jsonPayload");

        // Show local notification with JSON payload
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
          payload: jsonPayload,
        );
      }
    });

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print("📱 Background notification tapped!");
      print("Message data: ${message.data}");

      // Format data to ensure all values are strings
      final formattedData = Map<String, String>.from(message.data.map((key, value) => MapEntry(key, value.toString())));

      _handleNotificationNavigation(formattedData, navigatorKey);
    });

    // Check if app was launched from terminated state via notification
    FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        print("🚀 App launched from terminated state via notification!");
        print("Message data: ${message.data}");

        // Format data to ensure all values are strings
        final formattedData = Map<String, String>.from(message.data.map((key, value) => MapEntry(key, value.toString())));

        // Wait for app to initialize
        Future.delayed(const Duration(seconds: 1), () {
          _handleNotificationNavigation(formattedData, navigatorKey);
        });
      }
    });
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
  Future<void> _determineInitialRoute() async {
    String route;

    // Check if there's a deep link for password reset
    if (_initialDeepLink != null && _initialDeepLink!.scheme == 'trueastrotalk' && _initialDeepLink!.host == 'resetpassword') {
      final token = _initialDeepLink!.queryParameters['token'];
      final email = _initialDeepLink!.queryParameters['email'];
      if (token != null && email != null) {
        route = '/resetpassword?token=$token&email=$email';
      } else {
        // Check login status
        bool isLoggedIn = await _userService.isLoggedIn();
        route = isLoggedIn ? '/home' : '/intro';
      }
    } else {
      // No deep link, just check login status
      bool isLoggedIn = await _userService.isLoggedIn();
      route = isLoggedIn ? '/home' : '/intro';
    }

    setState(() {
      _initialRoute = route;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_initialRoute == null) {
      return MaterialApp(
        home: Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    return MaterialApp(
      title: 'True Astrotalk',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.accentColor,
        ),
        useMaterial3: true,
      ),
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      initialRoute: _initialRoute,
      routes: {
        '/intro': (context) => const Intro(),
        '/signup': (context) => const Signup(),
        '/login': (context) => const Login(),
        '/forgotpass': (context) => const Forgotpass(),
        '/home': (context) => const Init(initialIndex: 0, arguments: null),
        '/astrocalls': (context) => const Init(initialIndex: 1),
        '/astrochats': (context) => const Init(initialIndex: 2),
        '/help': (context) => const Init(initialIndex: 3),
        '/wallet': (context) => const Init(initialIndex: 4),
        '/about': (context) => const Init(initialIndex: 5),
        '/terms': (context) => const Init(initialIndex: 6),
        '/notifications': (context) => const Init(initialIndex: 7),
        '/privacy': (context) => const Init(initialIndex: 8),
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
