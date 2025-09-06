import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import DatabaseService from '../../../../lib/database';
import { 
  PasswordSecurity,
  SecurityMiddleware,
  InputSanitizer
} from '../../../../lib/security';
import { Validator } from '../../../../lib/validation';

// POST - Reset password using token
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔐 Password reset attempt from IP: ${ip}`);

    // Rate limiting for password reset attempts
    const rateLimitResult = await SecurityMiddleware.checkRateLimit(
      request, 
      'reset-password', 
      10, // 10 attempts
      60 * 60 * 1000 // per hour
    );
    
    if (!rateLimitResult.allowed) {
      console.log(`🚫 Rate limit exceeded for password reset from IP: ${ip}`);
      
      return NextResponse.json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many password reset attempts. Please wait before trying again.',
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
        }
      });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { token, newPassword, confirmPassword } = sanitizedBody;

    // Validate input
    const validation = Validator.validate([
      {
        field: 'token',
        value: token,
        rules: ['required', 'minLength:64', 'maxLength:64']
      },
      {
        field: 'newPassword',
        value: newPassword,
        rules: ['required', 'minLength:8']
      },
      {
        field: 'confirmPassword',
        value: confirmPassword,
        rules: ['required']
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

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match'
      }, { status: 400 });
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token as string).digest('hex');

    // Get database connection
    const usersCollection = await DatabaseService.getCollection('users');

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      password_reset_token: tokenHash,
      password_reset_expires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await PasswordSecurity.hashPassword(newPassword as string);

    // Update user's password and clear reset token
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password_hash: hashedPassword,
          updated_at: new Date()
        },
        $unset: {
          password_reset_token: '',
          password_reset_expires: ''
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

    console.log(`🔐 Password successfully reset for user: ${user._id} (${user.email_address})`);

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset. You can now login with your new password.',
      user_id: user._id.toString()
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while resetting your password. Please try again later.'
    }, { status: 500 });
  }
}

// GET - Display password reset form (for web interface)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Reset token is required'
      }, { status: 400 });
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token as string).digest('hex');

    // Get database connection
    const usersCollection = await DatabaseService.getCollection('users');

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      password_reset_token: tokenHash,
      password_reset_expires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    // Return token validation success
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      user_email: user.email_address,
      user_name: user.full_name || user.name || 'User',
      expires_at: user.password_reset_expires
    });

  } catch (error) {
    console.error('Password reset form error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while loading the reset form'
    }, { status: 500 });
  }
}