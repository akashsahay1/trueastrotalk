import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

enum NetworkQuality {
  excellent,
  good,
  fair,
  poor,
  veryPoor,
  unknown
}

enum ConnectionType {
  wifi,
  mobile,
  ethernet,
  bluetooth,
  vpn,
  none,
  unknown
}

class CallQualityMetrics {
  final double? audioLevel;
  final double? videoFrameRate;
  final int? videoWidth;
  final int? videoHeight;
  final int? bitrate;
  final int? packetsLost;
  final int? packetsReceived;
  final int? packetsSent;
  final double? roundTripTime;
  final double? jitter;
  final NetworkQuality networkQuality;
  final ConnectionType connectionType;
  final double? signalStrength;
  final DateTime timestamp;

  const CallQualityMetrics({
    this.audioLevel,
    this.videoFrameRate,
    this.videoWidth,
    this.videoHeight,
    this.bitrate,
    this.packetsLost,
    this.packetsReceived,
    this.packetsSent,
    this.roundTripTime,
    this.jitter,
    required this.networkQuality,
    required this.connectionType,
    this.signalStrength,
    required this.timestamp,
  });

  bool get hasVideoIssues {
    if (videoFrameRate != null && videoFrameRate! < 15) return true;
    if (bitrate != null && bitrate! < 500000) return true; // Less than 500 kbps
    return false;
  }

  bool get hasAudioIssues {
    if (packetsLost != null && packetsReceived != null) {
      final lossRate = packetsLost! / (packetsReceived! + packetsLost!);
      if (lossRate > 0.05) return true; // More than 5% packet loss
    }
    if (jitter != null && jitter! > 30) return true; // More than 30ms jitter
    return false;
  }

  bool get hasNetworkIssues {
    return networkQuality == NetworkQuality.poor || 
           networkQuality == NetworkQuality.veryPoor ||
           (roundTripTime != null && roundTripTime! > 300);
  }
}

class NetworkDiagnosticsService extends ChangeNotifier {
  static NetworkDiagnosticsService? _instance;
  static NetworkDiagnosticsService get instance => _instance ??= NetworkDiagnosticsService._();
  
  NetworkDiagnosticsService._();

  final Connectivity _connectivity = Connectivity();
  Timer? _metricsTimer;
  Timer? _networkCheckTimer;
  
  CallQualityMetrics? _currentMetrics;
  CallQualityMetrics? get currentMetrics => _currentMetrics;

  final List<CallQualityMetrics> _metricsHistory = [];
  List<CallQualityMetrics> get metricsHistory => List.unmodifiable(_metricsHistory);

  RTCPeerConnection? _peerConnection;
  bool _isMonitoring = false;
  
  // Network quality thresholds
  static const Map<NetworkQuality, String> _qualityDescriptions = {
    NetworkQuality.excellent: 'Excellent',
    NetworkQuality.good: 'Good',
    NetworkQuality.fair: 'Fair',
    NetworkQuality.poor: 'Poor',
    NetworkQuality.veryPoor: 'Very Poor',
    NetworkQuality.unknown: 'Unknown',
  };

  static const Map<ConnectionType, String> _connectionTypeDescriptions = {
    ConnectionType.wifi: 'Wi-Fi',
    ConnectionType.mobile: 'Mobile Data',
    ConnectionType.ethernet: 'Ethernet',
    ConnectionType.bluetooth: 'Bluetooth',
    ConnectionType.vpn: 'VPN',
    ConnectionType.none: 'No Connection',
    ConnectionType.unknown: 'Unknown',
  };

  String getQualityDescription(NetworkQuality quality) {
    return _qualityDescriptions[quality] ?? 'Unknown';
  }

  String getConnectionTypeDescription(ConnectionType type) {
    return _connectionTypeDescriptions[type] ?? 'Unknown';
  }

