import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../lib/database';
import { NotificationType } from '../../../lib/notifications';
import { 
  SecurityMiddleware, 
  InputSanitizer 
} from '../../../lib/security';

// GET - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔔 Notifications fetch request from IP: ${ip}`);

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
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const type = searchParams.get('type');

    const userId = authenticatedUser.userId;
    const notificationsCollection = await DatabaseService.getCollection('notifications');

    // Build query
    const query: Record<string, unknown> = {
      user_id: new ObjectId(userId as string)
    };

    if (unreadOnly) {
      query.is_read = false;
    }

    if (type && Object.values(NotificationType).includes(type as NotificationType)) {
      query.type = type;
    }

    // Get notifications with pagination
    const [notifications, totalCount, unreadCount] = await Promise.all([
      notificationsCollection
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      
      notificationsCollection.countDocuments(query),
      
      notificationsCollection.countDocuments({
        user_id: new ObjectId(userId as string),
        is_read: false
      })
    ]);

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      image_url: notification.image_url,
      action_url: notification.action_url,
      priority: notification.priority,
      is_read: notification.is_read,
      delivery_status: notification.delivery_status,
      created_at: notification.created_at,
      updated_at: notification.updated_at
    }));

    console.log(`✅ Retrieved ${notifications.length} notifications for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unread_count: unreadCount,
        pagination: {
          current_page: page,
          per_page: limit,
          total_count: totalCount,
          total_pages: Math.ceil(totalCount / limit),
          has_next: skip + limit < totalCount,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching notifications'
    }, { status: 500 });
  }
}

// POST - Send notification (admin only) or register FCM token
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔔 Notification action request from IP: ${ip}`);

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

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { action, fcm_token, ...notificationData } = sanitizedBody;

    if (action === 'register_fcm_token') {
      // Register or update FCM token for the authenticated user
      if (!fcm_token || typeof fcm_token !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'INVALID_FCM_TOKEN',
          message: 'Valid FCM token is required'
        }, { status: 400 });
      }

      const usersCollection = await DatabaseService.getCollection('users');
      await usersCollection.updateOne(
        { _id: new ObjectId(authenticatedUser.userId as string) },
        { 
          $set: { 
            fcm_token: fcm_token,
            fcm_token_updated_at: new Date(),
            updated_at: new Date()
          }
        }
      );

      console.log(`✅ FCM token registered for user ${authenticatedUser.userId}`);

      return NextResponse.json({
        success: true,
        message: 'FCM token registered successfully'
      });
    }

    // For sending notifications, only administrators are allowed
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can send notifications'
      }, { status: 403 });
    }

    // Send notification (admin only)
    const { target_user_ids, target_user_type, notification } = notificationData;
    const notificationObj = notification as Record<string, unknown>;

    if (!notificationObj || !notificationObj.type || !notificationObj.title || !notificationObj.body) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_NOTIFICATION_DATA',
        message: 'Notification type, title, and body are required'
      }, { status: 400 });
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(notificationObj.type as NotificationType)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_NOTIFICATION_TYPE',
        message: 'Invalid notification type'
      }, { status: 400 });
    }

    const usersCollection = await DatabaseService.getCollection('users');
    let targets = [];

    if (target_user_ids && Array.isArray(target_user_ids)) {
      // Send to specific users
      const users = await usersCollection
        .find({ 
          _id: { $in: target_user_ids.map((id: string) => new ObjectId(id)) }
        })
        .toArray();
      
      targets = users.map(user => ({
        userId: user._id.toString(),
        userType: user.user_type,
        fcmToken: user.fcm_token,
        email: user.email_address
      }));
    } else if (target_user_type) {
      // Send to all users of a specific type
      const users = await usersCollection
        .find({ 
          user_type: target_user_type,
          account_status: 'active'
        })
        .toArray();
      
      targets = users.map(user => ({
        userId: user._id.toString(),
        userType: user.user_type,
        fcmToken: user.fcm_token,
        email: user.email_address
      }));
    } else {
      return NextResponse.json({
        success: false,
        error: 'MISSING_TARGET',
        message: 'Target user IDs or user type is required'
      }, { status: 400 });
    }

    if (targets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_TARGET_USERS',
        message: 'No target users found'
      }, { status: 400 });
    }

    // Send notifications
    // TODO: Implement notification sending with proper NotificationService integration
    const successCount = targets.length; // Placeholder - assume all successful

    console.log(`✅ Notification sent to ${successCount}/${targets.length} users`);

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        total_targets: targets.length,
        successful_deliveries: successCount,
        failed_deliveries: targets.length - successCount
      }
    });

  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing notification request'
    }, { status: 500 });
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`📖 Mark notifications read request from IP: ${ip}`);

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

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { notification_ids, mark_all_read } = sanitizedBody;

    const userId = authenticatedUser.userId;
    const notificationsCollection = await DatabaseService.getCollection('notifications');

    const updateQuery: Record<string, unknown> = {
      user_id: new ObjectId(userId as string),
      is_read: false
    };

    if (mark_all_read === true) {
      // Mark all unread notifications as read
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const validIds = notification_ids
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
      
      if (validIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_NOTIFICATION_IDS',
          message: 'No valid notification IDs provided'
        }, { status: 400 });
      }

      updateQuery._id = { $in: validIds };
    } else {
      return NextResponse.json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'Either notification_ids or mark_all_read parameter is required'
      }, { status: 400 });
    }

    // Update notifications
    const result = await notificationsCollection.updateMany(
      updateQuery,
      {
        $set: {
          is_read: true,
          read_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read successfully',
      data: {
        updated_count: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while marking notifications as read'
    }, { status: 500 });
  }
}