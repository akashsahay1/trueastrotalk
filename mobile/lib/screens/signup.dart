import 'package:flutter/material.dart';
import 'package:email_validator/email_validator.dart';
import 'package:intl/intl.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';
import '../models/enums.dart';

class SignupScreen extends StatefulWidget {
  final bool isAdvanced;
  
  const SignupScreen({super.key, this.isAdvanced = false});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  late final AuthService _authService;
  
  // Form controllers - organized by sections
  final _personalFormKey = GlobalKey<FormState>();
  final _contactFormKey = GlobalKey<FormState>();
  final _birthFormKey = GlobalKey<FormState>();
  final _professionalFormKey = GlobalKey<FormState>();
  
  // Personal Information
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  // Birth Details
  final _dateOfBirthController = TextEditingController();
  final _timeOfBirthController = TextEditingController();
  final _placeOfBirthController = TextEditingController();
  
  // Professional Information (for advanced users)
  final _bioController = TextEditingController();
  final _experienceController = TextEditingController();
  final _educationController = TextEditingController();
  final _languagesController = TextEditingController();
  final _specializationsController = TextEditingController();
  final _skillsController = TextEditingController();
  
  // Form state
  int _currentSection = 0;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptTerms = false;
  bool _isLoading = false;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
  }

  @override
  void dispose() {
    _pageController.dispose();
    // Dispose all controllers
    for (final controller in [_nameController, _emailController, _phoneController, _passwordController, 
     _confirmPasswordController, _dateOfBirthController, _timeOfBirthController, 
     _placeOfBirthController, _bioController, _experienceController, 
     _educationController, _languagesController, _specializationsController, 
     _skillsController]) {
      controller.dispose();
    }
    super.dispose();
  }

  int get _totalSections => widget.isAdvanced ? 4 : 3;
  
  UserType get _userType => widget.isAdvanced ? UserType.astrologer : UserType.customer;

  void _nextSection() {
    final currentKey = _getCurrentFormKey();
    if (currentKey != null && (currentKey.currentState?.validate() ?? false)) {
      if (_currentSection < _totalSections - 1) {
        setState(() => _currentSection++);
        _pageController.nextPage(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOutCubic,
        );
      } else {
        _submitForm();
      }
    }
  }

  void _previousSection() {
    if (_currentSection > 0) {
      setState(() => _currentSection--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  GlobalKey<FormState>? _getCurrentFormKey() {
    switch (_currentSection) {
      case 0: return _personalFormKey;
      case 1: return _contactFormKey;
      case 2: return _birthFormKey;
      case 3: return _professionalFormKey;
      default: return null;
    }
  }

  Future<void> _submitForm() async {
    final currentKey = _getCurrentFormKey();
    if (currentKey != null && !(currentKey.currentState?.validate() ?? false)) return;
    
    if (!_acceptTerms) {
      _showMessage('Please accept the terms and conditions', isError: true);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _authService.register(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        password: _passwordController.text,
        userType: _userType,
        dateOfBirth: _selectedDate,
        timeOfBirth: _selectedTime,
        placeOfBirth: _placeOfBirthController.text.trim().isEmpty ? null : _placeOfBirthController.text.trim(),
        bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
        experience: _experienceController.text.trim().isEmpty ? null : _experienceController.text.trim(),
        languages: _languagesController.text.trim().isEmpty ? null : _languagesController.text.trim(),
        specializations: _specializationsController.text.trim().isEmpty ? null : _specializationsController.text.trim(),
      );

      if (result.success && mounted) {
        if (widget.isAdvanced) {
          _showMessage(
            'Application submitted successfully! We\'ll review your profile and notify you once approved.',
            duration: const Duration(seconds: 4),
          );
          await Future.delayed(const Duration(seconds: 1));
          if (mounted) Navigator.pop(context);
        } else {
          _showMessage('Account created successfully! Welcome aboard.');
          Navigator.pushReplacementNamed(context, '/customer/home');
        }
      } else if (mounted) {
        _showMessage(result.message ?? 'Registration failed', isError: true);
      }
    } catch (e) {
      if (mounted) _showMessage('Error: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showMessage(String message, {bool isError = false, Duration? duration}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        duration: duration ?? const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          _buildProgressIndicator(),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildPersonalSection(),
                _buildContactSection(),
                _buildBirthSection(),
                if (widget.isAdvanced) _buildProfessionalSection(),
              ],
            ),
          ),
          _buildNavigationBar(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      leading: IconButton(
        onPressed: _currentSection > 0 ? _previousSection : () => Navigator.pop(context),
        icon: Icon(
          _currentSection > 0 ? Icons.arrow_back_ios : Icons.close,
          color: AppColors.textPrimary,
          size: 22,
        ),
      ),
      title: Text(
        widget.isAdvanced ? 'Join as Professional' : 'Create Account',
        style: AppTextStyles.heading4.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: true,
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.fromLTRB(32, 8, 32, 24),
      child: Column(
        children: [
          Row(
            children: List.generate(_totalSections, (index) {
              final isActive = index <= _currentSection;
              
              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index == _totalSections - 1 ? 0 : 8),
                  height: 3,
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.primary : AppColors.grey300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
          Text(
            _getSectionTitle(_currentSection),
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _getSectionSubtitle(_currentSection),
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  String _getSectionTitle(int section) {
    switch (section) {
      case 0: return 'Personal Information';
      case 1: return 'Contact & Security';
      case 2: return 'Birth Details';
      case 3: return 'Professional Profile';
      default: return '';
    }
  }

  String _getSectionSubtitle(int section) {
    switch (section) {
      case 0: return 'Tell us who you are';
      case 1: return 'Secure your account';
      case 2: return 'For personalized guidance';
      case 3: return 'Share your expertise';
      default: return '';
    }
  }

  Widget _buildPersonalSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _personalFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            _buildTextField(
              controller: _nameController,
              label: 'Full Name',
              icon: Icons.person_outline_rounded,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Full name is required';
                if (value!.trim().length < 2) return 'Name must be at least 2 characters';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _emailController,
              label: 'Email Address',
              icon: Icons.mail_outline_rounded,
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Email is required';
                if (!EmailValidator.validate(value!)) return 'Please enter a valid email';
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _contactFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            _buildTextField(
              controller: _phoneController,
              label: 'Phone Number',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              prefix: '+91 ',
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Phone number is required';
                if (value!.length != 10) return 'Please enter a valid 10-digit phone number';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _passwordController,
              label: 'Password',
              icon: Icons.lock_outline_rounded,
              obscureText: _obscurePassword,
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                icon: Icon(
                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ),
              validator: (value) {
                if (value?.isEmpty ?? true) return 'Password is required';
                if (value!.length < 8) return 'Password must be at least 8 characters';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              icon: Icons.lock_outline_rounded,
              obscureText: _obscureConfirmPassword,
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                icon: Icon(
                  _obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ),
              validator: (value) {
                if (value?.isEmpty ?? true) return 'Please confirm your password';
                if (value != _passwordController.text) return 'Passwords do not match';
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBirthSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _birthFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            _buildDateTimeField(
              controller: _dateOfBirthController,
              label: 'Date of Birth',
              icon: Icons.cake_outlined,
              onTap: _selectDate,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Date of birth is required';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildDateTimeField(
              controller: _timeOfBirthController,
              label: 'Time of Birth',
              icon: Icons.schedule_outlined,
              onTap: _selectTime,
              isOptional: true,
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _placeOfBirthController,
              label: 'Place of Birth',
              icon: Icons.location_on_outlined,
              isOptional: true,
            ),
            const SizedBox(height: 32),
            _buildTermsCheckbox(),
          ],
        ),
      ),
    );
  }

  Widget _buildProfessionalSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _professionalFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            _buildTextField(
              controller: _experienceController,
              label: 'Years of Experience',
              icon: Icons.work_outline_rounded,
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Experience is required';
                final years = int.tryParse(value!);
                if (years == null || years < 1) return 'Please enter valid years of experience';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _bioController,
              label: 'Professional Bio',
              icon: Icons.description_outlined,
              maxLines: 4,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Bio is required';
                if (value!.trim().length < 50) return 'Bio must be at least 50 characters';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _educationController,
              label: 'Education & Qualifications',
              icon: Icons.school_outlined,
              maxLines: 2,
              isOptional: true,
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _languagesController,
              label: 'Languages',
              icon: Icons.language_outlined,
              hint: 'e.g. English, Hindi, Tamil',
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Languages are required';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _specializationsController,
              label: 'Specializations',
              icon: Icons.auto_awesome_outlined,
              hint: 'e.g. Vedic Astrology, Numerology, Tarot',
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Specializations are required';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _skillsController,
              label: 'Additional Skills',
              icon: Icons.stars_outlined,
              hint: 'e.g. Palmistry, Face Reading, Gemology',
              isOptional: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? prefix,
    String? hint,
    int maxLines = 1,
    bool isOptional = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (isOptional) ...[
              const SizedBox(width: 4),
              Text(
                '(optional)',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            validator: validator,
            keyboardType: keyboardType,
            obscureText: obscureText,
            maxLines: maxLines,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: hint ?? 'Enter your $label',
              hintStyle: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.normal,
              ),
              prefixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              suffixIcon: suffixIcon,
              prefixText: prefix,
              prefixStyle: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              filled: false,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              errorStyle: AppTextStyles.bodySmall.copyWith(
                color: AppColors.error,
                height: 1.4,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateTimeField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    String? Function(String?)? validator,
    bool isOptional = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (isOptional) ...[
              const SizedBox(width: 4),
              Text(
                '(optional)',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            readOnly: true,
            onTap: onTap,
            validator: validator,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: 'Select your $label',
              hintStyle: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.normal,
              ),
              prefixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              suffixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textSecondary,
                  size: 22,
                ),
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              filled: false,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              errorStyle: AppTextStyles.bodySmall.copyWith(
                color: AppColors.error,
                height: 1.4,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTermsCheckbox() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 2),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(6),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Checkbox(
            value: _acceptTerms,
            onChanged: (value) => setState(() => _acceptTerms = value ?? false),
            activeColor: AppColors.primary,
            checkColor: AppColors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            side: BorderSide(
              color: _acceptTerms ? AppColors.primary : AppColors.grey400,
              width: 2,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _acceptTerms = !_acceptTerms),
            child: Padding(
              padding: const EdgeInsets.only(top: 14),
              child: RichText(
                text: TextSpan(
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textPrimary,
                    height: 1.5,
                  ),
                  children: [
                    const TextSpan(text: 'I agree to the '),
                    TextSpan(
                      text: 'Terms of Service',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                    const TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNavigationBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _nextSection,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              elevation: 0,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                    ),
                  )
                : Text(
                    _currentSection == _totalSections - 1 
                        ? (widget.isAdvanced ? 'Submit Application' : 'Create Account')
                        : 'Continue',
                    style: AppTextStyles.buttonLarge.copyWith(fontWeight: FontWeight.w600),
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now().subtract(const Duration(days: 6570)),
      firstDate: DateTime(1950),
      lastDate: DateTime.now().subtract(const Duration(days: 4380)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: AppColors.white,
              surface: AppColors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _dateOfBirthController.text = DateFormat('dd MMMM yyyy').format(picked);
      });
    }
  }

  Future<void> _selectTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: AppColors.white,
              surface: AppColors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedTime) {
      setState(() {
        _selectedTime = picked;
        _timeOfBirthController.text = picked.format(context);
      });
    }
  }
}