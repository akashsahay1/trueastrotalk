import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import DatabaseService from '../../../../lib/database';
import { 
  PasswordSecurity, 
  JWTSecurity, 
  ValidationSchemas, 
  InputSanitizer
} from '../../../../lib/security';
import { generateUserId } from '../../../../lib/custom-id';

/**
 * Generate a unique media ID that persists across database exports/imports
 * Format: media_{timestamp}_{random}
 */
function generateMediaId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `media_${timestamp}_${random}`;
}

/**
 * Handle file upload and return media info
 */
async function handleFileUpload(file: File, fileType: string, uploadedBy: string): Promise<{ mediaId: string; filePath: string } | null> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    
    const isValidMimeType = allowedTypes.includes(file.type.toLowerCase());
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
    
    if (!isValidMimeType && !isValidExtension) {
      console.error(`Invalid file type: ${file.type}`);
      return null;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File size too large');
      return null;
    }

    // Create directory path
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const fileName = `ta-${timestamp}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    const publicUrl = `/uploads/${year}/${month}/${fileName}`;
    const mediaId = generateMediaId();

    // Save to media collection
    const mediaCollection = await DatabaseService.getCollection('media');
    await mediaCollection.insertOne({
      media_id: mediaId,
      filename: fileName,
      original_name: file.name,
      file_path: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      file_type: fileType,
      uploaded_by: uploadedBy,
      associated_record: uploadedBy,
      is_external: false,
      uploaded_at: now,
      created_at: now,
      updated_at: now
    });

    return { mediaId, filePath: publicUrl };
  } catch (error) {
    console.error('File upload error:', error);
    return null;
  }
}

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

    // Check if request is multipart/form-data or JSON
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};
    let profileImageFile: File | null = null;
    let panCardImageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with file uploads
      const formData = await request.formData();
      
      // Extract files
      profileImageFile = formData.get('profile_image') as File || null;
      panCardImageFile = formData.get('pan_card_image') as File || null;
      
      // Extract other fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'profile_image' && key !== 'pan_card_image') {
          // Parse JSON strings for nested objects
          if (typeof value === 'string' && (key === 'bank_details' || key === 'commission_percentage')) {
            try {
              body[key] = JSON.parse(value);
            } catch {
              body[key] = value;
            }
          } else if (typeof value === 'string' && (key === 'languages' || key === 'skills' || key === 'qualifications')) {
            // Parse array fields
            try {
              body[key] = JSON.parse(value);
            } catch {
              body[key] = value;
            }
          } else {
            body[key] = value;
          }
        }
      }
    } else {
      // Handle JSON request
      body = await request.json();
    }

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
      // Bank details for astrologers
      bank_details,
      commission_percentage,
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
      googleUserInfo = await validateGoogleRegistration(google_id_token as string);
      
      if (!googleUserInfo) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_GOOGLE_TOKEN',
          message: 'Invalid or expired Google token'
        }, { status: 400 });
      }
      

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
    const usersCollection = await DatabaseService.getCollection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email_address: cleanEmail
    });
    if (existingUser) {
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
      
      // Process arrays properly
      userData.languages = Array.isArray(languages) ? languages : 
                          typeof languages === 'string' ? languages.split(',').map((l: string) => l.trim()).filter(Boolean) : [];
      userData.skills = Array.isArray(skills) ? skills : 
                       typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      userData.qualifications = Array.isArray(qualifications) ? qualifications : 
                               typeof qualifications === 'string' ? qualifications.split(',').map((q: string) => q.trim()).filter(Boolean) : [];
      
      userData.call_rate = call_rate ? parseFloat(call_rate as string) : 50;
      userData.chat_rate = chat_rate ? parseFloat(chat_rate as string) : 30;
      userData.video_rate = video_rate ? parseFloat(video_rate as string) : 80;
      
      // Add bank details if provided
      if (bank_details && typeof bank_details === 'object') {
        const bankDetails = bank_details as Record<string, string>;
        userData.bank_details = {
          account_holder_name: bankDetails.account_holder_name || '',
          account_number: bankDetails.account_number || '',
          bank_name: bankDetails.bank_name || '',
          ifsc_code: bankDetails.ifsc_code || ''
        };
      }
      
      // Add commission percentage (default or provided)
      userData.commission_percentage = commission_percentage || {
        call: 25,
        chat: 25,
        video: 25
      };
      
      // Note: Removed availability system - astrologers are available when online
      userData.rating = 0;
      userData.total_reviews = 0;
      userData.total_consultations = 0;
      userData.total_earnings = 0;
      userData.verification_documents = [];
      userData.approval_status = 'pending';
    }

    // Handle profile image upload if provided
    if (profileImageFile) {
      const uploadResult = await handleFileUpload(
        profileImageFile, 
        'profile_image', 
        userData.user_id as string
      );
      
      if (uploadResult) {
        // Store media_id in profile_image_id field (not profile_image)
        userData.profile_image_id = uploadResult.mediaId;
        // Also store the path for backward compatibility if needed
        userData.profile_image = uploadResult.filePath;
      }
    }

    // Handle PAN card image upload for astrologers
    if (user_type === 'astrologer' && panCardImageFile) {
      const uploadResult = await handleFileUpload(
        panCardImageFile, 
        'pan_card', 
        userData.user_id as string
      );
      
      if (uploadResult) {
        userData.pan_card_id = uploadResult.mediaId;
      }
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


    // Generate JWT tokens for immediate login
    const tokenPayload = {
      userId: userData.user_id,
      email: cleanEmail,
      full_name: userData.full_name,
      user_type: userData.user_type,
      account_status: userData.account_status,
      session_id: crypto.randomUUID()
    };

    const accessToken = JWTSecurity.generateAccessToken(tokenPayload);
    const refreshToken = JWTSecurity.generateRefreshToken({
      userId: userData.user_id,
      session_id: tokenPayload.session_id
    });

    // Send welcome email (implement later)
    // await sendWelcomeEmail(cleanEmail, userData.full_name, user_type);

    // Prepare response
    const responseUser = {
      id: userData.user_id as string, // Use custom user_id instead of MongoDB ObjectId
      full_name: userData.full_name,
      email_address: userData.email_address,
      phone_number: userData.phone_number,
      user_type: userData.user_type,
      account_status: userData.account_status,
      verification_status: userData.verification_status,
      auth_type: userData.auth_type,
      profile_image: userData.profile_image || '',
      profile_image_id: userData.profile_image_id || null,
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
        qualifications: userData.qualifications,
        call_rate: userData.call_rate,
        chat_rate: userData.chat_rate,
        video_rate: userData.video_rate,
        bank_details: userData.bank_details,
        commission_percentage: userData.commission_percentage,
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