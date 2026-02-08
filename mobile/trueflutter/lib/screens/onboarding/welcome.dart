import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/error_handler.dart';
import '../../common/utils/terms_and_policies.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final _phoneController = TextEditingController();
  late final AuthService _authService;

  bool _isLoading = false;
  bool _isGoogleLoading = false;
  String _selectedCountryCode = '+91';
  String _selectedCountryFlag = '🇮🇳';
  String? _inlineError;

  final List<Map<String, String>> _countries = [
    {'code': '+91', 'flag': '🇮🇳', 'name': 'India'},
    {'code': '+1', 'flag': '🇺🇸', 'name': 'USA'},
    {'code': '+44', 'flag': '🇬🇧', 'name': 'UK'},
    {'code': '+61', 'flag': '🇦🇺', 'name': 'Australia'},
    {'code': '+971', 'flag': '🇦🇪', 'name': 'UAE'},
    {'code': '+65', 'flag': '🇸🇬', 'name': 'Singapore'},
    {'code': '+60', 'flag': '🇲🇾', 'name': 'Malaysia'},
  ];

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _phoneController.addListener(() {
      // Clear inline error when user starts typing
      if (_inlineError != null) {
        setState(() => _inlineError = null);
      } else {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  bool get _isPhoneValid {
    final phone = _phoneController.text.trim();
    return phone.length >= 10;
  }

  void _triggerHaptic() {
    HapticFeedback.lightImpact();
  }

  Future<void> _onContinue() async {
    if (!_isPhoneValid) return;

    _triggerHaptic();
    setState(() {
      _isLoading = true;
      _inlineError = null;
    });

    try {
      final phoneNumber = _phoneController.text.trim();
      final result = await _authService.sendUnifiedOTP(
        countryCode: _selectedCountryCode,
        phoneNumber: phoneNumber,
      );

      if (mounted && result['success']) {
        Navigator.pushNamed(
          context,
          '/otp-verification',
          arguments: {
            'country_code': _selectedCountryCode,
            'phone_number': phoneNumber,
            'identifier': '$_selectedCountryCode$phoneNumber',
            'auth_type': 'phone',
            'is_new_user': result['is_new_user'] ?? false,
            'expiry_seconds': result['expiry_seconds'],
          },
        );
      } else {
        // Check if it's an admin not allowed error - show inline
        if (result['error_code'] == 'ADMIN_NOT_ALLOWED') {
          setState(() => _inlineError = result['error']);
        } else {
          _showError(result['error'] ?? 'Failed to send OTP');
        }
      }
    } catch (e) {
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'auth');
        _showError(appError.userMessage);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _onGoogleSignIn() async {
    _triggerHaptic();
    setState(() => _isGoogleLoading = true);

    try {
      final user = await _authService.signInWithGoogle();

      if (mounted) {
        if (user.isCustomer) {
          Navigator.pushReplacementNamed(context, '/home');
        } else if (user.isAstrologer) {
          if (user.isProfileComplete) {
            if (user.isActive && user.isEmailVerified) {
              Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
            } else {
              Navigator.pushReplacementNamed(context, '/astrologer/pending');
            }
          } else {
            Navigator.pushReplacementNamed(
              context,
              '/signup-completion',
              arguments: {
                'identifier': user.email ?? user.phone ?? '',
                'auth_type': 'google',
                'user_type': 'astrologer',
                'existing_user': true,
              },
            );
          }
        } else {
          // Admin or other roles not allowed on mobile app
          debugPrint('🚫 User role ${user.role} not allowed on mobile app');
          await _authService.signOut();
          _showError('This account type cannot access the mobile app');
        }
      }
    } on GoogleSignUpRequiredException catch (googleException) {
      if (mounted) {
        Navigator.pushNamed(
          context,
          '/signup-completion',
          arguments: {
            'identifier': googleException.email,
            'auth_type': 'google',
            'name': googleException.name,
            'google_access_token': googleException.accessToken,
            'google_id_token': googleException.idToken,
          },
        );
      }
    } catch (e) {
      if (mounted) {
        if (e.toString().contains('USER_CANCELLED')) return;

        final appError = ErrorHandler.handleError(e, context: 'google-auth');
        if (appError.userMessage.isNotEmpty) {
          _showError(appError.userMessage);
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
  }

  void _showCountryPicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Text(
                'Select Country',
                style: AppTextStyles.heading4.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const Divider(),
            ..._countries.map((country) => ListTile(
              leading: Text(
                country['flag']!,
                style: const TextStyle(fontSize: 24),
              ),
              title: Text(country['name']!),
              trailing: Text(
                country['code']!,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedCountryCode = country['code']!;
                  _selectedCountryFlag = country['flag']!;
                });
                Navigator.pop(context);
              },
            )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: AppColors.white,
        body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const SizedBox(height: 60),

                    // Logo
                    ClipRRect(
                      borderRadius: BorderRadius.circular(60),
                      child: Image.asset(
                        'assets/images/logo.png',
                        width: 120,
                        height: 120,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.auto_awesome,
                            size: 50,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // App name
                    Text(
                      'true Astrotalk',
                      style: AppTextStyles.heading2.copyWith(
                        fontFamily: 'Ergonomique',
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),

                    const SizedBox(height: 48),

                    // Login or sign up divider
                    Row(
                      children: [
                        Expanded(child: Divider(color: AppColors.grey300)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'Login or sign up',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: AppColors.grey300)),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Phone input row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Country selector
                        GestureDetector(
                          onTap: _showCountryPicker,
                          child: Container(
                            height: 56,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              border: Border.all(color: AppColors.grey300, width: 0.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _selectedCountryFlag,
                                  style: const TextStyle(fontSize: 22),
                                ),
                                const SizedBox(width: 4),
                                Icon(
                                  Icons.keyboard_arrow_down,
                                  color: AppColors.textSecondary,
                                  size: 20,
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(width: 12),

                        // Phone input
                        Expanded(
                          child: Container(
                            height: 56,
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              border: Border.all(color: AppColors.grey300, width: 0.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(left: 16),
                                  child: Text(
                                    _selectedCountryCode,
                                    style: AppTextStyles.bodyLarge.copyWith(
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextField(
                                    controller: _phoneController,
                                    keyboardType: TextInputType.phone,
                                    style: AppTextStyles.bodyLarge.copyWith(
                                      color: AppColors.textPrimary,
                                    ),
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly,
                                      LengthLimitingTextInputFormatter(10),
                                    ],
                                    decoration: InputDecoration(
                                      filled: true,
                                      fillColor: Colors.transparent,
                                      hintText: 'Enter Phone number',
                                      hintStyle: AppTextStyles.bodyLarge.copyWith(
                                        color: AppColors.textSecondary.withValues(alpha: 0.5),
                                      ),
                                      border: InputBorder.none,
                                      enabledBorder: InputBorder.none,
                                      focusedBorder: InputBorder.none,
                                      isDense: true,
                                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Inline error message
                    if (_inlineError != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.error.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error_outline,
                              color: AppColors.error,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _inlineError!,
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),

                    // Continue button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isPhoneValid && !_isLoading ? _onContinue : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isPhoneValid
                              ? AppColors.primary
                              : AppColors.grey200,
                          foregroundColor: _isPhoneValid
                              ? AppColors.white
                              : AppColors.textSecondary,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          disabledBackgroundColor: AppColors.grey200,
                          disabledForegroundColor: AppColors.textSecondary,
                        ),
                        child: _isLoading
                            ? SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    AppColors.white,
                                  ),
                                ),
                              )
                            : Text(
                                'Continue',
                                style: AppTextStyles.buttonLarge.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Or divider
                    Row(
                      children: [
                        Expanded(child: Divider(color: AppColors.grey300)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'or',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: AppColors.grey300)),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Google Sign In button
                    GestureDetector(
                      onTap: _isGoogleLoading ? null : _onGoogleSignIn,
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          border: Border.all(color: AppColors.grey300, width: 0.5),
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Center(
                          child: _isGoogleLoading
                              ? SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      AppColors.primary,
                                    ),
                                  ),
                                )
                              : Image.asset(
                                  'assets/images/google.png',
                                  width: 28,
                                  height: 28,
                                ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Join as Astrologer
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.gradientStart.withValues(alpha: 0.1),
                            AppColors.gradientEnd.withValues(alpha: 0.1),
                          ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          width: 1,
                        ),
                      ),
                      child: TextButton(
                        onPressed: () {
                          _triggerHaptic();
                          Navigator.pushNamed(context, '/astrologer-signup');
                        },
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.auto_awesome,
                              size: 18,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Join as Astrologer',
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Terms and Privacy
            Padding(
              padding: const EdgeInsets.all(24),
              child: GestureDetector(
                onTap: () => TermsAndPolicies.showTermsDialog(context),
                child: Text.rich(
                  TextSpan(
                    text: 'By signing up, you agree to our ',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    children: [
                      TextSpan(
                        text: 'Terms of Use',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textPrimary,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                      const TextSpan(text: '\n& '),
                      TextSpan(
                        text: 'Privacy Policy',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textPrimary,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ],
                  ),
                  textAlign: TextAlign.center,
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
