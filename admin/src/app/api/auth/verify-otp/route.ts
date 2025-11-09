import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import {
  verifyOTP,
  formatPhoneNumber,
  isValidPhoneNumber,
  MAX_OTP_ATTEMPTS,
  OTP_BYPASS_MODE,
} from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, otp } = body;


    // Validate inputs
    if (!phone_number || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phone_number);
    if (!isValidPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const usersCollection = await DatabaseService.getCollection('users');

    // Find OTP record
    const otpRecord = await usersCollection.findOne({
      phone_number: formattedPhone,
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'No OTP found for this phone number. Please request a new one.',
        },
        { status: 404 }
      );
    }

    // Check if already verified without an active OTP
    // If phone is verified but has an active OTP, it means user is logging in
    // If phone is verified without an active OTP, they should use login flow
    if (otpRecord.phone_verified && !otpRecord.otp_code) {
      return NextResponse.json(
        {
          success: false,
          error: 'This phone number is already verified. Please request a new OTP to login.',
        },
        { status: 400 }
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
      { phone_number: formattedPhone },
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
    // Mark phone as verified but don't create full user account yet
    // That will be done in the phone-signup endpoint
    await usersCollection.updateOne(
      { phone_number: formattedPhone },
      {
        $set: {
          phone_verified: true,
          otp_code: null, // Clear OTP
          otp_expiry: null,
          otp_attempts: 0,
          verified_at: new Date(),
          updated_at: new Date(),
        },
      }
    );

    if (OTP_BYPASS_MODE && otp === '0000') {
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      phone_number: formattedPhone,
      phone_verified: true,
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
