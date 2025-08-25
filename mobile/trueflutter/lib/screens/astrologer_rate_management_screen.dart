import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
// Future API integration
// import '../services/api/user_api_service.dart';
import '../services/local/local_storage_service.dart';
import '../services/service_locator.dart';

class ConsultationRate {
  final String type;
  final String displayName;
  final IconData icon;
  double currentRate;
  double? pendingRate;
  bool isEnabled;
  String description;

  ConsultationRate({
    required this.type,
    required this.displayName,
    required this.icon,
    required this.currentRate,
    this.pendingRate,
    required this.isEnabled,
    required this.description,
  });
}

class AstrologerRateManagementScreen extends StatefulWidget {
  const AstrologerRateManagementScreen({super.key});

  @override
  State<AstrologerRateManagementScreen> createState() => _AstrologerRateManagementScreenState();
}

class _AstrologerRateManagementScreenState extends State<AstrologerRateManagementScreen> {
  // API services for future use
  // late UserApiService _userApiService;
  late LocalStorageService _localStorage;

  List<ConsultationRate> _rates = [];
  bool _isLoading = true;
  bool _isUpdating = false;

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final Map<String, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    // _userApiService = getIt<UserApiService>();
    _localStorage = getIt<LocalStorageService>();
    _loadCurrentRates();
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadCurrentRates() async {
    setState(() => _isLoading = true);

    try {
      // Load current rates from API (simulated for now)
      await Future.delayed(const Duration(milliseconds: 800));
      
      _rates = [
        ConsultationRate(
          type: 'chat',
          displayName: 'Chat Consultation',
          icon: Icons.chat_bubble_outline,
          currentRate: 5.0,
          isEnabled: true,
          description: 'Text-based consultation per minute',
        ),
        ConsultationRate(
          type: 'voice_call',
          displayName: 'Voice Call',
          icon: Icons.call,
          currentRate: 8.0,
          isEnabled: true,
          description: 'Voice call consultation per minute',
        ),
        ConsultationRate(
          type: 'video_call',
          displayName: 'Video Call',
          icon: Icons.videocam,
          currentRate: 12.0,
          isEnabled: true,
          description: 'Video call consultation per minute',
        ),
      ];

      // Initialize controllers
      for (final rate in _rates) {
        _controllers[rate.type] = TextEditingController(
          text: rate.currentRate.toStringAsFixed(2),
        );
      }
    } catch (e) {
      debugPrint('Error loading rates: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to load current rates'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }

    setState(() => _isLoading = false);
  }

  Future<void> _updateRates() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isUpdating = true);

    try {
      final token = await _localStorage.getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final rateUpdates = <String, double>{};
      for (final rate in _rates) {
        final newRate = double.tryParse(_controllers[rate.type]!.text);
        if (newRate != null && newRate != rate.currentRate) {
          rateUpdates[rate.type] = newRate;
        }
      }

      if (rateUpdates.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No changes to update'),
              backgroundColor: AppColors.info,
            ),
          );
        }
        setState(() => _isUpdating = false);
        return;
      }

      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));
      
      // Update local state
      setState(() {
        for (final rate in _rates) {
          if (rateUpdates.containsKey(rate.type)) {
            rate.currentRate = rateUpdates[rate.type]!;
          }
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rates updated successfully'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      debugPrint('Error updating rates: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }

    setState(() => _isUpdating = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Rate Management'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCurrentRates,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header info
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.info.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.info.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info_outline, color: AppColors.info),
                              const SizedBox(width: 8),
                              Text(
                                'Rate Management',
                                style: AppTextStyles.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Set your consultation rates per minute. Changes will take effect immediately.',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Rate cards
                    ..._rates.map((rate) => _buildRateCard(rate)),

                    const SizedBox(height: 24),

                    // Recommendations
                    _buildRecommendationsCard(),

                    const SizedBox(height: 24),

                    // Update button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isUpdating ? null : _updateRates,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isUpdating
                            ? const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        AppColors.white,
                                      ),
                                    ),
                                  ),
                                  SizedBox(width: 12),
                                  Text('Updating Rates...'),
                                ],
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.save),
                                  SizedBox(width: 8),
                                  Text('Update Rates'),
                                ],
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Reset button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _isUpdating ? null : _resetRates,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Reset to Current Values'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildRateCard(ConsultationRate rate) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  rate.icon,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rate.displayName,
                      style: AppTextStyles.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      rate.description,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: rate.isEnabled,
                onChanged: (value) {
                  setState(() {
                    rate.isEnabled = value;
                  });
                },
                activeColor: AppColors.primary,
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Current rate and input
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Rate',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹${rate.currentRate.toStringAsFixed(2)}/min',
                      style: AppTextStyles.heading5.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'New Rate',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _controllers[rate.type],
                      enabled: rate.isEnabled,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Enter rate',
                        prefixText: '₹',
                        suffixText: '/min',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                      validator: (value) {
                        if (!rate.isEnabled) return null;
                        if (value == null || value.isEmpty) {
                          return 'Rate is required';
                        }
                        final rateValue = double.tryParse(value);
                        if (rateValue == null) {
                          return 'Invalid rate';
                        }
                        if (rateValue < 1) {
                          return 'Minimum rate is ₹1/min';
                        }
                        if (rateValue > 1000) {
                          return 'Maximum rate is ₹1000/min';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Pending rate info
          if (rate.pendingRate != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppColors.warning.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.schedule,
                    color: AppColors.warning,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Pending: ₹${rate.pendingRate!.toStringAsFixed(2)}/min',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.warning,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRecommendationsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb_outline, color: AppColors.warning),
              const SizedBox(width: 8),
              Text(
                'Pricing Recommendations',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildRecommendationItem(
            '💬',
            'Chat consultations are typically 20-40% lower than voice calls',
          ),
          _buildRecommendationItem(
            '📞',
            'Voice calls offer better connection and usually priced higher than chat',
          ),
          _buildRecommendationItem(
            '📹',
            'Video calls are premium service, price 50-80% higher than voice',
          ),
          _buildRecommendationItem(
            '⭐',
            'Higher ratings justify premium pricing - build your reputation first',
          ),
          _buildRecommendationItem(
            '📊',
            'Monitor competitor rates and adjust accordingly for better bookings',
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationItem(String emoji, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _resetRates() {
    for (final rate in _rates) {
      _controllers[rate.type]?.text = rate.currentRate.toStringAsFixed(2);
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Values reset to current rates'),
        backgroundColor: AppColors.info,
      ),
    );
  }
}