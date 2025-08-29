/**
 * API endpoints for performance metrics and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import ErrorMonitoringService from '../../../../lib/error-monitoring-service';

// Record performance metric (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.metric_type || typeof body.value !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: metric_type, value' },
        { status: 400 }
      );
    }

    const metric = {
      metric_type: body.metric_type,
      value: body.value,
      details: body.details || {},
      timestamp: new Date()
    };

    await ErrorMonitoringService.recordPerformanceMetric(metric);

    return NextResponse.json({
      success: true,
      message: 'Performance metric recorded'
    });

  } catch (error) {
    console.error('Performance metric endpoint failed:', error);
    return NextResponse.json(
      { error: 'Failed to record performance metric' },
      { status: 500 }
    );
  }
}

// Get performance summary (GET)
export async function GET(request: NextRequest) {
  try {
    const summary = await ErrorMonitoringService.getPerformanceSummary();

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching performance summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance summary' },
      { status: 500 }
    );
  }
}