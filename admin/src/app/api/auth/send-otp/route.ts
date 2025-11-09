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

    // Check if phone is already registered and verified
    const existingUser = await usersCollection.findOne({
      phone_number: formattedPhone,
      phone_verified: true,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'This phone number is already registered. Please login instead.',
        },
        { status: 400 }
      );
    }

    // Get or create OTP tracking record
    let otpRecord = await usersCollection.findOne({
      phone_number: formattedPhone,
      phone_verified: false,
    });

    // Check rate limiting
    if (otpRecord) {
      const requestCount = otpRecord.otp_request_count || 0;
      const lastRequestTime = otpRecord.otp_last_request_time;

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
    }

    // Generate OTP
    const otp = generateOTP();
    const expiry = getOTPExpiry();
    const now = new Date();

    if (OTP_BYPASS_MODE) {
    }

    // Send OTP via SMS
    const smsSent = await sendOTPSMS(formattedPhone, otp);

    if (!smsSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Update or create OTP record
    if (otpRecord) {
      // Update existing record
      const requestCount = (otpRecord.otp_request_count || 0) + 1;

      await usersCollection.updateOne(
        { phone_number: formattedPhone },
        {
          $set: {
            otp_code: otp,
            otp_expiry: expiry,
            otp_attempts: 0,
            otp_sent_at: now,
            otp_request_count: requestCount,
            otp_last_request_time: now,
            updated_at: now,
          },
        }
      );
    } else {
      // Create new temporary record for OTP
      // Generate placeholder email to avoid unique index conflict
      const placeholderEmail = `${formattedPhone.replace(/\+/g, '')}@phone.trueastrotalk.com`;

      await usersCollection.insertOne({
        phone_number: formattedPhone,
        email_address: placeholderEmail, // Placeholder to satisfy unique index
        otp_code: otp,
        otp_expiry: expiry,
        otp_attempts: 0,
        otp_sent_at: now,
        otp_request_count: 1,
        otp_last_request_time: now,
        phone_verified: false,
        created_at: now,
        updated_at: now,
      });
    }


    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      phone_number: formattedPhone,
      expiry_seconds: 300, // 5 minutes
      testing_mode: OTP_BYPASS_MODE,
      ...(OTP_BYPASS_MODE && { test_otp_hint: 'Use 0000 for testing' }),
    });
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
