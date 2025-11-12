import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';
import { withSecurity, AuthenticatedNextRequest, getRequestBody } from '@/lib/api-security';

export const PATCH = withSecurity(async (request: AuthenticatedNextRequest) => {
  try {
    // Get parsed body from middleware (already sanitized and parsed)
    const body = await getRequestBody<{ userIds?: string[]; updates?: Record<string, unknown> }>(request);

    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userIds, updates } = body;

    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Updates are required' }, { status: 400 });
    }

    // Validate allowed fields
    const allowedFields = ['account_status', 'verification_status', 'is_online', 'is_featured'];
    const updateFields = Object.keys(updates);
    
    for (const field of updateFields) {
      if (!allowedFields.includes(field)) {
        return NextResponse.json({ error: `Field '${field}' is not allowed for bulk update` }, { status: 400 });
      }
    }

    // Validate field values
    if (updates.account_status && !['active', 'inactive', 'banned'].includes(updates.account_status as string)) {
      return NextResponse.json({ error: 'Invalid account_status value' }, { status: 400 });
    }

    if (updates.verification_status && !['verified', 'pending', 'rejected'].includes(updates.verification_status as string)) {
      return NextResponse.json({ error: 'Invalid verification_status value' }, { status: 400 });
    }

    if (updates.is_online !== undefined && typeof updates.is_online !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_online value' }, { status: 400 });
    }

    if (updates.is_featured !== undefined && typeof updates.is_featured !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_featured value' }, { status: 400 });
    }

    // Connect to MongoDB
    const usersCollection = await DatabaseService.getCollection('users');

    // Check if IDs are MongoDB ObjectIds or custom user_ids
    // MongoDB ObjectIds are 24 hex characters, custom IDs are different
    const isObjectId = userIds[0].length === 24 && /^[0-9a-fA-F]{24}$/.test(userIds[0]);

    // Prepare update document with timestamp
    const updateDoc = {
      ...updates,
      updated_at: new Date()
    };

    // Perform bulk update using appropriate ID field
    let result;
    if (isObjectId) {
      // Use MongoDB _id
      const objectIds = userIds.map((id: string) => new ObjectId(id));
      result = await usersCollection.updateMany(
        { _id: { $in: objectIds } },
        { $set: updateDoc }
      );
    } else {
      // Use custom user_id field
      result = await usersCollection.updateMany(
        { user_id: { $in: userIds } },
        { $set: updateDoc }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Bulk update completed successfully',
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  requireAuth: true,
  allowedRoles: ['administrator'],
  requireCSRF: true,
  rateLimit: {
    requests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
});