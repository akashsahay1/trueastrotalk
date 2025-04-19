import 'package:flutter/material.dart';
import 'package:trueastrotalk/common/reviewcard.dart';
import 'package:trueastrotalk/config/colors.dart';
import 'package:trueastrotalk/config/environment.dart';
import 'package:trueastrotalk/models/review.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/screens/astrologer_call_request.dart';
import 'package:trueastrotalk/screens/astrologer_chat_request.dart';
import 'package:trueastrotalk/services/userservice.dart';
import 'package:trueastrotalk/utilities/expandable_text.dart';
import 'package:trueastrotalk/utilities/strings.dart';

class AstrologerDetails extends StatefulWidget {
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
  _AstrologerDetailsState createState() => _AstrologerDetailsState();
}

class _AstrologerDetailsState extends State<AstrologerDetails> {
  final UserService _userService = UserService();
  List<Review> _reviews = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load 5 astrologers initially
      final reviews = await _userService.getAstrologerReviews(astrologer: widget.astrologer.ID, limit: 15);
      setState(() {
        _reviews = reviews;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load reviews: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseUrl = Environment.baseUrl;

    _showNotifications() {
      Navigator.pushReplacementNamed(context, '/notifications');
    }

    final astrologerName = widget.astrologer.firstName.toTitleCase() + ' ' + widget.astrologer.lastName.toTitleCase();

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
                          // Astrologer image
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
                                      child: Image.network(
                                        '${baseUrl}/${widget.astrologer.userAvatar}',
                                        key: ValueKey('profile-${widget.astrologer.ID}'),
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
                                    Expanded(
                                      child: Text(
                                        astrologerName,
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
                                SizedBox(height: 4),
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
                                        '${widget.astrologer.userName}',
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
                                        widget.astrologer.astroType.toString(),
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
                                        '${widget.astrologer.userLanguages}',
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
                                        'Exp- ${widget.astrologer.userExperience} years',
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
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => AstrologerCallRequestScreen(
                                      astrologer: widget.astrologer,
                                    ),
                                  ),
                                );
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
                                      letterSpacing: 0.0,
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
                                    builder: (context) => AstrologerChatRequestScreen(
                                      astrologer: widget.astrologer,
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
                                      letterSpacing: 0.0,
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
                      letterSpacing: 0.0,
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
                            text: widget.astrologer.userAbout ?? 'No description available.',
                            style: TextStyle(
                              fontSize: 15,
                              color: Colors.black87,
                              height: 1.5,
                              letterSpacing: 0.0,
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
                      letterSpacing: 0.0,
                    ),
                    textAlign: TextAlign.left,
                  ),
                  SizedBox(height: 12),
                  Container(
                    width: double.infinity, // Makes the card take full width
                    padding: EdgeInsets.all(0),
                    child: _isLoading
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
                            itemCount: _reviews.length,
                            itemBuilder: (context, index) {
                              if (index == _reviews.length) {
                                return Container(
                                  padding: EdgeInsets.symmetric(vertical: 16),
                                  alignment: Alignment.center,
                                  child: CircularProgressIndicator(
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                                  ),
                                );
                              }
                              return AstrologerReviewCard(
                                review: _reviews[index],
                              );
                            },
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
