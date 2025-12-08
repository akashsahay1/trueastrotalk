import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Notification Logic', () {
    group('Notification type classification', () {
      test('should classify incoming call notifications', () {
        final data = {
          'type': 'incoming_call',
          'caller_id': '123',
          'caller_name': 'John Doe',
          'session_id': 'session_123'
        };

        final type = getNotificationType(data);
        
        expect(type, NotificationType.incomingCall);
      });

      test('should classify new message notifications', () {
        final data = {
          'type': 'new_message',
          'sender_id': '456',
          'sender_name': 'Jane Smith',
          'message': 'Hello there'
        };

        final type = getNotificationType(data);
        
        expect(type, NotificationType.newMessage);
      });

      test('should classify call ended notifications', () {
        final data = {
          'type': 'call_ended',
          'session_id': 'session_123',
          'duration': '5:30'
        };

        final type = getNotificationType(data);
        
        expect(type, NotificationType.callEnded);
      });

      test('should classify missed call notifications', () {
        final data = {
          'type': 'call_missed',
          'caller_name': 'John Doe',
          'session_id': 'session_123'
        };

        final type = getNotificationType(data);
        
        expect(type, NotificationType.missedCall);
      });

      test('should handle unknown notification types', () {
        final data = {
          'type': 'unknown_type',
          'message': 'Some message'
        };

        final type = getNotificationType(data);
        
        expect(type, NotificationType.general);
      });
    });

    group('Notification priority', () {
      test('should assign critical priority to incoming calls', () {
        final data = {'type': 'incoming_call'};
        
        final priority = getNotificationPriority(data);
        
        expect(priority, NotificationPriority.critical);
      });

      test('should assign high priority to new messages', () {
        final data = {'type': 'new_message'};
        
        final priority = getNotificationPriority(data);
        
        expect(priority, NotificationPriority.high);
      });

      test('should assign medium priority to call ended', () {
        final data = {'type': 'call_ended'};
        
        final priority = getNotificationPriority(data);
        
        expect(priority, NotificationPriority.medium);
      });

      test('should assign default priority to unknown types', () {
        final data = {'type': 'unknown'};
        
        final priority = getNotificationPriority(data);
        
        expect(priority, NotificationPriority.medium);
      });
    });

    group('Notification channel selection', () {
      test('should select call channel for call-related notifications', () {
        final callData = {'type': 'incoming_call'};
        final missedData = {'type': 'call_missed'};
        final endedData = {'type': 'call_ended'};
        
        expect(getNotificationChannel(callData), NotificationChannel.calls);
        expect(getNotificationChannel(missedData), NotificationChannel.calls);
        expect(getNotificationChannel(endedData), NotificationChannel.calls);
      });

      test('should select message channel for message notifications', () {
        final data = {'type': 'new_message'};
        
        final channel = getNotificationChannel(data);
        
        expect(channel, NotificationChannel.messages);
      });

      test('should select general channel for other notifications', () {
        final data = {'type': 'general_update'};
        
        final channel = getNotificationChannel(data);
        
        expect(channel, NotificationChannel.general);
      });
    });

    group('Notification content formatting', () {
      test('should format incoming call notification', () {
        final data = {
          'type': 'incoming_call',
          'caller_name': 'John Doe',
          'call_type': 'voice'
        };

        final content = formatNotificationContent(data);
        
        expect(content.title, 'Incoming Voice Call');
        expect(content.body, 'John Doe is calling you');
        expect(content.largeIcon, isNotNull);
      });

      test('should format new message notification', () {
        final data = {
          'type': 'new_message',
          'sender_name': 'Jane Smith',
          'message': 'Hello, how are you?'
        };

        final content = formatNotificationContent(data);
        
        expect(content.title, 'New Message');
        expect(content.body, 'Jane Smith: Hello, how are you?');
      });

      test('should format call ended notification', () {
        final data = {
          'type': 'call_ended',
          'duration': '5:30'
        };

        final content = formatNotificationContent(data);
        
        expect(content.title, 'Call Ended');
        expect(content.body, 'Your call ended. Duration: 5:30');
      });

      test('should truncate long message content', () {
        final data = {
          'type': 'new_message',
          'sender_name': 'Jane',
          'message': 'This is a very long message that should be truncated because it exceeds the maximum allowed length for notification content display'
        };

        final content = formatNotificationContent(data);
        
        expect(content.body.length, lessThanOrEqualTo(100)); // Max length
        expect(content.body.endsWith('...'), true);
      });
    });

    group('Notification actions', () {
      test('should provide answer/decline actions for incoming calls', () {
        final data = {'type': 'incoming_call'};
        
        final actions = getNotificationActions(data);
        
        expect(actions.length, 2);
        expect(actions[0].id, 'answer');
        expect(actions[0].title, 'Answer');
        expect(actions[1].id, 'decline');
        expect(actions[1].title, 'Decline');
      });

      test('should provide reply/mark read actions for messages', () {
        final data = {'type': 'new_message'};
        
        final actions = getNotificationActions(data);
        
        expect(actions.length, 2);
        expect(actions[0].id, 'reply');
        expect(actions[0].title, 'Reply');
        expect(actions[1].id, 'mark_read');
        expect(actions[1].title, 'Mark as Read');
      });

      test('should provide no actions for general notifications', () {
        final data = {'type': 'general_update'};
        
        final actions = getNotificationActions(data);
        
        expect(actions.isEmpty, true);
      });
    });

    group('Notification scheduling', () {
      test('should schedule immediate delivery for critical notifications', () {
        final data = {'type': 'incoming_call'};
        
        final schedule = getNotificationSchedule(data);
        
        expect(schedule.isImmediate, true);
        expect(schedule.delay, Duration.zero);
      });

      test('should respect quiet hours for non-critical notifications', () {
        final data = {'type': 'general_update'};
        final currentTime = DateTime(2024, 1, 1, 23, 0); // 11 PM
        
        final schedule = getNotificationSchedule(data, currentTime: currentTime);
        
        expect(schedule.isDelayed, true);
        expect(schedule.scheduledTime!.hour, greaterThanOrEqualTo(8)); // Next morning
      });

      test('should allow immediate delivery during active hours', () {
        final data = {'type': 'new_message'};
        final currentTime = DateTime(2024, 1, 1, 14, 0); // 2 PM
        
        final schedule = getNotificationSchedule(data, currentTime: currentTime);
        
        expect(schedule.isImmediate, true);
      });
    });

    group('Notification grouping', () {
      test('should group multiple messages from same sender', () {
        final notifications = [
          {'type': 'new_message', 'sender_id': '123', 'sender_name': 'John'},
          {'type': 'new_message', 'sender_id': '123', 'sender_name': 'John'},
          {'type': 'new_message', 'sender_id': '456', 'sender_name': 'Jane'},
        ];

        final grouped = groupNotifications(notifications);
        
        expect(grouped.length, 2); // Two groups
        expect(grouped['message_123']?.length, 2); // Two messages from John
        expect(grouped['message_456']?.length, 1); // One message from Jane
      });

      test('should not group different notification types', () {
        final notifications = [
          {'type': 'new_message', 'sender_id': '123'},
          {'type': 'call_missed', 'caller_id': '123'},
        ];

        final grouped = groupNotifications(notifications);
        
        expect(grouped.length, 2); // Should remain separate
      });
    });

    group('Notification sound selection', () {
      test('should use call ringtone for incoming calls', () {
        final data = {'type': 'incoming_call'};
        
        final sound = getNotificationSound(data);
        
        expect(sound.type, NotificationSoundType.ringtone);
        expect(sound.isLooping, true);
        expect(sound.volume, 1.0);
      });

      test('should use message tone for new messages', () {
        final data = {'type': 'new_message'};
        
        final sound = getNotificationSound(data);
        
        expect(sound.type, NotificationSoundType.message);
        expect(sound.isLooping, false);
      });

      test('should use default sound for general notifications', () {
        final data = {'type': 'general_update'};
        
        final sound = getNotificationSound(data);
        
        expect(sound.type, NotificationSoundType.defaultSound);
      });
    });
  });
}

