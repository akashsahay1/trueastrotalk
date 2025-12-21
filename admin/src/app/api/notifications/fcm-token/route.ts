import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { jwtVerify } from 'jose';
import { InputSanitizer } from '@/lib/security';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function PATCH(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    const { fcmToken } = sanitizedBody;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({
        error: 'Missing required field: fcmToken'
      }, { status: 400 });
    }

    // Validate FCM token format (basic validation)
    if (fcmToken.length < 100 || fcmToken.length > 500) {
      return NextResponse.json({
        error: 'Invalid FCM token format'
      }, { status: 400 });
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload.userId || payload.user_id) as string;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // Connect to MongoDB
    const usersCollection = await DatabaseService.getCollection('users');

    // Update user's FCM token
    const updateQuery = {
      $set: {
        fcm_token: fcmToken,
        fcm_token_updated_at: new Date()
      }
    };

    const result = await usersCollection.updateOne(
      { user_id: userId },
      updateQuery
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token updated successfully'
    });

  } catch(error) {
    console.error('Error updating FCM token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}