import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';

class InternationalPhoneField extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String? Function(String?)? validator;

  const InternationalPhoneField({
    Key? key,
    required this.controller,
    required this.focusNode,
    this.validator,
  }) : super(key: key);

  @override
  State<InternationalPhoneField> createState() => _InternationalPhoneFieldState();
}

class _InternationalPhoneFieldState extends State<InternationalPhoneField> {
  String _countryCode = '+91'; // Default to US code
  final GlobalKey<FormFieldState> _phoneFieldKey = GlobalKey<FormFieldState>();

  @override
  void initState() {
    super.initState();
    // Set initial country code if controller is empty
    if (widget.controller.text.isEmpty) {
      widget.controller.text = '$_countryCode ';
    }
    // Extract country code from existing value if present
    else if (widget.controller.text.startsWith('+')) {
      final match = RegExp(r'^\+\d+').firstMatch(widget.controller.text);
      if (match != null) {
        _countryCode = match.group(0) ?? '+91';
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: Colors.grey,
                width: 1.0,
              ),
            ),
          ),
          child: CountryCodePicker(
            onChanged: (CountryCode countryCode) {
              setState(() {
                _countryCode = countryCode.dialCode ?? '+91';
                if (widget.controller.text.isNotEmpty) {
                  final phoneNumber = widget.controller.text.replaceFirst(RegExp(r'^\+\d+\s*'), '');
                  widget.controller.text = '$phoneNumber';
                  _phoneFieldKey.currentState?.validate();
                }
              });
            },
            initialSelection: 'IN',
            favorite: const ['IN', 'US'],
            showCountryOnly: false,
            showOnlyCountryWhenClosed: false,
            alignLeft: true,
            padding: EdgeInsets.zero,
            countryFilter: null,
            showFlagMain: true,
            showFlag: true,
            pickerStyle: PickerStyle.dialog,
          ),
        ),
        SizedBox(width: 15),
        Expanded(
          child: TextFormField(
            key: _phoneFieldKey,
            focusNode: widget.focusNode,
            controller: widget.controller,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              hintText: 'Phone number',
              contentPadding: EdgeInsets.symmetric(
                vertical: 10,
              ),
              border: UnderlineInputBorder(),
              enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Colors.grey),
              ),
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Colors.grey),
              ),
            ),
            style: const TextStyle(
              color: Colors.black,
              fontSize: 15.0,
            ),
            textInputAction: TextInputAction.done,
            onChanged: (value) {
              // Ensure country code is always part of the phone number
              if (value.isNotEmpty && !value.startsWith('+')) {
                // Preserve cursor position
                final cursorPos = widget.controller.selection.start;

                // Only prepend country code if it's not already there
                if (!widget.controller.text.startsWith(_countryCode)) {
                  widget.controller.text = '$_countryCode $value';

                  // Restore cursor position adjusting for added country code
                  final newCursorPos = cursorPos + (_countryCode.length + 1);
                  if (newCursorPos <= widget.controller.text.length) {
                    widget.controller.selection = TextSelection.fromPosition(TextPosition(offset: newCursorPos));
                  }
                }
              }
            },
          ),
        ),
      ],
    );
  }
}
