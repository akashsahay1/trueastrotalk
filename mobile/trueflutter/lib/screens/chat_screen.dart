import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../common/utils/error_handler.dart';
import '../models/chat.dart';
import '../services/chat/chat_service.dart';
import '../services/socket/socket_service.dart';
import '../services/billing/billing_service.dart';
import '../services/wallet/wallet_service.dart';
import 'active_call_screen.dart';

class ChatScreen extends StatefulWidget {
  final ChatSession chatSession;

  const ChatScreen({
    super.key,
    required this.chatSession,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with TickerProviderStateMixin {
  final ChatService _chatService = ChatService.instance;
  final SocketService _socketService = SocketService.instance;
  final BillingService _billingService = BillingService.instance;
  final WalletService _walletService = WalletService.instance;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _messageFocusNode = FocusNode();
  
  late AnimationController _typingAnimationController;
  bool _isTyping = false;
  bool _otherUserTyping = false;
  List<ChatMessage> _messages = [];
  
  @override
  void initState() {
    super.initState();
    _typingAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
    
    _initializeChat();
    _setupListeners();
    _setupBillingListeners();
  }

  @override
  void dispose() {
    _typingAnimationController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    _messageFocusNode.dispose();
    _chatService.leaveChatSession();
    _billingService.removeListener(_onBillingStateChanged);
    super.dispose();
  }

  Future<void> _initializeChat() async {
    try {
      // Join the chat session
      await _chatService.joinChatSession(widget.chatSession.id);
      
      // Load messages
      _messages = _chatService.getMessagesForSession(widget.chatSession.id);
      setState(() {});
      
      // Start billing for chat session
      await _startChatBilling();
      
      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToBottom();
      });
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to join chat: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _setupListeners() {
    // Listen to new messages
    _socketService.messageStream.listen((message) {
      if (message.chatSessionId == widget.chatSession.id && mounted) {
        setState(() {
          _messages.add(message);
        });
        _scrollToBottom();
      }
    });
    
    // Listen to typing indicators
    _socketService.typingStream.listen((data) {
      if (data['chatSessionId'] == widget.chatSession.id && 
          data['userType'] == 'astrologer' && mounted) {
        setState(() {
          _otherUserTyping = data['isTyping'] ?? false;
        });
      }
    });
    
    // Listen to chat service updates
    _chatService.addListener(_onChatServiceUpdate);
  }

  void _onChatServiceUpdate() {
    if (mounted) {
      final updatedMessages = _chatService.getMessagesForSession(widget.chatSession.id);
      if (updatedMessages.length != _messages.length) {
        setState(() {
          _messages = updatedMessages;
        });
        _scrollToBottom();
      }
    }
  }

  void _setupBillingListeners() {
    // Listen to billing service state changes
    _billingService.addListener(_onBillingStateChanged);
    
    // Set up billing callbacks
    _billingService.setLowBalanceCallback((remainingMinutes) {
      if (mounted) {
        _showLowBalanceWarning(remainingMinutes);
      }
    });
    
    _billingService.setInsufficientBalanceCallback(() {
      if (mounted) {
        _handleInsufficientBalance();
      }
    });
    
    _billingService.setBillingCompleteCallback((summary) {
      if (mounted) {
        debugPrint('💰 Chat billing completed: ${summary.formattedAmount} for ${summary.formattedDuration}');
      }
    });
  }

  void _onBillingStateChanged() {
    if (mounted) {
      setState(() {
        // Trigger rebuild to update billing UI
      });
    }
  }

  Future<void> _startChatBilling() async {
    try {
      final success = await _billingService.startChatBilling(
        sessionId: widget.chatSession.id,
        astrologer: widget.chatSession.astrologer,
      );
      
      if (!success) {
        _handleInsufficientBalance();
      }
    } catch (e) {
      debugPrint('❌ Failed to start chat billing: $e');
    }
  }

  void _showLowBalanceWarning(int remainingMinutes) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚠️ Low balance warning: $remainingMinutes minutes remaining'),
          backgroundColor: AppColors.warning,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  void _handleInsufficientBalance() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('❌ Insufficient balance. Chat will end shortly.'),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );
      
      // End chat after a short delay
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          Navigator.of(context).pop();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          if (_billingService.isSessionActive) _buildBillingInfo(),
          Expanded(child: _buildMessageList()),
          if (_otherUserTyping) _buildTypingIndicator(),
          _buildMessageInput(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppColors.primary,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: AppColors.white),
        onPressed: () => Navigator.of(context).pop(),
      ),
      title: Row(
        children: [
          _buildAstrologerAvatar(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.chatSession.astrologer.fullName,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: widget.chatSession.astrologer.isOnline 
                            ? AppColors.success 
                            : AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      widget.chatSession.astrologer.isOnline ? 'Online' : 'Offline',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.call, color: AppColors.white),
          onPressed: _startCall,
        ),
        IconButton(
          icon: const Icon(Icons.more_vert, color: AppColors.white),
          onPressed: _showMoreOptions,
        ),
      ],
    );
  }

  Widget _buildAstrologerAvatar() {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.white, width: 2),
      ),
      child: ClipOval(
        child: widget.chatSession.astrologer.profileImage != null &&
                widget.chatSession.astrologer.profileImage!.isNotEmpty
            ? Image.network(
                widget.chatSession.astrologer.profileImage!,
                width: 40,
                height: 40,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildFallbackAvatar();
                },
              )
            : _buildFallbackAvatar(),
      ),
    );
  }

  Widget _buildFallbackAvatar() {
    final name = widget.chatSession.astrologer.fullName;
    final initials = name.isNotEmpty 
        ? name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase()
        : 'A';

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.white.withValues(alpha: 0.3),
            AppColors.white.withValues(alpha: 0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildMessageList() {
    if (_messages.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(Dimensions.paddingMd),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final isFromUser = message.isFromUser;
        final showDateSeparator = _shouldShowDateSeparator(index);
        
        return Column(
          children: [
            if (showDateSeparator) _buildDateSeparator(message.timestamp),
            _buildMessageBubble(message, isFromUser),
          ],
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.chat_bubble_outline,
              size: 40,
              color: AppColors.primary.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: Dimensions.spacingLg),
          Text(
            'Start Conversation',
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textPrimaryLight,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: Dimensions.spacingSm),
          Text(
            'Send a message to ${widget.chatSession.astrologer.fullName}',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    final isToday = date.day == now.day && 
        date.month == now.month && 
        date.year == now.year;
    final isYesterday = date.day == now.day - 1 && 
        date.month == now.month && 
        date.year == now.year;
    
    String dateText;
    if (isToday) {
      dateText = 'Today';
    } else if (isYesterday) {
      dateText = 'Yesterday';
    } else {
      dateText = '${date.day}/${date.month}/${date.year}';
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: Dimensions.spacingLg),
      child: Row(
        children: [
          Expanded(child: Divider(color: AppColors.borderLight)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.grey100,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              dateText,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(child: Divider(color: AppColors.borderLight)),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, bool isFromUser) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isFromUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isFromUser) ...[
            _buildSmallAvatar(),
            const SizedBox(width: 8),
          ],
          Flexible(
            flex: 7,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isFromUser ? AppColors.primary : AppColors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isFromUser ? 16 : 4),
                  bottomRight: Radius.circular(isFromUser ? 4 : 16),
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (message.type == MessageType.system) 
                    _buildSystemMessage(message)
                  else
                    _buildTextMessage(message, isFromUser),
                  const SizedBox(height: 4),
                  Text(
                    message.formattedTime,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: isFromUser 
                          ? AppColors.white.withValues(alpha: 0.7)
                          : AppColors.textSecondaryLight,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isFromUser) ...[
            const SizedBox(width: 8),
            _buildMessageStatus(message),
          ] else
            const Spacer(flex: 1),
        ],
      ),
    );
  }

  Widget _buildTextMessage(ChatMessage message, bool isFromUser) {
    return Text(
      message.content,
      style: AppTextStyles.bodyMedium.copyWith(
        color: isFromUser ? AppColors.white : AppColors.textPrimaryLight,
        height: 1.4,
      ),
    );
  }

  Widget _buildSystemMessage(ChatMessage message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.info.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        message.content,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.info,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  Widget _buildSmallAvatar() {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.borderLight, width: 1),
      ),
      child: ClipOval(
        child: widget.chatSession.astrologer.profileImage != null &&
                widget.chatSession.astrologer.profileImage!.isNotEmpty
            ? Image.network(
                widget.chatSession.astrologer.profileImage!,
                width: 24,
                height: 24,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildSmallFallbackAvatar();
                },
              )
            : _buildSmallFallbackAvatar(),
      ),
    );
  }

  Widget _buildSmallFallbackAvatar() {
    final name = widget.chatSession.astrologer.fullName;
    final initials = name.isNotEmpty ? name[0].toUpperCase() : 'A';

    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.7),
            AppColors.primary,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 10,
          ),
        ),
      ),
    );
  }

  Widget _buildMessageStatus(ChatMessage message) {
    return Icon(
      message.isRead ? Icons.done_all : Icons.done,
      size: 16,
      color: message.isRead ? AppColors.primary : AppColors.grey400,
    );
  }

  Widget _buildTypingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildSmallAvatar(),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: _buildTypingDots(),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingDots() {
    return AnimatedBuilder(
      animation: _typingAnimationController,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            final delay = index * 0.2;
            final opacity = ((_typingAnimationController.value + delay) % 1.0 * 2 - 1).abs();
            
            return Container(
              margin: EdgeInsets.only(right: index < 2 ? 4 : 0),
              child: Opacity(
                opacity: 0.3 + opacity * 0.7,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.textSecondaryLight,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingMd),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                focusNode: _messageFocusNode,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: AppColors.borderLight),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: AppColors.borderLight),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: AppColors.primary),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  filled: true,
                  fillColor: AppColors.backgroundLight,
                ),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
                onChanged: _onMessageChanged,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                onPressed: _sendMessage,
                icon: const Icon(
                  Icons.send,
                  color: AppColors.white,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _shouldShowDateSeparator(int index) {
    if (index == 0) return true;
    
    final currentMessage = _messages[index];
    final previousMessage = _messages[index - 1];
    
    final currentDate = currentMessage.timestamp;
    final previousDate = previousMessage.timestamp;
    
    return currentDate.day != previousDate.day ||
           currentDate.month != previousDate.month ||
           currentDate.year != previousDate.year;
  }

  void _onMessageChanged(String text) {
    final isCurrentlyTyping = text.isNotEmpty;
    if (isCurrentlyTyping != _isTyping) {
      _isTyping = isCurrentlyTyping;
      _chatService.sendTyping(widget.chatSession.id, _isTyping);
    }
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _chatService.sendMessage(widget.chatSession.id, text);
    _messageController.clear();
    _isTyping = false;
    _chatService.sendTyping(widget.chatSession.id, false);
    
    _scrollToBottom();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _startCall() async {
    try {
      // Prepare call data for the ActiveCallScreen
      final callData = {
        'session_id': widget.chatSession.id,
        'astrologer_id': widget.chatSession.astrologer.id,
        'astrologer_name': widget.chatSession.astrologer.fullName,
        'astrologer_image': widget.chatSession.astrologer.profileImage,
        'customer_id': widget.chatSession.user.id,
        'customer_name': widget.chatSession.user.name,
        'call_type': 'voice',
        'rate_per_minute': widget.chatSession.ratePerMinute,
        'created_at': DateTime.now().toIso8601String(),
      };
      
      // Navigate to the active call screen
      if (mounted) {
        final result = await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ActiveCallScreen(
              callData: callData,
              isIncoming: false,
            ),
          ),
        );
        
        // Handle call completion if needed
        if (result != null) {
          debugPrint('Call completed with result: $result');
        }
      }
    } catch (e) {
      debugPrint('Error starting voice call: $e');
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'call');
        ErrorHandler.logError(appError);
        ErrorHandler.showError(context, appError);
      }
    }
  }

  void _showMoreOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.call_end, color: AppColors.error),
              title: const Text('End Chat'),
              onTap: () {
                Navigator.pop(context);
                _endChat();
              },
            ),
            ListTile(
              leading: const Icon(Icons.report, color: AppColors.warning),
              title: const Text('Report Issue'),
              onTap: () {
                Navigator.pop(context);
                _reportIssue();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingInfo() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingMd,
        vertical: Dimensions.paddingSm,
      ),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        border: Border(
          bottom: BorderSide(
            color: AppColors.primary.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Current Bill: ${_billingService.getFormattedTotalBilled()}',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textPrimaryLight,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (_billingService.getCurrentRate() != null)
                Text(
                  '₹${_billingService.getCurrentRate()!.toInt()}/min',
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Balance: ${_walletService.formattedBalance}',
                style: AppTextStyles.bodySmall.copyWith(
                  color: _billingService.isLowBalance ? AppColors.warning : AppColors.textPrimaryLight,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                _billingService.getFormattedElapsedTime(),
                style: AppTextStyles.caption.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _endChat() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Chat'),
        content: const Text('Are you sure you want to end this chat session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              navigator.pop();
              // Stop billing first
              await _billingService.stopBilling();
              _chatService.endChatSession(widget.chatSession.id);
              if (mounted) {
                navigator.pop();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('End Chat'),
          ),
        ],
      ),
    );
  }

  void _reportIssue() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Report feature coming soon!'),
        backgroundColor: AppColors.info,
      ),
    );
  }
}