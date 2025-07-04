import 'package:flutter/material.dart';
import 'package:trueastrotalk/config/colors.dart';
import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/screens/astrologer_details.dart';
import 'package:trueastrotalk/screens/astrologer_call_request.dart';
import 'package:trueastrotalk/screens/astrologer_chat_request.dart';
import 'package:trueastrotalk/utilities/strings.dart';

class AstrologerCard extends StatelessWidget {
  final User astrologer;
  final String cardType;
  // Optional callbacks that can be used to override default behavior
  final Function(User)? onCallOverride;
  final Function(User)? onChatOverride;
  final Function(User)? onProfileOverride;

  const AstrologerCard({
    Key? key,
    required this.astrologer,
    required this.cardType,
    this.onCallOverride,
    this.onChatOverride,
    this.onProfileOverride,
  }) : super(key: key);

  // Handle navigation to astrologer details
  void _handleProfileTap(BuildContext context) {
    if (onProfileOverride != null) {
      onProfileOverride!(astrologer);
    } else {
      // Default navigation to details page
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AstrologerDetails(
            astrologer: astrologer,
          ),
        ),
      );
    }
  }

  // Handle call button press
  void _handleCallPressed(BuildContext context) {
    if (onCallOverride != null) {
      onCallOverride!(astrologer);
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AstrologerCallRequestScreen(
            astrologer: astrologer,
          ),
        ),
      );
    }
  }

  void _handleChatPressed(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AstrologerChatRequestScreen(
          astrologer: astrologer,
        ),
      ),
    );
  }

  // Format speciality to show only first 2 specialities with "+1" indicator if more exist
  String _formatSpeciality(String speciality) {
    final List<String> specialities = speciality.split(',');

    if (specialities.length <= 2) {
      return speciality;
    } else {
      return '${specialities[0].trim()}, ${specialities[1].trim()}+${specialities.length - 2}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final String baseUrl = Environment.baseUrl;
    return Card(
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
                    GestureDetector(
                      onTap: () => _handleProfileTap(context),
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          shape: BoxShape.circle,
                        ),
                        child: ClipOval(
                          child: Image.network(
                            '${baseUrl}/${astrologer.userAvatar}',
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
                  GestureDetector(
                    onTap: () => _handleProfileTap(context),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.accentColor,
                          size: 20,
                        ),
                        SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            astrologer.userName.toTitleCase(),
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: Color(0xFF19295C),
                              letterSpacing: 0.0,
                            ),
                          ),
                        ),
                      ],
                    ),
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
                          _formatSpeciality(astrologer.astroType.toString()),
                          overflow: TextOverflow.ellipsis,
                          softWrap: true,
                          style: TextStyle(
                            color: Color(0xFF19295C),
                            fontSize: 14,
                            letterSpacing: 0.0,
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
                            fontSize: 14,
                            letterSpacing: 0.0,
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
                            fontSize: 14,
                            letterSpacing: 0.0,
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
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ElevatedButton(
                  onPressed: () => cardType == "call" ? _handleCallPressed(context) : _handleChatPressed(context),
                  style: ButtonStyle(
                    backgroundColor: WidgetStatePropertyAll(Color(0xFF1877F2)),
                    padding: WidgetStatePropertyAll(EdgeInsets.only(left: 10, right: 10, top: 2, bottom: 2)),
                    minimumSize: WidgetStatePropertyAll(Size(90, 30)),
                    shape: WidgetStatePropertyAll(
                      RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(5),
                        side: BorderSide(color: Color(0xFF1877F2), width: 1),
                      ),
                    ),
                  ),
                  child: Text(
                    cardType == "call" ? "Call" : "Chat",
                    style: TextStyle(
                      color: Color(0xFFFFFFFF),
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.0,
                    ),
                  ),
                ),
                SizedBox(width: 15),
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
                    '₹${astrologer.astroCharges}/min',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      letterSpacing: 0.0,
                    ),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
