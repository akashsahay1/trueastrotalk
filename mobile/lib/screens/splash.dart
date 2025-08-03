import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/app_strings.dart';
import '../../common/constants/dimensions.dart';
import '../config/config.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _scaleController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _navigateToNextScreen();
  }

  void _initializeAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.elasticOut,
    ));

    _fadeController.forward();
    _scaleController.forward();
  }

  void _navigateToNextScreen() async {
    await Future.delayed(Config.splashScreenDuration);
    
    if (mounted) {
      // Check if user is already logged in and onboarding completed
      // final prefs = await SharedPreferences.getInstance();
      // final authService = GetIt.instance<AuthService>();
      // final isLoggedIn = await authService.isLoggedIn();
      // final onboardingCompleted = prefs.getBool('onboarding_completed') ?? false;
      
      // For now, always navigate to onboarding
      // In production logic:
      // if (isLoggedIn) -> navigate to home based on user role
      // else if (onboardingCompleted) -> navigate to login
      // else -> navigate to onboarding
      Navigator.of(context).pushReplacementNamed('/onboarding');
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo Animation
                AnimatedBuilder(
                  animation: _scaleAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _scaleAnimation.value,
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: Container(
                          width: Dimensions.iconXxl * 2,
                          height: Dimensions.iconXxl * 2,
                          decoration: BoxDecoration(
                            color: AppColors.white,
                            borderRadius: BorderRadius.circular(Dimensions.radiusXl),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.black.withValues(alpha: 0.2),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(Dimensions.radiusXl),
                            child: Image.asset(
                              'assets/images/logo.png',
                              width: Dimensions.iconXxl,
                              height: Dimensions.iconXxl,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),

                const SizedBox(height: Dimensions.spacingXl),

                // App Name
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: Text(
                    AppStrings.appName,
                    style: AppTextStyles.heading2.copyWith(
                      color: AppColors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

                const SizedBox(height: Dimensions.spacingSm),

                // Tagline
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: Text(
                    AppStrings.appTagline,
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.white.withValues(alpha: 0.9),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),

                const SizedBox(height: Dimensions.spacingXxl * 2),

                // Loading Indicator
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: const SizedBox(
                    width: Dimensions.loadingSizeSm,
                    height: Dimensions.loadingSizeSm,
                    child: CircularProgressIndicator(
                      color: AppColors.white,
                      strokeWidth: 2,
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