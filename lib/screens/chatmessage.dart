import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:trueastrotalk/models/astrologer.dart';
import 'package:trueastrotalk/models/chatmessage.dart';
import 'package:trueastrotalk/services/chatmessage.dart';
import 'package:trueastrotalk/screens/payments.dart';

class ChatScreen extends StatefulWidget {
  final Astrologer astrologer;
  final String chatId;
  final Map<String, dynamic>? chatData;

  const ChatScreen({
    Key? key,
    required this.astrologer,
    required this.chatId,
    this.chatData,
  }) : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ChatMessage> _messages = [];
  bool _isLoading = true;
  bool _isChatEnding = false;
  bool _isTimerRunning = false;

  // Timer variables
  Timer? _timer;
  DateTime? _startTime;
  Duration _elapsedTime = Duration.zero;

  // For polling new messages
  Timer? _messagePollingTimer;

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
      // Start or resume the chat
      await _startChat();

      // Load initial messages
      await _loadMessages();

      // Start polling for new messages
      _startMessagePolling();

      // Start the timer
      _startTimer();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error initializing chat: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _startChat() async {
    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Check if we need to start the chat (first-time) or resume (coming back to app)
      if (widget.chatData != null && widget.chatData!['status'] == 'accepted') {
        // First time entering chat after acceptance - start the timer
        final response = await _apiService.post(
          'chat/${widget.chatId}/start',
          {},
        );

        if (response['success'] != true) {
          throw Exception(response['message'] ?? 'Failed to start chat');
        }

        // Set start time from the response
        _startTime = DateTime.parse(response['data']['start_time']);
      } else {
        // Get chat details to resume
        final response = await _apiService.get('chat/${widget.chatId}');

        if (response['success'] != true) {
          throw Exception(response['message'] ?? 'Failed to get chat details');
        }

        // Set start time from the response
        _startTime = DateTime.parse(response['data']['start_time']);
      }
    } catch (e) {
      rethrow;
    }
  }

  void _startTimer() {
    if (_startTime == null || _isTimerRunning) return;

    _isTimerRunning = true;

    // Calculate initial elapsed time if we're resuming
    if (_startTime != null) {
      final now = DateTime.now();
      _elapsedTime = now.difference(_startTime!);
    }

    // Start a timer that updates every second
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_startTime != null) {
        final now = DateTime.now();

        setState(() {
          _elapsedTime = now.difference(_startTime!);
        });
      }
    });
  }

