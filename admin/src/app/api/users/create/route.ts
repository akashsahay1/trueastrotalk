import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

import crypto from 'crypto';
import { omit } from '@/utils/omit';
import { emailService } from '@/lib/email-service';
import { withSecurity, SecurityPresets, AuthenticatedNextRequest, getRequestBody } from '@/lib/api-security';
import { generateUserId } from '@/lib/custom-id';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const POST = withSecurity(async (request: AuthenticatedNextRequest) => {
  try {
    const body = await getRequestBody(request);

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const {
      full_name,
      email_address,
      password,
      user_type,
      phone_number,
      gender
    } = body;

    // Basic validation for all user types
    if (!full_name || !email_address || !user_type) {
      return NextResponse.json(
        { error: 'Missing required fields (full_name, email_address, user_type)' },
        { status: 400 }
      );
    }

    // Password is required ONLY for admin and manager
    if ((user_type === 'administrator' || user_type === 'manager') && !password) {
      return NextResponse.json(
        { error: 'Password is required for administrator and manager accounts' },
        { status: 400 }
      );
    }

    // Phone number and gender are required for customers and astrologers
    if ((user_type === 'customer' || user_type === 'astrologer') && (!phone_number || !gender)) {
      return NextResponse.json(
        { error: 'Phone number and gender are required for customer and astrologer accounts' },
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
        call_rate,
        chat_rate,
        video_rate,
        pan_card_id,
        bank_details
      } = body;

      if (!address || !city || !state || !country || !zip) {
        return NextResponse.json(
          { error: 'Address details are required for astrologer account' },
          { status: 400 }
        );
      }

      if (!call_rate || call_rate <= 0 || !chat_rate || chat_rate <= 0 || !video_rate || video_rate <= 0) {
        return NextResponse.json(
          { error: 'Valid rates (call, chat, video) are required for astrologer account' },
          { status: 400 }
        );
      }

      if (!pan_card_id) {
        return NextResponse.json(
          { error: 'PAN card is required for astrologer account' },
          { status: 400 }
        );
      }

      if (!bank_details || !bank_details.account_holder_name || !bank_details.account_number ||
          !bank_details.bank_name || !bank_details.ifsc_code) {
        return NextResponse.json(
          { error: 'Bank details are required for astrologer account' },
          { status: 400 }
        );
      }
    }

        const usersCollection = await DatabaseService.getCollection('users');

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

    // Hash the password only if provided (required for admin/manager, optional for others)
    const hashedPassword = password ? hashPassword(password) : null;

    // Prepare user data
    const userData = {
      user_id: generateUserId(),
      profile_image: body.profile_image_id || body.profile_image || '',
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
      is_featured: body.is_featured || false,
      bio: body.bio || '',
      experience_years: body.experience_years || 0,
      languages: body.languages || [],
      qualifications: body.qualifications || [],
      skills: body.skills || [],
      pan_card_id: body.pan_card_id || '',
      bank_details: body.bank_details || {
        account_holder_name: '',
        account_number: '',
        bank_name: '',
        ifsc_code: ''
      },
      // Service rates charged to customers
      call_rate: body.call_rate || 0,
      chat_rate: body.chat_rate || 0,
      video_rate: body.video_rate || 0,
      wallet_balance: 0,
      // Commission percentage (platform takes this %)
      commission_percentage: body.commission_percentage || {
        call: 25,
        chat: 25,
        video: 25
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
      ]).then(([_welcomeSent, _adminNotificationSent]) => {
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
  }
}, SecurityPresets.admin);