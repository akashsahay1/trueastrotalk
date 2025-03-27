import 'dart:async';
import 'dart:convert';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WebRTCService {
  // WebRTC connections
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;

  // Call info
  String? _callId;
  String? _userId;
  String? _remoteUserId;
  bool _isInitiator = false;
  bool _isCallActive = false;

  // API access
  final String _baseUrl;
  Timer? _pollingTimer;

  // Event callbacks
  Function(MediaStream stream)? onLocalStreamAvailable;
  Function(MediaStream stream)? onRemoteStreamAvailable;
  Function()? onCallConnected;
  Function()? onCallEnded;
  Function(String message)? onError;

  WebRTCService({required String baseUrl}) : _baseUrl = baseUrl;

  // Initialize user ID
  void setUserId(String userId) {
    _userId = userId;
  }

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
    };
  }

  // Create media stream with camera and microphone
  Future<void> createStream() async {
    await [Permission.camera, Permission.microphone].request();

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
      onLocalStreamAvailable?.call(_localStream!);
    } catch (e) {
      onError?.call("Cannot access camera and microphone: $e");
    }
  }

  // Initialize peer connection
  Future<void> _createPeerConnection() async {
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
        onRemoteStreamAvailable?.call(_remoteStream!);
      }
    };
  }

  // Make call to an astrologer
  Future<void> makeCall(String callId, String astrologerId) async {
    _callId = callId;
    _remoteUserId = astrologerId;
    _isInitiator = true;

    await _createPeerConnection();

    // Create offer
    RTCSessionDescription offer = await _peerConnection!.createOffer();
    await _peerConnection!.setLocalDescription(offer);

    // Save the offer to Laravel backend
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$_baseUrl/api/calls/offer'),
      headers: headers,
      body: jsonEncode({
        'call_id': _callId,
        'caller_id': _userId,
        'receiver_id': astrologerId,
        'offer': {
          'type': offer.type,
          'sdp': offer.sdp,
        },
      }),
    );

    if (response.statusCode != 200) {
      onError?.call('Failed to send offer: ${response.body}');
      return;
    }

    // Start polling for answer
    _startPollingForAnswer();
  }

  // Poll for answer
  void _startPollingForAnswer() {
    // Poll every 2 seconds
    _pollingTimer = Timer.periodic(Duration(seconds: 2), (timer) async {
      if (!_isInitiator || _callId == null || _isCallActive) {
        timer.cancel();
        return;
      }

      try {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/api/calls/$_callId/answer'),
          headers: headers,
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);

          // Check if answer exists
          if (data['answer'] != null) {
            timer.cancel();

            // Process answer
            final answer = RTCSessionDescription(
              data['answer']['sdp'],
              data['answer']['type'],
            );
            RTCSessionDescription? remoteDesc = await _peerConnection!.getRemoteDescription();
            if (remoteDesc == null) {
              await _peerConnection!.setRemoteDescription(answer);
              _isCallActive = true;
              onCallConnected?.call();
            }

            // Start polling for ICE candidates
            _startPollingForIceCandidates();
          }

          // Check if call was rejected or ended
          if (data['status'] == 'rejected' || data['status'] == 'ended') {
            timer.cancel();
            _cleanupCall();
          }
        }
      } catch (e) {
        print('Error polling for answer: $e');
      }
    });
  }

  // Answer incoming call
  Future<void> answerCall(String callId, String callerId) async {
    _callId = callId;
    _remoteUserId = callerId;
    _isInitiator = false;

    await _createPeerConnection();

    // Get the call offer
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/api/calls/$callId'),
      headers: headers,
    );

    if (response.statusCode != 200) {
      onError?.call('Failed to get call data: ${response.body}');
      return;
    }

    final data = jsonDecode(response.body);

    // Set offer
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
      }),
    );

    if (answerResponse.statusCode != 200) {
      onError?.call('Failed to send answer: ${answerResponse.body}');
      return;
    }

    _isCallActive = true;
    onCallConnected?.call();

    // Start polling for ICE candidates
    _startPollingForIceCandidates();
  }

  // Poll for ICE candidates
  void _startPollingForIceCandidates() {
    // Poll every 2 seconds
    _pollingTimer = Timer.periodic(Duration(seconds: 2), (timer) async {
      if (_callId == null || !_isCallActive) {
        timer.cancel();
        return;
      }

      try {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/api/calls/$_callId/ice-candidates?user_id=$_remoteUserId'),
          headers: headers,
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);

          // Process ICE candidates
          if (data['candidates'] != null) {
            for (var candidate in data['candidates']) {
              await _peerConnection!.addCandidate(RTCIceCandidate(
                candidate['candidate'],
                candidate['sdpMid'],
                candidate['sdpMLineIndex'],
              ));
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

  // Reject incoming call
  Future<void> rejectCall(String callId) async {
    final headers = await _getHeaders();
    await http.post(
      Uri.parse('$_baseUrl/api/calls/$callId/reject'),
      headers: headers,
    );
  }

  // End the current call
  Future<void> endCall() async {
    if (_callId != null) {
      try {
        final headers = await _getHeaders();
        await http.post(
          Uri.parse('$_baseUrl/api/calls/$_callId/end'),
          headers: headers,
        );
      } catch (e) {
        print('Error ending call: $e');
      }
    }

    _cleanupCall();
  }

  // Clean up resources
  void _cleanupCall() {
    _pollingTimer?.cancel();
    _pollingTimer = null;

    _isCallActive = false;

    // Close streams
    _localStream?.getTracks().forEach((track) => track.stop());
    _localStream?.dispose();
    _localStream = null;

    _remoteStream?.dispose();
    _remoteStream = null;

    // Close peer connection
    _peerConnection?.close();
    _peerConnection = null;

    onCallEnded?.call();
  }

  // Handle ICE candidates
  void _onIceCandidate(RTCIceCandidate candidate) async {
    if (_callId == null) return;

    try {
      final headers = await _getHeaders();
      await http.post(
        Uri.parse('$_baseUrl/api/calls/$_callId/ice-candidate'),
        headers: headers,
        body: jsonEncode({
          'user_id': _userId,
          'candidate': {
            'candidate': candidate.candidate,
            'sdpMid': candidate.sdpMid,
            'sdpMLineIndex': candidate.sdpMLineIndex,
          },
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
      _isCallActive = true;
      onCallConnected?.call();
    } else if (state == RTCIceConnectionState.RTCIceConnectionStateFailed || state == RTCIceConnectionState.RTCIceConnectionStateDisconnected || state == RTCIceConnectionState.RTCIceConnectionStateClosed) {
      if (_isCallActive) {
        endCall();
      }
    }
  }
}
