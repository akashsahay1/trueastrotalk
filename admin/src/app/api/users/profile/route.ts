import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// Helper function to resolve profile image to full URL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProfileImage(user: Record<string, unknown>, mediaCollection: any, baseUrl: string): Promise<string> {
  // Priority 1: If user has profile_image_id, resolve from media library
  if (user.profile_image_id && typeof user.profile_image_id === 'string' && ObjectId.isValid(user.profile_image_id)) {
    try {
      const mediaFile = await mediaCollection.findOne({ 
        _id: new ObjectId(user.profile_image_id) 
      });
      
      if (mediaFile) {
        return `${baseUrl}${mediaFile.file_path}`;
      }
    } catch (error) {
      console.error('Error resolving media file:', error);
    }
  }
  
  // Priority 2: Direct profile_image URL
  if (user.profile_image && typeof user.profile_image === 'string') {
    if (user.profile_image.startsWith('/')) {
      return `${baseUrl}${user.profile_image}`;
    }
    return user.profile_image;
  }
  
  // Priority 3: profile_picture URL (fallback)
  if (user.profile_picture && typeof user.profile_picture === 'string') {
    if (user.profile_picture.startsWith('/')) {
      return `${baseUrl}${user.profile_picture}`;
    }
    return user.profile_picture;
  }
  
  // Default fallback image
  return `${baseUrl}/assets/images/avatar-1.jpg`;
}

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
    const mediaCollection = db.collection('media_files');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(payload.userId as string) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      await client.close();
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        message: 'User account no longer exists' 
      }, { status: 404 });
    }

    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);
    
    // Resolve profile image to full URL
    const profileImageUrl = await resolveProfileImage(user, mediaCollection, baseUrl);

    await client.close();

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
        profile_image: profileImageUrl, // Return full URL instead of relative path
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

// PUT update user profile (handles both JSON data and file uploads)
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

    const contentType = request.headers.get('content-type');
    let updateData: Record<string, unknown> = {};
    let profileImageFile: File | null = null;

    // Handle both JSON and FormData
    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with potential file upload
      const formData = await request.formData();
      
      // Extract profile image file if present
      profileImageFile = formData.get('profile_image') as File;
      
      // Extract other form fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'profile_image') {
          updateData[key] = value.toString();
        }
      }
    } else {
      // Handle JSON data
      updateData = await request.json();
    }
    
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

    // Handle profile image upload if present
    let imageUrl: string | null = null;
    if (profileImageFile && profileImageFile.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const fileExtension = profileImageFile.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      
      const isValidMimeType = allowedTypes.includes(profileImageFile.type.toLowerCase());
      const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
      
      if (!isValidMimeType && !isValidExtension) {
        return NextResponse.json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed.'
        }, { status: 400 });
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (profileImageFile.size > maxSize) {
        return NextResponse.json({
          success: false,
          error: 'File too large. Maximum size is 5MB.'
        }, { status: 400 });
      }

      // Generate file path
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = Date.now();
      const extension = path.extname(profileImageFile.name);
      const filename = `ta-${timestamp}${extension}`;
      
      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const filepath = path.join(uploadDir, filename);
      const bytes = await profileImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      imageUrl = `/uploads/${year}/${month}/${filename}`;
      updateData.profile_image = imageUrl;
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const mediaCollection = db.collection('media_files');

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

    // Add image to media library if uploaded
    if (imageUrl && profileImageFile) {
      const fileData = {
        filename: path.basename(imageUrl),
        original_name: profileImageFile.name,
        file_path: imageUrl,
        file_size: profileImageFile.size,
        mime_type: profileImageFile.type,
        file_type: 'profile_image',
        uploaded_by: payload.userId as string,
        associated_record: payload.userId as string,
        is_external: false,
        uploaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      await mediaCollection.insertOne(fileData);
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(payload.userId as string) },
      { projection: { password: 0 } }
    );

    if (!updatedUser) {
      await client.close();
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        message: 'User account no longer exists' 
      }, { status: 404 });
    }

    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);
    
    // Resolve profile image to full URL
    const profileImageUrl = await resolveProfileImage(updatedUser, mediaCollection, baseUrl);

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
        profile_image: profileImageUrl, // Return full URL instead of relative path
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