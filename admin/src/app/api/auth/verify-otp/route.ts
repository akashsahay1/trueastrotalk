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
    // IMPORTANT: For phone auth, prioritize customer/astrologer over administrator
    let otpRecordQuery: object;
    if (authType === 'email') {
      otpRecordQuery = buildEmailQuery(formattedIdentifier);
    } else {
      otpRecordQuery = { [queryField]: formattedIdentifier };
    }

    let otpRecord = null;
    if (authType === 'phone') {
      // First try to find customer or astrologer
      otpRecord = await usersCollection.findOne({
        ...otpRecordQuery,
        user_type: { $in: ['customer', 'astrologer'] }
      });

      // If not found, try any user with this phone
      if (!otpRecord) {
        otpRecord = await usersCollection.findOne(otpRecordQuery);
      }
    } else {
      otpRecord = await usersCollection.findOne(otpRecordQuery);
    }

    // If no exact match for phone, try all variations
    if (!otpRecord && authType === 'phone') {
      console.log(`🔍 verify-otp: No exact match, trying phone variations...`);
      const digitsOnly = formattedIdentifier.replace(/\D/g, '');
      const phoneVariations = [formattedIdentifier];

      if (digitsOnly.length === 10) {
        phoneVariations.push(`+91${digitsOnly}`, `91${digitsOnly}`, digitsOnly);
      } else if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
        phoneVariations.push(`+${digitsOnly}`, digitsOnly, digitsOnly.substring(2));
      }

      console.log(`   - Trying variations: ${phoneVariations.join(', ')}`);

      // Prioritize customer/astrologer accounts
      otpRecord = await usersCollection.findOne({
        phone_number: { $in: phoneVariations },
        user_type: { $in: ['customer', 'astrologer'] }
      });

      // If still not found, try any user type
      if (!otpRecord) {
        otpRecord = await usersCollection.findOne({
          phone_number: { $in: phoneVariations }
        });
      }

      console.log(`   - Result: ${otpRecord ? 'FOUND' : 'NOT FOUND'}`);
    }

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

    // SPECIAL CASE: If using bypass OTP (0000), check if a real user exists
    // This handles cases where send-otp created a temp record but a real user exists
    if (OTP_BYPASS_MODE && otp === '0000') {
      console.log('🔓 Bypass mode: Checking for existing fully registered user');

      try {
        let realUserQuery: object;
        if (authType === 'email') {
          const emailQuery = buildEmailQuery(formattedIdentifier);
          realUserQuery = {
            ...emailQuery,
            full_name: { $exists: true, $ne: null }
          };
        } else {
          realUserQuery = {
            phone_number: formattedIdentifier,
            full_name: { $exists: true, $ne: null }
          };
        }

        // For phone auth, prioritize customer/astrologer
        let realUser = null;
        if (authType === 'phone') {
          realUser = await usersCollection.findOne({
            ...realUserQuery,
            user_type: { $in: ['customer', 'astrologer'] }
          });

          if (!realUser) {
            realUser = await usersCollection.findOne(realUserQuery);
          }
        } else {
          realUser = await usersCollection.findOne(realUserQuery);
        }

        if (realUser) {
          console.log('✅ Found existing registered user, using that instead of temp record');
          console.log(`   - user_type: ${realUser.user_type}`);
          // Replace otpRecord with the real user for processing below
          otpRecord = realUser;
        }
      } catch (bypassError) {
        console.error('⚠️ Error in bypass mode user lookup:', bypassError);
        // Continue with original otpRecord if lookup fails
      }
    }

    // OTP verified successfully!
    // For LOGIN: If user exists with phone/email, let them login (even if profile incomplete)
    // For SIGNUP: Only new records without existing data should go to signup
    const hasIdentifier = authType === 'phone'
      ? !!(otpRecord.phone_number)
      : !!(otpRecord.email_address);

    const hasBasicProfile = !!(
      otpRecord.full_name &&
      (otpRecord.user_type || otpRecord.role)
    );

    // Check if this is an existing user (has been registered before)
    const hasUserId = !!(otpRecord.user_id);

    // User is ONLY fully registered if they have:
    // 1. Full name (mandatory)
    // 2. User type or role (mandatory)
    // 3. The identifier (phone/email)
    const isFullyRegistered = hasIdentifier && hasBasicProfile;

    console.log(`🔍 verify-otp: Checking registration status for ${authType}`);
    console.log(`   - hasIdentifier: ${hasIdentifier}`);
    console.log(`   - hasUserId: ${hasUserId}`);
    console.log(`   - hasBasicProfile: ${hasBasicProfile}`);
    console.log(`   - full_name: ${otpRecord.full_name || 'MISSING'}`);
    console.log(`   - user_type: ${otpRecord.user_type || 'MISSING'}`);
    console.log(`   - role: ${otpRecord.role || 'MISSING'}`);
    console.log(`   - isFullyRegistered: ${isFullyRegistered}`);

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
      let user = await usersCollection.findOne({
        _id: otpRecord._id,
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found after verification' },
          { status: 500 }
        );
      }

      // Ensure user has user_id (required for JWT token generation)
      if (!user.user_id) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const userId = `user_${timestamp}_${randomStr}`;

        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              user_id: userId,
              updated_at: new Date()
            }
          }
        );

        // Fetch updated user
        user = await usersCollection.findOne({ _id: user._id });
        console.log(`✅ Created user_id: ${userId}`);
      }

      // Ensure user exists
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found after verification' },
          { status: 404 }
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

      // Default to 'customer' if no role is set (for incomplete profiles)
      const userType = user.user_type || user.role || 'customer';

      // Generate JWT tokens with proper fallbacks
      const tokenPayload = {
        userId: user.user_id || user._id.toString(),
        email: user.email_address || user.phone_number || `user_${user.user_id}@temp.com`,
        full_name: user.full_name || 'User',
        user_type: userType,
        account_status: user.account_status || 'active',
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
        full_name: user.full_name || 'User', // Fallback name if missing
        email_address: user.email_address,
        phone_number: user.phone_number,
        user_type: userType,
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
