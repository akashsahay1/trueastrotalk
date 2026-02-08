import 'dart:io' show Platform;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/widgets/google_places_address_field.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';
import '../../common/utils/error_handler.dart';

class SignupCompletionScreen extends StatefulWidget {
  const SignupCompletionScreen({super.key});

  @override
  State<SignupCompletionScreen> createState() => _SignupCompletionScreenState();
}

class _SignupCompletionScreenState extends State<SignupCompletionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _placeOfBirthController = TextEditingController(text: 'New Delhi, India');
  late final AuthService _authService;

  DateTime? _selectedDate = DateTime(2000, 1, 1);
  TimeOfDay? _selectedTime = const TimeOfDay(hour: 19, minute: 30);
  String _selectedGender = 'male';

  // Time picker values
  int? _selectedHour = 7;
  int? _selectedMinute = 30;
  String _selectedPeriod = 'PM';

  bool _isLoading = false;
  String? _nameError;
  String? _dateError;
  String? _timeError;
  String? _placeError;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      // Pre-fill name if provided (e.g., from Google sign-in)
      if (args['name'] != null) {
        _nameController.text = args['name'];
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _placeOfBirthController.dispose();
    super.dispose();
  }

  void _triggerHaptic() {
    HapticFeedback.lightImpact();
  }

  void _triggerErrorHaptic() {
    HapticFeedback.heavyImpact();
  }

  String? _validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  String? _validateDateOfBirth() {
    if (_selectedDate == null) {
      return 'Date of birth is required';
    }

    // Must be at least 13 years old
    final now = DateTime.now();
    final age = now.year - _selectedDate!.year;
    if (age < 13) {
      return 'You must be at least 13 years old';
    }

    return null;
  }

  String? _validateTimeOfBirth() {
    if (_selectedHour == null || _selectedMinute == null) {
      return 'Time of birth is required';
    }
    return null;
  }

  String? _validatePlaceOfBirth() {
    if (_placeOfBirthController.text.trim().isEmpty) {
      return 'Place of birth is required';
    }
    return null;
  }

  void _updateTimeOfDay() {
    if (_selectedHour != null && _selectedMinute != null) {
      int hour24 = _selectedHour!;
      if (_selectedPeriod == 'PM' && hour24 != 12) {
        hour24 += 12;
      } else if (_selectedPeriod == 'AM' && hour24 == 12) {
        hour24 = 0;
      }
      _selectedTime = TimeOfDay(hour: hour24, minute: _selectedMinute!);
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    // Unfocus any text fields before showing picker
    final focusScope = FocusScope.of(context);
    focusScope.unfocus();

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime(2000, 1, 1),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
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

    // Ensure focus is cleared after picker closes
    if (mounted) {
      focusScope.unfocus();
    }

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _dateError = null;
      });
    }
  }


  Future<void> _completeSignup() async {
    _triggerHaptic();

    // Validate
    setState(() {
      _nameError = _validateName(_nameController.text);
      _dateError = _validateDateOfBirth();
      _timeError = _validateTimeOfBirth();
      _placeError = _validatePlaceOfBirth();
    });

    if (_nameError != null || _dateError != null || _timeError != null || _placeError != null) {
      _triggerErrorHaptic();
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Build profile data to update
      final profileData = <String, dynamic>{
        'full_name': _nameController.text.trim(),
        'gender': _selectedGender,
        'place_of_birth': _placeOfBirthController.text.trim(),
      };

      if (_selectedDate != null) {
        profileData['date_of_birth'] = _selectedDate!.toIso8601String();
      }

      if (_selectedTime != null) {
        profileData['time_of_birth'] =
            '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}';
      }

      // Update user profile (user is already logged in after OTP verification)
      await _authService.updateUserProfile(profileData);

      // Set flag for home screen to show success popup
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('show_profile_complete_popup', true);

      // Navigate to home
      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/customer/home',
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        _triggerErrorHaptic();
        final appError = ErrorHandler.handleError(e, context: 'profile-update');
        ErrorHandler.showError(context, appError);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () {
            _triggerHaptic();
            Navigator.pop(context);
          },
          icon: const Icon(
            Icons.arrow_back_ios,
            color: AppColors.textPrimary,
            size: 22,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Text(
                  'Complete your profile',
                  style: AppTextStyles.heading2.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Help us personalize your experience',
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),

                const SizedBox(height: 32),

                // Name
                _buildLabel('Full name'),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _nameController,
                  icon: Icons.person_outline,
                  errorText: _nameError,
                  onChanged: (value) {
                    if (_nameError != null) {
                      setState(() {
                        _nameError = _validateName(value);
                      });
                    }
                  },
                ),

                const SizedBox(height: 20),

                // Gender
                _buildGenderSelector(),

                const SizedBox(height: 20),

                // Date of Birth
                _buildLabel('Date of birth'),
                const SizedBox(height: 8),
                _buildDateSelector(),

                const SizedBox(height: 20),

                // Time of birth
                _buildLabel('Time of birth'),
                const SizedBox(height: 8),
                _buildTimeSelector(),

                const SizedBox(height: 20),

                // Place of birth
                _buildLabel('Place of birth'),
                const SizedBox(height: 8),
                GooglePlacesAddressField(
                  addressController: _placeOfBirthController,
                  label: '',
                  hint: 'New Delhi, India',
                  restrictToCountry: true,
                  countryCode: 'in',
                ),
                if (_placeError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8, left: 4),
                    child: Text(
                      _placeError!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.error,
                        height: 1.4,
                      ),
                    ),
                  ),

                const SizedBox(height: 32),

                // Complete Button
                Container(
                  width: double.infinity,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _isLoading ? null : _completeSignup,
                      borderRadius: BorderRadius.circular(16),
                      child: Center(
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    AppColors.white,
                                  ),
                                ),
                              )
                            : Text(
                                'Complete Signup',
                                style: AppTextStyles.buttonLarge.copyWith(
                                  color: AppColors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required IconData icon,
    String? errorText,
    void Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 56,
          decoration: BoxDecoration(
            color: AppColors.white,
            border: Border.all(color: AppColors.grey300, width: 0.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              Expanded(
                child: TextField(
                  controller: controller,
                  onChanged: onChanged,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: const InputDecoration(
                    filled: true,
                    fillColor: Colors.transparent,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 0,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 4),
            child: Text(
              errorText,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.error,
                height: 1.4,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: AppTextStyles.labelLarge.copyWith(
        color: AppColors.textPrimary,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildGenderSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Gender',
          style: AppTextStyles.labelLarge.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildGenderOption('Male', 'male', Icons.male),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildGenderOption('Female', 'female', Icons.female),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildGenderOption('Other', 'other', Icons.more_horiz),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildGenderOption(String label, String value, IconData icon) {
    final isSelected = _selectedGender == value;
    return GestureDetector(
      onTap: () {
        _triggerHaptic();
        setState(() {
          _selectedGender = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.grey300,
            width: 1,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.2),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.white : AppColors.textSecondary,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: isSelected ? AppColors.white : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => _selectDate(context),
          child: Container(
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.white,
              border: Border.all(color: AppColors.grey300, width: 0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: Icon(
                    Icons.calendar_today_outlined,
                    color: AppColors.primary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedDate != null
                        ? DateFormat('MMMM dd, yyyy').format(_selectedDate!)
                        : 'January 01, 2000',
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: _selectedDate != null
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Icon(
                    Icons.keyboard_arrow_down,
                    color: AppColors.textSecondary,
                    size: 24,
                  ),
                ),
              ],
            ),
          ),
        ),
        if (_dateError != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 4),
            child: Text(
              _dateError!,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.error,
                height: 1.4,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildTimeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            // Hour picker
            Expanded(
              child: _buildPickerField(
                value: _selectedHour?.toString().padLeft(2, '0'),
                placeholder: '07',
                onTap: () => _showHourPicker(),
              ),
            ),
            const SizedBox(width: 12),
            // Minute picker
            Expanded(
              child: _buildPickerField(
                value: _selectedMinute?.toString().padLeft(2, '0'),
                placeholder: '30',
                onTap: () => _showMinutePicker(),
              ),
            ),
            const SizedBox(width: 12),
            // AM/PM picker
            Expanded(
              child: _buildPickerField(
                value: _selectedHour != null ? _selectedPeriod : null,
                placeholder: 'PM',
                onTap: () => _showPeriodPicker(),
              ),
            ),
          ],
        ),
        if (_timeError != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 4),
            child: Text(
              _timeError!,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.error,
                height: 1.4,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildPickerField({
    required String? value,
    required String placeholder,
    required VoidCallback onTap,
  }) {
    final displayValue = value ?? placeholder;
    final isPlaceholder = value == null;

    return GestureDetector(
      onTap: () {
        // Unfocus any text fields before showing picker
        FocusScope.of(context).unfocus();
        _triggerHaptic();
        onTap();
      },
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          color: AppColors.white,
          border: Border.all(color: AppColors.grey300, width: 0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: Center(
                child: Text(
                  displayValue,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: isPlaceholder
                        ? AppColors.textSecondary
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Icon(
                Icons.keyboard_arrow_down,
                color: AppColors.textSecondary,
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showHourPicker() {
    int initialIndex = _selectedHour != null ? _selectedHour! - 1 : 0;
    _showPlatformPicker(
      title: 'Select Hour',
      items: List.generate(12, (i) => (i + 1).toString().padLeft(2, '0')),
      initialIndex: initialIndex,
      onSelected: (index) {
        setState(() {
          _selectedHour = index + 1;
          _timeError = null;
          _updateTimeOfDay();
        });
      },
    );
  }

  void _showMinutePicker() {
    int initialIndex = _selectedMinute ?? 0;
    _showPlatformPicker(
      title: 'Select Minute',
      items: List.generate(60, (i) => i.toString().padLeft(2, '0')),
      initialIndex: initialIndex,
      onSelected: (index) {
        setState(() {
          _selectedMinute = index;
          _timeError = null;
          _updateTimeOfDay();
        });
      },
    );
  }

  void _showPeriodPicker() {
    int initialIndex = _selectedPeriod == 'PM' ? 1 : 0;
    _showPlatformPicker(
      title: 'Select AM/PM',
      items: ['AM', 'PM'],
      initialIndex: initialIndex,
      onSelected: (index) {
        setState(() {
          _selectedPeriod = index == 0 ? 'AM' : 'PM';
          _updateTimeOfDay();
        });
      },
    );
  }

  void _showPlatformPicker({
    required String title,
    required List<String> items,
    required int initialIndex,
    required void Function(int) onSelected,
  }) {
    if (Platform.isIOS) {
      _showCupertinoPicker(
        title: title,
        items: items,
        initialIndex: initialIndex,
        onSelected: onSelected,
      );
    } else {
      _showMaterialPicker(
        title: title,
        items: items,
        initialIndex: initialIndex,
        onSelected: onSelected,
      );
    }
  }

  // iOS-style wheel picker
  void _showCupertinoPicker({
    required String title,
    required List<String> items,
    required int initialIndex,
    required void Function(int) onSelected,
  }) {
    int selectedIndex = initialIndex;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: CupertinoColors.systemBackground,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header with Done button
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: CupertinoColors.systemGrey6,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 16,
                        ),
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      child: Text(
                        'Done',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      onPressed: () {
                        onSelected(selectedIndex);
                        Navigator.pop(context);
                      },
                    ),
                  ],
                ),
              ),
              // Picker
              SizedBox(
                height: 200,
                child: CupertinoPicker(
                  scrollController: FixedExtentScrollController(
                    initialItem: initialIndex,
                  ),
                  itemExtent: 44,
                  onSelectedItemChanged: (index) {
                    _triggerHaptic();
                    selectedIndex = index;
                  },
                  children: items.map((item) {
                    return Center(
                      child: Text(
                        item,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              SizedBox(height: MediaQuery.of(context).padding.bottom),
            ],
          ),
        );
      },
    );
  }

  // Android Material-style picker
  void _showMaterialPicker({
    required String title,
    required List<String> items,
    required int initialIndex,
    required void Function(int) onSelected,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppColors.grey200, width: 1),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 18,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(
                        Icons.close,
                        color: AppColors.textSecondary,
                      ),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              ),
              // List of items
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.4,
                ),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final isSelected = index == initialIndex;
                    return InkWell(
                      onTap: () {
                        _triggerHaptic();
                        onSelected(index);
                        Navigator.pop(context);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withValues(alpha: 0.1)
                              : Colors.transparent,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              items[index],
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.textPrimary,
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check,
                                color: AppColors.primary,
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              SizedBox(height: MediaQuery.of(context).padding.bottom),
            ],
          ),
        );
      },
    );
  }
}
