import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionType = searchParams.get('type') || 'call'; // call, chat, video

    const { db } = await connectToDatabase();

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Base aggregation pipeline
    const pipeline = [
      {
        $match: {
          session_type: sessionType,
          created_at: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalMessages: { $sum: '$message_count' } // for chat sessions
        }
      }
    ];

    // Get the sessions collection
    const sessionsCollection = db.collection('sessions');

    // Execute aggregation
    const stats = await sessionsCollection.aggregate(pipeline).toArray();

    // Initialize counters
    let totalToday = 0;
    let completed = 0;
    let ongoing = 0;
    let pending = 0;
    let active = 0; // for chat
    let completedToday = 0; // for chat
    let totalDuration = 0;
    let totalMessages = 0;
    let completedCount = 0;

    // Process stats
    stats.forEach((stat) => {
      const aggregatedStat = stat as { _id: string; count: number; totalDuration?: number; totalMessages?: number };
      totalToday += aggregatedStat.count;
      
      switch (aggregatedStat._id) {
        case 'completed':
          completed += aggregatedStat.count;
          completedToday += aggregatedStat.count; // for chat
          completedCount += aggregatedStat.count;
          totalDuration += aggregatedStat.totalDuration || 0;
          break;
        case 'ongoing':
          ongoing += aggregatedStat.count;
          active += aggregatedStat.count; // for chat (active = ongoing)
          break;
        case 'pending':
          pending += aggregatedStat.count;
          break;
        case 'cancelled':
        case 'missed':
          // Count towards total but not other specific stats
          break;
      }

      if (sessionType === 'chat') {
        totalMessages += aggregatedStat.totalMessages || 0;
      }
    });

    // Calculate averages
    let avgDuration = '0m';
    if (completedCount > 0 && totalDuration > 0) {
      const avgMinutes = Math.round(totalDuration / completedCount);
      const hours = Math.floor(avgMinutes / 60);
      const mins = avgMinutes % 60;
      avgDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    let avgMessages = 0;
    if (sessionType === 'chat' && completedToday > 0) {
      avgMessages = Math.round(totalMessages / completedToday);
    }

    // Prepare response based on session type
    let responseData;
    switch (sessionType) {
      case 'call':
        responseData = {
          totalToday,
          completed,
          ongoing,
          avgDuration
        };
        break;
      case 'chat':
        responseData = {
          totalToday,
          active,
          completedToday,
          avgMessages
        };
        break;
      case 'video':
        responseData = {
          totalToday,
          ongoing,
          pending,
          avgDuration
        };
        break;
      default:
        responseData = {
          totalToday,
          completed,
          ongoing,
          avgDuration
        };
    }

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching session statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch session statistics' 
      },
      { status: 500 }
    );
  }
}