import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../services/socket/socket_service.dart';
import '../services/webrtc/webrtc_service.dart';
import '../services/service_locator.dart';
import 'active_call_screen.dart';

class IncomingCallScreen extends StatefulWidget {
  final Map<String, dynamic> callData;

  const IncomingCallScreen({
    super.key,
    required this.callData,
  });

  @override
  State<IncomingCallScreen> createState() => _IncomingCallScreenState();
}

class _IncomingCallScreenState extends State<IncomingCallScreen>
    with TickerProviderStateMixin {
  late final SocketService _socketService;
  late final WebRTCService _webrtcService;
  
  late AnimationController _pulseController;
  late AnimationController _slideController;
  late Animation<double> _pulseAnimation;
  late Animation<Offset> _slideAnimation;

  bool _isAnswering = false;
  bool _isRejecting = false;

  @override
  void initState() {
    super.initState();
    _socketService = getIt<SocketService>();
    _webrtcService = getIt<WebRTCService>();
    
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
    
    // Setup call timeout (auto-reject after 30 seconds)
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted && !_isAnswering && !_isRejecting) {
        _rejectCall();
      }
    });
  }

  @override
  void dispose() {
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
                Expanded(child: _buildCallerInfo()),
                _buildCallActions(),
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
                Icon(
                  widget.callData['callType'] == 'video'
                      ? Icons.videocam
                      : Icons.phone,
                  color: AppColors.white,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  'Incoming ${widget.callData['callType'] == 'video' ? 'Video' : 'Voice'} Call',
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

  Widget _buildCallerInfo() {
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
                  child: widget.callData['callerProfileImage'] != null
                      ? Image.network(
                          widget.callData['callerProfileImage'],
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
        
        // Caller name
        Text(
          widget.callData['callerName'] ?? 'Unknown Caller',
          style: AppTextStyles.heading3.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
        
        const SizedBox(height: Dimensions.paddingSm),
        
        // Call type and status
        Text(
          '${widget.callData['callType'] == 'video' ? 'Video' : 'Voice'} Call',
          style: AppTextStyles.bodyLarge.copyWith(
            color: AppColors.white.withValues(alpha: 0.8),
          ),
          textAlign: TextAlign.center,
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

  Widget _buildCallActions() {
    return Padding(
      padding: const EdgeInsets.all(Dimensions.paddingXl),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Reject button
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
          onTap: onPressed,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: onPressed == null 
                  ? backgroundColor.withValues(alpha: 0.5) 
                  : backgroundColor,
              boxShadow: [
                BoxShadow(
                  color: backgroundColor.withValues(alpha: 0.3),
                  blurRadius: 15,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: isLoading
                ? const CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                  )
                : Icon(
                    icon,
                    color: AppColors.white,
                    size: 36,
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

  void _rejectCall() async {
    if (_isRejecting || _isAnswering) return;
    
    setState(() {
      _isRejecting = true;
    });
    
    try {
      // Provide haptic feedback
      HapticFeedback.mediumImpact();
      
      // Send reject call event
      _socketService.emit('reject_call', {
        'callId': widget.callData['callId'],
        'sessionId': widget.callData['sessionId'],
      });
      
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
      // Provide haptic feedback
      HapticFeedback.mediumImpact();
      
      // Initialize WebRTC
      await _webrtcService.initialize();
      
      // Send answer call event
      _socketService.emit('answer_call', {
        'callId': widget.callData['callId'],
        'sessionId': widget.callData['sessionId'],
      });
      
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