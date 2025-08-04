import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { jwtVerify } from 'jose';
import { MongoClient, ObjectId } from 'mongodb';
import { envConfig } from '@/lib/env-config';

const JWT_SECRET = new TextEncoder().encode(envConfig.JWT_SECRET);
const MONGODB_URL = envConfig.MONGODB_URL;
const DB_NAME = envConfig.DB_NAME;

async function verifyAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const payload = await verifyAuthToken(request);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('profile_image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - be more flexible with MIME types
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/heic', // iOS HEIC format
      'image/heif', // iOS HEIF format
    ];
    
    // Also check file extension as fallback
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    
    const isValidMimeType = allowedTypes.includes(file.type.toLowerCase());
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
    
    // Debug logging
    console.log('Upload Debug Info:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      extension: fileExtension,
      isValidMimeType,
      isValidExtension
    });
    
    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Received: ${file.type}. Only JPEG, PNG, WebP, and HEIC are allowed.` },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Get current date for directory structure (same as media library)
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Generate unique filename with ta- prefix (consistent with media library)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.name);
    const filename = `ta-${timestamp}${randomString}${extension}`;
    
    // Create uploads directory with year/month structure (same as media library)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to public/uploads/YYYY/MM/ directory
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate URL path (consistent with media library)
    const imageUrl = `/uploads/${year}/${month}/${filename}`;

    // Update user profile in database and add to media library
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const mediaCollection = db.collection('media_files');

    // Add file to media library (consistent with admin media uploads)
    const fileData = {
      filename,
      original_name: file.name,
      file_path: imageUrl,
      file_size: file.size,
      mime_type: file.type,
      file_type: 'profile_image',
      uploaded_by: userId,
      associated_record: userId, // Link to user record
      is_external: false, // This is an internal upload
      uploaded_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    await mediaCollection.insertOne(fileData);

    // Update user profile with new image
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          profile_image: imageUrl,
          updated_at: new Date()
        }
      }
    );

    await client.close();

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      image_url: imageUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}