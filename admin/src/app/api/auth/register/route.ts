import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      full_name, 
      email_address, 
      password, 
      phone_number, 
      user_type,
      auth_type = 'email',
      google_id_token,
      google_access_token,
      date_of_birth,
      time_of_birth,
      place_of_birth,
      experience_years,
      bio,
      languages,
      qualifications,
      skills,
      address,
      city,
      state,
      country,
      zip,
      call_rate,
      chat_rate,
      video_rate
    } = body;

    // Validate required fields
    if (!full_name || !email_address || !user_type) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          message: 'Full name, email, and user type are required' 
        },
        { status: 400 }
      );
    }

    // Validate password only for non-Google auth
    if (auth_type !== 'google' && !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing password',
          message: 'Password is required for email authentication' 
        },
        { status: 400 }
      );
    }

    // Validate user type
    if (!['customer', 'astrologer'].includes(user_type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid user type',
          message: 'User type must be either customer or astrologer' 
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Check if user already exists (only check email, not phone)
    const existingUser = await usersCollection.findOne({
      email_address
    });

    if (existingUser) {
      await client.close();
      return NextResponse.json(
        { 
          success: false,
          error: 'Email already exists',
          message: 'An account with this email already exists' 
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = {
      _id: new ObjectId(),
      profile_image: '',
      full_name,
      email_address,
      password: auth_type === 'google' ? '' : hashPassword(password), // No password for Google users
      user_type,
      auth_type,
      phone_number: phone_number || '',
      date_of_birth: date_of_birth || '',
      birth_time: time_of_birth || '',
      birth_place: place_of_birth || '',
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || 'India',
      zip: zip || '',
      account_status: user_type === 'customer' ? 'active' : 'profile_incomplete',
      verification_status: user_type === 'customer' ? 'verified' : 'unverified',
      is_online: false,
      is_verified: auth_type === 'google' ? true : false,
      wallet_balance: 0,
      google_id_token: auth_type === 'google' ? google_id_token : undefined,
      google_access_token: auth_type === 'google' ? google_access_token : undefined,
      // Professional fields for astrologers
      experience_years: experience_years || '',
      bio: bio || '',
      languages: languages || '',
      qualifications: qualifications || '',
      skills: skills || '',
      // Rate information for astrologers
      call_rate: call_rate || 0,
      chat_rate: chat_rate || 0,
      video_rate: video_rate || 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    
    await client.close();

    if (result.insertedId) {
      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: result.insertedId.toString(),
          full_name,
          email_address,
          phone_number: phone_number || '',
          user_type,
          account_status: newUser.account_status,
          verification_status: newUser.verification_status,
          profile_image: '',
          wallet_balance: 0,
          is_verified: newUser.is_verified
        }
      });
    } else {
      throw new Error('Failed to insert user');
    }

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while registering the user' 
      },
      { status: 500 }
    );
  }
}