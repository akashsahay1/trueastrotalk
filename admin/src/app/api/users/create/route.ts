import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { omit } from '@/utils/omit';

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  const client = new MongoClient(url);
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const { 
      full_name, 
      email_address, 
      password, 
      user_type, 
      phone_number, 
      gender 
    } = body;

    if (!full_name || !email_address || !password || !user_type || !phone_number || !gender) {
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

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email_address: email_address }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = hashPassword(password);

    // Prepare user data
    const userData = {
      profile_image: body.profile_image || '',
      full_name,
      email_address,
      password: hashedPassword,
      user_type,
      auth_type: body.auth_type || 'email',
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
      is_online: body.is_online || false,
      is_verified: body.is_verified !== undefined ? body.is_verified : true,
      qualifications: body.qualifications || [],
      skills: body.skills || [],
      commission_rates: body.commission_rates || {
        call_rate: 0,
        chat_rate: 0,
        video_rate: 0
      },
      wallet_balance: 0,
      total_sessions: 0,
      total_earnings: 0,
      rating: 0,
      reviews_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null
    };

    // Insert the user
    const result = await usersCollection.insertOne(userData);

    if (result.insertedId) {
      // Return success response without sensitive data
      const userResponse = omit(userData, ['password']);
      
      return NextResponse.json({
        message: 'User created successfully',
        user: {
          ...userResponse,
          _id: result.insertedId
        }
      }, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

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