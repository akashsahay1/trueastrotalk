import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      recipient_id, 
      recipient_type, // 'user' or 'astrologer'
      title, 
      message, 
      data = {},
      sound = 'default'
    } = body;

    if (!type || !recipient_id || !title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Type, recipient ID, title, and message are required'
      }, { status: 400 });
    }

    const notificationsCollection = await DatabaseService.getCollection('notifications');
    const usersCollection = await DatabaseService.getCollection('users');

    // Get recipient details and FCM token
    let recipient;
    let fcmToken;

    if (recipient_type === 'user') {
      recipient = await usersCollection.findOne({ 
        _id: new ObjectId(recipient_id as string),
        user_type: 'customer'
      });
      fcmToken = recipient?.fcm_token;
    } else {
      recipient = await usersCollection.findOne({ 
        _id: new ObjectId(recipient_id as string),
        user_type: 'astrologer'
      });
      fcmToken = recipient?.fcm_token;
    }

    if (!recipient) {
      return NextResponse.json({
        success: false,
        error: 'Recipient not found',
        message: 'Recipient not found'
      }, { status: 404 });
    }

    // Store notification in database
    const notificationData = {
      type: type,
      recipient_id: recipient_id,
      recipient_type: recipient_type,
      title: title,
      message: message,
      data: data,
      sound: sound,
      is_read: false,
      sent_via_fcm: false,
      fcm_response: null,
      created_at: new Date(),
      read_at: null
    };

    const result = await notificationsCollection.insertOne(notificationData);
    const notificationId = result.insertedId.toString();

    // Send FCM notification if FCM token exists
    let fcmResponse = null;
    if (fcmToken) {
      try {
        // TODO: Implement FCM notification sending
        fcmResponse = { success: true, messageId: 'placeholder' };

        // Update notification with FCM response
        await notificationsCollection.updateOne(
          { _id: result.insertedId },
          { 
            $set: { 
              sent_via_fcm: true,
              fcm_response: fcmResponse,
              updated_at: new Date()
            }
          }
        );

      } catch (fcmError) {
        console.error('FCM notification failed:', fcmError);
        // Don't fail the request if FCM fails, just log it
        await notificationsCollection.updateOne(
          { _id: result.insertedId },
          { 
            $set: { 
              sent_via_fcm: false,
              fcm_error: fcmError instanceof Error ? fcmError.message : 'FCM Error',
              updated_at: new Date()
            }
          }
        );
      }
    }


    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notification_id: notificationId,
      sent_via_fcm: !!fcmToken,
      fcm_response: fcmResponse
    });

  } catch (error) {
    console.error('Push notification send error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An error occurred while sending notification'
    }, { status: 500 });
  }
}

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
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
    const body = await request.json();
    const { notification_ids, recipient_id, mark_all = false } = body;

    if (!recipient_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing recipient ID',
        message: 'Recipient ID is required'
      }, { status: 400 });
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