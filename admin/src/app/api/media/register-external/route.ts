import { NextRequest, NextResponse } from 'next/server';
import { UploadService } from '@/lib/upload-service';

/**
 * API endpoint to register external images (like Google profile images) in media library
 * This is useful for tracking all images used in the platform, even external ones
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_url, original_name, file_type, uploaded_by, associated_record } = body;

    // Validate required fields
    if (!image_url) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'image_url is required'
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(image_url);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format',
        message: 'Please provide a valid image URL'
      }, { status: 400 });
    }

    // Register external image in media library
    const result = await UploadService.registerExternalImage({
      imageUrl: image_url,
      originalName: original_name || 'External Image',
      fileType: file_type || 'external',
      uploadedBy: uploaded_by || null,
      associatedRecord: associated_record || null
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Registration failed',
        message: result.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'External image registered successfully',
      file_id: result.file_id,
      file_path: result.file_path
    }, { status: 201 });

  } catch (error) {
    console.error('Register External Image Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while registering the external image'
    }, { status: 500 });
  }
}