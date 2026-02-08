import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../services/service_locator.dart';
import '../../services/auth/auth_service.dart';
import '../../models/enums.dart';

/// Verification purposes for OTP screen
enum OtpPurpose {
  /// Default auth flow (login/signup)
  auth,
  /// Astrologer quick signup - creates account after OTP verification
  astrologerSignup,
  /// Email verification for profile update
  emailVerification,
}

class OTPVerificationScreen extends StatefulWidget {
  const OTPVerificationScreen({super.key});

  @override
  State<OTPVerificationScreen> createState() => _OTPVerificationScreenState();
}

class _OTPVerificationScreenState extends State<OTPVerificationScreen> {
  // Individual controllers and focus nodes for each OTP digit
  final List<TextEditingController> _controllers = List.generate(
    4,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());

  late final AuthService _authService;

  // Purpose of this OTP verification
  OtpPurpose _purpose = OtpPurpose.auth;

  // Unified authentication fields
  String _identifier = ''; // Can be email or phone
  String _authType = 'phone'; // 'email' or 'phone'
  String _otpSentTo = ''; // Display string for where OTP was sent

  // Additional data for specific purposes
  String _fullName = ''; // For astrologer signup

  // Google signup data
  String? _googleName;
  String? _googleAccessToken;
  String? _googleIdToken;

  bool _isVerifying = false;
  bool _isResending = false;
  bool _canResend = false;

  int _remainingSeconds = 300; // 5 minutes
  int _resendCooldown = 30; // 30 seconds before resend enabled

  Timer? _countdownTimer;
  Timer? _resendTimer;

  bool _argsProcessed = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();

    // Start countdown timer
    _startCountdownTimer();
    _startResendTimer();

    // Auto focus first field after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _focusNodes[0].requestFocus();
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // Only process args once
    if (_argsProcessed) return;
    _argsProcessed = true;

    // Get arguments passed from various screens
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      // Determine purpose
      final purposeStr = args['purpose'] as String?;
      if (purposeStr == 'astrologer_signup') {
        _purpose = OtpPurpose.astrologerSignup;
      } else if (purposeStr == 'email_verification') {
        _purpose = OtpPurpose.emailVerification;
      } else {
        _purpose = OtpPurpose.auth;
      }

      // Common fields
      _identifier = args['identifier'] ?? '';
      _authType = args['auth_type'] ?? 'phone';
      _otpSentTo = args['otp_sent_to'] ?? _identifier;
      _fullName = args['full_name'] ?? args['name'] ?? '';

      // Override expiry if provided
      if (args['expiry_seconds'] != null) {
        _remainingSeconds = args['expiry_seconds'] as int;
      }

