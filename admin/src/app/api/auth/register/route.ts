import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
import { 
  PasswordSecurity, 
  JWTSecurity, 
  ValidationSchemas, 
  InputSanitizer
} from '../../../../lib/security';
import { generateUserId } from '../../../../lib/custom-id';

/**
 * Validate Google ID Token for registration
 */
async function validateGoogleRegistration(googleToken: string): Promise<{ email: string; name: string; picture?: string } | null> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return null;
    
    const tokenInfo = await response.json();
    
    if (!tokenInfo.email || !tokenInfo.email_verified) return null;
    
    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (tokenInfo.exp && tokenInfo.exp < now) return null;
    
    return {
      email: tokenInfo.email.toLowerCase(),
      name: tokenInfo.name || tokenInfo.email.split('@')[0],
      picture: tokenInfo.picture
    };
  } catch (error) {
    console.error('Google token validation error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`📝 Registration attempt from IP: ${ip}`);

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { 
      full_name, 
      email_address, 
      password, 
      phone_number, 
      user_type,
      auth_type = 'email',
      google_id_token,
      date_of_birth,
      gender,
      // Astrologer-specific fields
      experience_years,
      bio,
      languages,
      qualifications,
      skills,
      address,
      city,
      state,
      country = 'India',
      zip,
      call_rate,
      chat_rate,
      video_rate,
      // Customer-specific fields
      birth_time,
      birth_place
    } = sanitizedBody;

    // Validate required fields
    if (!full_name || !email_address || !user_type) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Full name, email, and user type are required'
      }, { status: 400 });
    }

    // Validate user type
    if (!['customer', 'astrologer'].includes(user_type as string)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_USER_TYPE',
        message: 'User type must be either customer or astrologer'
      }, { status: 400 });
    }

    // Sanitize and validate email
    const cleanEmail = InputSanitizer.sanitizeEmail(email_address as string);
    const emailValidation = ValidationSchemas.userRegistration.validate({
      name: full_name,
      email: cleanEmail,
      phone: phone_number || '+1234567890', // Dummy for validation
      password: password || 'dummy123',
      user_type: user_type
    });

    if (emailValidation.error) {
      const errorMessage = emailValidation.error.details
        .map(detail => detail.message)
        .join(', ');
      
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: errorMessage
      }, { status: 400 });
    }

    // Validate auth type
    if (!['email', 'google'].includes(auth_type as string)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_AUTH_TYPE',
        message: 'Authentication type must be email or google'
      }, { status: 400 });
    }

    // For email registration, password is required
    if (auth_type === 'email' && !password) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_PASSWORD',
        message: 'Password is required for email registration'
      }, { status: 400 });
    }

    // For Google registration, token is required
    if (auth_type === 'google' && !google_id_token) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_GOOGLE_TOKEN',
        message: 'Google ID token is required for Google registration'
      }, { status: 400 });
    }

    // Validate password strength for email registration
    if (auth_type === 'email' && password) {
      const passwordValidation = PasswordSecurity.validatePasswordStrength(password as string);
      if (!passwordValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: 'WEAK_PASSWORD',
          message: 'Password does not meet security requirements',
          details: passwordValidation.issues
        }, { status: 400 });
      }
    }

    // Validate Google token if provided
    let googleUserInfo = null;
    if (auth_type === 'google' && google_id_token) {
      console.log(`🔍 Validating Google ID token for registration...`);
      googleUserInfo = await validateGoogleRegistration(google_id_token as string);
      
      if (!googleUserInfo) {
        console.log(`❌ Google token validation failed`);
        return NextResponse.json({
          success: false,
          error: 'INVALID_GOOGLE_TOKEN',
          message: 'Invalid or expired Google token'
        }, { status: 400 });
      }
      
      console.log(`✅ Google token validated successfully`);
      console.log(`👤 Google user info:`, { email: googleUserInfo.email, name: googleUserInfo.name, hasPicture: !!googleUserInfo.picture });

      // Verify email matches Google token
      if (googleUserInfo.email !== cleanEmail) {
        return NextResponse.json({
          success: false,
          error: 'EMAIL_MISMATCH',
          message: 'Email does not match Google token'
        }, { status: 400 });
      }
    }

    // Validate phone number format if provided
    if (phone_number) {
      const cleanPhone = InputSanitizer.sanitizePhoneNumber(phone_number as string);
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please provide a valid phone number'
        }, { status: 400 });
      }
    }

    // Validate astrologer-specific fields
    if (user_type === 'astrologer') {
      if (!experience_years || !bio || !languages) {
        return NextResponse.json({
          success: false,
          error: 'MISSING_ASTROLOGER_INFO',
          message: 'Experience, bio, and languages are required for astrologers'
        }, { status: 400 });
      }

      if (Number(experience_years) < 1 || Number(experience_years) > 50) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_EXPERIENCE',
          message: 'Experience must be between 1 and 50 years'
        }, { status: 400 });
      }

      // Validate consultation rates
      if (call_rate && (Number(call_rate) < 10 || Number(call_rate) > 10000)) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_CALL_RATE',
          message: 'Call rate must be between ₹10 and ₹10,000 per minute'
        }, { status: 400 });
      }
    }

    // Connect to database
    console.log(`🔗 Connecting to database...`);
    const usersCollection = await DatabaseService.getCollection('users');
    console.log(`📊 Connected to collection: users`);

    // Check if user already exists
    console.log(`🔍 Checking for existing user with email: ${cleanEmail}`);
    const existingUser = await usersCollection.findOne({
      email_address: cleanEmail
    });
    console.log(`🔍 Existing user found:`, existingUser ? 'YES' : 'NO');
    if (existingUser) {
      console.log(`🔍 Existing user details:`, { id: existingUser._id, email: existingUser.email_address, user_type: existingUser.user_type });
    }

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'USER_EXISTS',
        message: 'An account with this email already exists'
      }, { status: 409 });
    }

    // Check if phone number is already registered (if provided)
    if (phone_number) {
      const existingPhone = await usersCollection.findOne({
        phone_number: InputSanitizer.sanitizePhoneNumber(phone_number as string)
      });

      if (existingPhone) {
        return NextResponse.json({
          success: false,
          error: 'PHONE_EXISTS',
          message: 'An account with this phone number already exists'
        }, { status: 409 });
      }
    }

    // Hash password if email registration
    let hashedPassword = null;
    if (auth_type === 'email' && password) {
      hashedPassword = await PasswordSecurity.hashPassword(password as string);
    }

    // Prepare user document
    const now = new Date();
    const userData: Record<string, unknown> = {
      _id: new ObjectId(),
      user_id: generateUserId(),
      full_name: (full_name as string).trim(),
      email_address: cleanEmail,
      phone_number: phone_number ? InputSanitizer.sanitizePhoneNumber(phone_number as string) : '',
      user_type,
      auth_type,
      account_status: user_type === 'astrologer' ? 'pending_verification' : 'active',
      verification_status: 'unverified',
      is_online: false,
      wallet_balance: 0,
      created_at: now,
      updated_at: now,
      registration_ip: ip,
      email_verified: auth_type === 'google' ? true : false,
      phone_verified: false,
      failed_login_attempts: 0,
      login_count: 0
    };

    // Add password for email registration
    if (hashedPassword) {
      userData.password = hashedPassword;
    }

    // Add Google-specific data
    if (auth_type === 'google' && googleUserInfo) {
      userData.google_id = googleUserInfo.email;
      userData.profile_image = googleUserInfo.picture || '';
      userData.email_verified = true;
      console.log(`📸 Setting profile_image for Google user: ${userData.profile_image}`);
    }

    // Add personal information
    if (date_of_birth) userData.date_of_birth = date_of_birth;
    if (gender) userData.gender = gender;
    if (address) userData.address = (address as string).trim();
    if (city) userData.city = (city as string).trim();
    if (state) userData.state = (state as string).trim();
    if (country) userData.country = (country as string).trim();
    if (zip) userData.zip = (zip as string).trim();

    // Add customer-specific fields
    if (user_type === 'customer') {
      if (birth_time) userData.birth_time = birth_time;
      if (birth_place) userData.birth_place = (birth_place as string).trim();
    }

    // Add astrologer-specific fields
    if (user_type === 'astrologer') {
      userData.experience_years = parseInt(experience_years as string);
      userData.bio = (bio as string).trim();
      userData.languages = (languages as string).trim();
      userData.skills = skills ? (skills as string).trim() : '';
      userData.qualifications = qualifications || [];
      userData.call_rate = call_rate ? parseFloat(call_rate as string) : 50;
      userData.chat_rate = chat_rate ? parseFloat(chat_rate as string) : 30;
      userData.video_rate = video_rate ? parseFloat(video_rate as string) : 80;
      // Note: Removed availability system - astrologers are available when online
      userData.rating = 0;
      userData.total_reviews = 0;
      userData.total_consultations = 0;
      userData.total_earnings = 0;
      userData.verification_documents = [];
      userData.approval_status = 'pending';
    }

    // Insert user into database
    const result = await usersCollection.insertOne(userData);

    if (!result.insertedId) {
      return NextResponse.json({
        success: false,
        error: 'REGISTRATION_FAILED',
        message: 'Failed to create account. Please try again.'
      }, { status: 500 });
    }

    console.log(`✅ User registered successfully: ${cleanEmail} (${user_type})`);

    // Generate JWT tokens for immediate login
    const tokenPayload = {
      userId: result.insertedId.toString(),
      email: cleanEmail,
      full_name: userData.full_name,
      user_type: userData.user_type,
      account_status: userData.account_status,
      session_id: crypto.randomUUID()
    };

    const accessToken = JWTSecurity.generateAccessToken(tokenPayload);
    const refreshToken = JWTSecurity.generateRefreshToken({
      userId: result.insertedId.toString(),
      session_id: tokenPayload.session_id
    });

    // Send welcome email (implement later)
    // await sendWelcomeEmail(cleanEmail, userData.full_name, user_type);

    // Prepare response
    const responseUser = {
      id: result.insertedId.toString(),
      full_name: userData.full_name,
      email_address: userData.email_address,
      phone_number: userData.phone_number,
      user_type: userData.user_type,
      account_status: userData.account_status,
      verification_status: userData.verification_status,
      auth_type: userData.auth_type,
      profile_image: userData.profile_image || '',
      wallet_balance: userData.wallet_balance,
      is_online: false,
      email_verified: userData.email_verified,
      phone_verified: userData.phone_verified,
      created_at: userData.created_at
    };

    // Add type-specific data to response
    if (user_type === 'astrologer') {
      Object.assign(responseUser, {
        experience_years: userData.experience_years,
        bio: userData.bio,
        languages: userData.languages,
        skills: userData.skills,
        call_rate: userData.call_rate,
        chat_rate: userData.chat_rate,
        video_rate: userData.video_rate,
        is_available: userData.is_available,
        rating: userData.rating,
        approval_status: userData.approval_status
      });
    }

    return NextResponse.json({
      success: true,
      message: `${user_type === 'astrologer' ? 'Astrologer' : 'Customer'} account created successfully`,
      data: {
        user: responseUser,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600, // 1 hour
        next_steps: user_type === 'astrologer' 
          ? ['Complete profile verification', 'Upload required documents', 'Wait for admin approval']
          : ['Verify your email address', 'Complete your profile', 'Start exploring astrologers']
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Registration failed due to server error. Please try again.'
    }, { status: 500 });
  }
}