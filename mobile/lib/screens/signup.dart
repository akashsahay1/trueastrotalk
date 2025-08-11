import 'package:flutter/material.dart';
import 'package:email_validator/email_validator.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
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
  // Dynamic options loaded from API
  List<String> _availableLanguages = [];
  List<String> _availableSkills = [];

  final PageController _pageController = PageController();
  late final AuthService _authService;

  // Form controllers - organized by sections
  final _personalFormKey = GlobalKey<FormState>();
  final _contactFormKey = GlobalKey<FormState>();
  final _birthFormKey = GlobalKey<FormState>();
  final _professionalFormKey = GlobalKey<FormState>();
  final _addressFormKey = GlobalKey<FormState>();
  final _ratesFormKey = GlobalKey<FormState>();

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

  // Address Information
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _countryController = TextEditingController();
  final _zipController = TextEditingController();

  // Rate Information (for astrologers)
  final _callRateController = TextEditingController();
  final _chatRateController = TextEditingController();
  final _videoRateController = TextEditingController();

  // Form state
  int _currentSection = 0;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptTerms = false;
  bool _isLoading = false;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  // Google login data
  String? _googleAccessToken;
  String? _authType;
  bool _isGoogleLogin = false;

  // Profile image
  File? _selectedProfileImage;

  // Professional checkbox selections
  final Set<String> _selectedLanguages = <String>{};
  final Set<String> _selectedSkills = <String>{};

  // Qualifications repeater field
  final List<String> _qualificationsList = [];
  final TextEditingController _qualificationController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadAstrologerOptions();

    // Set default country
    _countryController.text = 'India';

    // Check for Google login arguments after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleRouteArguments();
    });
  }

  Future<void> _loadAstrologerOptions() async {
    try {
      final options = await _authService.getAstrologerOptions();

      if (mounted) {
        setState(() {
          _availableLanguages = options['languages'] ?? [];
          _availableSkills = options['skills'] ?? [];
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {});
        // Handle error - show snackbar or dialog
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load options: $e')));
      }
    }
  }

  void _handleRouteArguments() {
    final arguments = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (arguments != null) {
      final name = arguments['name'] as String?;
      final email = arguments['email'] as String?;
      final googleAccessToken = arguments['google_access_token'] as String?;
      final authType = arguments['auth_type'] as String?;

      if (name != null && email != null && googleAccessToken != null && authType == 'google') {
        setState(() {
          _nameController.text = name;
          _emailController.text = email;
          _googleAccessToken = googleAccessToken;
          _authType = authType;
          _isGoogleLogin = true;
          // Start from section 1 (contact) since Google provides name and email
          _currentSection = 1;
        });

        // Navigate to the contact section
        _pageController.animateToPage(1, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      }
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    // Dispose all controllers
    for (final controller in [
      _nameController,
      _emailController,
      _phoneController,
      _passwordController,
      _confirmPasswordController,
      _dateOfBirthController,
      _timeOfBirthController,
      _placeOfBirthController,
      _bioController,
      _experienceController,
      _qualificationController,
      _addressController,
      _cityController,
      _stateController,
      _countryController,
      _zipController,
      _callRateController,
      _chatRateController,
      _videoRateController,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  int get _totalSections => widget.isAdvanced ? 6 : 3; // Personal, Contact, Birth, Professional, Address, Rates for astrologers

  UserType get _userType => widget.isAdvanced ? UserType.astrologer : UserType.customer;

  void _nextSection() {
    final currentKey = _getCurrentFormKey();
    bool isFormValid = currentKey != null && (currentKey.currentState?.validate() ?? false);

    // Additional validation for professional section (checkboxes)
    if (_currentSection == 3 && widget.isAdvanced) {
      isFormValid = isFormValid && _validateProfessionalSection();
    }

    if (isFormValid) {
      if (_currentSection < _totalSections - 1) {
        setState(() => _currentSection++);
        _pageController.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOutCubic);
      } else {
        _submitForm();
      }
    }
  }

  void _previousSection() {
    if (_currentSection > 0) {
      setState(() => _currentSection--);
      _pageController.previousPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOutCubic);
    }
  }

  GlobalKey<FormState>? _getCurrentFormKey() {
    switch (_currentSection) {
      case 0:
        return _personalFormKey;
      case 1:
        return _contactFormKey;
      case 2:
        return _birthFormKey;
      case 3:
        return _professionalFormKey;
      case 4:
        return _addressFormKey;
      case 5:
        return _ratesFormKey;
      default:
        return null;
    }
  }

  // Custom validation for professional section checkboxes
  bool _validateProfessionalSection() {
    bool isValid = true;

    // Validate languages
    if (_selectedLanguages.isEmpty) {
      _showMessage('Please select at least one language', isError: true);
      isValid = false;
    }

    // Validate qualifications
    if (_qualificationsList.isEmpty) {
      _showMessage('Please add at least one qualification', isError: true);
      isValid = false;
    }

    // Validate skills
    if (_selectedSkills.length < 2) {
      _showMessage('Please select at least 2 skills', isError: true);
      isValid = false;
    }

    return isValid;
  }

  // Add qualification to list
  void _addQualification() {
    if (_qualificationController.text.trim().isNotEmpty) {
      setState(() {
        _qualificationsList.add(_qualificationController.text.trim());
        _qualificationController.clear();
      });
    }
  }

  // Remove qualification from list
  void _removeQualification(int index) {
    setState(() {
      _qualificationsList.removeAt(index);
    });
  }

  Future<void> _submitForm() async {
    final currentKey = _getCurrentFormKey();
    if (currentKey != null && !(currentKey.currentState?.validate() ?? false)) {
      return;
    }

    if (!_acceptTerms) {
      _showMessage('Please accept the terms and conditions', isError: true);
      return;
    }

    setState(() => _isLoading = true);

    try {
      // For Google login, use registerWithEmailPassword directly with Google data
      if (_isGoogleLogin && _googleAccessToken != null) {
        try {
          await _authService.registerWithEmailPassword(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: '', // No password for Google users
            phone: _phoneController.text.trim(),
            role: _userType == UserType.customer ? 'customer' : 'astrologer',
            dateOfBirth: _selectedDate,
            timeOfBirth: _selectedTime != null ? '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}' : null,
            placeOfBirth: _placeOfBirthController.text.trim().isEmpty ? null : _placeOfBirthController.text.trim(),
            authType: _authType,
            googleAccessToken: _googleAccessToken,
            bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
            experience: _experienceController.text.trim().isEmpty ? null : _experienceController.text.trim(),
            languages: _selectedLanguages.isEmpty ? null : _selectedLanguages.join(', '),
            specializations: _qualificationsList.isEmpty ? null : _qualificationsList.join(', '),
            skills: _selectedSkills.isEmpty ? null : _selectedSkills.join(', '),
            address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
            city: _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
            state: _stateController.text.trim().isEmpty ? null : _stateController.text.trim(),
            country: _countryController.text.trim().isEmpty ? null : _countryController.text.trim(),
            zip: _zipController.text.trim().isEmpty ? null : _zipController.text.trim(),
            callRate: _callRateController.text.trim().isEmpty ? null : double.tryParse(_callRateController.text.trim()),
            chatRate: _chatRateController.text.trim().isEmpty ? null : double.tryParse(_chatRateController.text.trim()),
            videoRate: _videoRateController.text.trim().isEmpty ? null : double.tryParse(_videoRateController.text.trim()),
            profileImagePath: _selectedProfileImage?.path,
          );
        } on AstrologerRegistrationSuccessException {
          if (mounted) {
            _showSuccessDialog('Application submitted successfully! We\'ll review your profile and notify you once approved.', onConfirm: () => Navigator.pop(context));
          }
          return;
        } on CustomerExistsException {
          // User exists and has been logged in automatically
          if (mounted) {
            _showSuccessDialog('Welcome back!', onConfirm: () => Navigator.pushReplacementNamed(context, '/customer/home'));
          }
          return;
        }

        // Handle successful Google registration for customer
        if (mounted) {
          _showSuccessDialog('Account created successfully! Welcome aboard.', onConfirm: () => Navigator.pushReplacementNamed(context, '/customer/home'));
        }
        return;
      }

      // Regular registration flow
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
        languages: _selectedLanguages.isEmpty ? null : _selectedLanguages.join(', '),
        specializations: _qualificationsList.isEmpty ? null : _qualificationsList.join(', '),
        skills: _selectedSkills.isEmpty ? null : _selectedSkills.join(', '),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        city: _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
        state: _stateController.text.trim().isEmpty ? null : _stateController.text.trim(),
        country: _countryController.text.trim().isEmpty ? null : _countryController.text.trim(),
        zip: _zipController.text.trim().isEmpty ? null : _zipController.text.trim(),
        callRate: _callRateController.text.trim().isEmpty ? null : double.tryParse(_callRateController.text.trim()),
        chatRate: _chatRateController.text.trim().isEmpty ? null : double.tryParse(_chatRateController.text.trim()),
        videoRate: _videoRateController.text.trim().isEmpty ? null : double.tryParse(_videoRateController.text.trim()),
        profileImagePath: _selectedProfileImage?.path,
      );

      if (result.success && mounted) {
        if (widget.isAdvanced) {
          _showSuccessDialog('Application submitted successfully! We\'ll review your profile and notify you once approved.', onConfirm: () => Navigator.pop(context));
        } else {
          _showSuccessDialog('Account created successfully! Welcome aboard.', onConfirm: () => Navigator.pushReplacementNamed(context, '/customer/home'));
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
    if (isError) {
      // Show error dialog for better visibility
      _showErrorDialog(message);
    } else {
      // Keep snackbar for success messages
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.success,
          duration: duration ?? const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Error Icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Icon(Icons.error_outline, color: AppColors.error, size: 48),
              ),
              const SizedBox(height: 16),
              // Error title
              Text(
                'Oops!',
                textAlign: TextAlign.center,
                style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              // Error message
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 24),
              // OK Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.error,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text('OK', style: AppTextStyles.buttonMedium.copyWith(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showSuccessDialog(String message, {VoidCallback? onConfirm}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Success Icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Icon(Icons.check_circle, color: AppColors.success, size: 48),
              ),
              const SizedBox(height: 16),
              // Thank you text
              Text(
                'Thank you!',
                textAlign: TextAlign.center,
                style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              // Message
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 24),
              // Continue Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    onConfirm?.call();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                  child: Text('Continue', style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white)),
                ),
              ),
            ],
          ),
        );
      },
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
                if (widget.isAdvanced) ...[_buildProfessionalSection(), _buildAddressSection(), _buildRatesSection()],
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
        icon: Icon(_currentSection > 0 ? Icons.arrow_back_ios : Icons.close, color: AppColors.textPrimary, size: 22),
      ),
      title: Text(
        widget.isAdvanced ? 'Join as Astrologer' : 'Create Account',
        style: AppTextStyles.heading4.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
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
                  decoration: BoxDecoration(color: isActive ? AppColors.primary : AppColors.grey300, borderRadius: BorderRadius.circular(2)),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
          Text(
            _getSectionTitle(_currentSection),
            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(_getSectionSubtitle(_currentSection), style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  String _getSectionTitle(int section) {
    switch (section) {
      case 0:
        return 'Personal Information';
      case 1:
        return 'Contact & Security';
      case 2:
        return 'Birth Details';
      case 3:
        return 'Professional Profile';
      default:
        return '';
    }
  }

  String _getSectionSubtitle(int section) {
    switch (section) {
      case 0:
        return _isGoogleLogin ? 'Confirm your details' : 'Tell us who you are';
      case 1:
        return _isGoogleLogin ? 'Add your contact info' : 'Secure your account';
      case 2:
        return 'For personalized guidance';
      case 3:
        return 'Share your expertise';
      default:
        return '';
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
            // Profile Image Selection
            if (widget.isAdvanced) ...[
              Text(
                'Profile Photo',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Center(
                child: GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary.withAlpha(3), width: 2),
                      color: AppColors.grey100,
                    ),
                    child: _selectedProfileImage != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(60),
                            child: Image.file(_selectedProfileImage!, fit: BoxFit.cover, width: 120, height: 120),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.camera_alt_outlined, size: 32, color: AppColors.primary),
                              const SizedBox(height: 4),
                              Text(
                                'Add Photo',
                                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
            _buildTextField(
              controller: _nameController,
              label: 'Full Name',
              icon: Icons.person_outline_rounded,
              readOnly: _isGoogleLogin,
              hint: _isGoogleLogin ? 'From your Google account' : null,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) {
                  return 'Full name is required';
                }
                if (value!.trim().length < 2) {
                  return 'Name must be at least 2 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _phoneController,
              label: 'Phone Number',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              prefix: '+91 ',
              validator: (value) {
                if (value?.trim().isEmpty ?? true) {
                  return 'Phone number is required';
                }
                if (value!.length != 10) {
                  return 'Please enter a valid 10-digit phone number';
                }
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
            // Show email field for Google users (read-only) or regular users
            if (!_isGoogleLogin) ...[
              _buildTextField(
                controller: _emailController,
                label: 'Email Address',
                icon: Icons.mail_outline_rounded,
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value?.trim().isEmpty ?? true) return 'Email is required';
                  if (!EmailValidator.validate(value!)) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
            ],
            // Show read-only email for Google users
            if (_isGoogleLogin) ...[_buildTextField(controller: _emailController, label: 'Email Address', icon: Icons.mail_outline_rounded, keyboardType: TextInputType.emailAddress, readOnly: true, hint: 'From your Google account'), const SizedBox(height: 24)],
            // Only show password fields for non-Google users
            if (!_isGoogleLogin) ...[
              _buildTextField(
                controller: _passwordController,
                label: 'Password',
                icon: Icons.lock_outline_rounded,
                obscureText: _obscurePassword,
                suffixIcon: IconButton(
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textSecondary, size: 20),
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) return 'Password is required';
                  if (value!.length < 8) {
                    return 'Password must be at least 8 characters';
                  }
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
                  icon: Icon(_obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textSecondary, size: 20),
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please confirm your password';
                  }
                  if (value != _passwordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
            ],
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
                if (value?.trim().isEmpty ?? true) {
                  return 'Date of birth is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildDateTimeField(controller: _timeOfBirthController, label: 'Time of Birth', icon: Icons.schedule_outlined, onTap: _selectTime, isOptional: true),
            const SizedBox(height: 24),
            _buildTextField(controller: _placeOfBirthController, label: 'Place of Birth', icon: Icons.location_on_outlined, isOptional: true),
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
              hint: 'Enter years (1-80)',
              validator: (value) {
                if (value?.trim().isEmpty ?? true) {
                  return 'Experience is required';
                }
                final years = int.tryParse(value!);
                if (years == null || years < 1) {
                  return 'Please enter valid years of experience';
                }
                if (years > 80) {
                  return 'Experience cannot exceed 80 years';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextAreaField(
              controller: _bioController,
              label: 'Professional Bio',
              hint: 'Tell us about your experience and approach to astrology...',
              showCharacterCount: true,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Bio is required';
                if (value!.trim().length < 10) {
                  return 'Bio must be at least 10 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildQualificationsRepeaterField(),
            const SizedBox(height: 24),
            _buildMultiSelectField(label: 'Languages (min. 1 required)', selectedItems: _selectedLanguages, availableItems: _availableLanguages, onTap: () => _showLanguagesDropdown()),
            const SizedBox(height: 24),
            _buildMultiSelectField(label: 'Skills (min. 2 required)', selectedItems: _selectedSkills, availableItems: _availableSkills, onTap: () => _showSkillsDropdown()),
          ],
        ),
      ),
    );
  }

  // Text field builder without icon (for textarea fields)
  Widget _buildTextAreaField({required TextEditingController controller, required String label, String? Function(String?)? validator, String? hint, int maxLines = 4, bool isOptional = false, bool showCharacterCount = false, int? maxLength}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            if (isOptional) ...[
              const SizedBox(width: 4),
              Text(
                '(optional)',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, fontStyle: FontStyle.italic),
              ),
            ],
            const Spacer(),
            if (showCharacterCount) ...[
              AnimatedBuilder(
                animation: controller,
                builder: (context, child) {
                  final currentLength = controller.text.length;
                  final displayText = maxLength != null ? '$currentLength/$maxLength' : '$currentLength characters';

                  return Text(
                    displayText,
                    style: AppTextStyles.bodySmall.copyWith(color: maxLength != null && currentLength > maxLength ? AppColors.error : AppColors.textSecondary, fontWeight: FontWeight.w500),
                  );
                },
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: TextFormField(
            controller: controller,
            validator: validator,
            maxLines: maxLines,
            maxLength: maxLength,
            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: hint ?? '',
              hintStyle: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.normal),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              filled: false,
              contentPadding: const EdgeInsets.all(20),
              errorStyle: AppTextStyles.bodySmall.copyWith(color: AppColors.error, height: 1.4),
              counterText: '', // Hide default counter since we show custom one
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMultiSelectField({required String label, required Set<String> selectedItems, required List<String> availableItems, required VoidCallback onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (selectedItems.isNotEmpty) ...[
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: selectedItems.map((item) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                                child: Text(
                                  item,
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w500),
                                ),
                              );
                            }).toList(),
                          ),
                        ] else ...[
                          Text(
                            'Tap to select',
                            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.normal),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Icon(Icons.arrow_drop_down, color: AppColors.textSecondary, size: 24),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showLanguagesDropdown() {
    _showMultiSelectDropdown(
      title: 'Select Languages',
      items: _availableLanguages,
      selectedItems: _selectedLanguages,
      onSelectionChanged: (updatedSelection) {
        setState(() {
          _selectedLanguages.clear();
          _selectedLanguages.addAll(updatedSelection);
        });
      },
      minSelections: 1,
    );
  }

  void _showSkillsDropdown() {
    _showMultiSelectDropdown(
      title: 'Select Skills',
      items: _availableSkills,
      selectedItems: _selectedSkills,
      onSelectionChanged: (updatedSelection) {
        setState(() {
          _selectedSkills.clear();
          _selectedSkills.addAll(updatedSelection);
        });
      },
      minSelections: 2,
    );
  }

  void _showMultiSelectDropdown({required String title, required List<String> items, required Set<String> selectedItems, required Function(Set<String>) onSelectionChanged, required int minSelections}) {
    Set<String> tempSelection = Set.from(selectedItems);

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text('Select minimum $minSelections ${minSelections == 1 ? 'item' : 'items'}', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                height: 400,
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isSelected = tempSelection.contains(item);

                    return CheckboxListTile(
                      title: Text(item, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimary)),
                      value: isSelected,
                      activeColor: AppColors.primary,
                      onChanged: (bool? value) {
                        setModalState(() {
                          if (value == true) {
                            tempSelection.add(item);
                          } else {
                            tempSelection.remove(item);
                          }
                        });
                      },
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    );
                  },
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text('Cancel', style: AppTextStyles.buttonMedium.copyWith(color: AppColors.textSecondary)),
                ),
                ElevatedButton(
                  onPressed: tempSelection.length >= minSelections
                      ? () {
                          onSelectionChanged(tempSelection);
                          Navigator.of(context).pop();
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text('Done (${tempSelection.length})', style: AppTextStyles.buttonMedium.copyWith(fontWeight: FontWeight.w600)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildQualificationsRepeaterField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Qualifications',
          style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Input field for new qualification
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _qualificationController,
                        decoration: InputDecoration(
                          hintText: 'Add a qualification (e.g., M.A. in Astrology)',
                          hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppColors.textSecondary.withValues(alpha: 0.3)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppColors.textSecondary.withValues(alpha: 0.3)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppColors.primary, width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimary),
                        onFieldSubmitted: (_) => _addQualification(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Material(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8),
                      child: InkWell(
                        onTap: _addQualification,
                        borderRadius: BorderRadius.circular(8),
                        child: const SizedBox(width: 40, height: 40, child: Icon(Icons.add, color: AppColors.white, size: 20)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Display added qualifications
                if (_qualificationsList.isNotEmpty) ...[
                  Text(
                    'Added Qualifications:',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  ...List.generate(_qualificationsList.length, (index) {
                    final qualification = _qualificationsList[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  qualification,
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
                                ),
                              ),
                              InkWell(
                                onTap: () => _removeQualification(index),
                                borderRadius: BorderRadius.circular(12),
                                child: const SizedBox(width: 24, height: 24, child: Icon(Icons.close, color: AppColors.error, size: 16)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ] else ...[
                  Text(
                    'No qualifications added yet',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, fontStyle: FontStyle.italic),
                  ),
                ],
                // Validation error message
                if (_qualificationsList.isEmpty)
                  Builder(
                    builder: (context) {
                      // Check if form has been validated and show error
                      return const SizedBox.shrink();
                    },
                  ),
              ],
            ),
          ),
        ),
      ],
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
    bool readOnly = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            if (isOptional) ...[
              const SizedBox(width: 4),
              Text(
                '(optional)',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, fontStyle: FontStyle.italic),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: TextFormField(
            controller: controller,
            validator: validator,
            keyboardType: keyboardType,
            obscureText: obscureText,
            maxLines: maxLines,
            readOnly: readOnly,
            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: hint ?? '',
              hintStyle: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.normal),
              prefixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              suffixIcon: suffixIcon,
              prefixText: prefix,
              prefixStyle: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              filled: false,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              errorStyle: AppTextStyles.bodySmall.copyWith(color: AppColors.error, height: 1.4),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateTimeField({required TextEditingController controller, required String label, required IconData icon, required VoidCallback onTap, String? Function(String?)? validator, bool isOptional = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            if (isOptional) ...[
              const SizedBox(width: 4),
              Text(
                '(optional)',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, fontStyle: FontStyle.italic),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: TextFormField(
            controller: controller,
            readOnly: true,
            onTap: onTap,
            validator: validator,
            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: 'Select your $label',
              hintStyle: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.normal),
              prefixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              suffixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary, size: 22),
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              filled: false,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              errorStyle: AppTextStyles.bodySmall.copyWith(color: AppColors.error, height: 1.4),
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
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Checkbox(
            value: _acceptTerms,
            onChanged: (value) => setState(() => _acceptTerms = value ?? false),
            activeColor: AppColors.primary,
            checkColor: AppColors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            side: BorderSide(color: _acceptTerms ? AppColors.primary : AppColors.grey400, width: 2),
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
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimary, height: 1.5),
                  children: [
                    const TextSpan(text: 'I agree to the '),
                    TextSpan(
                      text: 'Terms of Service',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                    ),
                    const TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
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
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, -4))],
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
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.white)))
                : Text(_currentSection == _totalSections - 1 ? (widget.isAdvanced ? 'Create Profile' : 'Create Account') : 'Continue', style: AppTextStyles.buttonLarge.copyWith(fontWeight: FontWeight.w600)),
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
            colorScheme: ColorScheme.light(primary: AppColors.primary, onPrimary: AppColors.white, surface: AppColors.white, onSurface: AppColors.textPrimary),
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
            colorScheme: ColorScheme.light(primary: AppColors.primary, onPrimary: AppColors.white, surface: AppColors.white, onSurface: AppColors.textPrimary),
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

  Future<void> _pickImage() async {
    try {
      final ImagePicker picker = ImagePicker();

      // Show dialog to choose between camera and gallery
      final ImageSource? source = await showModalBottomSheet<ImageSource>(
        context: context,
        backgroundColor: AppColors.white,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        builder: (context) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.grey300, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 20),
              Text('Select Profile Photo', style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary)),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _buildImageSourceOption(icon: Icons.camera_alt, label: 'Camera', source: ImageSource.camera),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildImageSourceOption(icon: Icons.photo_library, label: 'Gallery', source: ImageSource.gallery),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      );

      if (source != null) {
        final XFile? image = await picker.pickImage(source: source, maxWidth: 512, maxHeight: 512, imageQuality: 80);

        if (image != null && mounted) {
          setState(() {
            _selectedProfileImage = File(image.path);
          });
        }
      }
    } catch (e) {
      if (mounted) {
        _showMessage('Failed to pick image: ${e.toString()}', isError: true);
      }
    }
  }

  Widget _buildImageSourceOption({required IconData icon, required String label, required ImageSource source}) {
    return InkWell(
      onTap: () => Navigator.pop(context, source),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.grey300),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(label, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimary)),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _addressFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            _buildTextField(
              controller: _addressController,
              label: 'Address',
              icon: Icons.home_outlined,
              maxLines: 3,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Address is required';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _cityController,
              label: 'City',
              icon: Icons.location_city_outlined,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'City is required';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _stateController,
              label: 'State',
              icon: Icons.map_outlined,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'State is required';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _countryController,
              label: 'Country',
              icon: Icons.public_outlined,
              readOnly: true, // Default to India, read-only for now
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Country is required';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _zipController,
              label: 'ZIP/Postal Code',
              icon: Icons.local_post_office_outlined,
              keyboardType: TextInputType.text,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'ZIP/Postal code is required';
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatesSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _ratesFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            Text(
              'Set Your Consultation Rates',
              style: AppTextStyles.heading4.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'These rates will be reviewed and approved by our admin team',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            _buildTextField(
              controller: _callRateController,
              label: 'Call Rate (₹/min)',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Call rate is required';
                final rate = double.tryParse(value!);
                if (rate == null || rate <= 0) return 'Please enter a valid rate';
                if (rate > 1000) return 'Rate cannot exceed ₹1000/min';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _chatRateController,
              label: 'Chat Rate (₹/min)',
              icon: Icons.chat_outlined,
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Chat rate is required';
                final rate = double.tryParse(value!);
                if (rate == null || rate <= 0) return 'Please enter a valid rate';
                if (rate > 1000) return 'Rate cannot exceed ₹1000/min';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _videoRateController,
              label: 'Video Call Rate (₹/min)',
              icon: Icons.videocam_outlined,
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value?.trim().isEmpty ?? true) return 'Video call rate is required';
                final rate = double.tryParse(value!);
                if (rate == null || rate <= 0) return 'Please enter a valid rate';
                if (rate > 1000) return 'Rate cannot exceed ₹1000/min';
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }
}
