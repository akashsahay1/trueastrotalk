import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET endpoint to obtain CSRF token
 * Returns the token in response body and sets it as a non-httpOnly cookie
 * so it can be read by JavaScript
 */
export async function GET() {
  try {
    // Generate a CSRF token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create response with token in body
    const response = NextResponse.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
    
    // Set the token as a cookie (not httpOnly so JS can read it)
    response.cookies.set('csrf-token', token, {
      httpOnly: false,  // Allow JavaScript to read this cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}