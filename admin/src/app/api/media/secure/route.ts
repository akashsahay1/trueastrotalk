import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import DatabaseService from '@/lib/database';
import { SecurityMiddleware } from '@/lib/security';

// Sensitive file types that require authentication
const SENSITIVE_FILE_TYPES = ['pan_card', 'id_proof', 'bank_document', 'aadhaar'];

// GET - Serve media file with access control
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json({
        success: false,
        error: 'Media ID required'
      }, { status: 400 });
    }

    const mediaCollection = await DatabaseService.getCollection('media');

    // Find the media file
    let mediaFile = null;
    if (mediaId.startsWith('media_')) {
      mediaFile = await mediaCollection.findOne({ media_id: mediaId });
    } else if (mediaId.match(/^[a-fA-F0-9]{24}$/)) {
      const { ObjectId } = await import('mongodb');
      mediaFile = await mediaCollection.findOne({ _id: new ObjectId(mediaId) });
    }

    if (!mediaFile) {
      return NextResponse.json({
        success: false,
        error: 'Media not found'
      }, { status: 404 });
    }

    // Check if this is a sensitive file type
    const isSensitive = SENSITIVE_FILE_TYPES.includes(mediaFile.file_type);

    if (isSensitive) {
      // Authenticate user for sensitive files
      let authenticatedUser;
      try {
        authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
      } catch {
        return NextResponse.json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to access sensitive files'
        }, { status: 401 });
      }

      // Check access permissions
      const userId = authenticatedUser._id || authenticatedUser.user_id || authenticatedUser.userId;
      const isOwner = mediaFile.uploaded_by === userId?.toString() ||
                      mediaFile.associated_record === userId?.toString();
      const isAdmin = authenticatedUser.user_type === 'administrator';

      if (!isOwner && !isAdmin) {
        return NextResponse.json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'You do not have permission to access this file'
        }, { status: 403 });
      }
    }

    // Serve the file
    const filePath = path.join(process.cwd(), 'public', mediaFile.file_path);

    if (!existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: 'File not found on disk'
      }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const mimeType = mediaFile.mime_type || 'application/octet-stream';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${mediaFile.original_name || mediaFile.filename}"`,
        'Cache-Control': isSensitive ? 'no-store, no-cache, must-revalidate' : 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Error serving secure media:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
