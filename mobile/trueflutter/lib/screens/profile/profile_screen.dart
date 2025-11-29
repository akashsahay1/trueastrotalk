import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/models/user.dart' as app_user;
import 'dart:io';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';
import '../../models/enums.dart';
import '../../config/config.dart';
import 'widgets/profile_section_card.dart';
import 'edit_personal_info_screen.dart';
import 'edit_birth_info_screen.dart';
import 'edit_professional_info_screen.dart';
import 'edit_session_rates_screen.dart';
import 'edit_bank_details_screen.dart';
import 'edit_address_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final AuthService _authService;

  app_user.User? _currentUser;
  File? _selectedProfileImage;
  bool _isLoading = true;
  bool _isUploadingImage = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await _authService.refreshCurrentUser();
      final user = _authService.currentUser;
      setState(() {
        _currentUser = user;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading profile: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _pickImage() async {
    try {
      final ImagePicker picker = ImagePicker();

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
          await _uploadProfileImage();
        }
      }
    } catch (e) {
      _showErrorSnackBar('Failed to pick image: ${e.toString()}');
    }
  }

  Future<void> _uploadProfileImage() async {
    if (_selectedProfileImage == null) return;

    setState(() {
      _isUploadingImage = true;
    });

    try {
      await _authService.updateUserProfile(
        {},
        profileImagePath: _selectedProfileImage!.path,
      );
      await _authService.refreshCurrentUser();

      setState(() {
        _currentUser = _authService.currentUser;
        _selectedProfileImage = null;
      });

      _showSuccessSnackBar('Profile image updated successfully!');
    } catch (e) {
      _showErrorSnackBar('Failed to update profile image');
      setState(() {
        _selectedProfileImage = null;
      });
    } finally {
      setState(() {
        _isUploadingImage = false;
      });
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

  void _showErrorSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showSuccessSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _navigateToEditScreen(Widget screen) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (context) => screen),
    );

    if (result == true) {
      await _loadUserProfile();
    }
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

  Widget _buildProfileImage() {
    if (_selectedProfileImage != null) {
      return Image.file(
        _selectedProfileImage!,
        width: 120,
        height: 120,
        fit: BoxFit.cover,
      );
    }

    final profilePicture = _currentUser?.profilePicture;
    if (profilePicture != null && profilePicture.isNotEmpty) {
      return Image.network(
        _buildImageUrl(profilePicture),
        width: 120,
        height: 120,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: 120,
            height: 120,
            color: AppColors.grey100,
            child: const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          return _buildFallbackAvatar();
        },
      );
    }

    return _buildFallbackAvatar();
  }

  Widget _buildFallbackAvatar() {
    final name = _currentUser?.name ?? 'User';
    final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase();

    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primary.withValues(alpha: 0.7),
          ],
        ),
      ),
      child: Center(
        child: Text(
          initials.isEmpty ? 'U' : initials,
          style: const TextStyle(
            color: AppColors.white,
            fontSize: 40,
            fontWeight: FontWeight.bold,
          ),
        ),
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

    final isAstrologer = _currentUser?.isAstrologer == true;

    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        title: Text(
          'Profile',
          style: AppTextStyles.heading4.copyWith(color: AppColors.white),
        ),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile Header Section
            Container(
              color: AppColors.primary,
              padding: const EdgeInsets.only(top: 20, bottom: 40),
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
                            child: _isUploadingImage
                                ? Container(
                                    color: AppColors.grey100,
                                    child: const Center(
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    ),
                                  )
                                : _buildProfileImage(),
                          ),
                        ),
                        // Camera icon for changing profile image (not for Google users)
                        if (_currentUser?.authType != AuthType.google)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: _isUploadingImage ? null : _pickImage,
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
                        // Info icon for Google users
                        if (_currentUser?.authType == AuthType.google)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Profile picture is managed by Google'),
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              },
                              child: Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: AppColors.white,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppColors.primary, width: 2),
                                ),
                                child: const Icon(
                                  Icons.info_outline,
                                  color: AppColors.primary,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // User name
                    Text(
                      _currentUser?.name ?? 'User',
                      style: AppTextStyles.heading5.copyWith(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    // User role badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        isAstrologer ? 'Astrologer' : 'Customer',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Section Cards
            const SizedBox(height: 16),

            // Personal Information - for all users
            ProfileSectionCard(
              icon: Icons.person_outline,
              title: 'Personal Information',
              subtitle: 'Name, Email, Phone',
              onTap: () => _navigateToEditScreen(const EditPersonalInfoScreen()),
            ),

            // Birth Information - for customers only
            if (!isAstrologer)
              ProfileSectionCard(
                icon: Icons.cake_outlined,
                title: 'Birth Information',
                subtitle: 'Date, Time, Place of Birth',
                onTap: () => _navigateToEditScreen(const EditBirthInfoScreen()),
              ),

            // Professional Information - for astrologers only
            if (isAstrologer)
              ProfileSectionCard(
                icon: Icons.work_outline,
                title: 'Professional Information',
                subtitle: 'Bio, Experience, Skills',
                onTap: () => _navigateToEditScreen(const EditProfessionalInfoScreen()),
              ),

            // Session Rates - for astrologers only
            if (isAstrologer)
              ProfileSectionCard(
                icon: Icons.attach_money,
                title: 'Session Rates',
                subtitle: 'Chat, Call, Video rates (/min)',
                onTap: () => _navigateToEditScreen(const EditSessionRatesScreen()),
              ),

            // Bank Details - for astrologers only
            if (isAstrologer)
              ProfileSectionCard(
                icon: Icons.account_balance_outlined,
                title: 'Bank Details',
                subtitle: 'Account info, PAN card',
                onTap: () => _navigateToEditScreen(const EditBankDetailsScreen()),
              ),

            // Address - for all users
            ProfileSectionCard(
              icon: Icons.location_on_outlined,
              title: 'Address',
              subtitle: 'Address, City, State, Country',
              onTap: () => _navigateToEditScreen(const EditAddressScreen()),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
