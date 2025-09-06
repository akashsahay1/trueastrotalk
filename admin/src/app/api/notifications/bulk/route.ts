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

// Define filter types for bulk notifications
interface NotificationFilters {
  wallet_balance?: {
    $gte?: number;
    $lte?: number;
    $gt?: number;
    $lt?: number;
  };
  last_active?: {
    $gte?: string | Date;
    $lte?: string | Date;
  };
  consultation_count?: {
    $gte?: number;
    $lte?: number;
  };
  registration_date?: {
    $gte?: string | Date;
    $lte?: string | Date;
  };
}

// Type for authenticated user from SecurityMiddleware
interface AuthenticatedUser {
  userId: string;
  user_type: string;
  email?: string;
  name?: string;
}

// POST - Send bulk notifications to customers or astrologers
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`📢 Bulk notification request from IP: ${ip}`);

    // Authenticate user (only admins can send bulk notifications)
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

    // Only administrators can send bulk notifications
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can send bulk notifications'
      }, { status: 403 });
    }

    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const {
      type,
      title,
      message,
      target_type, // 'all', 'customers', 'astrologers', 'specific'
      target_user_ids, // Array of user IDs (when target_type is 'specific')
      filters, // Optional filters for targeted notifications
      data = {},
      priority = NotificationPriority.NORMAL,
      channels = [NotificationChannel.PUSH, NotificationChannel.EMAIL],
      image_url,
      action_url,
      schedule_at // Optional: Schedule for later
    } = sanitizedBody;

    // Validate required fields
    if (!type || !title || !message || !target_type) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Type, title, message, and target_type are required'
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

    // Build query based on target type
    const query: Record<string, unknown> = {
      account_status: 'active' // Only send to active users
    };

    switch (target_type) {
      case 'all':
        // Send to all active users
        break;

      case 'customers':
        query.user_type = 'customer';
        break;

      case 'astrologers':
        query.user_type = 'astrologer';
        break;

      case 'specific':
        if (!target_user_ids || !Array.isArray(target_user_ids) || target_user_ids.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'MISSING_TARGET_USER_IDS',
            message: 'Target user IDs are required when target_type is "specific"'
          }, { status: 400 });
        }
        query._id = { 
          $in: target_user_ids
            .filter(id => ObjectId.isValid(id))
            .map(id => new ObjectId(id)) 
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'INVALID_TARGET_TYPE',
          message: 'Invalid target type. Must be: all, customers, astrologers, or specific'
        }, { status: 400 });
    }

    // Apply additional filters if provided
    if (filters && typeof filters === 'object') {
      // Examples of filters:
      // - { "wallet_balance": { "$gte": 100 } } - Users with wallet balance >= 100
      // - { "last_active": { "$gte": "2024-01-01" } } - Recently active users
      // - { "consultation_count": { "$gte": 5 } } - Users with 5+ consultations
      const filterObj = filters as NotificationFilters;
      if (filterObj.wallet_balance) {
        query.wallet_balance = filterObj.wallet_balance;
      }
      if (filterObj.last_active) {
        query.last_active = filterObj.last_active;
      }
      if (filterObj.consultation_count) {
        query.consultation_count = filterObj.consultation_count;
      }
      if (filterObj.registration_date) {
        query.created_at = filterObj.registration_date;
      }
    }

    // Get target users
    const users = await usersCollection.find(query).toArray();

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_TARGET_USERS',
        message: 'No users found matching the criteria'
      }, { status: 404 });
    }

    // Prepare notification targets
    const targets = users.map(user => ({
      userId: user._id.toString(),
      userType: user.user_type as 'customer' | 'astrologer',
      fcmToken: user.fcm_token,
      email: user.email_address,
      preferences: user.notification_preferences
    }));

    // Log notification attempt
    console.log(`📤 Sending ${type} notification to ${targets.length} users`);

    // Send notifications
    const successCount = await NotificationService.sendBulkNotifications(
      targets,
      {
        type: type as NotificationType,
        title: title as string,
        body: message as string,
        data: data as Record<string, unknown> | undefined,
        imageUrl: image_url as string | undefined,
        actionUrl: action_url as string | undefined,
        priority: priority as NotificationPriority,
        channels: channels as NotificationChannel[],
        scheduleAt: schedule_at ? new Date(schedule_at as string) : undefined
      }
    );

    // Store bulk notification record
    const bulkNotificationsCollection = await DatabaseService.getCollection('bulk_notifications');
    await bulkNotificationsCollection.insertOne({
      type,
      title,
      message,
      target_type,
      target_count: targets.length,
      success_count: successCount,
      failed_count: targets.length - successCount,
      filters,
      sent_by: (authenticatedUser as unknown as AuthenticatedUser).userId,
      created_at: new Date()
    });

    console.log(`✅ Bulk notification completed: ${successCount}/${targets.length} successful`);

    return NextResponse.json({
      success: true,
      message: 'Bulk notifications sent successfully',
      data: {
        total_targets: targets.length,
        successful: successCount,
        failed: targets.length - successCount,
        success_rate: ((successCount / targets.length) * 100).toFixed(2) + '%'
      }
    });

  } catch (error) {
    console.error('Bulk notification error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'An error occurred while sending bulk notifications'
    }, { status: 500 });
  }
}

// GET - Get bulk notification history
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`📊 Bulk notification history request from IP: ${ip}`);

    // Authenticate user (only admins can view bulk notification history)
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

    // Only administrators can view bulk notification history
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can view bulk notification history'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const bulkNotificationsCollection = await DatabaseService.getCollection('bulk_notifications');

    // Get bulk notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      bulkNotificationsCollection
        .find({})
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      
      bulkNotificationsCollection.countDocuments({})
    ]);

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      target_type: notification.target_type,
      target_count: notification.target_count,
      success_count: notification.success_count,
      failed_count: notification.failed_count,
      success_rate: ((notification.success_count / notification.target_count) * 100).toFixed(2) + '%',
      filters: notification.filters,
      sent_by: notification.sent_by,
      created_at: notification.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
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
    console.error('Bulk notification history error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching bulk notification history'
    }, { status: 500 });
  }
}