//   void _pauseTimer() {
//     _timer?.cancel();
//     _isTimerRunning = false;
//   }

  Future<void> _loadMessages() async {
    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Get messages from API
      final response = await _apiService.get('chat/${widget.chatId}/messages');

      if (response['success'] == true) {
        final List<dynamic> messagesData = response['data'] ?? [];

        setState(() {
          _messages = messagesData.map((messageData) => ChatMessage.fromJson(messageData)).toList();
        });

        // Scroll to bottom after messages load
        _scrollToBottom();
      }
    } catch (e) {
      print('Error loading messages: $e');
    }
  }

  void _startMessagePolling() {
    // Poll for new messages every 2 seconds
    _messagePollingTimer = Timer.periodic(Duration(seconds: 2), (timer) async {
      if (_messages.isNotEmpty) {
        await _loadNewMessages();
      }
    });
  }

  Future<void> _loadNewMessages() async {
    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null || _messages.isEmpty) return;

      // Get latest message ID to fetch only newer messages
      final lastMessageId = _messages.last.id;

      // Get new messages from API
      final response = await _apiService.get('chat/${widget.chatId}/messages?after_id=$lastMessageId');

      if (response['success'] == true) {
        final List<dynamic> newMessagesData = response['data'] ?? [];

        if (newMessagesData.isNotEmpty) {
          final newMessages = newMessagesData.map((messageData) => ChatMessage.fromJson(messageData)).toList();

          setState(() {
            _messages.addAll(newMessages);
          });

          // Scroll to bottom when new messages arrive
          _scrollToBottom();
        }
      }
    } catch (e) {
      print('Error loading new messages: $e');
    }
  }

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final messageText = _messageController.text.trim();
    _messageController.clear();

    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // Optimistically add message to UI
      final tempMessage = ChatMessage(
        id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
        chatId: widget.chatId,
        senderId: 'current_user',
        message: messageText,
        timestamp: DateTime.now(),
        isFromCurrentUser: true,
      );

      setState(() {
        _messages.add(tempMessage);
      });

      _scrollToBottom();

      // Send message to API
      final response = await _apiService.post(
        'chat/${widget.chatId}/messages',
        {'message': messageText},
      );

      if (response['success'] != true) {
        // If sending fails, show error and remove the temp message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send message')),
        );

        setState(() {
          _messages.removeWhere((msg) => msg.id == tempMessage.id);
        });
      } else {
        // Force a refresh of messages to get the server-generated message
        await _loadMessages();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error sending message: ${e.toString()}')),
      );
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
    // If controller doesn't have clients yet, schedule scroll for next frame
    else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return "$hours:$minutes:$seconds";
  }

  Future<void> _endChat() async {
    setState(() {
      _isChatEnding = true;
    });

    try {
      // Get user token
      final prefs = await SharedPreferences.getInstance();
      final userToken = prefs.getString('user_token');

      if (userToken == null) {
        throw Exception('User not authenticated');
      }

      // End the chat
      final response = await _apiService.post(
        'chat/${widget.chatId}/end',
        {},
      );

      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to end chat');
      }

      // Navigate to payment screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ChatPaymentScreen(
            astrologer: widget.astrologer,
            chatSummary: response['data'],
          ),
        ),
      );
    } catch (e) {
      setState(() {
        _isChatEnding = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error ending chat: ${e.toString()}')),
      );
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _timer?.cancel();
    _messagePollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.astrologer.name),
            Text(
              widget.astrologer.price,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            margin: EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Icon(Icons.timer, size: 16),
                SizedBox(width: 4),
                Text(_formatDuration(_elapsedTime)),
              ],
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Timer and info banner
                Container(
                  padding: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  color: Colors.amber.shade100,
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.amber.shade800),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'You will be charged ${widget.astrologer.price} per minute. Current duration: ${_formatDuration(_elapsedTime)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.amber.shade900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Chat messages
                Expanded(
                  child: _messages.isEmpty
                      ? Center(
                          child: Text(
                            'Start chatting with ${widget.astrologer.name}',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: EdgeInsets.all(16),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) {
                            final message = _messages[index];
                            return _buildMessageBubble(message);
                          },
                        ),
                ),
                // Input area
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 4,
                        offset: Offset(0, -1),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            decoration: InputDecoration(
                              hintText: 'Type a message...',
                              filled: true,
                              fillColor: Colors.grey.shade100,
                              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            textCapitalization: TextCapitalization.sentences,
                          ),
                        ),
                        SizedBox(width: 8),
                        CircleAvatar(
                          backgroundColor: Theme.of(context).primaryColor,
                          child: IconButton(
                            icon: Icon(Icons.send, color: Colors.white),
                            onPressed: _sendMessage,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
      floatingActionButton: _isLoading
          ? null
          : FloatingActionButton.extended(
              onPressed: _isChatEnding ? null : _endChat,
              icon: Icon(Icons.stop_circle),
              label: Text('End Chat'),
              backgroundColor: Colors.red,
            ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final time = DateFormat.jm().format(message.timestamp);
    final isCurrentUser = message.isFromCurrentUser;

    return Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isCurrentUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isCurrentUser)
            CircleAvatar(
              radius: 16,
              backgroundImage: NetworkImage(widget.astrologer.image),
              backgroundColor: Colors.grey.shade200,
            ),
          SizedBox(width: isCurrentUser ? 0 : 8),
          Flexible(
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isCurrentUser ? Theme.of(context).primaryColor : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.message,
                    style: TextStyle(
                      color: isCurrentUser ? Colors.white : Colors.black,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    time,
                    style: TextStyle(
                      color: isCurrentUser ? Colors.white.withValues(alpha: 0.7) : Colors.black.withValues(alpha: 0.6),
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(width: isCurrentUser ? 8 : 0),
          if (isCurrentUser)
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.grey.shade200,
              // You'd typically use the user's profile image here
              child: Icon(Icons.person, size: 16, color: Colors.grey),
            ),
        ],
      ),
    );
  }
}
