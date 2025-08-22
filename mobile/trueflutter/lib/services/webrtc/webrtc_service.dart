import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../socket/socket_service.dart';
import '../service_locator.dart';

enum CallState {
  idle,
  initiating,
  ringing,
  connecting,
  connected,
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
  MediaStream? _remoteStream;
  RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();

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
      await _localRenderer.initialize();
      await _remoteRenderer.initialize();
      
      // Setup socket listeners for WebRTC signaling
      _setupSocketListeners();
      
      debugPrint('✅ WebRTC Service initialized');
    } catch (e) {
      debugPrint('❌ WebRTC initialization failed: $e');
      throw Exception('Failed to initialize WebRTC: $e');
    }
  }

  /// Setup socket event listeners for WebRTC signaling
  void _setupSocketListeners() {
    // Incoming call
    _socketService.on('incoming_call', (data) async {
      try {
        final callerId = data['callerId'];
        final callerName = data['callerName'];
        final callType = data['callType'] == 'video' ? CallType.video : CallType.voice;
        final sessionId = data['sessionId'];

        debugPrint('📞 Incoming call from $callerName ($callType)');

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

    // Call initiated
    _socketService.on('call_initiated', (data) async {
      try {
        final sessionId = data['sessionId'];
        final targetName = data['targetName'];

        debugPrint('📞 Call initiated to $targetName');

        _currentSessionId = sessionId;
        _remoteUserName = targetName;
        
        _updateCallState(CallState.ringing);
      } catch (e) {
        debugPrint('❌ Error handling call initiated: $e');
      }
    });

    // Call answered
    _socketService.on('call_answered', (data) async {
      try {
        final sessionId = data['sessionId'];
        
        if (sessionId == _currentSessionId) {
          debugPrint('✅ Call answered');
          _updateCallState(CallState.connecting);
        }
      } catch (e) {
        debugPrint('❌ Error handling call answered: $e');
      }
    });

    // Call rejected
    _socketService.on('call_rejected', (data) async {
      try {
        final sessionId = data['sessionId'];
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

    // Call ended
    _socketService.on('call_ended', (data) async {
      try {
        final sessionId = data['sessionId'];
        
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
  Future<void> initiateCall(String targetUserId, CallType callType) async {
    try {
      if (_callState != CallState.idle) {
        throw Exception('Call already in progress');
      }

      debugPrint('📞 Initiating $callType call to $targetUserId');

      _remoteUserId = targetUserId;
      _callType = callType;
      _isInitiator = true;
      
      _updateCallState(CallState.initiating);

      // Create peer connection and local stream
      await _createPeerConnection();
      await _createLocalStream();

      // Send initiate call event
      _socketService.emit('initiate_call', {
        'targetUserId': targetUserId,
        'callType': callType == CallType.video ? 'video' : 'voice',
      });

    } catch (e) {
      debugPrint('❌ Failed to initiate call: $e');
      _updateCallState(CallState.failed);
      await _cleanup();
      rethrow;
    }
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

      // Send answer call event
      _socketService.emit('answer_call', {
        'sessionId': _currentSessionId,
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
        'sessionId': _currentSessionId,
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
        'sessionId': _currentSessionId,
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

  /// Switch camera (front/rear)
  Future<void> switchCamera() async {
    try {
      if (_localStream == null || _callType != CallType.video) return;

      final videoTrack = _localStream!.getVideoTracks().first;
      await Helper.switchCamera(videoTrack);
      
      debugPrint('🔄 Camera switched');
    } catch (e) {
      debugPrint('❌ Failed to switch camera: $e');
    }
  }

  /// Toggle speaker on/off
  Future<void> toggleSpeaker() async {
    try {
      _isSpeakerOn = !_isSpeakerOn;
      await Helper.setSpeakerphoneOn(_isSpeakerOn);
      
      notifyListeners();
      debugPrint('🔊 Speaker ${_isSpeakerOn ? 'enabled' : 'disabled'}');
    } catch (e) {
      debugPrint('❌ Failed to toggle speaker: $e');
    }
  }

  /// Create peer connection
  Future<void> _createPeerConnection() async {
    try {
      _peerConnection = await createPeerConnection(_configuration, _constraints);

      _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
        debugPrint('🧊 ICE candidate: ${candidate.candidate}');
        
        _socketService.emit('webrtc_ice_candidate', {
          'sessionId': _currentSessionId,
          'candidate': candidate.toMap(),
          'targetUserId': _remoteUserId,
        });
      };

      _peerConnection!.onAddStream = (MediaStream stream) {
        debugPrint('📺 Remote stream added');
        _remoteStream = stream;
        _remoteRenderer.srcObject = stream;
        _remoteStreamController.add(true);
        
        if (_callState == CallState.connecting) {
          _updateCallState(CallState.connected);
        }
      };

      _peerConnection!.onRemoveStream = (MediaStream stream) {
        debugPrint('📺 Remote stream removed');
        _remoteStream = null;
        _remoteRenderer.srcObject = null;
        _remoteStreamController.add(false);
      };

      _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
        debugPrint('🔗 Connection state: $state');
        
        switch (state) {
          case RTCPeerConnectionState.RTCPeerConnectionStateConnected:
            if (_callState != CallState.connected) {
              _updateCallState(CallState.connected);
            }
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateFailed:
            _updateCallState(CallState.failed);
            _cleanup();
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateDisconnected:
            _updateCallState(CallState.ended);
            _cleanup();
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
      final mediaConstraints = <String, dynamic>{
        'audio': true,
        'video': _callType == CallType.video ? {
          'mandatory': {
            'minWidth': '640',
            'minHeight': '480',
            'minFrameRate': '30',
          },
          'facingMode': 'user',
          'optional': [],
        } : false,
      };

      _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      _localRenderer.srcObject = _localStream;

      // Add stream to peer connection
      if (_peerConnection != null) {
        await _peerConnection!.addStream(_localStream!);
      }

      debugPrint('✅ Local stream created');
    } catch (e) {
      debugPrint('❌ Failed to create local stream: $e');
      throw Exception('Failed to access camera/microphone: $e');
    }
  }

  /// Handle WebRTC offer
  Future<void> _handleOffer(Map<String, dynamic> data) async {
    try {
      final sessionId = data['sessionId'];
      final offer = data['offer'];
      final fromUserId = data['fromUserId'];

      if (sessionId != _currentSessionId) return;

      debugPrint('📨 Received WebRTC offer from $fromUserId');

      final rtcOffer = RTCSessionDescription(offer['sdp'], offer['type']);
      await _peerConnection!.setRemoteDescription(rtcOffer);

      // Create answer
      final answer = await _peerConnection!.createAnswer();
      await _peerConnection!.setLocalDescription(answer);

      // Send answer
      _socketService.emit('webrtc_answer', {
        'sessionId': sessionId,
        'answer': answer.toMap(),
        'targetUserId': fromUserId,
      });

      debugPrint('📤 WebRTC answer sent');
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

  /// Create WebRTC offer (for initiator)
  Future<void> _createOffer() async {
    try {
      if (!_isInitiator || _peerConnection == null) return;

      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      _socketService.emit('webrtc_offer', {
        'sessionId': _currentSessionId,
        'offer': offer.toMap(),
        'targetUserId': _remoteUserId,
      });

      debugPrint('📤 WebRTC offer sent');
    } catch (e) {
      debugPrint('❌ Failed to create offer: $e');
    }
  }

  /// Update call state and notify listeners
  void _updateCallState(CallState newState) {
    if (_callState != newState) {
      _callState = newState;
      _callStateController.add(newState);
      notifyListeners();
      debugPrint('📞 Call state changed to: $newState');
    }
  }

  /// Cleanup WebRTC resources
  Future<void> _cleanup() async {
    try {
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
      _remoteStream = null;
      _currentSessionId = null;
      _currentCallId = null;
      _remoteUserId = null;
      _remoteUserName = null;
      _isInitiator = false;
      _isMuted = false;
      _isCameraOn = true;
      _isSpeakerOn = false;

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
    // This would need to track start time and calculate duration
    // For now, return a placeholder
    return "00:00";
  }

  /// Check if call is active
  bool get isCallActive => _callState == CallState.connected;

  /// Check if call is in progress (any state except idle)
  bool get isCallInProgress => _callState != CallState.idle;
}