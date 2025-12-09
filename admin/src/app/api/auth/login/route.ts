import { NextRequest, NextResponse } from 'next/server';
// import rateLimit from 'express-rate-limit';
import DatabaseService from '../../../../lib/database';
import {
  PasswordSecurity,
  JWTSecurity,
  ValidationSchemas,
  InputSanitizer,
  // SecurityMiddleware,
  // RateLimitConfig
} from '../../../../lib/security';
import { ErrorHandler, ErrorCode, AppError } from '../../../../lib/error-handler';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/otp';

// Rate limiting for login attempts
// const loginLimiter = rateLimit({
//   ...RateLimitConfig.auth,
//   keyGenerator: (req) => {
//     // Rate limit by IP and email combination
//     const forwarded = req.headers['x-forwarded-for'] as string;
//     const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
//     return `${ip}-login`;
//   }
// });

/**
 * Validate Google ID Token (Enhanced security)
 */
async function validateGoogleToken(idToken: string): Promise<{ email: string; name: string; picture?: string } | null> {
  try {
    // Verify the token with Google's tokeninfo endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      console.error('Google token validation failed:', response.status, response.statusText);
      return null;
    }
    
    const tokenInfo = await response.json();
    
    // Verify token fields
    if (!tokenInfo.email || !tokenInfo.email_verified) {
      console.error('Google token missing verified email');
      return null;
    }

    // Optional: Verify audience (add your Google Client ID)
    const expectedAudience = process.env.GOOGLE_CLIENT_ID;
    if (expectedAudience && tokenInfo.aud !== expectedAudience) {
      console.error('Google token audience mismatch');
      return null;
    }
    
    // Verify token is still valid (not expired)
    const now = Math.floor(Date.now() / 1000);
    if (tokenInfo.exp && tokenInfo.exp < now) {
      console.error('Google token expired');
      return null;
    }
    
    return {
      email: tokenInfo.email.toLowerCase(),
      name: tokenInfo.name || tokenInfo.email.split('@')[0],
      picture: tokenInfo.picture
    };
    
  } catch (error) {
    console.error('Error validating Google token:', error);
    return null;
  }
}

