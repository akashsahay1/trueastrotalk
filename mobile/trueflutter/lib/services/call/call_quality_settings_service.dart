import 'package:flutter/foundation.dart';
import '../local/local_storage_service.dart';

enum VideoQuality {
  auto,
  high,
  medium,
  low,
  audioOnly,
}

enum AudioQuality {
  auto,
  high,
  medium,
  low,
}

enum NetworkOptimization {
  auto,
  optimizeForQuality,
  optimizeForBandwidth,
  conserveBandwidth,
}

class CallQualitySettings extends ChangeNotifier {
  static CallQualitySettings? _instance;
  static CallQualitySettings get instance => _instance ??= CallQualitySettings._();
  CallQualitySettings._();

  final LocalStorageService _storage = LocalStorageService();

  // Default settings
  VideoQuality _videoQuality = VideoQuality.auto;
  AudioQuality _audioQuality = AudioQuality.auto;
  NetworkOptimization _networkOptimization = NetworkOptimization.auto;
  bool _enableEchoCancellation = true;
  bool _enableNoiseSuppression = true;
  bool _enableAutoGainControl = true;
  bool _enableLowLatencyMode = false;
  int _maxVideoBitrate = 1500; // kbps
  int _maxAudioBitrate = 128; // kbps
  int _videoFrameRate = 30; // fps
  bool _enableAdaptiveBitrate = true;

  // Getters
  VideoQuality get videoQuality => _videoQuality;
  AudioQuality get audioQuality => _audioQuality;
  NetworkOptimization get networkOptimization => _networkOptimization;
  bool get enableEchoCancellation => _enableEchoCancellation;
  bool get enableNoiseSuppression => _enableNoiseSuppression;
  bool get enableAutoGainControl => _enableAutoGainControl;
  bool get enableLowLatencyMode => _enableLowLatencyMode;
  int get maxVideoBitrate => _maxVideoBitrate;
  int get maxAudioBitrate => _maxAudioBitrate;
  int get videoFrameRate => _videoFrameRate;
  bool get enableAdaptiveBitrate => _enableAdaptiveBitrate;

  Future<void> loadSettings() async {
    try {
      final videoQualityIndex = _storage.getInt('video_quality') ?? VideoQuality.auto.index;
      _videoQuality = VideoQuality.values[videoQualityIndex];

      final audioQualityIndex = _storage.getInt('audio_quality') ?? AudioQuality.auto.index;
      _audioQuality = AudioQuality.values[audioQualityIndex];

      final networkOptimizationIndex = _storage.getInt('network_optimization') ?? NetworkOptimization.auto.index;
      _networkOptimization = NetworkOptimization.values[networkOptimizationIndex];

      _enableEchoCancellation = _storage.getBool('echo_cancellation') ?? true;
      _enableNoiseSuppression = _storage.getBool('noise_suppression') ?? true;
      _enableAutoGainControl = _storage.getBool('auto_gain_control') ?? true;
      _enableLowLatencyMode = _storage.getBool('low_latency_mode') ?? false;
      _maxVideoBitrate = _storage.getInt('max_video_bitrate') ?? 1500;
      _maxAudioBitrate = _storage.getInt('max_audio_bitrate') ?? 128;
      _videoFrameRate = _storage.getInt('video_frame_rate') ?? 30;
      _enableAdaptiveBitrate = _storage.getBool('adaptive_bitrate') ?? true;

      notifyListeners();
    } catch (e) {
      if (kDebugMode) {
        print('Error loading call quality settings: $e');
      }
    }
  }

  Future<void> setVideoQuality(VideoQuality quality) async {
    _videoQuality = quality;
    await _storage.saveInt('video_quality', quality.index);
    _applyVideoQualityPreset(quality);
    notifyListeners();
  }

  Future<void> setAudioQuality(AudioQuality quality) async {
    _audioQuality = quality;
    await _storage.saveInt('audio_quality', quality.index);
    _applyAudioQualityPreset(quality);
    notifyListeners();
  }

  Future<void> setNetworkOptimization(NetworkOptimization optimization) async {
    _networkOptimization = optimization;
    await _storage.saveInt('network_optimization', optimization.index);
    _applyNetworkOptimizationPreset(optimization);
    notifyListeners();
  }

  Future<void> setEchoCancellation(bool enabled) async {
    _enableEchoCancellation = enabled;
    await _storage.saveBool('echo_cancellation', enabled);
    notifyListeners();
  }

  Future<void> setNoiseSuppression(bool enabled) async {
    _enableNoiseSuppression = enabled;
    await _storage.saveBool('noise_suppression', enabled);
    notifyListeners();
  }

  Future<void> setAutoGainControl(bool enabled) async {
    _enableAutoGainControl = enabled;
    await _storage.saveBool('auto_gain_control', enabled);
    notifyListeners();
  }

  Future<void> setLowLatencyMode(bool enabled) async {
    _enableLowLatencyMode = enabled;
    await _storage.saveBool('low_latency_mode', enabled);
    notifyListeners();
  }

  Future<void> setMaxVideoBitrate(int bitrate) async {
    _maxVideoBitrate = bitrate;
    await _storage.saveInt('max_video_bitrate', bitrate);
    notifyListeners();
  }