// Enums and classes for notification logic
enum NotificationType {
  incomingCall,
  newMessage,
  callEnded,
  missedCall,
  general,
}

enum NotificationPriority {
  critical,
  high,
  medium,
  low,
}

enum NotificationChannel {
  calls,
  messages,
  general,
}

enum NotificationSoundType {
  ringtone,
  message,
  defaultSound,
}

class NotificationContent {
  final String title;
  final String body;
  final String? largeIcon;

  NotificationContent({
    required this.title,
    required this.body,
    this.largeIcon,
  });
}

class NotificationAction {
  final String id;
  final String title;
  final String? icon;

  NotificationAction({
    required this.id,
    required this.title,
    this.icon,
  });
}

class NotificationSchedule {
  final bool isImmediate;
  final Duration delay;
  final DateTime? scheduledTime;

  NotificationSchedule({
    required this.isImmediate,
    this.delay = Duration.zero,
    this.scheduledTime,
  });

  bool get isDelayed => !isImmediate;
}

class NotificationSound {
  final NotificationSoundType type;
  final bool isLooping;
  final double volume;

  NotificationSound({
    required this.type,
    this.isLooping = false,
    this.volume = 0.8,
  });
}

// Utility functions for notification logic
NotificationType getNotificationType(Map<String, dynamic> data) {
  final type = data['type'] as String?;
  
  switch (type) {
    case 'incoming_call':
      return NotificationType.incomingCall;
    case 'new_message':
      return NotificationType.newMessage;
    case 'call_ended':
      return NotificationType.callEnded;
    case 'call_missed':
      return NotificationType.missedCall;
    default:
      return NotificationType.general;
  }
}

