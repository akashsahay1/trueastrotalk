import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/svg.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with TickerProviderStateMixin {
  late final AuthService _authService;

  // Animation controllers
  late AnimationController _fadeController;
  late AnimationController _slideController;

  // Animations
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  bool _isGoogleLoading = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _initializeAnimations();
    _startAnimations();
  }

  void _initializeAnimations() {
    // Fade animation for logo and text
    _fadeController = AnimationController(duration: const Duration(milliseconds: 1200), vsync: this);
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _fadeController, curve: Curves.easeOut));

    // Slide animation for buttons
    _slideController = AnimationController(duration: const Duration(milliseconds: 800), vsync: this);
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic));
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
    super.dispose();
  }

  void _triggerHaptic() {
    HapticFeedback.lightImpact();
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
        Navigator.pushNamed(context, '/signup-completion', arguments: {
          'identifier': googleException.email,
          'auth_type': 'google',
          'name': googleException.name,
          'google_access_token': googleException.accessToken,
          'google_id_token': googleException.idToken,
        });
      }
    } catch (e) {
      if (mounted) {
        // Check if user cancelled Google Sign-In - silently ignore
        if (e.toString().contains('USER_CANCELLED')) {
          debugPrint('🚫 User cancelled Google Sign-In - no error message shown');
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
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: MediaQuery.of(context).size.height - MediaQuery.of(context).padding.top - MediaQuery.of(context).padding.bottom,
              ),
              child: IntrinsicHeight(
                child: Column(
                  children: [
                    Expanded(
                      flex: 3,
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // App Logo with subtle animation
                            Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(70),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(70),
                                child: Image.asset('assets/images/logo.png', width: 50, height: 50, fit: BoxFit.contain),
                              ),
                            ),

                      const SizedBox(height: 32),

                      // App Name
                      Text(
                        'True Astrotalk',
                        style: AppTextStyles.heading2.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                      ),

                      const SizedBox(height: 8),

                      // Tagline
                      Text(
                        'Connect with expert astrologers\nfor personalized guidance',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondary, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ),

              // Action Buttons
              Expanded(
                flex: 2,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        // Get Started Button (Primary CTA)
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
                              onTap: () {
                                _triggerHaptic();
                                Navigator.pushNamed(context, '/auth');
                              },
                              borderRadius: BorderRadius.circular(16),
                              child: Center(
                                child: Text(
                                  'Get Started',
                                  style: AppTextStyles.buttonLarge.copyWith(
                                    color: AppColors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

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
                                color: Colors.black.withValues(alpha: 0.06),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: _isGoogleLoading ? null : _handleGoogleSignIn,
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

                        const SizedBox(height: 24),

                        // Login and Join as Astrologer Links
                        Column(
                          children: [
                            // Login Link
                            SizedBox(
                              width: double.infinity,
                              child: TextButton(
                                onPressed: () {
                                  _triggerHaptic();
                                  Navigator.pushNamed(context, '/auth');
                                },
                                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
                                child: Text(
                                  'Already have an account? Sign In',
                                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),

                            const SizedBox(height: 8),

                            // Astrologer Signup Link
                            Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(colors: [AppColors.gradientStart.withValues(alpha: 0.1), AppColors.gradientEnd.withValues(alpha: 0.1)], begin: Alignment.centerLeft, end: Alignment.centerRight),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1),
                              ),
                              child: TextButton(
                                onPressed: () {
                                  _triggerHaptic();
                                  Navigator.pushNamed(context, '/astrologer-signup');
                                },
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  backgroundColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.auto_awesome, size: 18, color: AppColors.primary),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Join as Astrologer',
                                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 32),
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
        ),
      ),
    );
  }
}
