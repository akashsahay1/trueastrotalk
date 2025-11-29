import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:permission_handler/permission_handler.dart';
import '../api/user_api_service.dart';
import '../local/local_storage_service.dart';
import '../service_locator.dart';

/// Service for handling both Firebase push notifications and local notifications
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  String? _fcmToken;
  Function(Map<String, dynamic>)? _onCallNotification;
  Function(Map<String, dynamic>)? _onMessageNotification;
  Function(Map<String, dynamic>)? _onNotificationTapped;

  /// Initialize the notification service
  Future<void> initialize({
    Function(Map<String, dynamic>)? onCallNotification,
    Function(Map<String, dynamic>)? onMessageNotification,
    Function(Map<String, dynamic>)? onNotificationTapped,
  }) async {
    _onCallNotification = onCallNotification;
    _onMessageNotification = onMessageNotification;
    _onNotificationTapped = onNotificationTapped;

    await _initializeLocalNotifications();
    await _initializeFirebaseMessaging();
    await _requestPermissions();
    await _getFCMToken();
    _setupMessageHandlers();
  }

  /// Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
      macOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        if (response.payload != null && response.payload!.isNotEmpty) {
          final data = jsonDecode(response.payload!);
          _onNotificationTapped?.call(data);
        }
      },
    );
  }

  /// Initialize Firebase Messaging
  Future<void> _initializeFirebaseMessaging() async {
    // Configure Firebase Messaging settings
    await _firebaseMessaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Request notification permissions
  Future<void> _requestPermissions() async {
    // Request notification permission
    final status = await Permission.notification.request();
    debugPrint('📱 Notification permission: ${status.name}');

    // Request Firebase messaging permissions
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('📱 Firebase messaging permission: ${settings.authorizationStatus.name}');
  }

  /// Get FCM token for push notifications
  Future<void> _getFCMToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      debugPrint('📱 FCM Token: $_fcmToken');

      // Send initial token to server
      if (_fcmToken != null) {
        await _updateTokenOnServer(_fcmToken!);
      }

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((token) {
        _fcmToken = token;
        debugPrint('📱 FCM Token refreshed: $token');
        _updateTokenOnServer(token);
      });
    } catch (e) {
      debugPrint('❌ Failed to get FCM token: $e');
    }
  }

  /// Setup message handlers for different app states
  void _setupMessageHandlers() {
    // Handle messages when app is in foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('📱 Received message in foreground: ${message.data}');
      handleMessage(message, isBackground: false);
    });

    // Handle messages when app is in background but not terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('📱 Message opened app from background: ${message.data}');
      handleMessage(message, isBackground: true);
    });

    // Handle messages when app is terminated
    // This needs to be called in main.dart after Firebase initialization
    FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        debugPrint('📱 Message opened app from terminated state: ${message.data}');
        handleMessage(message, isBackground: true);
      }
    });
  }

  /// Handle incoming Firebase messages
  void handleMessage(RemoteMessage message, {required bool isBackground}) {
    final data = message.data;
    final notificationType = data['type'] ?? '';

    switch (notificationType) {
      case 'incoming_call':
        _handleIncomingCallNotification(data, message.notification, isBackground);
        break;
      case 'new_message':
        _handleNewMessageNotification(data, message.notification, isBackground);
        break;
      case 'call_ended':
        _handleCallEndedNotification(data, message.notification, isBackground);
        break;
      case 'call_missed':
        _handleMissedCallNotification(data, message.notification, isBackground);
        break;
      default:
        _handleGeneralNotification(data, message.notification, isBackground);
    }
  }

  /// Handle incoming call notifications
  void _handleIncomingCallNotification(
    Map<String, dynamic> data, 
    RemoteNotification? notification,
    bool isBackground,
  ) async {
    if (isBackground) {
      // Show local notification for incoming call
      await showCallNotification(
        callerId: data['caller_id'] ?? '',
        callerName: data['caller_name'] ?? 'Incoming Call',
        callType: data['call_type'] ?? 'voice',
        sessionId: data['session_id'] ?? '',
      );
    } else {
      // App is in foreground - directly handle the call
      _onCallNotification?.call(data);
    }
  }

  /// Handle new message notifications
  void _handleNewMessageNotification(
    Map<String, dynamic> data, 
    RemoteNotification? notification,
    bool isBackground,
  ) async {
    if (isBackground) {
      await showMessageNotification(
        senderId: data['sender_id'] ?? '',
        senderName: data['sender_name'] ?? 'Unknown',
        message: data['message'] ?? '',
        sessionId: data['session_id'] ?? '',
      );
    } else {
      _onMessageNotification?.call(data);
    }
  }

  /// Handle call ended notifications
  void _handleCallEndedNotification(
    Map<String, dynamic> data, 
    RemoteNotification? notification,
    bool isBackground,
  ) async {
    // Cancel any ongoing call notifications
    await _localNotifications.cancel(1);
    
    if (isBackground) {
      await showGeneralNotification(
        title: 'Call Ended',
        body: 'Your call has ended. Duration: ${data['duration'] ?? 'Unknown'}',
        payload: data,
      );
    }
  }

  /// Handle missed call notifications
  void _handleMissedCallNotification(
    Map<String, dynamic> data, 
    RemoteNotification? notification,
    bool isBackground,
  ) async {
    await showGeneralNotification(
      title: 'Missed Call',
      body: 'You missed a call from ${data['caller_name'] ?? 'Unknown'}',
      payload: data,
    );
  }

  /// Handle general notifications
  void _handleGeneralNotification(
    Map<String, dynamic> data, 
    RemoteNotification? notification,
    bool isBackground,
  ) async {
    if (isBackground && notification != null) {
      await showGeneralNotification(
        title: notification.title ?? 'TrueAstroTalk',
        body: notification.body ?? 'You have a new notification',
        payload: data,
      );
    }
  }

  /// Show incoming call notification with answer/decline actions
  Future<void> showCallNotification({
    required String callerId,
    required String callerName,
    required String callType,
    required String sessionId,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'incoming_calls',
      'Incoming Calls',
      channelDescription: 'Notifications for incoming voice and video calls',
      importance: Importance.max,
      priority: Priority.high,
      category: AndroidNotificationCategory.call,
      fullScreenIntent: true,
      ongoing: true,
      autoCancel: false,
      actions: [
        AndroidNotificationAction(
          'answer_call',
          'Answer',
          icon: DrawableResourceAndroidBitmap('ic_call'),
        ),
        AndroidNotificationAction(
          'decline_call',
          'Decline',
          icon: DrawableResourceAndroidBitmap('ic_call_end'),
        ),
      ],
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      categoryIdentifier: 'incoming_call_category',
      interruptionLevel: InterruptionLevel.critical,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final payload = jsonEncode({
      'type': 'incoming_call',
      'caller_id': callerId,
      'caller_name': callerName,
      'call_type': callType,
      'session_id': sessionId,
    });

    await _localNotifications.show(
      1, // Unique ID for call notifications
      '$callType Call',
      'Incoming ${callType.toLowerCase()} call from $callerName',
      notificationDetails,
      payload: payload,
    );
  }

  /// Show new message notification
  Future<void> showMessageNotification({
    required String senderId,
    required String senderName,
    required String message,
    required String sessionId,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'chat_messages',
      'Chat Messages',
      channelDescription: 'Notifications for new chat messages',
      importance: Importance.high,
      priority: Priority.high,
      actions: [
        AndroidNotificationAction(
          'reply_message',
          'Reply',
          icon: DrawableResourceAndroidBitmap('ic_reply'),
        ),
        AndroidNotificationAction(
          'mark_read',
          'Mark as Read',
          icon: DrawableResourceAndroidBitmap('ic_done'),
        ),
      ],
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      categoryIdentifier: 'message_category',
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final payload = jsonEncode({
      'type': 'new_message',
      'sender_id': senderId,
      'sender_name': senderName,
      'message': message,
      'session_id': sessionId,
    });

    await _localNotifications.show(
      2, // Unique ID for message notifications
      'New Message',
      '$senderName: $message',
      notificationDetails,
      payload: payload,
    );
  }

  /// Show general notification
  Future<void> showGeneralNotification({
    required String title,
    required String body,
    Map<String, dynamic>? payload,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'general',
      'General Notifications',
      channelDescription: 'General app notifications',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails();

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final payloadString = payload != null ? jsonEncode(payload) : null;

    await _localNotifications.show(
      3, // Unique ID for general notifications
      title,
      body,
      notificationDetails,
      payload: payloadString,
    );
  }

  /// Cancel a specific notification
  Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }

  /// Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }

  /// Get the current FCM token
  String? get fcmToken => _fcmToken;

  /// Check if notifications are enabled
  Future<bool> areNotificationsEnabled() async {
    if (Platform.isAndroid) {
      return await Permission.notification.isGranted;
    } else if (Platform.isIOS) {
      final settings = await _firebaseMessaging.getNotificationSettings();
      return settings.authorizationStatus == AuthorizationStatus.authorized;
    }
    return false;
  }

  /// Open notification settings
  Future<void> openNotificationSettings() async {
    try {
      await openAppSettings();
    } catch (e) {
      debugPrint('❌ Failed to open app settings: $e');
    }
  }

  /// Update FCM token on server
  Future<void> _updateTokenOnServer(String token) async {
    try {
      final userApiService = getIt<UserApiService>();
      final localStorage = getIt<LocalStorageService>();
      
      final authToken = await localStorage.getAuthToken();
      if (authToken == null) {
        debugPrint('📱 No auth token available, skipping FCM token update');
        return;
      }
      
      await userApiService.updateFcmToken(authToken, fcmToken: token);
      debugPrint('📱 Successfully updated FCM token on server');
    } catch (e) {
      debugPrint('❌ Failed to update FCM token on server: $e');
      // Don't throw error - FCM token update is not critical
    }
  }
}

/// Background message handler - must be a top-level function
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📱 Background message: ${message.data}');
  
  // Handle background messages
  final notificationService = NotificationService();
  notificationService.handleMessage(message, isBackground: true);
}