import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { emailService } from '@/lib/email-service';
import { InputSanitizer } from '@/lib/security';
import {
  generateOTP,
  getOTPExpiry,
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

// Normalize Gmail addresses by removing dots before @ and handling + aliases
function normalizeGmailAddress(email: string): string {
  const lowerEmail = email.toLowerCase().trim();
  const [localPart, domain] = lowerEmail.split('@');

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const normalizedLocal = localPart.replace(/\./g, '').split('+')[0];
    return `${normalizedLocal}@${domain}`;
  }

  return lowerEmail;
}

// Build query to find user by email, accounting for Gmail aliases
function buildEmailQuery(email: string): object {
  const normalized = normalizeGmailAddress(email);
  const original = email.toLowerCase().trim();

  if (normalized !== original) {
    return {
      $or: [
        { email_address: original },
        { email_address: normalized },
        { email_aliases: original },
        { email_aliases: normalized }
      ]
    };
  }

  return { email_address: original };
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

    // New format: country_code + phone_number separately
    const countryCode = sanitizedBody.country_code as string | undefined;
    const phoneNumber = sanitizedBody.phone_number as string | undefined;

    // Legacy format support
    const identifier = sanitizedBody.identifier as string | undefined;
    const authType = sanitizedBody.auth_type as string | undefined;

    const usersCollection = await DatabaseService.getCollection('users');
    let otpSent = false;

    // Handle phone authentication (new clean format)
    if (countryCode && phoneNumber) {
      // Validate phone number is exactly 10 digits
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'Phone number must be exactly 10 digits' },
          { status: 400 }
        );
      }

      // Validate country code
      if (!countryCode.startsWith('+')) {
        return NextResponse.json(
          { success: false, error: 'Country code must start with +' },
          { status: 400 }
        );
      }

      console.log(`🔍 send-otp: Looking for user with country_code=${countryCode}, phone_number=${cleanPhone}`);

      // Query with exact match on both fields
      let user = await usersCollection.findOne({
        country_code: countryCode,
        phone_number: cleanPhone,
      });

      // Fallback: Check old format where phone includes country code
      if (!user) {
        const fullPhone = `${countryCode}${cleanPhone}`;
        console.log(`🔍 send-otp: Fallback - checking old format: ${fullPhone}`);
        user = await usersCollection.findOne({
          phone_number: { $in: [fullPhone, cleanPhone] }
        });
      }

      if (user) {
        console.log(`✅ User found: user_type=${user.user_type}, role=${user.role}`);

        // Block admin/manager users
        if (
          user.user_type === 'administrator' ||
          user.user_type === 'manager' ||
          user.role === 'admin' ||
          user.role === 'manager'
        ) {
          console.log(`🚫 Blocked: Admin/manager user cannot use mobile app`);
          return NextResponse.json({
            success: false,
            error: 'Only customers and astrologers allowed',
            error_code: 'ADMIN_NOT_ALLOWED',
          }, { status: 403 });
        }

        // Check rate limiting
        const requestCount = user.otp_request_count || 0;
        const lastRequestTime = user.otp_last_request_time;

        if (isRateLimited(lastRequestTime, requestCount)) {
          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);

          if (lastRequestTime && lastRequestTime < oneHourAgo) {
            await usersCollection.updateOne(
              { _id: user._id },
              { $set: { otp_request_count: 0, otp_last_request_time: null } }
            );
          } else {
            return NextResponse.json({
              success: false,
              error: `Too many OTP requests. Please try again after 1 hour.`,
            }, { status: 429 });
          }
        }

        // Generate and send OTP
        const otp = OTP_BYPASS_MODE ? '0000' : generateOTP();
        const expiry = getOTPExpiry();
        const now = new Date();

        console.log(`🔑 Generated OTP: ${OTP_BYPASS_MODE ? otp : '****'} (bypass: ${OTP_BYPASS_MODE})`);

        const fullPhoneForSMS = `${countryCode}${cleanPhone}`;
        otpSent = await sendOTPSMS(fullPhoneForSMS, otp);

        if (!otpSent && !OTP_BYPASS_MODE) {
          return NextResponse.json(
            { success: false, error: 'Failed to send OTP. Please try again.' },
            { status: 500 }
          );
        }

        // Update user record with OTP
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              otp_code: otp,
              otp_expiry: expiry,
              otp_attempts: 0,
              otp_sent_at: now,
              otp_request_count: (user.otp_request_count || 0) + 1,
              otp_last_request_time: now,
              updated_at: now,
              // Update to new format if using old format
              country_code: countryCode,
              phone_number: cleanPhone,
            },
          }
        );

        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully',
          is_new_user: false,
          country_code: countryCode,
          phone_number: cleanPhone,
          expiry_seconds: 300,
          testing_mode: OTP_BYPASS_MODE,
          ...(OTP_BYPASS_MODE && { test_otp_hint: 'Use 0000 for testing' }),
        });
      } else {
        // New user - create temporary record and send OTP
        console.log(`📝 New user - creating temporary record`);

        const otp = OTP_BYPASS_MODE ? '0000' : generateOTP();
        const expiry = getOTPExpiry();
        const now = new Date();

        console.log(`🔑 Generated OTP: ${OTP_BYPASS_MODE ? otp : '****'} (bypass: ${OTP_BYPASS_MODE})`);

        const fullPhoneForSMS = `${countryCode}${cleanPhone}`;
        otpSent = await sendOTPSMS(fullPhoneForSMS, otp);

        if (!otpSent && !OTP_BYPASS_MODE) {
          return NextResponse.json(
            { success: false, error: 'Failed to send OTP. Please try again.' },
            { status: 500 }
          );
        }

        // Create new user record
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const userId = `user_${timestamp}_${randomStr}`;

        await usersCollection.insertOne({
          user_id: userId,
          country_code: countryCode,
          phone_number: cleanPhone,
          phone_verified: false,
          user_type: 'customer',
          auth_type: 'phone',
          account_status: 'active',
          verification_status: 'verified', // Customers are auto-verified (phone OTP or Google)
          otp_code: otp,
          otp_expiry: expiry,
          otp_attempts: 0,
          otp_sent_at: now,
          otp_request_count: 1,
          otp_last_request_time: now,
          created_at: now,
          updated_at: now,
        });

        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully',
          is_new_user: true,
          country_code: countryCode,
          phone_number: cleanPhone,
          expiry_seconds: 300,
          testing_mode: OTP_BYPASS_MODE,
          ...(OTP_BYPASS_MODE && { test_otp_hint: 'Use 0000 for testing' }),
        });
      }
    }

    // Handle email authentication (legacy format)
    if (authType === 'email' && identifier) {
      const email = identifier.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address format' },
          { status: 400 }
        );
      }

      const emailQuery = buildEmailQuery(email);
      let user = await usersCollection.findOne(emailQuery);

      if (user) {
        // Block admin/manager users
        if (
          user.user_type === 'administrator' ||
          user.user_type === 'manager' ||
          user.role === 'admin' ||
          user.role === 'manager'
        ) {
          return NextResponse.json({
            success: false,
            error: 'Only customers and astrologers allowed',
            error_code: 'ADMIN_NOT_ALLOWED',
          }, { status: 403 });
        }

        // Check rate limiting
        const requestCount = user.otp_request_count || 0;
        const lastRequestTime = user.otp_last_request_time;

        if (isRateLimited(lastRequestTime, requestCount)) {
          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);

          if (lastRequestTime && lastRequestTime < oneHourAgo) {
            await usersCollection.updateOne(
              { _id: user._id },
              { $set: { otp_request_count: 0, otp_last_request_time: null } }
            );
          } else {
            return NextResponse.json({
              success: false,
              error: `Too many OTP requests. Please try again after 1 hour.`,
            }, { status: 429 });
          }
        }

        // Generate and send OTP
        const otp = generateOTP();
        const expiry = getOTPExpiry();
        const now = new Date();

        otpSent = await sendOTPEmail(email, otp);

        if (!otpSent && !OTP_BYPASS_MODE) {
          return NextResponse.json(
            { success: false, error: 'Failed to send OTP. Please try again.' },
            { status: 500 }
          );
        }

        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              otp_code: otp,
              otp_expiry: expiry,
              otp_attempts: 0,
              otp_sent_at: now,
              otp_request_count: (user.otp_request_count || 0) + 1,
              otp_last_request_time: now,
              updated_at: now,
            },
          }
        );

        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully',
          is_new_user: false,
          identifier: email,
          auth_type: 'email',
          expiry_seconds: 300,
          testing_mode: OTP_BYPASS_MODE,
        });
      } else {
        // New user
        const otp = generateOTP();
        const expiry = getOTPExpiry();
        const now = new Date();

        otpSent = await sendOTPEmail(email, otp);

        if (!otpSent && !OTP_BYPASS_MODE) {
          return NextResponse.json(
            { success: false, error: 'Failed to send OTP. Please try again.' },
            { status: 500 }
          );
        }

        await usersCollection.insertOne({
          email_address: email,
          email_verified: false,
          otp_code: otp,
          otp_expiry: expiry,
          otp_attempts: 0,
          otp_sent_at: now,
          otp_request_count: 1,
          otp_last_request_time: now,
          created_at: now,
          updated_at: now,
          phone_number: `+temp_${Date.now()}`,
        });

        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully',
          is_new_user: true,
          identifier: email,
          auth_type: 'email',
          expiry_seconds: 300,
          testing_mode: OTP_BYPASS_MODE,
        });
      }
    }

    // No valid input provided
    return NextResponse.json(
      { success: false, error: 'Please provide country_code and phone_number, or identifier with auth_type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
