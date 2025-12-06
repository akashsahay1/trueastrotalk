import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/svg.dart';
import 'package:email_validator/email_validator.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/utils/error_handler.dart';
import '../common/utils/terms_and_policies.dart';
import '../common/utils/validation_patterns.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';
import '../widgets/auth/identifier_input_field.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with TickerProviderStateMixin {
  late final AuthService _authService;
  final _identifierController = TextEditingController();

  // Animation controllers
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late AnimationController _shakeController;

  // Animations
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _shakeAnimation;

  bool _isLoading = false;
  bool _isGoogleLoading = false;
  IdentifierType _identifierType = IdentifierType.unknown;
  String _formattedIdentifier = '';
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _initializeAnimations();
    _startAnimations();
  }

  void _initializeAnimations() {
    // Fade animation for logo and text
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _fadeController, curve: Curves.easeOut));

    // Slide animation for buttons
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
        );

    // Shake animation for error feedback
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _shakeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticIn),
    );
  }

  void _startAnimations() async {
    await Future.delayed(const Duration(milliseconds: 300));
    _fadeController.forward();
    await Future.delayed(const Duration(milliseconds: 600));
    _slideController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _shakeController.dispose();
    _identifierController.dispose();
    super.dispose();
  }

  void _triggerHaptic() {
    HapticFeedback.lightImpact();
  }

  void _triggerErrorHaptic() {
    HapticFeedback.heavyImpact();
  }

  void _onIdentifierChanged(IdentifierType type, String value) {
    setState(() {
      _identifierType = type;
      _formattedIdentifier = value;
      _errorText = null;
    });
  }

  String? _validateIdentifier() {
    final text = _identifierController.text.trim();

    if (text.isEmpty) {
      return 'Please enter your email or phone number';
    }

    if (_identifierType == IdentifierType.email) {
      if (!EmailValidator.validate(text)) {
        return 'Please enter a valid email address';
      }
    } else if (_identifierType == IdentifierType.phone) {
      final digitsOnly = ValidationPatterns.removeNonDigits(
        _formattedIdentifier,
      );
      if (digitsOnly.length < 10) {
        return 'Please enter a valid phone number';
      }
    } else {
      return 'Please enter a valid email or phone number';
    }

    return null;
  }

  Future<void> _onContinue() async {
    _triggerHaptic();

    final error = _validateIdentifier();
    if (error != null) {
      setState(() => _errorText = error);
      _triggerErrorHaptic();
      _shakeController.forward().then((_) => _shakeController.reverse());
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authType = _identifierType == IdentifierType.email
          ? 'email'
          : 'phone';
      final result = await _authService.sendUnifiedOTP(
        identifier: _formattedIdentifier,
        authType: authType,
      );

      if (mounted && result['success']) {
        Navigator.pushNamed(
          context,
          '/otp-verification',
          arguments: {
            'identifier': _formattedIdentifier,
            'auth_type': authType,
            'otp_sent_to': result['otp_sent_to'],
            'expiry_seconds': result['expiry_seconds'],
          },
        );
      } else {
        setState(() => _errorText = result['error'] ?? 'Failed to send OTP');
        _triggerErrorHaptic();
        _shakeController.forward().then((_) => _shakeController.reverse());
      }
    } catch (e) {
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'auth');
        setState(() => _errorText = appError.userMessage);
        _triggerErrorHaptic();
        _shakeController.forward().then((_) => _shakeController.reverse());
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    _triggerHaptic();
    setState(() => _isGoogleLoading = true);

    try {
      final user = await _authService.signInWithGoogle();

      if (mounted) {
        // Navigate based on user role and profile completion
        if (user.isCustomer) {
          Navigator.pushReplacementNamed(context, '/customer/home');
        } else if (user.isAstrologer) {
          // Check if astrologer profile is complete
          if (user.isProfileComplete) {
            // Profile complete - go to dashboard or pending based on verification
            if (user.isActive && user.isEmailVerified) {
              Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
            } else {
              Navigator.pushReplacementNamed(context, '/astrologer/pending');
            }
          } else {
            // Profile incomplete - go to profile completion
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
        }
      }
    } on GoogleSignUpRequiredException catch (googleException) {
      if (mounted) {
        // Navigate to signup completion screen with Google data
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
        // Check if user cancelled Google Sign-In - silently ignore
        if (e.toString().contains('USER_CANCELLED')) {
          debugPrint(
            '🚫 User cancelled Google Sign-In - no error message shown',
          );
          return;
        }

        String errorMessage = e.toString().replaceAll('Exception: ', '');
        _showErrorSnackBar(errorMessage);
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: Container(
        height: double.infinity,
        width: double.infinity,
        decoration: const BoxDecoration(
          image: DecorationImage(
            fit: BoxFit.cover,
            image: AssetImage("assets/images/loginbg.png"),
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight:
                      MediaQuery.of(context).size.height -
                      MediaQuery.of(context).padding.top -
                      MediaQuery.of(context).padding.bottom,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top section with logo and text
                      FadeTransition(
                        opacity: _fadeAnimation,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 160),

                            // App Logo
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(40),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(40),
                                child: Image.asset(
                                  'assets/images/logo.png',
                                  width: 50,
                                  height: 50,
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),

                            const SizedBox(height: 24),

                            // App Name
                            Text(
                              'Login to true Astrotalk',
                              style: AppTextStyles.heading1.copyWith(
                                fontFamily: 'Ergonomique',
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -0.5,
                              ),
                            ),

                            const SizedBox(height: 8),

                            // Tagline
                            SizedBox(
                              width: double.infinity,
                              child: Text(
                                'Connect with expert astrologers for personalized guidance',
                                textAlign: TextAlign.left,
                                style: AppTextStyles.heading4.copyWith(
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.normal,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Action Buttons (right below tagline)
                      SlideTransition(
                        position: _slideAnimation,
                        child: FadeTransition(
                          opacity: _fadeAnimation,
                          child: Column(
                            children: [
                              // Email/Phone Input Field
                              AnimatedBuilder(
                                animation: _shakeAnimation,
                                builder: (context, child) {
                                  return Transform.translate(
                                    offset: Offset(
                                      _shakeAnimation.value *
                                          10 *
                                          (1 - _shakeAnimation.value),
                                      0,
                                    ),
                                    child: IdentifierInputField(
                                      controller: _identifierController,
                                      onChanged: _onIdentifierChanged,
                                      errorText: _errorText,
                                      enabled: !_isLoading,
                                    ),
                                  );
                                },
                              ),

                              const SizedBox(height: 24),

                              // Continue Button
                              Container(
                                width: double.infinity,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: _isLoading ? null : _onContinue,
                                    borderRadius: BorderRadius.circular(16),
                                    child: Center(
                                      child: _isLoading
                                          ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                      Color
                                                    >(AppColors.white),
                                              ),
                                            )
                                          : Text(
                                              'Continue',
                                              style: AppTextStyles.buttonLarge
                                                  .copyWith(
                                                    color: AppColors.white,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                            ),
                                    ),
                                  ),
                                ),
                              ),

                              const SizedBox(height: 20),

                              // OR Divider
                              Row(
                                children: [
                                  Expanded(
                                    child: Container(
                                      height: 1,
                                      color: AppColors.grey300,
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                    ),
                                    child: Text(
                                      'OR',
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.textSecondary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: Container(
                                      height: 1,
                                      color: AppColors.grey300,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 16),

                              // Google Sign-In Button (Secondary)
                              Container(
                                width: double.infinity,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: AppColors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: AppColors.grey300,
                                    width: 1,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.06,
                                      ),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: _isGoogleLoading
                                        ? null
                                        : _handleGoogleSignIn,
                                    borderRadius: BorderRadius.circular(16),
                                    child: Center(
                                      child: _isGoogleLoading
                                          ? SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                      Color
                                                    >(AppColors.primary),
                                              ),
                                            )
                                          : Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                SvgPicture.asset(
                                                  'assets/images/google.svg',
                                                  width: 20,
                                                  height: 20,
                                                ),
                                                const SizedBox(width: 12),
                                                Text(
                                                  'Continue with Google',
                                                  style: AppTextStyles
                                                      .buttonLarge
                                                      .copyWith(
                                                        color: AppColors
                                                            .textPrimary,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                ),
                                              ],
                                            ),
                                    ),
                                  ),
                                ),
                              ),

                              const SizedBox(height: 20),

                              // Terms and Privacy Policy
                              Text.rich(
                                TextSpan(
                                  text: 'By proceeding I agree to ',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.textSecondary,
                                    height: 1.5,
                                  ),
                                  children: [
                                    WidgetSpan(
                                      child: GestureDetector(
                                        onTap: () => TermsAndPolicies.showTermsDialog(context),
                                        child: Text(
                                          'Terms & Conditions',
                                          style: AppTextStyles.bodySmall
                                              .copyWith(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.w600,
                                                height: 1.5,
                                              ),
                                        ),
                                      ),
                                    ),
                                    TextSpan(
                                      text: ' and ',
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.textSecondary,
                                        height: 1.5,
                                      ),
                                    ),
                                    WidgetSpan(
                                      child: GestureDetector(
                                        onTap: () => TermsAndPolicies.showPrivacyDialog(context),
                                        child: Text(
                                          'Privacy Policy',
                                          style: AppTextStyles.bodySmall
                                              .copyWith(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.w600,
                                                height: 1.5,
                                              ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Spacer to push Join as Astrologer to bottom
                      const Spacer(),

                      // Astrologer Signup Link (at bottom)
                      SlideTransition(
                        position: _slideAnimation,
                        child: FadeTransition(
                          opacity: _fadeAnimation,
                          child: Column(
                            children: [
                              Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.gradientStart.withValues(
                                        alpha: 0.1,
                                      ),
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
                                    Navigator.pushNamed(
                                      context,
                                      '/astrologer-signup',
                                    );
                                  },
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                    backgroundColor: Colors.transparent,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    mainAxisSize: MainAxisSize.min,
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
                              const SizedBox(height: 16),
                              // Sign Up Link
                              GestureDetector(
                                onTap: () {
                                  _triggerHaptic();
                                  Navigator.pushNamed(context, '/auth');
                                },
                                child: RichText(
                                  text: TextSpan(
                                    text: "Don't have an account? ",
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                                    children: [
                                      TextSpan(
                                        text: 'Sign Up',
                                        style: AppTextStyles.bodyMedium.copyWith(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 32),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
