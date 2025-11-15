import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/models/user.dart' as app_user;
import 'dart:io';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/widgets/google_places_address_field.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';
import '../models/enums.dart';
import '../config/config.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final AuthService _authService;

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _birthPlaceController = TextEditingController();
  final _birthTimeController = TextEditingController();

  // Astrologer-specific controllers
  final _bioController = TextEditingController();
  final _experienceController = TextEditingController(); // Keeping for backward compatibility
  int? _selectedExperience; // For dropdown
  final _languagesController = TextEditingController();
  final _qualificationsController = TextEditingController();
  final _skillsController = TextEditingController();
  final _callRateController = TextEditingController();
  final _chatRateController = TextEditingController();
  final _videoRateController = TextEditingController();

  // Additional controllers for astrologer settings (matching signup flow)
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _countryController = TextEditingController();
  final _zipController = TextEditingController();

  // Bank details controllers
  final _accountHolderController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _ifscController = TextEditingController();


  app_user.User? _currentUser;
  DateTime? _selectedBirthDate;
  File? _selectedProfileImage;
  File? _selectedPanCardImage;
  bool _isLoading = false;
  bool _isUpdating = false;

  // Dynamic options loaded from API (matching signup flow)
  List<String> _availableLanguages = [];
  List<String> _availableSkills = [];

  // Professional selections (matching signup flow)
  final Set<String> _selectedLanguages = <String>{};
  final Set<String> _selectedSkills = <String>{};

  // Qualifications repeater field (matching signup flow)
  final List<String> _qualificationsList = [];
  final TextEditingController _qualificationController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadAstrologerOptions();
    _loadUserProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _birthPlaceController.dispose();
    _birthTimeController.dispose();

    // Dispose astrologer controllers
    _bioController.dispose();
    _experienceController.dispose();
    _languagesController.dispose();
    _qualificationsController.dispose();
    _skillsController.dispose();
    _callRateController.dispose();
    _chatRateController.dispose();
    _videoRateController.dispose();

    // Dispose additional controllers
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _zipController.dispose();
    _qualificationController.dispose();

    // Dispose bank details controllers
    _accountHolderController.dispose();
    _accountNumberController.dispose();
    _bankNameController.dispose();
    _ifscController.dispose();

    super.dispose();
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
      debugPrint('❌ Failed to load astrologer options: $e');
      // Continue without options
    }
  }


  Future<void> _loadUserProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Refresh user data from API to get latest astrologer fields
      await _authService.refreshCurrentUser();
      final user = _authService.currentUser;
      if (user != null) {
        debugPrint('📱 Loading user profile:');
        debugPrint('   Name: ${user.name}');
        debugPrint('   Email: ${user.email}');
        debugPrint('   Phone: ${user.phone}');
        debugPrint('   Date of Birth: ${user.dateOfBirth}');
        debugPrint('   Time of Birth: ${user.timeOfBirth}');
        debugPrint('   Place of Birth: ${user.placeOfBirth}');
        debugPrint('   Profile Picture: ${user.profilePicture}');

        _currentUser = user;
        _nameController.text = user.name;
        _emailController.text = user.email ?? '';
        _phoneController.text = user.phone ?? '';
        _birthPlaceController.text = user.placeOfBirth ?? '';
        _birthTimeController.text = user.timeOfBirth ?? '';
        _selectedBirthDate = user.dateOfBirth;


        setState(() {
          // Populate address fields for all users (customers and astrologers)
          _addressController.text = user.address ?? '';
          _cityController.text = user.city ?? '';
          _stateController.text = user.state ?? '';
          _countryController.text = user.country ?? '';
          _zipController.text = user.zip ?? '';
          
          debugPrint('📍 Loaded address data:');
          debugPrint('   Address: ${user.address}');
          debugPrint('   City: ${user.city}');
          debugPrint('   State: ${user.state}');
          debugPrint('   Country: ${user.country}');
          debugPrint('   ZIP: ${user.zip}');

          // Populate astrologer-specific fields if user is astrologer
          if (user.isAstrologer) {
            _bioController.text = user.bio ?? '';
            _experienceController.text = user.experienceYears?.toString() ?? '';
            _selectedExperience = user.experienceYears; // Set dropdown value
            _callRateController.text = user.callRate?.toString() ?? '';
            _chatRateController.text = user.chatRate?.toString() ?? '';
            _videoRateController.text = user.videoRate?.toString() ?? '';

            // Populate multi-select fields
            _selectedLanguages.clear();
            if (user.languages != null) {
              _selectedLanguages.addAll(user.languages!);
            }

            _selectedSkills.clear();
            if (user.skills != null) {
              _selectedSkills.addAll(user.skills!);
            }

            // Populate qualifications list
            _qualificationsList.clear();
            if (user.qualifications != null) {
              _qualificationsList.addAll(user.qualifications!);
            }

            // Populate bank details for astrologers
            _accountHolderController.text = user.accountHolderName ?? '';
            _accountNumberController.text = user.accountNumber ?? '';
            _bankNameController.text = user.bankName ?? '';
            _ifscController.text = user.ifscCode ?? '';

            debugPrint('📱 Populated astrologer data:');
            debugPrint('   Bio: ${user.bio}');
            debugPrint('   Experience: ${user.experienceYears}');
            debugPrint('   Languages: ${user.languages}');
            debugPrint('   Skills: ${user.skills}');
            debugPrint('   Qualifications: ${user.qualifications}');
            debugPrint('   Address: ${user.address}');
            debugPrint('   Bank Details: ${user.bankName} (${user.ifscCode})');
          }
        });
      } else {
        debugPrint('❌ No current user found');
      }
    } catch (e) {
      debugPrint('❌ Failed to load profile: $e');
      _showErrorSnackBar('Failed to load profile: ${e.toString()}');
    } finally {
      setState(() {
        _isLoading = false;
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
              Text('Select Profile Photo', style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimaryLight)),
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
              const SizedBox(height: 10),
            ],
          ),
        ),
      );

      if (source != null) {
        final XFile? image = await picker.pickImage(source: source, maxWidth: 512, maxHeight: 512, imageQuality: 80);

        if (image != null) {
          setState(() {
            _selectedProfileImage = File(image.path);
          });
        }
      }
    } catch (e) {
      _showErrorSnackBar('Failed to pick image: ${e.toString()}');
    }
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
              Text('Select PAN Card Image', style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimaryLight)),
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
              const SizedBox(height: 10),
            ],
          ),
        ),
      );

      if (source != null) {
        final XFile? image = await picker.pickImage(source: source, maxWidth: 1024, maxHeight: 1024, imageQuality: 85);

        if (image != null) {
          setState(() {
            _selectedPanCardImage = File(image.path);
          });
        }
      }
    } catch (e) {
      _showErrorSnackBar('Failed to pick PAN card image: ${e.toString()}');
    }
  }

  Widget _buildImageSourceOption({required IconData icon, required String label, required ImageSource source}) {
    return InkWell(
      onTap: () => Navigator.pop(context, source),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.borderLight),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(label, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight)),
          ],
        ),
      ),
    );
  }

  Future<void> _selectBirthDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthDate ?? DateTime.now().subtract(const Duration(days: 365 * 25)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(primary: AppColors.primary, onPrimary: AppColors.white, surface: AppColors.white, onSurface: AppColors.textPrimaryLight),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedBirthDate) {
      setState(() {
        _selectedBirthDate = picked;
      });
    }
  }

  Future<void> _selectBirthTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _parseBirthTime(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(primary: AppColors.primary, onPrimary: AppColors.white, surface: AppColors.white, onSurface: AppColors.textPrimaryLight),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _birthTimeController.text = picked.format(context);
      });
    }
  }

  TimeOfDay _parseBirthTime() {
    if (_birthTimeController.text.isNotEmpty) {
      try {
        final parts = _birthTimeController.text.split(':');
        if (parts.length >= 2) {
          int hour = int.parse(parts[0]);
          int minute = int.parse(parts[1].split(' ')[0]);

          // Handle AM/PM
          if (_birthTimeController.text.toLowerCase().contains('pm') && hour != 12) {
            hour += 12;
          } else if (_birthTimeController.text.toLowerCase().contains('am') && hour == 12) {
            hour = 0;
          }

          return TimeOfDay(hour: hour, minute: minute);
        }
      } catch (e) {
        // Fall back to default time
      }
    }
    return const TimeOfDay(hour: 12, minute: 0);
  }


  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      // Prepare update data
      final updateData = <String, dynamic>{
        'full_name': _nameController.text.trim(),
        'email_address': _emailController.text.trim(),
      };

      // Add optional fields only if they have values
      if (_phoneController.text.trim().isNotEmpty) {
        updateData['phone_number'] = _phoneController.text.trim();
      }
      if (_selectedBirthDate != null) {
        updateData['date_of_birth'] = _selectedBirthDate!.toIso8601String();
      }
      if (_birthTimeController.text.trim().isNotEmpty) {
        updateData['time_of_birth'] = _birthTimeController.text.trim();
      }
      if (_birthPlaceController.text.trim().isNotEmpty) {
        updateData['place_of_birth'] = _birthPlaceController.text.trim();
      }

      // Add address fields (optional for customers, required for astrologers)
      if (_addressController.text.trim().isNotEmpty) {
        updateData['address'] = _addressController.text.trim();
        debugPrint('📍 Sending address: ${_addressController.text.trim()}');
      }
      if (_cityController.text.trim().isNotEmpty) {
        updateData['city'] = _cityController.text.trim();
        debugPrint('📍 Sending city: ${_cityController.text.trim()}');
      }
      if (_stateController.text.trim().isNotEmpty) {
        updateData['state'] = _stateController.text.trim();
        debugPrint('📍 Sending state: ${_stateController.text.trim()}');
      }
      if (_countryController.text.trim().isNotEmpty) {
        updateData['country'] = _countryController.text.trim();
        debugPrint('📍 Sending country: ${_countryController.text.trim()}');
      }
      if (_zipController.text.trim().isNotEmpty) {
        updateData['zip'] = _zipController.text.trim();
        debugPrint('📍 Sending zip: ${_zipController.text.trim()}');
      }
      
      debugPrint('📤 Complete update data being sent: $updateData');

      // Add astrologer-specific data if user is astrologer
      if (_currentUser?.isAstrologer == true) {
        updateData.addAll({
          'bio': _bioController.text.trim(),
          'experience_years': _selectedExperience ?? 0, // Use dropdown value
          'languages': _selectedLanguages.isEmpty ? null : _selectedLanguages.join(', '),
          'qualifications': _qualificationsList.isEmpty ? null : _qualificationsList.join(', '),
          'skills': _selectedSkills.isEmpty ? null : _selectedSkills.join(', '),
          'call_rate': double.tryParse(_callRateController.text.trim()) ?? 0.0,
          'chat_rate': double.tryParse(_chatRateController.text.trim()) ?? 0.0,
          'video_rate': double.tryParse(_videoRateController.text.trim()) ?? 0.0,
          // Bank details
          'account_holder_name': _accountHolderController.text.trim(),
          'account_number': _accountNumberController.text.trim(),
          'bank_name': _bankNameController.text.trim(),
          'ifsc_code': _ifscController.text.trim(),
        });
      }

      // Update profile via API, including images if selected
      final updatedUser = await _authService.updateUserProfile(
        updateData, 
        profileImagePath: _selectedProfileImage?.path,
        panCardImagePath: _selectedPanCardImage?.path,
      );

      setState(() {
        _currentUser = updatedUser;
        _selectedProfileImage = null; // Clear selected image after successful upload
        _selectedPanCardImage = null; // Clear selected PAN card image after successful upload
      });

      // Refresh user data after successful update
      await _authService.refreshCurrentUser();
      _showSuccessSnackBar('Profile updated successfully!');
    } catch (e) {
      String errorMessage = 'Failed to update profile';
      final errorString = e.toString();

      if (errorString.contains('File too large')) {
        errorMessage = 'Image file is too large. Please choose a smaller image (max 5MB).';
      } else if (errorString.contains('Invalid file type') || errorString.contains('file format')) {
        errorMessage = 'Invalid file format. Please choose a JPEG, PNG, WebP, or HEIC image.';
      } else if (errorString.contains('Authentication failed') || errorString.contains('401')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (errorString.contains('network') || errorString.contains('connection')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        // Extract server error message if available
        final match = RegExp(r'Exception: (.+)').firstMatch(errorString);
        if (match != null) {
          errorMessage = match.group(1) ?? errorMessage;
        }
      }

      debugPrint('Profile update error: $errorString');
      _showErrorSnackBar(errorMessage);
    } finally {
      setState(() {
        _isUpdating = false;
      });
    }
  }

  void _showErrorSnackBar(String message) {
    _showAnimatedDialog(
      title: 'Error',
      message: message,
      icon: Icons.error_outline,
      iconColor: AppColors.error,
    );
  }

  void _showSuccessSnackBar(String message) {
    _showAnimatedDialog(
      title: 'Success',
      message: message,
      icon: Icons.check_circle_outline,
      iconColor: AppColors.success,
    );
  }

  void _showAnimatedDialog({
    required String title,
    required String message,
    required IconData icon,
    required Color iconColor,
  }) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 320),
            margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: iconColor.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        icon,
                        size: 48,
                        color: iconColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      title,
                      style: AppTextStyles.heading6.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      message,
                      textAlign: TextAlign.center,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: iconColor,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text('OK'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: CurvedAnimation(
            parent: animation,
            curve: Curves.easeInOut,
          ),
          child: ScaleTransition(
            scale: CurvedAnimation(
              parent: animation,
              curve: Curves.easeInOut,
            ),
            child: child,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 247, 246, 246),
      appBar: AppBar(
        title: Text('Edit Profile', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isUpdating)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Center(
                child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.white))),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile Header Section
            Container(
              color: AppColors.primary,
              padding: const EdgeInsets.only(top: 40, bottom: 40),
              child: Center(
                child: Column(
                  children: [
                    // Profile Image
                    Stack(
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.white, width: 4),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 15, offset: const Offset(0, 5))],
                          ),
                          child: ClipOval(child: _buildProfileImage()),
                        ),
                        // Only show camera icon for non-Google users
                        if (_currentUser?.authType != AuthType.google)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: _pickImage,
                              child: Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: AppColors.white,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppColors.primary, width: 2),
                                ),
                                child: const Icon(Icons.camera_alt, color: AppColors.primary, size: 20),
                              ),
                            ),
                          ),

                        // Show info icon for Google users
                        if (_currentUser?.authType == AuthType.google)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: () => _showGoogleProfileInfo(),
                              child: Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: Color(0xFF4285F4), // Google blue
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppColors.white, width: 2),
                                ),
                                child: const Icon(Icons.info_outline, color: AppColors.white, size: 20),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _currentUser?.name ?? 'User',
                      style: AppTextStyles.heading4.copyWith(color: AppColors.white, fontWeight: FontWeight.bold),
                    ),
                    // Show phone number for phone-authenticated users, email for others
                    if (_currentUser != null && (_currentUser!.authType == AuthType.phone ? _currentUser!.phone?.isNotEmpty == true : _currentUser!.email?.isNotEmpty == true)) ...[
                      const SizedBox(height: 4),
                      Text(
                        _currentUser!.authType == AuthType.phone ? _currentUser!.phone! : _currentUser!.email!,
                        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.white.withValues(alpha: 0.9))
                      )
                    ],
                  ],
                ),
              ),
            ),

            // Form Section
            Padding(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Personal Information Card
                    _buildSectionCard(
                      title: 'Personal Information',
                      icon: Icons.person,
                      children: [
                        _buildTextField(
                          controller: _nameController,
                          label: 'Full Name',
                          icon: Icons.person_outline,
                          validator: (value) {
                            if (value?.trim().isEmpty ?? true) {
                              return 'Name is required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        _buildTextField(
                          controller: _emailController,
                          label: 'Email Address',
                          icon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value?.trim().isEmpty ?? true) {
                              return 'Email is required';
                            }
                            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value!)) {
                              return 'Please enter a valid email';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        _buildTextField(
                          controller: _phoneController,
                          label: 'Phone Number',
                          icon: Icons.phone_outlined,
                          keyboardType: TextInputType.phone,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                          validator: (value) {
                            // Make phone optional for customers, required for astrologers
                            if (_currentUser?.isAstrologer == true) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Phone number is required for astrologers';
                              }
                              if (value!.length < 10) {
                                return 'Please enter a valid 10-digit phone number';
                              }
                            } else if (value != null && value.trim().isNotEmpty) {
                              // If customer provided a phone, validate it
                              if (value.length < 10) {
                                return 'Please enter a valid 10-digit phone number';
                              }
                            }
                            return null;
                          },
                        ),
                      ],
                    ),

                    // Birth Information Card - Only show for customers, not astrologers
                    if (_currentUser?.isCustomer == true) ...[
                      const SizedBox(height: 20),
                      _buildSectionCard(
                        title: 'Birth Information',
                        icon: Icons.cake,
                        children: [
                          GestureDetector(
                            onTap: _selectBirthDate,
                            child: _buildTextField(
                              controller: TextEditingController(text: _selectedBirthDate != null ? '${_selectedBirthDate!.day.toString().padLeft(2, '0')}/${_selectedBirthDate!.month.toString().padLeft(2, '0')}/${_selectedBirthDate!.year}' : 'Select Date of Birth'),
                              label: 'Date of Birth',
                              icon: Icons.calendar_today,
                              enabled: false,
                              suffixIcon: Icons.arrow_drop_down,
                          ),
                        ),
                        const SizedBox(height: 16),

                        GestureDetector(
                          onTap: _selectBirthTime,
                          child: _buildTextField(
                            controller: TextEditingController(text: _birthTimeController.text.isNotEmpty ? _birthTimeController.text : 'Select Time of Birth (Optional)'),
                            label: 'Time of Birth (Optional)',
                            icon: Icons.access_time,
                            enabled: false,
                            suffixIcon: Icons.arrow_drop_down,
                          ),
                        ),
                        const SizedBox(height: 16),

                        _buildTextField(controller: _birthPlaceController, label: 'Place of Birth (Optional)', icon: Icons.location_on_outlined),
                      ],
                    ),
                    ],

                    // Astrologer-specific sections
                    if (_currentUser?.isAstrologer == true) ...[
                      const SizedBox(height: 20),

                      // Professional Information Card
                      _buildSectionCard(
                        title: 'Professional Information',
                        icon: Icons.work,
                        children: [
                          _buildTextField(
                            controller: _bioController,
                            label: 'Bio',
                            icon: Icons.info_outline,
                            maxLines: 3,
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Bio is required for astrologers';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Years of Experience Dropdown
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.timeline, color: AppColors.textSecondaryLight, size: 20),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Years of Experience',
                                    style: AppTextStyles.labelLarge.copyWith(
                                      color: AppColors.textPrimaryLight,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Container(
                                decoration: BoxDecoration(
                                  color: AppColors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.borderLight),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.06),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: DropdownButtonFormField<int>(
                                  initialValue: _selectedExperience,
                                  decoration: InputDecoration(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    hintText: 'Select years of experience',
                                    hintStyle: AppTextStyles.bodyLarge.copyWith(color: AppColors.textSecondaryLight),
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                  ),
                                  icon: Icon(Icons.arrow_drop_down, color: AppColors.textSecondaryLight),
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
                                    });
                                  },
                                  validator: (value) {
                                    if (value == null) {
                                      return 'Experience is required';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          _buildQualificationsRepeaterField(),
                          const SizedBox(height: 16),

                          _buildMultiSelectField(label: 'Languages (min. 1 required)', selectedItems: _selectedLanguages, availableItems: _availableLanguages, onTap: () => _showLanguagesDropdown()),
                          const SizedBox(height: 16),

                          _buildMultiSelectField(label: 'Skills (min. 2 required)', selectedItems: _selectedSkills, availableItems: _availableSkills, onTap: () => _showSkillsDropdown()),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Consultation Rates Card
                      _buildSectionCard(
                        title: 'Consultation Rates (₹ per minute)',
                        icon: Icons.currency_rupee,
                        children: [
                          _buildTextField(
                            controller: _chatRateController,
                            label: 'Chat Rate',
                            icon: Icons.chat,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Chat rate is required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          _buildTextField(
                            controller: _callRateController,
                            label: 'Call Rate',
                            icon: Icons.call,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Call rate is required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          _buildTextField(
                            controller: _videoRateController,
                            label: 'Video Call Rate',
                            icon: Icons.videocam,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Video call rate is required';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Bank Details Card
                      _buildSectionCard(
                        title: 'Bank Details',
                        icon: Icons.account_balance,
                        children: [
                          _buildTextField(
                            controller: _accountHolderController,
                            label: 'Account Holder Name',
                            icon: Icons.person_outline,
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Account holder name is required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          _buildTextField(
                            controller: _accountNumberController,
                            label: 'Account Number',
                            icon: Icons.credit_card,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Account number is required';
                              }
                              if (value!.length < 9 || value.length > 18) {
                                return 'Please enter a valid account number';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          _buildTextField(
                            controller: _bankNameController,
                            label: 'Bank Name',
                            icon: Icons.business,
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'Bank name is required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          _buildTextField(
                            controller: _ifscController,
                            label: 'IFSC Code',
                            icon: Icons.code,
                            inputFormatters: [
                              LengthLimitingTextInputFormatter(11),
                              FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9]')),
                            ],
                            validator: (value) {
                              if (value?.trim().isEmpty ?? true) {
                                return 'IFSC code is required';
                              }
                              if (!RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(value!.toUpperCase())) {
                                return 'Please enter a valid IFSC code (e.g., SBIN0001234)';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // PAN Card Upload Section
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'PAN Card Image',
                                style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: _pickPanCardImage,
                                child: Container(
                                  height: 120,
                                  decoration: BoxDecoration(
                                    color: AppColors.grey50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.borderLight),
                                  ),
                                  child: _selectedPanCardImage != null
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(12),
                                          child: Image.file(
                                            _selectedPanCardImage!,
                                            width: double.infinity,
                                            height: 120,
                                            fit: BoxFit.cover,
                                          ),
                                        )
                                      : _currentUser?.panCardUrl != null && _currentUser!.panCardUrl!.isNotEmpty
                                          ? ClipRRect(
                                              borderRadius: BorderRadius.circular(12),
                                              child: Image.network(
                                                _buildImageUrl(_currentUser!.panCardUrl!),
                                                width: double.infinity,
                                                height: 120,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) {
                                                  return _buildPanCardPlaceholder();
                                                },
                                              ),
                                            )
                                          : _buildPanCardPlaceholder(),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Tap to ${_selectedPanCardImage != null || (_currentUser?.panCardUrl?.isNotEmpty == true) ? 'change' : 'upload'} PAN card image',
                                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 20),

                    // Address Information Card (reordered layout)
                    _buildSectionCard(
                      title: 'Address Information',
                      icon: Icons.location_on,
                      children: [
                        // Address field with Google Places autocomplete
                        GooglePlacesAddressField(
                          addressController: _addressController,
                          cityController: _cityController,
                          stateController: _stateController,
                          countryController: _countryController,
                          zipController: _zipController,
                          label: 'Address',
                          hint: 'Start typing your address...',
                          maxLines: 1,
                          validator: (value) {
                            if (_currentUser?.isAstrologer == true && (value?.trim().isEmpty ?? true)) {
                              return 'Address is required for astrologers';
                            }
                            return null;
                          },
                          restrictToCountry: true,
                          countryCode: 'in',
                        ),
                        const SizedBox(height: 16),

                        // City and State in one row
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _cityController,
                                label: 'City',
                                icon: Icons.location_city_outlined,
                                validator: (value) {
                                  if (_currentUser?.isAstrologer == true && (value?.trim().isEmpty ?? true)) {
                                    return 'City is required';
                                  }
                                  return null;
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildTextField(
                                controller: _stateController,
                                label: 'State',
                                icon: Icons.map_outlined,
                                validator: (value) {
                                  if (_currentUser?.isAstrologer == true && (value?.trim().isEmpty ?? true)) {
                                    return 'State is required';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Country and ZIP in one row
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                controller: _countryController,
                                label: 'Country',
                                icon: Icons.public_outlined,
                                validator: (value) {
                                  if (_currentUser?.isAstrologer == true && (value?.trim().isEmpty ?? true)) {
                                    return 'Country is required';
                                  }
                                  return null;
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildTextField(
                                controller: _zipController,
                                label: 'ZIP/Postal Code',
                                icon: Icons.pin_drop_outlined,
                                keyboardType: TextInputType.text,
                                validator: (value) {
                                  if (_currentUser?.isAstrologer == true && (value?.trim().isEmpty ?? true)) {
                                    return 'ZIP code is required';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 30),

                    // Update Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isUpdating ? null : _updateProfile,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isUpdating
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.white)))
                            : Text(
                                'Update Profile',
                                style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: AppColors.white),
                              ),
                      ),
                    ),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileImage() {
    // Show selected local image first (when user is changing profile image)
    if (_selectedProfileImage != null) {
      debugPrint('📱 Showing selected local image');
      return Image.file(_selectedProfileImage!, width: 120, height: 120, fit: BoxFit.cover);
    }

    // Use profile picture from user model (includes social_profile_image for Google users)
    if (_currentUser?.profilePicture?.isNotEmpty == true) {
      debugPrint('🖼️ Loading profile image: ${_currentUser!.profilePicture}');
      String imageUrl = _currentUser!.profilePicture!;

      // Handle server image URLs - construct full URL if needed for non-HTTP URLs
      if (!imageUrl.startsWith('http')) {
        final baseUrl = Config.baseUrlSync.replaceAll('/api', '');
        if (!imageUrl.startsWith('/')) {
          imageUrl = '/$imageUrl';
        }
        imageUrl = baseUrl + imageUrl;
        debugPrint('🔗 Constructed image URL: $imageUrl');
      }

      return Image.network(
        imageUrl,
        width: 120,
        height: 120,
        fit: BoxFit.cover,
        headers: imageUrl.startsWith('http') ? null : {'Accept': 'image/*'},
        errorBuilder: (context, error, stackTrace) {
          debugPrint('❌ Failed to load profile image: $error');
          return _buildFallbackAvatar();
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) {
            return child;
          }
          return Container(
            width: 120,
            height: 120,
            color: AppColors.grey100,
            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        },
      );
    }

    // No profile image available - show fallback avatar
    debugPrint('📷 No profile image, showing fallback');
    return _buildFallbackAvatar();
  }

  String _buildImageUrl(String imageUrl) {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    final baseUrl = Config.baseUrlSync.replaceAll('/api', '');
    if (!imageUrl.startsWith('/')) {
      imageUrl = '/$imageUrl';
    }
    return baseUrl + imageUrl;
  }

  Widget _buildPanCardPlaceholder() {
    return Container(
      width: double.infinity,
      height: 120,
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight, style: BorderStyle.solid),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.credit_card,
            size: 40,
            color: AppColors.textSecondaryLight,
          ),
          const SizedBox(height: 8),
          Text(
            'Upload PAN Card',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
          ),
          const SizedBox(height: 4),
          Text(
            'Tap to select image',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
          ),
        ],
      ),
    );
  }

  Widget _buildFallbackAvatar() {
    final name = _currentUser?.name ?? 'User';
    final initials = name.isNotEmpty ? name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase() : 'U';

    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)], begin: Alignment.topLeft, end: Alignment.bottomRight),
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.heading2.copyWith(color: AppColors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required List<Widget> children}) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(colors: [AppColors.white, AppColors.grey50.withValues(alpha: 0.3)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                    child: Icon(icon, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title,
                      style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              ...children,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({required TextEditingController controller, required String label, required IconData icon, TextInputType? keyboardType, bool enabled = true, dynamic suffixIcon, String? Function(String?)? validator, List<TextInputFormatter>? inputFormatters, int? maxLines, String? hint, bool obscureText = false}) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      enabled: enabled,
      obscureText: obscureText,
      validator: validator,
      inputFormatters: inputFormatters,
      maxLines: obscureText ? 1 : (maxLines ?? 1),
      style: AppTextStyles.bodyMedium.copyWith(color: enabled ? AppColors.textPrimaryLight : AppColors.textSecondaryLight),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        hintText: hint ?? (!enabled && controller.text.isEmpty ? 'Not specified' : null),
        hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight, fontStyle: FontStyle.italic),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
        suffixIcon: suffixIcon != null 
          ? (suffixIcon is Widget ? suffixIcon : Icon(suffixIcon as IconData, color: AppColors.textSecondaryLight, size: 20))
          : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        filled: true,
        fillColor: enabled ? AppColors.white : AppColors.grey50,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  Widget _buildMultiSelectField({required String label, required Set<String> selectedItems, required List<String> availableItems, required VoidCallback onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
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
                            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight, fontWeight: FontWeight.normal),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Icon(Icons.arrow_drop_down, color: AppColors.textSecondaryLight, size: 24),
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
                    style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text('Select minimum $minSelections ${minSelections == 1 ? 'item' : 'items'}', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
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
                      title: Text(item, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight)),
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
                  child: Text('Cancel', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight)),
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
                  child: Text('Done (${tempSelection.length})', style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
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
          style: AppTextStyles.labelLarge.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderLight),
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
                          hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: AppColors.borderLight),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: AppColors.borderLight),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: AppColors.primary, width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
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
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight, fontWeight: FontWeight.w500),
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
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.w500),
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
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight, fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
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

  void _showGoogleProfileInfo() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppColors.white,
          surfaceTintColor: AppColors.white,
          title: Text(
            'Google Profile Photo', 
            style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight),
          ),
          content: Text(
            'Your profile photo is managed by your Google account. To change it, please update your Google account profile picture.', 
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('OK', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary)),
            ),
          ],
        );
      },
    );
  }
}
