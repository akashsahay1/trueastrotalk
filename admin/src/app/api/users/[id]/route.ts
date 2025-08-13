import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { omit } from '@/utils/omit';
import { cleanupUserFiles } from '@/lib/file-cleanup';

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new MongoClient(url);
  
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
    const db = client.db(dbName);
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
  const client = new MongoClient(url);
  
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
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email/phone is already taken by another user
    const duplicateUser = await usersCollection.findOne({
      $and: [
        { _id: { $ne: new ObjectId(id) } },
        {
          $or: [
            { email_address: email_address },
            { phone_number: phone_number }
          ]
        }
      ]
    });

    if (duplicateUser) {
      return NextResponse.json(
        { error: 'User with this email or phone number already exists' },
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
      is_verified: body.is_verified !== undefined ? body.is_verified : existingUser.is_verified,
      // Also set verification_status based on is_verified for mobile compatibility
      verification_status: body.is_verified !== undefined 
        ? (body.is_verified ? 'verified' : 'unverified')
        : (existingUser.is_verified ? 'verified' : 'unverified'),
      bio: body.bio || '',
      // Standardize on qualifications (not specializations) to match mobile
      qualifications: body.qualifications || [],
      skills: body.skills || [],
      // Save rates as direct fields to match mobile registration
      call_rate: body.commission_rates?.call_rate || 0,
      chat_rate: body.commission_rates?.chat_rate || 0,
      video_rate: body.commission_rates?.video_rate || 0,
      experience_years: body.experience_years || 0,
      updated_at: new Date()
    };

    // Only update password if provided
    if (body.password && body.password.trim() !== '') {
      updateData.password = hashPassword(body.password);
    }

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
  const client = new MongoClient(url);
  
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
    const db = client.db(dbName);
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