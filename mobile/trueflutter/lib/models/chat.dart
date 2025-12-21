import 'package:intl/intl.dart';
import 'astrologer.dart';
import 'user.dart';

enum ChatStatus {
  pending,
  active,
  completed,
  cancelled,
}

extension ChatStatusExtension on ChatStatus {
  String get name {
    switch (this) {
      case ChatStatus.pending:
        return 'Pending';
      case ChatStatus.active:
        return 'Active';
      case ChatStatus.completed:
        return 'Completed';
      case ChatStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get displayName => name;
}

enum MessageType {
  text,
  image,
  system,
  payment,
}

class ChatSession {
  final String id;
  final User user;
  final Astrologer astrologer;
  final ChatStatus status;
  final double ratePerMinute;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationMinutes;
  final double totalAmount;
  final String? lastMessageText;
  final DateTime? lastMessageTime;
  final int unreadCount;
  final List<ChatMessage> messages;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ChatSession({
    required this.id,
    required this.user,
    required this.astrologer,
    required this.status,
    required this.ratePerMinute,
    required this.startTime,
    this.endTime,
    required this.durationMinutes,
    required this.totalAmount,
    this.lastMessageText,
    this.lastMessageTime,
    required this.unreadCount,
    required this.messages,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? json['session_id']?.toString() ?? '',
      user: User.fromJson(json['user'] ?? {}),
      astrologer: Astrologer.fromJson(json['astrologer'] ?? {}),
      status: _parseChatStatus(json['status']),
      ratePerMinute: _parseDouble(json['rate_per_minute']) ?? 0.0,
      startTime: json['start_time'] != null 
          ? DateTime.tryParse(json['start_time'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endTime: json['end_time'] != null 
          ? DateTime.tryParse(json['end_time'].toString())
          : null,
      durationMinutes: _parseInt(json['duration_minutes']) ?? 0,
      totalAmount: _parseDouble(json['total_amount']) ?? 0.0,
      lastMessageText: json['last_message_text']?.toString(),
      lastMessageTime: json['last_message_time'] != null 
          ? DateTime.tryParse(json['last_message_time'].toString())
          : null,
      unreadCount: _parseInt(json['unread_count']) ?? 0,
      messages: (json['messages'] as List<dynamic>?)
          ?.map((m) => ChatMessage.fromJson(m))
          .toList() ?? [],
      createdAt: json['created_at'] != null 
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user': user.toJson(),
      'astrologer': astrologer.toJson(),
      'status': status.name.toLowerCase(),
      'rate_per_minute': ratePerMinute,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime?.toIso8601String(),
      'duration_minutes': durationMinutes,
      'total_amount': totalAmount,
      'last_message_text': lastMessageText,
      'last_message_time': lastMessageTime?.toIso8601String(),
      'unread_count': unreadCount,
      'messages': messages.map((m) => m.toJson()).toList(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  static ChatStatus _parseChatStatus(dynamic value) {
    if (value == null) return ChatStatus.pending;
    final statusStr = value.toString().toLowerCase();
    switch (statusStr) {
      case 'active':
        return ChatStatus.active;
      case 'completed':
        return ChatStatus.completed;
      case 'cancelled':
        return ChatStatus.cancelled;
      default:
        return ChatStatus.pending;
    }
  }

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }

  // Helper getters
  String get formattedDuration {
    if (durationMinutes < 60) {
      return '${durationMinutes}m';
    }
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    return minutes > 0 ? '${hours}h ${minutes}m' : '${hours}h';
  }

  String get formattedTotalAmount => '₹${totalAmount.toStringAsFixed(2)}';
  String get formattedRatePerMinute => '₹${ratePerMinute.toInt()}/min';
  
  String get formattedStartTime => DateFormat('dd MMM yyyy, HH:mm').format(startTime);
  String get formattedEndTime => endTime != null 
      ? DateFormat('dd MMM yyyy, HH:mm').format(endTime!)
      : '';

  bool get isActive => status == ChatStatus.active;
  bool get isCompleted => status == ChatStatus.completed;
  bool get hasUnreadMessages => unreadCount > 0;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ChatSession && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

class ChatMessage {
  final String id;
  final String chatSessionId;
  final String senderId;
  final String senderName;
  final String senderType; // 'user' or 'astrologer'
  final MessageType type;
  final String content;
  final String? imageUrl;
  final bool isRead;
  final DateTime timestamp;

  const ChatMessage({
    required this.id,
    required this.chatSessionId,
    required this.senderId,
    required this.senderName,
    required this.senderType,
    required this.type,
    required this.content,
    this.imageUrl,
    required this.isRead,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      chatSessionId: json['chat_session_id']?.toString() ?? '',
      senderId: json['sender_id']?.toString() ?? '',
      senderName: json['sender_name']?.toString() ?? '',
      senderType: json['sender_type']?.toString() ?? 'customer',
      type: _parseMessageType(json['type']),
      content: json['content']?.toString() ?? '',
      imageUrl: json['image_url']?.toString(),
      isRead: json['is_read'] == true || json['is_read'] == 1,
      timestamp: json['timestamp'] != null 
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chat_session_id': chatSessionId,
      'sender_id': senderId,
      'sender_name': senderName,
      'sender_type': senderType,
      'type': type.name,
      'content': content,
      'image_url': imageUrl,
      'is_read': isRead,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  static MessageType _parseMessageType(dynamic value) {
    if (value == null) return MessageType.text;
    final typeStr = value.toString().toLowerCase();
    switch (typeStr) {
      case 'image':
        return MessageType.image;
      case 'system':
        return MessageType.system;
      case 'payment':
        return MessageType.payment;
      default:
        return MessageType.text;
    }
  }

  // Helper getters
  String get formattedTime => DateFormat('HH:mm').format(timestamp);
  String get formattedDate => DateFormat('dd MMM yyyy').format(timestamp);
  String get formattedDateTime => DateFormat('dd MMM yyyy, HH:mm').format(timestamp);
  
  bool get isFromUser => senderType.toLowerCase() == 'customer';
  bool get isFromAstrologer => senderType.toLowerCase() == 'astrologer';
  bool get isSystemMessage => type == MessageType.system;
  bool get hasImage => imageUrl != null && imageUrl!.isNotEmpty;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ChatMessage && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}