import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/validation_patterns.dart';
import '../../config/config.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class EditSessionRatesScreen extends StatefulWidget {
  const EditSessionRatesScreen({super.key});

  @override
  State<EditSessionRatesScreen> createState() => _EditSessionRatesScreenState();
}

class _EditSessionRatesScreenState extends State<EditSessionRatesScreen> {
  late final AuthService _authService;
  final _formKey = GlobalKey<FormState>();

  final _chatRateController = TextEditingController();
  final _callRateController = TextEditingController();
  final _videoRateController = TextEditingController();

  bool _isLoading = true;
  bool _isUpdating = false;
  bool _isAstrologer = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadUserData();
  }

  @override
  void dispose() {
    _chatRateController.dispose();
    _callRateController.dispose();
    _videoRateController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final user = _authService.currentUser;
      if (user != null) {
        _chatRateController.text = user.chatRate?.toString() ?? '';
        _callRateController.text = user.callRate?.toString() ?? '';
        _videoRateController.text = user.videoRate?.toString() ?? '';
        _isAstrologer = user.isAstrologer == true;
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      final updateData = <String, dynamic>{};

      if (_chatRateController.text.trim().isNotEmpty) {
        updateData['chat_rate'] = double.parse(_chatRateController.text.trim());
      }
      if (_callRateController.text.trim().isNotEmpty) {
        updateData['call_rate'] = double.parse(_callRateController.text.trim());
      }
      if (_videoRateController.text.trim().isNotEmpty) {
        updateData['video_rate'] = double.parse(_videoRateController.text.trim());
      }

      await _authService.updateUserProfile(updateData);
      await _authService.refreshCurrentUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Session rates updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      String errorMessage = 'Failed to update rates';
      final errorString = e.toString();
      final extractedMessage = ValidationPatterns.extractExceptionMessage(errorString);
      if (extractedMessage != null) {
        errorMessage = extractedMessage;
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  Widget _buildRateField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        // ignore: deprecated_member_use
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
      ],
      validator: validator,
      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
        suffixText: '₹/min',
        suffixStyle: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.textSecondaryLight,
          fontWeight: FontWeight.w500,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        filled: true,
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  String? _validateRate(String? value, String rateType) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter $rateType rate';
    }
    final rate = double.tryParse(value.trim());
    if (rate == null) {
      return 'Please enter a valid number';
    }
    if (rate < 1) {
      return 'Rate must be at least ₹1';
    }
    if (rate > 10000) {
      return 'Rate cannot exceed ₹10,000';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        title: const Text('Session Rates'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimaryLight,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Section heading
                    Text(
                      'Session Rates',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Chat Rate
                    _buildRateField(
                      controller: _chatRateController,
                      label: 'Chat Rate',
                      icon: Icons.chat_bubble_outline,
                      validator: (value) => _validateRate(value, 'chat'),
                    ),
                    const SizedBox(height: 16),

                    // Call Rate
                    _buildRateField(
                      controller: _callRateController,
                      label: 'Call Rate',
                      icon: Icons.phone_outlined,
                      validator: (value) => _validateRate(value, 'call'),
                    ),
                    const SizedBox(height: 16),

                    // Video Rate
                    _buildRateField(
                      controller: _videoRateController,
                      label: 'Video Rate',
                      icon: Icons.videocam_outlined,
                      validator: (value) => _validateRate(value, 'video'),
                    ),
                    const SizedBox(height: 32),

                    // Update Button or Contact Support
                    if (_isAstrologer)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: AppColors.primary,
                              size: 32,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'To update your account details, please contact our support team',
                              textAlign: TextAlign.center,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textPrimaryLight,
                              ),
                            ),
                            const SizedBox(height: 16),
                            InkWell(
                              onTap: () async {
                                final messenger = ScaffoldMessenger.of(context);
                                final Uri emailUri = Uri(
                                  scheme: 'mailto',
                                  path: Config.supportEmail,
                                  query: 'subject=Account Update Request',
                                );
                                final canLaunch = await canLaunchUrl(emailUri);
                                if (canLaunch) {
                                  await launchUrl(emailUri);
                                } else {
                                  if (mounted) {
                                    messenger.showSnackBar(
                                      SnackBar(
                                        content: Text('Email: ${Config.supportEmail}'),
                                        backgroundColor: AppColors.primary,
                                      ),
                                    );
                                  }
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.email_outlined,
                                      color: AppColors.white,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      Config.supportEmail,
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        color: AppColors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _isUpdating ? null : _updateProfile,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: AppColors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 2,
                          ),
                          child: _isUpdating
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                                  ),
                                )
                              : const Text(
                                  'Update',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}
