import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:email_validator/email_validator.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_places_flutter/google_places_flutter.dart';
import 'package:google_places_flutter/model/prediction.dart';
import 'dart:io';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/utils/error_handler.dart';
import '../common/widgets/google_places_address_field.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';
import '../models/enums.dart';
import '../config/config.dart';
import '../common/utils/validation_patterns.dart';

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
  final _bankDetailsFormKey = GlobalKey<FormState>();

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

  // Bank Details (for astrologers)
  final _accountHolderNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _ifscCodeController = TextEditingController();

  // Form state
  int _currentSection = 0;
  String _selectedGender = 'male';
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptTerms = false;
  bool _isLoading = false;

  // Individual field error states
  String? _nameError;
  String? _phoneError;
  String? _emailError;
  String? _passwordError;
  String? _confirmPasswordError;
  bool _showPasswordRequirements = false;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  // Google login data
  String? _googleAccessToken;
  String? _googleIdToken;
  String? _authType;
  bool _isGoogleLogin = false;

  // Profile image
  File? _selectedProfileImage;
  String? _profilePhotoError;
  
  // PAN card image
  File? _selectedPanCardImage;

  // Professional checkbox selections
  final Set<String> _selectedLanguages = <String>{};
  final Set<String> _selectedSkills = <String>{};
  
  // Experience dropdown
  int? _selectedExperience;
  
  // Professional section error states
  String? _experienceError;
  String? _bioError;
  String? _qualificationsError;
  String? _languagesError;
  String? _skillsError;
  
  // Address section errors
  String? _cityError;
  String? _stateError;
  String? _countryError;
  String? _zipError;
  
  // Rates section errors
  String? _callRateError;
  String? _chatRateError;
  String? _videoRateError;
  
  // Bank details section errors
  String? _accountHolderNameError;
  String? _accountNumberError;
  String? _bankNameError;
  String? _ifscCodeError;
  String? _panCardError;
  String? _termsError;

  // Focus states
  bool _isAddressFocused = false;

  // Qualifications repeater field
  final List<String> _qualificationsList = [];
  final TextEditingController _qualificationController = TextEditingController();

  // Focus nodes for sequential validation
  final _nameFocusNode = FocusNode();
  final _phoneFocusNode = FocusNode();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  final _confirmPasswordFocusNode = FocusNode();
  final _dateOfBirthFocusNode = FocusNode();
  final _timeOfBirthFocusNode = FocusNode();
  final _placeOfBirthFocusNode = FocusNode();
  final _bioFocusNode = FocusNode();
  final _experienceFocusNode = FocusNode();
  final _addressFocusNode = FocusNode();
  final _cityFocusNode = FocusNode();
  final _stateFocusNode = FocusNode();
  final _countryFocusNode = FocusNode();
  final _zipFocusNode = FocusNode();
  final _callRateFocusNode = FocusNode();
  final _chatRateFocusNode = FocusNode();
  final _videoRateFocusNode = FocusNode();
  final _accountHolderNameFocusNode = FocusNode();
  final _accountNumberFocusNode = FocusNode();
  final _bankNameFocusNode = FocusNode();
  final _ifscCodeFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadAstrologerOptions();

    // Set default country
    _countryController.text = 'India';
    
    // Add listener to password controller for reactive validation
    _passwordController.addListener(() {
      if (_passwordController.text.isNotEmpty) {
        // Check if password meets all requirements
        final hasUpperCase = ValidationPatterns.hasUppercase(_passwordController.text);
        final hasLowerCase = ValidationPatterns.hasLowercase(_passwordController.text);
        final hasDigit = ValidationPatterns.hasDigit(_passwordController.text);
        final hasSpecialChar = ValidationPatterns.hasSpecialChar(_passwordController.text);
        final hasMinLength = _passwordController.text.length >= 8;
        
        final meetsAllRequirements = hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar && hasMinLength;
        
        setState(() {
          _showPasswordRequirements = !meetsAllRequirements && _passwordController.text.isNotEmpty;
        });
      } else {
        setState(() {
          _showPasswordRequirements = false;
        });
      }
    });

    // Add address focus listener
    _addressFocusNode.addListener(() {
      final newFocusState = _addressFocusNode.hasFocus;
      if (_isAddressFocused != newFocusState) {
        setState(() {
          _isAddressFocused = newFocusState;
        });
      }
    });

    // Check for Google login arguments after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleRouteArguments();
    });
    
    // Add listeners for validation state updates (triggers button enable/disable)
    _nameController.addListener(() => setState(() {}));
    _phoneController.addListener(() => setState(() {}));
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
    debugPrint('📋 Signup screen arguments: $arguments');
    
    if (arguments != null) {
      final name = arguments['name'] as String?;
      final email = arguments['email'] as String?;
      final googleAccessToken = arguments['google_access_token'] as String?;
      final googleIdToken = arguments['google_id_token'] as String?;
      final authType = arguments['auth_type'] as String?;

      debugPrint('📋 Parsed arguments - Name: $name, Email: $email, AuthType: $authType');

      if (name != null && email != null && googleAccessToken != null && googleIdToken != null && authType == 'google') {
        debugPrint('✅ Setting up Google signup with pre-filled data');
        setState(() {
          _nameController.text = name;
          _emailController.text = email;
          _googleAccessToken = googleAccessToken;
          _googleIdToken = googleIdToken;
          _authType = authType;
          _isGoogleLogin = true;
          // Start from section 1 (contact) since Google provides name and email
          _currentSection = 1;
        });

        // Navigate to the contact section
        _pageController.animateToPage(1, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      } else {
        debugPrint('❌ Google signup arguments missing or invalid');
      }
    } else {
      debugPrint('📋 No arguments provided to signup screen');
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
      _accountHolderNameController,
      _accountNumberController,
      _bankNameController,
      _ifscCodeController,
    ]) {
      controller.dispose();
    }
    
    // Dispose all focus nodes
    for (final focusNode in [
      _nameFocusNode,
      _phoneFocusNode,
      _emailFocusNode,
      _passwordFocusNode,
      _confirmPasswordFocusNode,
      _dateOfBirthFocusNode,
      _timeOfBirthFocusNode,
      _placeOfBirthFocusNode,
      _bioFocusNode,
      _experienceFocusNode,
      _addressFocusNode,
      _cityFocusNode,
      _stateFocusNode,
      _countryFocusNode,
      _zipFocusNode,
      _callRateFocusNode,
      _chatRateFocusNode,
      _videoRateFocusNode,
      _accountHolderNameFocusNode,
      _accountNumberFocusNode,
      _bankNameFocusNode,
      _ifscCodeFocusNode,
    ]) {
      focusNode.dispose();
    }
    
    super.dispose();
  }

  int get _totalSections => widget.isAdvanced ? 6 : 3; // Personal, Contact, Professional, Address, Rates, Bank Details for astrologers (Birth Details removed)

  UserType get _userType => widget.isAdvanced ? UserType.astrologer : UserType.customer;

  void _nextSection() {
    // Validate current section one field at a time
    final firstError = _validateCurrentSectionSequentially();
    
    if (firstError != null) {
      // All sections now have inline error display, no need for alert dialogs
      // Just return to show the inline errors
      return;
    }
    
    // All validations passed, proceed to next section
    if (_currentSection < _totalSections - 1) {
      setState(() => _currentSection++);
      _pageController.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOutCubic);
    } else {
      _submitForm();
    }
  }

  void _previousSection() {
    if (_currentSection > 0) {
      setState(() => _currentSection--);
      _pageController.previousPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOutCubic);
    }
  }

  /// Check if current section is valid (for button enabling/disabling)
  bool _isCurrentSectionValid() {
    return _validateCurrentSectionSequentially() == null;
  }

  /// Validate current section sequentially, showing only the first error
  String? _validateCurrentSectionSequentially() {
    switch (_currentSection) {
      case 0: // Personal Information
        return _validatePersonalSection();
      case 1: // Contact & Security
        return _validateContactSection();
      case 2:
        if (widget.isAdvanced) {
          // Professional Profile (astrologer only)
          return _validateProfessionalSectionSequential();
        } else {
          // Birth Details (customer only)
          return _validateBirthSection();
        }
      case 3: // Address (astrologer only)
        return _validateAddressSection();
      case 4: // Rates (astrologer only)
        return _validateRatesSection();
      case 5: // Bank Details (astrologer only)
        return _validateBankDetailsSection();
      default:
        return null;
    }
  }

  String? _validatePersonalSection() {
    // Clear all previous errors
    setState(() {
      _profilePhotoError = null;
      _nameError = null;
      _phoneError = null;
    });

    // For astrologers, check profile photo first since it appears at the top
    if (widget.isAdvanced && _selectedProfileImage == null) {
      setState(() {
        _profilePhotoError = 'Profile photo is required';
      });
      return 'Profile photo is required';
    }

    // Check name field
    if (_nameController.text.trim().isEmpty) {
      setState(() {
        _nameError = 'Full name is required';
      });
      _nameFocusNode.requestFocus();
      return 'Full name is required';
    }
    if (_nameController.text.trim().length < 2) {
      setState(() {
        _nameError = 'Name must be at least 2 characters';
      });
      _nameFocusNode.requestFocus();
      return 'Name must be at least 2 characters';
    }

    // Check phone field
    if (_phoneController.text.trim().isEmpty) {
      setState(() {
        _phoneError = 'Phone number is required';
      });
      _phoneFocusNode.requestFocus();
      return 'Phone number is required';
    }
    if (_phoneController.text.length != 10) {
      setState(() {
        _phoneError = 'Please enter a valid 10-digit phone number';
      });
      _phoneFocusNode.requestFocus();
      return 'Please enter a valid 10-digit phone number';
    }
    
    // Check gender (required for both customers and astrologers)
    // Gender is using dropdown with default value, so it's always set

    return null;
  }

  String? _validateContactSection() {
    if (!_isGoogleLogin) {
      // Clear all previous errors
      setState(() {
        _emailError = null;
        _passwordError = null;
        _confirmPasswordError = null;
      });

      // Check email first
      if (_emailController.text.trim().isEmpty) {
        setState(() {
          _emailError = 'Email is required';
        });
        _emailFocusNode.requestFocus();
        return 'Email is required';
      }
      if (!EmailValidator.validate(_emailController.text)) {
        setState(() {
          _emailError = 'Please enter a valid email';
        });
        _emailFocusNode.requestFocus();
        return 'Please enter a valid email';
      }
      
      // Only check password if email is valid
      if (_passwordController.text.isEmpty) {
        setState(() {
          _passwordError = 'Password is required';
        });
        _passwordFocusNode.requestFocus();
        return 'Password is required';
      }
      if (_passwordController.text.length < 8) {
        setState(() {
          _passwordError = 'Password must be at least 8 characters';
        });
        _passwordFocusNode.requestFocus();
        return 'Password must be at least 8 characters';
      }
      
      // Check password strength requirements
      if (!ValidationPatterns.hasUppercase(_passwordController.text)) {
        setState(() {
          _passwordError = 'Password must contain at least one uppercase letter';
        });
        _passwordFocusNode.requestFocus();
        return 'Password must contain at least one uppercase letter';
      }
      if (!ValidationPatterns.hasLowercase(_passwordController.text)) {
        setState(() {
          _passwordError = 'Password must contain at least one lowercase letter';
        });
        _passwordFocusNode.requestFocus();
        return 'Password must contain at least one lowercase letter';
      }
      if (!ValidationPatterns.hasDigit(_passwordController.text)) {
        setState(() {
          _passwordError = 'Password must contain at least one number';
        });
        _passwordFocusNode.requestFocus();
        return 'Password must contain at least one number';
      }
      if (!ValidationPatterns.hasSpecialChar(_passwordController.text)) {
        setState(() {
          _passwordError = 'Password must contain at least one special character';
        });
        _passwordFocusNode.requestFocus();
        return 'Password must contain at least one special character';
      }
      
      // Only check confirm password if password is valid
      if (_confirmPasswordController.text.isEmpty) {
        setState(() {
          _confirmPasswordError = 'Please confirm your password';
        });
        _confirmPasswordFocusNode.requestFocus();
        return 'Please confirm your password';
      }
      if (_confirmPasswordController.text != _passwordController.text) {
        setState(() {
          _confirmPasswordError = 'Passwords do not match';
        });
        _confirmPasswordFocusNode.requestFocus();
        return 'Passwords do not match';
      }
    }
    return null;
  }

  String? _validateBirthSection() {
    if (_dateOfBirthController.text.trim().isEmpty) {
      _dateOfBirthFocusNode.requestFocus();
      return 'Date of birth is required';
    }
    return null;
  }

  String? _validateProfessionalSectionSequential() {
    // Clear all previous errors
    setState(() {
      _experienceError = null;
      _bioError = null;
      _qualificationsError = null;
      _languagesError = null;
      _skillsError = null;
    });
    
    if (_selectedExperience == null) {
      setState(() {
        _experienceError = 'Experience is required';
      });
      return 'Experience is required';
    }
    
    if (_bioController.text.trim().isEmpty) {
      setState(() {
        _bioError = 'Bio is required';
      });
      _bioFocusNode.requestFocus();
      return 'Bio is required';
    }
    if (_bioController.text.trim().length < 10) {
      setState(() {
        _bioError = 'Bio must be at least 10 characters';
      });
      _bioFocusNode.requestFocus();
      return 'Bio must be at least 10 characters';
    }
    
    if (_qualificationsList.isEmpty) {
      setState(() {
        _qualificationsError = 'Please add at least one qualification';
      });
      return 'Please add at least one qualification';
    }
    
    if (_selectedLanguages.isEmpty) {
      setState(() {
        _languagesError = 'Please select at least one language';
      });
      return 'Please select at least one language';
    }
    
    if (_selectedSkills.length < 2) {
      setState(() {
        _skillsError = 'Please select at least 2 skills';
      });
      return 'Please select at least 2 skills';
    }
    
    return null;
  }

  String? _validateAddressSection() {
    setState(() {
      _cityError = null;
      _stateError = null;
      _countryError = null;
      _zipError = null;
    });

    if (_addressController.text.trim().isEmpty) {
      _addressFocusNode.requestFocus();
      return 'Address is required';
    }
    if (_cityController.text.trim().isEmpty) {
      setState(() {
        _cityError = 'City is required';
      });
      _cityFocusNode.requestFocus();
      return 'City is required';
    }
    if (_stateController.text.trim().isEmpty) {
      setState(() {
        _stateError = 'State is required';
      });
      _stateFocusNode.requestFocus();
      return 'State is required';
    }
    if (_countryController.text.trim().isEmpty) {
      setState(() {
        _countryError = 'Country is required';
      });
      _countryFocusNode.requestFocus();
      return 'Country is required';
    }
    if (_zipController.text.trim().isEmpty) {
      setState(() {
        _zipError = 'ZIP/Postal code is required';
      });
      _zipFocusNode.requestFocus();
      return 'ZIP/Postal code is required';
    }
    return null;
  }

  String? _validateRatesSection() {
    setState(() {
      _callRateError = null;
      _chatRateError = null;
      _videoRateError = null;
    });
    
    if (_callRateController.text.trim().isEmpty) {
      setState(() {
        _callRateError = 'Call rate is required';
      });
      _callRateFocusNode.requestFocus();
      return 'Call rate is required';
    }
    final callRate = double.tryParse(_callRateController.text);
    if (callRate == null || callRate <= 0) {
      setState(() {
        _callRateError = 'Please enter a valid call rate';
      });
      _callRateFocusNode.requestFocus();
      return 'Please enter a valid call rate';
    }
    if (callRate > 1000) {
      setState(() {
        _callRateError = 'Call rate cannot exceed ₹1000/min';
      });
      _callRateFocusNode.requestFocus();
      return 'Call rate cannot exceed ₹1000/min';
    }
    
    if (_chatRateController.text.trim().isEmpty) {
      setState(() {
        _chatRateError = 'Chat rate is required';
      });
      _chatRateFocusNode.requestFocus();
      return 'Chat rate is required';
    }
    final chatRate = double.tryParse(_chatRateController.text);
    if (chatRate == null || chatRate <= 0) {
      setState(() {
        _chatRateError = 'Please enter a valid chat rate';
      });
      _chatRateFocusNode.requestFocus();
      return 'Please enter a valid chat rate';
    }
    if (chatRate > 1000) {
      setState(() {
        _chatRateError = 'Chat rate cannot exceed ₹1000/min';
      });
      _chatRateFocusNode.requestFocus();
      return 'Chat rate cannot exceed ₹1000/min';
    }
    
    if (_videoRateController.text.trim().isEmpty) {
      setState(() {
        _videoRateError = 'Video rate is required';
      });
      _videoRateFocusNode.requestFocus();
      return 'Video rate is required';
    }
    final videoRate = double.tryParse(_videoRateController.text);
    if (videoRate == null || videoRate <= 0) {
      setState(() {
        _videoRateError = 'Please enter a valid video rate';
      });
      _videoRateFocusNode.requestFocus();
      return 'Please enter a valid video rate';
    }
    if (videoRate > 1000) {
      setState(() {
        _videoRateError = 'Video rate cannot exceed ₹1000/min';
      });
      _videoRateFocusNode.requestFocus();
      return 'Video rate cannot exceed ₹1000/min';
    }
    
    return null;
  }

  String? _validateBankDetailsSection() {
    setState(() {
      _accountHolderNameError = null;
      _accountNumberError = null;
      _bankNameError = null;
      _ifscCodeError = null;
      _panCardError = null;
    });
    
    if (_accountHolderNameController.text.trim().isEmpty) {
      setState(() {
        _accountHolderNameError = 'Account holder name is required';
      });
      _accountHolderNameFocusNode.requestFocus();
      return 'Account holder name is required';
    }
    
    if (_accountNumberController.text.trim().isEmpty) {
      setState(() {
        _accountNumberError = 'Account number is required';
      });
      _accountNumberFocusNode.requestFocus();
      return 'Account number is required';
    }
    
    final accountNumber = _accountNumberController.text.trim();
    if (!ValidationPatterns.isDigitsOnly(accountNumber) || accountNumber.length < 9 || accountNumber.length > 18) {
      setState(() {
        _accountNumberError = 'Please enter a valid account number (9-18 digits)';
      });
      _accountNumberFocusNode.requestFocus();
      return 'Please enter a valid account number (9-18 digits)';
    }
    
    if (_bankNameController.text.trim().isEmpty) {
      setState(() {
        _bankNameError = 'Bank name is required';
      });
      _bankNameFocusNode.requestFocus();
      return 'Bank name is required';
    }
    
    if (_ifscCodeController.text.trim().isEmpty) {
      setState(() {
        _ifscCodeError = 'IFSC code is required';
      });
      _ifscCodeFocusNode.requestFocus();
      return 'IFSC code is required';
    }
    
    final ifscCode = _ifscCodeController.text.trim().toUpperCase();
    if (!ValidationPatterns.isValidIfsc(ifscCode)) {
      setState(() {
        _ifscCodeError = 'Please enter a valid IFSC code (e.g., SBIN0123456)';
      });
      _ifscCodeFocusNode.requestFocus();
      return 'Please enter a valid IFSC code (e.g., SBIN0123456)';
    }
    
    if (_selectedPanCardImage == null) {
      setState(() {
        _panCardError = 'PAN card upload is required';
      });
      return 'PAN card upload is required';
    }
    
    return null;
  }

  GlobalKey<FormState>? _getCurrentFormKey() {
    switch (_currentSection) {
      case 0:
        return _personalFormKey;
      case 1:
        return _contactFormKey;
      case 2:
        if (widget.isAdvanced) {
          return _professionalFormKey;
        } else {
          return _birthFormKey;
        }
      case 3:
        return _addressFormKey;
      case 4:
        return _ratesFormKey;
      case 5:
        return _bankDetailsFormKey;
      default:
        return null;
    }
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
      setState(() {
        _termsError = 'Please accept the terms and conditions';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _termsError = null; // Clear terms error when attempting to submit
    });

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
            gender: _selectedGender,
            authType: _authType,
            googleAccessToken: _googleAccessToken,
            googleIdToken: _googleIdToken,
            bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
            experience: _selectedExperience?.toString(),
            languages: _selectedLanguages.isEmpty ? null : _selectedLanguages.join(', '),
            qualifications: _qualificationsList.isEmpty ? null : _qualificationsList.join(', '),
            skills: _selectedSkills.isEmpty ? null : _selectedSkills.join(', '),
            address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
            city: _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
            state: _stateController.text.trim().isEmpty ? null : _stateController.text.trim(),
            country: _countryController.text.trim().isEmpty ? null : _countryController.text.trim(),
            zip: _zipController.text.trim().isEmpty ? null : _zipController.text.trim(),
            callRate: _callRateController.text.trim().isEmpty ? null : double.tryParse(_callRateController.text.trim()),
            chatRate: _chatRateController.text.trim().isEmpty ? null : double.tryParse(_chatRateController.text.trim()),
            videoRate: _videoRateController.text.trim().isEmpty ? null : double.tryParse(_videoRateController.text.trim()),
            accountHolderName: _accountHolderNameController.text.trim().isEmpty ? null : _accountHolderNameController.text.trim(),
            accountNumber: _accountNumberController.text.trim().isEmpty ? null : _accountNumberController.text.trim(),
            bankName: _bankNameController.text.trim().isEmpty ? null : _bankNameController.text.trim(),
            ifscCode: _ifscCodeController.text.trim().isEmpty ? null : _ifscCodeController.text.trim(),
            profileImagePath: _selectedProfileImage?.path,
            panCardImagePath: _selectedPanCardImage?.path,
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
        gender: _selectedGender,
        bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
        experience: _selectedExperience?.toString(),
        languages: _selectedLanguages.isEmpty ? null : _selectedLanguages.join(', '),
        qualifications: _qualificationsList.isEmpty ? null : _qualificationsList.join(', '),
        skills: _selectedSkills.isEmpty ? null : _selectedSkills.join(', '),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        city: _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
        state: _stateController.text.trim().isEmpty ? null : _stateController.text.trim(),
        country: _countryController.text.trim().isEmpty ? null : _countryController.text.trim(),
        zip: _zipController.text.trim().isEmpty ? null : _zipController.text.trim(),
        callRate: _callRateController.text.trim().isEmpty ? null : double.tryParse(_callRateController.text.trim()),
        chatRate: _chatRateController.text.trim().isEmpty ? null : double.tryParse(_chatRateController.text.trim()),
        videoRate: _videoRateController.text.trim().isEmpty ? null : double.tryParse(_videoRateController.text.trim()),
        accountHolderName: _accountHolderNameController.text.trim().isEmpty ? null : _accountHolderNameController.text.trim(),
        accountNumber: _accountNumberController.text.trim().isEmpty ? null : _accountNumberController.text.trim(),
        bankName: _bankNameController.text.trim().isEmpty ? null : _bankNameController.text.trim(),
        ifscCode: _ifscCodeController.text.trim().isEmpty ? null : _ifscCodeController.text.trim(),
        profileImagePath: _selectedProfileImage?.path,
        panCardImagePath: _selectedPanCardImage?.path,
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
      final appError = ErrorHandler.handleError(e, context: 'registration');
      ErrorHandler.logError(appError);
      if (mounted) _showMessage(appError.userMessage.isNotEmpty ? appError.userMessage : 'Registration failed. Please try again.', isError: true);
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
                  key: const Key('error_dialog_ok_button'),
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
                  key: const Key('success_dialog_continue_button'),
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
                if (!widget.isAdvanced) _buildBirthSection(), // Only show birth details for customers
                if (widget.isAdvanced) ...[_buildProfessionalSection(), _buildAddressSection(), _buildRatesSection(), _buildBankDetailsSection()],
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
        if (widget.isAdvanced) {
          return 'Professional Profile';
        } else {
          return 'Birth Details';
        }
      case 3:
        return 'Address Details';
      case 4:
        return 'Consultation Rates';
      case 5:
        return 'Bank Details';
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
        if (widget.isAdvanced) {
          return 'Share your expertise';
        } else {
          return 'For personalized guidance';
        }
      case 3:
        return 'Where you are based';
      case 4:
        return 'Set your consultation fees';
      case 5:
        return 'For receiving payments';
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
              Row(
                children: [
                  Text(
                    'Profile Photo',
                    style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 2),
                  Text(
                    '*',
                    style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
                  ),
                ],
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
              // Display error message below profile photo
              if (_profilePhotoError != null) ...[
                const SizedBox(height: 8),
                Text(
                  _profilePhotoError!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 24),
            ],
            _buildTextField(
              controller: _nameController,
              focusNode: _nameFocusNode,
              label: 'Full Name',
              icon: Icons.person_outline_rounded,
              readOnly: _isGoogleLogin,
              hint: _isGoogleLogin ? 'From your Google account' : null,
              errorText: _nameError,
              onChanged: () {
                if (_nameError != null) {
                  setState(() {
                    _nameError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
            _buildTextField(
              controller: _phoneController,
              focusNode: _phoneFocusNode,
              label: 'Phone Number',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              prefix: '+91 ',
              errorText: _phoneError,
              onChanged: () {
                if (_phoneError != null) {
                  setState(() {
                    _phoneError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
            _buildGenderDropdown(),
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
                focusNode: _emailFocusNode,
                label: 'Email Address',
                icon: Icons.mail_outline_rounded,
                keyboardType: TextInputType.emailAddress,
                errorText: _emailError,
                onChanged: () {
                  if (_emailError != null) {
                    setState(() {
                      _emailError = null;
                    });
                  }
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
                focusNode: _passwordFocusNode,
                label: 'Password',
                icon: Icons.lock_outline_rounded,
                obscureText: _obscurePassword,
                suffixIcon: IconButton(
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textSecondary, size: 20),
                ),
                errorText: _passwordError,
                onChanged: () {
                  if (_passwordError != null) {
                    setState(() {
                      _passwordError = null;
                    });
                  }
                },
              ),
              // Only show password requirements when password doesn't meet criteria
              if (_showPasswordRequirements) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Password must contain:',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      _buildPasswordRequirement('At least 8 characters', _passwordController.text.length >= 8),
                      _buildPasswordRequirement('One uppercase letter (A-Z)', ValidationPatterns.hasUppercase(_passwordController.text)),
                      _buildPasswordRequirement('One lowercase letter (a-z)', ValidationPatterns.hasLowercase(_passwordController.text)),
                      _buildPasswordRequirement('One number (0-9)', ValidationPatterns.hasDigit(_passwordController.text)),
                      _buildPasswordRequirement('One special character (!@#\$%^&*)', ValidationPatterns.hasSpecialChar(_passwordController.text)),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              _buildTextField(
                controller: _confirmPasswordController,
                focusNode: _confirmPasswordFocusNode,
                label: 'Confirm Password',
                icon: Icons.lock_outline_rounded,
                obscureText: _obscureConfirmPassword,
                suffixIcon: IconButton(
                  onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  icon: Icon(_obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textSecondary, size: 20),
                ),
                errorText: _confirmPasswordError,
                onChanged: () {
                  if (_confirmPasswordError != null) {
                    setState(() {
                      _confirmPasswordError = null;
                    });
                  }
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
            _buildPlaceOfBirthField(),
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
            _buildExperienceDropdown(),
            const SizedBox(height: 24),
            _buildTextAreaField(
              controller: _bioController,
              focusNode: _bioFocusNode,
              label: 'Professional Bio',
              hint: 'Tell us about your experience and approach to astrology...',
              showCharacterCount: true,
              errorText: _bioError,
              onChanged: () {
                if (_bioError != null) {
                  setState(() {
                    _bioError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
            _buildQualificationsRepeaterField(),
            const SizedBox(height: 24),
            _buildMultiSelectField(label: 'Languages', selectedItems: _selectedLanguages, availableItems: _availableLanguages, onTap: () => _showLanguagesDropdown(), errorText: _languagesError),
            const SizedBox(height: 24),
            _buildMultiSelectField(label: 'Skills', selectedItems: _selectedSkills, availableItems: _availableSkills, onTap: () => _showSkillsDropdown(), errorText: _skillsError),
          ],
        ),
      ),
    );
  }

  // Text field builder without icon (for textarea fields)
  Widget _buildTextAreaField({required TextEditingController controller, required String label, String? Function(String?)? validator, String? hint, int maxLines = 4, bool isOptional = false, bool showCharacterCount = false, int? maxLength, FocusNode? focusNode, String? errorText, VoidCallback? onChanged}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            if (!isOptional) ...[
              const SizedBox(width: 2),
              Text(
                '*',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
              ),
            ] else ...[
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
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: TextFormField(
            controller: controller,
            focusNode: focusNode,
            validator: validator,
            maxLines: maxLines,
            maxLength: maxLength,
            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
            onChanged: (value) {
              if (onChanged != null) {
                onChanged();
              }
            },
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
              counterText: '', // Hide default counter since we show custom one
            ),
          ),
        ),
        // Display error message outside the container
        if (errorText != null) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              errorText,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildMultiSelectField({required String label, required Set<String> selectedItems, required List<String> availableItems, required VoidCallback onTap, bool isRequired = true, String? errorText}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            if (isRequired) ...[
              const SizedBox(width: 2),
              Text(
                '*',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              border: errorText != null ? Border.all(color: AppColors.error, width: 1.5) : null,
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
        if (errorText != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.error_outline, size: 14, color: AppColors.error),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  errorText,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                ),
              ),
            ],
          ),
        ],
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
          // Clear error when user makes selection
          if (_languagesError != null && updatedSelection.isNotEmpty) {
            _languagesError = null;
          }
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
          // Clear error when user makes selection
          if (_skillsError != null && updatedSelection.length >= 2) {
            _skillsError = null;
          }
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
        Row(
          children: [
            Text(
              'Qualifications',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 2),
            Text(
              '*',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
            ),
          ],
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
              ],
            ),
          ),
        ),
        // Display error message outside the container
        if (_qualificationsError != null) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              _qualificationsError!,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? prefix,
    String? hint,
    int maxLines = 1,
    bool isOptional = false,
    bool readOnly = false,
    FocusNode? focusNode,
    String? errorText,
    VoidCallback? onChanged,
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
            if (!isOptional) ...[
              const SizedBox(width: 2),
              Text(
                '*',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
              ),
            ] else ...[
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
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: TextFormField(
            controller: controller,
            focusNode: focusNode,
            keyboardType: keyboardType,
            obscureText: obscureText,
            maxLines: maxLines,
            readOnly: readOnly,
            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
            onChanged: (value) {
              if (onChanged != null) {
                onChanged();
              }
            },
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
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
              filled: false,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            ),
          ),
        ),
        // Display error message outside the container
        if (errorText != null) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              errorText,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.error, height: 1.2),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDateTimeField({required TextEditingController controller, required String label, required IconData icon, required VoidCallback onTap, String? Function(String?)? validator, bool isOptional = false}) {
    return FormField<String>(
      validator: validator != null ? (value) => validator(controller.text) : null,
      builder: (FormFieldState<String> field) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  label,
                  style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                ),
                if (!isOptional) ...[
                  const SizedBox(width: 2),
                  Text(
                    '*',
                    style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
                  ),
                ] else ...[
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
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
              ),
              child: TextFormField(
                controller: controller,
                readOnly: true,
                onTap: () {
                  onTap();
                  field.didChange(controller.text);
                },
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
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: AppColors.primary, width: 2),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: AppColors.primary, width: 2),
                  ),
                  filled: false,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                ),
              ),
            ),
            // Display error message outside the container
            if (field.hasError && field.errorText != null) ...[
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Text(
                  field.errorText!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.error, height: 1.2),
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildTermsCheckbox() {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 2),
              child: Checkbox(
                value: _acceptTerms,
                onChanged: (value) => setState(() {
                  _acceptTerms = value ?? false;
                  if (_acceptTerms && _termsError != null) {
                    _termsError = null;
                  }
                }),
                activeColor: AppColors.primary,
                checkColor: AppColors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                side: BorderSide(color: _termsError != null ? AppColors.error : (_acceptTerms ? AppColors.primary : AppColors.grey400), width: 2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 14),
                child: RichText(
                  text: TextSpan(
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimary, height: 1.5),
                    children: [
                      const TextSpan(text: 'I agree to the '),
                      TextSpan(
                        text: 'Terms & Policies',
                        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                        recognizer: TapGestureRecognizer()..onTap = () => _showTermsAndPoliciesDialog(),
                      ),
                      const TextSpan(text: ' of True Astro Talk'),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_termsError != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              const SizedBox(width: 40), // Align with checkbox text
              Icon(Icons.error_outline, size: 14, color: AppColors.error),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _termsError!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                ),
              ),
            ],
          ),
        ],
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
            key: const Key('primary_signup_button'),
            onPressed: _isLoading ? null : _isCurrentSectionValid() ? _nextSection : null,
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
            _profilePhotoError = null; // Clear error when photo is selected
          });
        }
      }
    } catch (e) {
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'profile');
        ErrorHandler.logError(appError);
        _showMessage(appError.userMessage.isNotEmpty ? appError.userMessage : 'Failed to pick image. Please try again.', isError: true);
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

  Future<void> _pickPanCardImage() async {
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
              Text('Upload PAN Card', style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary)),
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
        final XFile? image = await picker.pickImage(
          source: source, 
          maxWidth: 1024, 
          maxHeight: 1024, 
          imageQuality: 85, // Higher quality for document
        );

        if (image != null && mounted) {
          setState(() {
            _selectedPanCardImage = File(image.path);
            // Clear PAN card error when image is selected
            if (_panCardError != null) {
              _panCardError = null;
            }
          });
        }
      }
    } catch (e) {
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'pan_card_upload');
        ErrorHandler.logError(appError);
        _showMessage(appError.userMessage.isNotEmpty ? appError.userMessage : 'Failed to upload PAN card. Please try again.', isError: true);
      }
    }
  }

  Widget _buildAddressSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _addressFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            GooglePlacesAddressField(
              addressController: _addressController,
              cityController: _cityController,
              stateController: _stateController,
              countryController: _countryController,
              zipController: _zipController,
              label: 'Address',
              hint: 'Start typing your address...',
              focusNode: _addressFocusNode,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Address is required';
                }
                return null;
              },
              onAddressSelected: () {
                setState(() {
                  _cityError = null;
                  _stateError = null;
                  _countryError = null;
                  _zipError = null;
                });
              },
              restrictToCountry: true,
              countryCode: 'in',
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _cityController,
              focusNode: _cityFocusNode,
              label: 'City',
              icon: Icons.location_city_outlined,
              errorText: _cityError,
              onChanged: () {
                if (_cityError != null) {
                  setState(() {
                    _cityError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _stateController,
              focusNode: _stateFocusNode,
              label: 'State',
              icon: Icons.map_outlined,
              errorText: _stateError,
              onChanged: () {
                if (_stateError != null) {
                  setState(() {
                    _stateError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _countryController,
              focusNode: _countryFocusNode,
              label: 'Country',
              icon: Icons.public_outlined,
              readOnly: true, // Default to India, read-only for now
              errorText: _countryError,
              onChanged: () {
                if (_countryError != null) {
                  setState(() {
                    _countryError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _zipController,
              focusNode: _zipFocusNode,
              label: 'ZIP/Postal Code',
              icon: Icons.local_post_office_outlined,
              keyboardType: TextInputType.text,
              errorText: _zipError,
              onChanged: () {
                if (_zipError != null) {
                  setState(() {
                    _zipError = null;
                  });
                }
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
              focusNode: _callRateFocusNode,
              label: 'Call Rate (₹/min)',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.number,
              errorText: _callRateError,
              onChanged: () {
                if (_callRateError != null) {
                  setState(() {
                    _callRateError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _chatRateController,
              focusNode: _chatRateFocusNode,
              label: 'Chat Rate (₹/min)',
              icon: Icons.chat_outlined,
              keyboardType: TextInputType.number,
              errorText: _chatRateError,
              onChanged: () {
                if (_chatRateError != null) {
                  setState(() {
                    _chatRateError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _videoRateController,
              focusNode: _videoRateFocusNode,
              label: 'Video Call Rate (₹/min)',
              icon: Icons.videocam_outlined,
              keyboardType: TextInputType.number,
              errorText: _videoRateError,
              onChanged: () {
                if (_videoRateError != null) {
                  setState(() {
                    _videoRateError = null;
                  });
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBankDetailsSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _bankDetailsFormKey,
        child: Column(
          children: [
            const SizedBox(height: 8),
            Text(
              'Bank Details for Payouts',
              style: AppTextStyles.heading4.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Required for receiving payments from consultations',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
_buildTextField(
              controller: _accountHolderNameController,
              focusNode: _accountHolderNameFocusNode,
              label: 'Account Holder Name',
              icon: Icons.person_outline,
              hint: 'Enter name as per bank account',
              errorText: _accountHolderNameError,
              onChanged: () {
                if (_accountHolderNameError != null) {
                  setState(() {
                    _accountHolderNameError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _accountNumberController,
              focusNode: _accountNumberFocusNode,
              label: 'Account Number',
              icon: Icons.account_balance,
              keyboardType: TextInputType.number,
              hint: 'Enter bank account number',
              errorText: _accountNumberError,
              onChanged: () {
                if (_accountNumberError != null) {
                  setState(() {
                    _accountNumberError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _bankNameController,
              focusNode: _bankNameFocusNode,
              label: 'Bank Name',
              icon: Icons.business,
              hint: 'Enter bank name',
              errorText: _bankNameError,
              onChanged: () {
                if (_bankNameError != null) {
                  setState(() {
                    _bankNameError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
_buildTextField(
              controller: _ifscCodeController,
              focusNode: _ifscCodeFocusNode,
              label: 'IFSC Code',
              icon: Icons.code,
              hint: 'e.g., SBIN0123456',
              errorText: _ifscCodeError,
              onChanged: () {
                if (_ifscCodeError != null) {
                  setState(() {
                    _ifscCodeError = null;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
            _buildPanCardUploadSection(),
            const SizedBox(height: 32),
            _buildTermsCheckbox(),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Bank details and PAN card are required for receiving payments. Please ensure the information is accurate.',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.primary,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPanCardUploadSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'PAN Card (Required)',
          style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _pickPanCardImage,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                child: _selectedPanCardImage == null
                    ? Column(
                        children: [
                          Icon(
                            Icons.cloud_upload_outlined,
                            size: 48,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Upload PAN Card',
                            style: AppTextStyles.bodyLarge.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Required for tax compliance',
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                          ),
                        ],
                      )
                    : Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(
                              _selectedPanCardImage!,
                              width: double.infinity,
                              height: 200,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.error,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: IconButton(
                                onPressed: () {
                                  setState(() {
                                    _selectedPanCardImage = null;
                                  });
                                },
                                icon: const Icon(Icons.close, color: AppColors.white, size: 20),
                                padding: const EdgeInsets.all(4),
                                constraints: const BoxConstraints(),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.check_circle, color: AppColors.white, size: 16),
                                  const SizedBox(width: 4),
                                  Text(
                                    'PAN Card Uploaded',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.white,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
        if (_panCardError != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.error_outline, size: 14, color: AppColors.error),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _panCardError!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
  Widget _buildExperienceDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Years of Experience',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 2),
            Text(
              '*',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: _experienceError != null ? Border.all(color: AppColors.error, width: 1.5) : null,
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: DropdownButtonFormField<int>(
            initialValue: _selectedExperience,
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.work_outline_rounded, color: AppColors.textSecondary, size: 20),
              hintText: 'Select years of experience',
              hintStyle: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondary),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            ),
            dropdownColor: AppColors.white,
            icon: Icon(Icons.arrow_drop_down, color: AppColors.textSecondary, size: 24),
            items: List.generate(80, (index) => index + 1)
                .map((years) => DropdownMenuItem<int>(
                      value: years,
                      child: Text(
                        years == 1 ? '$years year' : '$years years',
                        style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary),
                      ),
                    ))
                .toList(),
            onChanged: (value) {
              setState(() {
                _selectedExperience = value;
                // Clear error when selection is made
                if (_experienceError != null) {
                  _experienceError = null;
                }
              });
            },
          ),
        ),
        if (_experienceError != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.error_outline, size: 14, color: AppColors.error),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _experienceError!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  
  Widget _buildGenderDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Gender',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 2),
            Text(
              '*',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: DropdownButtonFormField<String>(
            initialValue: _selectedGender,
            decoration: InputDecoration(
              prefixIcon: Container(
                padding: const EdgeInsets.all(16),
                child: Icon(Icons.person_outline, color: AppColors.primary, size: 22),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
              filled: false,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            ),
            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
            items: [
              DropdownMenuItem(
                value: 'male',
                child: Text('Male'),
              ),
              DropdownMenuItem(
                value: 'female',
                child: Text('Female'),
              ),
              DropdownMenuItem(
                value: 'other',
                child: Text('Other'),
              ),
            ],
            onChanged: (String? value) {
              if (value != null) {
                setState(() {
                  _selectedGender = value;
                });
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '• ',
            style: TextStyle(
              fontSize: 14,
              height: 1.4,
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                height: 1.4,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordRequirement(String text, bool isMet) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(
            isMet ? Icons.check_circle : Icons.close,
            size: 14,
            color: isMet ? AppColors.success : AppColors.error,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.bodySmall.copyWith(
                color: isMet ? AppColors.success : AppColors.error,
                decoration: isMet ? TextDecoration.lineThrough : null,
                fontWeight: isMet ? FontWeight.normal : FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPlaceOfBirthField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Place of Birth',
              style: AppTextStyles.labelLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Text(
              '(optional)',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
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
          child: Config.enableGooglePlaces && Config.googleMapsApiKey.isNotEmpty
              ? GooglePlaceAutoCompleteTextField(
                  textEditingController: _placeOfBirthController,
                  googleAPIKey: Config.googleMapsApiKey,
                  inputDecoration: InputDecoration(
                    hintText: 'Enter your place of birth',
                    hintStyle: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.normal,
                    ),
                    prefixIcon: Container(
                      padding: const EdgeInsets.all(16),
                      child: Icon(
                        Icons.location_on_outlined,
                        color: AppColors.primary,
                        size: 22,
                      ),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: AppColors.primary, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                  textStyle: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  debounceTime: 600,
                  countries: const ["in", "us", "gb"], // Prioritize India, US, UK
                  isLatLngRequired: false,
                  getPlaceDetailWithLatLng: (Prediction prediction) {
                    // Handle place selection
                    debugPrint('Selected place: ${prediction.description}');
                  },
                  itemClick: (Prediction prediction) {
                    _placeOfBirthController.text = prediction.description ?? '';
                    _placeOfBirthController.selection = TextSelection.fromPosition(
                      TextPosition(offset: _placeOfBirthController.text.length),
                    );
                  },
                  itemBuilder: (context, index, Prediction prediction) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.location_on_outlined,
                            color: AppColors.textSecondary,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              prediction.description ?? '',
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                  seperatedBuilder: Divider(
                    height: 1,
                    color: AppColors.grey200,
                  ),
                  containerHorizontalPadding: 0,
                  containerVerticalPadding: 0,
                )
              : TextFormField(
                  controller: _placeOfBirthController,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Enter your place of birth',
                    hintStyle: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.normal,
                    ),
                    prefixIcon: Container(
                      padding: const EdgeInsets.all(16),
                      child: Icon(
                        Icons.location_on_outlined,
                        color: AppColors.primary,
                        size: 22,
                      ),
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                ),
        ),
        if (!Config.enableGooglePlaces || Config.googleMapsApiKey.isEmpty) ...[
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              'Google Places not enabled. Using manual input.',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ],
    );
  }

  // Show comprehensive Terms & Policies dialog
  void _showTermsAndPoliciesDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppColors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Center(
            child: Text(
              'Terms & Policies',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Terms of Service Section
                Text(
                  '📜 TERMS OF SERVICE',
                  style: AppTextStyles.labelLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBulletPoint('By using True Astrotalk, you agree to these terms and conditions.'),
                    _buildBulletPoint('Users must provide accurate and complete information during registration.'),
                    _buildBulletPoint('You are responsible for maintaining the confidentiality of your account.'),
                    _buildBulletPoint('Prohibited activities include: fraudulent transactions, harassment, or misuse of services.'),
                    _buildBulletPoint('We reserve the right to suspend or terminate accounts that violate our terms.'),
                    _buildBulletPoint('All consultations are for entertainment and guidance purposes only.'),
                  ],
                ),
                const SizedBox(height: 20),
                
                // Privacy Policy Section
                Text(
                  '🔒 PRIVACY POLICY',
                  style: AppTextStyles.labelLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBulletPoint('We collect personal information to provide and improve our services.'),
                    _buildBulletPoint('Your data is encrypted and stored securely on our servers.'),
                    _buildBulletPoint('We do not sell, rent, or share your personal information with third parties.'),
                    _buildBulletPoint('Payment information is processed through secure, PCI-compliant payment gateways.'),
                    _buildBulletPoint('You can request data deletion or modification by contacting support.'),
                    _buildBulletPoint('We use cookies to enhance your browsing experience.'),
                  ],
                ),
                const SizedBox(height: 20),
                
                // Refund Policy Section
                Text(
                  '💳 REFUND POLICY',
                  style: AppTextStyles.labelLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBulletPoint('Full refunds are available within 7 working days of wallet recharge.'),
                    _buildBulletPoint('Consultation refunds are processed only if the astrologer fails to join the session.'),
                    _buildBulletPoint('Refund requests must be submitted through the app or by contacting support.'),
                    _buildBulletPoint('Processing time: 5-7 business days for wallet refunds.'),
                    _buildBulletPoint('Partial refunds may apply for interrupted sessions (pro-rated basis).'),
                    _buildBulletPoint('No refunds for completed consultations or services already delivered.'),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text(
                'Close',
                style: AppTextStyles.labelLarge.copyWith(
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
}
