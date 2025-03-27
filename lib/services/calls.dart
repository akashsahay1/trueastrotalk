import 'dart:async';
import 'dart:convert';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:audioplayers/audioplayers.dart';

// Call states
enum CallState {
  idle,
  outgoing,
  incoming,
  connecting,
  connected,
  disconnected,
}

// Call event callbacks
class CallEvents {
  Function(MediaStream stream)? onLocalStreamReady;
  Function(MediaStream stream)? onRemoteStreamReady;
  Function()? onCallConnected;
  Function()? onCallEnded;
  Function(String error)? onError;
  Function(int seconds)? onCallDurationChanged;
  Function(int minutes)? onRemainingTimeChanged;

  CallEvents({
    this.onLocalStreamReady,
    this.onRemoteStreamReady,
    this.onCallConnected,
    this.onCallEnded,
    this.onError,
    this.onCallDurationChanged,
    this.onRemainingTimeChanged,
  });
}

class CallService {
  // WebRTC connections
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;

  // Call state
  CallState _callState = CallState.idle;
  String? _callId;
  Timer? _pollingTimer;
  Timer? _callDurationTimer;
  int _callDurationInSeconds = 0;
  final AudioPlayer _audioPlayer = AudioPlayer();

  // API base URL
  final String _baseUrl;

  // Event callbacks
  CallEvents _events;

  CallService({
    required String baseUrl,
    required CallEvents events,
  })  : _baseUrl = baseUrl,
        _events = events;

  CallEvents get events => _events;

  // Get current call state
  CallState get callState => _callState;

  // Get call duration
  int get callDuration => _callDurationInSeconds;

