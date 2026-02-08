import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import DatabaseService from '../../../../lib/database';
import {
  SecurityMiddleware,
  InputSanitizer
} from '../../../../lib/security';
import { Media } from '@/models';
import { emailService } from '@/lib/email-service';
import { validateAllRates, hasAtLeastOneRate } from '../../../../lib/rate-validation';

// Helper function to check if astrologer profile is complete
// This mirrors the Flutter User model's isProfileComplete getter
function isAstrologerProfileComplete(user: Record<string, unknown>): boolean {
  if (user.user_type !== 'astrologer') return false;

  // If already verified by admin, consider complete
  if (user.verification_status === 'verified') return true;

  const hasName = Boolean(user.full_name && String(user.full_name).trim());
  const hasEmail = Boolean(user.email_address && String(user.email_address).trim());
  const hasEmailVerified = user.email_verified === true;
  const hasBio = Boolean(user.bio && String(user.bio).trim());
  const hasExperience = Boolean(user.experience_years && Number(user.experience_years) > 0);
  const hasLanguages = Boolean(user.languages && String(user.languages).trim());
  const hasSkills = Boolean(user.skills && String(user.skills).trim());

  // Use centralized rate validation
  const hasRates = hasAtLeastOneRate({
    chat_rate: user.chat_rate as number | undefined,
    call_rate: user.call_rate as number | undefined,
    video_rate: user.video_rate as number | undefined,
  });

  return hasName && hasEmail && hasEmailVerified && hasBio &&
         hasExperience && hasLanguages && hasSkills && hasRates;
}

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
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
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate user AND verify they still exist in database
    // This will return 401 if user has been deleted
    let authResult;
    try {
      authResult = await SecurityMiddleware.authenticateAndVerifyUser(request);
    } catch (error) {
      const err = error as Error & { code?: string; status?: number };
      // User deleted or account inactive - return 401 to trigger auto-logout on client
      if (err.code === 'USER_NOT_FOUND' || err.code === 'ACCOUNT_INACTIVE') {
        return NextResponse.json({
          success: false,
          error: err.code,
          message: err.message
        }, { status: 401 });
      }
      // Other auth errors
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    const { payload: user } = authResult;

    // Get user from database with security checks (already verified exists, get full details)
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
      // User was deleted between auth check and this query - very rare race condition
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found or has been suspended'
      }, { status: 401 });
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
    const profileImageUrl = await Media.resolveProfileImage(dbUser, baseUrl);

    // Resolve PAN card image to direct URL for the owner
    // Since user is already authenticated, we can return the direct URL
    let panCardUrl: string | null = null;
    if (dbUser.pan_card_id) {
      try {
        let panCardMedia = null;
        if (dbUser.pan_card_id.startsWith('media_')) {
          panCardMedia = await mediaCollection.findOne({ media_id: dbUser.pan_card_id });
        }
        if (panCardMedia && panCardMedia.file_path) {
          panCardUrl = `${baseUrl}${panCardMedia.file_path}`;
        }
      } catch (error) {
        console.error('Error resolving PAN card URL:', error);
      }
    }

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
        rejection_reason: dbUser.verification_status_message || null,
        profile_image: profileImageUrl,
        wallet_balance: dbUser.wallet_balance || 0,
        is_verified: dbUser.is_verified || false,
        email_verified: dbUser.email_verified || false,
        phone_verified: dbUser.phone_verified || false,
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
          approval_status: dbUser.approval_status || 'pending',

          // Bank details
          account_holder_name: dbUser.bank_details?.account_holder_name,
          account_number: dbUser.bank_details?.account_number,
          bank_name: dbUser.bank_details?.bank_name,
          ifsc_code: dbUser.bank_details?.ifsc_code,

          // PAN card
          pan_card_url: panCardUrl,
          pan_card_id: dbUser.pan_card_id,

          // Profile submission timestamp
          profile_submitted_at: dbUser.profile_submitted_at || null
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
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate user AND verify they still exist in database
    // This will return 401 if user has been deleted
    let authResult;
    try {
      authResult = await SecurityMiddleware.authenticateAndVerifyUser(request);
    } catch (error) {
      const err = error as Error & { code?: string; status?: number };
      // User deleted or account inactive - return 401 to trigger auto-logout on client
      if (err.code === 'USER_NOT_FOUND' || err.code === 'ACCOUNT_INACTIVE') {
        return NextResponse.json({
          success: false,
          error: err.code,
          message: err.message
        }, { status: 401 });
      }
      // Other auth errors
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    const user = authResult.payload;

    const contentType = request.headers.get('content-type');
    let updateData: Record<string, unknown> = {};
    let profileImageFile: File | null = null;
    let panCardImageFile: File | null = null;

    // Handle both JSON and FormData with input sanitization
    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with potential file upload
      const formData = await request.formData();

      // Extract profile image file if present
      const imageFile = formData.get('profile_image') as File;
      if (imageFile && imageFile.size > 0) {
        profileImageFile = imageFile;
      }

      // Extract PAN card image file if present
      const panCardFile = formData.get('pan_card_image') as File;
      if (panCardFile && panCardFile.size > 0) {
        panCardImageFile = panCardFile;
      }

      // Extract and sanitize other form fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'profile_image' && key !== 'pan_card_image' && typeof value === 'string') {
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
    
    // Handle verified email update
    // Allow email_address update only if email_verified flag is sent (indicating OTP verification)
    const isVerifiedEmailUpdate = updateData.email_verified === true && updateData.email_address;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    const protectedFields = [
      '_id', 'password', 'user_type', 'account_status', 'verification_status',
      'wallet_balance', 'created_at', 'is_verified',
      'login_count', 'failed_login_attempts', 'last_login', 'last_logout',
      'google_access_token', 'registration_ip', 'total_earnings',
      'approval_status', 'is_online'
    ];

    // Only protect email_address if it's not a verified email update
    if (!isVerifiedEmailUpdate) {
      protectedFields.push('email_address');
    }

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
      // Validate astrologer rates using centralized validation
      const rateValidation = validateAllRates({
        chat_rate: updateData.chat_rate,
        call_rate: updateData.call_rate,
        video_rate: updateData.video_rate,
      });

      if (!rateValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: 'INVALID_RATES',
          message: rateValidation.errors.join(', ')
        }, { status: 400 });
      }

      // Apply sanitized rates
      if (rateValidation.sanitizedRates.chat_rate !== undefined) {
        updateData.chat_rate = rateValidation.sanitizedRates.chat_rate;
      }
      if (rateValidation.sanitizedRates.call_rate !== undefined) {
        updateData.call_rate = rateValidation.sanitizedRates.call_rate;
      }
      if (rateValidation.sanitizedRates.video_rate !== undefined) {
        updateData.video_rate = rateValidation.sanitizedRates.video_rate;
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

      // Generate media_id for profile image
      const profileMediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add profile image to media library
      const mediaCollection = await DatabaseService.getCollection('media');
      await mediaCollection.insertOne({
        media_id: profileMediaId,
        filename: filename,
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
      });

      // Save media_id to user record (this is what resolveProfileImage looks for)
      updateData.profile_image_id = profileMediaId;
      // Also keep the direct URL for backward compatibility
      updateData.profile_image = imageUrl;
    }

    // Handle PAN card image upload if present
    let panCardUrl: string | null = null;
    console.log('📤 PAN card file received:', panCardImageFile ? `${panCardImageFile.name} (${panCardImageFile.size} bytes)` : 'none');
    console.log('📤 Existing user pan_card_id:', existingUser.pan_card_id);
    if (panCardImageFile && panCardImageFile.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const fileExtension = panCardImageFile.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

      const isValidMimeType = allowedTypes.includes(panCardImageFile.type.toLowerCase());
      const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);

      if (!isValidMimeType && !isValidExtension) {
        return NextResponse.json({
          success: false,
          error: 'Invalid PAN card file type. Only JPEG, PNG, WebP, and HEIC are allowed.'
        }, { status: 400 });
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (panCardImageFile.size > maxSize) {
        return NextResponse.json({
          success: false,
          error: 'PAN card file too large. Maximum size is 10MB.'
        }, { status: 400 });
      }

      // Generate file path for PAN card
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = Date.now();
      const extension = path.extname(panCardImageFile.name);
      const filename = `pan-${timestamp}${extension}`;

      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save PAN card file
      const filepath = path.join(uploadDir, filename);
      const bytes = await panCardImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      panCardUrl = `/uploads/${year}/${month}/${filename}`;

      // Generate media_id for PAN card
      const panMediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add PAN card to media library
      const mediaCollection = await DatabaseService.getCollection('media');
      await mediaCollection.insertOne({
        media_id: panMediaId,
        filename: filename,
        original_name: panCardImageFile.name,
        file_path: panCardUrl,
        file_size: panCardImageFile.size,
        mime_type: panCardImageFile.type,
        file_type: 'pan_card',
        uploaded_by: user.userId as string,
        associated_record: user.userId as string,
        is_external: false,
        uploaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      // Update user's pan_card_id
      updateData.pan_card_id = panMediaId;

      // Trigger re-verification for astrologers when PAN card is updated
      if (existingUser.user_type === 'astrologer' && existingUser.pan_card_id !== panMediaId) {
        updateData.verification_status = 'pending';
        updateData.verified_at = null;
        updateData.verified_by = null;
        console.log(`🔄 PAN card updated for astrologer ${user.userId} - triggering re-verification`);
      }

      // Clean up old PAN card image if exists
      if (existingUser.pan_card_id) {
        try {
          const oldMediaFile = await mediaCollection.findOne({ media_id: existingUser.pan_card_id });
          if (oldMediaFile && oldMediaFile.file_path) {
            await deleteFile(oldMediaFile.file_path as string, {
              deleteFromFilesystem: true,
              logActivity: true
            });
            // Optionally delete old media record
            await mediaCollection.deleteOne({ media_id: existingUser.pan_card_id });
          }
        } catch (error) {
          console.error('Error cleaning up old PAN card:', error);
        }
      }
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    // If uploading a new profile image, clean up the old one
    if (imageUrl && existingUser.profile_image_id) {
      try {
        const mediaCollection = await DatabaseService.getCollection('media');
        const oldMediaFile = await mediaCollection.findOne({ media_id: existingUser.profile_image_id });
        if (oldMediaFile && oldMediaFile.file_path) {
          await deleteFile(oldMediaFile.file_path as string, {
            deleteFromFilesystem: true,
            logActivity: true
          });
          // Delete old media record
          await mediaCollection.deleteOne({ media_id: existingUser.profile_image_id });
        }
      } catch (error) {
        console.error('Error cleaning up old profile image:', error);
      }
    } else if (imageUrl && existingUser.profile_image && existingUser.profile_image !== imageUrl) {
      // Fallback for users with old profile_image field (not media_id)
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

    // Check if astrologer profile just became complete and send admin notification
    // Only send if: was NOT complete before AND IS complete now
    if (existingUser.user_type === 'astrologer') {
      const wasProfileComplete = isAstrologerProfileComplete(existingUser as Record<string, unknown>);
      const isProfileComplete = isAstrologerProfileComplete(updatedUser as unknown as Record<string, unknown>);

      console.log(`📋 Profile completion check - Before: ${wasProfileComplete}, After: ${isProfileComplete}`);

      if (!wasProfileComplete && isProfileComplete) {
        console.log(`✅ Astrologer profile just completed for ${updatedUser.full_name}, setting profile_submitted_at and sending admin notification`);

        // Set profile_submitted_at timestamp when profile becomes complete for the first time
        if (!existingUser.profile_submitted_at) {
          await usersCollection.updateOne(
            { user_id: user.userId as string },
            { $set: { profile_submitted_at: new Date() } }
          );
          console.log(`📅 Set profile_submitted_at for ${updatedUser.full_name}`);
        }

        // Fetch all admin users' emails
        try {
          const adminUsers = await usersCollection.find(
            { user_type: 'admin', account_status: 'active' },
            { projection: { email_address: 1 } }
          ).toArray();

          const adminEmails = adminUsers
            .map(admin => admin.email_address)
            .filter((email): email is string => Boolean(email));

          console.log(`📧 Found ${adminEmails.length} admin(s) to notify: ${adminEmails.join(', ')}`);

          if (adminEmails.length > 0) {
            // Send notification asynchronously (don't block response)
            emailService.sendAstrologerProfileCompleteNotification({
              name: updatedUser.full_name as string,
              email: updatedUser.email_address as string,
              phone: updatedUser.phone_number as string | undefined,
              userId: updatedUser.user_id as string,
              experience: updatedUser.experience_years as number | undefined,
              skills: updatedUser.skills as string | undefined,
              languages: updatedUser.languages as string | undefined,
            }, adminEmails).then(sent => {
              if (sent) {
                console.log(`✉️ Admin notification email sent successfully`);
              } else {
                console.warn(`⚠️ Failed to send admin notification email`);
              }
            }).catch(err => {
              console.error(`❌ Error sending admin notification: ${err}`);
            });
          }
        } catch (adminError) {
          console.error('Error fetching admin users for notification:', adminError);
          // Don't fail the request, just log the error
        }
      }
    }

    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);

    // Resolve profile image to full URL
    const profileImageUrl = await Media.resolveProfileImage(updatedUser, baseUrl);

    // Get media collection for PAN card lookup
    const mediaCollection2 = await DatabaseService.getCollection('media');

    // Resolve PAN card image to direct URL for the owner
    let panCardUrlUpdated: string | null = null;
    console.log('📤 Updated user pan_card_id:', updatedUser.pan_card_id);
    if (updatedUser.pan_card_id) {
      try {
        let panCardMedia = null;
        if (updatedUser.pan_card_id.startsWith('media_')) {
          panCardMedia = await mediaCollection2.findOne({ media_id: updatedUser.pan_card_id });
        }
        console.log('📤 Found PAN card media:', panCardMedia ? panCardMedia.file_path : 'not found');
        if (panCardMedia && panCardMedia.file_path) {
          panCardUrlUpdated = `${baseUrl}${panCardMedia.file_path}`;
        }
      } catch (error) {
        console.error('Error resolving PAN card URL:', error);
      }
    }
    console.log('📤 Returning pan_card_url:', panCardUrlUpdated);

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
        rejection_reason: updatedUser!.verification_status_message || null,
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
        upi_id: updatedUser!.upi_id || '',

        // Bank details
        account_holder_name: updatedUser!.bank_details?.account_holder_name,
        account_number: updatedUser!.bank_details?.account_number,
        bank_name: updatedUser!.bank_details?.bank_name,
        ifsc_code: updatedUser!.bank_details?.ifsc_code,

        // PAN card
        pan_card_url: panCardUrlUpdated,
        pan_card_id: updatedUser!.pan_card_id
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