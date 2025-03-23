import 'transaction.dart';

class WalletModel {
  final double balance;
  final List<Transaction> recentTransactions;

  WalletModel({required this.balance, required this.recentTransactions});

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    List<Transaction> transactions = [];
    if (json['recent_transactions'] != null) {
      // Changed from 'transactions' to 'recent_transactions'
      json['recent_transactions'].forEach((v) {
        transactions.add(Transaction.fromJson(v));
      });
    }

    return WalletModel(
      balance: json['balance'] != null ? (json['balance'] is double ? json['balance'] : double.parse(json['balance'].toString())) : 0.0,
      recentTransactions: transactions,
    );
  }
}
