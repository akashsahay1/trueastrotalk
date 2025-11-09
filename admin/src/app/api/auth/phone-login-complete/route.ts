import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/otp';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number } = body;


    // Validate required fields
    if (!phone_number) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
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
    const user = await usersCollection.findOne({
      phone_number: formattedPhone,
      phone_verified: true,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found or phone not verified.',
        },
        { status: 404 }
      );
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
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.user_id,
        userType: user.user_type,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
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
      message: 'Login successful',
      user: userResponse,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
    });
  } catch (error) {
    console.error('❌ Error in phone login complete:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
