import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  late AnimationController _scaleController;

  // Animations
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;

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

    // Scale animation for interactive elements
    _scaleController = AnimationController(duration: const Duration(milliseconds: 200), vsync: this);
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut));
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
    _scaleController.dispose();
    super.dispose();
  }

  void _triggerHaptic() {
    HapticFeedback.lightImpact();
  }

  void _onButtonTapDown() {
    _triggerHaptic();
    _scaleController.forward();
  }

  void _onButtonTapUp() {
    _scaleController.reverse();
  }

  Future<void> _handleGoogleSignIn() async {
    _onButtonTapDown();
    await Future.delayed(const Duration(milliseconds: 100));
    _onButtonTapUp();

    setState(() => _isGoogleLoading = true);

    try {
      final user = await _authService.signInWithGoogle();

      if (mounted) {
        // Navigate based on user role
        if (user.isCustomer) {
          Navigator.pushReplacementNamed(context, '/customer/home');
        } else if (user.isAstrologer) {
          if (user.isActive && user.isEmailVerified) {
            Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
          } else {
            Navigator.pushReplacementNamed(context, '/astrologer/pending');
          }
        }
      }
    } on GoogleSignUpRequiredException catch (googleException) {
      if (mounted) {
        // Navigate to signup screen with Google data
        Navigator.pushNamed(context, '/signup', arguments: {'name': googleException.name, 'email': googleException.email, 'google_access_token': googleException.accessToken, 'google_id_token': googleException.idToken, 'auth_type': 'google'});
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
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
                          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.2), blurRadius: 24, offset: const Offset(0, 8))],
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
                        // Google Sign In Button (for customers)
                        ScaleTransition(
                          scale: _scaleAnimation,
                          child: Container(
                            width: double.infinity,
                            height: 56,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEA4335),
                              border: Border.all(color: const Color(0xFFEA4335), width: 1.5),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 4))],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: _isGoogleLoading ? null : _handleGoogleSignIn,
                                borderRadius: BorderRadius.circular(16),
                                onTapDown: (_) => _onButtonTapDown(),
                                onTapUp: (_) => _onButtonTapUp(),
                                onTapCancel: _onButtonTapUp,
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (_isGoogleLoading) ...[
                                        SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary))),
                                        const SizedBox(width: 12),
                                      ] else ...[
                                        Container(
                                          width: 20,
                                          height: 20,
                                          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                                          child: const Icon(Icons.g_mobiledata, color: AppColors.white, size: 16),
                                        ),
                                        const SizedBox(width: 12),
                                      ],
                                      Text(
                                        _isGoogleLoading ? 'Signing in...' : 'Continue with Google',
                                        style: AppTextStyles.buttonLarge.copyWith(color: AppColors.white, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Email Sign Up Button
                        Container(
                          width: double.infinity,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            border: Border.all(color: AppColors.primary, width: 1.5),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 8))],
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () {
                                _triggerHaptic();
                                Navigator.pushNamed(context, '/signup');
                              },
                              borderRadius: BorderRadius.circular(16),
                              child: Center(
                                child: Text(
                                  'Sign up with Email',
                                  style: AppTextStyles.buttonLarge.copyWith(color: AppColors.white, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Login and Join as Astrologer Links - Fixed Overflow
                        Column(
                          children: [
                            // Login Link
                            SizedBox(
                              width: double.infinity,
                              child: TextButton(
                                onPressed: () {
                                  _triggerHaptic();
                                  Navigator.pushNamed(context, '/login');
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
                                  Navigator.pushNamed(context, '/signup', arguments: {'isAdvanced': true});
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
    );
  }
}
