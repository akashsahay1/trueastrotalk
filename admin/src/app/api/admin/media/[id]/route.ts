import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

import { unlink, access } from 'fs/promises';
import path from 'path';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

// DELETE - Delete media file (internal handler)
async function handleDELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  try {
    const { id } = await params;
    console.log(`[DELETE] Attempting to delete media with ID: ${id}`);

    const mediaCollection = await DatabaseService.getCollection('media');

    // Get file info before deleting - only support custom media_id
    let fileInfo;
    let deleteQuery;

    // Check if it's our custom media ID format
    if (id.startsWith('media_')) {
      fileInfo = await mediaCollection.findOne({ media_id: id });
      deleteQuery = { media_id: id };
      console.log(`[DELETE] Found file info:`, fileInfo ? 'Yes' : 'No');
    } else {
      console.log(`[DELETE] Invalid ID format: ${id}`);
      return NextResponse.json({
        success: false,
        error: 'Invalid file ID format - must be custom media_id'
      }, { status: 400 });
    }

    if (!fileInfo) {
      console.log(`[DELETE] File not found in database: ${id}`);
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Check if physical file exists
    const filePath = path.join(process.cwd(), 'public', fileInfo.file_path);
    let fileExists = false;
    try {
      await access(filePath);
      fileExists = true;
      console.log(`[DELETE] Physical file exists: ${filePath}`);
    } catch {
      // File doesn't exist on disk
      fileExists = false;
      console.log(`[DELETE] Physical file not found: ${filePath} - will clean up orphaned record`);
    }

    // Delete MongoDB record (whether file exists or not)
    console.log(`[DELETE] Deleting from database with query:`, deleteQuery);
    const result = await mediaCollection.deleteOne(deleteQuery);
    console.log(`[DELETE] Database deletion result:`, result.deletedCount);

    if (result.deletedCount === 0) {
      console.log(`[DELETE] Failed to delete from database`);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete',
        message: 'File could not be deleted from database'
      }, { status: 400 });
    }

    // Delete physical file if it exists
    if (fileExists) {
      try {
        await unlink(filePath);
        console.log(`[DELETE] Physical file deleted successfully`);
      } catch (fileError) {
        console.error('[DELETE] Error deleting physical file:', fileError);
        // Record already deleted from DB, so return success with warning
        return NextResponse.json({
          success: true,
          message: 'Database record deleted, but physical file deletion failed',
          warning: 'Physical file may need manual cleanup'
        });
      }
    }

    const successMessage = fileExists
      ? 'File deleted successfully'
      : 'Orphaned record cleaned up successfully (file was already missing from disk)';

    console.log(`[DELETE] Success:`, successMessage);

    return NextResponse.json({
      success: true,
      message: successMessage
    });

  } catch(error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting the file'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
// Wrapper to handle Next.js context parameter
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const securedHandler = withSecurity(
    async (req: NextRequest) => handleDELETE(req, context),
    SecurityPresets.admin
  );
  return securedHandler(request);
}