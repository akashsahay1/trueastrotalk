import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import DatabaseService from '../../../../lib/database';
import { 
  SecurityMiddleware, 
  InputSanitizer
} from '../../../../lib/security';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}


// Helper function to resolve profile image to full URL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProfileImage(user: Record<string, unknown>, mediaCollection: any, baseUrl: string): Promise<string | null> {
  // Priority 1: If user has profile_image_id, resolve from media library
  if (user.profile_image_id) {
    try {
      let mediaFile = null;
      
      if (typeof user.profile_image_id === 'string') {
        // Check if it's our custom media_id format
        if (user.profile_image_id.startsWith('media_')) {
          mediaFile = await mediaCollection.findOne({ media_id: user.profile_image_id });
        } else if (user.profile_image_id.length === 24) {
          // Try legacy ObjectId lookup
          try {
            mediaFile = await mediaCollection.findOne({ _id: new ObjectId(user.profile_image_id) });
          } catch {
            mediaFile = await mediaCollection.findOne({ media_id: user.profile_image_id });
          }
        }
      } else if (user.profile_image_id instanceof ObjectId) {
        mediaFile = await mediaCollection.findOne({ _id: user.profile_image_id });
      }
      
      if (mediaFile && mediaFile.file_path) {
        return `${baseUrl}${mediaFile.file_path}`;
      }
    } catch (error) {
      console.error('Error resolving media file:', error);
    }
  }
  
  // Priority 2: Direct profile_image URL
  if (user.profile_image && typeof user.profile_image === 'string') {
    if (user.profile_image.startsWith('/')) {
      return `${baseUrl}${user.profile_image}`;
    }
    return user.profile_image;
  }
  
  // Priority 3: profile_picture URL (fallback)
  if (user.profile_picture && typeof user.profile_picture === 'string') {
    if (user.profile_picture.startsWith('/')) {
      return `${baseUrl}${user.profile_picture}`;
    }
    return user.profile_picture;
  }
  
  // No profile image - return null
  return null;
}

