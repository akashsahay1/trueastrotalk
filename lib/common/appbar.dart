import 'package:flutter/material.dart';
//import 'package:trueastrotalk/screens/astrologers.dart';

class Appbar extends StatefulWidget implements PreferredSizeWidget {
  final String title;

  const Appbar({
    Key? key,
    this.title = '',
  }) : super(key: key);

  @override
  State<Appbar> createState() => _AppbarState();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _AppbarState extends State<Appbar> {
  late String _title;

  @override
  void initState() {
    super.initState();
    _title = widget.title;
  }

//   _navigatetoSearch() {
//     Navigator.pushReplacement(
//       context,
//       MaterialPageRoute(builder: (context) => Astrologers()),
//     );
//   }

  _showNotifications() {
    Navigator.pushReplacementNamed(context, '/notifications');
  }

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        _title,
        style: TextStyle(fontWeight: FontWeight.bold),
      ),
      centerTitle: false,
      backgroundColor: Color(0xFFFFFFFF),
      foregroundColor: Colors.black,
      actions: [
        IconButton(
          icon: Icon(Icons.notifications),
          onPressed: _showNotifications,
        ),
      ],
    );
  }
}
