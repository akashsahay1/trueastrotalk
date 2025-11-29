import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import {
  verifyOTP,
  formatPhoneNumber,
  isValidPhoneNumber,
  MAX_OTP_ATTEMPTS,
  OTP_BYPASS_MODE,
} from '@/lib/otp';
import { JWTSecurity, InputSanitizer } from '@/lib/security';

// Helper function to resolve media ID to full URL
async function resolveMediaUrl(mediaId: string | null | undefined, request: NextRequest): Promise<string | null> {
  if (!mediaId || !mediaId.startsWith('media_')) {
    return mediaId || null;
  }

  try {
    const mediaCollection = await DatabaseService.getCollection('media');
    const mediaFile = await mediaCollection.findOne({ media_id: mediaId });

    if (!mediaFile || !mediaFile.file_path) {
      return null;
    }

    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    return `${protocol}://${host}${mediaFile.file_path}`;
  } catch (error) {
    console.error(`Error resolving media ID ${mediaId}:`, error);
    return null;
  }
}

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

// Normalize Gmail addresses by removing dots before @ and handling + aliases
// Gmail ignores dots in the local part, so user.name@gmail.com = username@gmail.com
function normalizeGmailAddress(email: string): string {
  const lowerEmail = email.toLowerCase().trim();
  const [localPart, domain] = lowerEmail.split('@');

  // Only normalize for Gmail addresses
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove dots from local part and strip anything after +
    const normalizedLocal = localPart.replace(/\./g, '').split('+')[0];
    return `${normalizedLocal}@${domain}`;
  }

  return lowerEmail;
}

// Build query to find user by email, accounting for Gmail aliases
function buildEmailQuery(email: string): object {
  const normalized = normalizeGmailAddress(email);
  const original = email.toLowerCase().trim();

  // If it's a Gmail address, search for both normalized and original versions
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    const identifier = sanitizedBody.identifier as string | undefined;
    const otp = sanitizedBody.otp as string | undefined;
    const auth_type = sanitizedBody.auth_type as string | undefined;
    const phone_number = sanitizedBody.phone_number as string | undefined;

    // Support both new (identifier) and legacy (phone_number) parameter names
    const userIdentifier: string | undefined = identifier || phone_number;
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

    // Find OTP record - use Gmail-aware query for email auth
    let otpRecordQuery: object;
    if (authType === 'email') {
      otpRecordQuery = buildEmailQuery(formattedIdentifier);
    } else {
      otpRecordQuery = { [queryField]: formattedIdentifier };
    }
    const otpRecord = await usersCollection.findOne(otpRecordQuery);

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

    // Increment attempt count - use _id for Gmail alias safety
    await usersCollection.updateOne(
      { _id: otpRecord._id },
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
      (otpRecord.user_type || otpRecord.role) &&
      (otpRecord.email_verified || otpRecord.phone_verified)
    );

    // Update verification status - use _id for Gmail alias safety
    const verificationField = authType === 'email' ? 'email_verified' : 'phone_verified';
    await usersCollection.updateOne(
      { _id: otpRecord._id },
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
      // Fetch updated user record - use _id for consistent lookup
      const user = await usersCollection.findOne({
        _id: otpRecord._id,
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found after verification' },
          { status: 500 }
        );
      }

      // Debug: Log user data from database
      console.log('🔍 verify-otp - User from database:');
      console.log('   email:', user.email_address);
      console.log('   user_type:', user.user_type);
      console.log('   role:', user.role);
      console.log('   full_name:', user.full_name);
      console.log('   verification_status:', user.verification_status);
      console.log('   account_status:', user.account_status);

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

      // Resolve media IDs to full URLs
      const profileImageUrl = await resolveMediaUrl(user.profile_image_id as string, request);
      const panCardUrl = await resolveMediaUrl(user.pan_card_id as string, request);

      // Prepare comprehensive user response with all fields
      const userResponse = {
        id: user.user_id || user._id.toString(),
        user_id: user.user_id,
        full_name: user.full_name,
        email_address: user.email_address,
        phone_number: user.phone_number,
        user_type: user.user_type || user.role,
        auth_type: user.auth_type,
        account_status: user.account_status,
        verification_status: user.verification_status,
        phone_verified: user.phone_verified,
        email_verified: user.email_verified,
        is_online: user.is_online,
        wallet_balance: user.wallet_balance || 0,
        created_at: user.created_at,
        updated_at: user.updated_at,
        verified_at: user.verified_at,
        verified_by: user.verified_by,
        rejection_reason: user.rejection_reason,

        // Birth/personal details
        date_of_birth: user.date_of_birth,
        time_of_birth: user.time_of_birth || user.birth_time,
        place_of_birth: user.place_of_birth || user.birth_place,
        gender: user.gender,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        zip: user.zip,

        // Astrologer-specific fields
        bio: user.bio,
        profile_picture: profileImageUrl,
        profile_image_id: user.profile_image_id,
        profile_image_url: profileImageUrl,
        experience_years: user.experience_years,
        languages: user.languages,
        skills: user.skills,
        qualifications: user.qualifications,
        certifications: user.certifications,

        // Consultation rates
        chat_rate: user.chat_rate,
        call_rate: user.call_rate,
        video_rate: user.video_rate,

        // Professional details
        education: user.education,
        experience: user.experience,

        // Payment details
        upi_id: user.upi_id,
        total_earnings: user.total_earnings,
        pending_payouts: user.pending_payouts,
        last_payout_at: user.last_payout_at,

        // Bank details
        account_holder_name: user.bank_details?.account_holder_name,
        account_number: user.bank_details?.account_number,
        bank_name: user.bank_details?.bank_name,
        ifsc_code: user.bank_details?.ifsc_code,
        pan_card_url: panCardUrl,
        pan_card_id: user.pan_card_id,

        // Rating and reviews
        rating: user.rating,
        total_reviews: user.total_reviews,
        total_consultations: user.total_consultations,
      };

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully - Login complete',
        user_exists: true,
        requires_signup: false,
        user: userResponse,
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
