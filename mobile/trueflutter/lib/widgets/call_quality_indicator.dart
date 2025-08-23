import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/network/network_diagnostics_service.dart';

class CallQualityIndicator extends StatelessWidget {
  final CallQualityMetrics? metrics;
  final bool isCompact;
  final bool showDetails;

  const CallQualityIndicator({
    super.key,
    this.metrics,
    this.isCompact = false,
    this.showDetails = false,
  });

  @override
  Widget build(BuildContext context) {
    if (metrics == null) {
      return _buildUnknownState();
    }

    if (isCompact) {
      return _buildCompactIndicator();
    }

    return _buildDetailedIndicator();
  }

  Widget _buildUnknownState() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.help_outline,
            size: 16,
            color: Colors.grey[600],
          ),
          const SizedBox(width: 4),
          Text(
            'Unknown',
            style: AppTextStyles.bodySmall.copyWith(
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactIndicator() {
    final quality = metrics!.networkQuality;
    final color = _getQualityColor(quality);
    final icon = _getQualityIcon(quality);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            NetworkDiagnosticsService.instance.getQualityDescription(quality),
            style: AppTextStyles.bodySmall.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildDetailHeader(),
          const SizedBox(height: 12),
          _buildMetricsGrid(),
          if (showDetails) ...[
            const SizedBox(height: 12),
            _buildIssuesSection(),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailHeader() {
    final quality = metrics!.networkQuality;
    final connectionType = metrics!.connectionType;
    final color = _getQualityColor(quality);
    final icon = _getQualityIcon(quality);

    return Row(
      children: [
        Icon(
          icon,
          color: color,
          size: 20,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Call Quality: ${NetworkDiagnosticsService.instance.getQualityDescription(quality)}',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
              Text(
                NetworkDiagnosticsService.instance.getConnectionTypeDescription(connectionType),
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        _buildConnectionTypeIcon(connectionType),
      ],
    );
  }

  Widget _buildMetricsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 3,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      children: [
        if (metrics!.roundTripTime != null)
          _buildMetricItem(
            'Latency',
            '${metrics!.roundTripTime!.round()}ms',
            _getLatencyColor(metrics!.roundTripTime!),
          ),
        if (metrics!.videoFrameRate != null)
          _buildMetricItem(
            'Frame Rate',
            '${metrics!.videoFrameRate!.round()} fps',
            _getFrameRateColor(metrics!.videoFrameRate!),
          ),
        if (metrics!.bitrate != null)
          _buildMetricItem(
            'Bitrate',
            _formatBitrate(metrics!.bitrate!),
            _getBitrateColor(metrics!.bitrate!),
          ),
        if (metrics!.packetsLost != null && metrics!.packetsReceived != null)
          _buildMetricItem(
            'Packet Loss',
            _formatPacketLoss(metrics!.packetsLost!, metrics!.packetsReceived!),
            _getPacketLossColor(metrics!.packetsLost!, metrics!.packetsReceived!),
          ),
      ],
    );
  }

  Widget _buildMetricItem(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIssuesSection() {
    final issues = <String>[];
    
    if (metrics!.hasNetworkIssues) {
      issues.add('Network connectivity issues detected');
    }
    if (metrics!.hasVideoIssues) {
      issues.add('Video quality may be affected');
    }
    if (metrics!.hasAudioIssues) {
      issues.add('Audio quality may be affected');
    }

    if (issues.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.check_circle_outline,
              color: AppColors.success,
              size: 16,
            ),
            const SizedBox(width: 8),
            Text(
              'No issues detected',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.success,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Issues Detected:',
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.error,
          ),
        ),
        const SizedBox(height: 4),
        ...issues.map((issue) => Padding(
          padding: const EdgeInsets.only(left: 8, top: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.warning_outlined,
                color: AppColors.warning,
                size: 14,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  issue,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildConnectionTypeIcon(ConnectionType type) {
    IconData iconData;
    Color color;

    switch (type) {
      case ConnectionType.wifi:
        iconData = Icons.wifi;
        color = AppColors.success;
        break;
      case ConnectionType.mobile:
        iconData = Icons.signal_cellular_4_bar;
        color = AppColors.primary;
        break;
      case ConnectionType.ethernet:
        iconData = Icons.cable;
        color = AppColors.success;
        break;
      case ConnectionType.bluetooth:
        iconData = Icons.bluetooth;
        color = AppColors.info;
        break;
      case ConnectionType.vpn:
        iconData = Icons.vpn_lock;
        color = AppColors.warning;
        break;
      case ConnectionType.none:
        iconData = Icons.signal_wifi_off;
        color = AppColors.error;
        break;
      case ConnectionType.unknown:
        iconData = Icons.help_outline;
        color = AppColors.textSecondary;
        break;
    }

    return Icon(
      iconData,
      color: color,
      size: 20,
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
        return AppColors.textSecondary;
    }
  }

  IconData _getQualityIcon(NetworkQuality quality) {
    switch (quality) {
      case NetworkQuality.excellent:
        return Icons.wifi;
      case NetworkQuality.good:
        return Icons.wifi;
      case NetworkQuality.fair:
        return Icons.network_wifi_3_bar;
      case NetworkQuality.poor:
        return Icons.network_wifi_2_bar;
      case NetworkQuality.veryPoor:
        return Icons.network_wifi_1_bar;
      case NetworkQuality.unknown:
        return Icons.wifi_off;
    }
  }

  Color _getLatencyColor(double latency) {
    if (latency < 100) return AppColors.success;
    if (latency < 200) return AppColors.warning;
    return AppColors.error;
  }

  Color _getFrameRateColor(double frameRate) {
    if (frameRate >= 25) return AppColors.success;
    if (frameRate >= 15) return AppColors.warning;
    return AppColors.error;
  }

  Color _getBitrateColor(int bitrate) {
    if (bitrate >= 1000000) return AppColors.success; // 1 Mbps
    if (bitrate >= 500000) return AppColors.warning; // 500 kbps
    return AppColors.error;
  }

  Color _getPacketLossColor(int lost, int received) {
    final lossRate = lost / (received + lost);
    if (lossRate < 0.01) return AppColors.success; // Less than 1%
    if (lossRate < 0.05) return AppColors.warning; // Less than 5%
    return AppColors.error;
  }

  String _formatBitrate(int bitrate) {
    if (bitrate >= 1000000) {
      return '${(bitrate / 1000000).toStringAsFixed(1)} Mbps';
    } else {
      return '${(bitrate / 1000).round()} kbps';
    }
  }

  String _formatPacketLoss(int lost, int received) {
    final lossRate = lost / (received + lost) * 100;
    return '${lossRate.toStringAsFixed(1)}%';
  }
}