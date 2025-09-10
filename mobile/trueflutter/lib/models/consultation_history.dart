class ConsultationHistory {
  final String id;
  final String astrologerId;
  final String astrologerName;
  final String? astrologerImage;
  final ConsultationType type;
  final String duration;
  final double amount;
  final DateTime createdAt;
  final ConsultationStatus status;
  final double? rating;
  final String? review;

  ConsultationHistory({
    required this.id,
    required this.astrologerId,
    required this.astrologerName,
    this.astrologerImage,
    required this.type,
    required this.duration,
    required this.amount,
    required this.createdAt,
    required this.status,
    this.rating,
    this.review,
  });

  factory ConsultationHistory.fromJson(Map<String, dynamic> json) {
    return ConsultationHistory(
      id: json['session_id'] ?? json['id']!,
      astrologerId: json['astrologer_user_id'] ?? json['astrologer_id'] ?? json['astrologerId']!,
      astrologerName: json['astrologer_name'] ?? json['astrologerName']!,
      astrologerImage: json['astrologer_image'] ?? json['astrologerImage'],
      type: _parseConsultationType(json['type']!),
      duration: json['duration']!,
      amount: (json['amount']!).toDouble(),
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt']!),
      status: _parseConsultationStatus(json['status']!),
      rating: json['rating']?.toDouble(),
      review: json['review'],
    );
  }

  static ConsultationType _parseConsultationType(String type) {
    switch (type.toLowerCase()) {
      case 'call':
      case 'voice':
        return ConsultationType.call;
      case 'chat':
      case 'text':
        return ConsultationType.chat;
      case 'video':
        return ConsultationType.video;
      default:
        return ConsultationType.call;
    }
  }

  static ConsultationStatus _parseConsultationStatus(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'finished':
        return ConsultationStatus.completed;
      case 'cancelled':
      case 'canceled':
        return ConsultationStatus.cancelled;
      case 'pending':
      case 'ongoing':
        return ConsultationStatus.pending;
      default:
        return ConsultationStatus.completed;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'astrologer_id': astrologerId,
      'astrologer_name': astrologerName,
      'astrologer_image': astrologerImage,
      'type': type.name,
      'duration': duration,
      'amount': amount,
      'created_at': createdAt.toIso8601String(),
      'status': status.name,
      'rating': rating,
      'review': review,
    };
  }
}

enum ConsultationType { call, chat, video }
enum ConsultationStatus { completed, cancelled, pending }