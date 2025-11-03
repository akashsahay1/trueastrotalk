import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import {
  generateOTP,
  getOTPExpiry,
  formatPhoneNumber,
  isValidPhoneNumber,
  isRateLimited,
  sendOTPSMS,
  OTP_BYPASS_MODE,
  MAX_OTP_REQUESTS_PER_HOUR,
} from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number } = body;

    console.log('📱 Phone login OTP request for:', phone_number);

    // Validate phone number
    if (!phone_number) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
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

    // Check if user exists and is verified
    const existingUser = await usersCollection.findOne({
      phone_number: formattedPhone,
      phone_verified: true,
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'No account found with this phone number. Please sign up first.',
        },
        { status: 404 }
      );
    }

    // Check rate limiting
    const requestCount = existingUser.otp_request_count || 0;
    const lastRequestTime = existingUser.otp_last_request_time;

    if (isRateLimited(lastRequestTime, requestCount)) {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Reset if more than 1 hour
      if (lastRequestTime && lastRequestTime < oneHourAgo) {
        await usersCollection.updateOne(
          { phone_number: formattedPhone },
          {
            $set: {
              otp_request_count: 0,
              otp_last_request_time: null,
            },
          }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Too many OTP requests. Please try again after 1 hour. (Max ${MAX_OTP_REQUESTS_PER_HOUR} per hour)`,
          },
          { status: 429 }
        );
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiry = getOTPExpiry();
    const now = new Date();

    console.log(`🔑 Generated OTP: ${otp} for ${formattedPhone} (login)`);
    if (OTP_BYPASS_MODE) {
      console.log('🔓 Bypass mode enabled - use "0000" for testing');
    }

    // Send OTP via SMS
    const smsSent = await sendOTPSMS(formattedPhone, otp);

    if (!smsSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Update user record with OTP
    const newRequestCount = (requestCount || 0) + 1;

    await usersCollection.updateOne(
      { phone_number: formattedPhone },
      {
        $set: {
          otp_code: otp,
          otp_expiry: expiry,
          otp_attempts: 0,
          otp_sent_at: now,
          otp_request_count: newRequestCount,
          otp_last_request_time: now,
          updated_at: now,
        },
      }
    );

    console.log(`✅ Login OTP sent successfully to ${formattedPhone}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      phone_number: formattedPhone,
      expiry_seconds: 300, // 5 minutes
      testing_mode: OTP_BYPASS_MODE,
      ...(OTP_BYPASS_MODE && { test_otp_hint: 'Use 0000 for testing' }),
    });
  } catch (error) {
    console.error('❌ Error sending login OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
