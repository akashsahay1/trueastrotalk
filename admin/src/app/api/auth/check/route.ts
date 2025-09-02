import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if user is admin
    if (payload.user_type !== 'administrator') {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Return user info if authenticated
    return NextResponse.json({ 
      authenticated: true,
      userId: payload.userId,
      userType: payload.user_type,
      email: payload.email
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}