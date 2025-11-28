import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { omit } from '@/utils/omit';
import { cleanupUserFiles } from '@/lib/file-cleanup';
import { emailService } from '@/lib/email-service';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'www.trueastrotalk.com';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

// Helper function to resolve profile image to full URL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProfileImage(user: Record<string, unknown>, mediaCollection: any, baseUrl: string): Promise<string | null> {
  // Priority 1: If user has Google auth and social_auth_profile_image, use external URL
  if (user.auth_type === 'google' && user.social_auth_profile_image && typeof user.social_auth_profile_image === 'string') {
    return user.social_auth_profile_image;
  }
  
  // Priority 2: If user has profile_image_id, resolve from media library
  if (user.profile_image_id || user.profile_image) {
    try {
      const mediaRef = user.profile_image_id || user.profile_image;
      let mediaFile = null;
      
      if (typeof mediaRef === 'string') {
        // Check if it's our custom media_id format
        if (mediaRef.startsWith('media_')) {
          mediaFile = await mediaCollection.findOne({ media_id: mediaRef });
        } else if (mediaRef.length === 24) {
          // Try legacy ObjectId lookup first
          try {
            mediaFile = await mediaCollection.findOne({ _id: new ObjectId(mediaRef) });
          } catch {
            mediaFile = await mediaCollection.findOne({ media_id: mediaRef });
          }
        }
      } else if (mediaRef instanceof ObjectId) {
        mediaFile = await mediaCollection.findOne({ _id: mediaRef });
      }
        
      if (mediaFile && mediaFile.file_path) {
        return `${baseUrl}${mediaFile.file_path}`;
      }
    } catch (error) {
      console.error('Error resolving media file:', error);
    }
  }
  
  // No profile image - return null to indicate no image uploaded
  return null;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
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
    userResponse.profile_image = await resolveProfileImage(user, mediaCollection, baseUrl);

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

    if (!full_name || !email_address || !user_type || !phone_number || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        date_of_birth, 
        birth_time, 
        birth_place, 
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

      if (!date_of_birth || !birth_time || !birth_place || !address || 
          !city || !state || !country || !zip || 
          !qualifications || qualifications.length === 0 ||
          !skills || skills.length === 0 ||
          !call_rate || 
          !chat_rate || 
          !video_rate) {
        return NextResponse.json(
          { error: 'Missing required fields for astrologer account' },
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
      // Service rates charged to customers
      call_rate: body.call_rate || 50,
      chat_rate: body.chat_rate || 30,
      video_rate: body.video_rate || 80,
      experience_years: body.experience_years || 0,
      updated_at: new Date()
    };

    // Only update password if provided
    if (body.password && body.password.trim() !== '') {
      updateData.password = hashPassword(body.password);
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
    const mediaCollection = await DatabaseService.getCollection('media');
    userResponse.profile_image = await resolveProfileImage(updatedUser!, mediaCollection, baseUrl);

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