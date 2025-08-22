import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../services/socket/socket_service.dart';
import '../services/webrtc/webrtc_service.dart';
import '../services/service_locator.dart';

class ActiveCallScreen extends StatefulWidget {
  final Map<String, dynamic> callData;
  final bool isIncoming;

  const ActiveCallScreen({
    super.key,
    required this.callData,
    this.isIncoming = false,
  });

  @override
  State<ActiveCallScreen> createState() => _ActiveCallScreenState();
}

class _ActiveCallScreenState extends State<ActiveCallScreen>
    with TickerProviderStateMixin {
  late final SocketService _socketService;
  late final WebRTCService _webrtcService;
  
  Timer? _callTimer;
  Duration _callDuration = Duration.zero;
  
  bool _isMuted = false;
  bool _isSpeakerOn = false;
  bool _isCameraOn = true;
  bool _isConnected = false;
  bool _isConnecting = true;
  
  late AnimationController _controlsAnimationController;
  late Animation<double> _controlsOpacityAnimation;
  bool _showControls = true;
  Timer? _hideControlsTimer;

  @override
  void initState() {
    super.initState();
    _socketService = getIt<SocketService>();
    _webrtcService = getIt<WebRTCService>();
    
    _setupAnimations();
    _setupCallListeners();
    _startCallTimer();
    _startHideControlsTimer();
    
    // Initialize call connection
    _initializeCall();
  }

  void _setupAnimations() {
    _controlsAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _controlsOpacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controlsAnimationController,
      curve: Curves.easeInOut,
    ));
    
    _controlsAnimationController.forward();
  }

  void _setupCallListeners() {
    // Listen for call events
    _socketService.on('call_ended', (data) {
      if (data['sessionId'] == widget.callData['sessionId']) {
        _handleCallEnded('Call ended by ${data['endedBy'] == widget.callData['callerId'] ? 'caller' : 'receiver'}');
      }
    });
    
    _socketService.on('call_error', (data) {
      _handleCallEnded('Call failed: ${data['error']}');
    });
    
    // Listen to WebRTC service state changes
    _webrtcService.addListener(_onWebRTCStateChanged);
  }

  void _onWebRTCStateChanged() {
    if (mounted) {
      setState(() {
        _isConnected = _webrtcService.isCallActive;
        _isConnecting = _webrtcService.callState == CallState.connecting;
        _isMuted = _webrtcService.isMuted;
        _isCameraOn = _webrtcService.isCameraOn;
      });
    }
  }

  void _startCallTimer() {
    _callTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _callDuration = Duration(seconds: _callDuration.inSeconds + 1);
        });
      }
    });
  }

  void _startHideControlsTimer() {
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _showControls) {
        _toggleControls();
      }
    });
  }

  Future<void> _initializeCall() async {
    try {
      if (!widget.isIncoming) {
        // For outgoing calls, start the WebRTC connection
        await _webrtcService.initiateCall(
          widget.callData['receiverId'] ?? widget.callData['astrologerId'],
          widget.callData['callType'] == 'video' ? CallType.video : CallType.voice,
        );
      }
      
      // Simulate connection establishment (in real implementation, this would be based on WebRTC events)
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() {
            _isConnected = true;
            _isConnecting = false;
          });
        }
      });
      
    } catch (e) {
      debugPrint('❌ Failed to initialize call: $e');
      _handleCallEnded('Failed to connect: $e');
    }
  }

  @override
  void dispose() {
    _callTimer?.cancel();
    _hideControlsTimer?.cancel();
    _controlsAnimationController.dispose();
    _webrtcService.removeListener(_onWebRTCStateChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          children: [
            _buildVideoBackground(),
            _buildCallInfo(),
            _buildConnectionStatus(),
            if (_showControls) _buildCallControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoBackground() {
    final isVideoCall = widget.callData['callType'] == 'video';
    
    if (!isVideoCall) {
      // Audio call background
      return Container(
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
      );
    }
    
    // Video call background
    return Stack(
      children: [
        // Remote video (full screen)
        RTCVideoView(_webrtcService.remoteRenderer, mirror: false),
        
        // Local video (picture-in-picture)
        if (_isCameraOn)
          Positioned(
            top: 60,
            right: 20,
            child: Container(
              width: 120,
              height: 160,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.white, width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: RTCVideoView(_webrtcService.localRenderer, mirror: true),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildCallInfo() {
    final isVideoCall = widget.callData['callType'] == 'video';
    
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          children: [
            if (!isVideoCall) ...[
              const Spacer(),
              
              // Profile picture for audio calls
              Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.white.withValues(alpha: 0.3),
                    width: 3,
                  ),
                ),
                child: ClipOval(
                  child: widget.callData['callerProfileImage'] != null ||
                          widget.callData['receiverProfileImage'] != null
                      ? Image.network(
                          widget.callData['callerProfileImage'] ??
                              widget.callData['receiverProfileImage'],
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return _buildDefaultAvatar();
                          },
                        )
                      : _buildDefaultAvatar(),
                ),
              ),
              
              const SizedBox(height: Dimensions.paddingXl),
            ],
            
            // Caller/Receiver name
            Text(
              widget.callData['callerName'] ?? 
              widget.callData['receiverName'] ?? 
              'Unknown',
              style: AppTextStyles.heading3.copyWith(
                color: AppColors.white,
                fontWeight: FontWeight.w600,
                shadows: [
                  Shadow(
                    offset: const Offset(0, 1),
                    blurRadius: 3,
                    color: Colors.black.withValues(alpha: 0.5),
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: Dimensions.paddingSm),
            
            // Call duration
            Text(
              _formatCallDuration(_callDuration),
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.white.withValues(alpha: 0.8),
                shadows: [
                  Shadow(
                    offset: const Offset(0, 1),
                    blurRadius: 3,
                    color: Colors.black.withValues(alpha: 0.5),
                  ),
                ],
              ),
            ),
            
            if (!isVideoCall) const Spacer(),
          ],
        ),
      ),
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

  Widget _buildConnectionStatus() {
    if (_isConnected) return const SizedBox.shrink();
    
    return Positioned(
      top: MediaQuery.of(context).padding.top + 60,
      left: 0,
      right: 0,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
        padding: const EdgeInsets.symmetric(
          horizontal: Dimensions.paddingMd,
          vertical: Dimensions.paddingSm,
        ),
        decoration: BoxDecoration(
          color: _isConnecting ? AppColors.info : AppColors.error,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_isConnecting) ...[
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Connecting...',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ] else ...[
              const Icon(
                Icons.signal_wifi_connected_no_internet_4,
                color: AppColors.white,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                'Connection failed',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCallControls() {
    final isVideoCall = widget.callData['callType'] == 'video';
    
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: AnimatedBuilder(
        animation: _controlsOpacityAnimation,
        builder: (context, child) {
          return Opacity(
            opacity: _controlsOpacityAnimation.value,
            child: Container(
              padding: EdgeInsets.only(
                left: Dimensions.paddingXl,
                right: Dimensions.paddingXl,
                bottom: MediaQuery.of(context).padding.bottom + Dimensions.paddingLg,
                top: Dimensions.paddingLg,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.7),
                  ],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Mute button
                  _buildControlButton(
                    onPressed: _toggleMute,
                    icon: _isMuted ? Icons.mic_off : Icons.mic,
                    backgroundColor: _isMuted ? AppColors.error : AppColors.white.withValues(alpha: 0.2),
                    iconColor: _isMuted ? AppColors.white : AppColors.white,
                  ),
                  
                  // Speaker button (only for voice calls)
                  if (!isVideoCall)
                    _buildControlButton(
                      onPressed: _toggleSpeaker,
                      icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_down,
                      backgroundColor: _isSpeakerOn ? AppColors.primary : AppColors.white.withValues(alpha: 0.2),
                      iconColor: AppColors.white,
                    ),
                  
                  // Camera button (only for video calls)
                  if (isVideoCall)
                    _buildControlButton(
                      onPressed: _toggleCamera,
                      icon: _isCameraOn ? Icons.videocam : Icons.videocam_off,
                      backgroundColor: _isCameraOn ? AppColors.white.withValues(alpha: 0.2) : AppColors.error,
                      iconColor: AppColors.white,
                    ),
                  
                  // End call button
                  _buildControlButton(
                    onPressed: _endCall,
                    icon: Icons.call_end,
                    backgroundColor: AppColors.error,
                    iconColor: AppColors.white,
                    size: 60,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildControlButton({
    required VoidCallback onPressed,
    required IconData icon,
    required Color backgroundColor,
    required Color iconColor,
    double size = 50,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onPressed();
        _startHideControlsTimer(); // Reset hide timer
      },
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: backgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 8,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Icon(
          icon,
          color: iconColor,
          size: size * 0.4,
        ),
      ),
    );
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
    
    if (_showControls) {
      _controlsAnimationController.forward();
      _startHideControlsTimer();
    } else {
      _controlsAnimationController.reverse();
      _hideControlsTimer?.cancel();
    }
  }

  void _toggleMute() {
    _webrtcService.toggleMute();
  }

  void _toggleSpeaker() {
    setState(() {
      _isSpeakerOn = !_isSpeakerOn;
    });
    _webrtcService.toggleSpeaker();
  }

  void _toggleCamera() {
    _webrtcService.toggleCamera();
  }

  void _endCall() async {
    try {
      // Send end call event
      _socketService.emit('end_call', {
        'callId': widget.callData['callId'],
        'sessionId': widget.callData['sessionId'],
      });
      
      // End WebRTC call
      await _webrtcService.endCall();
      
      _handleCallEnded('Call ended');
      
    } catch (e) {
      debugPrint('❌ Failed to end call: $e');
      _handleCallEnded('Call ended');
    }
  }

  void _handleCallEnded(String reason) {
    if (!mounted) return;
    
    // Show end call reason
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(reason),
        backgroundColor: AppColors.info,
        duration: const Duration(seconds: 2),
      ),
    );
    
    // Navigate back
    Navigator.of(context).pop();
  }

  String _formatCallDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    
    if (duration.inHours > 0) {
      return '$hours:$minutes:$seconds';
    } else {
      return '$minutes:$seconds';
    }
  }
}