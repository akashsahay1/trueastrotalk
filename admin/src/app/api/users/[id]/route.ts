import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';
import { omit } from '@/utils/omit';
import { cleanupUserFiles } from '@/lib/file-cleanup';
import { emailService } from '@/lib/email-service';
import { PasswordSecurity, SecurityMiddleware } from '@/lib/security';
import { Media } from '@/models';

/**
 * Log verification status change to audit log
 */
async function logVerificationAudit(
  userId: string,
  userName: string,
  previousStatus: string,
  newStatus: string,
  adminId: string,
  adminName: string,
  reason?: string
): Promise<void> {
  try {
    const auditCollection = await DatabaseService.getCollection('audit_logs');
    await auditCollection.insertOne({
      action: 'VERIFICATION_STATUS_CHANGE',
      entity_type: 'user',
      entity_id: userId,
      entity_name: userName,
      previous_value: previousStatus,
      new_value: newStatus,
      reason: reason || null,
      performed_by_id: adminId,
      performed_by_name: adminName,
      performed_by_type: 'administrator',
      ip_address: null, // Can be added from request headers if needed
      created_at: new Date(),
    });
    console.log(`📝 Audit: ${adminName} changed verification status of ${userName} from ${previousStatus} to ${newStatus}`);
  } catch (error) {
    console.error('Failed to log verification audit:', error);
    // Don't throw - audit logging failure shouldn't block the operation
  }
}

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'www.trueastrotalk.com';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const usersCollection = await DatabaseService.getCollection('users');
    const mediaCollection = await DatabaseService.getCollection('media');

    // Try to find user by user_id field (custom format like user_xxx)
    let user = await usersCollection.findOne({ user_id: id });
    
    // If not found and ID is a valid ObjectId, try finding by _id
    if (!user && ObjectId.isValid(id)) {
      user = await usersCollection.findOne({ _id: new ObjectId(id) });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const userResponse = omit(user, ['password']);

    // Resolve profile image to full URL for display
    const baseUrl = getBaseUrl(request);
    console.log('🔍 [USER GET] Resolving profile image for user:', id);
    console.log('   profile_image_id:', user.profile_image_id);
    console.log('   profile_image:', user.profile_image);
    userResponse.profile_image = await Media.resolveProfileImage(user, baseUrl);
    console.log('   resolved URL:', userResponse.profile_image);

    // Resolve PAN card image to full URL if exists
    if (user.pan_card_id) {
      try {
        const panCardRef = user.pan_card_id;
        let mediaFile = null;

        if (typeof panCardRef === 'string') {
          // Check if it's our custom media_id format
          if (panCardRef.startsWith('media_')) {
            mediaFile = await mediaCollection.findOne({ media_id: panCardRef });
          } else if (panCardRef.length === 24) {
            // Try legacy ObjectId lookup first
            try {
              mediaFile = await mediaCollection.findOne({ _id: new ObjectId(panCardRef) });
            } catch {
              mediaFile = await mediaCollection.findOne({ media_id: panCardRef });
            }
          }
        } else if (panCardRef instanceof ObjectId) {
          mediaFile = await mediaCollection.findOne({ _id: panCardRef });
        }

        if (mediaFile && mediaFile.file_path) {
          userResponse.pan_card_image = `${baseUrl}${mediaFile.file_path}`;
        }
      } catch (error) {
        console.error('Error resolving PAN card media file:', error);
      }
    }

    return NextResponse.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Validate required fields
    const {
      full_name,
      email_address,
      user_type,
      phone_number,
      gender
    } = body;

    // Check each required field and collect missing ones
    const missingBaseFields: string[] = [];
    if (!full_name) missingBaseFields.push('Full Name');
    if (!email_address) missingBaseFields.push('Email Address');
    if (!user_type) missingBaseFields.push('User Type');
    if (!phone_number) missingBaseFields.push('Phone Number');
    if (!gender) missingBaseFields.push('Gender');

    if (missingBaseFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingBaseFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate user type
    const validUserTypes = ['customer', 'astrologer', 'administrator', 'manager'];
    if (!validUserTypes.includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Additional validation for astrologers
    if (user_type === 'astrologer') {
      const {
        address,
        city,
        state,
        country,
        zip,
        qualifications,
        skills,
        call_rate,
        chat_rate,
        video_rate
      } = body;

      // Check each required field and collect missing ones
      const missingFields: string[] = [];
      if (!address) missingFields.push('Address');
      if (!city) missingFields.push('City');
      if (!state) missingFields.push('State');
      if (!country) missingFields.push('Country');
      if (!zip) missingFields.push('ZIP/Postal Code');
      if (!qualifications || qualifications.length === 0) missingFields.push('Qualifications (at least one)');
      if (!skills || skills.length === 0) missingFields.push('Skills (at least one)');
      if (!call_rate) missingFields.push('Call Rate');
      if (!chat_rate) missingFields.push('Chat Rate');
      if (!video_rate) missingFields.push('Video Rate');

      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields for astrologer account: ${missingFields.join(', ')}` },
          { status: 400 }
        );
      }

      // Database-level validation: Ensure rates are reasonable
      const callRate = parseFloat(call_rate);
      const chatRate = parseFloat(chat_rate);
      const videoRate = parseFloat(video_rate);

      if (callRate >= 200 || chatRate >= 200 || videoRate >= 200) {
        return NextResponse.json(
          { error: 'All rates must be under ₹200 per minute for astrologers' },
          { status: 400 }
        );
      }

      // Validate rejection reason is provided when rejecting an astrologer
      if (body.verification_status === 'rejected') {
        const rejectionMessage = body.verification_status_message;
        if (!rejectionMessage || (typeof rejectionMessage === 'string' && rejectionMessage.trim() === '')) {
          return NextResponse.json(
            { error: 'Rejection reason is required when rejecting an astrologer account' },
            { status: 400 }
          );
        }
      }
    }

        const usersCollection = await DatabaseService.getCollection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user (phone numbers can be duplicate)
    const duplicateUser = await usersCollection.findOne({
      $and: [
        { _id: { $ne: new ObjectId(id) } },
        { email_address: email_address }
      ]
    });

    if (duplicateUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Handle profile image updates based on new system
    const profileImageUpdates: Record<string, unknown> = {};

    // If user is Google auth and has external profile image URL
    if (body.auth_type === 'google' && body.social_auth_profile_image && typeof body.social_auth_profile_image === 'string' && body.social_auth_profile_image.startsWith('http')) {
      profileImageUpdates.social_auth_profile_image = body.social_auth_profile_image;
      // Keep existing profile_image_id as fallback or set to default if not exists
      if (!existingUser.profile_image_id) {
        try {
          // Find default avatar in media library
          const mediaCollection = await DatabaseService.getCollection('media');
          const defaultAvatar = await mediaCollection.findOne({ original_name: 'default_astrologer_avatar.jpg' });
          if (defaultAvatar) {
            profileImageUpdates.profile_image_id = defaultAvatar.media_id;
          }
        } catch (error) {
          console.error('Error finding default avatar:', error);
        }
      }
    } else if (body.profile_image_id && typeof body.profile_image_id === 'string' && body.profile_image_id.trim() !== '') {
      // Use media_id directly (no longer using ObjectId for profile images)
      profileImageUpdates.profile_image_id = body.profile_image_id.trim();
      // Remove social auth profile image if switching away from Google
      if (existingUser.social_auth_profile_image) {
        profileImageUpdates.social_auth_profile_image = null;
      }
    } else if (body.profile_image_id === '' || body.profile_image_id === null) {
      // User is removing profile image
      profileImageUpdates.profile_image_id = null;
      if (existingUser.social_auth_profile_image) {
        profileImageUpdates.social_auth_profile_image = null;
      }
    }

    // Handle PAN card image updates
    if (body.pan_card_id !== undefined) {
      if (body.pan_card_id && typeof body.pan_card_id === 'string' && body.pan_card_id.trim() !== '') {
        // Set PAN card media_id
        profileImageUpdates.pan_card_id = body.pan_card_id.trim();
      } else if (body.pan_card_id === '' || body.pan_card_id === null) {
        // Remove PAN card
        profileImageUpdates.pan_card_id = null;
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...profileImageUpdates,
      full_name,
      email_address,
      user_type,
      auth_type: body.auth_type || existingUser.auth_type || 'email',
      phone_number,
      gender,
      date_of_birth: body.date_of_birth || '',
      birth_time: body.birth_time || '',
      birth_place: body.birth_place || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      country: body.country || 'India',
      zip: body.zip || '',
      account_status: body.account_status || 'active',
      is_online: body.is_online !== undefined ? body.is_online : existingUser.is_online,
      verification_status: body.verification_status || existingUser.verification_status || 'pending',
      verification_status_message: body.verification_status_message !== undefined ? body.verification_status_message : (existingUser.verification_status_message || ''),
      verified_at: body.verification_status === 'verified' ? (body.verified_at || new Date()) : (body.verification_status === 'pending' || body.verification_status === 'rejected' ? null : existingUser.verified_at),
      verified_by: body.verification_status === 'verified' ? (body.verified_by || 'admin') : (body.verification_status === 'pending' || body.verification_status === 'rejected' ? null : existingUser.verified_by),
      bio: body.bio || '',
      // Standardize on qualifications (not specializations) to match mobile
      qualifications: body.qualifications || [],
      skills: body.skills || [],
      languages: body.languages || [],
      // Service rates charged to customers
      call_rate: body.call_rate || 50,
      chat_rate: body.chat_rate || 30,
      video_rate: body.video_rate || 80,
      experience_years: body.experience_years || 0,
      // Commission percentages
      commission_percentage: body.commission_percentage || existingUser.commission_percentage || { call: 25, chat: 25, video: 25 },
      // Bank details for astrologer payouts
      bank_details: body.bank_details || existingUser.bank_details || { account_holder_name: '', account_number: '', bank_name: '', ifsc_code: '' },
      updated_at: new Date()
    };

    // Only update password if provided
    if (body.password && body.password.trim() !== '') {
      updateData.password = await PasswordSecurity.hashPassword(body.password);
    }

    // Check if verification status changed for astrologers
    const verificationStatusChanged = existingUser.verification_status !== body.verification_status;
    const isAstrologer = existingUser.user_type === 'astrologer';
    
    // Update the user
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get updated user data and resolve profile image
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    const userResponse = omit(updatedUser!, ['password']);

    // Resolve profile image to full URL for response
    const baseUrl = getBaseUrl(request);
    userResponse.profile_image = await Media.resolveProfileImage(updatedUser!, baseUrl);
    const mediaCollection = await DatabaseService.getCollection('media');

    // Resolve PAN card image to full URL if exists
    if (updatedUser!.pan_card_id) {
      try {
        const panCardRef = updatedUser!.pan_card_id;
        let mediaFile = null;

        if (typeof panCardRef === 'string') {
          // Check if it's our custom media_id format
          if (panCardRef.startsWith('media_')) {
            mediaFile = await mediaCollection.findOne({ media_id: panCardRef });
          } else if (panCardRef.length === 24) {
            // Try legacy ObjectId lookup first
            try {
              mediaFile = await mediaCollection.findOne({ _id: new ObjectId(panCardRef) });
            } catch {
              mediaFile = await mediaCollection.findOne({ media_id: panCardRef });
            }
          }
        } else if (panCardRef instanceof ObjectId) {
          mediaFile = await mediaCollection.findOne({ _id: panCardRef });
        }

        if (mediaFile && mediaFile.file_path) {
          userResponse.pan_card_image = `${baseUrl}${mediaFile.file_path}`;
        }
      } catch (error) {
        console.error('Error resolving PAN card media file:', error);
      }
    }

    // Log audit trail for verification status changes
    if (verificationStatusChanged && body.verification_status) {
      // Try to get admin info from auth header
      let adminId = 'unknown';
      let adminName = 'Unknown Admin';

      try {
        const authenticatedUser = await SecurityMiddleware.authenticateRequest(request) as {
          userId?: string;
          user_id?: string;
          _id?: { toString(): string };
          full_name?: string;
          name?: string;
        };
        adminId = authenticatedUser.userId || authenticatedUser.user_id || authenticatedUser._id?.toString() || 'unknown';
        adminName = authenticatedUser.full_name || authenticatedUser.name || 'Admin';
      } catch {
        // If auth fails, use defaults - don't block the operation
      }

      await logVerificationAudit(
        existingUser.user_id || id,
        existingUser.full_name || 'Unknown User',
        existingUser.verification_status || 'unknown',
        body.verification_status,
        adminId,
        adminName,
        body.verification_status === 'rejected' ? body.verification_status_message : undefined
      );
    }

    // Send email notification if astrologer verification status changed
    if (verificationStatusChanged && isAstrologer && body.verification_status) {
      const astrologerData = {
        ...updatedUser,
        name: updatedUser!.full_name,
        email: updatedUser!.email_address
      };

      if (body.verification_status === 'verified' || body.verification_status === 'rejected') {
        emailService.sendAstrologerStatusNotification(
          astrologerData,
          body.verification_status,
          body.verification_status_message
        ).catch(error => {
          console.error('Error sending astrologer status email:', error);
        });
      }
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

        const usersCollection = await DatabaseService.getCollection('users');

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Clean up associated files before deleting user (using utility function)
    await cleanupUserFiles(id, { 
      deleteFromFilesystem: true, 
      deleteFromDatabase: true, 
      logActivity: true 
    });

    // Delete user from database
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User and associated files deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
  }
}