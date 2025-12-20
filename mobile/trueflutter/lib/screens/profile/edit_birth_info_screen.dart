import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/validation_patterns.dart';
import '../../config/config.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class EditBirthInfoScreen extends StatefulWidget {
  const EditBirthInfoScreen({super.key});

  @override
  State<EditBirthInfoScreen> createState() => _EditBirthInfoScreenState();
}

class _EditBirthInfoScreenState extends State<EditBirthInfoScreen> {
  late final AuthService _authService;
  final _formKey = GlobalKey<FormState>();

  final _birthPlaceController = TextEditingController();
  final _birthTimeController = TextEditingController();

  DateTime? _selectedBirthDate;
  bool _isLoading = true;
  bool _isUpdating = false;
  bool _isAstrologer = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadUserData();
  }

  @override
  void dispose() {
    _birthPlaceController.dispose();
    _birthTimeController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final user = _authService.currentUser;
      if (user != null) {
        _selectedBirthDate = user.dateOfBirth;
        _birthTimeController.text = user.timeOfBirth ?? '';
        _birthPlaceController.text = user.placeOfBirth ?? '';
        _isAstrologer = user.isAstrologer == true;
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthDate ?? DateTime(2000, 1, 1),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
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

  Future<void> _selectTime() async {
    TimeOfDay initialTime = TimeOfDay.now();

    // Parse existing time if available
    if (_birthTimeController.text.isNotEmpty) {
      try {
        final timeStr = _birthTimeController.text.trim();
        final parts = timeStr.split(' ');
        if (parts.length == 2) {
          final timeParts = parts[0].split(':');
          int hour = int.parse(timeParts[0]);
          final int minute = int.parse(timeParts[1]);
          final isPM = parts[1].toUpperCase() == 'PM';

          if (isPM && hour != 12) hour += 12;
          if (!isPM && hour == 12) hour = 0;

          initialTime = TimeOfDay(hour: hour, minute: minute);
        }
      } catch (e) {
        // Use default time if parsing fails
      }
    }

    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
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
        final hour = picked.hourOfPeriod == 0 ? 12 : picked.hourOfPeriod;
        final period = picked.period == DayPeriod.am ? 'AM' : 'PM';
        _birthTimeController.text = '${hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')} $period';
      });
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      final updateData = <String, dynamic>{};

      if (_selectedBirthDate != null) {
        updateData['date_of_birth'] = _selectedBirthDate!.toIso8601String();
      }
      if (_birthTimeController.text.trim().isNotEmpty) {
        updateData['time_of_birth'] = _birthTimeController.text.trim();
      }
      if (_birthPlaceController.text.trim().isNotEmpty) {
        updateData['place_of_birth'] = _birthPlaceController.text.trim();
      }

      await _authService.updateUserProfile(updateData);
      await _authService.refreshCurrentUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Birth information updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      String errorMessage = 'Failed to update profile';
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
    bool readOnly = false,
    VoidCallback? onTap,
    String? hintText,
  }) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      onTap: onTap,
      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        hintStyle: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.textSecondaryLight,
          fontStyle: FontStyle.italic,
        ),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
        suffixIcon: onTap != null
            ? Icon(Icons.chevron_right, color: AppColors.textSecondaryLight, size: 20)
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
        title: const Text('Birth Information'),
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
                      'Birth Information',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Date of Birth
                    GestureDetector(
                      onTap: _selectDate,
                      child: AbsorbPointer(
                        child: TextFormField(
                          controller: TextEditingController(
                            text: _selectedBirthDate != null
                                ? DateFormat('dd MMM yyyy').format(_selectedBirthDate!)
                                : '',
                          ),
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
                          decoration: InputDecoration(
                            labelText: 'Date of Birth',
                            hintText: 'Select your birth date',
                            labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
                            hintStyle: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondaryLight,
                              fontStyle: FontStyle.italic,
                            ),
                            prefixIcon: const Icon(Icons.calendar_today_outlined, color: AppColors.primary, size: 20),
                            suffixIcon: const Icon(Icons.chevron_right, color: AppColors.textSecondaryLight, size: 20),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppColors.borderLight),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppColors.borderLight),
                            ),
                            filled: true,
                            fillColor: AppColors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Time of Birth
                    GestureDetector(
                      onTap: _selectTime,
                      child: AbsorbPointer(
                        child: _buildTextField(
                          controller: _birthTimeController,
                          label: 'Time of Birth',
                          icon: Icons.access_time_outlined,
                          readOnly: true,
                          hintText: 'Select your birth time',
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Place of Birth
                    _buildTextField(
                      controller: _birthPlaceController,
                      label: 'Place of Birth',
                      icon: Icons.location_on_outlined,
                      hintText: 'Enter your birth place',
                    ),
                    const SizedBox(height: 32),

                    // Update Button or Contact Support
                    if (_isAstrologer)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: AppColors.primary,
                              size: 32,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'To update your account details, please contact our support team',
                              textAlign: TextAlign.center,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textPrimaryLight,
                              ),
                            ),
                            const SizedBox(height: 16),
                            InkWell(
                              onTap: () async {
                                final messenger = ScaffoldMessenger.of(context);
                                final Uri emailUri = Uri(
                                  scheme: 'mailto',
                                  path: Config.supportEmail,
                                  query: 'subject=Account Update Request',
                                );
                                final canLaunch = await canLaunchUrl(emailUri);
                                if (canLaunch) {
                                  await launchUrl(emailUri);
                                } else {
                                  if (mounted) {
                                    messenger.showSnackBar(
                                      SnackBar(
                                        content: Text('Email: ${Config.supportEmail}'),
                                        backgroundColor: AppColors.primary,
                                      ),
                                    );
                                  }
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.email_outlined,
                                      color: AppColors.white,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      Config.supportEmail,
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        color: AppColors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
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
