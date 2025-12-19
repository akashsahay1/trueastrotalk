import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/validation_patterns.dart';
import '../../common/widgets/google_places_address_field.dart';
import '../../config/config.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class EditAddressScreen extends StatefulWidget {
  const EditAddressScreen({super.key});

  @override
  State<EditAddressScreen> createState() => _EditAddressScreenState();
}

class _EditAddressScreenState extends State<EditAddressScreen> {
  late final AuthService _authService;
  final _formKey = GlobalKey<FormState>();

  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _countryController = TextEditingController();
  final _zipController = TextEditingController();

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
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final user = _authService.currentUser;
      if (user != null) {
        _addressController.text = user.address ?? '';
        _cityController.text = user.city ?? '';
        _stateController.text = user.state ?? '';
        _countryController.text = user.country ?? '';
        _zipController.text = user.zip ?? '';
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

      if (_addressController.text.trim().isNotEmpty) {
        updateData['address'] = _addressController.text.trim();
      }
      if (_cityController.text.trim().isNotEmpty) {
        updateData['city'] = _cityController.text.trim();
      }
      if (_stateController.text.trim().isNotEmpty) {
        updateData['state'] = _stateController.text.trim();
      }
      if (_countryController.text.trim().isNotEmpty) {
        updateData['country'] = _countryController.text.trim();
      }
      if (_zipController.text.trim().isNotEmpty) {
        updateData['zip'] = _zipController.text.trim();
      }

      await _authService.updateUserProfile(updateData);
      await _authService.refreshCurrentUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Address updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      String errorMessage = 'Failed to update address';
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        title: const Text('Address'),
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
                      'Address',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Address field with Google Places autocomplete
                    GooglePlacesAddressField(
                      addressController: _addressController,
                      cityController: _cityController,
                      stateController: _stateController,
                      countryController: _countryController,
                      zipController: _zipController,
                      label: 'Address',
                      hint: 'Start typing your address...',
                      maxLines: 1,
                      validator: (value) {
                        if (_isAstrologer && (value?.trim().isEmpty ?? true)) {
                          return 'Address is required for astrologers';
                        }
                        return null;
                      },
                      restrictToCountry: true,
                      countryCode: 'in',
                    ),
                    const SizedBox(height: 16),

                    // City and State in one row
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _cityController,
                            label: 'City',
                            icon: Icons.location_city_outlined,
                            validator: (value) {
                              if (_isAstrologer && (value?.trim().isEmpty ?? true)) {
                                return 'City is required';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            controller: _stateController,
                            label: 'State',
                            icon: Icons.map_outlined,
                            validator: (value) {
                              if (_isAstrologer && (value?.trim().isEmpty ?? true)) {
                                return 'State is required';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Country and ZIP in one row
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _countryController,
                            label: 'Country',
                            icon: Icons.public_outlined,
                            validator: (value) {
                              if (_isAstrologer && (value?.trim().isEmpty ?? true)) {
                                return 'Country is required';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            controller: _zipController,
                            label: 'ZIP/Postal Code',
                            icon: Icons.pin_drop_outlined,
                            keyboardType: TextInputType.text,
                            validator: (value) {
                              if (_isAstrologer && (value?.trim().isEmpty ?? true)) {
                                return 'ZIP code is required';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
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
                                final Uri emailUri = Uri(
                                  scheme: 'mailto',
                                  path: Config.supportEmail,
                                  query: 'subject=Account Update Request',
                                );
                                if (await canLaunchUrl(emailUri)) {
                                  await launchUrl(emailUri);
                                } else {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
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
