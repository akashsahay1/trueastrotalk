import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../services/call/call_quality_settings_service.dart';

class CallQualitySettingsScreen extends StatefulWidget {
  const CallQualitySettingsScreen({super.key});

  @override
  State<CallQualitySettingsScreen> createState() => _CallQualitySettingsScreenState();
}

class _CallQualitySettingsScreenState extends State<CallQualitySettingsScreen> {
  final CallQualitySettings _settings = CallQualitySettings.instance;

  @override
  void initState() {
    super.initState();
    _settings.addListener(_onSettingsChanged);
    _loadSettings();
  }

  @override
  void dispose() {
    _settings.removeListener(_onSettingsChanged);
    super.dispose();
  }

  void _onSettingsChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _loadSettings() async {
    await _settings.loadSettings();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Call Quality Settings'),
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        titleTextStyle: AppTextStyles.heading3.copyWith(
          color: AppColors.textPrimary,
        ),
        actions: [
          TextButton(
            onPressed: _resetToDefaults,
            child: Text(
              'Reset',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildVideoQualitySection(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildAudioQualitySection(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildNetworkOptimizationSection(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildAudioEnhancementsSection(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildAdvancedSection(),
            const SizedBox(height: Dimensions.paddingXl),
            _buildHelpSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoQualitySection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.videocam,
                  color: AppColors.primary,
                ),
                const SizedBox(width: Dimensions.paddingSm),
                Text(
                  'Video Quality',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingMd),
            ...VideoQuality.values.map((quality) => _buildQualityOption(
              quality.name.toUpperCase(),
              _settings.getVideoQualityDescription(quality),
              _settings.videoQuality == quality,
              () => _settings.setVideoQuality(quality),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildAudioQualitySection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.mic,
                  color: AppColors.primary,
                ),
                const SizedBox(width: Dimensions.paddingSm),
                Text(
                  'Audio Quality',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingMd),
            ...AudioQuality.values.map((quality) => _buildQualityOption(
              quality.name.toUpperCase(),
              _settings.getAudioQualityDescription(quality),
              _settings.audioQuality == quality,
              () => _settings.setAudioQuality(quality),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildNetworkOptimizationSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.network_check,
                  color: AppColors.primary,
                ),
                const SizedBox(width: Dimensions.paddingSm),
                Text(
                  'Network Optimization',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingMd),
            ...NetworkOptimization.values.map((optimization) => _buildQualityOption(
              optimization.name.toUpperCase().replaceAll('_', ' '),
              _settings.getNetworkOptimizationDescription(optimization),
              _settings.networkOptimization == optimization,
              () => _settings.setNetworkOptimization(optimization),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildAudioEnhancementsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.tune,
                  color: AppColors.primary,
                ),
                const SizedBox(width: Dimensions.paddingSm),
                Text(
                  'Audio Enhancements',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildSwitchOption(
              'Echo Cancellation',
              'Reduces echo and feedback during calls',
              Icons.volume_off,
              _settings.enableEchoCancellation,
              _settings.setEchoCancellation,
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildSwitchOption(
              'Noise Suppression',
              'Filters out background noise',
              Icons.noise_control_off,
              _settings.enableNoiseSuppression,
              _settings.setNoiseSuppression,
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildSwitchOption(
              'Auto Gain Control',
              'Automatically adjusts microphone volume',
              Icons.mic_none,
              _settings.enableAutoGainControl,
              _settings.setAutoGainControl,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdvancedSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.settings,
                  color: AppColors.primary,
                ),
                const SizedBox(width: Dimensions.paddingSm),
                Text(
                  'Advanced Settings',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildSwitchOption(
              'Low Latency Mode',
              'Reduces delay but may affect quality',
              Icons.speed,
              _settings.enableLowLatencyMode,
              _settings.setLowLatencyMode,
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildSwitchOption(
              'Adaptive Bitrate',
              'Automatically adjusts quality based on network',
              Icons.auto_fix_high,
              _settings.enableAdaptiveBitrate,
              _settings.setAdaptiveBitrate,
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildSliderOption(
              'Max Video Bitrate',
              '${_settings.maxVideoBitrate} kbps',
              Icons.video_settings,
              _settings.maxVideoBitrate.toDouble(),
              500,
              3000,
              (value) => _settings.setMaxVideoBitrate(value.round()),
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildSliderOption(
              'Video Frame Rate',
              '${_settings.videoFrameRate} fps',
              Icons.camera,
              _settings.videoFrameRate.toDouble(),
              15,
              60,
              (value) => _settings.setVideoFrameRate(value.round()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHelpSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
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
                  'Quality Guide',
                  style: AppTextStyles.heading4.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildHelpItem(
              Icons.wifi,
              'Auto Settings',
              'Best for most users. Automatically adjusts based on your network connection.',
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildHelpItem(
              Icons.high_quality,
              'High Quality',
              'Use when you have a strong, stable internet connection.',
            ),
            const SizedBox(height: Dimensions.paddingMd),
            _buildHelpItem(
              Icons.data_saver_on,
              'Data Saving',
              'Choose lower quality or audio-only calls to conserve mobile data.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQualityOption(
    String title,
    String description,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingSm),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              size: 20,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
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
        ),
      ),
    );
  }

  Widget _buildSwitchOption(
    String title,
    String description,
    IconData icon,
    bool value,
    Function(bool) onChanged,
  ) {
    return Row(
      children: [
        Icon(
          icon,
          color: AppColors.textSecondary,
          size: 20,
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
              Text(
                description,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeTrackColor: AppColors.primary,
        ),
      ],
    );
  }

  Widget _buildSliderOption(
    String title,
    String value,
    IconData icon,
    double currentValue,
    double min,
    double max,
    Function(double) onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              icon,
              color: AppColors.textSecondary,
              size: 20,
            ),
            const SizedBox(width: Dimensions.paddingSm),
            Expanded(
              child: Text(
                title,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Text(
              value,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: Dimensions.paddingSm),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: AppColors.primary,
            inactiveTrackColor: AppColors.primary.withValues(alpha: 0.3),
            thumbColor: AppColors.primary,
            overlayColor: AppColors.primary.withValues(alpha: 0.2),
          ),
          child: Slider(
            value: currentValue,
            min: min,
            max: max,
            divisions: ((max - min) / 50).round(),
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }

  Widget _buildHelpItem(IconData icon, String title, String description) {
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

  Future<void> _resetToDefaults() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Settings'),
        content: const Text(
          'This will reset all call quality settings to their default values. Are you sure?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (result == true) {
      await _settings.resetToDefaults();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Settings reset to defaults'),
          ),
        );
      }
    }
  }
}