import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/screens/astrologer_details.dart';
import 'package:trueastrotalk/screens/chatmessage.dart';
import 'package:trueastrotalk/services/apiservice.dart';
import 'package:trueastrotalk/utilities/strings.dart';

class AstrologerCallRequestScreen extends StatefulWidget {
  final User astrologer;
  final String? callRequestId;

  const AstrologerCallRequestScreen({
    Key? key,
    required this.astrologer,
    this.callRequestId,
  }) : super(key: key);

  @override
  _CallRequestScreenState createState() => _CallRequestScreenState();
}

class _CallRequestScreenState extends State<AstrologerCallRequestScreen> {
  final ApiService _apiService = ApiService();

  String _requestStatus = 'pending';
  String? _callRequestId;
  bool _isLoading = true;
  bool _isCancelling = false;

  // For polling the request status
  Timer? _statusCheckTimer;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    setState(() {
      _isLoading = true;
    });

    try {
      if (_callRequestId != null) {
        print(_callRequestId);
        // Resume existing chat request
        _callRequestId = _callRequestId;
        await _checkRequestStatus();
      } else {
        //print(widget.chatRequestId);
        // Create a new chat request
        await _createCallRequest();
      }

      // Start polling for status updates
      _startStatusPolling();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${e.toString()}')),
      );
      Navigator.pop(context);
    } finally {
      setState(
        () {
          _isLoading = false;
        },
      );
    }
  }

  Future<void> _createCallRequest() async {
    try {
      // Get user token from SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Make API call to create call request
      final response = await _apiService.post('calls/request', body: {'astrologer_id': widget.astrologer.ID});

      if (response['success'] == true) {
        setState(() {
          _callRequestId = response['data']['id'].toString();
          _requestStatus = response['data']['status'];
        });
      } else {
        print("Error creating new call request!");
        throw Exception(response['message'] ?? 'Failed to create call request');
      }
    } catch (e) {
      rethrow;
    }
  }

  void _startStatusPolling() {
    // Poll every 3 seconds
    _statusCheckTimer = Timer.periodic(Duration(seconds: 3), (timer) async {
      await _checkRequestStatus();
    });
  }

  Future<void> _checkRequestStatus() async {
    if (_callRequestId == null) return;

    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Make API call to check request status
      final response = await _apiService.get('call/request/$_callRequestId');

      if (response['success'] == true) {
        final status = response['data']['status'];

        setState(() {
          _requestStatus = status;
        });

        // Handle status changes
        if (status == 'accepted') {
          _handleCallAccepted(response['data']);
        } else if (status == 'rejected') {
          _handleCallRejected(response['data']['rejection_reason']);
        }
      }
    } catch (e) {
      print('Error checking request status: $e');
    }
  }

  void _handleCallAccepted(Map<String, dynamic> chatData) {
    // Stop polling
    _statusCheckTimer?.cancel();

    // Show success toast
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.astrologer.firstName} ${widget.astrologer.lastName} has accepted your chat request!'),
        backgroundColor: Colors.green,
      ),
    );

    // Navigate to chat screen after a short delay
    Future.delayed(Duration(seconds: 1), () {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            astrologer: widget.astrologer,
            chatId: _callRequestId!,
            chatData: chatData,
          ),
        ),
      );
    });
  }

  void _handleCallRejected(String? reason) {
    // Stop polling
    _statusCheckTimer?.cancel();

    // Show rejection message
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Call Request Rejected'),
        content: Text(
          reason != null && reason.isNotEmpty ? 'Your call request was rejected: $reason' : 'Your call request was rejected by the astrologer.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(); // Go back to previous screen
            },
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelRequest() async {
    if (_callRequestId == null) return;

    setState(() {
      _isCancelling = true;
    });

    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Make API call to cancel request
      final response = await _apiService.post(
        'call/request/$_callRequestId/cancel',
        body: {},
      );

      if (response['success'] == true) {
        _statusCheckTimer?.cancel();
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => AstrologerDetails(
              astrologer: widget.astrologer,
            ),
          ),
        );
      } else {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => AstrologerDetails(
              astrologer: widget.astrologer,
            ),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isCancelling = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error cancelling request: ${e.toString()}')),
      );
    }
  }

  @override
  void dispose() {
    _statusCheckTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Chat Request'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () {
            // Show confirmation dialog before going back
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: Text('Cancel Request?'),
                content: Text('Do you want to cancel your call request with ${widget.astrologer.firstName} ${widget.astrologer.lastName}?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('No'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _cancelRequest();
                    },
                    child: Text('Yes'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                color: Color.fromARGB(255, 1, 141, 20),
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircleAvatar(
                            radius: 60,
                            backgroundImage: NetworkImage('${Environment.baseUrl}/${widget.astrologer.userAvatar.toString()}'),
                            backgroundColor: Colors.grey.shade200,
                          ),
                          SizedBox(height: 20),
                          Text(
                            '${widget.astrologer.firstName} ${widget.astrologer.lastName}'.toTitleCase(),
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.6,
                            ),
                          ),
                          Text(
                            widget.astrologer.astroType.toString(),
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          SizedBox(height: 8),
                          Container(
                            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '₹${widget.astrologer.astroCharges.toString()}/min',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          SizedBox(height: 40),
                          if (_requestStatus == 'pending') ...[
                            CircularProgressIndicator(
                              color: Color.fromARGB(255, 1, 141, 20),
                            ),
                            SizedBox(height: 24),
                            Text(
                              'Waiting for ${widget.astrologer.firstName} ${widget.astrologer.lastName} to accept your call request...',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 16,
                                letterSpacing: 0,
                              ),
                            ),
                          ] else if (_requestStatus == 'accepted') ...[
                            Icon(
                              Icons.check_circle,
                              color: Colors.green,
                              size: 64,
                            ),
                            SizedBox(height: 16),
                            Text(
                              'Call request accepted! Redirecting to chat...',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.green,
                              ),
                            ),
                          ],
                          SizedBox(height: 48),
                          Text(
                            'You will only be charged once the call begins',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade600,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_requestStatus == 'pending')
                  SafeArea(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: ElevatedButton(
                        onPressed: _isCancelling ? null : _cancelRequest,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color.fromARGB(255, 1, 141, 20),
                          foregroundColor: Colors.white,
                          minimumSize: Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: _isCancelling
                            ? CircularProgressIndicator(color: Colors.white)
                            : Text(
                                'Cancel Request',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
