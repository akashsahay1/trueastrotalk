import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../services/socket/socket_service.dart';
import '../../services/webrtc/webrtc_service.dart';
import '../../services/audio/ringtone_service.dart';
import '../../services/notifications/notification_service.dart';
import '../../services/service_locator.dart';
import 'active_call.dart';

class IncomingCallScreen extends StatefulWidget {
  final Map<String, dynamic> callData;

  const IncomingCallScreen({
    super.key,
    required this.callData,
  });

  @override
  State<IncomingCallScreen> createState() => _IncomingCallScreenState();
}

class _IncomingCallScreenState extends State<IncomingCallScreen> {
  late final SocketService _socketService;
  late final WebRTCService _webrtcService;
  late final RingtoneService _ringtoneService;

  bool _isAnswering = false;
  bool _isRejecting = false;

  // Helper getters to support both snake_case and camelCase
  String get _callType =>
      (widget.callData['call_type'] ?? widget.callData['callType'])?.toString() ?? 'voice';
  String get _callerName =>
      (widget.callData['caller_name'] ?? widget.callData['callerName'])?.toString() ?? 'Incoming Call...';
  String? get _callerProfileImage =>
      (widget.callData['caller_profile_image'] ?? widget.callData['callerProfileImage'])?.toString();
  String get _sessionId =>
      (widget.callData['session_id'] ?? widget.callData['sessionId'])?.toString() ?? '';

  @override
  void initState() {
    super.initState();
    _socketService = getIt<SocketService>();
    _webrtcService = getIt<WebRTCService>();
    _ringtoneService = getIt<RingtoneService>();

    // Debug the callData we received
    debugPrint('📱 IncomingCallScreen callData: ${widget.callData}');

    // Provide haptic feedback
    HapticFeedback.heavyImpact();

    // Start ringtone
    _ringtoneService.startRingtone();
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
            _buildCallerInfo(),
            const Spacer(),
            _buildCallActions(),
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
          _callType == 'video' ? 'Video Call' : 'Voice Call',
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.white.withValues(alpha: 0.7),
          ),
        ),
      ],
    );
  }

  Widget _buildCallerInfo() {
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
            child: _callerProfileImage != null
                ? Image.network(
                    _callerProfileImage!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return _buildDefaultAvatar();
                    },
                  )
                : _buildDefaultAvatar(),
          ),
        ),

        const SizedBox(height: 24),

        // Caller name
        Text(
          _callerName,
          style: AppTextStyles.heading3.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 8),

        // Status text
        Text(
          'Calling...',
          style: AppTextStyles.bodyLarge.copyWith(
            color: AppColors.white.withValues(alpha: 0.6),
          ),
          textAlign: TextAlign.center,
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

  Widget _buildCallActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 50),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Decline button
          _buildActionButton(
            onPressed: _isAnswering ? null : _rejectCall,
            backgroundColor: AppColors.error,
            icon: Icons.call_end,
            label: 'Decline',
            isLoading: _isRejecting,
          ),

          // Answer button
          _buildActionButton(
            onPressed: _isRejecting ? null : _answerCall,
            backgroundColor: AppColors.success,
            icon: Icons.call,
            label: 'Answer',
            isLoading: _isAnswering,
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

  void _rejectCall() async {
    if (_isRejecting || _isAnswering) return;

    setState(() {
      _isRejecting = true;
    });

    try {
      // Stop ringtone
      _ringtoneService.stopRingtone();

      // End CallKit notification (if shown)
      await NotificationService().endCallKit();

      // Provide haptic feedback
      HapticFeedback.mediumImpact();

      // Send reject call event using SocketService method
      await _socketService.rejectCallSession(_sessionId, reason: 'rejected');

      // Close the screen
      if (mounted) {
        Navigator.of(context).pop();
      }

    } catch (e) {
      debugPrint('❌ Failed to reject call: $e');
      if (mounted) {
        Navigator.of(context).pop();
      }
    }
  }

  void _answerCall() async {
    if (_isAnswering || _isRejecting) return;

    setState(() {
      _isAnswering = true;
    });

    try {
      // Stop ringtone
      _ringtoneService.stopRingtone();

      // Provide haptic feedback
      HapticFeedback.mediumImpact();

      // Initialize WebRTC renderers (but don't create peer connection yet)
      await _webrtcService.initialize();

      debugPrint('📞 WebRTC initialized, navigating to ActiveCallScreen...');

      // Navigate to active call screen
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => ActiveCallScreen(
              callData: widget.callData,
              isIncoming: true,
            ),
          ),
        );
      }

    } catch (e) {
      debugPrint('❌ Failed to answer call: $e');
      setState(() {
        _isAnswering = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to answer call: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}
