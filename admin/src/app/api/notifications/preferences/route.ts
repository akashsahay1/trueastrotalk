import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
import { 
  SecurityMiddleware, 
  InputSanitizer 
} from '../../../../lib/security';

// GET - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

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

    const userId = authenticatedUser.userId;
    const usersCollection = await DatabaseService.getCollection('users');

    // Get user's notification preferences
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId as string) },
      { 
        projection: { 
          notification_preferences: 1,
          fcm_token: 1,
          email_address: 1
        } 
      }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      }, { status: 404 });
    }

    // Default preferences if none exist
    const defaultPreferences = {
      push_enabled: true,
      email_enabled: true,
      chat_notifications: true,
      call_notifications: true,
      payment_notifications: true,
      order_notifications: true,
      promotional_notifications: true,
      system_notifications: true
    };

    const preferences = (user.notification_preferences as Record<string, unknown>) || defaultPreferences;


    return NextResponse.json({
      success: true,
      data: {
        preferences,
        has_fcm_token: !!user.fcm_token,
        has_email: !!user.email_address,
        notification_channels: {
          push: {
            available: !!user.fcm_token,
            enabled: preferences.push_enabled
          },
          email: {
            available: !!user.email_address,
            enabled: preferences.email_enabled
          }
        }
      }
    });

  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching notification preferences'
    }, { status: 500 });
  }
}

// PUT - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

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
    
    const { preferences } = sanitizedBody;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PREFERENCES',
        message: 'Valid preferences object is required'
      }, { status: 400 });
    }

    const userId = authenticatedUser.userId;
    const usersCollection = await DatabaseService.getCollection('users');

    // Validate preference fields
    const validPreferenceFields = [
      'push_enabled',
      'email_enabled',
      'chat_notifications',
      'call_notifications',
      'payment_notifications',
      'order_notifications',
      'promotional_notifications',
      'system_notifications'
    ];

    const updatePreferences: Record<string, boolean> = {};
    let hasValidUpdates = false;

    for (const [key, value] of Object.entries(preferences)) {
      if (validPreferenceFields.includes(key) && typeof value === 'boolean') {
        updatePreferences[key] = value;
        hasValidUpdates = true;
      }
    }

    if (!hasValidUpdates) {
      return NextResponse.json({
        success: false,
        error: 'NO_VALID_PREFERENCES',
        message: 'No valid preference fields provided'
      }, { status: 400 });
    }

    // Update user's notification preferences
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId as string) },
      {
        $set: {
          notification_preferences: updatePreferences,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      }, { status: 404 });
    }


    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        updated_preferences: updatePreferences
      }
    });

  } catch (error) {
    console.error('Notification preferences PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while updating notification preferences'
    }, { status: 500 });
  }
}