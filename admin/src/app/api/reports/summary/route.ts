/**
 * API endpoint for reports summary dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import ErrorMonitoringService from '../../../../lib/error-monitoring-service';

// Get comprehensive reports summary for dashboard (GET)
export async function GET(request: NextRequest) {
  try {
    const [errorSummary, performanceSummary, realtimeStats] = await Promise.all([
      ErrorMonitoringService.getErrorSummary(),
      ErrorMonitoringService.getPerformanceSummary(),
      ErrorMonitoringService.getCurrentUserCounts()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        errors: errorSummary,
        performance: performanceSummary,
        realtime: realtimeStats,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching reports summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports summary' },
      { status: 500 }
    );
  }
}