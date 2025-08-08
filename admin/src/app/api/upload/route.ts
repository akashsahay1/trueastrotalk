import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('file_type') as string || 'general';
    const uploadedBy = formData.get('uploaded_by') as string || null;
    const associatedRecord = formData.get('associated_record') as string || null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type - be more flexible like profile image upload
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/heic', 
      'image/heif', 
    ];
    
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    
    const isValidMimeType = allowedTypes.includes(file.type.toLowerCase());
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
    
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
        { success: false, error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Get current date for directory structure
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Create directory path like WordPress: /public/uploads/2025/07/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate simple filename: ta-timestamp.extension
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const fileName = `ta-${timestamp}${extension}`;
    
    // Full file path
    const filePath = path.join(uploadDir, fileName);
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    
    // Return the public URL path
    const publicUrl = `/uploads/${year}/${month}/${fileName}`;

    // Save to media library in database (consistent with other uploads)
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media_files');

    const fileData = {
      filename: fileName,
      original_name: file.name,
      file_path: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      file_type: fileType,
      uploaded_by: uploadedBy,
      associated_record: associatedRecord,
      is_external: false, // This is an internal upload
      uploaded_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await mediaCollection.insertOne(fileData);
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: publicUrl,
      filename: fileName,
      size: file.size,
      type: file.type,
      file_id: result.insertedId
    });

  } catch(error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}