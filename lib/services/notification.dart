import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'apiservice.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final ApiService _apiService;
  final BuildContext Function() _contextGetter;
  final AudioPlayer _audioPlayer = AudioPlayer();

  NotificationService({
    required ApiService apiService,
    required BuildContext Function() contextGetter,
  })  : _apiService = apiService,
        _contextGetter = contextGetter;

  Future<void> initialize() async {
    // Request notification permissions
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // Initialize local notifications
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        _handleNotificationTap(details.payload);
      },
    );

    // Configure a notification sound for calls
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'call_channel',
      'Call Notifications',
      description: 'Notifications for incoming calls',
      importance: Importance.max,
      playSound: true,
      sound: RawResourceAndroidNotificationSound('ringtone'),
    );

    await _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(channel);

    // Get FCM token and send to server
    final token = await _firebaseMessaging.getToken();
    if (token != null) {
      await _apiService.updateFcmToken(token);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);
    }

    // Handle FCM messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleNotificationTap(jsonEncode(message.data));
    });

    // Handle token refresh
    _firebaseMessaging.onTokenRefresh.listen((token) async {
      await _apiService.updateFcmToken(token);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);
    });
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    if (message.notification != null) {
      // Play ringtone for incoming calls
      if (message.data['type'] == 'incoming_call') {
        try {
          await _audioPlayer.play(AssetSource('sounds/ringtone.mp3'), volume: 1.0);
        } catch (e) {
          print('Error playing ringtone: $e');
        }
      }

      // Show notification
      final androidDetails = AndroidNotificationDetails(
        'call_channel',
        'Call Notifications',
        channelDescription: 'Notifications for incoming calls',
        importance: Importance.max,
        priority: Priority.high,
        playSound: true,
        sound: const RawResourceAndroidNotificationSound('ringtone'),
        fullScreenIntent: true,
        showWhen: true,
      );

      final iOSDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
        sound: 'ringtone.aiff',
      );

      final details = NotificationDetails(android: androidDetails, iOS: iOSDetails);

      await _localNotifications.show(
        message.hashCode,
        message.notification!.title,
        message.notification!.body,
        details,
        payload: jsonEncode(message.data),
      );

      // For incoming call, directly navigate to the incoming call screen
      if (message.data['type'] == 'incoming_call') {
        Navigator.of(_contextGetter()).pushNamed(
          '/incoming-call',
          arguments: {
            'call_id': message.data['call_id'],
            'caller_name': message.data['caller_name'],
            'caller_image': message.data['caller_image'],
            'caller_id': message.data['caller_id'],
          },
        );
      }
    }
  }

  void _handleNotificationTap(String? payload) {
    if (payload != null) {
      final data = jsonDecode(payload);

      // Stop ringtone if it's playing
      _audioPlayer.stop();

      if (data['type'] == 'incoming_call') {
        Navigator.of(_contextGetter()).pushNamed(
          '/incoming-call',
          arguments: {
            'call_id': data['call_id'],
            'caller_name': data['caller_name'],
            'caller_image': data['caller_image'],
            'caller_id': data['caller_id'],
          },
        );
      }
    }
  }

  // Stop ringtone (when call is answered or rejected)
  Future<void> stopRingtone() async {
    await _audioPlayer.stop();
  }
}
