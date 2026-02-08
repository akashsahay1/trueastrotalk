import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../services/auth/auth_service.dart';
import '../../services/profile/profile_completion_service.dart';
import '../../services/service_locator.dart';
import '../../models/user.dart';
import 'edit_personal_info.dart';
import 'edit_professional_info.dart';
import 'edit_session_rates.dart';
import 'edit_bank_details.dart';

/// Step-by-step wizard to guide astrologers through profile completion after signup.
///
/// Steps:
/// 1. Email Verification (via EditPersonalInfoScreen)
/// 2. Professional Info (Bio, Skills, Languages)
/// 3. Session Rates
/// 4. Bank Details
class ProfileCompletionWizard extends StatefulWidget {
  /// If true, shows skip option for non-critical steps
  final bool allowSkip;

  /// Callback when wizard is completed
  final VoidCallback? onComplete;

  const ProfileCompletionWizard({
    super.key,
    this.allowSkip = true,
    this.onComplete,
  });

  @override
  State<ProfileCompletionWizard> createState() => _ProfileCompletionWizardState();
}

class _ProfileCompletionWizardState extends State<ProfileCompletionWizard> {
  late final AuthService _authService;
  late final ProfileCompletionService _profileCompletionService;

  int _currentStep = 0;
  bool _isLoading = true;
  User? _currentUser;

