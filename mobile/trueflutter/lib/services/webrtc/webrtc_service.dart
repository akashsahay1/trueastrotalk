import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:permission_handler/permission_handler.dart';
import '../socket/socket_service.dart';
import '../service_locator.dart';

enum CallState {
  idle,
  initiating,
  ringing,
  connecting,
  connected,
  reconnecting,  // Added for reconnection support
  ended,
  rejected,
  failed
}

enum CallType {
  voice,
  video
}

class WebRTCService extends ChangeNotifier {
  static WebRTCService? _instance;
  static WebRTCService get instance => _instance ??= WebRTCService._();
  
  WebRTCService._();

  // Dependencies
  final SocketService _socketService = getIt<SocketService>();

  // WebRTC components
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();

  // Call state
  CallState _callState = CallState.idle;
  CallType _callType = CallType.voice;
  String? _currentSessionId;
  String? _currentCallId;
  String? _remoteUserId;
  String? _remoteUserName;
  bool _isInitiator = false;
  bool _isMuted = false;
  bool _isCameraOn = true;
  bool _isSpeakerOn = false;
  bool _isFrontCamera = true;
  
  // Call duration tracking
  DateTime? _callStartTime;
  DateTime? _callEndTime;
  Timer? _durationTimer;
  
  // Pending offer queue for race condition handling
  Map<String, dynamic>? _pendingOffer;

  // Reconnection support
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 3;
  static const Duration _reconnectDelay = Duration(seconds: 2);
  Timer? _reconnectTimer;
  bool _isReconnecting = false;

  // Track if socket listeners are already set up
  bool _listenersInitialized = false;

  // Callback for reconnection events
  Function(bool isReconnecting, int attempt)? onReconnectionStateChanged;

  // Stream controllers
  final StreamController<CallState> _callStateController = 
      StreamController<CallState>.broadcast();
  final StreamController<bool> _remoteStreamController = 
      StreamController<bool>.broadcast();

  // Getters
  CallState get callState => _callState;
  CallType get callType => _callType;
  String? get currentSessionId => _currentSessionId;
  String? get currentCallId => _currentCallId;
  String? get remoteUserId => _remoteUserId;
  String? get remoteUserName => _remoteUserName;
  bool get isInitiator => _isInitiator;
  bool get isMuted => _isMuted;
  bool get isCameraOn => _isCameraOn;
  bool get isSpeakerOn => _isSpeakerOn;
  RTCVideoRenderer get localRenderer => _localRenderer;
  RTCVideoRenderer get remoteRenderer => _remoteRenderer;

  // Streams
  Stream<CallState> get callStateStream => _callStateController.stream;
  Stream<bool> get remoteStreamStream => _remoteStreamController.stream;

