import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';
import { withSecurity } from '@/lib/api-security';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export const PATCH = withSecurity(async (request: NextRequest) => {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Bulk update request received:', {
        hasBody: !!body,
        bodyKeys: body ? Object.keys(body) : [],
        userIdsType: body?.userIds ? typeof body.userIds : 'undefined',
        userIdsLength: Array.isArray(body?.userIds) ? body.userIds.length : 0
      });
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userIds, updates } = body || {};

    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('Validation failed:', { userIds, isArray: Array.isArray(userIds) });
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
    if (updates.account_status && !['active', 'inactive', 'banned'].includes(updates.account_status)) {
      return NextResponse.json({ error: 'Invalid account_status value' }, { status: 400 });
    }

    if (updates.verification_status && !['verified', 'pending', 'rejected'].includes(updates.verification_status)) {
      return NextResponse.json({ error: 'Invalid verification_status value' }, { status: 400 });
    }

    if (updates.is_online !== undefined && typeof updates.is_online !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_online value' }, { status: 400 });
    }

    if (updates.is_featured !== undefined && typeof updates.is_featured !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_featured value' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Convert userIds to ObjectIds
    const objectIds = userIds.map((id: string) => new ObjectId(id));

    // Prepare update document with timestamp
    const updateDoc = {
      ...updates,
      updated_at: new Date()
    };

    // Perform bulk update
    const result = await usersCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateDoc }
    );

    await client.close();

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