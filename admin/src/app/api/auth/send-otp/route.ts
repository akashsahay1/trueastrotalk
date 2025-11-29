import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { emailService } from '@/lib/email-service';
import { InputSanitizer } from '@/lib/security';
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

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send OTP via email
async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    return await emailService.sendEmail({
      to: email,
      subject: 'Your OTP Code - TrueAstroTalk',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6B46C1;">Verification Code</h2>
          <p>Your OTP code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your OTP code is: ${otp}. This code will expire in 5 minutes.`,
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    const identifier = sanitizedBody.identifier as string | undefined;
    const auth_type = sanitizedBody.auth_type as string | undefined;
    const phone_number = sanitizedBody.phone_number as string | undefined;

    // Determine auth type and identifier
    let authType = auth_type;
    let userIdentifier: string | undefined = identifier || phone_number;

    // Legacy support: if only phone_number is provided, assume phone auth
    if (!identifier && phone_number) {
      authType = 'phone';
      userIdentifier = phone_number;
    }

    // Validate identifier
    if (!userIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    // Auto-detect auth type if not provided
    if (!authType) {
      authType = userIdentifier.includes('@') ? 'email' : 'phone';
    }

    const usersCollection = await DatabaseService.getCollection('users');
    let formattedIdentifier: string = userIdentifier;
    let queryField: string;
    let otpSent = false;

    if (authType === 'phone') {
      // Phone authentication
      formattedIdentifier = formatPhoneNumber(userIdentifier);
      if (!isValidPhoneNumber(formattedIdentifier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      queryField = 'phone_number';
    } else if (authType === 'email') {
      // Email authentication
      formattedIdentifier = userIdentifier.trim().toLowerCase();
      if (!isValidEmail(formattedIdentifier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address format' },
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

    // Check if already registered and verified
    const verifiedField = authType === 'phone' ? 'phone_verified' : 'email_verified';
    const _existingUser = await usersCollection.findOne({
      [queryField]: formattedIdentifier,
      [verifiedField]: true,
    });

    // For existing users, still send OTP (they might be logging in)
    // We don't block OTP sending for existing users in unified flow

    // Get or create OTP tracking record
    const otpRecord = await usersCollection.findOne({
      [queryField]: formattedIdentifier,
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
            { [queryField]: formattedIdentifier },
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

    // Send OTP based on auth type
    if (authType === 'phone') {
      otpSent = await sendOTPSMS(formattedIdentifier, otp);
    } else if (authType === 'email') {
      otpSent = await sendOTPEmail(formattedIdentifier, otp);
    }

    if (!otpSent && !OTP_BYPASS_MODE) {
      return NextResponse.json(
        { success: false, error: `Failed to send OTP to ${authType}. Please try again.` },
        { status: 500 }
      );
    }

    // Update or create OTP record
    if (otpRecord) {
      // Update existing record
      const requestCount = (otpRecord.otp_request_count || 0) + 1;

      await usersCollection.updateOne(
        { [queryField]: formattedIdentifier },
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
      const tempRecord: Record<string, unknown> = {
        otp_code: otp,
        otp_expiry: expiry,
        otp_attempts: 0,
        otp_sent_at: now,
        otp_request_count: 1,
        otp_last_request_time: now,
        created_at: now,
        updated_at: now,
      };

      if (authType === 'phone') {
        tempRecord.phone_number = formattedIdentifier;
        tempRecord.phone_verified = false;
        // Placeholder email to avoid unique index conflict
        tempRecord.email_address = `${formattedIdentifier.replace(/\+/g, '')}@phone.trueastrotalk.com`;
      } else {
        tempRecord.email_address = formattedIdentifier;
        tempRecord.email_verified = false;
        // Placeholder phone to avoid unique index conflict
        tempRecord.phone_number = `+temp_${Date.now()}`;
      }

      await usersCollection.insertOne(tempRecord);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      otp_sent_to: formattedIdentifier,
      identifier: formattedIdentifier,
      auth_type: authType,
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
