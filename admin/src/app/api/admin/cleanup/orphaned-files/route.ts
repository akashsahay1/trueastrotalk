import { NextRequest, NextResponse } from 'next/server';
import { findOrphanedFiles, cleanupOrphanedFiles } from '@/lib/file-cleanup';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

async function handleGET() {
  try {
    // Find orphaned files without deleting them (dry run)
    const result = await findOrphanedFiles({ 
      logActivity: false // Don't spam console in API
    });

    return NextResponse.json({
      success: true,
      message: 'Orphaned files analysis completed',
      data: {
        totalFiles: result.totalFiles,
        referencedFiles: result.referencedFiles.length,
        orphanedFiles: result.orphanedFiles.length,
        orphanedFilesList: result.orphanedFiles.slice(0, 50), // Limit to first 50 for display
        hasMore: result.orphanedFiles.length > 50
      }
    });

  } catch (error) {
    console.error('Error analyzing orphaned files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze orphaned files',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleDELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dry-run') === 'true';
    const confirm = url.searchParams.get('confirm') === 'true';

    if (!dryRun && !confirm) {
      return NextResponse.json({
        success: false,
        error: 'Missing confirmation',
        message: 'Add ?confirm=true to actually delete files, or ?dry-run=true to preview'
      }, { status: 400 });
    }

    // Run cleanup (dry run or actual deletion)
    const result = await cleanupOrphanedFiles({
      deleteFromFilesystem: !dryRun,
      logActivity: false
    });

    const message = dryRun 
      ? 'Dry run completed - no files were deleted'
      : 'Orphaned files cleanup completed';

    return NextResponse.json({
      success: true,
      message,
      isDryRun: dryRun,
      data: {
        deletedCount: result.deletedCount,
        failedCount: result.failedCount,
        totalSizeFreed: `${(result.totalSize / 1024 / 1024).toFixed(2)} MB`,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup orphaned files',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const GET = withSecurity(handleGET, SecurityPresets.admin);
export const DELETE = withSecurity(handleDELETE, SecurityPresets.admin);