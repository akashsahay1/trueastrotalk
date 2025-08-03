import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/auth/auth_service.dart';
import '../services/api/user_api_service.dart';
import '../services/service_locator.dart';
import '../models/user.dart' as app_user;
import '../config/config.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final AuthService _authService;
  late final UserApiService _userApiService;
  
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _birthPlaceController = TextEditingController();
  final _birthTimeController = TextEditingController();
  
  app_user.User? _currentUser;
  DateTime? _selectedBirthDate;
  File? _selectedProfileImage;
  bool _isLoading = false;
  bool _isUpdating = false;
  String? _profileImageUrl;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _loadUserProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _birthPlaceController.dispose();
    _birthTimeController.dispose();
    super.dispose();
  }

  Future<void> _loadUserProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final user = _authService.currentUser;
      if (user != null) {
        setState(() {
          _currentUser = user;
          _nameController.text = user.name;
          _emailController.text = user.email ?? '';
          _phoneController.text = user.phone ?? '';
          _birthPlaceController.text = user.placeOfBirth ?? '';
          _birthTimeController.text = user.timeOfBirth ?? '';
          _selectedBirthDate = user.dateOfBirth;
          _profileImageUrl = user.profilePicture;
        });
      }
    } catch (e) {
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
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Select Profile Photo',
                style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimaryLight),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _buildImageSourceOption(
                      icon: Icons.camera_alt,
                      label: 'Camera',
                      source: ImageSource.camera,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildImageSourceOption(
                      icon: Icons.photo_library,
                      label: 'Gallery',
                      source: ImageSource.gallery,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      );

      if (source != null) {
        final XFile? image = await picker.pickImage(
          source: source,
          maxWidth: 512,
          maxHeight: 512,
          imageQuality: 80,
        );

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

  Widget _buildImageSourceOption({
    required IconData icon,
    required String label,
    required ImageSource source,
  }) {
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
            Text(
              label,
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
            ),
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
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: AppColors.primary,
              onPrimary: AppColors.white,
              surface: AppColors.white,
              onSurface: AppColors.textPrimaryLight,
            ),
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
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: AppColors.primary,
              onPrimary: AppColors.white,
              surface: AppColors.white,
              onSurface: AppColors.textPrimaryLight,
            ),
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
        'phone_number': _phoneController.text.trim(),
        'date_of_birth': _selectedBirthDate?.toIso8601String(),
        'time_of_birth': _birthTimeController.text.trim(),
        'place_of_birth': _birthPlaceController.text.trim(),
      };

      // Handle profile image upload if selected
      if (_selectedProfileImage != null) {
        try {
          // Show upload progress
          setState(() {
            _isUpdating = true;
          });
          
          final uploadedImageUrl = await _userApiService.uploadProfileImage(
            token: token,
            imagePath: _selectedProfileImage!.path,
          );
          updateData['profile_image'] = uploadedImageUrl;
          
          debugPrint('✅ Image uploaded successfully, URL: $uploadedImageUrl');
          
          // Update the profile image URL immediately for UI feedback
          setState(() {
            _profileImageUrl = uploadedImageUrl;
          });
          
        } catch (uploadError) {
          setState(() {
            _isUpdating = false;
          });
          
          String errorMessage = 'Failed to upload image';
          final errorString = uploadError.toString();
          
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
          
          debugPrint('Image upload error: $errorString'); // Debug log
          _showErrorSnackBar(errorMessage);
          return; // Don't proceed with profile update if image upload fails
        }
      }

      // Update profile via API using AuthService
      final updatedUser = await _authService.updateUserProfile(updateData);

      setState(() {
        _currentUser = updatedUser;
        _profileImageUrl = updatedUser.profilePicture; // Update profile image URL from server response
        _selectedProfileImage = null; // Clear selected image after successful upload
      });

      _showSuccessSnackBar('Profile updated successfully!');
      
    } catch (e) {
      _showErrorSnackBar('Failed to update profile: ${e.toString()}');
    } finally {
      setState(() {
        _isUpdating = false;
      });
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Text(
          'Edit Profile',
          style: AppTextStyles.heading4.copyWith(color: AppColors.white),
        ),
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
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                  ),
                ),
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
              padding: const EdgeInsets.only(bottom: 40),
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
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 15,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: _buildProfileImage(),
                          ),
                        ),
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
                              child: const Icon(
                                Icons.camera_alt,
                                color: AppColors.primary,
                                size: 20,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _currentUser?.name ?? 'User',
                      style: AppTextStyles.heading4.copyWith(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_currentUser?.email?.isNotEmpty == true) ...[
                      const SizedBox(height: 4),
                      Text(
                        _currentUser!.email!,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.white.withValues(alpha: 0.9),
                        ),
                      ),
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
                    // Personal Information Section
                    _buildSectionHeader('Personal Information'),
                    const SizedBox(height: 16),
                    
                    _buildTextField(
                      controller: _nameController,
                      label: 'Full Name',
                      icon: Icons.person,
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
                      icon: Icons.email,
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
                      icon: Icons.phone,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      validator: (value) {
                        if (value?.trim().isEmpty ?? true) {
                          return 'Phone number is required';
                        }
                        if (value!.length < 10) {
                          return 'Please enter a valid 10-digit phone number';
                        }
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Birth Information Section
                    _buildSectionHeader('Birth Information'),
                    const SizedBox(height: 16),
                    
                    GestureDetector(
                      onTap: _selectBirthDate,
                      child: _buildTextField(
                        controller: TextEditingController(
                          text: _selectedBirthDate != null
                              ? '${_selectedBirthDate!.day}/${_selectedBirthDate!.month}/${_selectedBirthDate!.year}'
                              : '',
                        ),
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
                        controller: _birthTimeController,
                        label: 'Time of Birth (Optional)',
                        icon: Icons.access_time,
                        enabled: false,
                        suffixIcon: Icons.arrow_drop_down,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    _buildTextField(
                      controller: _birthPlaceController,
                      label: 'Place of Birth (Optional)',
                      icon: Icons.location_on,
                    ),
                    
                    const SizedBox(height: 40),
                    
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
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isUpdating
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                                ),
                              )
                            : Text(
                                'Update Profile',
                                style: AppTextStyles.bodyLarge.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.white,
                                ),
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
    debugPrint('🖼️ Building profile image: selectedImage=${_selectedProfileImage?.path}, profileImageUrl=$_profileImageUrl');
    
    // Show selected image first
    if (_selectedProfileImage != null) {
      debugPrint('📱 Showing selected local image');
      return Image.file(
        _selectedProfileImage!,
        width: 120,
        height: 120,
        fit: BoxFit.cover,
      );
    }
    
    // Show existing profile image
    if (_profileImageUrl?.isNotEmpty == true) {
      final fullUrl = _getFullImageUrl(_profileImageUrl!);
      debugPrint('🌐 Showing network image: $fullUrl');
      return Image.network(
        fullUrl,
        width: 120,
        height: 120,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          debugPrint('❌ Image load error: $error');
          return _buildFallbackAvatar();
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) {
            debugPrint('✅ Image loaded successfully');
            return child;
          }
          debugPrint('⏳ Loading image...');
          return Container(
            width: 120,
            height: 120,
            color: AppColors.grey100,
            child: const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
        },
      );
    }
    
    // Show fallback avatar
    debugPrint('👤 Showing fallback avatar');
    return _buildFallbackAvatar();
  }

  Widget _buildFallbackAvatar() {
    final name = _currentUser?.name ?? 'User';
    final initials = name.isNotEmpty 
        ? name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase()
        : 'U';

    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary,
            AppColors.primary.withValues(alpha: 0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.heading2.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: AppTextStyles.heading6.copyWith(
            color: AppColors.textPrimaryLight,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool enabled = true,
    IconData? suffixIcon,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      enabled: enabled,
      validator: validator,
      inputFormatters: inputFormatters,
      style: AppTextStyles.bodyMedium.copyWith(
        color: enabled ? AppColors.textPrimaryLight : AppColors.textSecondaryLight,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.textSecondaryLight,
        ),
        prefixIcon: Icon(
          icon,
          color: AppColors.primary,
          size: 20,
        ),
        suffixIcon: suffixIcon != null
            ? Icon(
                suffixIcon,
                color: AppColors.textSecondaryLight,
                size: 20,
              )
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

  String _getFullImageUrl(String imageUrl) {
    // If the URL is already a full URL (starts with http), return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // If it's a relative path, prepend the server base URL
    final cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    final baseUrl = Config.mode == 'local' ? 'http://localhost:3000' : 'https://www.trueastrotalk.com';
    return '$baseUrl/$cleanPath';
  }
}