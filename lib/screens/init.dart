import 'package:flutter/material.dart';
import 'package:trueastrotalk/common/appbar.dart';
import 'package:trueastrotalk/common/bottombar.dart';
import 'package:trueastrotalk/common/drawer.dart';
import 'package:trueastrotalk/models/astrologer.dart';
import 'package:trueastrotalk/screens/about.dart';
import 'package:trueastrotalk/screens/astrologer_details.dart';
import 'package:trueastrotalk/screens/astrologers.dart';
import 'package:trueastrotalk/screens/calls.dart';
import 'package:trueastrotalk/screens/chats.dart';
import 'package:trueastrotalk/screens/help.dart';
import 'package:trueastrotalk/screens/home.dart';
import 'package:trueastrotalk/screens/notifications.dart';
import 'package:trueastrotalk/screens/profile.dart';
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
  Astrologer? astrologer;

  final List<String> _titles = [
    'True Astrotalk',
    'Astrologers',
    'Calls',
    'Chats',
    'Profile',
    'Notifications',
    'Wallet',
    'About',
    'Terms of Services',
    'Help & Support',
    'Astrologer Details',
    'Chat Request',
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
      astrologer = widget.arguments as Astrologer;
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
          route = '/astrologers';
          break;
        case 2:
          route = '/calls';
          break;
        case 3:
          route = '/chats';
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
          Astrologers(),
          Calls(),
          Chats(),
          Profile(),
          Notifications(),
          Wallet(),
          About(),
          Terms(),
          Help(),
          AstrologerDetails(astrologer: widget.arguments is Astrologer ? widget.arguments : null),
        ],
      ),
      bottomNavigationBar: Bottombar(
        initialIndex: _bottomIndex,
        onTap: _onItemTapped,
      ),
    );
  }
}
