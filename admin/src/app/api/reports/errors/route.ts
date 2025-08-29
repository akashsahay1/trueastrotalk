/**
 * API endpoints for error reporting and management
 */

import { NextRequest, NextResponse } from 'next/server';
import ErrorMonitoringService, { AppErrorDocument } from '../../../../lib/error-monitoring-service';

// Report a new error (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.error_type || !body.error_message || !body.severity) {
      return NextResponse.json(
        { error: 'Missing required fields: error_type, error_message, severity' },
        { status: 400 }
      );
    }

    // Extract user agent and app version from headers
    const userAgent = request.headers.get('user-agent') || '';
    const appVersion = request.headers.get('x-app-version') || '';
    const platform = request.headers.get('x-platform') as 'android' | 'ios' | 'web' || undefined;

    const errorData: Omit<AppErrorDocument, '_id' | 'created_at' | 'updated_at'> = {
      user_id: body.user_id,
      user_type: body.user_type,
      error_type: body.error_type,
      error_message: body.error_message,
      technical_details: body.technical_details,
      stack_trace: body.stack_trace,
      user_agent: userAgent,
      app_version: appVersion,
      platform: platform,
      screen_name: body.screen_name,
      context: body.context,
      severity: body.severity,
      resolved: false
    };

    const errorId = await ErrorMonitoringService.reportError(errorData);

    return NextResponse.json({
      success: true,
      error_id: errorId
    });

  } catch (error) {
    console.error('Error reporting endpoint failed:', error);
    return NextResponse.json(
      { error: 'Failed to report error' },
      { status: 500 }
    );
  }
}

// Get errors with pagination and filtering (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await ErrorMonitoringService.getRecentErrors(page, limit);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching errors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}

// Update error status (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.error_id || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: error_id, action' },
        { status: 400 }
      );
    }

    if (body.action === 'resolve') {
      const success = await ErrorMonitoringService.resolveError(
        body.error_id,
        body.resolved_by || 'admin',
        body.notes
      );

      return NextResponse.json({
        success,
        message: success ? 'Error resolved successfully' : 'Failed to resolve error'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating error status:', error);
    return NextResponse.json(
      { error: 'Failed to update error status' },
      { status: 500 }
    );
  }
}