// Helper function to delete file safely
async function deleteFile(filePath: string, options?: { deleteFromFilesystem?: boolean; logActivity?: boolean }) {
  try {
    if (options?.deleteFromFilesystem && filePath.startsWith('/uploads/')) {
      const fullPath = path.join(process.cwd(), 'public', filePath);
      if (existsSync(fullPath)) {
        const fs = await import('fs/promises');
        await fs.unlink(fullPath);
        if (options.logActivity) {
          console.log(`🗑️ Deleted old profile image: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`👤 Profile fetch request from IP: ${ip}`);

    // Authenticate user with enhanced security
    let user;
    try {
      user = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Get user from database with security checks
    const usersCollection = await DatabaseService.getCollection('users');
    const mediaCollection = await DatabaseService.getCollection('media');

    const dbUser = await usersCollection.findOne(
      { 
        user_id: user.userId as string,
        account_status: { $ne: 'banned' }
      },
      { 
        projection: { 
          password: 0, // Never return password
          google_access_token: 0, // Don't expose tokens
          failed_login_attempts: 0,
          last_failed_login: 0
        } 
      }
    );

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found or has been suspended'
      }, { status: 404 });
    }

    // Check for required user_id field (data integrity check)
    if (!dbUser.user_id) {
      console.error(`❌ User ${user.userId} missing user_id field - data integrity issue`);
      return NextResponse.json({
        success: false,
        error: 'DATA_INTEGRITY_ERROR',
        message: 'User account data is incomplete'
      }, { status: 500 });
    }

    // Check account status
    if (dbUser.account_status === 'inactive') {
      return NextResponse.json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive. Please verify your account.'
      }, { status: 403 });
    }

    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);
    
    // Resolve profile image to full URL
    const profileImageUrl = await resolveProfileImage(dbUser, mediaCollection, baseUrl);
    
    console.log(`📷 Profile image resolution for user ${user.userId}:`);
    console.log(`   - profile_image_id: ${dbUser.profile_image_id}`);
    console.log(`   - resolved URL: ${profileImageUrl}`);

    console.log(`✅ Profile fetched successfully for user: ${user.userId}`);

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.user_id,
        full_name: dbUser.full_name,
        email_address: dbUser.email_address,
        phone_number: dbUser.phone_number || '',
        user_type: dbUser.user_type,
        account_status: dbUser.account_status,
        verification_status: dbUser.verification_status || 'unverified',
        profile_image: profileImageUrl,
        wallet_balance: dbUser.wallet_balance || 0,
        is_verified: dbUser.is_verified || false,
        date_of_birth: dbUser.date_of_birth || '',
        birth_time: dbUser.birth_time || '',
        birth_place: dbUser.birth_place || '',
        address: dbUser.address || '',
        city: dbUser.city || '',
        state: dbUser.state || '',
        country: dbUser.country || 'India',
        zip: dbUser.zip || '',
        gender: dbUser.gender || '',
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
        
        // Astrologer-specific fields (only return if user is astrologer)
        ...(dbUser.user_type === 'astrologer' && {
          bio: dbUser.bio || '',
          experience_years: dbUser.experience_years || 0,
          languages: dbUser.languages || '',
          skills: dbUser.skills || '',
          qualifications: dbUser.qualifications || [],
          chat_rate: dbUser.chat_rate || 0,
          call_rate: dbUser.call_rate || 0,
          video_rate: dbUser.video_rate || 0,
          // Removed availability system - using online status instead
          is_online: dbUser.is_online || false,
          total_consultations: dbUser.total_consultations || 0,
          total_earnings: dbUser.total_earnings || 0,
          rating: dbUser.rating || 0,
          total_reviews: dbUser.total_reviews || 0,
          approval_status: dbUser.approval_status || 'pending'
        })
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while retrieving profile'
    }, { status: 500 });
  }
}

// PUT update user profile (handles both JSON data and file uploads)
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`📝 Profile update request from IP: ${ip}`);

    // Authenticate user with enhanced security
    let user;
    try {
      user = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    const contentType = request.headers.get('content-type');
    let updateData: Record<string, unknown> = {};
    let profileImageFile: File | null = null;

    // Handle both JSON and FormData with input sanitization
    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with potential file upload
      const formData = await request.formData();
      
      // Extract profile image file if present
      const imageFile = formData.get('profile_image') as File;
      if (imageFile && imageFile.size > 0) {
        profileImageFile = imageFile;
      }
      
      // Extract and sanitize other form fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'profile_image' && typeof value === 'string') {
          updateData[key] = InputSanitizer.sanitizeString(value);
        }
      }
    } else {
      // Handle JSON data with sanitization
      const body = await request.json();
      updateData = InputSanitizer.sanitizeMongoQuery(body);
    }
    
    // Handle field mapping between mobile app and database
    if (updateData.time_of_birth) {
      updateData.birth_time = updateData.time_of_birth;
      delete updateData.time_of_birth;
    }
    if (updateData.place_of_birth) {
      updateData.birth_place = updateData.place_of_birth;
      delete updateData.place_of_birth;
    }
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const protectedFields = [
      '_id', 'password', 'user_type', 'account_status', 'verification_status',
      'wallet_balance', 'created_at', 'email_address', 'is_verified',
      'login_count', 'failed_login_attempts', 'last_login', 'last_logout',
      'google_access_token', 'registration_ip', 'total_earnings',
      'approval_status', 'is_online'
    ];
    
    protectedFields.forEach(field => delete updateData[field]);

    // Validate required fields based on user type
    const usersCollection = await DatabaseService.getCollection('users');
    const existingUser = await usersCollection.findOne({ 
      user_id: user.userId as string,
      account_status: { $ne: 'banned' }
    });
    
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found or has been suspended'
      }, { status: 404 });
    }

    // Validate input data based on user type
    if (existingUser.user_type === 'astrologer') {
      // Validate astrologer-specific fields
      if (updateData.call_rate && (Number(updateData.call_rate) < 10 || Number(updateData.call_rate) > 10000)) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_CALL_RATE',
          message: 'Call rate must be between ₹10 and ₹10,000 per minute'
        }, { status: 400 });
      }
      
      if (updateData.chat_rate && (Number(updateData.chat_rate) < 5 || Number(updateData.chat_rate) > 5000)) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_CHAT_RATE',
          message: 'Chat rate must be between ₹5 and ₹5,000 per minute'
        }, { status: 400 });
      }

      if (updateData.experience_years && (Number(updateData.experience_years) < 0 || Number(updateData.experience_years) > 50)) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_EXPERIENCE',
          message: 'Experience must be between 0 and 50 years'
        }, { status: 400 });
      }
    }

    // Validate phone number if provided
    if (updateData.phone_number) {
      const cleanPhone = InputSanitizer.sanitizePhoneNumber(updateData.phone_number as string);
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please provide a valid phone number'
        }, { status: 400 });
      }
      updateData.phone_number = cleanPhone;
    }

    // Handle profile image upload if present
    let imageUrl: string | null = null;
    if (profileImageFile && profileImageFile.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const fileExtension = profileImageFile.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      
      const isValidMimeType = allowedTypes.includes(profileImageFile.type.toLowerCase());
      const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
      
      if (!isValidMimeType && !isValidExtension) {
        return NextResponse.json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed.'
        }, { status: 400 });
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (profileImageFile.size > maxSize) {
        return NextResponse.json({
          success: false,
          error: 'File too large. Maximum size is 10MB.'
        }, { status: 400 });
      }

      // Generate file path
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = Date.now();
      const extension = path.extname(profileImageFile.name);
      const filename = `ta-${timestamp}${extension}`;
      
      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const filepath = path.join(uploadDir, filename);
      const bytes = await profileImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      imageUrl = `/uploads/${year}/${month}/${filename}`;
      updateData.profile_image = imageUrl;
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    // If uploading a new profile image, clean up the old one
    if (imageUrl && existingUser.profile_image && existingUser.profile_image !== imageUrl) {
      await deleteFile(existingUser.profile_image as string, { 
        deleteFromFilesystem: true, 
        logActivity: true 
      });
    }

    const result = await usersCollection.updateOne(
      { user_id: user.userId as string },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        message: 'User account no longer exists' 
      }, { status: 404 });
    }

    // Add image to media library if uploaded
    if (imageUrl && profileImageFile) {
      const mediaCollection = await DatabaseService.getCollection('media_files');
      const fileData = {
        filename: path.basename(imageUrl),
        original_name: profileImageFile.name,
        file_path: imageUrl,
        file_size: profileImageFile.size,
        mime_type: profileImageFile.type,
        file_type: 'profile_image',
        uploaded_by: user.userId as string,
        associated_record: user.userId as string,
        is_external: false,
        uploaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      await mediaCollection.insertOne(fileData);
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne(
      { user_id: user.userId as string },
      { projection: { password: 0 } }
    );

    if (!updatedUser) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        message: 'User account no longer exists' 
      }, { status: 404 });
    }

    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);
    
    // Resolve profile image to full URL
    const mediaCollection2 = await DatabaseService.getCollection('media_files');
    const profileImageUrl = await resolveProfileImage(updatedUser, mediaCollection2, baseUrl);


    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser!.user_id,
        full_name: updatedUser!.full_name,
        email_address: updatedUser!.email_address,
        phone_number: updatedUser!.phone_number,
        user_type: updatedUser!.user_type,
        account_status: updatedUser!.account_status,
        verification_status: updatedUser!.verification_status,
        profile_image: profileImageUrl, // Return full URL instead of relative path
        wallet_balance: updatedUser!.wallet_balance || 0,
        is_verified: updatedUser!.is_verified || false,
        date_of_birth: updatedUser!.date_of_birth || '',
        birth_time: updatedUser!.birth_time || '',
        birth_place: updatedUser!.birth_place || '',
        address: updatedUser!.address || '',
        city: updatedUser!.city || '',
        state: updatedUser!.state || '',
        country: updatedUser!.country || '',
        zip: updatedUser!.zip || '',
        created_at: updatedUser!.created_at,
        updated_at: updatedUser!.updated_at,
        
        // Astrologer-specific fields
        bio: updatedUser!.bio || '',
        experience_years: updatedUser!.experience_years || null,
        languages: updatedUser!.languages || [],
        skills: updatedUser!.skills || [],
        qualifications: updatedUser!.qualifications || [],
        certifications: updatedUser!.certifications || [],
        chat_rate: updatedUser!.chat_rate || null,
        call_rate: updatedUser!.call_rate || null,
        video_rate: updatedUser!.video_rate || null,
        is_online: updatedUser!.is_online || false,
        total_consultations: updatedUser!.total_consultations || 0,
        total_earnings: updatedUser!.total_earnings || 0,
        rating: updatedUser!.rating || 0,
        total_reviews: updatedUser!.total_reviews || 0,
        education: updatedUser!.education || '',
        experience: updatedUser!.experience || '',
        upi_id: updatedUser!.upi_id || ''
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating profile'
    }, { status: 500 });
  }
}