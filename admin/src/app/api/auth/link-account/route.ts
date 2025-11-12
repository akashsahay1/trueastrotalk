import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import {
  verifyOTP,
  formatPhoneNumber,
  isValidPhoneNumber,
  MAX_OTP_ATTEMPTS,
} from '@/lib/otp';
import { JWTSecurity, InputSanitizer } from '@/lib/security';

/**
 * Progressive Account Linking Endpoint
 *
 * This endpoint allows users to link an additional identifier (email or phone)
 * to their existing account after they've already logged in.
 *
 * Flow:
 * 1. User logs in with email → prompted to add phone (optional)
 * 2. User logs in with phone → prompted to add email (optional)
 * 3. User logs in with Google → prompted to add phone (optional)
 *
 * Request body:
 * - link_type: 'email' or 'phone' (what they want to link)
 * - identifier: email address or phone number to link
 * - otp: 4-digit OTP code (must be verified first via send-otp endpoint)
 *
 * Headers:
 * - Authorization: Bearer <access_token>
 */

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = JWTSecurity.verifyAccessToken(token);
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid token payload');
      }
      userId = decoded.userId as string;
    } catch (_error) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    const { link_type, identifier, otp } = sanitizedBody;

    // Validate required fields
    if (!link_type || !identifier || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Link type, identifier, and OTP are required',
        },
        { status: 400 }
      );
    }

    // Validate link type
    if (!['email', 'phone'].includes(link_type as string)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_LINK_TYPE',
          message: 'Link type must be "email" or "phone"',
        },
        { status: 400 }
      );
    }

    // Format and validate identifier
    let formattedIdentifier: string;
    let queryField: string;
    let verificationField: string;

    if (link_type === 'phone') {
      formattedIdentifier = formatPhoneNumber(identifier as string);
      if (!isValidPhoneNumber(formattedIdentifier)) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_PHONE',
            message: 'Please provide a valid phone number',
          },
          { status: 400 }
        );
      }
      queryField = 'phone_number';
      verificationField = 'phone_verified';
    } else {
      formattedIdentifier = InputSanitizer.sanitizeEmail(identifier as string);
      if (!isValidEmail(formattedIdentifier)) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_EMAIL',
            message: 'Please provide a valid email address',
          },
          { status: 400 }
        );
      }
      queryField = 'email_address';
      verificationField = 'email_verified';
    }

    const usersCollection = await DatabaseService.getCollection('users');

    // Check if identifier is already linked to another account
    const existingUser = await usersCollection.findOne({
      [queryField]: formattedIdentifier,
      user_id: { $ne: userId }, // Different user
      full_name: { $exists: true, $ne: '' }, // Fully registered
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'IDENTIFIER_IN_USE',
          message: `This ${link_type} is already linked to another account`,
        },
        { status: 409 }
      );
    }

    // Verify OTP for the identifier
    const otpRecord = await usersCollection.findOne({
      [queryField]: formattedIdentifier,
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'OTP_NOT_FOUND',
          message: `No OTP found for this ${link_type}. Please request a new one.`,
        },
        { status: 404 }
      );
    }

    // Check OTP attempts
    const attempts = otpRecord.otp_attempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          error: 'MAX_ATTEMPTS_EXCEEDED',
          message: `Maximum OTP attempts exceeded. Please request a new OTP.`,
        },
        { status: 429 }
      );
    }

    // Verify OTP
    const verification = verifyOTP(
      otp as string,
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
          error: 'INVALID_OTP',
          message: verification.reason || 'Invalid OTP',
          remaining_attempts: Math.max(0, remainingAttempts),
        },
        { status: 400 }
      );
    }

    // OTP verified! Now link the identifier to the user's account
    const currentUser = await usersCollection.findOne({ user_id: userId });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User account not found',
        },
        { status: 404 }
      );
    }

    // Update user's account with the new identifier
    const updateData: Record<string, unknown> = {
      [queryField]: formattedIdentifier,
      [verificationField]: true,
      updated_at: new Date(),
    };

    await usersCollection.updateOne(
      { user_id: userId },
      { $set: updateData }
    );

    // Clean up the OTP record if it was a separate record
    if (otpRecord.user_id !== userId) {
      await usersCollection.deleteOne({
        [queryField]: formattedIdentifier,
        user_id: { $ne: userId },
      });
    }

    // Fetch updated user
    const updatedUser = await usersCollection.findOne({ user_id: userId });

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'UPDATE_FAILED',
          message: 'Failed to retrieve updated user data',
        },
        { status: 500 }
      );
    }

    // Prepare response (exclude sensitive fields)
    const { otp_code: _otp_code, otp_expiry: _otp_expiry, otp_attempts: _otp_attempts, password: _password, ...userWithoutSensitive } = updatedUser;

    return NextResponse.json({
      success: true,
      message: `${link_type === 'email' ? 'Email' : 'Phone'} linked successfully`,
      user: userWithoutSensitive,
    });
  } catch (error) {
    console.error('❌ Error linking account:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to link account. Please try again.',
      },
      { status: 500 }
    );
  }
}
