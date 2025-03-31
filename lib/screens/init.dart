import 'package:flutter/material.dart';
import 'package:trueastrotalk/common/appbar.dart';
import 'package:trueastrotalk/common/bottombar.dart';
import 'package:trueastrotalk/common/drawer.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/screens/about.dart';
import 'package:trueastrotalk/screens/astrocalls.dart';
import 'package:trueastrotalk/screens/astrochats.dart';
import 'package:trueastrotalk/screens/help.dart';
import 'package:trueastrotalk/screens/home.dart';
import 'package:trueastrotalk/screens/notifications.dart';
import 'package:trueastrotalk/screens/privacy.dart';
import 'package:trueastrotalk/screens/terms.dart';
import 'package:trueastrotalk/screens/wallet.dart';

class Init extends StatefulWidget {
  final int initialIndex;
  final dynamic arguments;

  const Init({
    super.key,
    this.initialIndex = 0,
    this.arguments,
  });

  @override
  State<Init> createState() => _InitState();
}

class _InitState extends State<Init> {
  late int _selectedIndex;
  late int _bottomIndex;
  User? astrologer;

  final List<String> _titles = [
    'True Astrotalk',
    'Astrologers',
    'Astrologers',
    'Help & Support',
    'Wallet',
    'About',
    'Terms of Services',
    'Notifications',
    'Privacy Policy',
  ];

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    if (_selectedIndex > 3) {
      _bottomIndex = 0;
    } else {
      _bottomIndex = _selectedIndex;
    }

    // Initialize astrologer here if arguments exist
    if (widget.arguments != null) {
      astrologer = widget.arguments as User;
    }
  }

  void _onItemTapped(int index) {
    if (index != _selectedIndex) {
      setState(() {
        _selectedIndex = index;
      });
      // Update the route to reflect the current tab (optional)
      String route = '/home';
      switch (index) {
        case 0:
          route = '/home';
          break;
        case 1:
          route = '/astrocalls';
          break;
        case 2:
          route = '/astrochats';
          break;
        case 3:
          route = '/help';
          break;
        default:
          break;
      }
      // Replace current route without creating a new history entry
      Navigator.of(context).pushReplacementNamed(route);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Don't try to access astrologer here - we already set it in initState

    return Scaffold(
      appBar: Appbar(
        title: _titles[_selectedIndex],
      ),
      backgroundColor: Color(0xFFF1F4F5),
      drawer: AppDrawer(),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          Home(),
          Astrocalls(),
          Astrochats(),
          Help(),
          Wallet(),
          About(),
          Terms(),
          Notifications(),
          Privacy(),
        ],
      ),
      bottomNavigationBar: Bottombar(
        initialIndex: _bottomIndex,
        onTap: _onItemTapped,
      ),
    );
  }
}
