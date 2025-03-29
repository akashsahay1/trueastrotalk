import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:trueastrotalk/screens/login.dart';
import 'package:trueastrotalk/services/tokens.dart';

import '../config/colors.dart';

class AppDrawer extends StatefulWidget {
  final VoidCallback? onLogout;

  const AppDrawer({
    Key? key,
    this.onLogout,
  }) : super(key: key);

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  String _userFullName = "Guest User";
  String _userGender = "";
  String _userDob = "";
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  // Method to load user data from storage or API
  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userFullName = prefs.getString('user_name') ?? "Guest User";
      _userGender = prefs.getString('user_gender') ?? "";
      _userDob = prefs.getString('user_dob') ?? "";
      _isLoggedIn = prefs.getBool('is_logged_in') ?? false;
    });
  }

  // Calculate age from date of birth
  String calculateAgeWithText(String dateOfBirth) {
    if (dateOfBirth.isEmpty) return "";

    try {
      // Parse the date string into a DateTime object
      final DateTime dob = DateTime.parse(dateOfBirth);

      // Get the current date
      final DateTime now = DateTime.now();

      // Calculate age
      int age = now.year - dob.year;

      // Adjust age if birthday hasn't occurred yet this year
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        age--;
      }

      // Return formatted string with "years"
      return "$age ${age == 1 ? 'year' : 'years'}";
    } catch (e) {
      // Handle invalid date format
      return "";
    }
  }

  // Format gender and age
  String get formattedUserInfo {
    if (_userGender.isEmpty && _userDob.isEmpty) return "";

    final String ageText = calculateAgeWithText(_userDob);

    if (_userGender.isEmpty) return ageText;
    if (ageText.isEmpty) return _userGender;

    return "$_userGender, $ageText";
  }

  void _handleLogout() async {
    // Handle logout logic
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_logged_in', false);
    await prefs.setString('user_name', 'Guest User');
    await prefs.setString('user_type', 'Customer');
    await TokenService().removeFCMTokenFromBackend();
    Navigator.pop(context);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => Login()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Column(
        children: [
          // Custom drawer header with centered content
          Container(
            padding: const EdgeInsets.only(
              left: 16,
              right: 16,
              top: 100,
              bottom: 30,
            ),
            width: double.infinity,
            decoration: const BoxDecoration(
              color: AppColors.accentColor,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Centered avatar
                const CircleAvatar(
                  backgroundColor: Colors.white,
                  radius: 30,
                  child: Icon(
                    Icons.person,
                    size: 40,
                    color: AppColors.accentColor,
                  ),
                ),
                const SizedBox(height: 15),
                // Centered name
                Text(
                  _userFullName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontSize: 18,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                // Display gender and age
                if (formattedUserInfo.isNotEmpty)
                  Text(
                    formattedUserInfo,
                    style: const TextStyle(
                      fontSize: 15,
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ListTile(
                  leading: const Icon(Icons.person),
                  title: const Text('Profile'),
                  onTap: () {
                    Navigator.pushReplacementNamed(context, '/profile');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.payment),
                  title: const Text('Wallet'),
                  onTap: () {
                    Navigator.pushReplacementNamed(context, '/wallet');
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.description),
                  title: const Text('Terms'),
                  onTap: () {
                    Navigator.pushReplacementNamed(context, '/terms');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.info),
                  title: const Text('About'),
                  onTap: () {
                    Navigator.pushReplacementNamed(context, '/about');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.help),
                  title: const Text('Help'),
                  onTap: () {
                    Navigator.pushReplacementNamed(context, '/help');
                  },
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: OutlinedButton.icon(
              icon: const Icon(Icons.logout),
              label: Text(_isLoggedIn ? 'Logout' : 'Login'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 45),
                side: BorderSide(color: Colors.red.shade300),
                foregroundColor: Colors.red.shade400,
              ),
              onPressed: () {
                if (_isLoggedIn) {
                  _handleLogout();
                } else {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const Login()),
                  );
                }
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