  final List<_WizardStep> _steps = [
    _WizardStep(
      id: 'email',
      title: 'Verify Email',
      description: 'Add and verify your email address to receive important notifications',
      icon: Icons.email_outlined,
    ),
    _WizardStep(
      id: 'professional',
      title: 'Professional Info',
      description: 'Tell clients about your expertise, skills, and experience',
      icon: Icons.work_outline,
    ),
    _WizardStep(
      id: 'rates',
      title: 'Set Your Rates',
      description: 'Configure your consultation rates for chat, call, and video',
      icon: Icons.monetization_on_outlined,
    ),
    _WizardStep(
      id: 'bank',
      title: 'Bank Details',
      description: 'Add your bank account details to receive payouts',
      icon: Icons.account_balance_outlined,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _profileCompletionService = getIt<ProfileCompletionService>();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    _currentUser = await _authService.refreshCurrentUser();
    _profileCompletionService.updateUser(_currentUser);

    // Determine starting step based on completion status
    _determineCurrentStep();

    setState(() => _isLoading = false);
  }

  void _determineCurrentStep() {
    if (_profileCompletionService.isEmailVerified) {
      if (_profileCompletionService.isProfessionalInfoComplete) {
        if (_profileCompletionService.isRatesComplete) {
          if (_profileCompletionService.isBankDetailsComplete) {
            // All complete - wizard done
            _currentStep = _steps.length;
          } else {
            _currentStep = 3; // Bank details
          }
        } else {
          _currentStep = 2; // Rates
        }
      } else {
        _currentStep = 1; // Professional info
      }
    } else {
      _currentStep = 0; // Email
    }
  }

  void _navigateToStep(int stepIndex) {
    if (stepIndex >= _steps.length) {
      // All steps completed
      _onWizardComplete();
      return;
    }

    final step = _steps[stepIndex];
    Widget? screen;

    switch (step.id) {
      case 'email':
        screen = const EditPersonalInfoScreen();
        break;
      case 'professional':
        screen = const EditProfessionalInfoScreen();
        break;
      case 'rates':
        screen = const EditSessionRatesScreen();
        break;
      case 'bank':
        screen = const EditBankDetailsScreen();
        break;
    }

    if (screen != null) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => screen!),
      ).then((_) {
        // Refresh data and check if step is now complete
        _loadData();
      });
    }
  }

  void _skipCurrentStep() {
    if (_currentStep < _steps.length - 1) {
      setState(() {
        _currentStep++;
      });
    } else {
      _onWizardComplete();
    }
  }

  void _onWizardComplete() {
    widget.onComplete?.call();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Complete your profile'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => _showExitConfirmation(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _currentStep >= _steps.length
              ? _buildCompletionView()
              : _buildWizardView(),
    );
  }

  Widget _buildWizardView() {
    return Column(
      children: [
        // Progress indicator
        _buildProgressIndicator(),

        // Step content
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCurrentStepCard(),
                const SizedBox(height: 32),
                _buildStepsList(),
              ],
            ),
          ),
        ),

        // Bottom action buttons
        _buildActionButtons(),
      ],
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      color: AppColors.primary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Step ${_currentStep + 1} of ${_steps.length}',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.white.withValues(alpha: 0.8),
                ),
              ),
              Text(
                '${_profileCompletionService.completionPercentage}% Complete',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.white.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (_currentStep + 1) / _steps.length,
              backgroundColor: AppColors.white.withValues(alpha: 0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.white),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStepCard() {
    final step = _steps[_currentStep];
    final isComplete = _isStepComplete(step.id);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isComplete
              ? [AppColors.success, AppColors.success.withValues(alpha: 0.8)]
              : [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: (isComplete ? AppColors.success : AppColors.primary)
                .withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isComplete ? Icons.check_circle : step.icon,
                  color: AppColors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (isComplete)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'COMPLETED',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      step.title,
                      style: AppTextStyles.heading4.copyWith(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            step.description,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.white.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'All Steps',
          style: AppTextStyles.heading5.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...List.generate(_steps.length, (index) {
          final step = _steps[index];
          final isComplete = _isStepComplete(step.id);
          final isCurrent = index == _currentStep;

          return _buildStepItem(
            step: step,
            index: index,
            isComplete: isComplete,
            isCurrent: isCurrent,
          );
        }),
      ],
    );
  }

  Widget _buildStepItem({
    required _WizardStep step,
    required int index,
    required bool isComplete,
    required bool isCurrent,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isCurrent
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isCurrent
                ? AppColors.primary
                : isComplete
                    ? AppColors.success.withValues(alpha: 0.5)
                    : AppColors.borderLight,
            width: isCurrent ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isComplete
                    ? AppColors.success
                    : isCurrent
                        ? AppColors.primary
                        : AppColors.grey400,
              ),
              child: Center(
                child: isComplete
                    ? const Icon(Icons.check, color: AppColors.white, size: 18)
                    : Text(
                        '${index + 1}',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.title,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isCurrent
                          ? AppColors.primary
                          : AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    isComplete ? 'Completed' : step.description,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: isComplete
                          ? AppColors.success
                          : AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(
              step.icon,
              color: isComplete
                  ? AppColors.success
                  : isCurrent
                      ? AppColors.primary
                      : AppColors.grey400,
              size: 24,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          if (widget.allowSkip && _currentStep < _steps.length - 1)
            Expanded(
              child: OutlinedButton(
                onPressed: _skipCurrentStep,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: BorderSide(color: AppColors.grey400),
                ),
                child: Text(
                  'Skip for Now',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          if (widget.allowSkip && _currentStep < _steps.length - 1)
            const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () => _navigateToStep(_currentStep),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(
                _isStepComplete(_steps[_currentStep].id)
                    ? 'Review & Continue'
                    : 'Complete This Step',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle,
                color: AppColors.success,
                size: 64,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Profile Complete!',
              style: AppTextStyles.heading3.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.success,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Your profile is now complete. Our team will review your information and verify your account shortly.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _onWizardComplete,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(
                  horizontal: 48,
                  vertical: 16,
                ),
              ),
              child: Text(
                'Go to Dashboard',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isStepComplete(String stepId) {
    switch (stepId) {
      case 'email':
        return _profileCompletionService.isEmailVerified;
      case 'professional':
        return _profileCompletionService.isProfessionalInfoComplete;
      case 'rates':
        return _profileCompletionService.isRatesComplete;
      case 'bank':
        return _profileCompletionService.isBankDetailsComplete;
      default:
        return false;
    }
  }

  void _showExitConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Exit Profile Setup?'),
        content: const Text(
          'You can complete your profile later from your dashboard. '
          'However, you won\'t be able to accept consultations until your profile is complete and verified.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Continue Setup'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: Text(
              'Exit',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

class _WizardStep {
  final String id;
  final String title;
  final String description;
  final IconData icon;

  const _WizardStep({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
  });
}