  Future<void> setMaxAudioBitrate(int bitrate) async {
    _maxAudioBitrate = bitrate;
    await _storage.saveInt('max_audio_bitrate', bitrate);
    notifyListeners();
  }

  Future<void> setVideoFrameRate(int frameRate) async {
    _videoFrameRate = frameRate;
    await _storage.saveInt('video_frame_rate', frameRate);
    notifyListeners();
  }

  Future<void> setAdaptiveBitrate(bool enabled) async {
    _enableAdaptiveBitrate = enabled;
    await _storage.saveBool('adaptive_bitrate', enabled);
    notifyListeners();
  }

  void _applyVideoQualityPreset(VideoQuality quality) {
    switch (quality) {
      case VideoQuality.high:
        _maxVideoBitrate = 2500;
        _videoFrameRate = 30;
        break;
      case VideoQuality.medium:
        _maxVideoBitrate = 1500;
        _videoFrameRate = 24;
        break;
      case VideoQuality.low:
        _maxVideoBitrate = 800;
        _videoFrameRate = 15;
        break;
      case VideoQuality.audioOnly:
        _maxVideoBitrate = 0;
        _videoFrameRate = 0;
        break;
      case VideoQuality.auto:
        _maxVideoBitrate = 1500;
        _videoFrameRate = 30;
        _enableAdaptiveBitrate = true;
        break;
    }
  }

  void _applyAudioQualityPreset(AudioQuality quality) {
    switch (quality) {
      case AudioQuality.high:
        _maxAudioBitrate = 256;
        break;
      case AudioQuality.medium:
        _maxAudioBitrate = 128;
        break;
      case AudioQuality.low:
        _maxAudioBitrate = 64;
        break;
      case AudioQuality.auto:
        _maxAudioBitrate = 128;
        break;
    }
  }

  void _applyNetworkOptimizationPreset(NetworkOptimization optimization) {
    switch (optimization) {
      case NetworkOptimization.optimizeForQuality:
        _enableAdaptiveBitrate = false;
        _enableLowLatencyMode = false;
        break;
      case NetworkOptimization.optimizeForBandwidth:
        _enableAdaptiveBitrate = true;
        _enableLowLatencyMode = false;
        break;
      case NetworkOptimization.conserveBandwidth:
        _enableAdaptiveBitrate = true;
        _enableLowLatencyMode = true;
        _maxVideoBitrate = 800;
        _maxAudioBitrate = 64;
        break;
      case NetworkOptimization.auto:
        _enableAdaptiveBitrate = true;
        _enableLowLatencyMode = false;
        break;
    }
  }

  Future<void> resetToDefaults() async {
    _videoQuality = VideoQuality.auto;
    _audioQuality = AudioQuality.auto;
    _networkOptimization = NetworkOptimization.auto;
    _enableEchoCancellation = true;
    _enableNoiseSuppression = true;
    _enableAutoGainControl = true;
    _enableLowLatencyMode = false;
    _maxVideoBitrate = 1500;
    _maxAudioBitrate = 128;
    _videoFrameRate = 30;
    _enableAdaptiveBitrate = true;

    // Clear stored settings
    await _storage.remove('video_quality');
    await _storage.remove('audio_quality');
    await _storage.remove('network_optimization');
    await _storage.remove('echo_cancellation');
    await _storage.remove('noise_suppression');
    await _storage.remove('auto_gain_control');
    await _storage.remove('low_latency_mode');
    await _storage.remove('max_video_bitrate');
    await _storage.remove('max_audio_bitrate');
    await _storage.remove('video_frame_rate');
    await _storage.remove('adaptive_bitrate');

    notifyListeners();
  }

  String getVideoQualityDescription(VideoQuality quality) {
    switch (quality) {
      case VideoQuality.auto:
        return 'Auto (Adapts to network)';
      case VideoQuality.high:
        return 'High (2.5 Mbps, 30fps)';
      case VideoQuality.medium:
        return 'Medium (1.5 Mbps, 24fps)';
      case VideoQuality.low:
        return 'Low (800 kbps, 15fps)';
      case VideoQuality.audioOnly:
        return 'Audio Only (No video)';
    }
  }

  String getAudioQualityDescription(AudioQuality quality) {
    switch (quality) {
      case AudioQuality.auto:
        return 'Auto (128 kbps)';
      case AudioQuality.high:
        return 'High (256 kbps)';
      case AudioQuality.medium:
        return 'Medium (128 kbps)';
      case AudioQuality.low:
        return 'Low (64 kbps)';
    }
  }

  String getNetworkOptimizationDescription(NetworkOptimization optimization) {
    switch (optimization) {
      case NetworkOptimization.auto:
        return 'Auto (Balanced quality and bandwidth)';
      case NetworkOptimization.optimizeForQuality:
        return 'Quality First (Fixed bitrates)';
      case NetworkOptimization.optimizeForBandwidth:
        return 'Adaptive (Dynamic quality)';
      case NetworkOptimization.conserveBandwidth:
        return 'Conserve Data (Minimal usage)';
    }
  }
}