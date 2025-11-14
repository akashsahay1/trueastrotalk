import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/otp';
import { generateUserId } from '@/lib/custom-id';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phone_number,
      full_name,
      user_type,
      date_of_birth,
      time_of_birth,
      place_of_birth,
      gender,
    } = body;


    // Validate required fields
    if (!phone_number || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Phone number and name are required' },
        { status: 400 }
      );
    }

    // Validate user type (phone signup is always customer)
    const validUserTypes = ['customer'];
    const userType = user_type?.toLowerCase() || 'customer';
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone signup is only available for customers. Please use email signup for astrologer registration.',
        },
        { status: 400 }
      );
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phone_number);
    if (!isValidPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const usersCollection = await DatabaseService.getCollection('users');

    // Check if phone is verified
    const verifiedRecord = await usersCollection.findOne({
      phone_number: formattedPhone,
      phone_verified: true,
    });

    if (!verifiedRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number not verified. Please verify your phone first.',
        },
        { status: 400 }
      );
    }

    // Check if user already has a complete account
    if (verifiedRecord.user_id && verifiedRecord.full_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account already exists with this phone number. Please login instead.',
        },
        { status: 400 }
      );
    }

    // Generate user ID
    const userId = generateUserId();
    const now = new Date();

    // Generate placeholder email for phone users to satisfy unique index
    const placeholderEmail = `${formattedPhone.replace(/\+/g, '')}@phone.trueastrotalk.com`;

    // Prepare user data
    const userData: Record<string, unknown> = {
      user_id: userId,
      full_name: full_name.trim(),
      email_address: placeholderEmail, // Placeholder email for phone users
      user_type: userType,
      auth_type: 'phone',
      account_status: 'active',
      verification_status: userType === 'customer' ? 'verified' : 'pending',
      email_verified: false,
      phone_verified: true,
      is_online: false,
      is_active: true,
      wallet_balance: 0,
      created_at: now,
      updated_at: now,
      // Clear OTP-related fields
      otp_code: null,
      otp_expiry: null,
      otp_attempts: 0,
      otp_request_count: 0,
      otp_last_request_time: null,
    };

    // Add optional birth details if provided
    if (date_of_birth) {
      userData.date_of_birth = new Date(date_of_birth);
    }
    if (time_of_birth) {
      userData.time_of_birth = time_of_birth;
    }
    if (place_of_birth) {
      userData.place_of_birth = place_of_birth;
    }
    if (gender) {
      userData.gender = gender;
    }

    // Update the verified record to create full user account
    await usersCollection.updateOne(
      { phone_number: formattedPhone },
      { $set: userData }
    );

    // Fetch the complete user record
    const user = await usersCollection.findOne({ user_id: userId });

    if (!user) {
      throw new Error('Failed to create user account');
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        userId: user.user_id,
        userType: user.user_type,
        email: user.email_address || null,
        phone: user.phone_number,
      },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.user_id,
        userType: user.user_type,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '180d' }
    );

    // Prepare user response
    const userResponse = {
      user_id: user.user_id,
      full_name: user.full_name,
      email_address: user.email_address,
      phone_number: user.phone_number,
      user_type: user.user_type,
      auth_type: user.auth_type,
      account_status: user.account_status,
      verification_status: user.verification_status,
      phone_verified: user.phone_verified,
      email_verified: user.email_verified || false,
      is_active: user.is_active,
      is_online: user.is_online,
      wallet_balance: user.wallet_balance || 0,
      created_at: user.created_at,
      // Include birth details
      date_of_birth: user.date_of_birth ? user.date_of_birth.toISOString() : null,
      time_of_birth: user.time_of_birth || null,
      place_of_birth: user.place_of_birth || null,
      gender: user.gender || null,
    };


    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: userResponse,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
    });
  } catch (error) {
    console.error('❌ Error in phone signup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
