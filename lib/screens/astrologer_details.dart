import 'package:flutter/material.dart';
import 'package:trueastrotalk/config/colors.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/screens/chatrequest.dart';
import 'package:trueastrotalk/utilities/expandable_text.dart';
import 'package:trueastrotalk/utilities/strings.dart';

class AstrologerDetails extends StatelessWidget {
  final User astrologer;
  // Optional callbacks that can be used to override default behavior
  final Function(User)? onCallOverride;
  final Function(User)? onChatOverride;
  final Function(User)? onProfileOverride;

  const AstrologerDetails({
    Key? key,
    required this.astrologer,
    this.onCallOverride,
    this.onChatOverride,
    this.onProfileOverride,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final displayAstrologer = astrologer;

    _showNotifications() {
      Navigator.pushReplacementNamed(context, '/notifications');
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Profile',
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
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.max,
          children: [
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.start,
                mainAxisSize: MainAxisSize.max,
                children: [
                  Card(
                    color: Colors.white,
                    margin: EdgeInsets.only(bottom: 16),
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.start,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Astrologer image with online indicator
                          Column(
                            children: [
                              Stack(
                                children: [
                                  Container(
                                    width: 60,
                                    height: 60,
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade200,
                                      shape: BoxShape.circle,
                                    ),
                                    child: ClipOval(
                                      child: astrologer.userAvatar.toString().startsWith('http') || astrologer.userAvatar.toString().startsWith('https')
                                          ? Image.network(
                                              astrologer.userAvatar.toString(),
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) {
                                                return Image.asset(
                                                  'assets/images/avatar.jpg',
                                                  fit: BoxFit.cover,
                                                );
                                              },
                                            )
                                          : Image.asset(
                                              astrologer.userAvatar.toString(),
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) {
                                                return Image.asset(
                                                  'assets/images/avatar.jpg',
                                                  fit: BoxFit.cover,
                                                );
                                              },
                                            ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Text(
                                    '4.5',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w500,
                                      fontSize: 18,
                                    ),
                                  ),
                                  SizedBox(width: 2),
                                  Icon(
                                    Icons.star,
                                    color: AppColors.accentColor,
                                    size: 22,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          SizedBox(width: 15.0),
                          // Astrologer details
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.check_circle_rounded,
                                      color: AppColors.accentColor,
                                      size: 20,
                                    ),
                                    SizedBox(width: 5),
                                    Expanded(
                                      child: Text(
                                        '${astrologer.firstName} ${astrologer.lastName}'.toTitleCase(),
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 18,
                                          color: Color(0xFF19295C),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.auto_graph,
                                      size: 18,
                                      color: Color(0xFF19295C),
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        astrologer.astroType.toString(),
                                        overflow: TextOverflow.ellipsis,
                                        softWrap: true,
                                        style: TextStyle(
                                          color: Color(0xFF19295C),
                                          fontSize: 16,
                                        ),
                                      ),
                                    )
                                  ],
                                ),
                                SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.language,
                                      size: 18,
                                      color: Color(0xFF19295C),
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        '${astrologer.userLanguages}',
                                        overflow: TextOverflow.ellipsis,
                                        softWrap: true,
                                        style: TextStyle(
                                          color: Color(0xFF19295C),
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.work_outline,
                                      size: 18,
                                      color: Color(0xFF19295C),
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Exp- ${astrologer.userExperience} years',
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: Color(0xFF19295C),
                                          fontSize: 16,
                                        ),
                                      ),
                                    )
                                  ],
                                ),
                              ],
                            ),
                          ),
                          SizedBox(
                            width: 10,
                          ),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ElevatedButton(
                                onPressed: () => {},
                                style: ButtonStyle(
                                  backgroundColor: WidgetStatePropertyAll(Color(0xFFF1F4F5)),
                                  foregroundColor: WidgetStatePropertyAll(AppColors.accentColor),
                                  padding: WidgetStatePropertyAll(EdgeInsets.only(left: 10, right: 10, top: 2, bottom: 2)),
                                  minimumSize: WidgetStatePropertyAll(Size(90, 30)),
                                  shape: WidgetStatePropertyAll(
                                    RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(5),
                                    ),
                                  ),
                                ),
                                child: Text(
                                  '${astrologer.astroCharges}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              )
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                // Call functionality
                              },
                              style: ButtonStyle(
                                backgroundColor: WidgetStatePropertyAll(AppColors.accentColor),
                                foregroundColor: WidgetStatePropertyAll(Colors.white),
                                minimumSize: WidgetStatePropertyAll(Size(double.infinity, 45)),
                                shape: WidgetStatePropertyAll(
                                  RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.call, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text(
                                    'Call Now',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                // Chat functionality
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ChatRequestScreen(
                                      astrologer: displayAstrologer,
                                    ),
                                  ),
                                );
                              },
                              style: ButtonStyle(
                                backgroundColor: WidgetStatePropertyAll(Color.fromARGB(255, 1, 141, 20)),
                                foregroundColor: WidgetStatePropertyAll(Colors.white),
                                minimumSize: WidgetStatePropertyAll(Size(double.infinity, 45)),
                                shape: WidgetStatePropertyAll(
                                  RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.chat_bubble_outline_rounded,
                                    color: Colors.white,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Chat Now',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  SizedBox(height: 15),
                  Text(
                    'About',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.left,
                  ),
                  SizedBox(height: 12),
                  Card(
                    color: Colors.white,
                    margin: EdgeInsets.only(bottom: 16),
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Container(
                      width: double.infinity, // Makes the card take full width
                      padding: EdgeInsets.all(16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.start,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ExpandableText(
                            text: displayAstrologer.userAbout ?? 'No description available.',
                            style: TextStyle(
                              fontSize: 15,
                              color: Colors.black87,
                              height: 1.5,
                            ),
                            maxChars: 135,
                          ),
                        ],
                      ),
                    ),
                  ),
                  Text(
                    'Reviews',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.left,
                  ),
                  SizedBox(height: 12),
                  Card(
                    color: Colors.white,
                    margin: EdgeInsets.only(bottom: 16),
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Container(
                      width: double.infinity, // Makes the card take full width
                      padding: EdgeInsets.all(16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.start,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
