import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:just_audio/just_audio.dart';

class RingtoneService {
  static RingtoneService? _instance;
  static RingtoneService get instance => _instance ??= RingtoneService._();
  
  RingtoneService._();
  
  AudioPlayer? _player;
  Timer? _ringtoneTimer;
  bool _isPlaying = false;
  
  /// Initialize the ringtone service
  Future<void> initialize() async {
    try {
      _player = AudioPlayer();
      debugPrint('🔔 RingtoneService initialized');
    } catch (e) {
      debugPrint('❌ Failed to initialize RingtoneService: $e');
    }
  }
  
  /// Start playing ringtone for incoming calls
  Future<void> startRingtone() async {
    if (_isPlaying) return;
    
    try {
      _isPlaying = true;
      debugPrint('🔔 Starting ringtone...');
      
      // First try to play custom MP3 ringtone
      await _playCustomRingtone();
      
      // Set up auto-stop after 30 seconds
      _ringtoneTimer = Timer(const Duration(seconds: 30), () {
        stopRingtone();
      });
      
    } catch (e) {
      debugPrint('❌ Failed to start ringtone: $e');
      _isPlaying = false;
    }
  }
  
  /// Stop playing ringtone
  Future<void> stopRingtone() async {
    if (!_isPlaying) return;
    
    try {
      debugPrint('🔕 Stopping ringtone...');
      
      _ringtoneTimer?.cancel();
      _ringtoneTimer = null;
      
      if (_player != null) {
        await _player!.stop();
      }
      
      _isPlaying = false;
    } catch (e) {
      debugPrint('❌ Failed to stop ringtone: $e');
    }
  }
  
  /// Play custom MP3 ringtone
  Future<void> _playCustomRingtone() async {
    try {
      if (_player == null) {
        debugPrint('❌ Audio player not initialized');
        return;
      }

      // Try to load and play custom ringtone
      try {
        debugPrint('🔔 Attempting to play custom ringtone: assets/audio/ringtone.mp3');
        await _player!.setAsset('assets/audio/ringtone.mp3');
        await _player!.setLoopMode(LoopMode.all); // Loop the ringtone
        await _player!.setVolume(0.8); // Set volume to 80%
        await _player!.play();
        debugPrint('✅ Custom ringtone started');
      } catch (e) {
        debugPrint('⚠️ Custom ringtone not available: $e');
        debugPrint('🔔 Falling back to system sounds...');
        // Fallback to system sound pattern
        await _playFallbackRingtone();
      }
      
    } catch (e) {
      debugPrint('❌ Failed to play custom ringtone: $e');
      // Final fallback to haptic feedback
      HapticFeedback.heavyImpact();
    }
  }

  /// Fallback ringtone using system sounds and haptic feedback
  Future<void> _playFallbackRingtone() async {
    try {
      debugPrint('🔔 Playing fallback ringtone pattern...');
      
      // First play a haptic feedback immediately
      HapticFeedback.heavyImpact();
      
      // Create a repeating pattern
      _ringtoneTimer?.cancel();
      _ringtoneTimer = Timer.periodic(const Duration(milliseconds: 800), (timer) {
        if (!_isPlaying) {
          timer.cancel();
          return;
        }
        
        // Play haptic feedback every 800ms to simulate ringing
        HapticFeedback.mediumImpact();
      });
      
    } catch (e) {
      debugPrint('❌ Failed to play fallback ringtone: $e');
    }
  }
  
  /// Check if ringtone is currently playing
  bool get isPlaying => _isPlaying;
  
  /// Dispose resources
  Future<void> dispose() async {
    await stopRingtone();
    await _player?.dispose();
    _player = null;
    debugPrint('🔔 RingtoneService disposed');
  }
}