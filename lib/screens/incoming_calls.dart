import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:provider/provider.dart';
import '../services/calls.dart';
import 'call.dart';

class IncomingCallScreen extends StatefulWidget {
  final String callId;
  final String callerName;
  final String? callerImage;
  final String callerId;

  const IncomingCallScreen({
    Key? key,
    required this.callId,
    required this.callerName,
    this.callerImage,
    required this.callerId,
  }) : super(key: key);

  @override
  IncomingCallScreenState createState() => IncomingCallScreenState();
}

class IncomingCallScreenState extends State<IncomingCallScreen> {
  late CallService _callService;
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isAnswering = false;

  @override
  void initState() {
    super.initState();
    _callService = Provider.of<CallService>(context, listen: false);
    _playRingtone();
  }

  @override
  void dispose() {
    _audioPlayer.stop();
    super.dispose();
  }

  Future<void> _playRingtone() async {
    try {
      await _audioPlayer.play(AssetSource('sounds/ringtone.mp3'), volume: 1.0);
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
    } catch (e) {
      print('Error playing ringtone: $e');
    }
  }

  void _answerCall() async {
    setState(() {
      _isAnswering = true;
    });

    await _audioPlayer.stop();

    try {
      await _callService.answerCall(widget.callId);

      if (!mounted) return;

      // Navigate to call screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => CallScreen(
            callId: widget.callId,
            remoteUserId: widget.callerId,
            remoteName: widget.callerName,
            remoteImage: widget.callerImage,
            isIncoming: true,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to answer call: $e')),
      );
      Navigator.pop(context);
    }
  }

  void _rejectCall() async {
    await _audioPlayer.stop();
    await _callService.rejectCall(widget.callId);
    if (!mounted) return;
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1C1B1F),
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const SizedBox(height: 60),
            Column(
              children: [
                const Text(
                  'Incoming Call',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                CircleAvatar(
                  radius: 70,
                  backgroundImage: widget.callerImage != null ? NetworkImage(widget.callerImage!) : const AssetImage('assets/images/default_profile.png') as ImageProvider,
                  backgroundColor: Colors.grey[300],
                ),
                const SizedBox(height: 20),
                Text(
                  widget.callerName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'is calling you',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 50.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Reject Button
                  GestureDetector(
                    onTap: _isAnswering ? null : _rejectCall,
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.red,
                      ),
                      child: const Icon(
                        Icons.call_end,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                  ),
                  // Answer Button
                  GestureDetector(
                    onTap: _isAnswering ? null : _answerCall,
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.green,
                      ),
                      child: _isAnswering
                          ? const CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3,
                            )
                          : const Icon(
                              Icons.call,
                              color: Colors.white,
                              size: 30,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
