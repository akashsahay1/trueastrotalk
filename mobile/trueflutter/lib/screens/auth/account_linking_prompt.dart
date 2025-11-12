import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:email_validator/email_validator.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';
import '../../common/utils/error_handler.dart';
import '../../models/user.dart';

class AccountLinkingPrompt extends StatefulWidget {
  final User user;
  final VoidCallback? onSkip;
  final VoidCallback? onComplete;

  const AccountLinkingPrompt({
    super.key,
    required this.user,
    this.onSkip,
    this.onComplete,
  });

  @override
  State<AccountLinkingPrompt> createState() => _AccountLinkingPromptState();
}

class _AccountLinkingPromptState extends State<AccountLinkingPrompt>
    with TickerProviderStateMixin {
  final _identifierController = TextEditingController();
  final _otpController = TextEditingController();
  late final AuthService _authService;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  bool _isLoading = false;
  bool _otpSent = false;
  String? _errorText;
  String _linkType = ''; // 'email' or 'phone'

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();

    // Determine what field is missing
    if (widget.user.email == null || widget.user.email!.isEmpty) {
      _linkType = 'email';
    } else if (widget.user.phone == null || widget.user.phone!.isEmpty) {
      _linkType = 'phone';
    }

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    ));

    _fadeController.forward();
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _otpController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _triggerHaptic() {
    HapticFeedback.lightImpact();
  }

  void _triggerErrorHaptic() {
    HapticFeedback.heavyImpact();
  }

  String? _validateIdentifier() {
    final value = _identifierController.text.trim();

    if (value.isEmpty) {
      return _linkType == 'email'
          ? 'Email is required'
          : 'Phone number is required';
    }

    if (_linkType == 'email' && !EmailValidator.validate(value)) {
      return 'Please enter a valid email address';
    }

    if (_linkType == 'phone') {
      // Basic phone validation
      final digitsOnly = value.replaceAll(RegExp(r'[^\d]'), '');
      if (digitsOnly.length < 10) {
        return 'Please enter a valid phone number';
      }
    }

    return null;
  }

  Future<void> _sendOTP() async {
    _triggerHaptic();

    final error = _validateIdentifier();
    if (error != null) {
      setState(() => _errorText = error);
      _triggerErrorHaptic();
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _authService.sendUnifiedOTP(
        identifier: _identifierController.text.trim(),
        authType: _linkType,
      );

      if (result['success']) {
        setState(() {
          _otpSent = true;
          _errorText = null;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('OTP sent to ${_identifierController.text.trim()}'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      } else {
        setState(() => _errorText = result['error'] ?? 'Failed to send OTP');
        _triggerErrorHaptic();
      }
    } catch (e) {
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'link-account');
        setState(() => _errorText = appError.userMessage);
        _triggerErrorHaptic();
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _verifyAndLink() async {
    _triggerHaptic();

    if (_otpController.text.trim().length != 4) {
      setState(() => _errorText = 'Please enter the 4-digit OTP');
      _triggerErrorHaptic();
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Get current auth token
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final result = await _authService.linkAccount(
        token: token,
        linkType: _linkType,
        identifier: _identifierController.text.trim(),
        otp: _otpController.text.trim(),
      );

      if (result['success']) {
        if (mounted) {
          final navigator = Navigator.of(context);
          final messenger = ScaffoldMessenger.of(context);

          messenger.showSnackBar(
            SnackBar(
              content: Text(
                _linkType == 'email'
                    ? 'Email linked successfully!'
                    : 'Phone linked successfully!',
              ),
              backgroundColor: AppColors.success,
            ),
          );

          await Future.delayed(const Duration(milliseconds: 500));

          if (widget.onComplete != null) {
            widget.onComplete!();
          } else {
            navigator.pop(true);
          }
        }
      } else {
        setState(() => _errorText = result['error'] ?? 'Failed to link account');
        _triggerErrorHaptic();
      }
    } catch (e) {
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'link-account');
        setState(() => _errorText = appError.userMessage);
        _triggerErrorHaptic();
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _skip() {
    _triggerHaptic();
    if (widget.onSkip != null) {
      widget.onSkip!();
    } else {
      Navigator.pop(context, false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Don't show if both email and phone are already present
    if ((widget.user.email != null && widget.user.email!.isNotEmpty) &&
        (widget.user.phone != null && widget.user.phone!.isNotEmpty)) {
      return const SizedBox.shrink();
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _linkType == 'email'
                    ? Icons.email_outlined
                    : Icons.phone_outlined,
                color: AppColors.primary,
                size: 28,
              ),
            ),

            const SizedBox(height: 16),

            // Title
            Text(
              _linkType == 'email'
                  ? 'Add Email to Your Account'
                  : 'Add Phone to Your Account',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 8),

            // Description
            Text(
              _linkType == 'email'
                  ? 'Add your email to secure your account and enable easier login options.'
                  : 'Add your phone number for easier login and better account security.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),

            const SizedBox(height: 24),

            // Input field
            if (!_otpSent) ...[
              TextField(
                controller: _identifierController,
                keyboardType: _linkType == 'email'
                    ? TextInputType.emailAddress
                    : TextInputType.phone,
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
                decoration: InputDecoration(
                  hintText: _linkType == 'email'
                      ? 'your@email.com'
                      : '+91 9876543210',
                  hintStyle: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textSecondary.withValues(alpha: 0.5),
                  ),
                  prefixIcon: Icon(
                    _linkType == 'email'
                        ? Icons.email_outlined
                        : Icons.phone_outlined,
                    color: AppColors.primary,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.grey300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.grey300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.primary, width: 2),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.error),
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.error, width: 2),
                  ),
                ),
              ),
            ] else ...[
              // OTP input
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 4,
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 8,
                ),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  hintText: '• • • •',
                  hintStyle: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textSecondary.withValues(alpha: 0.5),
                    letterSpacing: 8,
                  ),
                  counterText: '',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.grey300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.grey300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.primary, width: 2),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Resend link
              Center(
                child: TextButton(
                  onPressed: _isLoading ? null : _sendOTP,
                  child: Text(
                    'Resend OTP',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],

            // Error message
            if (_errorText != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: AppColors.error,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorText!,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.error,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : _skip,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: AppColors.grey300),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Skip for Now',
                      style: AppTextStyles.buttonMedium.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading
                        ? null
                        : (_otpSent ? _verifyAndLink : _sendOTP),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
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
                            _otpSent ? 'Verify & Link' : 'Send OTP',
                            style: AppTextStyles.buttonMedium.copyWith(
                              color: AppColors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
