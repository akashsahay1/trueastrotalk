import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../lib/database';
import { JWTSecurity } from '../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🚪 Logout request from IP: ${ip}`);

    // Extract token from multiple sources (header, cookies)
    let token = JWTSecurity.extractTokenFromHeader(request);
    if (!token) {
      token = JWTSecurity.extractTokenFromCookies(request, 'auth-token');
    }
    if (!token) {
      token = JWTSecurity.extractTokenFromCookies(request, 'auth-token'); // Legacy support
    }

    let userId = null;
    
    // If token exists, verify and update user status
    if (token) {
      try {
        const tokenData = JWTSecurity.verifyAccessToken(token);
        userId = tokenData?.userId;
        
        if (userId) {
          console.log(`👤 Logging out user: ${userId}`);
          
          // Update user's online status and logout time
          const usersCollection = await DatabaseService.getCollection('users');
          await usersCollection.updateOne(
            { user_id: userId as string },
            { 
              $set: { 
                is_online: false,
                last_logout: new Date(),
                updated_at: new Date()
              }
            }
          );
          
          console.log(`✅ User ${userId} logged out successfully`);
        }
      } catch {
        // Token is invalid but we still proceed with logout
        console.log('⚠️ Invalid token during logout - proceeding anyway');
      }
    }

    // Create response and clear all authentication cookies
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });

    // Clear all possible authentication cookies with proper settings
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0 // This expires the cookie immediately
    };

    response.cookies.set('auth-token', '', cookieOptions);
    response.cookies.set('refresh_token', '', cookieOptions);
    response.cookies.set('auth-token', '', cookieOptions); // Legacy support

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    
    // Still return success for logout even if there's an error
    // to prevent user from being stuck in logged-in state
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });

    // Clear cookies even on error
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0
    };

    response.cookies.set('auth-token', '', cookieOptions);
    response.cookies.set('refresh_token', '', cookieOptions);
    response.cookies.set('auth-token', '', cookieOptions);

    return response;
  }
}