  Future<void> startMonitoring(RTCPeerConnection? peerConnection) async {
    if (_isMonitoring) return;
    
    _isMonitoring = true;
    _peerConnection = peerConnection;
    
    debugPrint('🔍 Network diagnostics monitoring started');
    
    // Start periodic metrics collection
    _metricsTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _collectMetrics();
    });
    
    // Start network connectivity monitoring
    _networkCheckTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _checkNetworkConnectivity();
    });
    
    // Initial metrics collection
    _collectMetrics();
  }

  void stopMonitoring() {
    if (!_isMonitoring) return;
    
    _isMonitoring = false;
    _metricsTimer?.cancel();
    _networkCheckTimer?.cancel();
    _peerConnection = null;
    
    debugPrint('🔍 Network diagnostics monitoring stopped');
  }

  Future<void> _collectMetrics() async {
    if (!_isMonitoring || _peerConnection == null) return;

    try {
      // Get WebRTC stats
      final stats = await _peerConnection!.getStats();
      final connectionType = await _getConnectionType();
      final networkQuality = await _assessNetworkQuality();
      
      double? audioLevel;
      double? videoFrameRate;
      int? videoWidth;
      int? videoHeight;
      int? bitrate;
      int? packetsLost;
      int? packetsReceived;
      int? packetsSent;
      double? roundTripTime;
      double? jitter;

      // Parse WebRTC stats
      for (final report in stats) {
        final values = report.values;
        
        switch (report.type) {
          case 'inbound-rtp':
            if (values['mediaType'] == 'video') {
              videoFrameRate = values['framesPerSecond']?.toDouble();
              videoWidth = values['frameWidth']?.toInt();
              videoHeight = values['frameHeight']?.toInt();
              bitrate = values['bytesReceived'] != null 
                  ? (values['bytesReceived'] as int) * 8 // Convert to bits
                  : null;
              packetsLost = values['packetsLost']?.toInt();
              packetsReceived = values['packetsReceived']?.toInt();
              jitter = values['jitter']?.toDouble();
            } else if (values['mediaType'] == 'audio') {
              audioLevel = values['audioLevel']?.toDouble();
              packetsLost ??= values['packetsLost']?.toInt();
              packetsReceived ??= values['packetsReceived']?.toInt();
              jitter ??= values['jitter']?.toDouble();
            }
            break;
            
          case 'outbound-rtp':
            if (values['mediaType'] == 'video' && bitrate == null) {
              bitrate = values['bytesSent'] != null 
                  ? (values['bytesSent'] as int) * 8
                  : null;
            }
            packetsSent ??= values['packetsSent']?.toInt();
            break;
            
          case 'candidate-pair':
            if (values['state'] == 'succeeded') {
              roundTripTime = values['currentRoundTripTime']?.toDouble();
            }
            break;
        }
      }

      final metrics = CallQualityMetrics(
        audioLevel: audioLevel,
        videoFrameRate: videoFrameRate,
        videoWidth: videoWidth,
        videoHeight: videoHeight,
        bitrate: bitrate,
        packetsLost: packetsLost,
        packetsReceived: packetsReceived,
        packetsSent: packetsSent,
        roundTripTime: roundTripTime,
        jitter: jitter,
        networkQuality: networkQuality,
        connectionType: connectionType,
        timestamp: DateTime.now(),
      );

      _currentMetrics = metrics;
      _metricsHistory.add(metrics);
      
      // Keep only last 30 measurements (1 minute of data)
      if (_metricsHistory.length > 30) {
        _metricsHistory.removeAt(0);
      }
      
      notifyListeners();
      
    } catch (e) {
      debugPrint('❌ Error collecting call quality metrics: $e');
    }
  }

  Future<ConnectionType> _getConnectionType() async {
    try {
      final connectivityResult = await _connectivity.checkConnectivity();
      
      switch (connectivityResult) {
        case ConnectivityResult.wifi:
          return ConnectionType.wifi;
        case ConnectivityResult.mobile:
          return ConnectionType.mobile;
        case ConnectivityResult.ethernet:
          return ConnectionType.ethernet;
        case ConnectivityResult.bluetooth:
          return ConnectionType.bluetooth;
        case ConnectivityResult.vpn:
          return ConnectionType.vpn;
        case ConnectivityResult.none:
          return ConnectionType.none;
        default:
          return ConnectionType.unknown;
      }
    } catch (e) {
      debugPrint('❌ Error getting connection type: $e');
      return ConnectionType.unknown;
    }
  }

  Future<NetworkQuality> _assessNetworkQuality() async {
    try {
      // Simple network speed test by measuring ping to Google DNS
      final stopwatch = Stopwatch()..start();
      
      try {
        await InternetAddress.lookup('8.8.8.8').timeout(
          const Duration(seconds: 5),
        );
      } catch (e) {
        return NetworkQuality.veryPoor;
      }
      
      stopwatch.stop();
      final pingMs = stopwatch.elapsedMilliseconds;
      
      // Assess quality based on ping time
      if (pingMs < 50) {
        return NetworkQuality.excellent;
      } else if (pingMs < 100) {
        return NetworkQuality.good;
      } else if (pingMs < 200) {
        return NetworkQuality.fair;
      } else if (pingMs < 500) {
        return NetworkQuality.poor;
      } else {
        return NetworkQuality.veryPoor;
      }
      
    } catch (e) {
      debugPrint('❌ Error assessing network quality: $e');
      return NetworkQuality.unknown;
    }
  }

  Future<void> _checkNetworkConnectivity() async {
    try {
      final connectionType = await _getConnectionType();
      
      if (connectionType == ConnectionType.none) {
        debugPrint('⚠️ Network connection lost');
      }
    } catch (e) {
      debugPrint('❌ Error checking network connectivity: $e');
    }
  }

  // Get average metrics over time period
  CallQualityMetrics? getAverageMetrics({Duration? period}) {
    if (_metricsHistory.isEmpty) return null;
    
    final now = DateTime.now();
    final cutoff = period != null ? now.subtract(period) : null;
    
    final relevantMetrics = cutoff != null
        ? _metricsHistory.where((m) => m.timestamp.isAfter(cutoff)).toList()
        : _metricsHistory;
        
    if (relevantMetrics.isEmpty) return null;
    
    // Calculate averages
    double? avgAudioLevel;
    double? avgVideoFrameRate;
    double? avgBitrate;
    double? avgRoundTripTime;
    double? avgJitter;
    int totalPacketsLost = 0;
    int totalPacketsReceived = 0;
    
    int audioLevelCount = 0;
    int videoFrameRateCount = 0;
    int bitrateCount = 0;
    int roundTripTimeCount = 0;
    int jitterCount = 0;
    
    for (final metric in relevantMetrics) {
      if (metric.audioLevel != null) {
        avgAudioLevel = (avgAudioLevel ?? 0) + metric.audioLevel!;
        audioLevelCount++;
      }
      if (metric.videoFrameRate != null) {
        avgVideoFrameRate = (avgVideoFrameRate ?? 0) + metric.videoFrameRate!;
        videoFrameRateCount++;
      }
      if (metric.bitrate != null) {
        avgBitrate = (avgBitrate ?? 0) + metric.bitrate!.toDouble();
        bitrateCount++;
      }
      if (metric.roundTripTime != null) {
        avgRoundTripTime = (avgRoundTripTime ?? 0) + metric.roundTripTime!;
        roundTripTimeCount++;
      }
      if (metric.jitter != null) {
        avgJitter = (avgJitter ?? 0) + metric.jitter!;
        jitterCount++;
      }
      totalPacketsLost += metric.packetsLost ?? 0;
      totalPacketsReceived += metric.packetsReceived ?? 0;
    }
    
    return CallQualityMetrics(
      audioLevel: audioLevelCount > 0 ? avgAudioLevel! / audioLevelCount : null,
      videoFrameRate: videoFrameRateCount > 0 ? avgVideoFrameRate! / videoFrameRateCount : null,
      bitrate: bitrateCount > 0 ? (avgBitrate! / bitrateCount).round() : null,
      packetsLost: totalPacketsLost,
      packetsReceived: totalPacketsReceived,
      roundTripTime: roundTripTimeCount > 0 ? avgRoundTripTime! / roundTripTimeCount : null,
      jitter: jitterCount > 0 ? avgJitter! / jitterCount : null,
      networkQuality: relevantMetrics.last.networkQuality,
      connectionType: relevantMetrics.last.connectionType,
      timestamp: DateTime.now(),
    );
  }

  @override
  void dispose() {
    stopMonitoring();
    _metricsHistory.clear();
    super.dispose();
  }
}