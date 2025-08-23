import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../services/socket/socket_service.dart';
import '../services/webrtc/webrtc_service.dart';
import '../services/billing/billing_service.dart';
import '../services/wallet/wallet_service.dart';
import '../services/network/network_diagnostics_service.dart';
import '../services/service_locator.dart';
import '../models/astrologer.dart';
import '../models/call.dart' as call_models;
import '../widgets/call_quality_indicator.dart';
import 'call_quality_settings_screen.dart';

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
  late final BillingService _billingService;
  late final WalletService _walletService;
  late final NetworkDiagnosticsService _networkDiagnostics;
  
  Timer? _callTimer;
  Duration _callDuration = Duration.zero;
  
  bool _isMuted = false;
  bool _isSpeakerOn = false;
  bool _isCameraOn = true;
  bool _isConnected = false;
  bool _isConnecting = true;
  
  late AnimationController _controlsAnimationController;
  late AnimationController _buttonAnimationController;
  late Animation<double> _controlsOpacityAnimation;
  late Animation<double> _buttonScaleAnimation;
  bool _showControls = true;
  Timer? _hideControlsTimer;

  @override
  void initState() {
    super.initState();
    _socketService = getIt<SocketService>();
    _webrtcService = getIt<WebRTCService>();
    _billingService = BillingService.instance;
    _walletService = WalletService.instance;
    _networkDiagnostics = NetworkDiagnosticsService.instance;
    
    _setupAnimations();
    _setupCallListeners();
    _setupBillingListeners();
    _setupNetworkDiagnostics();
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
    
    _buttonAnimationController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    
    _controlsOpacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controlsAnimationController,
      curve: Curves.easeInOut,
    ));
    
    _buttonScaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _buttonAnimationController,
      curve: Curves.elasticOut,
    ));
    
    _controlsAnimationController.forward();
    _buttonAnimationController.forward();
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
        debugPrint('💰 Billing completed: ${summary.formattedAmount} for ${summary.formattedDuration}');
      }
    });
  }

  void _setupNetworkDiagnostics() {
    // Listen to network diagnostics changes
    _networkDiagnostics.addListener(_onNetworkMetricsChanged);
  }

  void _onNetworkMetricsChanged() {
    if (mounted) {
      setState(() {
        // Trigger rebuild to update network quality UI
      });
    }
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

  void _onBillingStateChanged() {
    if (mounted) {
      setState(() {
        // Trigger rebuild to update billing UI
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
      Future.delayed(const Duration(seconds: 2), () async {
        if (mounted) {
          setState(() {
            _isConnected = true;
            _isConnecting = false;
          });
          
          // Start network diagnostics monitoring
          await _networkDiagnostics.startMonitoring(null); // TODO: Get peer connection from WebRTC service
          
          // Start billing when call is connected
          await _startBilling();
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
    _buttonAnimationController.dispose();
    _webrtcService.removeListener(_onWebRTCStateChanged);
    _billingService.removeListener(_onBillingStateChanged);
    _networkDiagnostics.removeListener(_onNetworkMetricsChanged);
    _networkDiagnostics.stopMonitoring();
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
            _buildBillingInfo(),
            _buildCallQualityIndicator(),
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

  Widget _buildCallQualityIndicator() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 80, // Below call info
      right: 16,
      child: CallQualityIndicator(
        metrics: _networkDiagnostics.currentMetrics,
        isCompact: true,
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
                top: Dimensions.paddingXl,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.8),
                  ],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Main control buttons row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Mute button with label
                      _buildEnhancedControlButton(
                        onPressed: _toggleMute,
                        icon: _isMuted ? Icons.mic_off : Icons.mic,
                        label: _isMuted ? 'Unmute' : 'Mute',
                        isActive: !_isMuted,
                        isDestructive: _isMuted,
                      ),
                      
                      // Speaker button (only for voice calls)
                      if (!isVideoCall)
                        _buildEnhancedControlButton(
                          onPressed: _toggleSpeaker,
                          icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_down,
                          label: _isSpeakerOn ? 'Speaker' : 'Earpiece',
                          isActive: _isSpeakerOn,
                        ),
                      
                      // Camera button (only for video calls)
                      if (isVideoCall)
                        _buildEnhancedControlButton(
                          onPressed: _toggleCamera,
                          icon: _isCameraOn ? Icons.videocam : Icons.videocam_off,
                          label: _isCameraOn ? 'Camera' : 'No Video',
                          isActive: _isCameraOn,
                          isDestructive: !_isCameraOn,
                        ),
                      
                      // Additional controls button (for future features)
                      _buildEnhancedControlButton(
                        onPressed: _showAdditionalControls,
                        icon: Icons.more_horiz,
                        label: 'More',
                        isActive: false,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: Dimensions.paddingLg),
                  
                  // End call button (prominent)
                  _buildEndCallButton(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEnhancedControlButton({
    required VoidCallback onPressed,
    required IconData icon,
    required String label,
    bool isActive = false,
    bool isDestructive = false,
    double size = 60,
  }) {
    return AnimatedBuilder(
      animation: _buttonScaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _buttonScaleAnimation.value,
          child: GestureDetector(
            onTap: () {
              HapticFeedback.mediumImpact();
              onPressed();
              _startHideControlsTimer(); // Reset hide timer
              
              // Button press animation
              _buttonAnimationController.reverse().then((_) {
                _buttonAnimationController.forward();
              });
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Button container
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeInOut,
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _getButtonColor(isActive, isDestructive),
                    border: Border.all(
                      color: AppColors.white.withValues(alpha: 0.3),
                      width: isActive ? 2 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 12,
                        spreadRadius: 2,
                        offset: const Offset(0, 4),
                      ),
                      if (isActive)
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 20,
                          spreadRadius: 0,
                        ),
                    ],
                  ),
                  child: Icon(
                    icon,
                    color: _getIconColor(isActive, isDestructive),
                    size: size * 0.35,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Button label
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: AppTextStyles.caption.copyWith(
                    color: isDestructive 
                        ? AppColors.error.withValues(alpha: 0.9)
                        : AppColors.white.withValues(alpha: 0.9),
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                    fontSize: 11,
                  ),
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEndCallButton() {
    return AnimatedBuilder(
      animation: _buttonScaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _buttonScaleAnimation.value,
          child: GestureDetector(
            onTap: () {
              HapticFeedback.heavyImpact();
              _endCall();
            },
            child: Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.error,
                    AppColors.error.withValues(alpha: 0.8),
                  ],
                ),
                border: Border.all(
                  color: AppColors.white.withValues(alpha: 0.2),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.error.withValues(alpha: 0.4),
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
              child: const Icon(
                Icons.call_end,
                color: AppColors.white,
                size: 28,
              ),
            ),
          ),
        );
      },
    );
  }

  Color _getButtonColor(bool isActive, bool isDestructive) {
    if (isDestructive) {
      return AppColors.error.withValues(alpha: 0.9);
    } else if (isActive) {
      return AppColors.primary.withValues(alpha: 0.8);
    } else {
      return AppColors.white.withValues(alpha: 0.15);
    }
  }

  Color _getIconColor(bool isActive, bool isDestructive) {
    if (isDestructive || isActive) {
      return AppColors.white;
    } else {
      return AppColors.white.withValues(alpha: 0.9);
    }
  }

  void _showAdditionalControls() {
    // Show bottom sheet with additional controls
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildAdditionalControlsSheet(),
    );
  }

  Widget _buildAdditionalControlsSheet() {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        color: AppColors.surfaceDark,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            spreadRadius: 5,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: Dimensions.paddingMd),
            decoration: BoxDecoration(
              color: AppColors.grey400,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          Text(
            'Call Settings',
            style: AppTextStyles.heading4.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
          
          const SizedBox(height: Dimensions.paddingLg),
          
          // Additional controls can be added here
          ListTile(
            leading: Icon(
              Icons.flip_camera_android,
              color: AppColors.primary,
            ),
            title: Text(
              'Switch Camera',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.white),
            ),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement camera switching
            },
          ),
          
          ListTile(
            leading: Icon(
              Icons.settings,
              color: AppColors.primary,
            ),
            title: Text(
              'Call Quality',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.white),
            ),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CallQualitySettingsScreen(),
                ),
              );
            },
          ),
          
          const SizedBox(height: Dimensions.paddingMd),
        ],
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
      // Stop billing first
      await _billingService.stopBilling();
      
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

  Future<void> _startBilling() async {
    try {
      final astrologerData = widget.callData['astrologer'];
      if (astrologerData == null) {
        debugPrint('❌ No astrologer data found for billing');
        return;
      }
      
      final astrologer = Astrologer.fromJson(astrologerData);
      final callType = widget.callData['callType'] == 'video' ? call_models.CallType.video : call_models.CallType.voice;
      final sessionId = widget.callData['sessionId']?.toString() ?? 'unknown';
      
      final success = await _billingService.startCallBilling(
        sessionId: sessionId,
        astrologer: astrologer,
        callType: callType,
      );
      
      if (!success) {
        _handleInsufficientBalance();
      }
    } catch (e) {
      debugPrint('❌ Failed to start billing: $e');
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
          content: const Text('❌ Insufficient balance. Call will end shortly.'),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );
      
      // End call after a short delay
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          _endCall();
        }
      });
    }
  }

  Widget _buildBillingInfo() {
    if (!_billingService.isSessionActive) {
      return const SizedBox.shrink();
    }

    final isVideoCall = widget.callData['callType'] == 'video';
    
    return Positioned(
      top: MediaQuery.of(context).padding.top + (isVideoCall ? 220 : 140),
      left: 0,
      right: 0,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
        padding: const EdgeInsets.symmetric(
          horizontal: Dimensions.paddingMd,
          vertical: Dimensions.paddingSm,
        ),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.7),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Current Bill:',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.white.withValues(alpha: 0.8),
                  ),
                ),
                Text(
                  _billingService.getFormattedTotalBilled(),
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Wallet Balance:',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.white.withValues(alpha: 0.8),
                  ),
                ),
                Text(
                  _walletService.formattedBalance,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: _billingService.isLowBalance ? AppColors.warning : AppColors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            if (_billingService.getCurrentRate() != null) ...[
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Rate:',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.white.withValues(alpha: 0.8),
                    ),
                  ),
                  Text(
                    '₹${_billingService.getCurrentRate()!.toInt()}/min',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.white.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
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