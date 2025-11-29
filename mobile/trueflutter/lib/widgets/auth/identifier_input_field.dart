import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/utils/validation_patterns.dart';

enum IdentifierType { email, phone, unknown }

class IdentifierInputField extends StatefulWidget {
  final TextEditingController controller;
  final Function(IdentifierType type, String value) onChanged;
  final String? errorText;
  final bool enabled;

  const IdentifierInputField({
    super.key,
    required this.controller,
    required this.onChanged,
    this.errorText,
    this.enabled = true,
  });

  @override
  State<IdentifierInputField> createState() => _IdentifierInputFieldState();
}

class _IdentifierInputFieldState extends State<IdentifierInputField> {
  IdentifierType _currentType = IdentifierType.unknown;
  String _selectedCountryCode = '+91'; // Default to India

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_handleTextChange);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_handleTextChange);
    super.dispose();
  }

  void _handleTextChange() {
    final text = widget.controller.text.trim();
    final detectedType = _detectIdentifierType(text);

    if (detectedType != _currentType) {
      setState(() {
        _currentType = detectedType;
      });
    }

    // Format phone number if needed
    if (detectedType == IdentifierType.phone) {
      final formattedPhone = _formatPhoneNumber(text);
      widget.onChanged(detectedType, formattedPhone);
    } else {
      widget.onChanged(detectedType, text);
    }
  }

  IdentifierType _detectIdentifierType(String text) {
    if (text.isEmpty) return IdentifierType.unknown;

    // Check if it's an email (contains @)
    if (text.contains('@')) {
      return IdentifierType.email;
    }

    // Check if it's a phone (starts with + or contains only digits/spaces/dashes)
    if (ValidationPatterns.isPhoneInput(text)) {
      return IdentifierType.phone;
    }

    // If it starts with a digit, assume phone
    if (ValidationPatterns.startsWithDigit(text)) {
      return IdentifierType.phone;
    }

    return IdentifierType.unknown;
  }

  String _formatPhoneNumber(String text) {
    // Remove all non-digit characters except +
    String cleaned = ValidationPatterns.cleanPhoneNumber(text);

    // If it starts with country code, use it as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // If it starts with 0, remove it and add country code
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present
    if (!cleaned.startsWith('+')) {
      return '$_selectedCountryCode$cleaned';
    }

    return cleaned;
  }

  IconData _getLeadingIcon() {
    switch (_currentType) {
      case IdentifierType.email:
        return Icons.email_outlined;
      case IdentifierType.phone:
        return Icons.phone_outlined;
      case IdentifierType.unknown:
        return Icons.alternate_email;
    }
  }

  String _getHintText() {
    switch (_currentType) {
      case IdentifierType.email:
        return 'yourname@example.com';
      case IdentifierType.phone:
        return '9876543210';
      case IdentifierType.unknown:
        return 'Email or phone number';
    }
  }

  TextInputType _getKeyboardType() {
    switch (_currentType) {
      case IdentifierType.email:
        return TextInputType.emailAddress;
      case IdentifierType.phone:
        return TextInputType.phone;
      case IdentifierType.unknown:
        return TextInputType.text;
    }
  }

  List<TextInputFormatter> _getInputFormatters() {
    if (_currentType == IdentifierType.phone) {
      return [
        FilteringTextInputFormatter.allow(ValidationPatterns.phoneInputPattern),
      ];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Email or Phone Number',
          style: AppTextStyles.labelLarge.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: widget.errorText != null
                ? Border.all(color: AppColors.error, width: 1)
                : null,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              // Leading icon
              Container(
                padding: const EdgeInsets.all(16),
                child: Icon(
                  _getLeadingIcon(),
                  color: AppColors.primary,
                  size: 22,
                ),
              ),

              // Country code dropdown for phone
              if (_currentType == IdentifierType.phone) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedCountryCode,
                      items: [
                        DropdownMenuItem(value: '+91', child: Text('+91')),
                        DropdownMenuItem(value: '+1', child: Text('+1')),
                        DropdownMenuItem(value: '+44', child: Text('+44')),
                        DropdownMenuItem(value: '+61', child: Text('+61')),
                        DropdownMenuItem(value: '+971', child: Text('+971')),
                      ],
                      onChanged: widget.enabled
                          ? (value) {
                              if (value != null) {
                                setState(() {
                                  _selectedCountryCode = value;
                                });
                                _handleTextChange();
                              }
                            }
                          : null,
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                Container(
                  height: 24,
                  width: 1,
                  color: AppColors.grey300,
                ),
              ],

              // Text input field
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  enabled: widget.enabled,
                  keyboardType: _getKeyboardType(),
                  inputFormatters: _getInputFormatters(),
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    hintText: _getHintText(),
                    hintStyle: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.textSecondary.withValues(alpha: 0.5),
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 18,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Type indicator
        if (_currentType != IdentifierType.unknown)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 4),
            child: Row(
              children: [
                Icon(
                  Icons.check_circle,
                  size: 14,
                  color: AppColors.success,
                ),
                const SizedBox(width: 4),
                Text(
                  _currentType == IdentifierType.email
                      ? 'Email detected'
                      : 'Phone number detected',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.success,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),

        // Error message
        if (widget.errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 4),
            child: Text(
              widget.errorText!,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.error,
                height: 1.4,
              ),
            ),
          ),
      ],
    );
  }
}
