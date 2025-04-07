class AstrologerSession {
  final int id;
  final int customerId;
  final int astrologerId;
  final int totalMinutes;
  final int remainingMinutes;
  final double amountPaid;
  final DateTime createdAt;
  final DateTime expiresAt;

  AstrologerSession({
    required this.id,
    required this.customerId,
    required this.astrologerId,
    required this.totalMinutes,
    required this.remainingMinutes,
    required this.amountPaid,
    required this.createdAt,
    required this.expiresAt,
  });

  factory AstrologerSession.fromJson(Map<String, dynamic> json) {
    return AstrologerSession(
      id: json['id'],
      customerId: json['customer_id'],
      astrologerId: json['astrologer_id'],
      totalMinutes: json['total_minutes'],
      remainingMinutes: json['remaining_minutes'],
      amountPaid: double.parse(json['amount_paid'].toString()),
      createdAt: DateTime.parse(json['created_at']),
      expiresAt: DateTime.parse(json['expires_at']),
    );
  }

  bool get isActive => DateTime.now().isBefore(expiresAt) && remainingMinutes > 0;
}

class SessionCall {
  final int id;
  final int sessionId;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationMinutes;
  final String status;

  SessionCall({
    required this.id,
    required this.sessionId,
    required this.startTime,
    this.endTime,
    required this.durationMinutes,
    required this.status,
  });

  factory SessionCall.fromJson(Map<String, dynamic> json) {
    return SessionCall(
      id: json['id'],
      sessionId: json['session_id'],
      startTime: DateTime.parse(json['start_time']),
      endTime: json['end_time'] != null ? DateTime.parse(json['end_time']) : null,
      durationMinutes: json['duration_minutes'] ?? 0,
      status: json['status'] ?? 'created',
    );
  }
}

// File: lib/models/call.dart
class Call {
  final String id;
  final int callerId;
  final int receiverId;
  final String status;
  final DateTime createdAt;
  final DateTime? answeredAt;
  final DateTime? endedAt;
  final int? durationSeconds;

  Call({
    required this.id,
    required this.callerId,
    required this.receiverId,
    required this.status,
    required this.createdAt,
    this.answeredAt,
    this.endedAt,
    this.durationSeconds,
  });

  factory Call.fromJson(Map<String, dynamic> json) {
    return Call(
      id: json['id'],
      callerId: json['caller_id'],
      receiverId: json['receiver_id'],
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
      answeredAt: json['answered_at'] != null ? DateTime.parse(json['answered_at']) : null,
      endedAt: json['ended_at'] != null ? DateTime.parse(json['ended_at']) : null,
      durationSeconds: json['duration_seconds'],
    );
  }
}
