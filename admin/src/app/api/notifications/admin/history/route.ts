import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalk';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const notificationsCollection = db.collection('notifications');
    
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
    
    await client.close();
    
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