  // Get auth token for API calls
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Get headers for API calls
  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
    };
  }

  // Initialize media streams
  Future<void> initializeLocalStream() async {
    // Request permissions
    await [Permission.microphone, Permission.camera].request();

    // Create media stream
    final mediaConstraints = {
      'audio': true,
      'video': {
        'mandatory': {
          'minWidth': '640',
          'minHeight': '480',
          'minFrameRate': '30',
        },
        'facingMode': 'user',
      }
    };

    try {
      _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      _events.onLocalStreamReady?.call(_localStream!);
    } catch (e) {
      _events.onError?.call("Cannot access camera or microphone: $e");
    }
  }

  // Create WebRTC peer connection
  Future<void> _createPeerConnection() async {
    // WebRTC configuration
    final config = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun1.l.google.com:19302'},
      ]
    };

    final constraints = {
      'mandatory': {},
      'optional': [
        {'DtlsSrtpKeyAgreement': true},
      ],
    };

    // Create peer connection
    _peerConnection = await createPeerConnection(config, constraints);

    // Add local tracks to connection
    if (_localStream != null) {
      _localStream!.getTracks().forEach((track) {
        _peerConnection!.addTrack(track, _localStream!);
      });
    }

    // Set up callbacks
    _peerConnection!.onIceCandidate = _onIceCandidate;
    _peerConnection!.onIceConnectionState = _onIceConnectionState;

    // Handle incoming remote stream
    _peerConnection!.onTrack = (RTCTrackEvent event) {
      if (event.streams.isNotEmpty) {
        _remoteStream = event.streams[0];
        _events.onRemoteStreamReady?.call(_remoteStream!);
      }
    };
  }

  // Make a call to an astrologer
  Future<void> startCall(int astrologerId, String sessionId) async {
    _callState = CallState.outgoing;
    _callId = sessionId;

    // Initialize WebRTC if not already done
    if (_localStream == null) {
      await initializeLocalStream();
    }

    await _createPeerConnection();

    // Create offer
    RTCSessionDescription offer = await _peerConnection!.createOffer();
    await _peerConnection!.setLocalDescription(offer);

    // Send offer to server
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$_baseUrl/api/calls/create'),
        headers: headers,
        body: jsonEncode({
          'call_id': sessionId,
          'astrologer_id': astrologerId,
          'offer': {
            'type': offer.type,
            'sdp': offer.sdp,
          },
        }),
      );

      if (response.statusCode != 200) {
        _events.onError?.call('Failed to create call: ${response.body}');
        _cleanupCall();
        return;
      }

      // Start polling for answer
      _startPollingForAnswer();
    } catch (e) {
      _events.onError?.call('Error creating call: $e');
      _cleanupCall();
    }
  }

  // Answer an incoming call
  Future<void> answerCall(String callId) async {
    _callState = CallState.connecting;
    _callId = callId;

    // Stop ringtone if playing
    await _audioPlayer.stop();

    // Initialize WebRTC if not already done
    if (_localStream == null) {
      await initializeLocalStream();
    }

    await _createPeerConnection();

    try {
      // Get call details with offer
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$_baseUrl/api/calls/$callId'),
        headers: headers,
      );

      if (response.statusCode != 200) {
        _events.onError?.call('Failed to get call details: ${response.body}');
        _cleanupCall();
        return;
      }

      final data = jsonDecode(response.body);

      // Set remote description (offer)
      final offer = RTCSessionDescription(
        data['offer']['sdp'],
        data['offer']['type'],
      );
      await _peerConnection!.setRemoteDescription(offer);

      // Create answer
      RTCSessionDescription answer = await _peerConnection!.createAnswer();
      await _peerConnection!.setLocalDescription(answer);

      // Send answer to server
      final answerResponse = await http.post(
        Uri.parse('$_baseUrl/api/calls/$callId/answer'),
        headers: headers,
        body: jsonEncode({
          'answer': {
            'type': answer.type,
            'sdp': answer.sdp,
          },
          'status': 'accepted',
        }),
      );

      if (answerResponse.statusCode != 200) {
        _events.onError?.call('Failed to send answer: ${answerResponse.body}');
        _cleanupCall();
        return;
      }

      // Start polling for ICE candidates
      _startPollingForIceCandidates();
    } catch (e) {
      _events.onError?.call('Error answering call: $e');
      _cleanupCall();
    }
  }

  // Reject an incoming call
  Future<void> rejectCall(String callId) async {
    try {
      // Stop ringtone if playing
      await _audioPlayer.stop();

      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$_baseUrl/api/calls/$callId/reject'),
        headers: headers,
      );

      if (response.statusCode != 200) {
        _events.onError?.call('Failed to reject call: ${response.body}');
      }
    } catch (e) {
      _events.onError?.call('Error rejecting call: $e');
    }
  }

  // End the current call
  Future<void> endCall() async {
    if (_callId != null) {
      try {
        final headers = await _getHeaders();
        await http.post(
          Uri.parse('$_baseUrl/api/calls/$_callId/end'),
          headers: headers,
          body: jsonEncode({
            'duration': _callDurationInSeconds,
          }),
        );
      } catch (e) {
        _events.onError?.call('Error ending call: $e');
      }
    }

    _cleanupCall();
  }

  // Handle incoming call notification
  Future<void> handleIncomingCall(String callId, String callerName) async {
    _callState = CallState.incoming;
    _callId = callId;

    // Play ringtone
    try {
      await _audioPlayer.play(AssetSource('sounds/ringtone.mp3'), volume: 1.0);
    } catch (e) {
      print('Error playing ringtone: $e');
    }
  }

  // Poll for answer from server
  void _startPollingForAnswer() {
    // Cancel any existing timer
    _pollingTimer?.cancel();

    _pollingTimer = Timer.periodic(Duration(seconds: 2), (timer) async {
      if (_callState != CallState.outgoing || _callId == null) {
        timer.cancel();
        return;
      }

      try {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/api/calls/$_callId/status'),
          headers: headers,
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);

          if (data['status'] == 'accepted' && data['answer'] != null) {
            timer.cancel();
            _callState = CallState.connecting;

            // Set remote description (answer)
            final answer = RTCSessionDescription(
              data['answer']['sdp'],
              data['answer']['type'],
            );

            await _peerConnection!.setRemoteDescription(answer);

            // Start polling for ICE candidates
            _startPollingForIceCandidates();
          } else if (data['status'] == 'rejected') {
            timer.cancel();
            _cleanupCall();
            _events.onError?.call('Call was rejected');
          } else if (data['status'] == 'ended') {
            timer.cancel();
            _cleanupCall();
          }
        }
      } catch (e) {
        print('Error polling for answer: $e');
      }
    });
  }

  // Poll for ICE candidates
  void _startPollingForIceCandidates() {
    // Cancel any existing timer
    _pollingTimer?.cancel();

    _pollingTimer = Timer.periodic(Duration(seconds: 1), (timer) async {
      if (_callId == null || _callState == CallState.idle) {
        timer.cancel();
        return;
      }

      try {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/api/calls/$_callId/candidates'),
          headers: headers,
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);

          // Process remote ICE candidates
          if (data['candidates'] != null) {
            for (var candidate in data['candidates']) {
              if (candidate['added'] == false) {
                await _peerConnection!.addCandidate(RTCIceCandidate(
                  candidate['candidate'],
                  candidate['sdpMid'],
                  candidate['sdpMLineIndex'],
                ));

                // Mark candidate as added
                await http.post(
                  Uri.parse('$_baseUrl/api/calls/$_callId/candidate/${candidate['id']}/mark-added'),
                  headers: headers,
                );
              }
            }
          }

          // Check if call was ended
          if (data['status'] == 'ended') {
            timer.cancel();
            _cleanupCall();
          }
        }
      } catch (e) {
        print('Error polling for ICE candidates: $e');
      }
    });
  }

  // Handle ICE candidate event
  void _onIceCandidate(RTCIceCandidate candidate) async {
    if (_callId == null) return;

    try {
      final headers = await _getHeaders();
      await http.post(
        Uri.parse('$_baseUrl/api/calls/$_callId/candidate'),
        headers: headers,
        body: jsonEncode({
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        }),
      );
    } catch (e) {
      print('Error sending ICE candidate: $e');
    }
  }

  // Monitor connection state changes
  void _onIceConnectionState(RTCIceConnectionState state) {
    print('ICE Connection State: $state');

    if (state == RTCIceConnectionState.RTCIceConnectionStateConnected) {
      if (_callState != CallState.connected) {
        _callState = CallState.connected;
        _startCallTimer();
        _events.onCallConnected?.call();
      }
    } else if (state == RTCIceConnectionState.RTCIceConnectionStateFailed || state == RTCIceConnectionState.RTCIceConnectionStateDisconnected || state == RTCIceConnectionState.RTCIceConnectionStateClosed) {
      if (_callState == CallState.connected) {
        _cleanupCall();
      }
    }
  }

  // Start call duration timer
  void _startCallTimer() {
    _callDurationInSeconds = 0;

    _callDurationTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      _callDurationInSeconds++;
      _events.onCallDurationChanged?.call(_callDurationInSeconds);

      // Update remaining time every minute
      if (_callDurationInSeconds % 60 == 0) {
        final minutesUsed = _callDurationInSeconds ~/ 60;
        _events.onRemainingTimeChanged?.call(minutesUsed);
      }
    });
  }

  // Clean up call resources
  void _cleanupCall() {
    _callState = CallState.idle;

    // Stop timers
    _pollingTimer?.cancel();
    _pollingTimer = null;

    _callDurationTimer?.cancel();
    _callDurationTimer = null;

    // Stop ringtone if playing
    _audioPlayer.stop();

    // Close streams
    _localStream?.getTracks().forEach((track) => track.stop());
    _localStream?.dispose();
    _localStream = null;

    _remoteStream?.dispose();
    _remoteStream = null;

    // Close peer connection
    _peerConnection?.close();
    _peerConnection = null;

    _events.onCallEnded?.call();
  }
}
