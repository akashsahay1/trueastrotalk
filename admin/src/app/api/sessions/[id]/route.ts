import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const sessionId = decodeURIComponent(id);

    // Connect to MongoDB
    const sessionsCollection = await DatabaseService.getCollection('sessions');

    // Find the session by session_id
    const session = await sessionsCollection.findOne({ session_id: sessionId });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Format the session data
    const formattedSession = {
      ...session,
      _id: session._id.toString(),
      customer_id: session.customer_id.toString(),
      astrologer_id: session.astrologer_id.toString(),
      start_time: session.start_time.toISOString(),
      end_time: session.end_time ? session.end_time.toISOString() : undefined,
      created_at: session.created_at.toISOString(),
      last_message_time: session.last_message_time ? session.last_message_time.toISOString() : undefined
    };

    return NextResponse.json({
      success: true,
      session: formattedSession
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const sessionsCollection = await DatabaseService.getCollection('sessions');

    const result = await sessionsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Session deleted successfully'
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}