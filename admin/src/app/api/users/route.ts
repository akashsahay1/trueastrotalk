import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const userType = searchParams.get('type');
    const search = searchParams.get('search') || '';
    
    // Calculate skip
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (userType && userType !== 'all') {
      query.user_type = userType;
    }
    
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email_address: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } }
      ];
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      usersCollection.find(query, {
        projection: {
          password: 0 // Exclude password from results
        }
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
      
      usersCollection.countDocuments(query)
    ]);

    await client.close();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}