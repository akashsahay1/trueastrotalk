import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, SecurityPresets } from '@/lib/api-security';
import DatabaseService from '@/lib/database';
import { access } from 'fs/promises';
import path from 'path';

// POST - Cleanup all orphaned media records (where physical file is missing)
async function handlePOST(request: NextRequest) {
  try {
    const mediaCollection = await DatabaseService.getCollection('media');

    // Get all media records
    const allFiles = await mediaCollection.find({}).toArray();

    const orphanedFiles = [];
    const cleanedUp = [];

    // Check each file to see if physical file exists
    for (const file of allFiles) {
      try {
        const filePath = path.join(process.cwd(), 'public', file.file_path);
        await access(filePath);
        // File exists, skip
      } catch {
        // File doesn't exist - this is orphaned
        orphanedFiles.push(file);
      }
    }

    // Delete orphaned records from database
    for (const orphanedFile of orphanedFiles) {
      try {
        const deleteQuery = orphanedFile.media_id
          ? { media_id: orphanedFile.media_id }
          : { _id: orphanedFile._id };

        const result = await mediaCollection.deleteOne(deleteQuery);
        if (result.deletedCount > 0) {
          cleanedUp.push({
            media_id: orphanedFile.media_id || orphanedFile._id.toString(),
            file_name: orphanedFile.file_name || orphanedFile.original_name,
            file_path: orphanedFile.file_path
          });
        }
      } catch (deleteError) {
        console.error('Error deleting orphaned record:', deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedUp.length} orphaned record(s)`,
      orphaned_found: orphanedFiles.length,
      cleaned_up: cleanedUp.length,
      cleaned_files: cleanedUp
    });

  } catch (error) {
    console.error('Error cleaning up orphaned records:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while cleaning up orphaned records'
    }, { status: 500 });
  }
}

// Export secured handler with admin-only access
export const POST = withSecurity(handlePOST, SecurityPresets.admin);
