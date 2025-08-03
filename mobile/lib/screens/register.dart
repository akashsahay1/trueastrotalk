import 'package:flutter/material.dart';
import 'package:email_validator/email_validator.dart';
import 'package:intl/intl.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/dimensions.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';
import '../../models/enums.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();
  late final AuthService _authService;

  // Controllers for form fields
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dateOfBirthController = TextEditingController();
  final _timeOfBirthController = TextEditingController();
  final _placeOfBirthController = TextEditingController();

  // Form state variables
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  bool _acceptTerms = false;
  String _selectedRole = 'customer'; // Default to customer
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  bool _isGoogleUser = false; // Track if user came from Google Sign-In

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    // Check if we received Google data from login screen
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    
    if (args != null && args['auth_type'] == 'google') {
      // Mark this as a Google user
      _isGoogleUser = true;
      
      // Pre-fill name and email from Google account
      if (_nameController.text.isEmpty) {
        _nameController.text = args['name'] ?? '';
      }
      if (_emailController.text.isEmpty) {
        _emailController.text = args['email'] ?? '';
      }
      // Note: Google users don't need password fields
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _dateOfBirthController.dispose();
    _timeOfBirthController.dispose();
    _placeOfBirthController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Create Account', style: AppTextStyles.heading4.copyWith(color: AppColors.textPrimaryLight)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          controller: _scrollController,
          padding: const EdgeInsets.all(Dimensions.paddingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo
              Center(
                child: Container(
                  width: Dimensions.iconXl * 1.5,
                  height: Dimensions.iconXl * 1.5,
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.2), blurRadius: 15, offset: const Offset(0, 5))],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                    child: Image.asset('assets/images/logo.png', width: Dimensions.iconXl, height: Dimensions.iconXl, fit: BoxFit.contain),
                  ),
                ),
              ),

              const SizedBox(height: Dimensions.spacingLg),

              // Welcome Text
              Text(
                'Join True Astrotalk',
                style: AppTextStyles.heading3.copyWith(color: AppColors.textPrimaryLight),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: Dimensions.spacingSm),

              Text(
                'Create your account to get started',
                style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondaryLight),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: Dimensions.spacingXl),

              // Registration Form
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Role Selection
                    Text(
                      'What would you like to do?',
                      style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.w600),
                    ),

                    const SizedBox(height: Dimensions.spacingSm),

                    // Role Radio Buttons
                    Container(
                      padding: const EdgeInsets.all(Dimensions.paddingMd),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: Column(
                        children: [
                          RadioListTile<String>(
                            title: const Text('Get Consultation'),
                            subtitle: const Text('Find and consult with astrologers'),
                            value: 'customer',
                            groupValue: _selectedRole,
                            activeColor: AppColors.primary,
                            onChanged: (value) {
                              setState(() {
                                _selectedRole = value!;
                              });
                            },
                          ),
                          RadioListTile<String>(
                            title: const Text('Give Consultation'),
                            subtitle: const Text('Become an astrologer and help others'),
                            value: 'astrologer',
                            groupValue: _selectedRole,
                            activeColor: AppColors.primary,
                            onChanged: (value) {
                              setState(() {
                                _selectedRole = value!;
                              });
                            },
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: Dimensions.spacingLg),

                    // Full Name Field
                    TextFormField(
                      controller: _nameController,
                      keyboardType: TextInputType.name,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Full Name *', prefixIcon: Icon(Icons.person_outline)),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Full name is required';
                        }
                        if (value.length < 2) {
                          return 'Name must be at least 2 characters';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: Dimensions.spacingMd),

                    // Email Field
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email Address *', prefixIcon: Icon(Icons.email_outlined)),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Email is required';
                        }
                        if (!EmailValidator.validate(value)) {
                          return 'Please enter a valid email';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: Dimensions.spacingMd),

                    // Phone Number Field
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Phone Number *', prefixIcon: Icon(Icons.phone_outlined), prefixText: '+91 '),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Phone number is required';
                        }
                        if (value.length != 10) {
                          return 'Please enter a valid 10-digit phone number';
                        }
                        return null;
                      },
                    ),

                    // Password Fields (only for non-Google users)
                    if (!_isGoogleUser) ...[
                      const SizedBox(height: Dimensions.spacingMd),

                      // Password Field
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'Password *',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Password is required';
                          }
                          if (value.length < 8) {
                            return 'Password must be at least 8 characters';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: Dimensions.spacingMd),

                      // Confirm Password Field
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: _obscureConfirmPassword,
                        decoration: InputDecoration(
                          labelText: 'Confirm Password *',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(_obscureConfirmPassword ? Icons.visibility : Icons.visibility_off),
                            onPressed: () {
                              setState(() {
                                _obscureConfirmPassword = !_obscureConfirmPassword;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please confirm your password';
                          }
                          if (value != _passwordController.text) {
                            return 'Passwords do not match';
                          }
                          return null;
                        },
                      ),
                    ],

                    const SizedBox(height: Dimensions.spacingLg),

                    // Birth Details Section (for Kundli)
                    Text(
                      'Birth Details (Optional - for Kundli)',
                      style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.w600),
                    ),

                    const SizedBox(height: Dimensions.spacingSm),

                    // Date of Birth Field
                    TextFormField(
                      controller: _dateOfBirthController,
                      readOnly: true,
                      decoration: const InputDecoration(labelText: 'Date of Birth', prefixIcon: Icon(Icons.calendar_today_outlined), suffixIcon: Icon(Icons.arrow_drop_down)),
                      onTap: _selectDate,
                    ),

                    const SizedBox(height: Dimensions.spacingMd),

                    // Time of Birth Field
                    TextFormField(
                      controller: _timeOfBirthController,
                      readOnly: true,
                      decoration: const InputDecoration(labelText: 'Time of Birth', prefixIcon: Icon(Icons.access_time_outlined), suffixIcon: Icon(Icons.arrow_drop_down)),
                      onTap: _selectTime,
                    ),

                    const SizedBox(height: Dimensions.spacingMd),

                    // Place of Birth Field
                    TextFormField(
                      controller: _placeOfBirthController,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Place of Birth', prefixIcon: Icon(Icons.location_on_outlined), hintText: 'City, State, Country'),
                    ),

                    const SizedBox(height: Dimensions.spacingLg),

                    // Terms and Conditions
                    CheckboxListTile(
                      title: RichText(
                        text: TextSpan(
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
                          children: const [
                            TextSpan(text: 'I agree to the '),
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
                      value: _acceptTerms,
                      activeColor: AppColors.primary,
                      onChanged: (value) {
                        setState(() {
                          _acceptTerms = value ?? false;
                        });
                      },
                      controlAffinity: ListTileControlAffinity.leading,
                    ),

                    const SizedBox(height: Dimensions.spacingXl),

                    // Register Button
                    ElevatedButton(
                      onPressed: _isLoading || !_acceptTerms ? null : _handleRegistration,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
                        elevation: 2,
                      ),
                      child: _isLoading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.white)))
                          : Text(
                              'Create Account',
                              style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: AppColors.white),
                            ),
                    ),

                    const SizedBox(height: Dimensions.spacingLg),

                    // Divider
                    Row(
                      children: [
                        const Expanded(child: Divider(color: AppColors.borderLight)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingMd),
                          child: Text('OR', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight)),
                        ),
                        const Expanded(child: Divider(color: AppColors.borderLight)),
                      ],
                    ),

                    const SizedBox(height: Dimensions.spacingLg),

                    // Google Sign In Button (hide if user is already from Google)
                    if (!_isGoogleUser) ...[
                      OutlinedButton.icon(
                        onPressed: _isLoading ? null : _handleGoogleSignIn,
                        icon: const Icon(Icons.account_circle, size: 20, color: Colors.red),
                        label: Text('Continue with Google', style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimaryLight)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
                          side: const BorderSide(color: AppColors.borderLight),
                        ),
                      ),
                    ],

                    const SizedBox(height: Dimensions.spacingXl),

                    // Already have account
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Already have an account? ', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight)),
                        TextButton(
                          onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                          child: Text(
                            'Sign In',
                            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: Dimensions.spacingLg),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now().subtract(const Duration(days: 6570)), // 18 years ago
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(colorScheme: Theme.of(context).colorScheme.copyWith(primary: AppColors.primary)),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _dateOfBirthController.text = DateFormat('dd/MM/yyyy').format(picked);
      });
    }
  }

  Future<void> _selectTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(colorScheme: Theme.of(context).colorScheme.copyWith(primary: AppColors.primary)),
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

  Future<void> _handleRegistration() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_acceptTerms) {
      _showSnackBar('Please accept the Terms and Conditions to continue');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Get Google data from arguments if this is a Google user
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      final isGoogleRegistration = args != null && args['auth_type'] == 'google';
      
      if (isGoogleRegistration) {
        // Register Google user via Next.js API
        await _authService.registerWithEmailPassword(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: 'google_auth_placeholder', // Not used for Google users
          phone: '+91${_phoneController.text.trim()}',
          role: _selectedRole,
          dateOfBirth: _selectedDate,
          timeOfBirth: _selectedTime?.format(context),
          placeOfBirth: _placeOfBirthController.text.trim().isEmpty ? null : _placeOfBirthController.text.trim(),
          authType: 'google',
          googleAccessToken: args['google_access_token'],
        );
      } else {
        // Register regular email/password user
        await _authService.registerWithEmailPassword(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          phone: '+91${_phoneController.text.trim()}',
          role: _selectedRole,
          dateOfBirth: _selectedDate,
          timeOfBirth: _selectedTime?.format(context),
          placeOfBirth: _placeOfBirthController.text.trim().isEmpty ? null : _placeOfBirthController.text.trim(),
        );
      }

      // This shouldn't be reached for normal flow since exceptions handle the logic
      if (mounted) {
        if (_selectedRole == 'astrologer') {
          Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
        } else {
          Navigator.pushReplacementNamed(context, '/customer/home');
        }
      }
    } on CustomerExistsException catch (customerException) {
      if (mounted) {
        // Customer exists - log them in automatically by setting current user
        _authService.setCurrentUser(customerException.existingUser, customerException.token);
        Navigator.pushReplacementNamed(context, '/customer/home');
      }
    } on AstrologerExistsException catch (astrologerException) {
      if (mounted) {
        // Astrologer exists - show popup with existing account info
        _showAstrologerExistsPopup(astrologerException.existingUser);
      }
    } on AstrologerRegistrationSuccessException catch (successException) {
      if (mounted) {
        // New astrologer registered successfully - show success popup
        _showAstrologerSuccessPopup(successException.newUser);
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar('Registration failed: ${e.toString().replaceAll('Exception: ', '')}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Sign in with Google via Next.js API
      final user = await _authService.signInWithGoogle();

      if (mounted) {
        // Check if astrologer needs verification
        if (user.role == UserRole.astrologer) {
          if (user.accountStatus != AccountStatus.active || user.verificationStatus != VerificationStatus.verified) {
            // Silently stay on registration screen for unverified astrologers
            return;
          }
        }

        // Navigate based on user role without any success message
        if (user.role == UserRole.customer) {
          Navigator.pushReplacementNamed(context, '/customer/home');
        } else if (user.role == UserRole.astrologer) {
          Navigator.pushReplacementNamed(context, '/astrologer/dashboard');
        }
      }
    } catch (e) {
      // Handle all Google Sign-In errors silently
      if (mounted && e.toString().contains('cancelled')) {
        // User cancelled - do nothing, stay on registration screen
        return;
      }
      // For any other errors, handle them silently
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), duration: const Duration(seconds: 3), backgroundColor: AppColors.primary));
  }

  void _showAstrologerExistsPopup(dynamic existingUser) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLg)),
          title: Row(
            children: [
              Icon(Icons.info_outline, color: AppColors.primary, size: 28),
              const SizedBox(width: Dimensions.spacingSm),
              Expanded(
                child: Text(
                  'Account Already Exists',
                  style: AppTextStyles.heading4.copyWith(color: AppColors.textPrimaryLight),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'An astrologer account with this email already exists.',
                style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimaryLight),
              ),
              const SizedBox(height: Dimensions.spacingMd),
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingMd),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Account Status:',
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: Dimensions.spacingSm),
                    Text(
                      'Your astrologer account is under review by our team. You will receive an email once verified.',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pushReplacementNamed('/login');
              },
              child: Text(
                'Go to Login',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showAstrologerSuccessPopup(dynamic newUser) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusLg)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingSm),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.check_circle, color: AppColors.success, size: 32),
              ),
              const SizedBox(width: Dimensions.spacingMd),
              Expanded(
                child: Text(
                  'Registration Successful!',
                  style: AppTextStyles.heading4.copyWith(color: AppColors.success),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '🎉 Welcome to True Astrotalk!',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textPrimaryLight,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: Dimensions.spacingMd),
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingMd),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.pending_actions, color: AppColors.primary, size: 20),
                        const SizedBox(width: Dimensions.spacingSm),
                        Text(
                          'Account Under Review',
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: Dimensions.spacingSm),
                    Text(
                      'Your astrologer profile is being reviewed by our True Astrotalk team to ensure quality and authenticity.',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
                    ),
                    const SizedBox(height: Dimensions.spacingMd),
                    Row(
                      children: [
                        Icon(Icons.email_outlined, color: AppColors.primary, size: 20),
                        const SizedBox(width: Dimensions.spacingSm),
                        Expanded(
                          child: Text(
                            'You will receive an email with next steps once verified.',
                            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pushReplacementNamed('/login');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
              ),
              child: Text(
                'Continue to Login',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
