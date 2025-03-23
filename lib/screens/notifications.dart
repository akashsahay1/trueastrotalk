import 'package:flutter/material.dart';
import 'package:trueastrotalk/models/appnotification.dart';
import 'package:trueastrotalk/services/appnotification.dart';

class Notifications extends StatefulWidget {
  const Notifications({super.key});

  @override
  State<Notifications> createState() => _NotificationsState();
}

class _NotificationsState extends State<Notifications> {
  final AppnotificationService _notificationService = AppnotificationService();
  List<Appnotification> _notifications = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _currentPage = 1;
  final int _perPage = 15;
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load initial astrologers
      final notifications = await _notificationService.getNotifications(limit: _perPage, page: 1);

      // Get pagination info to know if there are more astrologers
      final pagination = await _notificationService.getNotificationsPagination(limit: _perPage, page: 1);

      setState(() {
        _notifications = notifications;
        _hasMore = pagination['has_more'];
        _currentPage = 1;
      });
    } catch (e) {
      if (mounted) {
        // Handle error
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to m load notifications: ${e.toString()}')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreNotifications() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      // Load more astrologers
      final nextPage = _currentPage + 1;
      final moreNotifications = await _notificationService.getNotifications(limit: _perPage, page: nextPage);

      // Get updated pagination info
      final pagination = await _notificationService.getNotificationsPagination(limit: _perPage, page: nextPage);

      setState(() {
        if (moreNotifications.isNotEmpty) {
          _notifications.addAll(moreNotifications);
          _currentPage = nextPage;
        }
        _hasMore = pagination['has_more'];
      });
    } catch (e) {
      // Handle error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load more notifications: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isLoadingMore = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading ? Center(child: CircularProgressIndicator(color: Colors.black)) : _buildNotificationsList();
  }

  Widget _buildNotificationsList() {
    if (_notifications.isEmpty) {
      return Center(
        child: Text('No notifications.'),
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (ScrollNotification scrollInfo) {
        if (scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent && _hasMore && !_isLoadingMore) {
          _loadMoreNotifications();
        }
        return true;
      },
      child: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ListView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                itemCount: _notifications.length + (_hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _notifications.length) {
                    return _buildLoadingIndicator();
                  }
                  return _buildNotificationCard(_notifications[index]);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationCard(Appnotification notification) {
    // Define colors and icons based on notification type
    Color cardAccentColor;
    IconData notificationIcon;
    Color iconBgColor;

    switch (notification.type) {
      case 'payment':
        cardAccentColor = Colors.green.shade100;
        notificationIcon = Icons.payments_rounded;
        iconBgColor = Colors.green.shade600;
        break;
      case 'chat':
        cardAccentColor = Colors.blue.shade100;
        notificationIcon = Icons.chat_bubble_rounded;
        iconBgColor = Colors.blue.shade600;
        break;
      case 'auth':
        cardAccentColor = Colors.orange.shade100;
        notificationIcon = Icons.security_rounded;
        iconBgColor = Colors.orange.shade600;
        break;
      default:
        cardAccentColor = Colors.grey.shade100;
        notificationIcon = Icons.notifications_rounded;
        iconBgColor = Colors.grey.shade600;
    }

    // Check if notification is read
    final bool isRead = notification.read == 1;

    return Card(
      margin: EdgeInsets.only(bottom: 16),
      elevation: isRead ? 1 : 3,
      shadowColor: isRead ? Colors.grey.withValues(alpha: 0.3) : cardAccentColor.withValues(alpha: 0.7),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isRead ? Colors.grey.withValues(alpha: 0.2) : cardAccentColor,
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          // Indicator line at the top of the card
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: isRead ? Colors.grey.withValues(alpha: 0.3) : cardAccentColor,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Notification type icon
                Container(
                  margin: EdgeInsets.only(right: 16, top: 4),
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isRead ? Colors.grey.shade200 : iconBgColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    notificationIcon,
                    color: isRead ? Colors.grey.shade600 : Colors.white,
                    size: 24,
                  ),
                ),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title and unread indicator
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: TextStyle(
                                fontSize: 16.0,
                                fontWeight: isRead ? FontWeight.w500 : FontWeight.w700,
                                color: isRead ? Colors.black87 : Colors.black,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 2,
                            ),
                          ),
                          if (!isRead)
                            Container(
                              margin: EdgeInsets.only(left: 8, top: 4),
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: iconBgColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),

                      SizedBox(height: 8),

                      // Description
                      Text(
                        notification.description,
                        style: TextStyle(
                          fontSize: 14.0,
                          fontWeight: FontWeight.w400,
                          color: Colors.black87,
                          height: 1.4,
                        ),
                        overflow: TextOverflow.visible,
                        softWrap: true,
                      ),

                      SizedBox(height: 12),

                      // Date with icon
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: Colors.grey.shade600,
                          ),
                          SizedBox(width: 4),
                          Text(
                            notification.date,
                            style: TextStyle(
                              fontSize: 12.0,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16),
      alignment: Alignment.center,
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
      ),
    );
  }
}
