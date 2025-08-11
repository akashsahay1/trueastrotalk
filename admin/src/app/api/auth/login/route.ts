import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, email_address, auth_type, google_access_token, google_photo_url, google_display_name } = body;
    
    // Support both old admin format (email) and new mobile format (email_address)
    const userEmail = email_address || email;
    
    if (!userEmail) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing credentials',
          message: 'Email address is required' 
        },
        { status: 400 }
      );
    }

    // For email auth, password is required
    if (auth_type === 'email' || !auth_type) {
      if (!password) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Missing credentials',
            message: 'Password is required for email authentication' 
          },
          { status: 400 }
        );
      }
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Determine if this is admin or mobile login based on request
    const isAdminLogin = email && !email_address; // Old admin format uses 'email' field
    
    let userQuery;
    if (isAdminLogin) {
      // Admin login - only administrators
      userQuery = {
        email_address: userEmail,
        user_type: 'administrator',
        account_status: 'active'
      };
    } else {
      // Mobile login - customers and astrologers
      userQuery = {
        email_address: userEmail,
        user_type: { $in: ['customer', 'astrologer'] },
        account_status: { $ne: 'banned' }
      };
    }

    const user = await usersCollection.findOne(userQuery);

    if (!user) {
      await client.close();
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid credentials',
          message: isAdminLogin ? 'Invalid credentials' : 'Email or password is incorrect' 
        },
        { status: 401 }
      );
    }

    // Verify authentication based on auth_type
    if (user.auth_type === 'google' && auth_type === 'google') {
      // For Google OAuth users, validate the Google access token
      if (!google_access_token) {
        await client.close();
        return NextResponse.json(
          { 
            success: false,
            error: 'Missing Google token',
            message: 'Google access token is required for Google authentication' 
          },
          { status: 401 }
        );
      }
      // Skip password verification for Google users
      console.log(`✅ Google user ${user.email_address} authenticated successfully`);
    } else if (auth_type === 'google' && google_access_token) {
      // User is trying to login with Google but their account is email-based
      // Automatically update their auth_type to Google and login
      console.log(`🔄 Migrating user ${user.email_address} from email to Google auth`);
      
      // Update user to support Google authentication
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            auth_type: 'google',
            google_access_token: google_access_token,
            updated_at: new Date()
          }
        }
      );
      
      // Update the user object for response
      user.auth_type = 'google';
      user.google_access_token = google_access_token;
      
      // Skip password verification since we're now using Google auth
    } else {
      // For email users, verify password
      if (!password) {
        await client.close();
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid credentials',
            message: 'Password is required for email authentication' 
          },
          { status: 401 }
        );
      }
      
      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        await client.close();
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid credentials',
            message: isAdminLogin ? 'Invalid credentials' : 'Email or password is incorrect' 
          },
          { status: 401 }
        );
      }
    }

    // Create JWT token with appropriate expiry
    const tokenExpiry = isAdminLogin ? '24h' : '30d'; // Admin: 24h, Mobile: 30d
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email_address,
      full_name: user.full_name,
      user_type: user.user_type,
      account_status: user.account_status
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(tokenExpiry)
      .sign(JWT_SECRET);

    // Update user's online status and Google profile data if applicable
    const updateData: {
      is_online: boolean;
      updated_at: Date;
      profile_image?: string;
      full_name?: string;
    } = { 
      is_online: true,
      updated_at: new Date()
    };

    // If this is a Google user login, update their profile image and display name
    if (user.auth_type === 'google' && auth_type === 'google') {
      if (google_photo_url) {
        updateData.profile_image = google_photo_url;
        console.log(`📸 Updated Google profile image for ${userEmail}: ${google_photo_url}`);
      }
      if (google_display_name && google_display_name !== user.full_name) {
        updateData.full_name = google_display_name;
        console.log(`👤 Updated Google display name for ${userEmail}: ${google_display_name}`);
      }
    }

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: updateData }
    );

    await client.close();

    if (isAdminLogin) {
      // Admin response format with cookie
      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          full_name: user.full_name,
          email: user.email_address,
          user_type: user.user_type
        }
      });

      // Set HTTP-only cookie for admin
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      return response;
    } else {
      // Mobile response format with token in body
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id.toString(),
            full_name: user.full_name,
            email_address: user.email_address,
            phone_number: user.phone_number,
            user_type: user.user_type,
            account_status: user.account_status,
            verification_status: user.verification_status,
            auth_type: user.auth_type,
            profile_image: user.profile_image || '',
            wallet_balance: user.wallet_balance || 0,
            is_verified: user.is_verified || false,
            // Birth information
            date_of_birth: user.date_of_birth || '',
            birth_time: user.birth_time || '',
            birth_place: user.birth_place || '',
            // Additional fields for completeness
            created_at: user.created_at,
            updated_at: user.updated_at
          },
          token
        }
      });
    }

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during login' 
      },
      { status: 500 }
    );
  }
}