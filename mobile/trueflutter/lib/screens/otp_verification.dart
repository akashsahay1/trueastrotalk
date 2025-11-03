import 'package:flutter/material.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'dart:async';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/service_locator.dart';
import '../services/auth/auth_service.dart';
import '../config/config.dart';

class OTPVerificationScreen extends StatefulWidget {
  const OTPVerificationScreen({super.key});

  @override
  State<OTPVerificationScreen> createState() => _OTPVerificationScreenState();
}

class _OTPVerificationScreenState extends State<OTPVerificationScreen> {
  final _otpController = TextEditingController();
  late final AuthService _authService;

  String _phoneNumber = '';
  String _fullName = '';
  String? _dateOfBirth;
  String? _timeOfBirth;
  String? _placeOfBirth;
  String _gender = 'male';
  bool _isLogin = false; // Flag to indicate if this is login flow

  bool _isVerifying = false;
  bool _isResending = false;
  bool _canResend = false;

  int _remainingSeconds = 300; // 5 minutes
  int _resendCooldown = 30; // 30 seconds before resend enabled

  Timer? _countdownTimer;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();

    // Start countdown timer
    _startCountdownTimer();
    _startResendTimer();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // Get arguments passed from phone signup/login screen
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      _phoneNumber = args['phone_number'] ?? '';
      _fullName = args['full_name'] ?? '';
      _dateOfBirth = args['date_of_birth'];
      _timeOfBirth = args['time_of_birth'];
      _placeOfBirth = args['place_of_birth'];
      _gender = args['gender'] ?? 'male';
      _isLogin = args['is_login'] ?? false; // Check if this is login flow
    }
  }

  @override
  void dispose() {
    _otpController.dispose();
    _countdownTimer?.cancel();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _startCountdownTimer() {
    _countdownTimer?.cancel();
    _remainingSeconds = 300;

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        timer.cancel();
        _showSnackBar('OTP expired. Please request a new one.', isError: true);
      }
    });
  }

  void _startResendTimer() {
    _resendTimer?.cancel();
    _resendCooldown = 30;
    setState(() => _canResend = false);

    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
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

  Future<void> _verifyOTP(String otp) async {
    if (otp.length != 4) return;

    setState(() => _isVerifying = true);

    try {
      // First verify the OTP
      final verifyResult = await _authService.verifyOTP(_phoneNumber, otp);

      if (verifyResult['success']) {
        if (_isLogin) {
          // Login flow - complete login and fetch user data
          final loginResult = await _authService.phoneLoginComplete(_phoneNumber);

          if (loginResult['success']) {
            if (mounted) {
              _showSnackBar('Login successful!', isError: false);

              // Navigate to home screen
              await Future.delayed(const Duration(milliseconds: 500));

              if (mounted) {
                Navigator.pushReplacementNamed(context, '/home');
              }
            }
          } else {
            _showSnackBar(
              loginResult['error'] ?? 'Failed to login',
              isError: true,
            );
            _otpController.clear();
          }
        } else {
          // Signup flow - complete signup after OTP verification
          final signupResult = await _authService.phoneSignUp(
            _phoneNumber,
            _fullName,
            'customer', // Phone signup is always for customers
            dateOfBirth: _dateOfBirth,
            timeOfBirth: _timeOfBirth,
            placeOfBirth: _placeOfBirth,
            gender: _gender,
          );

          if (signupResult['success']) {
            if (mounted) {
              _showSnackBar('Account created successfully!', isError: false);

              // Navigate to customer home screen
              await Future.delayed(const Duration(milliseconds: 500));

              if (mounted) {
                Navigator.pushReplacementNamed(context, '/customer/home');
              }
            }
          } else {
            _showSnackBar(
              signupResult['error'] ?? 'Failed to create account',
              isError: true,
            );
            _otpController.clear();
          }
        }
      } else {
        final remainingAttempts = verifyResult['remaining_attempts'];
        String errorMsg = verifyResult['error'] ?? 'Invalid OTP';

        if (remainingAttempts != null) {
          errorMsg += ' ($remainingAttempts attempts left)';
        }

        _showSnackBar(errorMsg, isError: true);
        _otpController.clear();
      }
    } catch (e) {
      _showSnackBar('Error: ${e.toString()}', isError: true);
      _otpController.clear();
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

  Future<void> _resendOTP() async {
    if (!_canResend || _isResending) return;

    setState(() => _isResending = true);

    try {
      final result = await _authService.sendOTP(_phoneNumber);

      if (result['success']) {
        _showSnackBar('OTP sent successfully!', isError: false);
        _startCountdownTimer();
        _startResendTimer();
        _otpController.clear();
      } else {
        _showSnackBar(
          result['error'] ?? 'Failed to send OTP',
          isError: true,
        );
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

  @override
  Widget build(BuildContext context) {
    final isTestMode = Config.isDevelopment;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Text(
          'Verify Phone',
          style: AppTextStyles.heading5.copyWith(color: AppColors.white),
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
                  Icons.phone_android,
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
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 8),

              // Subtitle
              Text(
                'We sent a 4-digit code to',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 4),

              // Phone number
              Text(
                _phoneNumber,
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 32),

              // PIN Input
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: PinCodeTextField(
                  appContext: context,
                  length: 4,
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  animationType: AnimationType.fade,
                  autoFocus: true,
                  enableActiveFill: true,
                  enabled: !_isVerifying,
                  pinTheme: PinTheme(
                    shape: PinCodeFieldShape.box,
                    borderRadius: BorderRadius.circular(12),
                    fieldHeight: 60,
                    fieldWidth: 60,
                    activeFillColor: AppColors.white,
                    selectedFillColor: AppColors.white,
                    inactiveFillColor: AppColors.white,
                    activeColor: AppColors.primary,
                    selectedColor: AppColors.primary,
                    inactiveColor: AppColors.grey300,
                    borderWidth: 2,
                  ),
                  cursorColor: AppColors.primary,
                  animationDuration: const Duration(milliseconds: 300),
                  onCompleted: _verifyOTP,
                  onChanged: (value) {},
                ),
              ),

              const SizedBox(height: 24),

              // Testing mode hint
              if (isTestMode)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.warning.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 20,
                        color: AppColors.warning,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Testing Mode: Use 0000 for verification',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              if (isTestMode) const SizedBox(height: 24),

              // Timer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                      'Verifying...',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
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