NotificationPriority getNotificationPriority(Map<String, dynamic> data) {
  final type = getNotificationType(data);
  
  switch (type) {
    case NotificationType.incomingCall:
      return NotificationPriority.critical;
    case NotificationType.newMessage:
      return NotificationPriority.high;
    case NotificationType.callEnded:
    case NotificationType.missedCall:
      return NotificationPriority.medium;
    default:
      return NotificationPriority.medium;
  }
}

NotificationChannel getNotificationChannel(Map<String, dynamic> data) {
  final type = getNotificationType(data);
  
  switch (type) {
    case NotificationType.incomingCall:
    case NotificationType.callEnded:
    case NotificationType.missedCall:
      return NotificationChannel.calls;
    case NotificationType.newMessage:
      return NotificationChannel.messages;
    default:
      return NotificationChannel.general;
  }
}

NotificationContent formatNotificationContent(Map<String, dynamic> data) {
  final type = getNotificationType(data);
  
  switch (type) {
    case NotificationType.incomingCall:
      final callerName = data['caller_name'] ?? 'Unknown';
      final callType = data['call_type'] ?? 'voice';
      return NotificationContent(
        title: 'Incoming ${callType.toString().split('.').last.toUpperCase()} Call',
        body: '$callerName is calling you',
        largeIcon: 'call_icon',
      );
      
    case NotificationType.newMessage:
      final senderName = data['sender_name'] ?? 'Unknown';
      final message = data['message'] ?? '';
      final truncatedMessage = message.length > 80 ? '${message.substring(0, 77)}...' : message;
      return NotificationContent(
        title: 'New Message',
        body: '$senderName: $truncatedMessage',
      );
      
    case NotificationType.callEnded:
      final duration = data['duration'] ?? 'Unknown';
      return NotificationContent(
        title: 'Call Ended',
        body: 'Your call ended. Duration: $duration',
      );
      
    case NotificationType.missedCall:
      final callerName = data['caller_name'] ?? 'Unknown';
      return NotificationContent(
        title: 'Missed Call',
        body: 'You missed a call from $callerName',
      );
      
    default:
      return NotificationContent(
        title: 'TrueAstroTalk',
        body: data['message']?.toString() ?? 'You have a new notification',
      );
  }
}

List<NotificationAction> getNotificationActions(Map<String, dynamic> data) {
  final type = getNotificationType(data);
  
  switch (type) {
    case NotificationType.incomingCall:
      return [
        NotificationAction(id: 'answer', title: 'Answer', icon: 'call_icon'),
        NotificationAction(id: 'decline', title: 'Decline', icon: 'call_end_icon'),
      ];
      
    case NotificationType.newMessage:
      return [
        NotificationAction(id: 'reply', title: 'Reply', icon: 'reply_icon'),
        NotificationAction(id: 'mark_read', title: 'Mark as Read', icon: 'done_icon'),
      ];
      
    default:
      return [];
  }
}

NotificationSchedule getNotificationSchedule(
  Map<String, dynamic> data, {
  DateTime? currentTime,
}) {
  currentTime ??= DateTime.now();
  final priority = getNotificationPriority(data);
  
  // Critical notifications are always immediate
  if (priority == NotificationPriority.critical) {
    return NotificationSchedule(isImmediate: true);
  }
  
  // Check quiet hours (10 PM to 8 AM)
  final hour = currentTime.hour;
  if (hour >= 22 || hour < 8) {
    // Schedule for next morning at 8 AM
    final nextMorning = DateTime(
      currentTime.year,
      currentTime.month,
      currentTime.day + (hour >= 22 ? 1 : 0),
      8,
      0,
    );
    
    return NotificationSchedule(
      isImmediate: false,
      scheduledTime: nextMorning,
    );
  }
  
  return NotificationSchedule(isImmediate: true);
}

Map<String, List<Map<String, dynamic>>> groupNotifications(
  List<Map<String, dynamic>> notifications,
) {
  final Map<String, List<Map<String, dynamic>>> grouped = {};
  
  for (final notification in notifications) {
    final type = notification['type'] as String?;
    String groupKey;
    
    if (type == 'new_message') {
      groupKey = 'message_${notification['sender_id']}';
    } else if (type == 'call_missed' || type == 'incoming_call') {
      groupKey = 'call_${notification['caller_id'] ?? notification['sender_id']}';
    } else {
      groupKey = 'general_${notification.hashCode}';
    }
    
    grouped[groupKey] ??= [];
    grouped[groupKey]!.add(notification);
  }
  
  return grouped;
}

NotificationSound getNotificationSound(Map<String, dynamic> data) {
  final type = getNotificationType(data);
  
  switch (type) {
    case NotificationType.incomingCall:
      return NotificationSound(
        type: NotificationSoundType.ringtone,
        isLooping: true,
        volume: 1.0,
      );
      
    case NotificationType.newMessage:
      return NotificationSound(
        type: NotificationSoundType.message,
        volume: 0.8,
      );
      
    default:
      return NotificationSound(
        type: NotificationSoundType.defaultSound,
        volume: 0.6,
      );
  }
}