async function handleLogin(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting (in production, use proper middleware)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Parse and validate request body
  const body = await request.json();

  // Sanitize input to prevent XSS and injection attacks
  const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);

  const {
    email_address,
    identifier,
    password,
    auth_type,
    google_access_token,
    google_photo_url,
    google_display_name,
    device_info
  } = sanitizedBody;

  // Support both identifier (new) and email_address (legacy)
  const userIdentifier = identifier || email_address;
  let detectedAuthType = auth_type;

  // Validate required fields
  if (!userIdentifier) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_IDENTIFIER',
      message: 'Email or phone number is required'
    }, { status: 400 });
  }

  // Auto-detect auth type if not provided
  if (!detectedAuthType) {
    detectedAuthType = (userIdentifier as string).includes('@') ? 'email' : 'phone';
  }

  // Validate auth type
  if (!['email', 'google', 'phone'].includes(detectedAuthType as string)) {
    return NextResponse.json({
      success: false,
      error: 'INVALID_AUTH_TYPE',
      message: 'Invalid authentication type'
    }, { status: 400 });
  }

  // Format and validate identifier based on type
  let formattedIdentifier: string;
  let queryField: string;

  if (detectedAuthType === 'phone') {
    formattedIdentifier = formatPhoneNumber(userIdentifier as string);
    if (!isValidPhoneNumber(formattedIdentifier)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PHONE',
        message: 'Please provide a valid phone number'
      }, { status: 400 });
    }
    queryField = 'phone_number';
  } else {
    // email or google
    formattedIdentifier = InputSanitizer.sanitizeEmail(userIdentifier as string);

    // Validate email format
    const emailValidation = ValidationSchemas.userLogin.validate({
      email: formattedIdentifier,
      password: password || 'dummy' // Dummy password for validation
    });

    if (emailValidation.error && emailValidation.error.details.some(d => d.path.includes('email'))) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Please provide a valid email address'
      }, { status: 400 });
    }
    queryField = 'email_address';
  }

  // For email auth, password is required
  if (detectedAuthType === 'email' && !password) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_PASSWORD',
      message: 'Password is required for email authentication'
    }, { status: 400 });
  }

  // For Google auth, token is required
  if (detectedAuthType === 'google' && !google_access_token) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_GOOGLE_TOKEN',
      message: 'Google access token is required'
    }, { status: 400 });
  }

  // For phone auth, password is required (unless using OTP which is handled separately)
  if (detectedAuthType === 'phone' && !password) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_PASSWORD',
      message: 'Password is required for phone authentication. Use OTP verification for passwordless login.'
    }, { status: 400 });
  }

  // Connect to database
  const usersCollection = await DatabaseService.getCollection('users');

  // Build secure query with proper sanitization
  const userQuery: Record<string, unknown> = {
    [queryField]: formattedIdentifier,
    account_status: { $ne: 'banned' }
  };

  // Find user with proper error handling
  let user;
  try {
    user = await usersCollection.findOne(userQuery);
  } catch (dbError) {
    console.error('Database query error:', dbError);
    throw ErrorHandler.databaseError('Failed to query user information');
  }

    // Handle Google authentication for non-existing users
    if (!user && detectedAuthType === 'google') {

      const googleUserInfo = await validateGoogleToken(google_access_token as string);

      if (!googleUserInfo) {
        throw ErrorHandler.createError(
          ErrorCode.INVALID_CREDENTIALS,
          'Invalid Google token',
          'Invalid or expired Google authentication token'
        );
      }

      // Verify email matches
      if (googleUserInfo.email !== formattedIdentifier) {
        throw ErrorHandler.createError(
          ErrorCode.INVALID_CREDENTIALS,
          'Email mismatch',
          'Google token email does not match provided email'
        );
      }

      // Valid Google user but not registered
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_REGISTERED',
        message: 'Please complete your registration to continue',
        google_user_info: {
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          picture: googleUserInfo.picture
        }
      }, { status: 404 });
    }

  // User not found
  if (!user) {

    // Generic error message to prevent user enumeration
    throw ErrorHandler.createError(
      ErrorCode.INVALID_CREDENTIALS,
      'User not found',
      detectedAuthType === 'phone'
        ? 'Invalid phone number or password'
        : 'Invalid email or password'
    );
  }

  // Check account status
  if (user.account_status === 'banned') {
    throw ErrorHandler.createError(
      ErrorCode.ACCOUNT_LOCKED,
      'Account banned',
      'Your account has been suspended. Please contact support.'
    );
  }

  if (user.account_status === 'inactive') {
    throw ErrorHandler.createError(
      ErrorCode.ACCESS_DENIED,
      'Account inactive',
      'Please verify your account to continue'
    );
  }

    // Authenticate based on auth type
    if (detectedAuthType === 'google') {
      // Validate Google token for existing user
      const googleUserInfo = await validateGoogleToken(google_access_token as string);

      if (!googleUserInfo || googleUserInfo.email !== formattedIdentifier) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_GOOGLE_TOKEN',
          message: 'Invalid Google authentication'
        }, { status: 401 });
      }


    } else if (detectedAuthType === 'email' || detectedAuthType === 'phone') {
      // Verify password using bcrypt
      if (!user.password) {
        return NextResponse.json({
          success: false,
          error: 'NO_PASSWORD_SET',
          message: detectedAuthType === 'phone'
            ? 'Please use OTP verification for phone login or set a password'
            : 'Please set a password or use Google sign-in'
        }, { status: 401 });
      }

      try {
        const isPasswordValid = await PasswordSecurity.verifyPassword(password as string, user.password as string);

        if (!isPasswordValid) {

          // Log failed login attempt
          await usersCollection.updateOne(
            { _id: user._id },
            [
              {
                $set: {
                  failed_login_attempts: {
                    $add: [
                      { $ifNull: ["$failed_login_attempts", 0] },
                      1
                    ]
                  },
                  last_failed_login: new Date()
                }
              }
            ]
          );

          return NextResponse.json({
            success: false,
            error: 'INVALID_CREDENTIALS',
            message: detectedAuthType === 'phone'
              ? 'Invalid phone number or password'
              : 'Invalid email or password'
          }, { status: 401 });
        }
      } catch (passwordError) {
        console.error('Password verification error:', passwordError);
        return NextResponse.json({
          success: false,
          error: 'AUTHENTICATION_ERROR',
          message: 'Unable to verify credentials'
        }, { status: 500 });
      }

    }

    // Check for too many failed login attempts
    if (Number(user.failed_login_attempts) >= 5) {
      const lastFailed = user.last_failed_login;
      const lockoutTime = 30 * 60 * 1000; // 30 minutes
      
      if (lastFailed && (new Date().getTime() - new Date(lastFailed as string | number | Date).getTime()) < lockoutTime) {
        return NextResponse.json({
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: 'Account temporarily locked due to too many failed attempts'
        }, { status: 423 });
      }
    }

    // Generate secure JWT tokens
    if (!user.user_id) {
      console.error(`❌ User ${user.email_address} has no user_id field`);
      return NextResponse.json({
        success: false,
        error: 'ACCOUNT_SETUP_REQUIRED',
        message: 'Please complete account setup by re-registering'
      }, { status: 400 });
    }

    const tokenPayload = {
      userId: user.user_id,
      email: user.email_address,
      full_name: user.full_name,
      user_type: user.user_type,
      account_status: user.account_status,
      session_id: crypto.randomUUID() // Add session tracking
    };

    const accessToken = JWTSecurity.generateAccessToken(tokenPayload);
    const refreshToken = JWTSecurity.generateRefreshToken({ 
      userId: user.user_id,
      session_id: tokenPayload.session_id 
    });

    // Update user login information
    const updateData: Record<string, unknown> = {
      is_online: true,
      last_login: new Date(),
      updated_at: new Date(),
      failed_login_attempts: 0, // Reset failed attempts
      last_failed_login: null,
      login_count: (Number(user.login_count) || 0) + 1
    };

    // Update Google profile data if applicable
    if (detectedAuthType === 'google') {
      if (google_photo_url) {
        updateData.profile_image = google_photo_url;
      }
      if (google_display_name) {
        updateData.full_name = google_display_name;
      }
      updateData.auth_type = 'google';
      updateData.google_access_token = google_access_token;
    }

    // Store device info for security tracking
    if (device_info) {
      updateData.last_device_info = {
        ...device_info,
        ip_address: ip,
        login_time: new Date()
      };
    }

    try {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: updateData }
      );
    } catch (updateError) {
      console.error('Failed to update user login info:', updateError);
      // Continue with login even if update fails
    }


    // Prepare response based on user type
    if (user.user_type === 'administrator') {
      // Admin response with secure cookie
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.user_id,
          full_name: user.full_name,
          email: user.email_address,
          user_type: user.user_type,
          last_login: new Date()
        }
      });

      // Set secure HTTP-only cookie
      response.cookies.set('auth-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        path: '/'
      });

      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
        path: '/'
      });

      return response;

    } else {
      // Mobile response with tokens in body
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.user_id,
            full_name: user.full_name,
            email_address: user.email_address,
            phone_number: user.phone_number || '',
            user_type: user.user_type,
            account_status: user.account_status,
            verification_status: user.verification_status || 'unverified',
            auth_type: user.auth_type || 'email',
            profile_image: user.profile_image || '',
            wallet_balance: user.wallet_balance || 0,
            is_online: true,
            gender: user.gender || '',
            date_of_birth: user.date_of_birth || '',
            birth_time: user.birth_time || '',
            birth_place: user.birth_place || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            country: user.country || 'India',
            zip: user.zip || '',
            bio: user.bio || '',
            experience_years: user.experience_years || '',
            languages: user.languages || '',
            qualifications: user.qualifications || [],
            skills: user.skills || '',
            call_rate: user.call_rate || 0,
            chat_rate: user.chat_rate || 0,
            video_rate: user.video_rate || 0,
            created_at: user.created_at,
            updated_at: new Date(),
            last_login: new Date()
          },
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 7776000 // 90 days in seconds
        }
      });
    }
}

// Export the login function with proper error handling
export async function POST(request: NextRequest) {
  try {
    return await handleLogin(request);
  } catch (error) {
    console.error('Login error:', error);

    // Handle AppError from ErrorHandler.createError()
    if (error instanceof AppError) {
      return NextResponse.json({
        success: false,
        error: error.code,
        message: error.userMessage || error.message
      }, { status: error.statusCode });
    }

    // Handle generic errors
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred during login'
    }, { status: 500 });
  }
}