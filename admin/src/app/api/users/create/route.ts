import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { omit } from '@/utils/omit';
import { envConfig, envHelpers } from '@/lib/env-config';
import { emailService } from '@/lib/email-service';
import { withSecurity, SecurityPresets } from '@/lib/api-security';
import { generateUserId } from '@/lib/custom-id';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const POST = withSecurity(async (request: NextRequest) => {
  const client = new MongoClient(envHelpers.getDatabaseUrl());
  
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
    }

    await client.connect();
    const db = client.db(envConfig.DB_NAME);
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
      user_id: generateUserId(),
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
      verification_status: body.verification_status || 'pending',
      verification_status_message: body.verification_status_message || '',
      verified_at: body.verification_status === 'verified' ? new Date() : null,
      verified_by: body.verification_status === 'verified' ? 'admin' : null,
      qualifications: body.qualifications || [],
      skills: body.skills || [],
      // Service rates charged to customers
      call_rate: body.call_rate || 50,
      chat_rate: body.chat_rate || 30,
      video_rate: body.video_rate || 80,
      wallet_balance: 0,
      // Commission percentage that astrologer receives
      commission_percentage: {
        call: 70,  // Astrologer gets 70% of call revenue
        chat: 65,  // Astrologer gets 65% of chat revenue
        video: 75  // Astrologer gets 75% of video revenue
      },
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
      // Prepare user object for email templates
      const newUser = {
        ...userData,
        _id: result.insertedId,
        name: full_name,
        email: email_address,
        phone: phone_number,
        role: user_type,
        createdAt: userData.created_at
      };

      // Send emails asynchronously (don't block the response)
      Promise.all([
        // Send welcome email to the user
        emailService.sendWelcomeEmail(newUser),
        // Send admin notification email
        emailService.sendAdminSignupNotification(newUser)
      ]).then(([welcomeSent, adminNotificationSent]) => {
      }).catch(error => {
        console.error('Error sending emails:', error);
      });

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
}, SecurityPresets.admin);