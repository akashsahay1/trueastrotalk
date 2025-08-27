import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../services/socket/socket_service.dart';
import '../services/webrtc/webrtc_service.dart' as webrtc;
import '../services/billing/billing_service.dart';
import '../services/wallet/wallet_service.dart';
import '../services/network/network_diagnostics_service.dart';
import '../services/call/call_service.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';
import '../models/astrologer.dart';
import '../models/call.dart' as call_models;
import '../widgets/call_quality_indicator.dart';
import 'call_quality_settings_screen.dart';
import 'astrologer_details.dart';


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
  late final webrtc.WebRTCService _webrtcService;
  late final BillingService _billingService;
  late final WalletService _walletService;
  late final NetworkDiagnosticsService _networkDiagnostics;
  late final CallService _callService;
  late final AuthService _authService;
  
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
    _webrtcService = getIt<webrtc.WebRTCService>();
    _billingService = BillingService.instance;
    _walletService = WalletService.instance;
    _networkDiagnostics = NetworkDiagnosticsService.instance;
    _callService = getIt<CallService>();
    _authService = getIt<AuthService>();
    
    _setupAnimations();
    _setupCallListeners();
    _setupBillingListeners();
    _setupNetworkDiagnostics();
    // Don't start call timer immediately - wait for call to be connected
    _startHideControlsTimer();
    
    // Register this call screen with CallService
    _callService.setCallScreenActive(widget.callData);
    
    // Initialize call connection with significant delay to ensure UI is fully rendered
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Add additional delay to let UI settle completely
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        _initializeCall();
      }
    });
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
      debugPrint('📡 Received call_ended event: $data');
      if (data['sessionId'] == widget.callData['sessionId']) {
        final endedBy = data['endedBy'];
        final currentUserId = widget.callData['callerId'];
        final isEndedByCurrentUser = endedBy == currentUserId;
        final reason = isEndedByCurrentUser 
            ? 'Call ended by you' 
            : 'Call ended by other party';
        
        debugPrint('🔚 Processing call_ended: $reason');
        _handleCallEnded(reason);
      } else {
        debugPrint('⚠️ Ignoring call_ended for different session: ${data['sessionId']} != ${widget.callData['sessionId']}');
      }
    });
    
    _socketService.on('call_error', (data) {
      _handleCallEnded('Call failed: ${data['error']}');
    });
    
    // Listen for call answered event to start timer
    _socketService.on('call_answered', (data) {
      debugPrint('🎯 Received call_answered event: $data');
      if (data['sessionId'] == widget.callData['sessionId'] && _callTimer == null) {
        debugPrint('🕒 Starting timer from call_answered socket event');
        _startCallTimer();
      }
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
      final wasConnected = _isConnected;
      final wasConnecting = _isConnecting;
      setState(() {
        _isConnected = _webrtcService.isCallActive;
        _isConnecting = _webrtcService.callState == webrtc.CallState.connecting;
        _isMuted = _webrtcService.isMuted;
        _isCameraOn = _webrtcService.isCameraOn;
      });
      
      debugPrint('📊 WebRTC State: connecting=$_isConnecting, connected=$_isConnected, callState=${_webrtcService.callState}');
      
      // Start call timer when call is answered (connecting) or connected
      final shouldStartTimer = (_isConnected || _isConnecting) && !wasConnected && !wasConnecting && _callTimer == null;
      if (shouldStartTimer) {
        debugPrint('🕒 Call answered/connected - starting call timer');
        _startCallTimer();
      }
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
    // Controls are now always visible - no auto-hide timer
    _hideControlsTimer?.cancel();
  }

  Future<void> _initializeCall() async {
    try {
      // Show immediate UI feedback
      if (mounted) {
        setState(() {
          _isConnecting = true;
        });
      }
      
      // Initialize WebRTC completely in background without blocking UI
      _initializeWebRTCAsync();
      
      // Listen to WebRTC connection state changes (setup immediately)
      _webrtcService.callStateStream.listen((callState) {
        if (mounted) {
          setState(() {
            _isConnecting = callState == webrtc.CallState.connecting || callState == webrtc.CallState.initiating || callState == webrtc.CallState.ringing;
            _isConnected = callState == webrtc.CallState.connected;
          });
          
          // Start billing, timer and monitoring when call is connected
          if (callState == webrtc.CallState.connected && !_billingService.isSessionActive) {
            _startBilling();
            // Also start the call timer if not already started
            if (_callTimer == null) {
              debugPrint('🕒 Starting timer from webrtc.CallState.connected');
              _startCallTimer();
            }
            _networkDiagnostics.startMonitoring(null);
          }
          
          // Start timer when call is connecting or connected
          if ((callState == webrtc.CallState.connecting || callState == webrtc.CallState.connected) && _callTimer == null) {
            debugPrint('🕒 Starting timer from callStateStream: $callState');
            _startCallTimer();
          }
          
          // Handle call end states
          if (callState == webrtc.CallState.ended || callState == webrtc.CallState.failed || callState == webrtc.CallState.rejected) {
            _handleCallEnded('Call ${callState.name}');
          }
        }
      });
      
    } catch (e) {
      debugPrint('❌ Failed to initialize call: $e');
      _handleCallEnded('Failed to connect: $e');
    }
  }


  /// Async WebRTC initialization that doesn't block UI
  void _initializeWebRTCAsync() {
    // Run WebRTC initialization in a separate isolate-like background task
    Future(() async {
      try {
        // Add a small delay to let UI render first
        await Future.delayed(const Duration(milliseconds: 100));
        
        if (!mounted) return;
        
        debugPrint('🚀 Starting background WebRTC initialization...');
        
        // Initialize WebRTC service
        await _webrtcService.initialize();
        
        if (!mounted) return;
        
        // Check if this is an incoming or outgoing call
        if (widget.isIncoming) {
          debugPrint('📞 Background: Answering incoming call');
          final sessionId = widget.callData['sessionId'];
          final callerId = widget.callData['callerId'];
          final callerName = widget.callData['callerName'];
          final callType = widget.callData['callType'] == 'video' ? webrtc.CallType.video : webrtc.CallType.voice;
          debugPrint('🔥 ActiveCall: Setting incoming call data - sessionId: $sessionId, callerId: $callerId');
          await _webrtcService.setIncomingCallData(sessionId, callerId, callerName, callType);
          await _webrtcService.answerCall();
        } else {
          debugPrint('📞 Background: Initiating outgoing call');
          final callType = widget.callData['callType'] == 'video' ? webrtc.CallType.video : webrtc.CallType.voice;
          final targetUserId = widget.callData['receiverId'];
          final sessionId = widget.callData['sessionId'];
          debugPrint('🔥 ActiveCall: Passing sessionId to WebRTC: $sessionId');
          await _webrtcService.initiateCall(targetUserId, callType, sessionId: sessionId);
        }
        
        debugPrint('✅ Background WebRTC initialization completed');
        
      } catch (e) {
        debugPrint('❌ Background WebRTC initialization failed: $e');
        if (mounted) {
          // Show error but don't immediately end call - let user try again
          Future.microtask(() {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('WebRTC setup failed: $e'),
                  backgroundColor: AppColors.error,
                  action: SnackBarAction(
                    label: 'Retry',
                    onPressed: () => _initializeWebRTCAsync(),
                  ),
                ),
              );
            }
          });
        }
      }
    });
  }

  
  


  @override
  void dispose() {
    // Clear call screen from CallService
    _callService.clearCallScreenActive();
    
    // Cleanup timers
    _callTimer?.cancel();
    _hideControlsTimer?.cancel();
    
    // Cleanup animations
    _controlsAnimationController.dispose();
    _buttonAnimationController.dispose();
    
    // Cleanup services
    _webrtcService.removeListener(_onWebRTCStateChanged);
    _billingService.removeListener(_onBillingStateChanged);
    _networkDiagnostics.removeListener(_onNetworkMetricsChanged);
    _networkDiagnostics.stopMonitoring();
    
    // Cleanup WebRTC resources
    try {
      _webrtcService.endCall();
    } catch (e) {
      debugPrint('⚠️ Error cleaning up WebRTC: $e');
    }
    
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
        RTCVideoView(
          _webrtcService.remoteRenderer,
          mirror: false,
          objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
          placeholderBuilder: (context) => Container(
            color: Colors.black,
            child: const Center(
              child: Icon(
                Icons.videocam_off,
                size: 64,
                color: Colors.white54,
              ),
            ),
          ),
        ),
        
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
                child: RTCVideoView(
                  _webrtcService.localRenderer,
                  mirror: true,
                  objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                  placeholderBuilder: (context) => Container(
                    color: Colors.black87,
                    child: const Center(
                      child: Icon(
                        Icons.person,
                        size: 40,
                        color: Colors.white54,
                      ),
                    ),
                  ),
                ),
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
              () {
                final callerName = widget.callData['callerName'];
                final receiverName = widget.callData['receiverName'];
                final webrtcRemoteName = _webrtcService.remoteUserName;
                
                debugPrint('📱 ActiveCallScreen name display logic:');
                debugPrint('   - callData[callerName]: "$callerName"');
                debugPrint('   - callData[receiverName]: "$receiverName"');
                debugPrint('   - webrtcService.remoteUserName: "$webrtcRemoteName"');
                debugPrint('   - isIncoming: ${widget.isIncoming}');
                
                // For incoming calls, show caller name
                // For outgoing calls, show receiver name  
                if (widget.isIncoming) {
                  final displayName = callerName ?? webrtcRemoteName;
                  debugPrint('   - Displaying (incoming): "$displayName"');
                  return displayName ?? 'Connecting...';
                } else {
                  final displayName = receiverName ?? webrtcRemoteName;
                  debugPrint('   - Displaying (outgoing): "$displayName"');
                  return displayName ?? 'Connecting...';
                }
              }(),
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
              // Camera switching functionality to be implemented
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
      debugPrint('🔚 Starting call end process...');
      
      // Send end call event first to notify other party
      debugPrint('📤 Sending end_call event...');
      _socketService.emit('end_call', {
        'callId': widget.callData['callId'],
        'sessionId': widget.callData['sessionId'],
        'endedBy': widget.callData['callerId'], // Add who ended the call
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
      
      // Small delay to allow socket event to be sent
      await Future.delayed(const Duration(milliseconds: 200));
      
      // Stop billing
      debugPrint('💰 Stopping billing...');
      await _billingService.stopBilling();
      
      // End WebRTC call
      debugPrint('📞 Ending WebRTC call...');
      await _webrtcService.endCall();
      
      debugPrint('✅ Call end process completed');
      _handleCallEnded('Call ended');
      
    } catch (e) {
      debugPrint('❌ Failed to end call: $e');
      _handleCallEnded('Call ended');
    }
  }

  void _handleCallEnded(String reason) async {
    if (!mounted) return;
    
    debugPrint('📴 Handling call ended: $reason');
    
    // Stop billing and get final summary
    final billingWasActive = _billingService.isSessionActive;
    final totalBilled = _billingService.totalBilled;
    final formattedBilled = _billingService.getFormattedTotalBilled();
    final callDuration = _formatCallDuration(_callDuration);
    
    try {
      await _billingService.stopBilling();
    } catch (e) {
      debugPrint('❌ Error stopping billing: $e');
    }
    
    // Stop call timer
    _callTimer?.cancel();
    _callTimer = null;
    
    // Show appropriate dialog based on user type and billing status
    final currentUser = _authService.currentUser;
    final isAstrologer = currentUser != null && currentUser.isAstrologer;
    
    debugPrint('💰 Dialog decision: billingWasActive=$billingWasActive, totalBilled=$totalBilled, isAstrologer=$isAstrologer');
    
    if (billingWasActive || (isAstrologer && _callDuration.inSeconds > 0)) {
      // Show dialog if billing was active OR if this is an astrologer with call duration
      if (isAstrologer) {
        debugPrint('💰 Showing earnings dialog for astrologer');
        await _showEarningsDialog(formattedBilled, callDuration, reason);
      } else {
        debugPrint('💰 Showing billing dialog for customer');
        await _showBillingAlertDialog(formattedBilled, callDuration, reason);
      }
      // Dialog will handle navigation when dismissed
    } else {
      // Show end call reason if no billing dialog was shown
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(reason),
            backgroundColor: AppColors.info,
            duration: const Duration(seconds: 2),
          ),
        );
      }
      
      // Navigate back after a short delay only if no billing dialog
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          Navigator.of(context).pop();
        }
      });
    }
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

  /// Show billing alert dialog with call summary
  Future<void> _showBillingAlertDialog(String totalBilled, String callDuration, String reason) async {
    if (!mounted) return;
    
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // User must tap OK
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppColors.backgroundDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusLg),
          ),
          title: Row(
            children: [
              Icon(
                Icons.account_balance_wallet,
                color: AppColors.primary,
                size: 28,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Call Summary',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Call ended reason
                Container(
                  padding: const EdgeInsets.all(Dimensions.paddingMd),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundLight,
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: AppColors.info,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          reason,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: Dimensions.paddingLg),
                
                // Call duration
                _buildBillingSummaryRow(
                  'Call Duration:',
                  callDuration,
                  Icons.access_time,
                ),
                
                const SizedBox(height: Dimensions.paddingMd),
                
                // Amount debited
                _buildBillingSummaryRow(
                  'Amount Debited:',
                  totalBilled,
                  Icons.currency_rupee,
                  valueColor: AppColors.error,
                ),
                
                const SizedBox(height: Dimensions.paddingMd),
                
                // Updated wallet balance
                _buildBillingSummaryRow(
                  'Wallet Balance:',
                  _walletService.formattedBalance,
                  Icons.account_balance_wallet,
                  valueColor: _walletService.currentBalance < 50 ? AppColors.warning : AppColors.success,
                ),
                
                const SizedBox(height: Dimensions.paddingLg),
                
                // Thank you message
                Container(
                  padding: const EdgeInsets.all(Dimensions.paddingMd),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.favorite,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Thank you for using True AstroTalk!',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                debugPrint('💰 Customer tapped OK on billing dialog');
                Navigator.of(context).pop(); // Close dialog
                
                // Use WidgetsBinding to ensure navigation happens after dialog is closed
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    debugPrint('💰 Post-frame: Attempting navigation...');
                    _navigateToAstrologerDetailsImmediate();
                  } else {
                    debugPrint('❌ Post-frame: Widget not mounted, cannot navigate');
                  }
                });
              },
              style: TextButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: Dimensions.paddingXl,
                  vertical: Dimensions.paddingMd,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                ),
              ),
              child: Text(
                'OK',
                style: AppTextStyles.buttonMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Show earnings dialog for astrologers
  Future<void> _showEarningsDialog(String totalEarned, String callDuration, String reason) async {
    if (!mounted) return;
    
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // User must tap OK
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppColors.backgroundDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusLg),
          ),
          title: Row(
            children: [
              Icon(
                Icons.monetization_on,
                color: Colors.green,
                size: 28,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Earnings Summary',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Call ended reason
                Container(
                  padding: const EdgeInsets.all(Dimensions.paddingMd),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                    border: Border.all(
                      color: AppColors.info.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: AppColors.info,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          reason,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: Dimensions.paddingLg),
                
                // Earnings details
                Container(
                  padding: const EdgeInsets.all(Dimensions.paddingLg),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                    border: Border.all(
                      color: Colors.green.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Consultation Earnings',
                        style: AppTextStyles.bodyLarge.copyWith(
                          color: AppColors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Duration:',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Text(
                            callDuration,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total Earned:',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Text(
                            totalEarned,
                            style: AppTextStyles.heading4.copyWith(
                              color: Colors.green,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: Dimensions.paddingLg),
                
                // Thank you message
                Container(
                  padding: const EdgeInsets.all(Dimensions.paddingMd),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.star,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Great consultation! Your earnings have been updated.',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close dialog
                Navigator.of(context).pop(); // Navigate back to previous screen
              },
              style: TextButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: Dimensions.paddingXl,
                  vertical: Dimensions.paddingMd,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                ),
              ),
              child: Text(
                'OK',
                style: AppTextStyles.buttonMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Helper method to build billing summary rows
  Widget _buildBillingSummaryRow(
    String label,
    String value,
    IconData icon, {
    Color? valueColor,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          color: AppColors.white.withValues(alpha: 0.7),
          size: 18,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.white.withValues(alpha: 0.8),
            ),
          ),
        ),
        Text(
          value,
          style: AppTextStyles.bodyMedium.copyWith(
            color: valueColor ?? AppColors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
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

  /// Navigate to astrologer details screen immediately (for post-frame callback)
  void _navigateToAstrologerDetailsImmediate() {
    if (!mounted) {
      debugPrint('❌ Widget not mounted, cannot navigate');
      return;
    }
    
    try {
      debugPrint('🔄 Immediate navigation to astrologer details...');
      
      final astrologerData = widget.callData['astrologer'];
      if (astrologerData == null) {
        debugPrint('❌ No astrologer data found for navigation');
        // Navigate back to home instead
        Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
        return;
      }
      
      final astrologer = Astrologer.fromJson(astrologerData);
      debugPrint('✅ Astrologer data found: ${astrologer.fullName}');
      
      // Simple navigation - pop current screen and push astrologer details
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => AstrologerDetailsScreen(
            astrologer: astrologer,
          ),
        ),
      );
      
    } catch (e) {
      debugPrint('❌ Failed immediate navigation: $e');
      // Fallback - go to home
      Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
    }
  }


}