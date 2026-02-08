import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../services/socket/socket_service.dart';
import '../../services/webrtc/webrtc_service.dart' as webrtc;
import '../../services/billing/billing_service.dart';
import '../../services/network/network_diagnostics_service.dart';
import '../../services/call/call_service.dart';
import '../../services/auth/auth_service.dart';
import '../../services/api/user_api_service.dart';
import '../../services/notifications/notification_service.dart';
import '../../services/service_locator.dart';
import 'history.dart';
import '../../models/astrologer.dart';
import '../../models/call.dart' as call_models;
import '../astrologer/astrologer_details.dart';

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

class _ActiveCallScreenState extends State<ActiveCallScreen> {
  late final SocketService _socketService;
  late final webrtc.WebRTCService _webrtcService;
  late final BillingService _billingService;
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
  bool _isCallEndedHandled = false;
  bool _isBillingStarting = false;

  @override
  void initState() {
    super.initState();
    _socketService = getIt<SocketService>();
    _webrtcService = getIt<webrtc.WebRTCService>();
    _billingService = BillingService.instance;
    _networkDiagnostics = NetworkDiagnosticsService.instance;
    _callService = getIt<CallService>();
    _authService = getIt<AuthService>();

    _setupCallListeners();
    _setupBillingListeners();
    _setupNetworkDiagnostics();

    // Register this call screen with CallService
    _callService.setCallScreenActive(widget.callData);

    // Initialize call connection
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final delay = widget.isIncoming
          ? const Duration(milliseconds: 100)
          : const Duration(milliseconds: 300);
      await Future.delayed(delay);
      if (mounted) {
        _initializeCall();
      }
    });
  }

  void _setupCallListeners() {
    _socketService.on('call_ended', (data) {
      debugPrint('📡 Received call_ended event: $data');
      if (data['sessionId'] == widget.callData['sessionId']) {
        final endedBy = data['endedBy'];
        final currentUserId = widget.callData['callerId'];
        final isEndedByCurrentUser = endedBy == currentUserId;
        final reason = isEndedByCurrentUser
            ? 'Call ended by you'
            : 'Call ended by other party';
        _handleCallEnded(reason);
      }
    });

    _socketService.on('call_error', (data) {
      _handleCallEnded('Call failed: ${data['error']}');
    });

    _socketService.on('call_answered', (data) {
      debugPrint('🎯 Received call_answered event: $data');
      if (data['sessionId'] == widget.callData['sessionId']) {
        if (_callTimer == null) {
          _startCallTimer();
        }
        if (!_billingService.isSessionActive) {
          _startBilling();
        }
      }
    });

    _webrtcService.addListener(_onWebRTCStateChanged);
  }

  void _setupBillingListeners() {
    _billingService.addListener(_onBillingStateChanged);

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
    _networkDiagnostics.addListener(_onNetworkMetricsChanged);
  }

  void _onNetworkMetricsChanged() {
    if (mounted) setState(() {});
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

      final shouldStartTimer = (_isConnected || _isConnecting) &&
          !wasConnected &&
          !wasConnecting &&
          _callTimer == null;
      if (shouldStartTimer) {
        _startCallTimer();
      }

      final shouldStartBilling = (_isConnected || _isConnecting) &&
          !wasConnected &&
          !wasConnecting &&
          !_billingService.isSessionActive;
      if (shouldStartBilling) {
        _startBilling();
      }
    }
  }

  void _onBillingStateChanged() {
    if (mounted) setState(() {});
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

  Future<void> _initializeCall() async {
    try {
      if (mounted) {
        setState(() {
          _isConnecting = true;
        });
      }

      _initializeWebRTCAsync();

      _webrtcService.callStateStream.listen((callState) {
        if (mounted) {
          setState(() {
            _isConnecting = callState == webrtc.CallState.connecting ||
                callState == webrtc.CallState.initiating ||
                callState == webrtc.CallState.ringing;
            _isConnected = callState == webrtc.CallState.connected;
          });

          if ((callState == webrtc.CallState.connected ||
                  callState == webrtc.CallState.connecting) &&
              !_billingService.isSessionActive) {
            _startBilling();
            if (_callTimer == null) {
              _startCallTimer();
            }
            _networkDiagnostics.startMonitoring(null);
          }

          if (callState == webrtc.CallState.ended ||
              callState == webrtc.CallState.failed ||
              callState == webrtc.CallState.rejected) {
            _handleCallEnded('Call ${callState.name}');
          }
        }
      });
    } catch (e) {
      debugPrint('❌ Failed to initialize call: $e');
      _handleCallEnded('Failed to connect: $e');
    }
  }

  void _initializeWebRTCAsync() {
    Future(() async {
      try {
        await Future.delayed(const Duration(milliseconds: 100));
        if (!mounted) return;

        await _webrtcService.initialize();
        if (!mounted) return;

        if (widget.isIncoming) {
          final sessionId = widget.callData['session_id']?.toString() ?? '';
          final callerId = widget.callData['caller_id']?.toString() ?? '';
          final callerName = widget.callData['caller_name']?.toString() ?? 'Unknown';
          final callTypeStr = widget.callData['call_type']?.toString() ?? 'voice';
          final callType = callTypeStr == 'video'
              ? webrtc.CallType.video
              : webrtc.CallType.voice;

          if (sessionId.isNotEmpty && callerId.isNotEmpty) {
            await _webrtcService.setIncomingCallData(
                sessionId, callerId, callerName, callType);
            await _webrtcService.answerCall();
          } else {
            throw Exception('Missing session_id or caller_id');
          }
        } else {
          final callTypeStr = widget.callData['call_type']?.toString() ?? 'voice';
          final callType = callTypeStr == 'video'
              ? webrtc.CallType.video
              : webrtc.CallType.voice;
          final targetUserId = widget.callData['receiver_id']?.toString() ?? '';
          final sessionId = widget.callData['session_id']?.toString();
          await _webrtcService.initiateCall(targetUserId, callType,
              sessionId: sessionId);
        }
      } catch (e) {
        debugPrint('❌ Background WebRTC initialization failed: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Connection failed: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    });
  }

  @override
  void dispose() {
    _callService.clearCallScreenActive();
    _callTimer?.cancel();
    _webrtcService.removeListener(_onWebRTCStateChanged);
    _billingService.removeListener(_onBillingStateChanged);
    _networkDiagnostics.removeListener(_onNetworkMetricsChanged);
    _networkDiagnostics.stopMonitoring();

    try {
      _webrtcService.endCall();
    } catch (e) {
      debugPrint('⚠️ Error cleaning up WebRTC: $e');
    }

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isVideoCall = widget.callData['call_type'] == 'video';

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: SafeArea(
        child: Stack(
          children: [
            if (isVideoCall) _buildVideoBackground(),
            Column(
              children: [
                const SizedBox(height: 20),
                _buildHeader(),
                if (!isVideoCall) ...[
                  const Spacer(),
                  _buildCallerInfo(),
                  const Spacer(),
                ],
                if (isVideoCall) const Spacer(),
                _buildCallControls(),
                const SizedBox(height: 30),
              ],
            ),
            if (_isConnecting) _buildConnectionStatus(),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoBackground() {
    return Stack(
      children: [
        // Remote video (full screen)
        Positioned.fill(
          child: RTCVideoView(
            _webrtcService.remoteRenderer,
            mirror: false,
            objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            placeholderBuilder: (context) => Container(
              color: const Color(0xFF1A1A2E),
              child: const Center(
                child: Icon(Icons.videocam_off, size: 64, color: Colors.white54),
              ),
            ),
          ),
        ),

        // Local video (picture-in-picture)
        if (_isCameraOn)
          Positioned(
            top: 80,
            right: 20,
            child: Container(
              width: 100,
              height: 140,
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
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Call status
          Text(
            _isConnecting ? 'Connecting...' : 'In Call',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.white.withValues(alpha: 0.7),
            ),
          ),

          // Billing info (if active)
          if (_billingService.isSessionActive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _billingService.getFormattedTotalBilled(),
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
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
            child: _getProfileImage() != null
                ? Image.network(
                    _getProfileImage()!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        _buildDefaultAvatar(),
                  )
                : _buildDefaultAvatar(),
          ),
        ),

        const SizedBox(height: 24),

        // Name
        Text(
          _getDisplayName(),
          style: AppTextStyles.heading3.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 8),

        // Duration
        Text(
          _formatCallDuration(_callDuration),
          style: AppTextStyles.heading4.copyWith(
            color: AppColors.white.withValues(alpha: 0.8),
          ),
        ),
      ],
    );
  }

  String? _getProfileImage() {
    return widget.callData['callerProfileImage'] ??
        widget.callData['receiverProfileImage'] ??
        widget.callData['caller_profile_image'] ??
        widget.callData['receiver_profile_image'];
  }

  String _getDisplayName() {
    final callerName =
        widget.callData['callerName'] ?? widget.callData['caller_name'];
    final receiverName =
        widget.callData['receiverName'] ?? widget.callData['receiver_name'];
    final webrtcRemoteName = _webrtcService.remoteUserName;

    if (widget.isIncoming) {
      return callerName ?? webrtcRemoteName ?? 'Connecting...';
    } else {
      return receiverName ?? webrtcRemoteName ?? 'Connecting...';
    }
  }

  Widget _buildDefaultAvatar() {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.3),
      child: const Icon(Icons.person, size: 60, color: AppColors.white),
    );
  }

  Widget _buildConnectionStatus() {
    return Positioned(
      top: 100,
      left: 0,
      right: 0,
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.info,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCallControls() {
    final isVideoCall = widget.callData['call_type'] == 'video';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Mute button
          _buildControlButton(
            onPressed: _toggleMute,
            icon: _isMuted ? Icons.mic_off : Icons.mic,
            label: _isMuted ? 'Unmute' : 'Mute',
            isActive: !_isMuted,
          ),

          // Speaker (voice) / Camera (video)
          if (isVideoCall)
            _buildControlButton(
              onPressed: _toggleCamera,
              icon: _isCameraOn ? Icons.videocam : Icons.videocam_off,
              label: _isCameraOn ? 'Camera' : 'Off',
              isActive: _isCameraOn,
            )
          else
            _buildControlButton(
              onPressed: _toggleSpeaker,
              icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_down,
              label: _isSpeakerOn ? 'Speaker' : 'Earpiece',
              isActive: _isSpeakerOn,
            ),

          // End call button
          _buildEndCallButton(),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required VoidCallback onPressed,
    required IconData icon,
    required String label,
    bool isActive = false,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: () {
            HapticFeedback.mediumImpact();
            onPressed();
          },
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive
                  ? AppColors.white.withValues(alpha: 0.2)
                  : AppColors.white.withValues(alpha: 0.1),
            ),
            child: Icon(icon, color: AppColors.white, size: 26),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: AppTextStyles.caption.copyWith(
            color: AppColors.white.withValues(alpha: 0.8),
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  Widget _buildEndCallButton() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: () {
            HapticFeedback.heavyImpact();
            _endCall();
          },
          child: Container(
            width: 70,
            height: 70,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.error,
            ),
            child: const Icon(Icons.call_end, color: AppColors.white, size: 30),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'End',
          style: AppTextStyles.caption.copyWith(
            color: AppColors.white.withValues(alpha: 0.8),
            fontSize: 11,
          ),
        ),
      ],
    );
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
      await NotificationService().endCallKit();
      await _billingService.stopBilling();
      await _webrtcService.endCall();
      _handleCallEnded('Call ended');
    } catch (e) {
      debugPrint('❌ Failed to end call: $e');
      _handleCallEnded('Call ended');
    }
  }

  void _handleCallEnded(String reason) async {
    if (!mounted || _isCallEndedHandled) return;
    _isCallEndedHandled = true;

    debugPrint('📴 Handling call ended: $reason');

    final billingWasActive = _billingService.isSessionActive;
    final formattedBilled = _billingService.getFormattedTotalBilled();
    final callDuration = _formatCallDuration(_callDuration);

    try {
      await _billingService.stopBilling();
    } catch (e) {
      debugPrint('❌ Error stopping billing: $e');
    }

    _callTimer?.cancel();
    _callTimer = null;

    final currentUser = _authService.currentUser;
    final isAstrologer = currentUser != null && currentUser.isAstrologer;
    final hasAstrologerData = widget.callData['astrologer'] != null;

    final shouldShowDialog =
        billingWasActive || (isAstrologer && _callDuration.inSeconds > 0);
    final shouldNavigateToAstrologerDetails =
        !isAstrologer && hasAstrologerData;

    if (shouldShowDialog) {
      if (isAstrologer) {
        _navigateAstrologerToHistory(formattedBilled, callDuration, reason);
      } else {
        _navigateCustomerToAstrologerDetails(
            formattedBilled, callDuration, reason);
      }
    } else if (shouldNavigateToAstrologerDetails) {
      _navigateToAstrologerDetailsImmediate();
    } else {
      _simpleNavigateBack(reason);
    }
  }

  void _simpleNavigateBack(String reason) {
    if (!mounted) return;

    final currentUser = _authService.currentUser;
    final isAstrologer = currentUser != null && currentUser.isAstrologer;

    if (!isAstrologer && widget.callData['astrologer'] != null) {
      _navigateToAstrologerDetailsImmediate();
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(reason),
        backgroundColor: AppColors.info,
        duration: const Duration(seconds: 2),
      ),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).maybePop();
      }
    });
  }

  void _navigateAstrologerToHistory(
      String formattedBilled, String callDuration, String reason) {
    if (!mounted) return;

    final totalBilled = _billingService.totalBilled;
    final astrologerEarnings = totalBilled * 0.8;
    final formattedEarnings = '₹${astrologerEarnings.toStringAsFixed(2)}';

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const HistoryScreen()),
      (route) => route.isFirst,
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Call completed! Earned $formattedEarnings (Duration: $callDuration)'),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 4),
        ),
      );
    });
  }

  void _navigateCustomerToAstrologerDetails(
      String formattedBilled, String callDuration, String reason) {
    if (!mounted) return;

    _navigateToAstrologerDetailsImmediate();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Call completed! Charged $formattedBilled (Duration: $callDuration)'),
          backgroundColor: AppColors.primary,
          duration: const Duration(seconds: 4),
        ),
      );
    });
  }

  Future<void> _startBilling() async {
    if (_isBillingStarting || _billingService.isSessionActive) return;
    _isBillingStarting = true;

    try {
      var astrologerData = widget.callData['astrologer'];

      if (astrologerData == null) {
        final astrologerId =
            widget.callData['astrologer_id'] ?? widget.callData['astrologerId'];
        if (astrologerId != null) {
          astrologerData = await _fetchAstrologerData(astrologerId.toString());
        }
      }

      if (astrologerData == null) {
        debugPrint('❌ No astrologer data found for billing');
        return;
      }

      final astrologer = Astrologer.fromJson(astrologerData);
      final callTypeStr =
          widget.callData['call_type'] ?? widget.callData['callType'];
      final callType = callTypeStr == 'video'
          ? call_models.CallType.video
          : call_models.CallType.voice;
      final sessionId = (widget.callData['session_id'] ??
              widget.callData['sessionId'])
          ?.toString() ??
          'unknown';

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

  Future<Map<String, dynamic>?> _fetchAstrologerData(
      String astrologerId) async {
    try {
      final userApiService = getIt<UserApiService>();
      final astrologer = await userApiService.getAstrologerById(astrologerId);
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
          content:
              Text('⚠️ Low balance: $remainingMinutes minutes remaining'),
          backgroundColor: AppColors.warning,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  void _handleInsufficientBalance() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('❌ Insufficient balance. Call will end shortly.'),
          backgroundColor: AppColors.error,
          duration: Duration(seconds: 3),
        ),
      );

      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) _endCall();
      });
    }
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

  void _navigateToAstrologerDetailsImmediate() {
    if (!mounted) return;

    try {
      final astrologerData = widget.callData['astrologer'];
      if (astrologerData == null) {
        Navigator.of(context).pop();
        return;
      }

      final astrologer = Astrologer.fromJson(astrologerData);

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => AstrologerDetailsScreen(astrologer: astrologer),
        ),
      );
    } catch (e) {
      debugPrint('❌ Failed navigation: $e');
      Navigator.of(context).pop();
    }
  }
}
