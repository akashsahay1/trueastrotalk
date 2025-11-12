import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:email_validator/email_validator.dart';
import 'package:flutter_svg/svg.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';
import '../common/utils/error_handler.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
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
  bool _obscurePassword = true;
  bool _isGoogleLoading = false;

  // Error message state
  String? _emailError;
  String? _passwordError;

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
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _triggerHaptic() {
    HapticFeedback.lightImpact();
  }

  void _triggerErrorHaptic() {
    HapticFeedback.heavyImpact();
  }

  String? _validateEmail(String? value) {
    if (value?.trim().isEmpty ?? true) {
      return 'Email is required';
    }
    if (!EmailValidator.validate(value!)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value?.isEmpty ?? true) {
      return 'Password is required';
    }
    if (value!.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  void _onLogin() async {
    // Validate and capture error messages
    setState(() {
      _emailError = _validateEmail(_emailController.text);
      _passwordError = _validatePassword(_passwordController.text);
    });

    if (_emailError != null || _passwordError != null) {
      _triggerErrorHaptic();
      _shakeController.forward().then((_) => _shakeController.reverse());
      return;
    }

    _triggerHaptic();
    setState(() => _isLoading = true);

    try {
      final user = await _authService.signInWithEmailPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (mounted) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Login successful!'),
            backgroundColor: AppColors.success,
          ),
        );

        // Navigate based on user role
        if (user.isCustomer) {
          Navigator.pushReplacementNamed(context, '/customer/home');
        } else if (user.isAstrologer) {
          if (user.isActive && user.isEmailVerified) {
            Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
          } else {
            Navigator.pushReplacementNamed(context, '/astrologer/pending');
          }
        } else {
          // Admin or manager - for now navigate to customer home
          Navigator.pushReplacementNamed(context, '/customer/home');
        }
      }
    } catch (e) {
      if (mounted) {
        _triggerErrorHaptic();
        _shakeController.forward().then((_) => _shakeController.reverse());
        
        // Handle login errors gracefully
        final appError = ErrorHandler.handleError(e, context: 'login');
        ErrorHandler.logError(appError);
        ErrorHandler.showError(context, appError);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onRegister() {
    Navigator.pushNamed(context, '/signup');
  }

  void _onJoinAsAstrologer() {
    Navigator.pushNamed(context, '/astrologer-signup');
  }

  void _onForgotPassword() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
    );
  }

  Widget _buildLoginIcon({
    required String imagePath,
    required String label,
    VoidCallback? onTap,
    bool isLoading = false,
  }) {
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 45,
            height: 45,
            decoration: BoxDecoration(
              color: AppColors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: isLoading
                ? Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    ),
                  )
                : Center(
                    child: SvgPicture.asset(
                      imagePath,
                      width: 20,
                      height: 20,
                      fit: BoxFit.cover,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Future<void> _onGoogleSignIn() async {
    _triggerHaptic();
    setState(() => _isGoogleLoading = true);
    
    try {
      debugPrint('🚀 Starting Google Sign-In process...');
      final user = await _authService.signInWithGoogle();
      debugPrint('✅ Google Sign-In successful, user: ${user.email}');
      
      if (mounted) {
        // Navigate based on user role (no success snackbar as per user requirement)
        if (user.isCustomer) {
          Navigator.pushReplacementNamed(context, '/home');
        } else if (user.isAstrologer) {
          Navigator.pushReplacementNamed(context, '/home');
        } else {
          // Admin or manager - for now navigate to customer home
          Navigator.pushReplacementNamed(context, '/home');
        }
      }
    } on GoogleSignUpRequiredException catch (googleException) {
      debugPrint('🎯 Caught GoogleSignUpRequiredException in login screen');
      debugPrint('   - Name: ${googleException.name}');
      debugPrint('   - Email: ${googleException.email}');
      debugPrint('   - Access Token: ${googleException.accessToken}');
      
      if (mounted) {
        debugPrint('✅ Google user needs to signup - redirecting to signup with data: ${googleException.email}');
        // Silently navigate to registration screen with prefilled Google data
        Navigator.pushNamed(
          context,
          '/signup',
          arguments: {
            'name': googleException.name,
            'email': googleException.email,
            'google_access_token': googleException.accessToken,
            'google_id_token': googleException.idToken,
            'auth_type': 'google'
          },
        );
        debugPrint('🚀 Navigation to signup initiated with arguments');
      }
    } catch (e) {
      debugPrint('🚨 Caught exception in generic catch block: ${e.runtimeType}');
      debugPrint('🚨 Exception details: $e');
      
      if (mounted) {
        // Check if user cancelled Google Sign-In - silently ignore
        if (e.toString().contains('USER_CANCELLED')) {
          debugPrint('🚫 User cancelled Google Sign-In - no error message shown');
          return;
        }
        
        // Check if this is actually a GoogleSignUpRequiredException that wasn't caught properly
        if (e is GoogleSignUpRequiredException) {
          debugPrint('🎯 Found GoogleSignUpRequiredException in generic catch block');
          // Navigate to signup screen with Google data
          Navigator.pushNamed(
            context,
            '/signup',
            arguments: {
              'name': e.name,
              'email': e.email,
              'google_access_token': e.accessToken,
              'google_id_token': e.idToken,
              'auth_type': 'google'
            },
          );
          return;
        }
        
        if (e.toString().contains('Google user needs to complete signup')) {
          Navigator.pushNamed(context, '/signup');
          return;
        }

        // Check if this is an account migration error
        if (e.toString().contains('Unable to login with Google')) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Unable to connect with Google. Please try again or use email login.'),
              backgroundColor: AppColors.error,
              duration: Duration(seconds: 3),
            ),
          );
          return;
        }

        // Handle Google Sign-In errors gracefully
        final appError = ErrorHandler.handleError(e, context: 'login');
        
        // Log error for debugging
        ErrorHandler.logError(appError);
        
        // Don't show error for user cancellation or signup flow
        if (!e.toString().contains('needs to complete signup') && 
            !e.toString().contains('USER_NOT_REGISTERED') &&
            !e.toString().contains('USER_CANCELLED') &&
            appError.userMessage.isNotEmpty) {
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
            Navigator.pushReplacementNamed(context, '/welcome');
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
                        'Welcome back',
                        style: AppTextStyles.heading2.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Sign in to continue your journey',
                        style: AppTextStyles.bodyLarge.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 40),
                
                // Form
                SlideTransition(
                  position: _slideAnimation,
                  child: AnimatedBuilder(
                    animation: _shakeAnimation,
                    builder: (context, child) {
                      return Transform.translate(
                        offset: Offset(
                          _shakeAnimation.value * 10 * 
                          (1 - _shakeAnimation.value),
                          0,
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              // Email Field
                              _buildTextField(
                                controller: _emailController,
                                label: 'Email Address',
                                icon: Icons.mail_outline,
                                keyboardType: TextInputType.emailAddress,
                                errorText: _emailError,
                                onChanged: (value) {
                                  if (_emailError != null) {
                                    setState(() {
                                      _emailError = _validateEmail(value);
                                    });
                                  }
                                },
                              ),

                              const SizedBox(height: 20),

                              // Password Field
                              _buildTextField(
                                controller: _passwordController,
                                label: 'Password',
                                icon: Icons.lock_outline,
                                obscureText: _obscurePassword,
                                errorText: _passwordError,
                                onChanged: (value) {
                                  if (_passwordError != null) {
                                    setState(() {
                                      _passwordError = _validatePassword(value);
                                    });
                                  }
                                },
                                suffixIcon: IconButton(
                                  onPressed: () {
                                    setState(() => _obscurePassword = !_obscurePassword);
                                  },
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Forgot Password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _onForgotPassword,
                    child: Text(
                      'Forgot Password?',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Login Button
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
                        onTap: _isLoading ? null : _onLogin,
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
                                  'Sign In',
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

                // Login method icons in a row
                SlideTransition(
                  position: _slideAnimation,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Google Sign In Icon
                      _buildLoginIcon(
                        imagePath: 'assets/images/google.svg',
                        label: 'Google',
                        isLoading: _isGoogleLoading,
                        onTap: _isGoogleLoading ? null : _onGoogleSignIn,
                      ),
                      const SizedBox(width: 32),

                      // Phone Login Icon
                      _buildLoginIcon(
                        imagePath: 'assets/images/phone.svg',
                        label: 'Phone',
                        onTap: () {
                          _triggerHaptic();
                          Navigator.pushNamed(context, '/phone-login');
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Register and Join as Astrologer Links
                SlideTransition(
                  position: _slideAnimation,
                  child: Column(
                    children: [
                      // Register Link
                      TextButton(
                        onPressed: _onRegister,
                        child: RichText(
                          text: TextSpan(
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                            children: [
                              const TextSpan(text: "Don't have an account? "),
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
                      
                      const SizedBox(height: 8),
                      
                      // Join as Astrologer Link
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
                          onPressed: _onJoinAsAstrologer,
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
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? errorText,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    void Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.labelLarge.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            obscureText: obscureText,
            onChanged: onChanged,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              prefixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              suffixIcon: suffixIcon,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              filled: false,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 18,
              ),
            ),
          ),
        ),
        // Display error message below the container
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 4),
            child: Text(
              errorText,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.error,
                height: 1.4,
              ),
            ),
          ),
      ],
    );
  }
}