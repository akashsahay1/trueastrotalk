import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET user profile
export async function GET(request: NextRequest) {
  try {
    // Get token from header (mobile) or cookie (admin)
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired' 
      }, { status: 401 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(payload.userId as string) },
      { projection: { password: 0 } } // Exclude password
    );

    await client.close();

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        message: 'User account no longer exists' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        full_name: user.full_name,
        email_address: user.email_address,
        phone_number: user.phone_number,
        user_type: user.user_type,
        account_status: user.account_status,
        verification_status: user.verification_status,
        profile_image: user.profile_image || '',
        wallet_balance: user.wallet_balance || 0,
        is_verified: user.is_verified || false,
        date_of_birth: user.date_of_birth || '',
        birth_time: user.birth_time || '',
        birth_place: user.birth_place || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        zip: user.zip || '',
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while retrieving profile'
    }, { status: 500 });
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    // Get token from header (mobile) or cookie (admin)
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired' 
      }, { status: 401 });
    }

    const updateData = await request.json();
    
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
    delete updateData._id;
    delete updateData.password;
    delete updateData.user_type;
    delete updateData.account_status;
    delete updateData.verification_status;
    delete updateData.wallet_balance;
    delete updateData.created_at;

    // Add updated timestamp
    updateData.updated_at = new Date();

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(payload.userId as string) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      await client.close();
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        message: 'User account no longer exists' 
      }, { status: 404 });
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(payload.userId as string) },
      { projection: { password: 0 } }
    );

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser!._id.toString(),
        full_name: updatedUser!.full_name,
        email_address: updatedUser!.email_address,
        phone_number: updatedUser!.phone_number,
        user_type: updatedUser!.user_type,
        account_status: updatedUser!.account_status,
        verification_status: updatedUser!.verification_status,
        profile_image: updatedUser!.profile_image || '',
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
        updated_at: updatedUser!.updated_at
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