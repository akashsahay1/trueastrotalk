import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { omit } from '@/utils/omit';
import { cleanupUserFiles } from '@/lib/file-cleanup';
import { envConfig, envHelpers } from '@/lib/env-config';
import { emailService } from '@/lib/email-service';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new MongoClient(envHelpers.getDatabaseUrl());
  
  try {
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db(envConfig.DB_NAME);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const userResponse = omit(user, ['password']);

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
    await client.close();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new MongoClient(envHelpers.getDatabaseUrl());
  
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
        commission_rates 
      } = body;

      if (!date_of_birth || !birth_time || !birth_place || !address || 
          !city || !state || !country || !zip || 
          !qualifications || qualifications.length === 0 ||
          !skills || skills.length === 0 ||
          !commission_rates || 
          !commission_rates.call_rate || 
          !commission_rates.chat_rate || 
          !commission_rates.video_rate) {
        return NextResponse.json(
          { error: 'Missing required fields for astrologer account' },
          { status: 400 }
        );
      }
    }

    await client.connect();
    const db = client.db(envConfig.DB_NAME);
    const usersCollection = db.collection('users');

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

    // Prepare update data
    const updateData: Record<string, unknown> = {
      profile_image: body.profile_image || existingUser.profile_image || '',
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
      // Save rates both as direct fields and in commission_rates object for compatibility
      call_rate: body.commission_rates?.call_rate || 0,
      chat_rate: body.commission_rates?.chat_rate || 0,
      video_rate: body.commission_rates?.video_rate || 0,
      commission_rates: {
        call_rate: body.commission_rates?.call_rate || 0,
        chat_rate: body.commission_rates?.chat_rate || 0,
        video_rate: body.commission_rates?.video_rate || 0
      },
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

    // Get updated user data
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    const userResponse = omit(updatedUser!, ['password']);

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
        ).then(sent => {
          console.log(`Astrologer ${body.verification_status} email sent: ${sent}`);
        }).catch(error => {
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
    await client.close();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new MongoClient(envHelpers.getDatabaseUrl());
  
  try {
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db(envConfig.DB_NAME);
    const usersCollection = db.collection('users');

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

    console.log(`✅ Successfully deleted user ${id} and associated files`);

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
    await client.close();
  }
}