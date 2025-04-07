import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:trueastrotalk/models/wallet.dart';
import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/services/userservice.dart';

class WalletService {
  final String baseApiUrl = Environment.baseApiUrl;
  final token = UserService().getRequiredToken();

  Future<WalletModel> getWalletDetails() async {
    final response = await http.get(
      Uri.parse('${baseApiUrl}/wallet'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    if (response.statusCode == 200) {
      //print(response.body);
      return WalletModel.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load mm wallet details');
    }
  }

  Future<Map<String, dynamic>> createRazorpayOrder(double amount) async {
    final response = await http.post(
      Uri.parse('${baseApiUrl}/wallet/create-order'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'amount': amount * 100, // Razorpay takes amount in paise
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    } else {
      throw Exception('Failed to create order');
    }
  }

  Future<bool> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
    required double amount,
  }) async {
    final response = await http.post(
      Uri.parse('${baseApiUrl}/wallet/verify-payment'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'order_id': orderId,
        'payment_id': paymentId,
        'signature': signature,
        'amount': amount,
      }),
    );

    if (response.statusCode == 200) {
      return true;
    } else {
      throw Exception('Payment verification failed');
    }
  }
}
