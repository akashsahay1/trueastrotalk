import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../lib/database';
import {
  PasswordSecurity,
  SecurityMiddleware,
  InputSanitizer,
  JWTSecurity
} from '../../../../lib/security';
import { Validator } from '../../../../lib/validation';

// POST - Change password for authenticated user
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔐 Password change attempt from IP: ${ip}`);

    // Rate limiting for password change attempts (more lenient for legitimate users)
    const rateLimitResult = await SecurityMiddleware.checkRateLimit(
      request,
      'change-password',
      10, // 10 attempts (more reasonable)
      60 * 60 * 1000 // per hour (longer window)
    );

    if (!rateLimitResult.allowed) {
      console.log(`🚫 Rate limit exceeded for password change from IP: ${ip}`);

      return NextResponse.json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many password change attempts. Please wait before trying again.',
        retryAfter: rateLimitResult.retryAfter
      }, {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
        }
      });
    }

    // Extract and verify authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authorization header with Bearer token is required'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = JWTSecurity.verifyAccessToken(token);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_FAILED',
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    if (!user || !user.userId) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_TOKEN_PAYLOAD',
        message: 'Authentication token does not contain valid user information'
      }, { status: 401 });
    }

    // Additional per-user rate limiting (more specific)
    const userRateLimit = await SecurityMiddleware.checkRateLimit(
      request,
      `change-password-${user.userId}`,
      3, // 3 failed attempts per user
      60 * 10 * 1000 // per 10 minutes
    );

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);

    const { current_password, new_password } = sanitizedBody;

    // Validate input
    const validation = Validator.validate([
      {
        field: 'current_password',
        value: current_password,
        rules: ['required', 'minLength:1']
      },
      {
        field: 'new_password',
        value: new_password,
        rules: ['required', 'minLength:8']
      }
    ]);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input provided',
        details: validation.errors
      }, { status: 400 });
    }

    // Get database connection
    const usersCollection = await DatabaseService.getCollection('users');

    // Find the user by custom user_id from token
    const dbUser = await usersCollection.findOne({
      user_id: user.userId as string,
      account_status: { $ne: 'banned' }
    });

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      }, { status: 404 });
    }

    // Check per-user rate limit for failed attempts
    if (!userRateLimit.allowed) {
      console.log(`🚫 Per-user rate limit exceeded for password change: ${user.userId}`);
      return NextResponse.json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many failed password attempts. Please wait 10 minutes before trying again.',
        retryAfter: Math.ceil((userRateLimit.retryAfter || 600000) / 1000)
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((userRateLimit.retryAfter || 600000) / 1000).toString()
        }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await PasswordSecurity.verifyPassword(
      current_password as string,
      dbUser.password
    );

    if (!isCurrentPasswordValid) {
      console.log(`🚫 Invalid current password for user: ${dbUser.user_id} (${dbUser.email_address})`);

      // Record failed attempt for per-user rate limiting
      await SecurityMiddleware.checkRateLimit(
        request,
        `change-password-${user.userId}`,
        3,
        60 * 10 * 1000
      );

      return NextResponse.json({
        success: false,
        error: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect'
      }, { status: 400 });
    }

    // Check if new password is different from current password
    const isSamePassword = await PasswordSecurity.verifyPassword(
      new_password as string,
      dbUser.password
    );

    if (isSamePassword) {
      return NextResponse.json({
        success: false,
        error: 'SAME_PASSWORD',
        message: 'New password must be different from current password'
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await PasswordSecurity.hashPassword(new_password as string);

    // Update user's password
    const updateResult = await usersCollection.updateOne(
      { user_id: dbUser.user_id },
      {
        $set: {
          password: hashedPassword,
          updated_at: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update password'
      }, { status: 500 });
    }

    console.log(`🔐 Password successfully changed for user: ${dbUser.user_id} (${dbUser.email_address})`);

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully changed.',
      user_id: dbUser.user_id
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while changing your password. Please try again later.'
    }, { status: 500 });
  }
}