import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/validation_patterns.dart';
import '../../config/config.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class EditBankDetailsScreen extends StatefulWidget {
  const EditBankDetailsScreen({super.key});

  @override
  State<EditBankDetailsScreen> createState() => _EditBankDetailsScreenState();
}

class _EditBankDetailsScreenState extends State<EditBankDetailsScreen> {
  late final AuthService _authService;
  final _formKey = GlobalKey<FormState>();

  final _accountHolderController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _ifscController = TextEditingController();

  File? _selectedPanCardImage;
  String? _currentPanCardUrl;

  bool _isLoading = true;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadUserData();
  }

  @override
  void dispose() {
    _accountHolderController.dispose();
    _accountNumberController.dispose();
    _bankNameController.dispose();
    _ifscController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final user = _authService.currentUser;
      if (user != null) {
        _accountHolderController.text = user.accountHolderName ?? '';
        _accountNumberController.text = user.accountNumber ?? '';
        _bankNameController.text = user.bankName ?? '';
        _ifscController.text = user.ifscCode ?? '';
        _currentPanCardUrl = user.panCardUrl;
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _pickPanCardImage() async {
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
                'Select PAN Card Image',
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
          maxWidth: 1024,
          maxHeight: 1024,
          imageQuality: 85,
        );

        if (image != null) {
          setState(() {
            _selectedPanCardImage = File(image.path);
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick PAN card image: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
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

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      final updateData = <String, dynamic>{
        'account_holder_name': _accountHolderController.text.trim(),
        'account_number': _accountNumberController.text.trim(),
        'bank_name': _bankNameController.text.trim(),
        'ifsc_code': _ifscController.text.trim().toUpperCase(),
      };

      await _authService.updateUserProfile(
        updateData,
        panCardImagePath: _selectedPanCardImage?.path,
      );
      await _authService.refreshCurrentUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bank details updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      String errorMessage = 'Failed to update bank details';
      final errorString = e.toString();
      final extractedMessage = ValidationPatterns.extractExceptionMessage(errorString);
      if (extractedMessage != null) {
        errorMessage = extractedMessage;
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
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
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        title: const Text('Bank Details'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimaryLight,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Section heading
                    Text(
                      'Bank Details',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Account Holder Name
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

                    // Account Number
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

                    // Bank Name
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

                    // IFSC Code
                    _buildTextField(
                      controller: _ifscController,
                      label: 'IFSC Code',
                      icon: Icons.code,
                      inputFormatters: [
                        LengthLimitingTextInputFormatter(11),
                        FilteringTextInputFormatter.allow(ValidationPatterns.alphanumericUpperPattern),
                      ],
                      validator: (value) {
                        if (value?.trim().isEmpty ?? true) {
                          return 'IFSC code is required';
                        }
                        if (!ValidationPatterns.isValidIfsc(value!)) {
                          return 'Please enter a valid IFSC code (e.g., SBIN0001234)';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // PAN Card Upload Section
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'PAN Card Image',
                          style: AppTextStyles.labelLarge.copyWith(
                            color: AppColors.textPrimaryLight,
                            fontWeight: FontWeight.w600,
                          ),
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
                                : _currentPanCardUrl != null && _currentPanCardUrl!.isNotEmpty
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: Image.network(
                                          _buildImageUrl(_currentPanCardUrl!),
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
                          'Tap to ${_selectedPanCardImage != null || (_currentPanCardUrl?.isNotEmpty == true) ? 'change' : 'upload'} PAN card image',
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Update Button
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isUpdating ? null : _updateProfile,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                        child: _isUpdating
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                                ),
                              )
                            : const Text(
                                'Update',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
