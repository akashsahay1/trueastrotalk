import 'package:flutter/material.dart';
import 'package:trueastrotalk/config/colors.dart';

class Bottombar extends StatelessWidget {
  final int initialIndex;
  final Function(int) onTap;

  const Bottombar({
    Key? key,
    required this.initialIndex,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      backgroundColor: Color(0xFFFDFDFD),
      type: BottomNavigationBarType.fixed,
      currentIndex: initialIndex,
      onTap: onTap,
      selectedItemColor: AppColors.accentColor,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.phone),
          label: 'Calls',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.message),
          label: 'Chats',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.question_mark_sharp),
          label: 'Help',
        ),
      ],
    );
  }
}
