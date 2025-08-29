import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import DatabaseService from '../../../../lib/database';
import { 
  SecurityMiddleware,
  InputSanitizer,
  ValidationSchemas 
} from '../../../../lib/security';
import { Validator } from '../../../../lib/validation';
import { emailService } from '../../../../lib/email-service';

// POST - Forgot password request
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔐 Forgot password request from IP: ${ip}`);

    // Progressive rate limiting - gets stricter with repeated violations
    const rateLimitResult = await SecurityMiddleware.checkProgressiveRateLimit(request, 'forgot-password');
    if (!rateLimitResult.allowed) {
      console.log(`🚫 Rate limit exceeded for forgot password from IP: ${ip} (Level ${rateLimitResult.level})`);
      
      return NextResponse.json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.level === 0 
          ? 'Too many password reset attempts. Please wait 15 minutes before trying again.'
          : rateLimitResult.level === 1
          ? 'Multiple password reset attempts detected. Please wait 30 minutes before trying again.'
          : rateLimitResult.level === 2
          ? 'Excessive password reset attempts. Please wait 1 hour before trying again.'
          : 'Too many password reset attempts. Please wait 4 hours before trying again.',
        retryAfter: rateLimitResult.retryAfter,
        level: rateLimitResult.level
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '900', // Default 15 minutes
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Level': rateLimitResult.level.toString()
        }
      });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { email } = sanitizedBody;

    // Validate input
    const validation = Validator.validate({
      email: email
    }, {
      email: ValidationSchemas.email
    });

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Please provide a valid email address',
        details: validation.errors
      }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Additional rate limiting by email address to prevent targeting specific accounts
    const emailRateLimitResult = await SecurityMiddleware.checkRateLimit(
      request,
      `forgot-password-email:${normalizedEmail}`,
      5, // 5 attempts per email
      60 * 60 * 1000, // per hour
      () => `forgot-password-email:${normalizedEmail}` // Custom key generator
    );

    if (!emailRateLimitResult.allowed) {
      console.log(`🚫 Email rate limit exceeded for: ${normalizedEmail} from IP: ${ip}`);
      
      // Use same generic message for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
        reset_token: null
      });
    }

    // Get database connection
    const usersCollection = await DatabaseService.getCollection('users');

    // Find user by email
    const user = await usersCollection.findOne({
      email_address: normalizedEmail
    });

    // Always return success message for security (don't reveal if email exists)
    const successResponse = {
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link shortly.',
      reset_token: null // Don't expose token in response for security
    };

    // If user doesn't exist, still return success but don't send email
    if (!user) {
      console.log(`🔐 Password reset requested for non-existent email: ${normalizedEmail}`);
      return NextResponse.json(successResponse);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token in database
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password_reset_token: resetTokenHash,
          password_reset_expires: resetTokenExpiry,
          updated_at: new Date()
        }
      }
    );

    // Send password reset email
    try {
      const emailSent = await emailService.sendPasswordResetEmail(
        {
          name: user.full_name || user.name || 'User',
          email: user.email_address
        },
        resetToken
      );

      if (!emailSent) {
        console.error('Failed to send password reset email');
        // Don't expose email sending failure to user for security
      }
    } catch (emailError) {
      console.error('Password reset email error:', emailError);
      // Don't expose email errors to user for security
    }

    // Log the password reset request
    console.log(`🔐 Password reset token generated for user: ${user._id} (${normalizedEmail})`);

    // Return success response (same whether user exists or not for security)
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing your request. Please try again later.'
    }, { status: 500 });
  }
}

// GET - Verify reset token (optional endpoint for token validation)
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
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

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

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      user_id: user._id.toString(),
      expires_at: user.password_reset_expires
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while verifying the token'
    }, { status: 500 });
  }
}