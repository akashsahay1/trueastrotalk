import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        // Update user's online status
        const client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DB_NAME);
        
        await db.collection('users').updateOne(
          { _id: new ObjectId((payload as { userId: string }).userId) },
          { 
            $set: { 
              is_online: false,
              updated_at: new Date()
            }
          }
        );
        
        await client.close();
      } catch(error) {
        console.error(error);
      }
    }

    // Create response and clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');

    return response;

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}