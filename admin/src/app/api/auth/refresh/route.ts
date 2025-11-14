import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../lib/database';
import { JWTSecurity } from '../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Extract refresh token from multiple sources
    let refreshToken = request.cookies.get('refresh_token')?.value;
    
    // Also check request body for mobile clients
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refresh_token;
      } catch {
        // Request body is not JSON or empty
      }
    }

    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token is required'
      }, { status: 401 });
    }

    // Verify refresh token
    let tokenData;
    try {
      tokenData = JWTSecurity.verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      }, { status: 401 });
    }

    if (!tokenData?.userId) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_TOKEN_DATA',
        message: 'Invalid token data'
      }, { status: 401 });
    }

    // Get user from database to ensure they still exist and are active
    const usersCollection = await DatabaseService.getCollection('users');
    const user = await usersCollection.findOne({
      user_id: tokenData.userId as string,
      account_status: { $ne: 'banned' }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found or has been suspended'
      }, { status: 401 });
    }

    // Check account status
    if (user.account_status === 'inactive') {
      return NextResponse.json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive. Please verify your account.'
      }, { status: 403 });
    }

    // Generate new tokens with fresh session ID
    const newSessionId = crypto.randomUUID();
    const accessTokenPayload = {
      userId: user.user_id,
      email: user.email_address,
      full_name: user.full_name,
      user_type: user.user_type,
      account_status: user.account_status,
      session_id: newSessionId
    };

    const newAccessToken = JWTSecurity.generateAccessToken(accessTokenPayload);
    const newRefreshToken = JWTSecurity.generateRefreshToken({
      userId: user.user_id,
      session_id: newSessionId
    });

    // Update user's last activity
    await usersCollection.updateOne(
      { user_id: user.user_id },
      { 
        $set: { 
          last_activity: new Date(),
          updated_at: new Date()
        }
      }
    );


    // Determine response format based on User-Agent or request source
    const userAgent = request.headers.get('user-agent') || '';
    const isMobileApp = userAgent.toLowerCase().includes('dart') || 
                       userAgent.toLowerCase().includes('flutter') ||
                       request.headers.get('x-client-type') === 'mobile';

    if (isMobileApp) {
      // Mobile response with tokens in body
      return NextResponse.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: 7776000, // 90 days in seconds
          user: {
            id: user.user_id,
            full_name: user.full_name,
            email_address: user.email_address,
            user_type: user.user_type,
            account_status: user.account_status
          }
        }
      });
    } else {
      // Admin/web response with secure cookies
      const response = NextResponse.json({
        success: true,
        message: 'Tokens refreshed successfully',
        user: {
          id: user._id.toString(),
          full_name: user.full_name,
          email: user.email_address,
          user_type: user.user_type,
          account_status: user.account_status
        }
      });

      // Set secure HTTP-only cookies
      response.cookies.set('auth-token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        path: '/'
      });

      response.cookies.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
        path: '/'
      });

      return response;
    }

  } catch (error) {
    console.error('Token refresh API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to refresh tokens. Please login again.'
    }, { status: 500 });
  }
}