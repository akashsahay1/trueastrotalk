import 'package:flutter/material.dart';
import '../services/socket/socket_service.dart';
import '../services/webrtc/webrtc_service.dart';
import '../services/service_locator.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';

class ChatTestScreen extends StatefulWidget {
  const ChatTestScreen({super.key});

  @override
  State<ChatTestScreen> createState() => _ChatTestScreenState();
}

class _ChatTestScreenState extends State<ChatTestScreen> {
  final _messageController = TextEditingController();
  final _sessionIdController = TextEditingController();
  final _targetUserController = TextEditingController();
  
  final SocketService _socketService = getIt<SocketService>();
  final WebRTCService _webrtcService = getIt<WebRTCService>();
  
  final List<Map<String, dynamic>> _messages = [];
  String? _currentSessionId;
  bool _isConnected = false;

  @override
  void initState() {
    super.initState();
    _setupListeners();
    _sessionIdController.text = '676b8b9f2f1b2c3d4e5f6789'; // Sample session ID
    _targetUserController.text = '676b8c9f2f1b2c3d4e5f6789'; // Sample target user ID
  }

  void _setupListeners() {
    // Listen to socket connection
    _socketService.connectionStream.listen((connected) {
      setState(() {
        _isConnected = connected;
      });
    });

    // Listen to messages
    _socketService.messageStream.listen((message) {
      setState(() {
        _messages.add({
          'id': message.id,
          'content': message.content,
          'senderName': message.senderName,
          'senderType': message.senderType,
          'timestamp': message.timestamp,
        });
      });
    });

    // Listen to typing indicators
    _socketService.typingStream.listen((data) {
      // Handle typing indicators
      debugPrint('Typing: $data');
    });

    // Listen to WebRTC call states
    _webrtcService.callStateStream.listen((state) {
      debugPrint('Call state: $state');
      // Handle call state changes in UI
    });
  }

  Future<void> _connectSocket() async {
    try {
      await _socketService.connect();
      await _webrtcService.initialize();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Socket connected successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Connection failed: $e')),
      );
    }
  }

  Future<void> _joinSession() async {
    if (_sessionIdController.text.isEmpty) return;
    
    try {
      await _socketService.joinChatSession(_sessionIdController.text);
      setState(() {
        _currentSessionId = _sessionIdController.text;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Joined session: ${_sessionIdController.text}')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to join session: $e')),
      );
    }
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.isEmpty || _currentSessionId == null) return;

    try {
      await _socketService.sendMessage(_currentSessionId!, _messageController.text);
      _messageController.clear();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    }
  }

  Future<void> _initiateVoiceCall() async {
    if (_targetUserController.text.isEmpty) return;

    try {
      await _webrtcService.initiateCall(_targetUserController.text, CallType.voice);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Voice call initiated')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to initiate call: $e')),
      );
    }
  }

  Future<void> _initiateVideoCall() async {
    if (_targetUserController.text.isEmpty) return;

    try {
      await _webrtcService.initiateCall(_targetUserController.text, CallType.video);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Video call initiated')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to initiate call: $e')),
      );
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _sessionIdController.dispose();
    _targetUserController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat & WebRTC Test'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        actions: [
          Container(
            padding: const EdgeInsets.all(8),
            child: Center(
              child: Text(
                _isConnected ? 'Connected' : 'Disconnected',
                style: AppTextStyles.bodySmall.copyWith(
                  color: _isConnected ? Colors.green : Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Connection section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Connection', style: AppTextStyles.heading6),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _isConnected ? null : _connectSocket,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                      ),
                      child: Text(_isConnected ? 'Connected' : 'Connect Socket'),
                    ),
                  ],
                ),
              ),
            ),
            
            // Session section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Chat Session', style: AppTextStyles.heading6),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _sessionIdController,
                      decoration: const InputDecoration(
                        labelText: 'Session ID',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _isConnected ? _joinSession : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                      ),
                      child: Text(_currentSessionId != null ? 'Joined Session' : 'Join Session'),
                    ),
                  ],
                ),
              ),
            ),

            // WebRTC section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('WebRTC Calls', style: AppTextStyles.heading6),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _targetUserController,
                      decoration: const InputDecoration(
                        labelText: 'Target User ID',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isConnected ? _initiateVoiceCall : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: AppColors.white,
                            ),
                            child: const Text('Voice Call'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isConnected ? _initiateVideoCall : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: AppColors.white,
                            ),
                            child: const Text('Video Call'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Messages section
            Expanded(
              child: Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text('Messages', style: AppTextStyles.heading6),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          return ListTile(
                            title: Text(message['content']),
                            subtitle: Text('${message['senderName']} (${message['senderType']})'),
                            trailing: Text(
                              '${message['timestamp'].hour}:${message['timestamp'].minute.toString().padLeft(2, '0')}',
                              style: AppTextStyles.bodySmall,
                            ),
                          );
                        },
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border(top: BorderSide(color: Colors.grey.shade300)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              decoration: const InputDecoration(
                                hintText: 'Type a message...',
                                border: OutlineInputBorder(),
                              ),
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: _currentSessionId != null ? _sendMessage : null,
                            icon: const Icon(Icons.send),
                            color: AppColors.primary,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}