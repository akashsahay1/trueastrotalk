import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/chat.dart';
import '../models/astrologer.dart';
import '../models/user.dart';
import '../models/enums.dart';
import '../services/socket/socket_service.dart';
import '../services/audio/ringtone_service.dart';
import '../services/service_locator.dart';
import 'chat_screen.dart';

class IncomingChatScreen extends StatefulWidget {
  final Map<String, dynamic> chatData;

  const IncomingChatScreen({
    super.key,
    required this.chatData,
  });

  @override
  State<IncomingChatScreen> createState() => _IncomingChatScreenState();
}

class _IncomingChatScreenState extends State<IncomingChatScreen>
    with TickerProviderStateMixin {
  late final SocketService _socketService;
  late final RingtoneService _ringtoneService;

  late AnimationController _pulseController;
  late AnimationController _slideController;
  late Animation<double> _pulseAnimation;
  late Animation<Offset> _slideAnimation;

  bool _isAccepting = false;
  bool _isRejecting = false;

  @override
  void initState() {
    super.initState();
    _socketService = getIt<SocketService>();
    _ringtoneService = getIt<RingtoneService>();

    // Debug the chatData we received
    debugPrint('💬 IncomingChatScreen chatData: ${widget.chatData}');

    // Setup animations
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _slideController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutBack,
    ));

    // Start slide-in animation
    _slideController.forward();

    // Provide haptic feedback
    HapticFeedback.heavyImpact();

    // Start ringtone
    _ringtoneService.startRingtone();

    // Setup chat timeout (auto-reject after 60 seconds)
    Future.delayed(const Duration(seconds: 60), () {
      if (mounted && !_isAccepting && !_isRejecting) {
        _rejectChat();
      }
    });
  }

  @override
  void dispose() {
    _ringtoneService.stopRingtone();
    _pulseController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: SlideTransition(
        position: _slideAnimation,
        child: Container(
          width: screenWidth,
          height: screenHeight,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppColors.primaryDark,
                AppColors.backgroundDark,
              ],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(child: _buildUserInfo()),
                _buildChatActions(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Dimensions.paddingMd,
              vertical: Dimensions.paddingSm,
            ),
            decoration: BoxDecoration(
              color: AppColors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.chat_bubble,
                  color: AppColors.white,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  'Incoming Chat Request',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserInfo() {
    final chatRate = widget.chatData['chatRate'] ?? 0;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Animated profile picture
        AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _pulseAnimation.value,
              child: Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.white.withValues(alpha: 0.3),
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: ClipOval(
                  child: widget.chatData['userAvatar'] != null
                      ? Image.network(
                          widget.chatData['userAvatar'],
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return _buildDefaultAvatar();
                          },
                        )
                      : _buildDefaultAvatar(),
                ),
              ),
            );
          },
        ),

        const SizedBox(height: Dimensions.paddingXl),

        // User name
        Text(
          widget.chatData['userName'] ?? 'Customer',
          style: AppTextStyles.heading3.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: Dimensions.paddingSm),

        // Chat request info
        Text(
          'wants to start a chat',
          style: AppTextStyles.bodyLarge.copyWith(
            color: AppColors.white.withValues(alpha: 0.8),
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: Dimensions.paddingMd),

        // Chat rate info
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Dimensions.paddingMd,
            vertical: Dimensions.paddingSm,
          ),
          decoration: BoxDecoration(
            color: AppColors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            '₹$chatRate/min',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        const SizedBox(height: Dimensions.paddingMd),

        // Ringing indicator
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildRingingDot(0),
            const SizedBox(width: 8),
            _buildRingingDot(1),
            const SizedBox(width: 8),
            _buildRingingDot(2),
          ],
        ),
      ],
    );
  }

  Widget _buildDefaultAvatar() {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.2),
      child: const Icon(
        Icons.person,
        size: 80,
        color: AppColors.white,
      ),
    );
  }

  Widget _buildRingingDot(int index) {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        double opacity = 0.3;
        double scale = 1.0;

        double animationValue = _pulseController.value;
        double delay = index * 0.3;

        if (animationValue > delay && animationValue < delay + 0.4) {
          double localValue = (animationValue - delay) / 0.4;
          opacity = 0.3 + (0.7 * localValue);
          scale = 1.0 + (0.3 * localValue);
        }

        return Transform.scale(
          scale: scale,
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.white.withValues(alpha: opacity),
            ),
          ),
        );
      },
    );
  }

  Widget _buildChatActions() {
    return Padding(
      padding: const EdgeInsets.all(Dimensions.paddingXl),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Reject button
          _buildActionButton(
            onPressed: _isAccepting ? null : _rejectChat,
            backgroundColor: AppColors.error,
            icon: Icons.close,
            label: 'Decline',
            isLoading: _isRejecting,
          ),

          // Accept button
          _buildActionButton(
            onPressed: _isRejecting ? null : _acceptChat,
            backgroundColor: AppColors.success,
            icon: Icons.chat,
            label: 'Accept',
            isLoading: _isAccepting,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required VoidCallback? onPressed,
    required Color backgroundColor,
    required IconData icon,
    required String label,
    bool isLoading = false,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onPressed != null
              ? () {
                  HapticFeedback.mediumImpact();
                  onPressed();
                }
              : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 85,
            height: 85,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: onPressed == null
                  ? null
                  : LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        backgroundColor,
                        backgroundColor.withValues(alpha: 0.8),
                      ],
                    ),
              color:
                  onPressed == null ? backgroundColor.withValues(alpha: 0.5) : null,
              border: Border.all(
                color: AppColors.white.withValues(alpha: 0.3),
                width: 2,
              ),
              boxShadow: onPressed == null
                  ? []
                  : [
                      BoxShadow(
                        color: backgroundColor.withValues(alpha: 0.4),
                        blurRadius: 20,
                        spreadRadius: 2,
                        offset: const Offset(0, 6),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 15,
                        spreadRadius: 1,
                        offset: const Offset(0, 4),
                      ),
                    ],
            ),
            child: isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                      strokeWidth: 2.5,
                    ),
                  )
                : Icon(
                    icon,
                    color: AppColors.white,
                    size: 32,
                  ),
          ),
        ),
        const SizedBox(height: Dimensions.paddingSm),
        Text(
          label,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.white.withValues(alpha: 0.9),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  void _rejectChat() async {
    if (_isRejecting || _isAccepting) return;

    setState(() {
      _isRejecting = true;
    });

    try {
      // Stop ringtone
      _ringtoneService.stopRingtone();

      // Provide haptic feedback
      HapticFeedback.mediumImpact();

      // Send reject chat event
      _socketService.emit('reject_chat', {
        'sessionId': widget.chatData['sessionId'],
        'reason': 'busy',
      });

      // Close the screen
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      debugPrint('Failed to reject chat: $e');
      if (mounted) {
        Navigator.of(context).pop();
      }
    }
  }

  void _acceptChat() async {
    if (_isAccepting || _isRejecting) return;

    setState(() {
      _isAccepting = true;
    });

    try {
      // Stop ringtone
      _ringtoneService.stopRingtone();

      // Provide haptic feedback
      HapticFeedback.mediumImpact();

      final sessionId = widget.chatData['sessionId']?.toString() ?? '';
      debugPrint('💬 Accepting chat session: $sessionId');

      // Send accept chat event via socket
      _socketService.emit('accept_chat', {
        'sessionId': sessionId,
      });

      // Create ChatSession from chatData we already have
      final session = _createSessionFromChatData();

      // Navigate to chat screen with the session
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => ChatScreen(chatSession: session),
          ),
        );
      }
    } catch (e) {
      debugPrint('❌ Failed to accept chat: $e');
      setState(() {
        _isAccepting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to accept chat: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  /// Create a ChatSession from the chatData received in notification
  ChatSession _createSessionFromChatData() {
    final data = widget.chatData;
    final sessionId = data['sessionId']?.toString() ?? '';
    final chatRate = (data['chatRate'] as num?)?.toDouble() ?? 0.0;
    final now = DateTime.now();

    // Create User from chatData (the customer who initiated the chat)
    final user = User(
      id: data['userId']?.toString() ?? '',
      name: data['userName']?.toString() ?? 'Customer',
      email: null,
      phone: null,
      role: UserRole.customer,
      accountStatus: AccountStatus.active,
      verificationStatus: VerificationStatus.verified,
      authType: AuthType.email,
      createdAt: now,
      updatedAt: now,
    );

    // Create Astrologer from chatData (the current user - astrologer)
    final astrologer = Astrologer(
      id: data['astrologerId']?.toString() ?? '',
      fullName: data['astrologerName']?.toString() ?? 'Astrologer',
      emailAddress: '',
      phoneNumber: '',
      chatRate: chatRate,
      callRate: chatRate,
      videoRate: chatRate,
      isOnline: true,
      isAvailable: true,
      experienceYears: 0,
      rating: 0.0,
      totalReviews: 0,
      totalConsultations: 0,
      languages: const [],
      skills: const [],
      qualifications: const [],
      accountStatus: 'active',
      verificationStatus: VerificationStatus.verified,
      createdAt: now,
      updatedAt: now,
    );

    return ChatSession(
      id: sessionId,
      user: user,
      astrologer: astrologer,
      status: ChatStatus.active,
      ratePerMinute: chatRate,
      startTime: now,
      durationMinutes: 0,
      totalAmount: 0.0,
      unreadCount: 0,
      messages: const [],
      createdAt: now,
      updatedAt: now,
    );
  }
}
