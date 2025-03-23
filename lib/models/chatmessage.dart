class ChatMessage {
  final String id;
  final String chatId;
  final String senderId;
  final String message;
  final DateTime timestamp;
  final bool isFromCurrentUser;

  ChatMessage({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.message,
    required this.timestamp,
    required this.isFromCurrentUser,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'].toString(),
      chatId: json['chat_id'].toString(),
      senderId: json['sender_id'].toString(),
      message: json['message'] ?? '',
      timestamp: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
      // Usually the backend would tell us if this message is from the current user
      // or we could compare senderId with the current user ID
      isFromCurrentUser: json['is_from_current_user'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chat_id': chatId,
      'sender_id': senderId,
      'message': message,
      'created_at': timestamp.toIso8601String(),
      'is_from_current_user': isFromCurrentUser,
    };
  }
}
