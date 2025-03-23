import 'package:intl/intl.dart';

class Transaction {
  final String id;
  final double amount;
  final String type; // credit or debit
  final String description;
  final String date;

  Transaction({
    required this.id,
    required this.amount,
    required this.type,
    required this.description,
    required this.date,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    // Parse the date from created_at
    String formattedDate = '';
    if (json['created_at'] != null) {
      try {
        // Parse the ISO 8601 date string
        DateTime dateTime = DateTime.parse(json['created_at']);
        // Format it as dd-MM-yyyy hh:mm a
        formattedDate = DateFormat('dd-MM-yyyy hh:mm a').format(dateTime);
      } catch (e) {
        // If parsing fails, use the raw string
        formattedDate = json['created_at'];
      }
    }

    return Transaction(
      id: json['id'].toString(),
      amount: json['amount'] != null ? double.parse(json['amount'].toString()) : 0.0,
      type: json['type'] ?? '',
      description: json['description'] ?? '',
      date: formattedDate,
    );
  }
}
