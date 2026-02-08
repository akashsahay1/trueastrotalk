import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/validation_patterns.dart';
import '../../config/config.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class EditPersonalInfoScreen extends StatefulWidget {
  const EditPersonalInfoScreen({super.key});

  @override
  State<EditPersonalInfoScreen> createState() => _EditPersonalInfoScreenState();
}

class _EditPersonalInfoScreenState extends State<EditPersonalInfoScreen> {
  late final AuthService _authService;
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  bool _isLoading = true;
  bool _isUpdating = false;
  bool _isAstrologer = false;
  bool _isAdminVerified = false;  // Admin has approved the profile
  String _originalEmail = '';  // Track original email to detect changes
  bool _isEmailVerified = false;
  bool _isPhoneVerified = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadUserData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final user = _authService.currentUser;
      if (user != null) {
        _nameController.text = user.name;
        _emailController.text = user.email ?? '';
        _originalEmail = user.email ?? '';  // Store original for comparison
        // Strip +91 prefix for display (field expects 10 digits only)
        _phoneController.text = (user.phone ?? '').replaceAll(RegExp(r'^\+?91'), '');
        _isAstrologer = user.isAstrologer == true;
        _isAdminVerified = user.isAdminVerified;  // Admin has approved
        _isEmailVerified = user.isEmailOtpVerified;
        _isPhoneVerified = user.isPhoneOtpVerified;
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  /// Check if profile is locked (astrologer approved by admin)
  /// Profile is editable while pending admin approval
  bool get _isProfileLocked {
    // Only lock profile after admin has approved
    return _isAstrologer && _isAdminVerified;
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      final messenger = ScaffoldMessenger.of(context);
      final navigator = Navigator.of(context);

      // Check if email needs verification (new or changed email)
      final currentEmail = _emailController.text.trim();
      final emailChanged = currentEmail.isNotEmpty &&
          currentEmail.toLowerCase() != _originalEmail.toLowerCase();

      if (emailChanged) {
        // Email was added or changed - need to verify via OTP
        final result = await _authService.sendUnifiedOTP(
          identifier: currentEmail,
          authType: 'email',
        );

        if (!result['success']) {
          _showSnackBar(result['error'] ?? 'Failed to send OTP', isError: true);
          return;
        }

        _showSnackBar('OTP sent to $currentEmail', isError: false);

        if (!mounted) return;

        // Navigate to OTP verification screen
        final verified = await Navigator.pushNamed(
          context,
          '/otp-verification',
          arguments: {
            'purpose': 'email_verification',
            'identifier': currentEmail,
            'auth_type': 'email',
            'otp_sent_to': currentEmail,
            'full_name': _nameController.text.trim(),
          },
        );

        // If verification failed or cancelled, don't proceed
        if (verified != true) {
          if (mounted) {
            _showSnackBar('Email verification cancelled', isError: true);
          }
          return;
        }
      }

      // Now update the profile (email is verified if it was changed)
      final updateData = <String, dynamic>{
        'full_name': _nameController.text.trim(),
      };

      // Only include email if it hasn't changed (already saved during verification)
      // or if it's the same as before
      if (!emailChanged && currentEmail.isNotEmpty) {
        updateData['email_address'] = currentEmail;
      }

      if (_phoneController.text.trim().isNotEmpty) {
        updateData['phone_number'] = _phoneController.text.trim();
      }

      await _authService.updateUserProfile(updateData);
      await _authService.refreshCurrentUser();

      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(emailChanged
              ? 'Email verified and profile updated successfully!'
              : 'Personal information updated successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
      navigator.pop(true); // Return true to indicate success
    } catch (e) {
      final messenger = ScaffoldMessenger.of(context);
      String errorMessage = 'Failed to update profile';
      final errorString = e.toString();
      final extractedMessage = ValidationPatterns.extractExceptionMessage(errorString);
      if (extractedMessage != null) {
        errorMessage = extractedMessage;
      }

      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool enabled = true,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
    String? prefixText,
    bool isVerified = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      enabled: enabled,
      validator: validator,
      inputFormatters: inputFormatters,
      style: AppTextStyles.bodyMedium.copyWith(
        color: enabled ? AppColors.textPrimaryLight : AppColors.textSecondaryLight,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
        prefixText: prefixText,
        prefixStyle: AppTextStyles.bodyMedium.copyWith(
          color: enabled ? AppColors.textPrimaryLight : AppColors.textSecondaryLight,
        ),
        suffixIcon: isVerified
            ? Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    color: AppColors.white,
                    size: 14,
                  ),
                ),
              )
            : null,
        suffixIconConstraints: isVerified
            ? const BoxConstraints(minWidth: 36, minHeight: 36)
            : null,
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
        fillColor: enabled ? AppColors.white : AppColors.grey50,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  Widget _buildContactSupportSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(
            Icons.verified_user,
            color: AppColors.success,
            size: 32,
          ),
          const SizedBox(height: 12),
          Text(
            'Your profile is verified',
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textPrimaryLight,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'To update your account details, please contact our support team',
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondaryLight,
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
                if (!mounted) return;
                messenger.showSnackBar(
                  SnackBar(
                    content: Text('Email: ${Config.supportEmail}'),
                    backgroundColor: AppColors.primary,
                  ),
                );
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
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        title: const Text('Personal Information'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimaryLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
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
                      'Personal Information',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Full Name (read-only if profile is locked)
                    _buildTextField(
                      controller: _nameController,
                      label: 'Full Name',
                      icon: Icons.person_outline,
                      enabled: !_isProfileLocked,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter your name';
                        }
                        if (value.trim().length < 2) {
                          return 'Name must be at least 2 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Email Address (editable while pending admin approval)
                    _buildTextField(
                      controller: _emailController,
                      label: 'Email Address',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      enabled: !_isProfileLocked,  // Editable until admin approves
                      // Show verified only if email exists, is verified, and hasn't been changed
                      isVerified: _isEmailVerified &&
                          _originalEmail.isNotEmpty &&
                          _emailController.text.trim().toLowerCase() == _originalEmail.toLowerCase(),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter your email';
                        }
                        if (!ValidationPatterns.isValidEmailSimple(value.trim())) {
                          return 'Please enter a valid email address';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Phone Number (read-only for astrologers, phone is their login)
                    _buildTextField(
                      controller: _phoneController,
                      label: 'Phone Number',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      enabled: !_isAstrologer,
                      prefixText: '+91 ',
                      // Show verified if phone exists and is verified
                      isVerified: _isPhoneVerified && _phoneController.text.trim().isNotEmpty,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      validator: (value) {
                        if (value != null && value.trim().isNotEmpty) {
                          if (value.trim().length != 10) {
                            return 'Phone number must be 10 digits';
                          }
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 32),

                    // Action section based on user type and status
                    if (_isProfileLocked)
                      // Admin approved - profile is read-only
                      _buildContactSupportSection()
                    else
                      // Profile can be updated
                      Column(
                        children: [
                          // Show info for astrologers pending approval
                          if (_isAstrologer && !_isAdminVerified)
                            Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.info.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: AppColors.info.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.info_outline,
                                    size: 20,
                                    color: AppColors.info,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'You can update your details while waiting for approval',
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.textPrimaryLight,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          SizedBox(
                            height: 52,
                            width: double.infinity,
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
                  ],
                ),
              ),
            ),
    );
  }
}
