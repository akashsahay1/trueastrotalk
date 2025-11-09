import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const DB_NAME = 'trueastrotalk';

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired' 
      }, { status: 401 });
    }

    // Verify user is either a customer or astrologer
    if (payload.user_type !== 'customer' && payload.user_type !== 'astrologer') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Customer or astrologer account required.' 
      }, { status: 403 });
    }

    // Connect to MongoDB
    const usersCollection = await DatabaseService.getCollection('users');

    // Look up user by custom user_id, not MongoDB ObjectId
    const user = await usersCollection.findOne(
      { user_id: payload.userId as string },
      { projection: { wallet_balance: 1, full_name: 1, email_address: 1 } }
    );
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        message: 'User account no longer exists' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        wallet_balance: user.wallet_balance,
        user_name: user.full_name,
        user_email: user.email_address
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while retrieving wallet balance'
    }, { status: 500 });
  }
}