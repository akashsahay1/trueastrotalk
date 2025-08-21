import 'package:intl/intl.dart';
import 'astrologer.dart';
import 'user.dart';

enum CallStatus {
  pending,
  ringing,
  active,
  completed,
  cancelled,
  missed,
}

extension CallStatusExtension on CallStatus {
  String get name {
    switch (this) {
      case CallStatus.pending:
        return 'Pending';
      case CallStatus.ringing:
        return 'Ringing';
      case CallStatus.active:
        return 'Active';
      case CallStatus.completed:
        return 'Completed';
      case CallStatus.cancelled:
        return 'Cancelled';
      case CallStatus.missed:
        return 'Missed';
    }
  }

  String get displayName => name;
}

enum CallType {
  voice,
  video,
}

extension CallTypeExtension on CallType {
  String get name {
    switch (this) {
      case CallType.voice:
        return 'Voice';
      case CallType.video:
        return 'Video';
    }
  }

  String get displayName => name;
}

class CallSession {
  final String id;
  final User user;
  final Astrologer astrologer;
  final CallType callType;
  final CallStatus status;
  final double ratePerMinute;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationMinutes;
  final double totalAmount;
  final String? roomId;
  final String? token;
  final Map<String, dynamic>? callData;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CallSession({
    required this.id,
    required this.user,
    required this.astrologer,
    required this.callType,
    required this.status,
    required this.ratePerMinute,
    required this.startTime,
    this.endTime,
    required this.durationMinutes,
    required this.totalAmount,
    this.roomId,
    this.token,
    this.callData,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CallSession.fromJson(Map<String, dynamic> json) {
    return CallSession(
      id: json['id']?.toString() ?? '',
      user: User.fromJson(json['user'] ?? {}),
      astrologer: Astrologer.fromJson(json['astrologer'] ?? {}),
      callType: _parseCallType(json['call_type']),
      status: _parseCallStatus(json['status']),
      ratePerMinute: _parseDouble(json['rate_per_minute']) ?? 0.0,
      startTime: json['start_time'] != null 
          ? DateTime.tryParse(json['start_time'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endTime: json['end_time'] != null 
          ? DateTime.tryParse(json['end_time'].toString())
          : null,
      durationMinutes: _parseInt(json['duration_minutes']) ?? 0,
      totalAmount: _parseDouble(json['total_amount']) ?? 0.0,
      roomId: json['room_id']?.toString(),
      token: json['token']?.toString(),
      callData: json['call_data'] as Map<String, dynamic>?,
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
      'call_type': callType.name.toLowerCase(),
      'status': status.name.toLowerCase(),
      'rate_per_minute': ratePerMinute,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime?.toIso8601String(),
      'duration_minutes': durationMinutes,
      'total_amount': totalAmount,
      'room_id': roomId,
      'token': token,
      'call_data': callData,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  static CallType _parseCallType(dynamic value) {
    if (value == null) return CallType.voice;
    final typeStr = value.toString().toLowerCase();
    switch (typeStr) {
      case 'video':
        return CallType.video;
      default:
        return CallType.voice;
    }
  }

  static CallStatus _parseCallStatus(dynamic value) {
    if (value == null) return CallStatus.pending;
    final statusStr = value.toString().toLowerCase();
    switch (statusStr) {
      case 'ringing':
        return CallStatus.ringing;
      case 'active':
        return CallStatus.active;
      case 'completed':
        return CallStatus.completed;
      case 'cancelled':
        return CallStatus.cancelled;
      case 'missed':
        return CallStatus.missed;
      default:
        return CallStatus.pending;
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

  bool get isActive => status == CallStatus.active;
  bool get isCompleted => status == CallStatus.completed;
  bool get isRinging => status == CallStatus.ringing;
  bool get isMissed => status == CallStatus.missed;
  bool get canJoin => status == CallStatus.ringing || status == CallStatus.active;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CallSession && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}