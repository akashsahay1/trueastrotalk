import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';
import '../services/calls.dart';

class CallScreen extends StatefulWidget {
  final String callId;
  final String remoteUserId;
  final String remoteName;
  final String? remoteImage;
  final bool isIncoming;

  const CallScreen({
    Key? key,
    required this.callId,
    required this.remoteUserId,
    required this.remoteName,
    this.remoteImage,
    this.isIncoming = false,
  }) : super(key: key);

  @override
  CallScreenState createState() => CallScreenState();
}

class CallScreenState extends State<CallScreen> {
  late CallService _callService;
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  bool _isMicMuted = false;
  bool _isCameraOff = false;
  //bool _isSpeakerOn = true;
  bool _isConnected = false;
  String _callDuration = '00:00';
  String? _remainingTime;

  @override
  void initState() {
    super.initState();
    _callService = Provider.of<CallService>(context, listen: false);
    _initRenderers();
    _setupCallbacks();
  }

  Future<void> _initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  void _setupCallbacks() {
    // Set up event handlers
    _callService.events.onLocalStreamReady = (stream) {
      setState(() {
        _localRenderer.srcObject = stream;
      });
    };

    _callService.events.onRemoteStreamReady = (stream) {
      setState(() {
        _remoteRenderer.srcObject = stream;
      });
    };

    _callService.events.onCallConnected = () {
      setState(() {
        _isConnected = true;
      });
    };

    _callService.events.onCallEnded = () {
      if (mounted) {
        Navigator.of(context).pop();
      }
    };

    _callService.events.onCallDurationChanged = (seconds) {
      setState(() {
        final minutes = (seconds / 60).floor();
        final remainingSeconds = seconds % 60;
        _callDuration = '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
      });
    };

    _callService.events.onRemainingTimeChanged = (minutes) {
      setState(() {
        _remainingTime = '$minutes min remaining';
      });
    };
  }

  @override
  void dispose() {
    _localRenderer.dispose();
    _remoteRenderer.dispose();
    super.dispose();
  }

  void _toggleMic() {
    setState(() {
      _isMicMuted = !_isMicMuted;
      _localRenderer.srcObject?.getAudioTracks().forEach((track) {
        track.enabled = !_isMicMuted;
      });
    });
  }

  void _toggleCamera() {
    setState(() {
      _isCameraOff = !_isCameraOff;
      _localRenderer.srcObject?.getVideoTracks().forEach((track) {
        track.enabled = !_isCameraOff;
      });
    });
  }

//   void _toggleSpeaker() {
//     // This would require platform-specific code to implement
//     setState(() {
//       _isSpeakerOn = !_isSpeakerOn;
//     });
//   }

  void _endCall() {
    _callService.endCall();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Remote video (full screen)
            _remoteRenderer.srcObject != null
                ? RTCVideoView(
                    _remoteRenderer,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                  )
                : Container(
                    color: Colors.black87,
                    child: Center(
                      child: _isConnected
                          ? const CircularProgressIndicator()
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                CircleAvatar(
                                  radius: 50,
                                  backgroundImage: widget.remoteImage != null ? NetworkImage(widget.remoteImage!) : const AssetImage('assets/images/default_profile.png') as ImageProvider,
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  widget.remoteName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'Connecting...',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),

            // Local video (picture-in-picture)
            Positioned(
              right: 20,
              top: 20,
              child: Container(
                width: 120,
                height: 160,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: _localRenderer.srcObject != null
                      ? RTCVideoView(
                          _localRenderer,
                          mirror: true,
                          objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                        )
                      : Container(
                          color: Colors.grey[900],
                          child: const Center(child: CircularProgressIndicator()),
                        ),
                ),
              ),
            ),

            // Call duration and remaining time
            Positioned(
              top: 20,
              left: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Text(
                      _callDuration,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (_remainingTime != null)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Text(
                        _remainingTime!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Call controls
            Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Mic button
                  _buildControlButton(
                    icon: _isMicMuted ? Icons.mic_off : Icons.mic,
                    backgroundColor: _isMicMuted ? Colors.red : Colors.white38,
                    onPressed: _toggleMic,
                  ),

                  // End call button
                  _buildControlButton(
                    icon: Icons.call_end,
                    backgroundColor: Colors.red,
                    iconSize: 30,
                    buttonSize: 70,
                    onPressed: _endCall,
                  ),

                  // Camera button
                  _buildControlButton(
                    icon: _isCameraOff ? Icons.videocam_off : Icons.videocam,
                    backgroundColor: _isCameraOff ? Colors.red : Colors.white38,
                    onPressed: _toggleCamera,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required Color backgroundColor,
    required VoidCallback onPressed,
    double iconSize = 24,
    double buttonSize = 60,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: buttonSize,
        height: buttonSize,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: backgroundColor,
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: iconSize,
        ),
      ),
    );
  }
}
