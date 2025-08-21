import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
        message: 'Please select a file to upload'
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type',
        message: 'Only image files are allowed'
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File too large',
        message: 'File size should be less than 10MB'
      }, { status: 400 });
    }

    // Get current date for directory structure
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Generate simple filename: ta-timestamp.extension
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `ta-${timestamp}${extension}`;
    
    // Create uploads directory with year/month structure like WordPress
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', year, month);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Save file to public/uploads/YYYY/MM/ directory
    const filePath = path.join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Save file info to database
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media_files');

    const fileData = {
      filename,
      original_name: file.name,
      file_path: `/uploads/${year}/${month}/${filename}`,
      file_size: file.size,
      mime_type: file.type,
      file_type: 'admin_upload', // Admin uploaded file
      uploaded_by: null, // Could be extended to track admin user
      associated_record: null, // Could be linked to specific records later
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
      file_id: result.insertedId,
      file_path: `/uploads/${year}/${month}/${filename}`,
      filename
    }, { status: 201 });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while uploading the file'
    }, { status: 500 });
  }
}