      // Google signup completion data
      if (args.containsKey('google_access_token')) {
        _googleName = args['name'];
        _googleAccessToken = args['google_access_token'];
        _googleIdToken = args['google_id_token'];
      }
    }
  }

  bool _isDisposed = false;

  @override
  void dispose() {
    _isDisposed = true;
    // Cancel timers first to prevent setState calls after dispose
    _countdownTimer?.cancel();
    _countdownTimer = null;
    _resendTimer?.cancel();
    _resendTimer = null;
    // Dispose all controllers and focus nodes
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final focusNode in _focusNodes) {
      focusNode.dispose();
    }
    super.dispose();
  }

  /// Get the complete OTP from all fields
  String get _otp => _controllers.map((c) => c.text).join();

  /// Clear all OTP fields
  void _clearOtpFields() {
    for (final controller in _controllers) {
      controller.clear();
    }
    if (mounted && !_isDisposed) {
      _focusNodes[0].requestFocus();
    }
  }

  void _startCountdownTimer() {
    _countdownTimer?.cancel();
    _remainingSeconds = 300;

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _isDisposed) {
        timer.cancel();
        return;
      }
      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        timer.cancel();
        if (mounted && !_isDisposed) {
          _showSnackBar(
            'OTP expired. Please request a new one.',
            isError: true,
          );
        }
      }
    });
  }

  void _startResendTimer() {
    _resendTimer?.cancel();
    _resendCooldown = 30;
    if (mounted && !_isDisposed) {
      setState(() => _canResend = false);
    }

    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _isDisposed) {
        timer.cancel();
        return;
      }
      if (_resendCooldown > 0) {
        setState(() => _resendCooldown--);
      } else {
        setState(() => _canResend = true);
        timer.cancel();
      }
    });
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  void _safeClearOtpController() {
    if (!_isDisposed && mounted) {
      _clearOtpFields();
    }
  }

  /// Handle input change for OTP field
  void _onOtpFieldChanged(String value, int index) {
    if (value.length == 1) {
      // Move to next field
      if (index < 3) {
        _focusNodes[index + 1].requestFocus();
      } else {
        // Last field filled - unfocus and verify
        _focusNodes[index].unfocus();
        final otp = _otp;
        if (otp.length == 4) {
          _verifyOTP(otp);
        }
      }
    }
  }

  /// Handle backspace/delete key
  void _onOtpKeyEvent(KeyEvent event, int index) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_controllers[index].text.isEmpty && index > 0) {
        // Field is empty and backspace pressed - go to previous field
        _focusNodes[index - 1].requestFocus();
        _controllers[index - 1].clear();
      }
    }
  }

  /// Build individual OTP input field
  Widget _buildOtpField(int index) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.grey300,
          width: 1,
        ),
      ),
      child: KeyboardListener(
        focusNode: FocusNode(),
        onKeyEvent: (event) => _onOtpKeyEvent(event, index),
        child: Center(
          child: TextField(
            controller: _controllers[index],
            focusNode: _focusNodes[index],
            enabled: !_isVerifying,
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            cursorColor: AppColors.grey300,
            style: AppTextStyles.heading2.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
              letterSpacing: 0,
            ),
            decoration: const InputDecoration(
              counterText: '',
              filled: false,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              isDense: true,
            ),
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(1),
            ],
            onChanged: (value) => _onOtpFieldChanged(value, index),
          ),
        ),
      ),
    );
  }

  Future<void> _verifyOTP(String otp) async {
    if (otp.length != 4) return;

    setState(() => _isVerifying = true);

    try {
      // Verify OTP first
      // For email verification of existing user, skip saving tokens to avoid replacing current user's auth
      final verifyResult = await _authService.verifyUnifiedOTP(
        identifier: _identifier,
        otp: otp,
        authType: _authType,
        skipTokenSave: _purpose == OtpPurpose.emailVerification,
      );

      if (!verifyResult['success']) {
        final remainingAttempts = verifyResult['remaining_attempts'];
        String errorMsg = verifyResult['error'] ?? 'Invalid OTP';

        if (remainingAttempts != null) {
          errorMsg += ' ($remainingAttempts attempts left)';
        }

        _showSnackBar(errorMsg, isError: true);
        _safeClearOtpController();
        return;
      }

      // OTP verified - handle based on purpose
      switch (_purpose) {
        case OtpPurpose.astrologerSignup:
          await _handleAstrologerSignup(verifyResult);
        case OtpPurpose.emailVerification:
          await _handleEmailVerification();
        case OtpPurpose.auth:
          await _handleAuthFlow(verifyResult);
      }
    } catch (e) {
      _showSnackBar('Error: ${e.toString()}', isError: true);
      _safeClearOtpController();
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

  /// Handle astrologer signup flow
  Future<void> _handleAstrologerSignup(Map<String, dynamic> verifyResult) async {
    // Check if user already exists
    final userExists = verifyResult['user_exists'] ?? false;
    if (userExists) {
      final user = verifyResult['user'];

      // If existing user is an astrologer, welcome them back
      if (user != null && user.isAstrologer) {
        if (mounted) {
          _showSnackBar('Welcome back! Logging you in...', isError: false);
          await Future.delayed(const Duration(milliseconds: 500));
          if (mounted) {
            Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
          }
        }
        return;
      }

      // Phone is already registered to a non-astrologer account
      if (mounted) {
        _showSnackBar(
          'This phone number is already registered to another account.',
          isError: true,
        );
        _safeClearOtpController();
      }
      return;
    }

    // OTP verified - create the astrologer account
    final registerResult = await _authService.registerAstrologerMinimal(
      fullName: _fullName,
      phoneNumber: _identifier,
    );

    if (mounted && registerResult['success']) {
      _showSnackBar('Account created successfully!', isError: false);
      await Future.delayed(const Duration(milliseconds: 500));

      if (mounted) {
        Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
      }
    } else {
      _showSnackBar(
        registerResult['error'] ?? 'Failed to create account',
        isError: true,
      );
      _safeClearOtpController();
    }
  }

  /// Handle email verification flow (profile update)
  Future<void> _handleEmailVerification() async {
    // OTP verified - update profile with verified email
    try {
      final updateData = <String, dynamic>{
        'email_address': _identifier,
        'email_verified': true,
        if (_fullName.isNotEmpty) 'full_name': _fullName,
      };

      await _authService.updateUserProfile(updateData);
      await _authService.refreshCurrentUser();

      if (mounted) {
        _showSnackBar('Email verified successfully!', isError: false);
        await Future.delayed(const Duration(milliseconds: 500));

        if (mounted) {
          // Return true to indicate success
          Navigator.pop(context, true);
        }
      }
    } catch (e) {
      _showSnackBar('Failed to update profile: ${e.toString()}', isError: true);
      _safeClearOtpController();
    }
  }

  /// Handle default auth flow (login/signup)
  Future<void> _handleAuthFlow(Map<String, dynamic> verifyResult) async {
    final userExists = verifyResult['user_exists'] ?? false;

    if (userExists) {
      // User exists - login flow
      if (mounted) {
        _showSnackBar('Login successful!', isError: false);
        await Future.delayed(const Duration(milliseconds: 500));

        if (mounted) {
          final user = verifyResult['user'];
          debugPrint('🔍 OTP Verification - Parsed User:');
          debugPrint('   user.role: ${user.role}');
          debugPrint('   user.isCustomer: ${user.isCustomer}');
          debugPrint('   user.isAstrologer: ${user.isAstrologer}');

          // Navigate based on role and profile completion
          if (user.isCustomer) {
            Navigator.pushReplacementNamed(context, '/customer/home');
          } else if (user.isAstrologer) {
            if (user.verificationStatus == VerificationStatus.verified) {
              Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
            } else if (user.verificationStatus == VerificationStatus.pending) {
              Navigator.pushReplacementNamed(context, '/astrologer/pending');
            } else if (user.isProfileComplete) {
              Navigator.pushReplacementNamed(context, '/astrologer/pending');
            } else {
              Navigator.pushReplacementNamed(
                context,
                '/signup-completion',
                arguments: {
                  'identifier': user.email ?? user.phone ?? '',
                  'auth_type': _authType,
                  'user_type': 'astrologer',
                  'existing_user': true,
                },
              );
            }
          } else {
            await _authService.signOut();
            _showSnackBar(
              'This account type cannot access the mobile app',
              isError: true,
            );
          }
        }
      }
    } else {
      // New user - navigate to signup completion
      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          '/signup-completion',
          arguments: {
            'identifier': _identifier,
            'auth_type': _authType,
            if (_googleName != null) 'name': _googleName,
            if (_googleAccessToken != null)
              'google_access_token': _googleAccessToken,
            if (_googleIdToken != null) 'google_id_token': _googleIdToken,
          },
        );
      }
    }
  }

  Future<void> _resendOTP() async {
    if (!_canResend || _isResending) return;

    setState(() => _isResending = true);

    try {
      final result = await _authService.sendUnifiedOTP(
        identifier: _identifier,
        authType: _authType,
      );

      if (result['success']) {
        _showSnackBar('OTP sent successfully!', isError: false);
        _startCountdownTimer();
        _startResendTimer();
        _safeClearOtpController();
      } else {
        _showSnackBar(result['error'] ?? 'Failed to send OTP', isError: true);
      }
    } catch (e) {
      _showSnackBar('Error: ${e.toString()}', isError: true);
    } finally {
      if (mounted) {
        setState(() => _isResending = false);
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

  String get _appBarTitle {
    switch (_purpose) {
      case OtpPurpose.emailVerification:
        return 'Verify Email';
      case OtpPurpose.astrologerSignup:
        return 'Verify Phone';
      case OtpPurpose.auth:
        return _authType == 'email' ? 'Verify Email' : 'Verify Phone';
    }
  }

  String get _verifyingText {
    switch (_purpose) {
      case OtpPurpose.astrologerSignup:
        return 'Creating your account...';
      case OtpPurpose.emailVerification:
        return 'Verifying email...';
      case OtpPurpose.auth:
        return 'Verifying...';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(
          title: Text(
            _appBarTitle,
            style: AppTextStyles.heading5.copyWith(color: AppColors.white, letterSpacing: 0),
          ),
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          elevation: 0,
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 20),

                // Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _authType == 'email'
                        ? Icons.email_outlined
                        : Icons.phone_android,
                    size: 40,
                    color: AppColors.primary,
                  ),
                ),

                const SizedBox(height: 24),

                // Title
                Text(
                  'Enter Verification Code',
                  style: AppTextStyles.heading3.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 8),

                // Subtitle
                Text(
                  'We sent a 4-digit code to',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                    letterSpacing: 0,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 4),

                // Email or Phone number
                Text(
                  _otpSentTo,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 32),

                // OTP Input Fields
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (int i = 0; i < 4; i++) ...[
                      _buildOtpField(i),
                      if (i < 3) const SizedBox(width: 12),
                    ],
                  ],
                ),

                const SizedBox(height: 24),

                // Timer
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.grey100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.timer_outlined,
                        size: 18,
                        color: _remainingSeconds < 60
                            ? AppColors.error
                            : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _formatTime(_remainingSeconds),
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: _remainingSeconds < 60
                              ? AppColors.error
                              : AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Resend OTP button
                TextButton(
                  onPressed: _canResend && !_isResending ? _resendOTP : null,
                  child: _isResending
                      ? SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.primary,
                            ),
                          ),
                        )
                      : Text(
                          _canResend
                              ? 'Resend OTP'
                              : 'Resend OTP in ${_resendCooldown}s',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: _canResend
                                ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0,
                          ),
                        ),
                ),

                const SizedBox(height: 16),

                // Loading indicator
                if (_isVerifying)
                  Column(
                    children: [
                      const SizedBox(height: 20),
                      CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _verifyingText,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                          letterSpacing: 0,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
