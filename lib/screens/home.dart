import 'package:flutter/material.dart';
import 'package:trueastrotalk/common/astrocard.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/services/userservice.dart';

class Home extends StatefulWidget {
  const Home({super.key});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  final UserService _userService = UserService();
  List<User> _astrologers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAstrologers();
  }

  Future<void> _loadAstrologers() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load 5 astrologers initially
      final astrologers = await _userService.getAstrologers(limit: 10);
      final currentUserId = await _userService.getCurrentUserID();

      final filteredAstrologers = astrologers.where((user) => user.ID != currentUserId).toList();

      setState(() {
        _astrologers = filteredAstrologers;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load astrologers: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDailyHoroscopeBanner(),
            SizedBox(height: 16),
            Text(
              "Top Astrologers",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.black,
              ),
            ),
            SizedBox(height: 10),
            _isLoading
                ? Column(
                    children: [
                      Center(
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          value: 30,
                        ),
                      ),
                      SizedBox(height: 16.0),
                    ],
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: _astrologers.length,
                    itemBuilder: (context, index) {
                      if (index == _astrologers.length) {
                        return Container(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          alignment: Alignment.center,
                          child: CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                          ),
                        );
                      }
                      return AstrologerCard(
                        astrologer: _astrologers[index],
                        cardType: 'call',
                      );
                    },
                  ),
            _buildPrivacySection(),
            _buildSpecialOffersBanner(),
          ],
        ),
      ),
    );
  }

  Widget _buildDailyHoroscopeBanner() {
    return Container(
      width: double.infinity,
      height: 80,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        gradient: LinearGradient(
          colors: [Colors.indigo.shade700, Colors.purple.shade700],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Daily Horoscope',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacySection() {
    return Card(
      color: Colors.white,
      margin: EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // First column
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.privacy_tip_rounded,
                  size: 30,
                  color: Colors.amber,
                ),
                SizedBox(
                  height: 4,
                ),
                Text('Private &'),
                Text('Confidential')
              ],
            ),

            // Second column
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.verified,
                  size: 30,
                  color: Colors.green,
                ),
                SizedBox(
                  height: 4,
                ),
                Text('Verified'),
                Text('Astrologers')
              ],
            ),

            // Third column
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.security,
                  size: 30,
                  color: Colors.blueAccent,
                ),
                SizedBox(
                  height: 4,
                ),
                Text('Secure'),
                Text('Payments')
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecialOffersBanner() {
    return Container(
      height: 120,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        gradient: LinearGradient(
          colors: [Colors.orange.shade700, Colors.red.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Special Offer!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Get 50% off on your first consultation',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.only(right: 20),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.red.shade700,
              ),
              child: Text('Claim Now'),
            ),
          ),
        ],
      ),
    );
  }
}
