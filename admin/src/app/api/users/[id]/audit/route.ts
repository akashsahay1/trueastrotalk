import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { SecurityMiddleware } from '@/lib/security';

/**
 * GET /api/users/[id]/audit
 * Fetch audit logs for a specific user
 * Only accessible by administrators and managers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request - only admins and managers can access audit logs
    let currentUser;
    try {
      currentUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Check if user has permission (admin or manager)
    if (!['administrator', 'manager'].includes(currentUser.userType as string)) {
      return NextResponse.json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators and managers can access audit logs'
      }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_USER_ID',
        message: 'User ID is required'
      }, { status: 400 });
    }

    const auditCollection = await DatabaseService.getCollection('audit_logs');

    // Fetch audit logs for this user, sorted by most recent first
    const logs = await auditCollection.find({
      entity_id: id,
      entity_type: 'user'
    })
      .sort({ created_at: -1 })
      .limit(50) // Limit to last 50 entries
      .toArray();

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        _id: log._id.toString(),
        action: log.action,
        previous_value: log.previous_value,
        new_value: log.new_value,
        reason: log.reason,
        performed_by_id: log.performed_by_id,
        performed_by_name: log.performed_by_name,
        performed_by_type: log.performed_by_type,
        ip_address: log.ip_address,
        created_at: log.created_at
      }))
    });

  } catch (error) {
    console.error('Audit log fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching audit logs'
    }, { status: 500 });
  }
}
