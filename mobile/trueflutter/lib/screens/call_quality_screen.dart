import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../services/network/network_diagnostics_service.dart';
import '../widgets/call_quality_indicator.dart';
import 'call_quality_settings_screen.dart';

class CallQualityScreen extends StatefulWidget {
  const CallQualityScreen({super.key});

  @override
  State<CallQualityScreen> createState() => _CallQualityScreenState();
}

class _CallQualityScreenState extends State<CallQualityScreen> {
  final NetworkDiagnosticsService _networkDiagnostics = NetworkDiagnosticsService.instance;
  bool _isMonitoring = false;

  @override
  void initState() {
    super.initState();
    _networkDiagnostics.addListener(_onMetricsChanged);
  }

  @override
  void dispose() {
    _networkDiagnostics.removeListener(_onMetricsChanged);
    if (_isMonitoring) {
      _networkDiagnostics.stopMonitoring();
    }
    super.dispose();
  }

  void _onMetricsChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  void _toggleMonitoring() {
    setState(() {
      _isMonitoring = !_isMonitoring;
    });

    if (_isMonitoring) {
      _networkDiagnostics.startMonitoring(null);
    } else {
      _networkDiagnostics.stopMonitoring();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Call Quality'),
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        titleTextStyle: AppTextStyles.heading3.copyWith(
          color: AppColors.textPrimary,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CallQualitySettingsScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildMonitoringControl(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildCurrentMetrics(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildMetricsHistory(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildTroubleshooting(),
          ],
        ),
      ),
    );
  }

  Widget _buildMonitoringControl() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.monitor_heart_outlined,
                  color: AppColors.primary,
                ),
                const SizedBox(width: Dimensions.paddingSm),
                Text(
                  'Network Monitoring',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingMd),
            Text(
              'Enable real-time network diagnostics to monitor your connection quality during calls.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: Dimensions.paddingLg),
            Row(
              children: [
                Expanded(
                  child: Text(
                    _isMonitoring ? 'Monitoring Active' : 'Start Monitoring',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: _isMonitoring ? AppColors.success : AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Switch(
                  value: _isMonitoring,
                  onChanged: (value) => _toggleMonitoring(),
                  activeTrackColor: AppColors.success,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentMetrics() {
    final currentMetrics = _networkDiagnostics.currentMetrics;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.speed,
              color: AppColors.primary,
            ),
            const SizedBox(width: Dimensions.paddingSm),
            Text(
              'Current Network Quality',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: Dimensions.paddingMd),
        CallQualityIndicator(
          metrics: currentMetrics,
          isCompact: false,
          showDetails: true,
        ),
      ],
    );
  }

  Widget _buildMetricsHistory() {
    final history = _networkDiagnostics.metricsHistory;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.history,
              color: AppColors.primary,
            ),
            const SizedBox(width: Dimensions.paddingSm),
            Text(
              'Recent Activity',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: Dimensions.paddingMd),
        Card(
          child: history.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(Dimensions.paddingXl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.timeline,
                          size: 48,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: Dimensions.paddingMd),
                        Text(
                          _isMonitoring 
                              ? 'Collecting data...' 
                              : 'No data available',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (!_isMonitoring) ...[
                          const SizedBox(height: Dimensions.paddingSm),
                          Text(
                            'Start monitoring to view network history',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    _buildHistoryChart(),
                    const Divider(),
                    ...history.take(5).map((metric) => _buildHistoryItem(metric)),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _buildHistoryChart() {
    final history = _networkDiagnostics.metricsHistory;
    if (history.isEmpty) return const SizedBox.shrink();
    
    return Container(
      height: 120,
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: history.map((metric) {
          double height;
          Color color;
          
          switch (metric.networkQuality) {
            case NetworkQuality.excellent:
              height = 1.0;
              color = AppColors.success;
              break;
            case NetworkQuality.good:
              height = 0.8;
              color = Colors.lightGreen;
              break;
            case NetworkQuality.fair:
              height = 0.6;
              color = AppColors.warning;
              break;
            case NetworkQuality.poor:
              height = 0.4;
              color = Colors.orange;
              break;
            case NetworkQuality.veryPoor:
              height = 0.2;
              color = AppColors.error;
              break;
            case NetworkQuality.unknown:
              height = 0.1;
              color = Colors.grey;
              break;
          }
          
          return Expanded(
            child: Container(
              height: height * 80,
              margin: const EdgeInsets.symmetric(horizontal: 1),
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(2)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildHistoryItem(CallQualityMetrics metric) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Dimensions.paddingLg,
        vertical: Dimensions.paddingSm,
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _getQualityColor(metric.networkQuality),
            ),
          ),
          const SizedBox(width: Dimensions.paddingSm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _networkDiagnostics.getQualityDescription(metric.networkQuality),
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  _formatTimestamp(metric.timestamp),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (metric.roundTripTime != null)
            Text(
              '${metric.roundTripTime!.round()}ms',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTroubleshooting() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.help_outline,
              color: AppColors.primary,
            ),
            const SizedBox(width: Dimensions.paddingSm),
            Text(
              'Troubleshooting Tips',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: Dimensions.paddingMd),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(Dimensions.paddingLg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTroubleshootingItem(
                  Icons.wifi,
                  'Poor Connection',
                  'Try moving closer to your Wi-Fi router or switching to a different network.',
                ),
                const SizedBox(height: Dimensions.paddingMd),
                _buildTroubleshootingItem(
                  Icons.videocam_off,
                  'Video Issues',
                  'Disable video calling and use voice-only mode for better quality.',
                ),
                const SizedBox(height: Dimensions.paddingMd),
                _buildTroubleshootingItem(
                  Icons.close_fullscreen,
                  'Background Apps',
                  'Close other apps that might be using your internet connection.',
                ),
                const SizedBox(height: Dimensions.paddingMd),
                _buildTroubleshootingItem(
                  Icons.restart_alt,
                  'Restart App',
                  'Force close and restart the app if you continue experiencing issues.',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTroubleshootingItem(IconData icon, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 20,
          color: AppColors.info,
        ),
        const SizedBox(width: Dimensions.paddingSm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getQualityColor(NetworkQuality quality) {
    switch (quality) {
      case NetworkQuality.excellent:
        return AppColors.success;
      case NetworkQuality.good:
        return Colors.lightGreen;
      case NetworkQuality.fair:
        return AppColors.warning;
      case NetworkQuality.poor:
        return Colors.orange;
      case NetworkQuality.veryPoor:
        return AppColors.error;
      case NetworkQuality.unknown:
        return Colors.grey;
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}