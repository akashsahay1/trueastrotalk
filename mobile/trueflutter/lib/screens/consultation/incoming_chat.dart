import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../models/chat.dart';
import '../../models/astrologer.dart';
import '../../models/user.dart';
import '../../models/enums.dart';
import '../../services/socket/socket_service.dart';
import '../../services/audio/ringtone_service.dart';
import '../../services/service_locator.dart';
import 'chat.dart';

class IncomingChatScreen extends StatefulWidget {
  final Map<String, dynamic> chatData;

  const IncomingChatScreen({
    super.key,
    required this.chatData,
  });

  @override
  State<IncomingChatScreen> createState() => _IncomingChatScreenState();
}

class _IncomingChatScreenState extends State<IncomingChatScreen> {
  late final SocketService _socketService;
  late final RingtoneService _ringtoneService;

  bool _isAccepting = false;
  bool _isRejecting = false;

  @override
  void initState() {
    super.initState();
    _socketService = getIt<SocketService>();
    _ringtoneService = getIt<RingtoneService>();

    // Debug the chatData we received
    debugPrint('💬 IncomingChatScreen chatData: ${widget.chatData}');

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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 60),
            _buildHeader(),
            const Spacer(),
            _buildUserInfo(),
            const Spacer(),
            _buildChatActions(),
            const SizedBox(height: 50),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Text(
          'Chat Request',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.white.withValues(alpha: 0.7),
          ),
        ),
      ],
    );
  }

  Widget _buildUserInfo() {
    final chatRate = widget.chatData['chatRate'] ?? 0;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Profile picture
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: AppColors.white.withValues(alpha: 0.3),
              width: 3,
            ),
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

        const SizedBox(height: 24),

        // User name
        Text(
          widget.chatData['userName'] ?? 'Customer',
          style: AppTextStyles.heading3.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 8),

        // Status text
        Text(
          'wants to start a chat',
          style: AppTextStyles.bodyLarge.copyWith(
            color: AppColors.white.withValues(alpha: 0.6),
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 16),

        // Chat rate info
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 8,
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
      ],
    );
  }

  Widget _buildDefaultAvatar() {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.3),
      child: const Icon(
        Icons.person,
        size: 60,
        color: AppColors.white,
      ),
    );
  }

  Widget _buildChatActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 50),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Decline button
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
          child: Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: onPressed == null
                  ? backgroundColor.withValues(alpha: 0.5)
                  : backgroundColor,
            ),
            child: Center(
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
                      size: 30,
                    ),
            ),
          ),
        ),
        const SizedBox(height: 12),
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
