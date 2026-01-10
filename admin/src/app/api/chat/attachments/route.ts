import { NextRequest, NextResponse } from 'next/server';
import { UploadService } from '@/lib/upload-service';
import DatabaseService from '@/lib/database';
import { SecurityMiddleware } from '@/lib/security';
import { ObjectId } from 'mongodb';

/**
 * POST /api/chat/attachments
 * Upload an image attachment for chat
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user using SecurityMiddleware
    let authenticatedUser;
    try {
      authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('session_id') as string | null;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'NO_FILE',
        message: 'No file provided'
      }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'NO_SESSION',
        message: 'Session ID is required'
      }, { status: 400 });
    }

    // Verify the session exists and user is part of it
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const session = await sessionsCollection.findOne({
      _id: new ObjectId(sessionId),
      $or: [
        { user_id: authenticatedUser.userId },
        { astrologer_id: authenticatedUser.userId }
      ]
    });

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Chat session not found or access denied'
      }, { status: 404 });
    }

    // Upload the file
    const uploadResult = await UploadService.uploadFile({
      file,
      fileType: 'chat_attachment',
      uploadedBy: authenticatedUser.userId as string,
      associatedRecord: sessionId
    });

    if (!uploadResult.success) {
      return NextResponse.json({
        success: false,
        error: 'UPLOAD_FAILED',
        message: uploadResult.error || 'Failed to upload file'
      }, { status: 500 });
    }

    // Return relative path - Flutter app will construct full URL using its own config
    // This ensures the URL works on both Android/iOS in local testing and production
    const relativePath = uploadResult.file_path;

    // Note: Message is NOT saved here - it will be saved when the client
    // sends the image message via socket (to avoid duplicates)

    console.log(`📎 Chat attachment uploaded: ${relativePath} for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        image_url: relativePath,
        file_path: relativePath,
        file_id: uploadResult.file_id
      }
    });

  } catch (error) {
    console.error('Chat attachment upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to upload attachment'
    }, { status: 500 });
  }
}
