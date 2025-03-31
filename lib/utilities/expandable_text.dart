import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

class ExpandableText extends StatefulWidget {
  final String text;
  final TextStyle style;
  final int maxChars;

  const ExpandableText({
    Key? key,
    required this.text,
    required this.style,
    this.maxChars = 50,
  }) : super(key: key);

  @override
  State<ExpandableText> createState() => _ExpandableTextState();
}

class _ExpandableTextState extends State<ExpandableText> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    // If text is short enough or expanded, just display the full text
    if (_expanded || widget.text.length <= widget.maxChars) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.text,
            style: widget.style,
          ),
          if (_expanded && widget.text.length > widget.maxChars)
            GestureDetector(
              onTap: () {
                setState(() {
                  _expanded = false;
                });
              },
              child: Text(
                'Read less',
                style: TextStyle(
                  color: Colors.blue,
                  fontWeight: FontWeight.bold,
                  fontSize: widget.style.fontSize,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
        ],
      );
    }

    // For collapsed state with long text, use RichText to show "Read more" inline
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: widget.text.substring(0, widget.maxChars) + '...',
            style: widget.style,
          ),
          TextSpan(
            text: 'Read more',
            style: TextStyle(
              color: Colors.blue,
              fontWeight: FontWeight.bold,
              fontSize: widget.style.fontSize,
              decoration: TextDecoration.underline,
            ),
            recognizer: TapGestureRecognizer()
              ..onTap = () {
                setState(() {
                  _expanded = true;
                });
              },
          ),
        ],
      ),
    );
  }
}
