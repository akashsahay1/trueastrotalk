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

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Get dashboard statistics
    const [totalCustomers, totalAstrologers, recentCustomers] = await Promise.all([
      // Count customers
      usersCollection.countDocuments({ 
        user_type: 'customer',
        account_status: { $ne: 'banned' }
      }),
      
      // Count astrologers
      usersCollection.countDocuments({ 
        user_type: 'astrologer',
        account_status: { $ne: 'banned' }
      }),
      
      // Get recent customers (last 15)
      usersCollection.find(
        { 
          user_type: 'customer',
          account_status: { $ne: 'banned' }
        },
        {
          projection: {
            full_name: 1,
            email_address: 1,
            phone_number: 1,
            account_status: 1,
            created_at: 1
          }
        }
      )
      .sort({ created_at: -1 })
      .limit(15)
      .toArray()
    ]);

    await client.close();

    // For now, set orders and revenue to 0 as requested
    const stats = {
      totalCustomers,
      totalAstrologers,
      totalOrders: 0,
      totalRevenue: 0
    };

    return NextResponse.json({
      success: true,
      stats,
      recentCustomers
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}