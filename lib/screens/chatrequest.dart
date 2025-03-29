import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trueastrotalk/models/astrologer.dart';
import 'package:trueastrotalk/services/chatmessage.dart';
import 'package:trueastrotalk/screens/chatmessage.dart';

class ChatRequestScreen extends StatefulWidget {
  final Astrologer astrologer;
  final String? chatRequestId;

  const ChatRequestScreen({
    Key? key,
    required this.astrologer,
    this.chatRequestId,
  }) : super(key: key);

  @override
  _ChatRequestScreenState createState() => _ChatRequestScreenState();
}

class _ChatRequestScreenState extends State<ChatRequestScreen> {
  final ApiService _apiService = ApiService();

  String _requestStatus = 'pending';
  String? _chatRequestId;
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
      if (widget.chatRequestId != null) {
        // Resume existing chat request
        _chatRequestId = widget.chatRequestId;
        await _checkRequestStatus();
      } else {
        // Create a new chat request
        await _createChatRequest();
      }

      // Start polling for status updates
      _startStatusPolling();
    } catch (e) {
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text('Error: ${e.toString()}')),
      // );
      Navigator.pop(context);
    } finally {
      setState(
        () {
          _isLoading = false;
        },
      );
    }
  }

  Future<void> _createChatRequest() async {
    try {
      // Get user token from SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Make API call to create chat request
      final response = await _apiService.post(
        'chat/request',
        {'astrologer_id': widget.astrologer.id},
      );

      if (response['success'] == true) {
        setState(() {
          _chatRequestId = response['data']['id'].toString();
          _requestStatus = response['data']['status'];
        });
      } else {
        throw Exception(response['message'] ?? 'Failed to create chat request');
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
    if (_chatRequestId == null) return;

    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Make API call to check request status
      final response = await _apiService.get('chat/request/$_chatRequestId');

      if (response['success'] == true) {
        final status = response['data']['status'];

        setState(() {
          _requestStatus = status;
        });

        // Handle status changes
        if (status == 'accepted') {
          _handleChatAccepted(response['data']);
        } else if (status == 'rejected') {
          _handleChatRejected(response['data']['rejection_reason']);
        }
      }
    } catch (e) {
      print('Error checking request status: $e');
    }
  }

  void _handleChatAccepted(Map<String, dynamic> chatData) {
    // Stop polling
    _statusCheckTimer?.cancel();

    // Show success toast
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.astrologer.name} has accepted your chat request!'),
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
            chatId: _chatRequestId!,
            chatData: chatData,
          ),
        ),
      );
    });
  }

  void _handleChatRejected(String? reason) {
    // Stop polling
    _statusCheckTimer?.cancel();

    // Show rejection message
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Chat Request Rejected'),
        content: Text(
          reason != null && reason.isNotEmpty ? 'Your chat request was rejected: $reason' : 'Your chat request was rejected by the astrologer.',
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
    if (_chatRequestId == null) return;

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
        'chat/request/$_chatRequestId/cancel',
        {},
      );

      if (response['success'] == true) {
        _statusCheckTimer?.cancel();
        Navigator.pushReplacementNamed(context, '/astrologer-details', arguments: {
          'astrologer': widget.astrologer,
        });
      } else {
        throw Exception(response['message'] ?? 'Failed to cancel request');
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
                content: Text('Do you want to cancel your chat request with ${widget.astrologer.name}?'),
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
          ? Center(child: CircularProgressIndicator())
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
                            backgroundImage: NetworkImage(widget.astrologer.image),
                            backgroundColor: Colors.grey.shade200,
                          ),
                          SizedBox(height: 20),
                          Text(
                            widget.astrologer.name,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            widget.astrologer.speciality,
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
                              widget.astrologer.price,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          SizedBox(height: 40),
                          if (_requestStatus == 'pending') ...[
                            CircularProgressIndicator(),
                            SizedBox(height: 24),
                            Text(
                              'Waiting for ${widget.astrologer.name} to accept your chat request...',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 16,
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
                              'Chat request accepted! Redirecting to chat...',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.green,
                              ),
                            ),
                          ],
                          SizedBox(height: 48),
                          Text(
                            'You will only be charged once the chat begins',
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
                          backgroundColor: Colors.red,
                          minimumSize: Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
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
