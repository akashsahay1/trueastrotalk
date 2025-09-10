class Transaction {
  final String id;
  final TransactionType type;
  final double amount;
  final String description;
  final DateTime createdAt;
  final String? paymentId;
  final String? paymentMethod;
  final TransactionStatus status;

  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.createdAt,
    this.paymentId,
    this.paymentMethod,
    required this.status,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['transaction_id'] ?? json['id']!,
      type: _parseTransactionType(json['type']!),
      amount: (json['amount']!).toDouble(),
      description: json['description']!,
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt']!),
      paymentId: json['payment_id'],
      paymentMethod: json['payment_method'],
      status: _parseTransactionStatus(json['status']!),
    );
  }

  static TransactionType _parseTransactionType(String type) {
    switch (type.toLowerCase()) {
      case 'credit':
      case 'recharge':
      case 'refund':
        return TransactionType.credit;
      case 'debit':
      case 'consultation':
      case 'withdrawal':
        return TransactionType.debit;
      default:
        return TransactionType.debit;
    }
  }

  static TransactionStatus _parseTransactionStatus(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return TransactionStatus.completed;
      case 'pending':
        return TransactionStatus.pending;
      case 'failed':
      case 'cancelled':
        return TransactionStatus.failed;
      default:
        return TransactionStatus.completed;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'amount': amount,
      'description': description,
      'created_at': createdAt.toIso8601String(),
      'payment_id': paymentId,
      'payment_method': paymentMethod,
      'status': status.name,
    };
  }
}

enum TransactionType { credit, debit }
enum TransactionStatus { completed, pending, failed }