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
import '../services/api/user_api_service.dart';
import '../services/notifications/notification_service.dart';
import '../services/service_locator.dart';
import 'history.dart';
import '../models/astrologer.dart';
import '../models/call.dart' as call_models;
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
  bool _isCallEndedHandled = false; // Prevent duplicate call ended handling
  bool _isBillingStarting = false; // Prevent duplicate billing initialization (race condition fix)
  
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

    // Initialize call connection
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // For incoming calls, answer quickly to reduce delay
      // For outgoing calls, add a small delay for UI to settle
      final delay = widget.isIncoming
          ? const Duration(milliseconds: 100)  // Quick answer for incoming
          : const Duration(milliseconds: 300); // Slightly longer for outgoing
      await Future.delayed(delay);
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
    
    // Listen for call answered event to start timer and billing
    _socketService.on('call_answered', (data) {
      debugPrint('🎯 Received call_answered event: $data');
      if (data['sessionId'] == widget.callData['sessionId']) {
        // Start timer if not already started
        if (_callTimer == null) {
          debugPrint('🕒 Starting timer from call_answered socket event');
          _startCallTimer();
        }
        // Start billing if not already started
        if (!_billingService.isSessionActive) {
          debugPrint('💰 Starting billing from call_answered socket event');
          _startBilling();
        }
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
      
      // Start billing when call is answered (connecting) or connected
      final shouldStartBilling = (_isConnected || _isConnecting) && !wasConnected && !wasConnecting && !_billingService.isSessionActive;
      if (shouldStartBilling) {
        debugPrint('💰 Call answered/connected - starting billing');
        _startBilling();
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
          
          // Start billing, timer and monitoring when call is connected OR connecting (answered)
          if ((callState == webrtc.CallState.connected || callState == webrtc.CallState.connecting) && !_billingService.isSessionActive) {
            debugPrint('💰 Starting billing for call state: $callState');
            _startBilling();
            // Also start the call timer if not already started
            if (_callTimer == null) {
              debugPrint('🕒 Starting timer from call state: $callState');
              _startCallTimer();
            }
            _networkDiagnostics.startMonitoring(null);
          }
          
          // Start timer when call is connecting or connected (redundant check for safety)
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
          debugPrint('📞 callData contents: ${widget.callData}');

          // Use snake_case only
          final sessionId = widget.callData['session_id']?.toString() ?? '';
          final callerId = widget.callData['caller_id']?.toString() ?? '';
          final callerName = widget.callData['caller_name']?.toString() ?? 'Unknown';
          final callTypeStr = widget.callData['call_type']?.toString() ?? 'voice';
          final callType = callTypeStr == 'video' ? webrtc.CallType.video : webrtc.CallType.voice;

          debugPrint('🔥 ActiveCall: Parsed data - session_id: $sessionId, caller_id: $callerId, caller_name: $callerName, call_type: $callTypeStr');

          if (sessionId.isNotEmpty && callerId.isNotEmpty) {
            await _webrtcService.setIncomingCallData(sessionId, callerId, callerName, callType);
            // answerCall() will create peer connection and send answer_call socket event
            await _webrtcService.answerCall();
          } else {
            debugPrint('❌ Missing required fields - session_id: "$sessionId", caller_id: "$callerId"');
            throw Exception('Missing session_id or caller_id for incoming call. Got session_id="$sessionId", caller_id="$callerId"');
          }
        } else {
          debugPrint('📞 Background: Initiating outgoing call');
          final callTypeStr = widget.callData['call_type']?.toString() ?? 'voice';
          final callType = callTypeStr == 'video' ? webrtc.CallType.video : webrtc.CallType.voice;
          final targetUserId = widget.callData['receiver_id']?.toString() ?? '';
          final sessionId = widget.callData['session_id']?.toString();
          debugPrint('🔥 ActiveCall: Passing session_id to WebRTC: $sessionId');
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
            if (_showControls) _buildCallControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoBackground() {
    final isVideoCall = widget.callData['call_type'] == 'video';
    
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
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF1A1A1A), // Dark grey with slight warmth
                  Color(0xFF2D1B1B), // Dark with subtle red tint
                  Color(0xFF1A1A1A), // Back to dark grey
                ],
                stops: [0.0, 0.5, 1.0],
              ),
            ),
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
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0xFF2A2A2A), // Slightly lighter dark grey
                          Color(0xFF3D2323), // Dark with subtle red tint
                        ],
                      ),
                    ),
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
    final isVideoCall = widget.callData['call_type'] == 'video';
    
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            if (!isVideoCall) ...[
              const Spacer(),

              // Profile picture for audio calls - centered
              Center(
                child: Container(
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
              ),  // Close Center widget

              const SizedBox(height: Dimensions.paddingXl),
            ],

            // Caller/Receiver name
            Text(
              () {
                final callerName = widget.callData['callerName'] ?? widget.callData['caller_name'];
                final receiverName = widget.callData['receiverName'] ?? widget.callData['receiver_name'];
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
                  // Don't show "Unknown" - show connecting instead
                  if (displayName == null || displayName == 'Unknown' || displayName.isEmpty) {
                    return 'Connecting...';
                  }
                  return displayName;
                } else {
                  final displayName = receiverName ?? webrtcRemoteName;
                  debugPrint('   - Displaying (outgoing): "$displayName"');
                  // Don't show "Unknown" - show connecting instead
                  if (displayName == null || displayName == 'Unknown' || displayName.isEmpty) {
                    return 'Connecting...';
                  }
                  return displayName;
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


  Widget _buildCallControls() {
    final isVideoCall = widget.callData['call_type'] == 'video';
    
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
            onTap: () async {
              Navigator.pop(context);
              try {
                await _webrtcService.switchCamera();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Camera switched'),
                      backgroundColor: AppColors.success,
                      duration: Duration(seconds: 1),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to switch camera'),
                      backgroundColor: AppColors.error,
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              }
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

      // End CallKit notification (if still active)
      await NotificationService().endCallKit();

      // NOTE: Don't emit end_call here - WebRTCService.endCall() will handle it
      // This prevents duplicate end_call socket events

      // Stop billing first
      debugPrint('💰 Stopping billing...');
      await _billingService.stopBilling();

      // End WebRTC call (this will emit end_call via socket)
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

    // Prevent duplicate handling
    if (_isCallEndedHandled) {
      debugPrint('📴 Call ended already handled, ignoring: $reason');
      return;
    }
    _isCallEndedHandled = true;

    debugPrint('📴 Handling call ended: $reason');
    
    // Stop billing and get final summary
    final billingWasActive = _billingService.isSessionActive;
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
    
    // Get user info for navigation decision
    final currentUser = _authService.currentUser;
    final isAstrologer = currentUser != null && currentUser.isAstrologer;
    final hasAstrologerData = widget.callData['astrologer'] != null;
    
    // More robust navigation logic
    // For customers: always try to go back to astrologer details if data is available
    // For astrologers: use earnings dialog if call had any duration or billing
    final shouldShowDialog = billingWasActive || (isAstrologer && _callDuration.inSeconds > 0);
    final shouldNavigateToAstrologerDetails = !isAstrologer && hasAstrologerData;
    
    debugPrint('📱 Navigation decision: isAstrologer=$isAstrologer, shouldShowDialog=$shouldShowDialog, shouldNavigateToAstrologerDetails=$shouldNavigateToAstrologerDetails');
    
    // ALWAYS navigate away immediately - no UI blocking
    if (shouldShowDialog) {
      if (isAstrologer) {
        debugPrint('📱 Navigating astrologer to history with earnings dialog');
        _navigateAstrologerToHistory(formattedBilled, callDuration, reason);
      } else {
        debugPrint('📱 Navigating customer to astrologer details with billing dialog');
        _navigateCustomerToAstrologerDetails(formattedBilled, callDuration, reason);
      }
    } else if (shouldNavigateToAstrologerDetails) {
      debugPrint('📱 Navigating customer back to astrologer details (no billing dialog)');
      _navigateToAstrologerDetailsImmediate();
      
      // Show simple completion message
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(reason),
              backgroundColor: AppColors.info,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      });
    } else {
      debugPrint('📱 Simple navigation back');
      _simpleNavigateBack(reason);
    }
  }

  /// Simple navigation back with snackbar
  void _simpleNavigateBack(String reason) {
    if (!mounted) return;

    debugPrint('📱 Simple navigation back with reason: $reason');

    final currentUser = _authService.currentUser;
    final isAstrologer = currentUser != null && currentUser.isAstrologer;

    // For customers, try to navigate back to astrologer details if possible
    if (!isAstrologer) {
      final astrologerData = widget.callData['astrologer'];
      if (astrologerData != null) {
        debugPrint('📱 Customer: Navigating back to astrologer details after simple call end');
        _navigateToAstrologerDetailsImmediate();

        // Show snackbar after navigation
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(reason),
                backgroundColor: AppColors.info,
                duration: const Duration(seconds: 2),
              ),
            );
          }
        });
        return;
      }
    }

    // Fallback: show snackbar and navigate back safely
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(reason),
        backgroundColor: AppColors.info,
        duration: const Duration(seconds: 2),
      ),
    );

    // Navigate back safely using maybePop to avoid navigator lock errors
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).maybePop();
      }
    });
  }

  /// Navigate astrologer to history screen with earnings info
  void _navigateAstrologerToHistory(String formattedBilled, String callDuration, String reason) {
    if (!mounted) return;
    
    // Calculate astrologer's earnings (80% of total billed)
    final totalBilled = _billingService.totalBilled;
    final astrologerEarnings = totalBilled * 0.8; // 80% to astrologer
    final formattedEarnings = '₹${astrologerEarnings.toStringAsFixed(2)}';
    
    debugPrint('📱 Astrologer: Navigating to history, earnings: $formattedEarnings (80% of $formattedBilled) for $callDuration');
    
    // Navigate to history screen immediately - no UI blocking
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (context) => const HistoryScreen(),
      ),
      (route) => route.isFirst,
    );
    
    // Show a simple snackbar with earnings info after navigation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.monetization_on, color: AppColors.success, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Call completed! Earned $formattedEarnings (Duration: $callDuration)',
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    });
  }

  /// Navigate customer to astrologer details with billing info
  void _navigateCustomerToAstrologerDetails(String formattedBilled, String callDuration, String reason) {
    if (!mounted) return;
    
    debugPrint('📱 Customer: Navigating to astrologer details, charged: $formattedBilled for $callDuration');
    
    // Navigate to astrologer details immediately - no UI blocking
    _navigateToAstrologerDetailsImmediate();
    
    // Show a simple snackbar with billing info after navigation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.account_balance_wallet, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Call completed! Charged $formattedBilled (Duration: $callDuration)',
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.primary,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    });
  }

  Future<void> _startBilling() async {
    // Prevent race condition - check both the initialization lock and active session
    if (_isBillingStarting) {
      debugPrint('⏳ Billing initialization already in progress, skipping...');
      return;
    }
    if (_billingService.isSessionActive) {
      debugPrint('⏳ Billing session already active, skipping...');
      return;
    }

    _isBillingStarting = true;

    try {
      // Support both snake_case and camelCase field names
      var astrologerData = widget.callData['astrologer'];

      // If astrologer data is missing, try to fetch from API
      if (astrologerData == null) {
        debugPrint('⚠️ No astrologer data in callData, attempting to fetch from API...');
        final astrologerId = widget.callData['astrologer_id'] ?? widget.callData['astrologerId'];
        if (astrologerId != null) {
          astrologerData = await _fetchAstrologerData(astrologerId.toString());
        }
      }

      if (astrologerData == null) {
        debugPrint('❌ No astrologer data found for billing');
        return;
      }

      final astrologer = Astrologer.fromJson(astrologerData);
      // Support both snake_case and camelCase
      final callTypeStr = widget.callData['call_type'] ?? widget.callData['callType'];
      final callType = callTypeStr == 'video' ? call_models.CallType.video : call_models.CallType.voice;
      final sessionId = (widget.callData['session_id'] ?? widget.callData['sessionId'])?.toString() ?? 'unknown';

      // Get current user ID for session creation
      final currentUser = _authService.currentUser;
      final userId = currentUser?.id;

      final success = await _billingService.startCallBilling(
        sessionId: sessionId,
        astrologer: astrologer,
        callType: callType,
        userId: userId,
      );

      if (!success) {
        _handleInsufficientBalance();
      }
    } catch (e) {
      debugPrint('❌ Failed to start billing: $e');
    } finally {
      _isBillingStarting = false;
    }
  }

  /// Fetch astrologer data from API if not included in callData
  Future<Map<String, dynamic>?> _fetchAstrologerData(String astrologerId) async {
    try {
      final userApiService = getIt<UserApiService>();
      final astrologer = await userApiService.getAstrologerById(astrologerId);
      debugPrint('✅ Fetched astrologer data from API');
      return astrologer.toJson();
    } catch (e) {
      debugPrint('❌ Failed to fetch astrologer data: $e');
    }
    return null;
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

    final isVideoCall = widget.callData['call_type'] == 'video';

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
        // Navigate back using pop instead of named route
        Navigator.of(context).pop();
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
      // Fallback - just pop back
      Navigator.of(context).pop();
    }
  }


}