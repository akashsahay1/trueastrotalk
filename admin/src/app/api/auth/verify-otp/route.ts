import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import {
  verifyOTP,
  formatPhoneNumber,
  isValidPhoneNumber,
  MAX_OTP_ATTEMPTS,
  OTP_BYPASS_MODE,
} from '@/lib/otp';
import { JWTSecurity } from '@/lib/security';

/**
 * Unified OTP Verification Endpoint
 *
 * This endpoint verifies OTP for both email and phone authentication.
 * It returns user_exists flag to indicate whether this is a login or signup flow.
 *
 * Request body:
 * - identifier: email or phone number
 * - otp: 4-digit OTP code
 * - auth_type: 'email' or 'phone' (optional, auto-detected if not provided)
 *
 * Legacy support:
 * - phone_number: phone number (for backward compatibility)
 */

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, otp, auth_type, phone_number } = body;

    // Support both new (identifier) and legacy (phone_number) parameter names
    const userIdentifier = identifier || phone_number;
    let authType = auth_type;

    // Validate inputs
    if (!userIdentifier || !otp) {
      return NextResponse.json(
        { success: false, error: 'Identifier and OTP are required' },
        { status: 400 }
      );
    }

    // Auto-detect auth type if not provided
    if (!authType) {
      authType = userIdentifier.includes('@') ? 'email' : 'phone';
    }

    // Format and validate based on auth type
    let formattedIdentifier: string;
    let queryField: string;

    if (authType === 'phone') {
      formattedIdentifier = formatPhoneNumber(userIdentifier);
      if (!isValidPhoneNumber(formattedIdentifier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      queryField = 'phone_number';
    } else if (authType === 'email') {
      formattedIdentifier = userIdentifier.trim().toLowerCase();
      if (!isValidEmail(formattedIdentifier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
      queryField = 'email_address';
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid auth_type. Must be "email" or "phone"' },
        { status: 400 }
      );
    }

    const usersCollection = await DatabaseService.getCollection('users');

    // Find OTP record
    const otpRecord = await usersCollection.findOne({
      [queryField]: formattedIdentifier,
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: `No OTP found for this ${authType}. Please request a new one.`,
        },
        { status: 404 }
      );
    }

    // Check attempts
    const attempts = otpRecord.otp_attempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum OTP attempts (${MAX_OTP_ATTEMPTS}) exceeded. Please request a new OTP.`,
        },
        { status: 429 }
      );
    }

    // Verify OTP
    const verification = verifyOTP(
      otp,
      otpRecord.otp_code,
      otpRecord.otp_expiry
    );

    // Increment attempt count
    await usersCollection.updateOne(
      { [queryField]: formattedIdentifier },
      {
        $set: {
          otp_attempts: attempts + 1,
          updated_at: new Date(),
        },
      }
    );

    if (!verification.valid) {
      const remainingAttempts = MAX_OTP_ATTEMPTS - (attempts + 1);

      return NextResponse.json(
        {
          success: false,
          error: verification.reason || 'Invalid OTP',
          remaining_attempts: Math.max(0, remainingAttempts),
        },
        { status: 400 }
      );
    }

    // OTP verified successfully!
    // Check if this is a fully registered user or just an OTP verification record
    const isFullyRegistered = !!(
      otpRecord.full_name &&
      otpRecord.role &&
      (otpRecord.email_verified || otpRecord.phone_verified)
    );

    // Update verification status
    const verificationField = authType === 'email' ? 'email_verified' : 'phone_verified';
    await usersCollection.updateOne(
      { [queryField]: formattedIdentifier },
      {
        $set: {
          [verificationField]: true,
          otp_code: null, // Clear OTP
          otp_expiry: null,
          otp_attempts: 0,
          verified_at: new Date(),
          updated_at: new Date(),
        },
      }
    );

    // If user is fully registered, this is a login - return user data and tokens
    if (isFullyRegistered) {
      // Fetch updated user record
      const user = await usersCollection.findOne({
        [queryField]: formattedIdentifier,
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found after verification' },
          { status: 500 }
        );
      }

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.user_id || user._id.toString(),
        email: user.email_address,
        full_name: user.full_name,
        user_type: user.user_type || user.role,
        account_status: user.account_status,
        session_id: crypto.randomUUID(),
      };

      const accessToken = JWTSecurity.generateAccessToken(tokenPayload);
      const refreshToken = JWTSecurity.generateRefreshToken({
        userId: user.user_id || user._id.toString(),
        session_id: tokenPayload.session_id,
      });

      // Prepare user object (exclude sensitive fields)
      const { otp_code: _otp_code, otp_expiry: _otp_expiry, otp_attempts: _otp_attempts, ...userWithoutOTP } = user;

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully - Login complete',
        user_exists: true,
        requires_signup: false,
        user: userWithoutOTP,
        access_token: accessToken,
        refresh_token: refreshToken,
        auth_type: authType,
      });
    }

    // User is not fully registered - return verification success only
    // The client will navigate to signup completion screen
    if (OTP_BYPASS_MODE && otp === '0000') {
      console.log('🔓 OTP bypass mode enabled - OTP 0000 accepted');
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user_exists: false,
      requires_signup: true,
      [queryField === 'phone_number' ? 'phone_number' : 'email_address']: formattedIdentifier,
      [verificationField]: true,
      auth_type: authType,
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
