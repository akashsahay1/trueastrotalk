import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/dimensions.dart';
import '../../common/utils/error_handler.dart';
import '../../models/chat.dart';
import '../../models/call.dart';
import '../../models/enums.dart';
import '../../services/chat/chat_service.dart';
import '../../services/socket/socket_service.dart';
import '../../services/billing/billing_service.dart';
import '../../services/wallet/wallet_service.dart';
import '../../services/call/call_service.dart';
import '../../services/auth/auth_service.dart';
import '../../services/api/chat_api_service.dart';
import '../../services/service_locator.dart';
import '../../config/config.dart';
import 'active_call.dart';

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
  StreamSubscription<Map<String, dynamic>>? _chatEndedSubscription;

  // Astrologer timer state
  bool _isAstrologer = false;
  Timer? _astrologerTimer;
  Duration _elapsedTime = Duration.zero;
  DateTime? _sessionStartTime;

  // Current user ID for message alignment
  String? _currentUserId;

  // Attachment state
  final ImagePicker _imagePicker = ImagePicker();
  bool _isUploadingAttachment = false;
  
  @override
  void initState() {
    super.initState();
    _typingAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();

    // Detect if current user is astrologer
    _detectUserType();

    _initializeChat();
    _setupListeners();
    _setupBillingListeners();
  }

  void _detectUserType() {
    try {
      final authService = getIt<AuthService>();
      // Use role from auth service - more reliable than ID comparison
      _isAstrologer = authService.currentUser?.role == UserRole.astrologer;
      // Store current user ID for message alignment
      _currentUserId = authService.currentUser?.id;
      debugPrint('💬 Chat screen - isAstrologer: $_isAstrologer (role: ${authService.currentUser?.role}, userId: $_currentUserId)');
    } catch (e) {
      debugPrint('❌ Error detecting user type: $e');
      _isAstrologer = false;
    }
  }

  /// Constructs full image URL from relative path
  /// Works on Android, iOS, local testing, and production
  String _getFullImageUrl(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty) return '';

    // If already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Construct full URL using server base URL
    final baseUrl = Config.socketUrlSync;
    // Ensure no double slashes
    if (imageUrl.startsWith('/')) {
      return '$baseUrl$imageUrl';
    }
    return '$baseUrl/$imageUrl';
  }

  @override
  void dispose() {
    _chatEndedSubscription?.cancel();
    _astrologerTimer?.cancel();
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
      // Join the chat session (pass the session in case it's not in local list)
      await _chatService.joinChatSession(widget.chatSession.id, session: widget.chatSession);
      
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
    // Listen to chat service updates (single source of truth for messages)
    _chatService.addListener(_onChatServiceUpdate);

    // Listen to typing indicators
    _socketService.typingStream.listen((data) {
      if (data['chatSessionId'] == widget.chatSession.id && mounted) {
        // Check if the typing user is different from current user
        final typingUserId = data['userId']?.toString();
        final currentUserId = widget.chatSession.user.id;
        if (typingUserId != currentUserId) {
          setState(() {
            _otherUserTyping = data['isTyping'] ?? false;
          });
        }
      }
    });

    // Listen for chat ended event (when astrologer or other party ends the chat)
    _chatEndedSubscription = _socketService.chatEndedStream.listen((data) {
      final sessionId = data['sessionId']?.toString();
      if (sessionId == widget.chatSession.id && mounted) {
        _handleChatEndedByOther(data);
      }
    });
  }

  void _handleChatEndedByOther(Map<String, dynamic> data) {
    debugPrint('🔚 Chat ended by other party: $data');

    // Stop billing
    _billingService.stopBilling();

    // Show dialog with session summary
    final durationMinutes = data['durationMinutes'] ?? 0;
    final totalAmount = data['totalAmount'] ?? 0;

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppColors.white,
          surfaceTintColor: AppColors.white,
          title: Text(
            'Chat Ended',
            style: AppTextStyles.heading5.copyWith(
              color: AppColors.textPrimaryLight,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'This chat session has ended.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Duration: $durationMinutes minutes',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
              Text(
                'Total: ₹$totalAmount',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back from chat screen
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
              ),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
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
      if (_isAstrologer) {
        // For astrologers, just start a local timer
        _startAstrologerTimer();
      } else {
        // For customers, use billing service
        final success = await _billingService.startChatBilling(
          sessionId: widget.chatSession.id,
          astrologer: widget.chatSession.astrologer,
          userId: widget.chatSession.user.id,
        );

        if (!success) {
          _handleInsufficientBalance();
        }
      }
    } catch (e) {
      debugPrint('❌ Failed to start chat billing: $e');
    }
  }

  void _startAstrologerTimer() {
    _sessionStartTime = DateTime.now();
    _astrologerTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _elapsedTime = DateTime.now().difference(_sessionStartTime!);
        });
      }
    });
    debugPrint('⏱️ Astrologer timer started');
  }

  String _formatElapsedTime() {
    final minutes = _elapsedTime.inMinutes;
    final seconds = _elapsedTime.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  double _calculateEarnings() {
    final minutes = _elapsedTime.inMinutes + (_elapsedTime.inSeconds % 60 > 0 ? 1 : 0);
    return minutes * widget.chatSession.ratePerMinute;
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
    // Show billing info for customers (when billing active) or astrologers (when timer running)
    final showBillingInfo = _isAstrologer ? _astrologerTimer != null : _billingService.isSessionActive;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          if (showBillingInfo) _buildBillingInfo(),
          Expanded(child: _buildMessageList()),
          if (_otherUserTyping) _buildTypingIndicator(),
          _buildMessageInput(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    // Show the other person's info (astrologer for customer, customer for astrologer)
    final otherPersonName = _isAstrologer
        ? widget.chatSession.user.name
        : widget.chatSession.astrologer.fullName;
    final otherPersonImage = _isAstrologer
        ? widget.chatSession.user.profilePicture
        : widget.chatSession.astrologer.profileImage;
    final isOtherPersonOnline = _isAstrologer
        ? true // Customers are considered online if they're in chat
        : widget.chatSession.astrologer.isOnline;

    return AppBar(
      backgroundColor: AppColors.primary,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: AppColors.white),
        onPressed: () => Navigator.of(context).pop(),
      ),
      title: Row(
        children: [
          _buildChatPartnerAvatar(otherPersonName, otherPersonImage),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  otherPersonName,
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
                        color: isOtherPersonOnline
                            ? AppColors.success
                            : AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isOtherPersonOnline ? 'Online' : 'Offline',
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

  Widget _buildChatPartnerAvatar(String name, String? imageUrl) {
    final fullImageUrl = _getFullImageUrl(imageUrl);
    final hasImage = fullImageUrl.isNotEmpty;

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.white, width: 2),
      ),
      child: ClipOval(
        child: hasImage
            ? Image.network(
                fullImageUrl,
                width: 40,
                height: 40,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildFallbackAvatar(name);
                },
              )
            : _buildFallbackAvatar(name),
      ),
    );
  }

  Widget _buildFallbackAvatar(String name) {
    final initials = name.isNotEmpty
        ? name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase()
        : 'U';

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
        // Check if message is from current user by comparing senderId
        // This works correctly for both customers and astrologers
        final isMyMessage = _currentUserId != null && message.senderId == _currentUserId;
        final showDateSeparator = _shouldShowDateSeparator(index);

        return Column(
          children: [
            if (showDateSeparator) _buildDateSeparator(message.timestamp),
            _buildMessageBubble(message, isMyMessage),
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
                  else if (message.type == MessageType.image && message.hasImage)
                    _buildImageMessage(message, isFromUser)
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

  Widget _buildImageMessage(ChatMessage message, bool isFromUser) {
    final fullImageUrl = _getFullImageUrl(message.imageUrl);
    return GestureDetector(
      onTap: () => _showFullScreenImage(fullImageUrl),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: 200,
            maxHeight: 200,
          ),
          child: Image.network(
            fullImageUrl,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Container(
                width: 150,
                height: 150,
                color: AppColors.grey100,
                child: Center(
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                            loadingProgress.expectedTotalBytes!
                        : null,
                    strokeWidth: 2,
                  ),
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              return Container(
                width: 150,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.grey100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.broken_image,
                      color: AppColors.grey400,
                      size: 32,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Image not available',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.grey400,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _showFullScreenImage(String imageUrl) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: Center(
            child: InteractiveViewer(
              panEnabled: true,
              minScale: 0.5,
              maxScale: 4,
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.broken_image, color: Colors.white, size: 48),
                        SizedBox(height: 8),
                        Text(
                          'Failed to load image',
                          style: TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ),
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
    // Show the chat partner's avatar (the other person)
    final otherPersonName = _isAstrologer
        ? widget.chatSession.user.name
        : widget.chatSession.astrologer.fullName;
    final otherPersonImage = _isAstrologer
        ? widget.chatSession.user.profilePicture
        : widget.chatSession.astrologer.profileImage;
    final fullImageUrl = _getFullImageUrl(otherPersonImage);
    final hasImage = fullImageUrl.isNotEmpty;

    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.borderLight, width: 1),
      ),
      child: ClipOval(
        child: hasImage
            ? Image.network(
                fullImageUrl,
                width: 24,
                height: 24,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildSmallFallbackAvatar(otherPersonName);
                },
              )
            : _buildSmallFallbackAvatar(otherPersonName),
      ),
    );
  }

  Widget _buildSmallFallbackAvatar(String name) {
    final initials = name.isNotEmpty ? name[0].toUpperCase() : 'U';

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
            // Attachment button
            IconButton(
              onPressed: _isUploadingAttachment ? null : _showAttachmentOptions,
              icon: _isUploadingAttachment
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(
                      Icons.attach_file,
                      color: AppColors.textSecondaryLight,
                      size: 24,
                    ),
            ),
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

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.camera_alt, color: AppColors.primary),
              ),
              title: const Text('Camera'),
              subtitle: const Text('Take a photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.photo_library, color: AppColors.success),
              ),
              title: const Text('Gallery'),
              subtitle: const Text('Choose from gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (image != null) {
        await _uploadAndSendImage(File(image.path));
      }
    } catch (e) {
      debugPrint('❌ Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _uploadAndSendImage(File imageFile) async {
    setState(() => _isUploadingAttachment = true);

    try {
      debugPrint('📎 Uploading image: ${imageFile.path}');

      // Upload image via API
      final chatApiService = getIt<ChatApiService>();
      final result = await chatApiService.uploadAttachment(
        file: imageFile,
        sessionId: widget.chatSession.id,
      );

      if (result['success']) {
        final imageUrl = result['image_url'] as String;
        debugPrint('✅ Image uploaded: $imageUrl');

        // Send the image message via socket to notify other party
        await _chatService.sendImageMessage(widget.chatSession.id, imageUrl);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Image sent successfully'),
              backgroundColor: AppColors.success,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        throw Exception(result['error'] ?? 'Failed to upload image');
      }
    } catch (e) {
      debugPrint('❌ Error uploading image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload image: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingAttachment = false);
      }
    }
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
      // Show loading indicator
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => const Center(
            child: CircularProgressIndicator(),
          ),
        );
      }

      // Create a NEW call session via CallService instead of reusing chat session ID
      final callService = CallService.instance;
      final callSession = await callService.startCallSession(
        widget.chatSession.astrologer.id,
        CallType.voice,
      );

      // Dismiss loading indicator
      if (mounted) {
        Navigator.of(context).pop();
      }

      // Prepare call data with the NEW call session ID
      final callData = {
        'session_id': callSession.id, // Use the NEW call session ID
        'astrologer_id': widget.chatSession.astrologer.id,
        'astrologer_name': widget.chatSession.astrologer.fullName,
        'astrologer_image': widget.chatSession.astrologer.profileImage,
        'customer_id': widget.chatSession.user.id,
        'customer_name': widget.chatSession.user.name,
        'call_type': 'voice',
        'rate_per_minute': callSession.ratePerMinute,
        'created_at': callSession.createdAt.toIso8601String(),
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
      // Dismiss loading indicator if still showing
      if (mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }

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
        color: _isAstrologer
            ? AppColors.success.withValues(alpha: 0.1)
            : AppColors.primary.withValues(alpha: 0.1),
        border: Border(
          bottom: BorderSide(
            color: _isAstrologer
                ? AppColors.success.withValues(alpha: 0.3)
                : AppColors.primary.withValues(alpha: 0.3),
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
                _isAstrologer
                    ? 'Earnings: ₹${_calculateEarnings().toStringAsFixed(0)}'
                    : 'Current Bill: ${_billingService.getFormattedTotalBilled()}',
                style: AppTextStyles.bodySmall.copyWith(
                  color: _isAstrologer ? AppColors.success : AppColors.textPrimaryLight,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '₹${widget.chatSession.ratePerMinute.toInt()}/min',
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
              Row(
                children: [
                  Icon(
                    Icons.timer,
                    size: 16,
                    color: _isAstrologer ? AppColors.success : AppColors.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _isAstrologer ? _formatElapsedTime() : _billingService.getFormattedElapsedTime(),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: _isAstrologer ? AppColors.success : AppColors.textPrimaryLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              if (!_isAstrologer)
                Text(
                  'Balance: ${_walletService.formattedBalance}',
                  style: AppTextStyles.caption.copyWith(
                    color: _billingService.isLowBalance ? AppColors.warning : AppColors.textSecondaryLight,
                  ),
                ),
              if (_isAstrologer)
                Text(
                  'with ${widget.chatSession.user.name}',
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
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.white,
        surfaceTintColor: AppColors.white,
        title: Text(
          'End Chat',
          style: AppTextStyles.heading5.copyWith(
            color: AppColors.textPrimaryLight,
          ),
        ),
        content: Text(
          'Are you sure you want to end this chat session?',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textPrimaryLight,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: TextStyle(color: AppColors.textSecondaryLight),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              // Close dialog first
              Navigator.pop(dialogContext);

              // Show loading indicator
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Ending chat session...'),
                    duration: Duration(seconds: 1),
                  ),
                );
              }

              try {
                // Stop billing
                await _billingService.stopBilling();
                // Stop astrologer timer if running
                _astrologerTimer?.cancel();
                // End chat session via socket and wait for it
                await _chatService.endChatSession(widget.chatSession.id);

                debugPrint('✅ Chat session ended successfully');

                // Navigate back
                if (mounted) {
                  Navigator.of(context).pop();
                }
              } catch (e) {
                debugPrint('❌ Error ending chat: $e');
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to end chat: $e'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: AppColors.white,
            ),
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