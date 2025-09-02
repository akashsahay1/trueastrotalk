/**
 * API endpoints for real-time user statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import ErrorMonitoringService from '../../../../lib/error-monitoring-service';

// Get current real-time user counts (GET)
export async function GET() {
  try {
    const stats = await ErrorMonitoringService.getCurrentUserCounts();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching realtime stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch realtime stats' },
      { status: 500 }
    );
  }
}

// Update real-time stats manually (POST) - for testing or manual updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requiredFields = ['total_customers', 'total_astrologers', 'online_customers', 'online_astrologers'];
    const missingFields = requiredFields.filter(field => typeof body[field] !== 'number');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    await ErrorMonitoringService.updateRealtimeStats({
      total_customers: body.total_customers,
      total_astrologers: body.total_astrologers,
      online_customers: body.online_customers,
      online_astrologers: body.online_astrologers,
      active_sessions: body.active_sessions || 0,
      active_calls: body.active_calls || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Real-time stats updated'
    });

  } catch (error) {
    console.error('Error updating realtime stats:', error);
    return NextResponse.json(
      { error: 'Failed to update realtime stats' },
      { status: 500 }
    );
  }
}