import 'package:flutter/material.dart';
import 'package:trueastrotalk/config/colors.dart';
import 'package:trueastrotalk/models/astrologer.dart';
import 'package:trueastrotalk/screens/chatrequest.dart';
import 'package:trueastrotalk/utilities/strings.dart';

class AstrologerCard extends StatelessWidget {
  final Astrologer astrologer;

  // Optional callbacks that can be used to override default behavior
  final Function(Astrologer)? onCallOverride;
  final Function(Astrologer)? onChatOverride;
  final Function(Astrologer)? onProfileOverride;

  const AstrologerCard({
    Key? key,
    required this.astrologer,
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
      Navigator.pushReplacementNamed(context, '/astrologer-details', arguments: {
        'astrologer': astrologer,
      });
    }
  }

  // Handle call button press
  void _handleCallPressed(BuildContext context) {
    if (onCallOverride != null) {
      onCallOverride!(astrologer);
    } else {
      // Default call handling logic
      // You can implement your call functionality here
      // For example:
      // CallService().initiateCall(astrologer.id);

      // For now, just show a snackbar
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Calling ${astrologer.name}'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  // Handle chat button press
  void _handleChatPressed(BuildContext context) {
    if (onChatOverride != null) {
      onChatOverride!(astrologer);
    } else {
      //   // Check if the astrologer is online before proceeding
      //   if (!astrologer.isOnline) {
      //     ScaffoldMessenger.of(context).showSnackBar(
      //       SnackBar(
      //         content: Text('${astrologer.name} is currently offline. Please try again later.'),
      //         duration: Duration(seconds: 3),
      //       ),
      //     );
      //     return;
      //   }

      // Navigate to the chat request screen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ChatRequestScreen(
            astrologer: astrologer,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
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
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
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
                          child: astrologer.image.startsWith('http') || astrologer.image.startsWith('https')
                              ? Image.network(
                                  astrologer.image,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Image.asset(
                                      'assets/images/avatar.jpg',
                                      fit: BoxFit.cover,
                                    );
                                  },
                                )
                              : Image.asset(
                                  astrologer.image,
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
                      astrologer.rating.toString(),
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
            SizedBox(width: 30.0),
            // Astrologer details
            Expanded(
              flex: 1,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: () => _handleProfileTap(context),
                    child: Row(
                      children: [
                        Text(
                          astrologer.name.toTitleCase(),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: Color(0xFF19295C),
                          ),
                        ),
                        SizedBox(width: 5),
                        Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.accentColor,
                          size: 20,
                        )
                      ],
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    astrologer.price,
                    style: TextStyle(
                      fontSize: 18,
                      color: AppColors.accentColor,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 10),
                  Row(
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      Icon(
                        Icons.auto_graph,
                        size: 18,
                        color: Color(0xFF19295C),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          astrologer.speciality,
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
                        Icons.language,
                        size: 18,
                        color: Color(0xFF19295C),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Languages ${astrologer.languages}',
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
                      Text(
                        'Experience ${astrologer.experience}',
                        style: TextStyle(
                          color: Color(0xFF19295C),
                          fontSize: 16,
                        ),
                      )
                    ],
                  ),
                  SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      ElevatedButton(
                        onPressed: () => _handleCallPressed(context),
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
                          "Call",
                          style: TextStyle(
                            color: Color(0xFFFFFFFF),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      SizedBox(width: 15),
                      ElevatedButton(
                        onPressed: () => _handleChatPressed(context),
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
                          'Chat',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ),
                      SizedBox(width: 15),
                      GestureDetector(
                        onTap: () => _handleProfileTap(context),
                        child: Icon(Icons.share, color: AppColors.accentColor, size: 20),
                      ),
                    ],
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
