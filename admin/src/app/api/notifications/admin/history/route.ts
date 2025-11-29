import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { SecurityMiddleware } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user (only admins can view notification history)
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

    // Only administrators can view notification history
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can access notification history'
      }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const notificationsCollection = await DatabaseService.getCollection('notifications');
    
    // Build query for filtering
    const mongoQuery: Record<string, unknown> = {};
    
    if (type) {
      mongoQuery.type = type;
    }
    
    if (status) {
      mongoQuery.delivery_status = status;
    }
    
    if (search) {
      mongoQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get notifications with pagination
    const notifications = await notificationsCollection
      .find(mongoQuery)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const totalCount = await notificationsCollection.countDocuments(mongoQuery);
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map(notification => ({
          _id: notification._id,
          type: notification.type || 'GENERAL',
          title: notification.title || '',
          body: notification.body || '',
          user_id: notification.user_id || '',
          delivery_status: notification.delivery_status || 'pending',
          created_at: notification.created_at || new Date().toISOString(),
          is_read: notification.is_read || false
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notification history',
        data: { notifications: [], pagination: { currentPage: 1, totalPages: 0, totalCount: 0, hasNextPage: false, hasPrevPage: false } }
      },
      { status: 500 }
    );
  }
}