  // WebRTC Configuration
  final Map<String, dynamic> _configuration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:stun2.l.google.com:19302'},
    ],
    'sdpSemantics': 'unified-plan',
    'iceCandidatePoolSize': 10,
    'bundlePolicy': 'balanced',
    'rtcpMuxPolicy': 'require',
  };

  final Map<String, dynamic> _constraints = {
    'mandatory': {},
    'optional': [
      {'DtlsSrtpKeyAgreement': true},
    ]
  };

  /// Initialize WebRTC service
  Future<void> initialize() async {
    try {
      debugPrint('🔧 Initializing WebRTC renderers...');
      
      // Add timeout protection to renderer initialization
      await _localRenderer.initialize().timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          debugPrint('⚠️ Timeout initializing local renderer');
          throw Exception('Timeout initializing local renderer');
        }
      );
      
      await _remoteRenderer.initialize().timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          debugPrint('⚠️ Timeout initializing remote renderer');
          throw Exception('Timeout initializing remote renderer');
        }
      );
      
      debugPrint('✅ WebRTC renderers initialized');
      
      // Setup socket listeners for WebRTC signaling
      _setupSocketListeners();
      
      // Enable speaker by default for calls
      await _enableSpeakerForCall();
      
      debugPrint('✅ WebRTC Service initialized');
    } catch (e) {
      debugPrint('❌ WebRTC initialization failed: $e');
      throw Exception('Failed to initialize WebRTC: $e');
    }
  }

  /// Enable speaker by default for calls
  Future<void> _enableSpeakerForCall() async {
    try {
      _isSpeakerOn = true;
      await _setAudioRoute(true);
      debugPrint('🔊 Speaker enabled by default for call');
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Failed to enable speaker by default: $e');
      // Don't throw, continue with call setup
    }
  }

  /// Setup socket event listeners for WebRTC signaling
  void _setupSocketListeners() {
    // Prevent duplicate listener registration
    if (_listenersInitialized) {
      debugPrint('⚠️ Socket listeners already initialized, skipping');
      return;
    }
    _listenersInitialized = true;
    debugPrint('🔌 Setting up WebRTC socket listeners');

    // Incoming call - snake_case only
    _socketService.on('incoming_call', (data) async {
      try {
        debugPrint('📞 RAW incoming call data: $data');

        final callerId = data['caller_id'];
        final callerName = data['caller_name'];
        final callTypeStr = data['call_type'] ?? 'voice';
        final callType = callTypeStr == 'video' ? CallType.video : CallType.voice;
        final sessionId = data['session_id'];

        debugPrint('📞 Parsed incoming call:');
        debugPrint('   - caller_id: $callerId');
        debugPrint('   - caller_name: "$callerName"');
        debugPrint('   - call_type: $callType');
        debugPrint('   - session_id: $sessionId');

        _currentSessionId = sessionId;
        _remoteUserId = callerId;
        _remoteUserName = callerName;
        _callType = callType;
        _isInitiator = false;

        _updateCallState(CallState.ringing);
      } catch (e) {
        debugPrint('❌ Error handling incoming call: $e');
      }
    });

    // Call initiated - snake_case only
    _socketService.on('call_initiated', (data) async {
      try {
        debugPrint('🔥 WebRTC: Received call_initiated event: $data');
        final sessionId = data['session_id'];
        final targetName = data['target_name'];

        debugPrint('📞 Call initiated to $targetName, session_id: $sessionId');

        _currentSessionId = sessionId;
        _remoteUserName = targetName;

        _updateCallState(CallState.ringing);
        debugPrint('🔥 WebRTC: Set _currentSessionId = $sessionId');
      } catch (e) {
        debugPrint('❌ Error handling call initiated: $e');
      }
    });

    // Call answered - snake_case only
    _socketService.on('call_answered', (data) async {
      try {
        debugPrint('🔥 WebRTC: Received call_answered event: $data');
        final sessionId = data['session_id'];

        debugPrint('🔥 WebRTC: Comparing session_id=$sessionId with _currentSessionId=$_currentSessionId');
        debugPrint('🔥 WebRTC: _isInitiator=$_isInitiator, _peerConnection=${_peerConnection != null}');

        if (sessionId == _currentSessionId) {
          debugPrint('✅ WebRTC: Call answered - session IDs match!');
          _updateCallState(CallState.connecting);

          // If we are the initiator, create and send offer
          if (_isInitiator && _peerConnection != null) {
            debugPrint('📤 Creating WebRTC offer as initiator');
            await _createAndSendOffer();
          } else {
            debugPrint('🔥 WebRTC: Not creating offer - isInitiator=$_isInitiator, peerConnection=${_peerConnection != null}');
          }
        } else if (_currentSessionId == null && !_isInitiator && sessionId != null) {
          // For incoming calls, the session ID might not be set yet from call_answered event
          debugPrint('🔥 WebRTC: Setting session ID for incoming call from call_answered: $sessionId');
          _currentSessionId = sessionId;
          // Don't create offer here - wait for the offer to arrive
        } else {
          debugPrint('❌ WebRTC: Session ID mismatch! Expected: $_currentSessionId, Got: $sessionId');
        }
      } catch (e) {
        debugPrint('❌ Error handling call answered: $e');
      }
    });

    // Call rejected - snake_case only
    _socketService.on('call_rejected', (data) async {
      try {
        final sessionId = data['session_id'];
        final reason = data['reason'] ?? 'rejected';

        if (sessionId == _currentSessionId) {
          debugPrint('❌ Call rejected: $reason');
          _updateCallState(CallState.rejected);
          await _cleanup();
        }
      } catch (e) {
        debugPrint('❌ Error handling call rejected: $e');
      }
    });

    // Call ended - snake_case only
    _socketService.on('call_ended', (data) async {
      try {
        final sessionId = data['session_id'];

        if (sessionId == _currentSessionId) {
          debugPrint('📴 Call ended');
          _updateCallState(CallState.ended);
          await _cleanup();
        }
      } catch (e) {
        debugPrint('❌ Error handling call ended: $e');
      }
    });

    // WebRTC signaling events
    _socketService.on('webrtc_offer', (data) async {
      try {
        await _handleOffer(data);
      } catch (e) {
        debugPrint('❌ Error handling WebRTC offer: $e');
      }
    });

    _socketService.on('webrtc_answer', (data) async {
      try {
        await _handleAnswer(data);
      } catch (e) {
        debugPrint('❌ Error handling WebRTC answer: $e');
      }
    });

    _socketService.on('webrtc_ice_candidate', (data) async {
      try {
        await _handleIceCandidate(data);
      } catch (e) {
        debugPrint('❌ Error handling ICE candidate: $e');
      }
    });
  }

  /// Initiate a call to another user
  Future<void> initiateCall(String targetUserId, CallType callType, {String? sessionId}) async {
    try {
      // Clean up any existing call first
      if (_callState != CallState.idle) {
        debugPrint('⚠️ Previous call in progress, cleaning up first...');
        await _cleanup();
      }

      debugPrint('📞 Initiating $callType call to $targetUserId');

      _remoteUserId = targetUserId;
      _callType = callType;
      _isInitiator = true;
      
      // Set the session ID directly if provided
      if (sessionId != null) {
        _currentSessionId = sessionId;
        debugPrint('🔥 WebRTC: Set _currentSessionId = $sessionId directly');
      }
      
      _updateCallState(CallState.initiating);

      // Create peer connection and local stream
      await _createPeerConnection();
      await _createLocalStream();

      // Process any pending offer now that peer connection is ready (unlikely for initiating calls but for completeness)
      if (_pendingOffer != null) {
        debugPrint('🔄 WebRTC: Processing queued offer in initiateCall (unexpected but handled)');
        final pendingOfferData = _pendingOffer!;
        _pendingOffer = null; // Clear the pending offer
        await _handleOffer(pendingOfferData);
      }

      // NOTE: initiate_call is already emitted by CallService - no need to emit again here
      // This prevents duplicate incoming_call events on the receiver side
      debugPrint('📞 WebRTC: Peer connection ready, waiting for call_answered event');

      // Move to ringing state since we have the session ID
      _updateCallState(CallState.ringing);

    } catch (e) {
      debugPrint('❌ Failed to initiate call: $e');
      _updateCallState(CallState.failed);
      await _cleanup();
      rethrow;
    }
  }

  /// Set incoming call data (for when UI handles incoming call events)
  Future<void> setIncomingCallData(String sessionId, String callerId, String callerName, CallType callType) async {
    debugPrint('🔥 WebRTC: Setting incoming call data - sessionId: $sessionId, callerId: $callerId');
    _currentSessionId = sessionId;
    _remoteUserId = callerId;
    _remoteUserName = callerName;
    _callType = callType;
    _isInitiator = false;
    _updateCallState(CallState.ringing);
  }

  /// Answer an incoming call
  Future<void> answerCall() async {
    try {
      if (_callState != CallState.ringing || _currentSessionId == null) {
        throw Exception('No incoming call to answer');
      }

      debugPrint('✅ Answering call');

      _updateCallState(CallState.connecting);

      // Create peer connection and local stream
      await _createPeerConnection();
      await _createLocalStream();

      // Process any pending offer now that peer connection is ready
      if (_pendingOffer != null) {
        debugPrint('🔄 WebRTC: Processing queued offer now that peer connection is ready');
        final pendingOfferData = _pendingOffer!;
        _pendingOffer = null; // Clear the pending offer
        await _handleOffer(pendingOfferData);
        return; // Don't send answer_call event yet, it will be handled by _handleOffer
      }

      // Send answer call event using snake_case
      _socketService.emit('answer_call', {
        'session_id': _currentSessionId,
      });

    } catch (e) {
      debugPrint('❌ Failed to answer call: $e');
      _updateCallState(CallState.failed);
      await _cleanup();
      rethrow;
    }
  }

  /// Reject an incoming call
  Future<void> rejectCall({String reason = 'busy'}) async {
    try {
      if (_callState != CallState.ringing || _currentSessionId == null) {
        return;
      }

      debugPrint('❌ Rejecting call: $reason');

      _socketService.emit('reject_call', {
        'session_id': _currentSessionId,
        'reason': reason,
      });

      _updateCallState(CallState.rejected);
      await _cleanup();

    } catch (e) {
      debugPrint('❌ Failed to reject call: $e');
    }
  }

  /// End the current call
  Future<void> endCall() async {
    try {
      if (_currentSessionId == null || _callState == CallState.idle) {
        return;
      }

      debugPrint('📴 Ending call');

      _socketService.emit('end_call', {
        'session_id': _currentSessionId,
      });

      _updateCallState(CallState.ended);
      await _cleanup();

    } catch (e) {
      debugPrint('❌ Failed to end call: $e');
    }
  }

  /// Toggle microphone mute
  Future<void> toggleMute() async {
    try {
      if (_localStream == null) return;

      final audioTrack = _localStream!.getAudioTracks().first;
      _isMuted = !_isMuted;
      audioTrack.enabled = !_isMuted;
      
      notifyListeners();
      debugPrint('🎤 Microphone ${_isMuted ? 'muted' : 'unmuted'}');
    } catch (e) {
      debugPrint('❌ Failed to toggle mute: $e');
    }
  }

  /// Toggle camera on/off (video calls only)
  /// Toggle camera on/off
  Future<void> toggleCamera() async {
    try {
      if (_localStream == null || _callType != CallType.video) return;

      final videoTrack = _localStream!.getVideoTracks().first;
      _isCameraOn = !_isCameraOn;
      videoTrack.enabled = _isCameraOn;
      
      notifyListeners();
      debugPrint('📷 Camera ${_isCameraOn ? 'enabled' : 'disabled'}');
    } catch (e) {
      debugPrint('❌ Failed to toggle camera: $e');
    }
  }

  /// Switch between front and back camera
  Future<void> switchCamera() async {
    try {
      if (_localStream == null || _callType != CallType.video) return;

      debugPrint('🔄 Switching camera...');
      
      // Get current video track
      final videoTracks = _localStream!.getVideoTracks();
      if (videoTracks.isEmpty) {
        debugPrint('❌ No video tracks available');
        return;
      }

      final currentVideoTrack = videoTracks.first;
      
      // Try using Helper.switchCamera first
      try {
        await Helper.switchCamera(currentVideoTrack);
        debugPrint('🔄 Camera switched using Helper');
        return;
      } catch (helperError) {
        debugPrint('⚠️ Helper.switchCamera failed: $helperError, trying manual approach');
      }
      
      // Manual approach: stop current track and create new one with opposite camera
      final currentFacingMode = _isFrontCamera ? 'user' : 'environment';
      final newFacingMode = _isFrontCamera ? 'environment' : 'user';
      
      debugPrint('🔄 Switching from $currentFacingMode to $newFacingMode camera');
      
      // Stop current video track
      await currentVideoTrack.stop();
      _localStream!.removeTrack(currentVideoTrack);
      
      // Create new video stream with opposite camera
      final constraints = <String, dynamic>{
        'audio': false,
        'video': {
          'facingMode': newFacingMode,
          'width': {'min': 320, 'ideal': 640, 'max': 1280},
          'height': {'min': 240, 'ideal': 480, 'max': 720},
          'frameRate': {'min': 15, 'ideal': 30, 'max': 30},
        },
      };
      
      final newStream = await navigator.mediaDevices.getUserMedia(constraints);
      final newVideoTrack = newStream.getVideoTracks().first;
      
      // Add new video track to local stream
      await _localStream!.addTrack(newVideoTrack);
      
      // Update peer connection sender
      if (_peerConnection != null) {
        final senders = await _peerConnection!.getSenders();
        for (final sender in senders) {
          if (sender.track?.kind == 'video') {
            await sender.replaceTrack(newVideoTrack);
            break;
          }
        }
      }
      
      // Toggle camera flag
      _isFrontCamera = !_isFrontCamera;
      debugPrint('🔄 Camera switched manually to ${_isFrontCamera ? 'front' : 'back'}');
      
    } catch (e) {
      debugPrint('❌ Failed to switch camera: $e');
    }
  }

  /// Toggle speaker on/off
  Future<void> toggleSpeaker() async {
    try {
      _isSpeakerOn = !_isSpeakerOn;
      await _setAudioRoute(_isSpeakerOn);
      
      notifyListeners();
      debugPrint('🔊 Speaker ${_isSpeakerOn ? 'enabled' : 'disabled'}');
    } catch (e) {
      debugPrint('❌ Failed to toggle speaker: $e');
    }
  }

  /// Enhanced audio routing for iOS/Android compatibility
  /// Specifically handles iPhone 15 Pro audio routing issues
  Future<void> _setAudioRoute(bool useSpeaker) async {
    try {
      // Multiple attempts to ensure audio routing works on iPhone 15 Pro
      debugPrint('🔊 Setting audio route: ${useSpeaker ? 'Speaker' : 'Earpiece'}');
      
      // Primary method - standard WebRTC helper
      await Helper.setSpeakerphoneOn(useSpeaker);
      
      // Additional delay and retry for iOS devices (especially iPhone 15 Pro)
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        // Small delay to let the first call settle
        await Future.delayed(const Duration(milliseconds: 100));
        
        // Second attempt to ensure it sticks on iPhone 15 Pro
        await Helper.setSpeakerphoneOn(useSpeaker);
        
        debugPrint('📱 iOS: Double-set audio route for iPhone 15 Pro compatibility');
      }
      
      debugPrint('✅ Audio route set successfully: ${useSpeaker ? 'Speaker' : 'Earpiece'}');
    } catch (e) {
      debugPrint('❌ Failed to set audio route: $e');
      
      // Fallback with retry
      try {
        debugPrint('🔄 Attempting fallback audio routing...');
        await Future.delayed(const Duration(milliseconds: 200));
        await Helper.setSpeakerphoneOn(useSpeaker);
        debugPrint('✅ Fallback audio routing succeeded');
      } catch (fallbackError) {
        debugPrint('❌ Fallback audio routing failed: $fallbackError');
        // Last resort - just update the UI state
        debugPrint('⚠️ Audio routing failed, but continuing with call');
      }
    }
  }

  /// Ensure speaker is enabled when call connects
  /// Critical for iPhone 15 Pro audio routing
  void _ensureSpeakerOnConnection() {
    // Run asynchronously to not block the connection process
    Future.microtask(() async {
      try {
        // Wait a bit for the connection to stabilize
        await Future.delayed(const Duration(milliseconds: 500));
        
        if (_isSpeakerOn && _callState == CallState.connected) {
          debugPrint('📱 Ensuring speaker is active on connection (iPhone 15 Pro fix)');
          await _setAudioRoute(true);
        }
      } catch (e) {
        debugPrint('❌ Failed to ensure speaker on connection: $e');
      }
    });
  }

  /// Create peer connection
  Future<void> _createPeerConnection() async {
    try {
      debugPrint('🔗 Creating peer connection...');
      
      _peerConnection = await createPeerConnection(_configuration, _constraints).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          debugPrint('⚠️ Timeout creating peer connection');
          throw Exception('Timeout creating peer connection');
        }
      );

      _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
        debugPrint('🧊 ICE candidate: ${candidate.candidate}');
        
        _socketService.emit('webrtc_ice_candidate', {
          'sessionId': _currentSessionId,
          'candidate': candidate.toMap(),
          'targetUserId': _remoteUserId,
        });
      };

      _peerConnection!.onAddStream = (MediaStream stream) {
        debugPrint('📺 Remote stream added with ${stream.getVideoTracks().length} video tracks and ${stream.getAudioTracks().length} audio tracks');
        _remoteRenderer.srcObject = stream;
        _remoteStreamController.add(true);
        
        // Debug track details
        for (var track in stream.getVideoTracks()) {
          debugPrint('📹 Remote video track: ${track.id} - enabled: ${track.enabled}');
        }
        for (var track in stream.getAudioTracks()) {
          debugPrint('🎵 Remote audio track: ${track.id} - enabled: ${track.enabled}');
        }
        
        if (_callState == CallState.connecting) {
          _updateCallState(CallState.connected);
        }
      };

      _peerConnection!.onRemoveStream = (MediaStream stream) {
        debugPrint('📺 Remote stream removed');
        _remoteRenderer.srcObject = null;
        _remoteStreamController.add(false);
      };

      _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
        debugPrint('🔗 Connection state: $state');

        switch (state) {
          case RTCPeerConnectionState.RTCPeerConnectionStateConnected:
            // Reset reconnect attempts on successful connection
            _reconnectAttempts = 0;
            _isReconnecting = false;
            onReconnectionStateChanged?.call(false, 0);
            if (_callState != CallState.connected) {
              _updateCallState(CallState.connected);
            }
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateFailed:
            // Attempt reconnection before giving up
            if (_reconnectAttempts < _maxReconnectAttempts) {
              _attemptReconnection();
            } else {
              _updateCallState(CallState.failed);
              _cleanup();
            }
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateDisconnected:
            // Attempt reconnection on disconnection
            if (_callState == CallState.connected && _reconnectAttempts < _maxReconnectAttempts) {
              _attemptReconnection();
            } else if (_reconnectAttempts >= _maxReconnectAttempts) {
              _updateCallState(CallState.ended);
              _cleanup();
            }
            break;
          default:
            break;
        }
      };

      debugPrint('✅ Peer connection created');
    } catch (e) {
      debugPrint('❌ Failed to create peer connection: $e');
      throw Exception('Failed to create peer connection: $e');
    }
  }

  /// Create local media stream
  Future<void> _createLocalStream() async {
    try {
      // Request permissions first
      await _requestMediaPermissions();
      
      debugPrint('🎥 Creating media stream with constraints...');
      
      // Configure media constraints based on call type
      final audioConstraints = {
        'sampleRate': 44100,
        'channelCount': 1,
        'echoCancellation': true,
        'noiseSuppression': true,
        'autoGainControl': true,
        // Android-specific audio constraints
        'googEchoCancellation': true,
        'googEchoCancellation2': true,
        'googDAEchoCancellation': true,
        'googAutoGainControl': true,
        'googAutoGainControl2': true,
        'googNoiseSuppression': true,
        'googNoiseSuppression2': true,
        'googTypingNoiseDetection': true,
        'googAudioMirroring': false,
      };

      final videoConstraints = _callType == CallType.video ? {
        'facingMode': _isFrontCamera ? 'user' : 'environment',
        'width': {'min': 320, 'ideal': 640, 'max': 1280},
        'height': {'min': 240, 'ideal': 480, 'max': 720},
        'frameRate': {'min': 15, 'ideal': 30, 'max': 30},
      } : false;
      
      final mediaConstraints = <String, dynamic>{
        'audio': audioConstraints,
        'video': videoConstraints,
      };

      debugPrint('🎥 Requesting user media...');
      
      // Add timeout to prevent hanging on iOS
      _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
          .timeout(const Duration(seconds: 10), onTimeout: () {
        throw Exception('Media access timeout - please restart the app and try again');
      });
      
      debugPrint('🎥 Setting local renderer...');
      _localRenderer.srcObject = _localStream;

      // Debug local stream details
      debugPrint('🎥 Local stream created with ${_localStream!.getVideoTracks().length} video tracks and ${_localStream!.getAudioTracks().length} audio tracks');
      for (var track in _localStream!.getVideoTracks()) {
        debugPrint('📹 Local video track: ${track.id} - enabled: ${track.enabled}');
      }
      for (var track in _localStream!.getAudioTracks()) {
        debugPrint('🎵 Local audio track: ${track.id} - enabled: ${track.enabled}');
      }

      // Add tracks individually to peer connection (non-blocking approach)
      if (_peerConnection != null) {
        debugPrint('🎥 Adding tracks to peer connection...');
        
        // Add audio track
        final audioTracks = _localStream!.getAudioTracks();
        if (audioTracks.isNotEmpty) {
          final audioTrack = audioTracks.first;
          debugPrint('🎵 Adding audio track...');
          debugPrint('🎵 Audio track ID: ${audioTrack.id}');
          debugPrint('🎵 Audio track enabled: ${audioTrack.enabled}');
          debugPrint('🎵 Audio track kind: ${audioTrack.kind}');
          
          // Ensure audio track is enabled (critical for Android)
          audioTrack.enabled = true;
          debugPrint('🎵 Audio track explicitly enabled: ${audioTrack.enabled}');
          
          await _peerConnection!.addTrack(audioTrack, _localStream!);
          debugPrint('✅ Audio track added to peer connection');
          
          // Verify track was added successfully
          final senders = await _peerConnection!.getSenders();
          final audioSender = senders.where((sender) => sender.track?.kind == 'audio').firstOrNull;
          if (audioSender != null) {
            debugPrint('✅ Audio sender confirmed: ${audioSender.track?.id}');
          } else {
            debugPrint('❌ No audio sender found after adding track');
          }
        } else {
          debugPrint('❌ No audio tracks found in local stream');
        }
        
        // Add video track
        final videoTracks = _localStream!.getVideoTracks();
        if (videoTracks.isNotEmpty) {
          debugPrint('📹 Adding video track...');
          await _peerConnection!.addTrack(videoTracks.first, _localStream!);
          debugPrint('✅ Video track added');
        }
        
        debugPrint('✅ All tracks added to peer connection');
      }

      debugPrint('✅ Local stream created successfully');
      
      // Final verification of audio track state
      _verifyAudioTrackState();
    } catch (e) {
      debugPrint('❌ Failed to create local stream: $e');
      throw Exception('Failed to access camera/microphone: $e');
    }
  }

  /// Verify audio track state for debugging
  void _verifyAudioTrackState() {
    try {
      if (_localStream == null) {
        debugPrint('❌ Local stream is null - cannot verify audio');
        return;
      }
      
      final audioTracks = _localStream!.getAudioTracks();
      debugPrint('🎵 Audio track verification:');
      debugPrint('🎵 Number of audio tracks: ${audioTracks.length}');
      
      for (int i = 0; i < audioTracks.length; i++) {
        final track = audioTracks[i];
        debugPrint('🎵 Track $i - ID: ${track.id}');
        debugPrint('🎵 Track $i - Enabled: ${track.enabled}');
        debugPrint('🎵 Track $i - Kind: ${track.kind}');
        debugPrint('🎵 Track $i - Muted: ${track.muted}');
      }
      
      debugPrint('🎵 Service mute state: $_isMuted');
      debugPrint('🎵 Should audio be audible: ${audioTracks.isNotEmpty && audioTracks.first.enabled && !_isMuted}');
    } catch (e) {
      debugPrint('❌ Failed to verify audio track state: $e');
    }
  }

  /// Request media permissions
  Future<void> _requestMediaPermissions() async {
    try {
      debugPrint('🎤 Requesting microphone permission...');
      // Always request microphone permission
      final microphoneStatus = await Permission.microphone.request();
      debugPrint('🎤 Microphone permission status: $microphoneStatus');
      if (microphoneStatus != PermissionStatus.granted) {
        debugPrint('❌ Microphone permission denied: $microphoneStatus');
        throw Exception('Microphone permission denied');
      }
      debugPrint('✅ Microphone permission granted');

      // Request camera permission only for video calls
      if (_callType == CallType.video) {
        final cameraStatus = await Permission.camera.request();
        if (cameraStatus != PermissionStatus.granted) {
          throw Exception('Camera permission denied');
        }
      }

      debugPrint('✅ Media permissions granted');
    } catch (e) {
      debugPrint('❌ Failed to request media permissions: $e');
      rethrow;
    }
  }

  /// Handle WebRTC offer
  Future<void> _handleOffer(Map<String, dynamic> data) async {
    try {
      final sessionId = data['sessionId'];
      final offer = data['offer'];
      final fromUserId = data['fromUserId'];

      debugPrint('🔥 WebRTC: Received offer - sessionId: $sessionId, currentSessionId: $_currentSessionId');
      debugPrint('🔥 WebRTC: Offer from: $fromUserId, peerConnection: ${_peerConnection != null}');

      if (sessionId != _currentSessionId) {
        debugPrint('❌ WebRTC: Offer session ID mismatch! Expected: $_currentSessionId, Got: $sessionId');
        return;
      }

      if (_peerConnection == null) {
        debugPrint('🔄 WebRTC: Peer connection not ready, queuing offer for later processing');
        _pendingOffer = data;
        return;
      }

      debugPrint('📨 Received WebRTC offer from $fromUserId');

      final rtcOffer = RTCSessionDescription(offer['sdp'], offer['type']);
      await _peerConnection!.setRemoteDescription(rtcOffer);
      debugPrint('✅ WebRTC: Remote description set');

      // Create answer
      debugPrint('📤 Creating WebRTC answer...');
      final answer = await _peerConnection!.createAnswer();
      await _peerConnection!.setLocalDescription(answer);
      debugPrint('✅ WebRTC: Local description (answer) set');

      // Debug: Check if audio is included in the answer SDP
      final sdp = answer.sdp;
      final hasAudio = sdp!.contains('m=audio');
      final hasAudioTrack = sdp.contains('a=mid:0') || sdp.contains('a=mid:audio');
      debugPrint('🎵 Answer SDP contains audio: $hasAudio');
      debugPrint('🎵 Answer SDP contains audio track: $hasAudioTrack');
      if (hasAudio) {
        debugPrint('🎵 Audio section in answer SDP found');
      } else {
        debugPrint('❌ No audio section in answer SDP - audio transmission will fail');
      }

      // Send answer
      _socketService.emit('webrtc_answer', {
        'sessionId': sessionId,
        'answer': answer.toMap(),
        'targetUserId': fromUserId,
      });

      debugPrint('📤 WebRTC answer sent to $fromUserId');
      
      // Verify audio track state after answer creation
      _verifyAudioTrackState();
    } catch (e) {
      debugPrint('❌ Failed to handle offer: $e');
    }
  }

  /// Handle WebRTC answer
  Future<void> _handleAnswer(Map<String, dynamic> data) async {
    try {
      final sessionId = data['sessionId'];
      final answer = data['answer'];
      final fromUserId = data['fromUserId'];

      if (sessionId != _currentSessionId || !_isInitiator) return;

      debugPrint('📨 Received WebRTC answer from $fromUserId');

      final rtcAnswer = RTCSessionDescription(answer['sdp'], answer['type']);
      await _peerConnection!.setRemoteDescription(rtcAnswer);

      debugPrint('✅ WebRTC answer processed');
    } catch (e) {
      debugPrint('❌ Failed to handle answer: $e');
    }
  }

  /// Handle ICE candidate
  Future<void> _handleIceCandidate(Map<String, dynamic> data) async {
    try {
      final sessionId = data['sessionId'];
      final candidate = data['candidate'];

      if (sessionId != _currentSessionId) return;

      final iceCandidate = RTCIceCandidate(
        candidate['candidate'],
        candidate['sdpMid'],
        candidate['sdpMLineIndex'],
      );

      await _peerConnection!.addCandidate(iceCandidate);
      debugPrint('🧊 ICE candidate added');
    } catch (e) {
      debugPrint('❌ Failed to handle ICE candidate: $e');
    }
  }


  /// Update call state and notify listeners
  /// Create and send WebRTC offer
  Future<void> _createAndSendOffer() async {
    try {
      if (_peerConnection == null) {
        debugPrint('❌ Cannot create offer: peer connection is null');
        return;
      }

      debugPrint('📤 Creating WebRTC offer...');
      
      // Create offer
      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      // Debug: Check if audio is included in the offer SDP
      final sdp = offer.sdp;
      final hasAudio = sdp!.contains('m=audio');
      final hasAudioTrack = sdp.contains('a=mid:0') || sdp.contains('a=mid:audio');
      debugPrint('🎵 Offer SDP contains audio: $hasAudio');
      debugPrint('🎵 Offer SDP contains audio track: $hasAudioTrack');
      if (hasAudio) {
        debugPrint('🎵 Audio section in SDP found');
      } else {
        debugPrint('❌ No audio section in SDP - audio transmission will fail');
      }

      // Send offer to remote peer
      _socketService.emit('webrtc_offer', {
        'sessionId': _currentSessionId,
        'targetUserId': _remoteUserId,
        'offer': offer.toMap(),
      });

      debugPrint('📤 WebRTC offer sent');
      
      // Verify audio track state after offer creation
      _verifyAudioTrackState();
    } catch (e) {
      debugPrint('❌ Failed to create and send offer: $e');
      _updateCallState(CallState.failed);
    }
  }

  void _updateCallState(CallState newState) {
    if (_callState != newState) {
      _callState = newState;
      
      // Track call duration for billing
      if (newState == CallState.connected && _callStartTime == null) {
        _callStartTime = DateTime.now();
        // Start duration timer to notify listeners every second
        _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
          notifyListeners(); // Update UI with current duration
        });
        debugPrint('⏱️ Call started at: $_callStartTime');
        
        // Ensure speaker is enabled when call connects (iPhone 15 Pro fix)
        _ensureSpeakerOnConnection();
      } else if ((newState == CallState.ended || newState == CallState.failed || newState == CallState.rejected) && _callStartTime != null) {
        _callEndTime = DateTime.now();
        _durationTimer?.cancel();
        _durationTimer = null;
        final duration = _callEndTime!.difference(_callStartTime!);
        debugPrint('⏱️ Call ended at: $_callEndTime, Total duration: ${duration.inMinutes}:${(duration.inSeconds % 60).toString().padLeft(2, '0')}');
      }
      
      _callStateController.add(newState);
      notifyListeners();
      debugPrint('📞 Call state changed to: $newState');
    }
  }

  /// Attempt to reconnect after connection failure
  Future<void> _attemptReconnection() async {
    if (_isReconnecting) {
      debugPrint('🔄 Already reconnecting, skipping...');
      return;
    }

    _isReconnecting = true;
    _reconnectAttempts++;
    debugPrint('🔄 Attempting reconnection (attempt $_reconnectAttempts of $_maxReconnectAttempts)');

    // Update UI state
    _updateCallState(CallState.reconnecting);
    onReconnectionStateChanged?.call(true, _reconnectAttempts);

    // Wait before attempting reconnection
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () async {
      try {
        // Close existing peer connection without full cleanup
        if (_peerConnection != null) {
          await _peerConnection!.close();
          _peerConnection = null;
        }

        // Recreate peer connection
        await _createPeerConnection();

        // Re-add local stream if exists
        if (_localStream != null && _peerConnection != null) {
          _peerConnection!.addStream(_localStream!);
        }

        // If we're the initiator, create and send new offer
        if (_isInitiator) {
          await _createAndSendOffer();
        } else {
          // Signal to remote peer that we're ready for reconnection
          _socketService.emit('reconnection_ready', {
            'sessionId': _currentSessionId,
            'userId': _remoteUserId,
          });
        }

        debugPrint('✅ Reconnection attempt $_reconnectAttempts initiated');
      } catch (e) {
        debugPrint('❌ Reconnection attempt $_reconnectAttempts failed: $e');
        _isReconnecting = false;

        // Try again if we haven't exceeded max attempts
        if (_reconnectAttempts < _maxReconnectAttempts) {
          _attemptReconnection();
        } else {
          _updateCallState(CallState.failed);
          onReconnectionStateChanged?.call(false, _reconnectAttempts);
          await _cleanup();
        }
      }
    });
  }

  /// Cancel ongoing reconnection attempts
  void cancelReconnection() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _isReconnecting = false;
    _reconnectAttempts = 0;
    onReconnectionStateChanged?.call(false, 0);
    debugPrint('🛑 Reconnection cancelled');
  }

  /// Cleanup WebRTC resources
  Future<void> _cleanup() async {
    try {
      // Cancel any ongoing reconnection
      cancelReconnection();

      // Stop local stream
      if (_localStream != null) {
        _localStream!.getTracks().forEach((track) => track.stop());
        _localStream!.dispose();
        _localStream = null;
      }

      // Clear renderers
      _localRenderer.srcObject = null;
      _remoteRenderer.srcObject = null;

      // Close peer connection
      if (_peerConnection != null) {
        await _peerConnection!.close();
        _peerConnection = null;
      }

      // Reset state
      _currentSessionId = null;
      _currentCallId = null;
      _remoteUserId = null;
      _remoteUserName = null;
      _isInitiator = false;
      _isMuted = false;
      _isCameraOn = true;
      _isSpeakerOn = false;

      // Clean up duration tracking
      _durationTimer?.cancel();
      _durationTimer = null;
      _callStartTime = null;
      _callEndTime = null;
      _pendingOffer = null; // Clear any pending offer

      // Update state to idle
      if (_callState != CallState.idle) {
        _updateCallState(CallState.idle);
      }

      debugPrint('🧹 WebRTC cleanup completed');
    } catch (e) {
      debugPrint('❌ Error during cleanup: $e');
    }
  }

  /// Dispose resources
  @override
  void dispose() {
    _cleanup();
    _localRenderer.dispose();
    _remoteRenderer.dispose();
    _callStateController.close();
    _remoteStreamController.close();
    super.dispose();
  }

  /// Get call duration (if connected)
  String getCallDuration() {
    if (_callStartTime == null) {
      return "00:00";
    }
    
    final currentTime = DateTime.now();
    final duration = currentTime.difference(_callStartTime!);
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    
    return "${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}";
  }
  
  /// Get total call duration in minutes for billing
  int getCallDurationMinutes() {
    if (_callStartTime == null) return 0;
    
    final endTime = _callEndTime ?? DateTime.now();
    final duration = endTime.difference(_callStartTime!);
    return duration.inMinutes;
  }
  
  /// Get call start time
  DateTime? get callStartTime => _callStartTime;
  
  /// Get call end time
  DateTime? get callEndTime => _callEndTime;

  /// Check if call is active
  bool get isCallActive => _callState == CallState.connected;

  /// Check if call is in progress (any state except idle)
  bool get isCallInProgress => _callState != CallState.idle;
}