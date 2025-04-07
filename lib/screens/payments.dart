import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/models/wallet.dart';
import 'package:trueastrotalk/services/userservice.dart';
import 'package:trueastrotalk/services/wallet.dart';
import 'package:trueastrotalk/config/environment.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';

class ChatPaymentScreen extends StatefulWidget {
  final User astrologer;
  final Map<String, dynamic> chatSummary;

  const ChatPaymentScreen({
    Key? key,
    required this.astrologer,
    required this.chatSummary,
  }) : super(key: key);

  @override
  _ChatPaymentScreenState createState() => _ChatPaymentScreenState();
}

class _ChatPaymentScreenState extends State<ChatPaymentScreen> {
  final WalletService _walletService = WalletService();
  final UserService _UserService = UserService();

  bool _isLoadingWallet = true;
  bool _isProcessingWallet = false;
  bool _isProcessingRazorpay = false;

  late String _chatId;
  late int _durationInMinutes;
  late double _ratePerMinute;
  late double _totalAmount;

  WalletModel? _wallet;

  @override
  void initState() {
    super.initState();
    _extractChatSummary();
    _loadWalletDetails();
  }

  void _extractChatSummary() {
    _chatId = widget.chatSummary['id'].toString();
    _durationInMinutes = widget.chatSummary['duration_minutes'] ?? 0;
    _ratePerMinute = double.parse((widget.chatSummary['rate_per_minute'] ?? '0').toString());
    _totalAmount = double.parse((widget.chatSummary['total_amount'] ?? '0').toString());
  }

  Future<void> _loadWalletDetails() async {
    setState(() {
      _isLoadingWallet = true;
    });

    try {
      final wallet = await _walletService.getWalletDetails();
      setState(() {
        _wallet = wallet;
        _isLoadingWallet = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingWallet = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load pp wallet details: ${e.toString()}')),
      );
    }
  }

  Future<void> _payFromWallet() async {
    // Check if wallet balance is sufficient
    if (_wallet == null || _wallet!.balance < _totalAmount) {
      _showInsufficientBalanceDialog();
      return;
    }

    setState(() {
      _isProcessingWallet = true;
    });

    try {
      final String baseApiUrl = Environment.baseApiUrl;
      final token = _UserService.getToken();
      final response = await http.post(
        Uri.parse('${baseApiUrl}/payments/wallet'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'chat_id': _chatId,
        }),
      );

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (jsonResponse['success'] == true) {
          // Show success dialog
          _showPaymentSuccessDialog();
          return;
        }
      }

      // If we get here, there was an error
      throw Exception('Payment failed. Please try again later.');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment failed: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isProcessingWallet = false;
      });
    }
  }

  Future<void> _payWithRazorpay() async {
    setState(() {
      _isProcessingRazorpay = true;
    });

    try {
      final baseApiUrl = Environment.baseApiUrl;
      final token = await _UserService.getToken();
      final response = await http.post(
        Uri.parse('${baseApiUrl}/chat/${_chatId}/payment-link'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (jsonResponse['success'] == true) {
          final paymentLink = jsonResponse['data']['payment_link'];

          // Launch the payment link
          if (await canLaunchUrl(paymentLink)) {
            await launchUrl(paymentLink);
          } else {
            throw Exception('Could not launch payment page');
          }
          return;
        }
      }

      // If we get here, there was an error
      throw Exception('Failed to create payment link. Please try again later.');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment link creation failed: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isProcessingRazorpay = false;
      });
    }
  }

  void _showInsufficientBalanceDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Insufficient Balance'),
        content: Text('Your wallet balance is insufficient for this payment. Would you like to pay directly via Razorpay?'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _payWithRazorpay();
            },
            child: Text('Pay with Razorpay'),
          ),
        ],
      ),
    );
  }

  void _showPaymentSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Payment Successful'),
        content: Text('Your payment has been processed successfully.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.pushReplacementNamed(context, '/home');
            },
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.black : Colors.grey.shade700,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Theme.of(context).primaryColor : Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(
      symbol: '₹',
      decimalDigits: 2,
      locale: 'en_IN',
    );

    final formattedTotal = currencyFormat.format(_totalAmount);
    final formattedRate = currencyFormat.format(_ratePerMinute);

    bool hasEnoughBalance = _wallet != null && _wallet!.balance >= _totalAmount;
    String walletBalance = _wallet != null ? currencyFormat.format(_wallet!.balance) : '...';

    return PopScope(
      canPop: false, // Prevent going back without payment
      onPopInvokedWithResult: (bool didPop, Object? result) async {
        if (!didPop) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Please complete the payment')),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text('Chat Payment'),
          automaticallyImplyLeading: false,
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Astrologer card
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundImage: NetworkImage(widget.astrologer.userAvatar.toString()),
                          backgroundColor: Colors.grey.shade200,
                        ),
                        SizedBox(height: 16),
                        Text(
                          '${widget.astrologer.firstName} ${widget.astrologer.lastName}',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          widget.astrologer.astroType.toString(),
                          style: TextStyle(
                            color: Colors.grey.shade600,
                          ),
                        ),
                        SizedBox(height: 24),
                        Text(
                          'Chat Session Summary',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8),
                        Divider(),
                      ],
                    ),
                  ),
                ),

                SizedBox(height: 16),

                // Bill details card
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bill Details',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 16),
                        _buildBillRow('Rate per minute', formattedRate),
                        _buildBillRow('Duration', '$_durationInMinutes min'),
                        Divider(height: 32),
                        _buildBillRow(
                          'Total Amount',
                          formattedTotal,
                          isTotal: true,
                        ),
                      ],
                    ),
                  ),
                ),

                SizedBox(height: 16),

                // Wallet balance card
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: _isLoadingWallet
                        ? Center(
                            child: Padding(
                              padding: EdgeInsets.all(24.0),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Wallet Balance',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    walletBalance,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: hasEnoughBalance ? Colors.green : Colors.red,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 8),
                              if (!hasEnoughBalance)
                                Text(
                                  'Your wallet balance is insufficient for this payment. Please add money or use direct payment.',
                                  style: TextStyle(
                                    color: Colors.red.shade700,
                                    fontSize: 14,
                                  ),
                                ),
                            ],
                          ),
                  ),
                ),

                SizedBox(height: 24),

                // Payment buttons
                Column(
                  children: [
                    // Pay with wallet button
                    ElevatedButton(
                      onPressed: (_isLoadingWallet || _isProcessingWallet || !hasEnoughBalance) ? null : _payFromWallet,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        minimumSize: Size(double.infinity, 50),
                      ),
                      child: _isProcessingWallet
                          ? CircularProgressIndicator(color: Colors.white)
                          : Text(
                              'Pay from Wallet',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),

                    SizedBox(height: 16),

                    // Direct payment button
                    ElevatedButton(
                      onPressed: _isProcessingRazorpay ? null : _payWithRazorpay,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Theme.of(context).primaryColor,
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: BorderSide(color: Theme.of(context).primaryColor),
                        ),
                        minimumSize: Size(double.infinity, 50),
                      ),
                      child: _isProcessingRazorpay
                          ? CircularProgressIndicator(color: Theme.of(context).primaryColor)
                          : Text(
                              'Pay with Razorpay',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ],
                ),

                SizedBox(height: 16),

                // Payment security note
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.security, color: Colors.grey.shade600),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Your payment is secure and processed via Razorpay. Your payment details are not stored with us.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
