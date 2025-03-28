import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';

class InternationalPhoneField extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String? Function(String?)? validator;
  // Add callback for country code changes
  final Function(String)? onCountryCodeChanged;

  const InternationalPhoneField({
    Key? key,
    required this.controller,
    required this.focusNode,
    this.validator,
    this.onCountryCodeChanged,
  }) : super(key: key);

  @override
  State<InternationalPhoneField> createState() => _InternationalPhoneFieldState();
}

class _InternationalPhoneFieldState extends State<InternationalPhoneField> {
  String _countryCode = '+91'; // Default to India code
  final GlobalKey<FormFieldState> _phoneFieldKey = GlobalKey<FormFieldState>();

  @override
  void initState() {
    super.initState();

    // Notify parent widget of initial country code
    if (widget.onCountryCodeChanged != null) {
      widget.onCountryCodeChanged!(_countryCode);
    }

    // Handle initial phone value if needed
    if (widget.controller.text.isNotEmpty && widget.controller.text.startsWith('+')) {
      final match = RegExp(r'^\+\d+').firstMatch(widget.controller.text);
      if (match != null) {
        _countryCode = match.group(0) ?? '+91';
        // Remove country code from the controller text
        final phoneNumber = widget.controller.text.replaceFirst(RegExp(r'^\+\d+\s*'), '');
        widget.controller.text = phoneNumber;

        // Notify parent widget
        if (widget.onCountryCodeChanged != null) {
          widget.onCountryCodeChanged!(_countryCode);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 130,
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

                // Notify parent widget of country code change
                if (widget.onCountryCodeChanged != null) {
                  widget.onCountryCodeChanged!(_countryCode);
                }

                // Validate the field if needed
                _phoneFieldKey.currentState?.validate();
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
            validator: widget.validator,
            // No need to modify the value on change anymore
          ),
        ),
      ],
    );
  }
}
