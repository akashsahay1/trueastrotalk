import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
import NotificationService, { 
  NotificationType, 
  NotificationPriority,
  NotificationChannel 
} from '../../../../lib/notifications';
import { 
  SecurityMiddleware, 
  InputSanitizer 
} from '../../../../lib/security';

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate user (only admins can send notifications)
    let authenticatedUser;
    try {
      authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Only administrators can send push notifications
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can send push notifications'
      }, { status: 403 });
    }

    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { 
      type, 
      recipient_id, 
      recipient_type, // 'customer' or 'astrologer'
      title, 
      message, 
      data = {},
      priority = NotificationPriority.NORMAL,
      image_url,
      action_url
    } = sanitizedBody as {
      type: string;
      recipient_id: string;
      recipient_type: 'customer' | 'astrologer' | 'administrator';
      title: string;
      message: string;
      data?: Record<string, unknown>;
      priority?: number;
      image_url?: string;
      action_url?: string;
    };

    if (!type || !recipient_id || !title || !message) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Type, recipient ID, title, and message are required'
      }, { status: 400 });
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type as NotificationType)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_NOTIFICATION_TYPE',
        message: 'Invalid notification type'
      }, { status: 400 });
    }

    const usersCollection = await DatabaseService.getCollection('users');

    // Get recipient details and FCM token
    const recipient = await usersCollection.findOne({ 
      _id: new ObjectId(recipient_id as string),
      user_type: recipient_type || 'customer'
    });

    if (!recipient) {
      return NextResponse.json({
        success: false,
        error: 'RECIPIENT_NOT_FOUND',
        message: 'Recipient not found'
      }, { status: 404 });
    }

    // Send notification using NotificationService
    const success = await NotificationService.sendToUser(
      {
        userId: recipient_id,
        userType: recipient_type || 'customer',
        fcmToken: recipient.fcm_token,
        email: recipient.email_address,
        preferences: recipient.notification_preferences
      },
      {
        type: type as NotificationType,
        title,
        body: message,
        data,
        imageUrl: image_url,
        actionUrl: action_url,
        priority: priority as NotificationPriority,
        channels: [NotificationChannel.PUSH]
      }
    );


    return NextResponse.json({
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification',
      recipient_id,
      has_fcm_token: !!recipient.fcm_token
    });

  } catch (error) {
    console.error('Push notification send error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'An error occurred while sending notification'
    }, { status: 500 });
  }
}

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    let authenticatedUser;
    try {
      authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');
    const recipientType = searchParams.get('recipientType') || 'user';
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    if (!recipientId) {
      return NextResponse.json({
        success: false,
        error: 'Missing recipient ID',
        message: 'Recipient ID is required'
      }, { status: 400 });
    }

    // Users can only view their own notifications, admins can view any
    const userId = authenticatedUser._id || authenticatedUser.user_id;
    if (authenticatedUser.user_type !== 'administrator' && userId?.toString() !== recipientId) {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You can only view your own notifications'
      }, { status: 403 });
    }

    const notificationsCollection = await DatabaseService.getCollection('notifications');

    // Build query
    const query: Record<string, unknown> = {
      recipient_id: recipientId,
      recipient_type: recipientType
    };

    if (isRead !== null && isRead !== undefined) {
      query.is_read = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    // Get notifications with pagination
    const notifications = await notificationsCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalNotifications = await notificationsCollection.countDocuments(query);
    const unreadCount = await notificationsCollection.countDocuments({
      recipient_id: recipientId,
      recipient_type: recipientType,
      is_read: false
    });

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      sound: notification.sound,
      is_read: notification.is_read,
      sent_via_fcm: notification.sent_via_fcm,
      created_at: notification.created_at,
      read_at: notification.read_at
    }));


    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unread_count: unreadCount,
      pagination: {
        total: totalNotifications,
        page,
        limit,
        totalPages: Math.ceil(totalNotifications / limit)
      }
    });

  } catch(error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching notifications'
    }, { status: 500 });
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    let authenticatedUser;
    try {
      authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, recipient_id, mark_all = false } = body;

    if (!recipient_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing recipient ID',
        message: 'Recipient ID is required'
      }, { status: 400 });
    }

    // Users can only mark their own notifications as read, admins can modify any
    const userId = authenticatedUser._id || authenticatedUser.user_id;
    if (authenticatedUser.user_type !== 'administrator' && userId?.toString() !== recipient_id) {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You can only modify your own notifications'
      }, { status: 403 });
    }

    if (!mark_all && (!notification_ids || !Array.isArray(notification_ids))) {
      return NextResponse.json({
        success: false,
        error: 'Missing notification IDs',
        message: 'Notification IDs array is required when not marking all'
      }, { status: 400 });
    }

    const notificationsCollection = await DatabaseService.getCollection('notifications');

    let query: Record<string, unknown>;

    if (mark_all) {
      // Mark all unread notifications as read for this recipient
      query = {
        recipient_id: recipient_id,
        is_read: false
      };
    } else {
      // Mark specific notifications as read
      const notificationObjectIds = (notification_ids as string[])
        .filter((id: string) => ObjectId.isValid(id))
        .map((id: string) => new ObjectId(id));

      if (notificationObjectIds.length === 0) {
          return NextResponse.json({
          success: false,
          error: 'Invalid notification IDs',
          message: 'No valid notification IDs provided'
        }, { status: 400 });
      }

      query = {
        _id: { $in: notificationObjectIds },
        recipient_id: recipient_id,
        is_read: false
      };
    }

    const result = await notificationsCollection.updateMany(
      query,
      { 
        $set: { 
          is_read: true,
          read_at: new Date(),
          updated_at: new Date()
        }
      }
    );


    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
      updated_count: result.modifiedCount
    });

  } catch(error) {
    console.error('Notifications read PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while marking notifications as read'
    }, { status: 500 });
  }
}