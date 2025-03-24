import 'package:flutter/material.dart';
import 'package:trueastrotalk/models/astrologer.dart';
import 'package:trueastrotalk/models/customer.dart';
import 'package:trueastrotalk/services/chatmessage.dart';

class AstrologerChatRequestScreen extends StatefulWidget {
  final Astrologer astrologer;
  final String requestId;

  const AstrologerChatRequestScreen({
    Key? key,
    required this.astrologer,
    required this.requestId,
  }) : super(key: key);

  @override
  _AstrologerChatRequestScreenState createState() => _AstrologerChatRequestScreenState();
}

class _AstrologerChatRequestScreenState extends State<AstrologerChatRequestScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _rejectionReasonController = TextEditingController();

  bool _isLoading = true;
  bool _isAccepting = false;
  bool _isRejecting = false;
  Map<String, dynamic>? _requestData;
  Customer? _customer;

  @override
  void initState() {
    super.initState();
    _loadRequestDetails();
  }

  Future<void> _loadRequestDetails() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Get request details from API
      final response = await _apiService.get('chat/request/${widget.requestId}');

      if (response['success'] == true) {
        setState(() {
          _requestData = response['data'];
          _customer = Customer.fromJson(response['data']['customer']);
        });
      } else {
        throw Exception(response['message'] ?? 'Failed to load request details');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
      Navigator.pop(context);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _acceptRequest() async {
    setState(() {
      _isAccepting = true;
    });

    try {
      final response = await _apiService.post(
        'chat/request/${widget.requestId}/accept',
        {},
      );

      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Chat request accepted successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate to chat screen
        Navigator.pushReplacementNamed(
          context,
          '/chat',
          arguments: {
            'astrologer': widget.astrologer,
            'chat_id': widget.requestId,
            'customer': _customer,
          },
        );
      } else {
        throw Exception(response['message'] ?? 'Failed to accept chat request');
      }
    } catch (e) {
      setState(() {
        _isAccepting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  Future<void> _rejectRequest() async {
    // Validate rejection reason
    if (_rejectionReasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please provide a reason for rejection')),
      );
      return;
    }

    setState(() {
      _isRejecting = true;
    });

    try {
      final response = await _apiService.post(
        'chat/request/${widget.requestId}/reject',
        {'rejection_reason': _rejectionReasonController.text.trim()},
      );

      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Chat request rejected'),
            backgroundColor: Colors.orange,
          ),
        );
        Navigator.pop(context);
      } else {
        throw Exception(response['message'] ?? 'Failed to reject chat request');
      }
    } catch (e) {
      setState(() {
        _isRejecting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  void _showRejectionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Reject Chat Request'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Please provide a reason for rejection:'),
            SizedBox(height: 16),
            TextField(
              controller: _rejectionReasonController,
              decoration: InputDecoration(
                hintText: 'Reason for rejection',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _rejectRequest();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('Reject'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Chat Request'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading ? Center(child: CircularProgressIndicator()) : _buildRequestDetails(),
    );
  }

  Widget _buildRequestDetails() {
    if (_requestData == null || _customer == null) {
      return Center(child: Text('Request details not available'));
    }

    final ratePerMinute = _requestData!['rate_per_minute']?.toStringAsFixed(2) ?? '0.00';
    final requestTime = DateTime.parse(_requestData!['request_time']);
    final timeAgo = _getTimeAgo(requestTime);

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Customer avatar
                CircleAvatar(
                  radius: 60,
                  backgroundImage: _customer!.avatar != null && _customer!.avatar!.isNotEmpty ? NetworkImage(_customer!.avatar!) : AssetImage('assets/images/avatar.jpg') as ImageProvider,
                  backgroundColor: Colors.grey.shade200,
                ),
                SizedBox(height: 16),

                // Customer name
                Text(
                  _customer!.name,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),

                // Request time
                Text(
                  'Request received $timeAgo',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                SizedBox(height: 40),

                // Rate info card
                Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(Icons.monetization_on, color: Colors.amber),
                            SizedBox(width: 8),
                            Text(
                              'Rate: ₹$ratePerMinute per minute',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        Divider(height: 24),
                        Text(
                          'You will start earning once the chat begins. Make sure you are ready to provide consultation.',
                          style: TextStyle(
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 20),

                // Notification about auto-rejection
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: Colors.orange.shade800),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'This request will expire if not answered within 5 minutes',
                          style: TextStyle(
                            color: Colors.orange.shade800,
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
        // Buttons
        SafeArea(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                // Reject button
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isAccepting || _isRejecting ? null : _showRejectionDialog,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.red,
                      side: BorderSide(color: Colors.red),
                      padding: EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isRejecting
                        ? SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text('Reject'),
                  ),
                ),
                SizedBox(width: 16),
                // Accept button
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isAccepting || _isRejecting ? null : _acceptRequest,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isAccepting
                        ? SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text('Accept'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Helper function to format time ago
  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 30) {
      return '${difference.inDays} ${difference.inDays == 1 ? 'day' : 'days'} ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }

  @override
  void dispose() {
    _rejectionReasonController.dispose();
    super.dispose();
  }
}
