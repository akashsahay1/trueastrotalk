import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/svg.dart';
import 'package:email_validator/email_validator.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';
import '../../common/utils/error_handler.dart';
import '../../widgets/auth/identifier_input_field.dart';

class UnifiedAuthScreen extends StatefulWidget {
  const UnifiedAuthScreen({super.key});

  @override
  State<UnifiedAuthScreen> createState() => _UnifiedAuthScreenState();
}

class _UnifiedAuthScreenState extends State<UnifiedAuthScreen>
    with TickerProviderStateMixin {
  final _identifierController = TextEditingController();
  late final AuthService _authService;

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
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    ));

    _slideController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    ));

    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _shakeAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _shakeController,
      curve: Curves.elasticIn,
    ));
  }

  void _startAnimations() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _fadeController.forward();
    await Future.delayed(const Duration(milliseconds: 400));
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
      _errorText = null; // Clear error when user types
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
      // Basic phone validation - should have at least 10 digits
      final digitsOnly = _formattedIdentifier.replaceAll(RegExp(r'[^\d]'), '');
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

    // Validate input
    final error = _validateIdentifier();
    if (error != null) {
      setState(() => _errorText = error);
      _triggerErrorHaptic();
      _shakeController.forward().then((_) => _shakeController.reverse());
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Send OTP to the identifier
      final authType = _identifierType == IdentifierType.email ? 'email' : 'phone';
      final result = await _authService.sendUnifiedOTP(
        identifier: _formattedIdentifier,
        authType: authType,
      );

      if (mounted && result['success']) {
        // Navigate to OTP verification
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

  Future<void> _onGoogleSignIn() async {
    _triggerHaptic();
    setState(() => _isGoogleLoading = true);

    try {
      debugPrint('🚀 Starting Google Sign-In process...');
      final user = await _authService.signInWithGoogle();
      debugPrint('✅ Google Sign-In successful, user: ${user.email}');

      if (mounted) {
        // Navigate based on user role
        if (user.isCustomer) {
          Navigator.pushReplacementNamed(context, '/customer/home');
        } else if (user.isAstrologer) {
          Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
        } else {
          Navigator.pushReplacementNamed(context, '/home');
        }
      }
    } on GoogleSignUpRequiredException catch (googleException) {
      debugPrint('🎯 New Google user needs to complete signup');

      if (mounted) {
        // Navigate to signup completion with Google data
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
      debugPrint('🚨 Google Sign-In error: $e');

      if (mounted) {
        // Check if user cancelled
        if (e.toString().contains('USER_CANCELLED')) {
          debugPrint('🚫 User cancelled Google Sign-In');
          return;
        }

        // Handle other errors
        final appError = ErrorHandler.handleError(e, context: 'google-auth');
        ErrorHandler.logError(appError);

        if (appError.userMessage.isNotEmpty) {
          _triggerErrorHaptic();
          ErrorHandler.showError(context, appError);
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () {
            _triggerHaptic();
            Navigator.pop(context);
          },
          icon: const Icon(
            Icons.arrow_back_ios,
            color: AppColors.textPrimary,
            size: 22,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),

                // Header
                SlideTransition(
                  position: _slideAnimation,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome',
                        style: AppTextStyles.heading2.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Enter your email or phone number to continue',
                        style: AppTextStyles.bodyLarge.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 40),

                // Identifier Input
                SlideTransition(
                  position: _slideAnimation,
                  child: AnimatedBuilder(
                    animation: _shakeAnimation,
                    builder: (context, child) {
                      return Transform.translate(
                        offset: Offset(
                          _shakeAnimation.value * 10 * (1 - _shakeAnimation.value),
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
                ),

                const SizedBox(height: 32),

                // Continue Button
                SlideTransition(
                  position: _slideAnimation,
                  child: Container(
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
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      AppColors.white,
                                    ),
                                  ),
                                )
                              : Text(
                                  'Continue',
                                  style: AppTextStyles.buttonLarge.copyWith(
                                    color: AppColors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Divider
                SlideTransition(
                  position: _slideAnimation,
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 1,
                          color: AppColors.grey300,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
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
                ),

                const SizedBox(height: 24),

                // Google Sign-In Button
                SlideTransition(
                  position: _slideAnimation,
                  child: Container(
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
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _isGoogleLoading ? null : _onGoogleSignIn,
                        borderRadius: BorderRadius.circular(16),
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
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    SvgPicture.asset(
                                      'assets/images/google.svg',
                                      width: 20,
                                      height: 20,
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'Continue with Google',
                                      style: AppTextStyles.buttonLarge.copyWith(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Join as Astrologer Link
                SlideTransition(
                  position: _slideAnimation,
                  child: Container(
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
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
