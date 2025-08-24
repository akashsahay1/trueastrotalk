import 'package:flutter/foundation.dart';
import '../local/local_storage_service.dart';

// Video quality presets
enum VideoQuality {
  auto,
  high,
  medium,
  low,
  veryLow,
}

// Audio quality presets
enum AudioQuality {
  auto,
  high,
  medium,
  low,
}

// Network optimization strategies
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

  LocalStorageService? _storage;

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

  Future<void> loadSettings([LocalStorageService? storageService]) async {
    try {
      // Initialize storage if provided
      _storage ??= storageService;
      
      // If storage is still null, return with default settings
      if (_storage == null) {
        debugPrint('⚠️ CallQualitySettings: LocalStorage not available, using default settings');
        return;
      }
      
      final videoQualityIndex = _storage!.getInt('video_quality') ?? VideoQuality.auto.index;
      if (videoQualityIndex >= 0 && videoQualityIndex < VideoQuality.values.length) {
        _videoQuality = VideoQuality.values[videoQualityIndex];
      } else {
        _videoQuality = VideoQuality.auto;
      }

      final audioQualityIndex = _storage!.getInt('audio_quality') ?? AudioQuality.auto.index;
      if (audioQualityIndex >= 0 && audioQualityIndex < AudioQuality.values.length) {
        _audioQuality = AudioQuality.values[audioQualityIndex];
      } else {
        _audioQuality = AudioQuality.auto;
      }

      final networkOptimizationIndex = _storage!.getInt('network_optimization') ?? NetworkOptimization.auto.index;
      if (networkOptimizationIndex >= 0 && networkOptimizationIndex < NetworkOptimization.values.length) {
        _networkOptimization = NetworkOptimization.values[networkOptimizationIndex];
      } else {
        _networkOptimization = NetworkOptimization.auto;
      }

      _enableEchoCancellation = _storage!.getBool('echo_cancellation') ?? true;
      _enableNoiseSuppression = _storage!.getBool('noise_suppression') ?? true;
      _enableAutoGainControl = _storage!.getBool('auto_gain_control') ?? true;
      _enableLowLatencyMode = _storage!.getBool('low_latency_mode') ?? false;
      _maxVideoBitrate = _storage!.getInt('max_video_bitrate') ?? 1500;
      _maxAudioBitrate = _storage!.getInt('max_audio_bitrate') ?? 128;
      _videoFrameRate = _storage!.getInt('video_frame_rate') ?? 30;
      _enableAdaptiveBitrate = _storage!.getBool('adaptive_bitrate') ?? true;

      notifyListeners();
    } catch (e) {
      debugPrint('Error loading call quality settings: $e');
    }
  }

  Future<void> setVideoQuality(VideoQuality quality) async {
    _videoQuality = quality;
    if (_storage != null) {
      await _storage!.saveInt('video_quality', quality.index);
    }
    _applyVideoQualityPreset(quality);
    notifyListeners();
  }

  Future<void> setAudioQuality(AudioQuality quality) async {
    _audioQuality = quality;
    if (_storage != null) {
      await _storage!.saveInt('audio_quality', quality.index);
    }
    _applyAudioQualityPreset(quality);
    notifyListeners();
  }

  Future<void> setNetworkOptimization(NetworkOptimization optimization) async {
    _networkOptimization = optimization;
    if (_storage != null) {
      await _storage!.saveInt('network_optimization', optimization.index);
    }
    _applyNetworkOptimizationPreset(optimization);
    notifyListeners();
  }

  Future<void> setEchoCancellation(bool enabled) async {
    _enableEchoCancellation = enabled;
    if (_storage != null) {
      await _storage!.saveBool('echo_cancellation', enabled);
    }
    notifyListeners();
  }

  Future<void> setNoiseSuppression(bool enabled) async {
    _enableNoiseSuppression = enabled;
    if (_storage != null) {
      await _storage!.saveBool('noise_suppression', enabled);
    }
    notifyListeners();
  }

  Future<void> setAutoGainControl(bool enabled) async {
    _enableAutoGainControl = enabled;
    if (_storage != null) {
      await _storage!.saveBool('auto_gain_control', enabled);
    }
    notifyListeners();
  }

  Future<void> setLowLatencyMode(bool enabled) async {
    _enableLowLatencyMode = enabled;
    if (_storage != null) {
      await _storage!.saveBool('low_latency_mode', enabled);
    }
    notifyListeners();
  }

  Future<void> setMaxVideoBitrate(int bitrate) async {
    _maxVideoBitrate = bitrate;
    if (_storage != null) {
      await _storage!.saveInt('max_video_bitrate', bitrate);
    }
    notifyListeners();
  }

  Future<void> setMaxAudioBitrate(int bitrate) async {
    _maxAudioBitrate = bitrate;
    if (_storage != null) {
      await _storage!.saveInt('max_audio_bitrate', bitrate);
    }
    notifyListeners();
  }

  Future<void> setVideoFrameRate(int frameRate) async {
    _videoFrameRate = frameRate;
    if (_storage != null) {
      await _storage!.saveInt('video_frame_rate', frameRate);
    }
    notifyListeners();
  }

  Future<void> setAdaptiveBitrate(bool enabled) async {
    _enableAdaptiveBitrate = enabled;
    if (_storage != null) {
      await _storage!.saveBool('adaptive_bitrate', enabled);
    }
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
        _videoFrameRate = 25;
        break;
      case VideoQuality.low:
        _maxVideoBitrate = 800;
        _videoFrameRate = 20;
        break;
      case VideoQuality.veryLow:
        _maxVideoBitrate = 400;
        _videoFrameRate = 15;
        _enableAdaptiveBitrate = false;
        break;
      case VideoQuality.auto:
        _maxVideoBitrate = 1500;
        _videoFrameRate = 30;
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
        _enableLowLatencyMode = false;
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

    if (_storage != null) {
      await _storage!.remove('video_quality');
      await _storage!.remove('audio_quality');
      await _storage!.remove('network_optimization');
      await _storage!.remove('echo_cancellation');
      await _storage!.remove('noise_suppression');
      await _storage!.remove('auto_gain_control');
      await _storage!.remove('low_latency_mode');
      await _storage!.remove('max_video_bitrate');
      await _storage!.remove('max_audio_bitrate');
      await _storage!.remove('video_frame_rate');
      await _storage!.remove('adaptive_bitrate');
    }
    
    notifyListeners();
  }

  String getVideoQualityDescription(VideoQuality quality) {
    switch (quality) {
      case VideoQuality.auto:
        return 'Automatically adjusts based on network conditions';
      case VideoQuality.high:
        return 'High quality video (2.5 Mbps, 30 fps)';
      case VideoQuality.medium:
        return 'Medium quality video (1.5 Mbps, 25 fps)';
      case VideoQuality.low:
        return 'Low quality video (800 kbps, 20 fps)';
      case VideoQuality.veryLow:
        return 'Very low quality video (400 kbps, 15 fps)';
    }
  }

  String getAudioQualityDescription(AudioQuality quality) {
    switch (quality) {
      case AudioQuality.auto:
        return 'Automatically adjusts based on network conditions';
      case AudioQuality.high:
        return 'High quality audio (256 kbps)';
      case AudioQuality.medium:
        return 'Medium quality audio (128 kbps)';
      case AudioQuality.low:
        return 'Low quality audio (64 kbps)';
    }
  }

  String getNetworkOptimizationDescription(NetworkOptimization optimization) {
    switch (optimization) {
      case NetworkOptimization.auto:
        return 'Automatically optimizes based on network conditions';
      case NetworkOptimization.optimizeForQuality:
        return 'Prioritizes audio and video quality';
      case NetworkOptimization.optimizeForBandwidth:
        return 'Balances quality and bandwidth usage';
      case NetworkOptimization.conserveBandwidth:
        return 'Minimizes bandwidth usage';
    }
  }
}