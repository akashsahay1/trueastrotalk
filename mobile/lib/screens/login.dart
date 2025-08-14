import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/app_strings.dart';
import '../../common/constants/dimensions.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  late final AuthService _authService;
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(Dimensions.paddingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: Dimensions.spacingXl),

              // App Logo
              Center(
                child: Container(
                  width: Dimensions.iconXxl,
                  height: Dimensions.iconXxl,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(Dimensions.radiusLg),
                    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(Dimensions.radiusLg),
                    child: Image.asset('assets/images/logo.png', width: Dimensions.iconLg, height: Dimensions.iconLg, fit: BoxFit.contain),
                  ),
                ),
              ),

              const SizedBox(height: Dimensions.spacingLg),

              // Welcome Text
              Text(
                AppStrings.welcome,
                style: AppTextStyles.heading3.copyWith(color: AppColors.textPrimaryLight),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: Dimensions.spacingSm),

              Text(
                AppStrings.appTagline,
                style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondaryLight),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: Dimensions.spacingXl),

              // Login Form
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Email Field
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email_outlined)),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return AppStrings.fieldRequired;
                        }
                        if (!value.contains('@') || !value.contains('.')) {
                          return 'Please enter a valid email address';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: Dimensions.spacingMd),

                    // Password Field
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: AppStrings.password,
                        prefixIcon: const Icon(Icons.lock),
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                          icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return AppStrings.fieldRequired;
                        }
                        if (value.length < 6) {
                          return AppStrings.passwordTooShort;
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: Dimensions.spacingSm),

                    // Forgot Password
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _onForgotPassword,
                        child: Text(AppStrings.forgotPassword, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary)),
                      ),
                    ),

                    const SizedBox(height: Dimensions.spacingLg),

                    // Login Button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _onLogin,
                      style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, Dimensions.buttonHeightMd)),
                      child: _isLoading
                          ? const SizedBox(
                              width: Dimensions.iconSm,
                              height: Dimensions.iconSm,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
                            )
                          : Text(AppStrings.login, style: AppTextStyles.buttonMedium),
                    ),

                    const SizedBox(height: Dimensions.spacingXl),

                    // Divider
                    const Row(
                      children: [
                        Expanded(child: Divider()),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: Dimensions.paddingMd),
                          child: Text('OR'),
                        ),
                        Expanded(child: Divider()),
                      ],
                    ),

                    const SizedBox(height: Dimensions.spacingLg),

                    // Google Sign In Button
                    OutlinedButton.icon(
                      onPressed: _isLoading ? null : _onGoogleSignIn,
                      icon: const Icon(Icons.account_circle, size: 20, color: Colors.red),
                      label: Text('Continue with Google', style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimaryLight)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
                        side: const BorderSide(color: AppColors.borderLight),
                      ),
                    ),

                    const SizedBox(height: Dimensions.spacingLg),

                    // Register Button
                    OutlinedButton(
                      onPressed: _onRegister,
                      style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, Dimensions.buttonHeightMd)),
                      child: Text(AppStrings.register, style: AppTextStyles.buttonMedium),
                    ),

                    const SizedBox(height: Dimensions.spacingMd),

                    // Join as Astrologer Link
                    Center(
                      child: TextButton(
                        onPressed: _onJoinAsAstrologer,
                        child: Text(
                          'Join as Astrologer',
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600, decoration: TextDecoration.none, decorationColor: AppColors.primary),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: Dimensions.spacingXl),

              // Footer Text
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                  children: const [
                    TextSpan(text: 'By continuing, you agree to our '),
                    TextSpan(
                      text: 'Terms of Service',
                      style: TextStyle(color: AppColors.primary, decoration: TextDecoration.underline),
                    ),
                    TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: TextStyle(color: AppColors.primary, decoration: TextDecoration.underline),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Sign in with Next.js API
      final user = await _authService.signInWithEmailPassword(email: _emailController.text.trim(), password: _passwordController.text);

      if (mounted) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Login successful!'), backgroundColor: AppColors.success));

        // Navigate based on user role
        if (user.isCustomer) {
          Navigator.pushReplacementNamed(context, '/customer/home');
        } else if (user.isAstrologer) {
          Navigator.pushReplacementNamed(context, '/customer/home');
        } else {
          // Admin or manager - for now navigate to customer home
          Navigator.pushReplacementNamed(context, '/customer/home');
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Login failed: $errorMessage'), backgroundColor: AppColors.error, duration: const Duration(seconds: 4)));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _onRegister() {
    Navigator.pushNamed(context, '/register');
  }

  void _onJoinAsAstrologer() {
    Navigator.pushNamed(context, '/astrologer-signup');
  }

  void _onForgotPassword() {
    Navigator.pushNamed(context, '/forgot-password');
  }

  Future<void> _onGoogleSignIn() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Sign in with Google via Next.js API
      final user = await _authService.signInWithGoogle();

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
      if (mounted) {
        // Silently navigate to registration screen with prefilled Google data
        Navigator.pushNamed(context, '/register', arguments: {'name': googleException.name, 'email': googleException.email, 'google_access_token': googleException.accessToken, 'auth_type': 'google'});
      }
    } catch (e) {
      // Check if this is actually a GoogleSignUpRequiredException that wasn't caught
      if (e.toString().contains('Google user needs to complete signup')) {
        // This shouldn't happen, but let's handle it as a fallback
        if (mounted) {
          Navigator.pushNamed(context, '/register');
        }
        return;
      }

      // Check if this is an account migration error
      if (e.toString().contains('Unable to login with Google')) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Unable to connect with Google. Please try again or use email login.'), backgroundColor: AppColors.error, duration: const Duration(seconds: 3)));
        }
        return;
      }

      // Handle silently - no snackbars for any other Google Sign-In issues
      if (mounted && e.toString().contains('cancelled')) {
        // User cancelled - do nothing, stay on login screen
        return;
      }

      // Debug: Log any other errors to help diagnose issues
      debugPrint('🚨 Google Sign-In Error: $e');

      // Show error to user for debugging
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Google Sign-In failed: ${e.toString()}'), backgroundColor: AppColors.error, duration: const Duration(seconds: 5)));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}
