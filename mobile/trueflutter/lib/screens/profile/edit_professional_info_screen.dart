import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/validation_patterns.dart';
import '../../services/auth/auth_service.dart';
import '../../services/service_locator.dart';

class EditProfessionalInfoScreen extends StatefulWidget {
  const EditProfessionalInfoScreen({super.key});

  @override
  State<EditProfessionalInfoScreen> createState() =>
      _EditProfessionalInfoScreenState();
}

class _EditProfessionalInfoScreenState
    extends State<EditProfessionalInfoScreen> {
  late final AuthService _authService;
  final _formKey = GlobalKey<FormState>();

  final _bioController = TextEditingController();
  final _qualificationController = TextEditingController();

  int? _selectedExperience;
  final Set<String> _selectedLanguages = <String>{};
  final Set<String> _selectedSkills = <String>{};
  final List<String> _qualificationsList = [];

  List<String> _availableLanguages = [];
  List<String> _availableSkills = [];

  bool _isLoading = true;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _loadData();
  }

  @override
  void dispose() {
    _bioController.dispose();
    _qualificationController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      // Load available options
      final options = await _authService.getAstrologerOptions();
      _availableLanguages = options['languages'] ?? [];
      _availableSkills = options['skills'] ?? [];

      // Load user data
      final user = _authService.currentUser;
      if (user != null) {
        _bioController.text = user.bio ?? '';
        _selectedExperience = user.experienceYears;

        // Parse languages
        if (user.languages != null && user.languages!.isNotEmpty) {
          _selectedLanguages.addAll(user.languages!);
        }

        // Parse skills
        if (user.skills != null && user.skills!.isNotEmpty) {
          _selectedSkills.addAll(user.skills!);
        }

        // Parse qualifications
        if (user.qualifications != null && user.qualifications!.isNotEmpty) {
          _qualificationsList.addAll(user.qualifications!);
        }
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // Validate selections
    if (_selectedLanguages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one language'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_selectedSkills.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least 2 skills'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      final updateData = <String, dynamic>{
        'bio': _bioController.text.trim(),
        'experience_years': _selectedExperience ?? 0,
        'languages': _selectedLanguages.join(', '),
        'skills': _selectedSkills.join(', '),
        'qualifications': _qualificationsList.isEmpty
            ? null
            : _qualificationsList.join(', '),
      };

      await _authService.updateUserProfile(updateData);
      await _authService.refreshCurrentUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Professional information updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      String errorMessage = 'Failed to update profile';
      final errorString = e.toString();
      final extractedMessage = ValidationPatterns.extractExceptionMessage(
        errorString,
      );
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

  void _showMultiSelectDropdown({
    required String title,
    required List<String> items,
    required Set<String> selectedItems,
    required Function(Set<String>) onSelectionChanged,
    required int minSelections,
  }) {
    Set<String> tempSelection = Set.from(selectedItems);

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.heading6.copyWith(
                      color: AppColors.textPrimaryLight,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Select minimum $minSelections ${minSelections == 1 ? 'item' : 'items'}',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
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
                      title: Text(
                        item,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textPrimaryLight,
                        ),
                      ),
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
                  child: Text(
                    'Cancel',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
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
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    'Done (${tempSelection.length})',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _addQualification() {
    if (_qualificationController.text.trim().isNotEmpty) {
      setState(() {
        _qualificationsList.add(_qualificationController.text.trim());
        _qualificationController.clear();
      });
    }
  }

  void _removeQualification(int index) {
    setState(() {
      _qualificationsList.removeAt(index);
    });
  }

  Widget _buildMultiSelectField({
    required String label,
    required Set<String> selectedItems,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.labelLarge.copyWith(
            color: AppColors.textPrimaryLight,
            fontWeight: FontWeight.w600,
          ),
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
                    child: selectedItems.isNotEmpty
                        ? Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: selectedItems.map((item) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(
                                    alpha: 0.1,
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  item,
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              );
                            }).toList(),
                          )
                        : Text(
                            'Tap to select',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Icon(
                    Icons.arrow_drop_down,
                    color: AppColors.textSecondaryLight,
                    size: 24,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQualificationsRepeaterField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Qualifications',
          style: AppTextStyles.labelLarge.copyWith(
            color: AppColors.textPrimaryLight,
            fontWeight: FontWeight.w600,
          ),
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
                          hintText: 'Add a qualification',
                          hintStyle: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(
                              color: AppColors.borderLight,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(
                              color: AppColors.borderLight,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(
                              color: AppColors.primary,
                              width: 2,
                            ),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 12,
                          ),
                        ),
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textPrimaryLight,
                        ),
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
                        child: const SizedBox(
                          width: 40,
                          height: 40,
                          child: Icon(
                            Icons.add,
                            color: AppColors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Display added qualifications
                if (_qualificationsList.isNotEmpty) ...[
                  Text(
                    'Added Qualifications:',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondaryLight,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...List.generate(_qualificationsList.length, (index) {
                    final qualification = _qualificationsList[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  qualification,
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.textPrimaryLight,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              InkWell(
                                onTap: () => _removeQualification(index),
                                borderRadius: BorderRadius.circular(12),
                                child: const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: Icon(
                                    Icons.close,
                                    color: AppColors.error,
                                    size: 16,
                                  ),
                                ),
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
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondaryLight,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      appBar: AppBar(
        title: const Text('Professional Info'),
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
                      'Professional Information',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Bio
                    Text(
                      'Bio',
                      style: AppTextStyles.labelLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _bioController,
                      maxLines: 4,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textPrimaryLight,
                      ),
                      decoration: InputDecoration(
                        hintText:
                            'Tell clients about yourself and your expertise...',
                        hintStyle: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textSecondaryLight,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.borderLight,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.borderLight,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.primary,
                            width: 2,
                          ),
                        ),
                        filled: true,
                        fillColor: AppColors.white,
                        contentPadding: const EdgeInsets.all(16),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter your bio';
                        }
                        if (value.trim().length < 50) {
                          return 'Bio should be at least 50 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // Experience
                    Text(
                      'Years of Experience',
                      style: AppTextStyles.labelLarge.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      // ignore: deprecated_member_use
                      child: DropdownButtonFormField<int>(
                        initialValue: _selectedExperience,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        hint: Text(
                          'Select experience',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                        items: List.generate(50, (index) => index + 1).map((
                          year,
                        ) {
                          return DropdownMenuItem<int>(
                            value: year,
                            child: Text(
                              '$year ${year == 1 ? 'year' : 'years'}',
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedExperience = value;
                          });
                        },
                        validator: (value) {
                          if (value == null) {
                            return 'Please select your experience';
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Languages
                    _buildMultiSelectField(
                      label: 'Languages (min 1)',
                      selectedItems: _selectedLanguages,
                      onTap: () {
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
                      },
                    ),
                    const SizedBox(height: 20),

                    // Skills
                    _buildMultiSelectField(
                      label: 'Skills (min 2)',
                      selectedItems: _selectedSkills,
                      onTap: () {
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
                      },
                    ),
                    const SizedBox(height: 20),

                    // Qualifications
                    _buildQualificationsRepeaterField(),
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
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    AppColors.white,
                                  ),
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
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }
}
