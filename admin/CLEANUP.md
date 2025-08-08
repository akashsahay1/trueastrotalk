# File Cleanup System

This document describes the comprehensive file cleanup system implemented in True AstroTalk to prevent orphaned files and manage storage efficiently.

## Overview

The file cleanup system consists of:
1. **Automatic cleanup** when users/products are deleted
2. **Profile image cleanup** when images are updated  
3. **Orphaned file detection and cleanup** for existing orphaned files
4. **Admin interface** for manual cleanup management

## Features

### 🔄 Automatic Cleanup (Preventive)

**When users are deleted** (`DELETE /api/users/{id}`):
- ✅ Deletes profile images from filesystem
- ✅ Removes all associated media library files
- ✅ Cleans up database media records
- ✅ Handles errors gracefully

**When profile images are updated** (`PUT /api/users/profile`):
- ✅ Automatically deletes old profile image
- ✅ Saves new profile image
- ✅ Updates database references
- ✅ Prevents accumulation of unused images

### 🧹 Orphaned File Cleanup (Remedial)

**Detects orphaned files by checking**:
- User profile images (`users.profile_image`)
- Media library files (`media_files.file_path`)
- Product images (`products.image_url` and `products.images`)

**Safe cleanup process**:
- Scans entire `/uploads` directory recursively
- Cross-references with database records
- Identifies files with no database references
- Provides dry-run mode for safety
- Reports space savings and errors

## Usage

### 🖥️ Admin Web Interface

Visit `/admin/maintenance/file-cleanup` to:
- Analyze orphaned files
- Preview cleanup actions (dry run)
- Delete orphaned files with confirmation
- View cleanup results and statistics

### 🔧 Command Line Scripts

**Analyze orphaned files:**
```bash
cd admin
node src/scripts/cleanup-orphaned-files.js --analyze
```

**Preview cleanup (dry run):**
```bash
node src/scripts/cleanup-orphaned-files.js
```

**Actually delete orphaned files:**
```bash
node src/scripts/cleanup-orphaned-files.js --delete
```

### 🌐 API Endpoints

**Get orphaned files analysis:**
```http
GET /api/admin/cleanup/orphaned-files
```

**Preview cleanup:**
```http
DELETE /api/admin/cleanup/orphaned-files?dry-run=true
```

**Delete orphaned files:**
```http
DELETE /api/admin/cleanup/orphaned-files?confirm=true
```

## File Structure

```
admin/
├── src/
│   ├── lib/
│   │   └── file-cleanup.ts           # Core cleanup utilities
│   ├── app/
│   │   ├── api/
│   │   │   ├── users/[id]/route.ts   # Enhanced user deletion
│   │   │   ├── users/profile/route.ts # Enhanced profile updates
│   │   │   └── admin/cleanup/
│   │   │       └── orphaned-files/   # Cleanup API endpoints
│   │   └── admin/maintenance/
│   │       └── file-cleanup/page.tsx # Admin web interface
│   └── scripts/
│       ├── cleanup-orphaned-files.js # Standalone cleanup script
│       └── test-file-cleanup.js      # Test and demo script
└── CLEANUP.md                        # This documentation
```

## Utility Functions

### Core Functions (`src/lib/file-cleanup.ts`)

```typescript
// Delete single file
deleteFile(filePath: string, options?: FileCleanupOptions): Promise<boolean>

// Delete multiple files
deleteFiles(filePaths: string[], options?: FileCleanupOptions): Promise<number>

// Clean up all files for a user
cleanupUserFiles(userId: string, options?: FileCleanupOptions): Promise<void>

// Find orphaned files
findOrphanedFiles(options?: FileCleanupOptions): Promise<{
  orphanedFiles: string[];
  totalFiles: number;
  referencedFiles: string[];
}>

// Clean up orphaned files
cleanupOrphanedFiles(options?: FileCleanupOptions): Promise<{
  deletedCount: number;
  failedCount: number;
  totalSize: number;
  errors: string[];
}>
```

### Options Interface

```typescript
interface FileCleanupOptions {
  deleteFromFilesystem?: boolean;  // Actually delete files (default: true)
  deleteFromDatabase?: boolean;    // Remove DB records (default: true)
  logActivity?: boolean;           // Log operations (default: true)
}
```

## Safety Features

### 🛡️ Built-in Protections

- **Dry run mode**: Preview changes before execution
- **Database verification**: Cross-check all references before deletion
- **Error handling**: Continue operation even if individual files fail
- **Confirmation required**: API requires explicit confirmation for deletion
- **Logging**: Comprehensive logging of all operations
- **Graceful failures**: File cleanup errors don't prevent user/product deletion

### 📊 Comprehensive Reporting

- Total files scanned
- Referenced files found
- Orphaned files identified
- Space that will be/was freed
- Individual file errors
- Operation success/failure statistics

## Example Output

```
🧹 True AstroTalk - Orphaned Files Cleanup Tool

🔍 Scanning uploads directory for files...
📂 Found 88 files in uploads directory
👤 Checking user profile images...
   Found 19 users with profile images
📁 Checking media library files...
   Found 1 files in media library
🛍️ Checking product images...
   Found 0 products with images

📊 Analysis Results:
   📂 Total files in uploads: 88
   🔗 Referenced files: 19
   🗑️ Orphaned files: 87

🧹 Cleanup completed:
   ✅ Deleted: 87 files
   ❌ Failed: 0 files
   💾 Space freed: 3.98 MB
```

## Integration

The cleanup system is fully integrated into existing workflows:

- User deletion automatically triggers file cleanup
- Profile image updates automatically clean old images
- Media library tracks file usage across the system
- Admin interface provides manual oversight
- API endpoints allow programmatic access

## Best Practices

1. **Always run analysis first** to understand what will be deleted
2. **Use dry-run mode** before actual deletion
3. **Backup important files** before cleanup operations
4. **Monitor cleanup logs** for any recurring issues
5. **Run periodic cleanup** to prevent file accumulation
6. **Review orphaned files** before deletion to ensure safety

## Troubleshooting

**If files aren't being detected as orphaned:**
- Check database field names match the cleanup logic
- Verify file paths in database use consistent format (`/uploads/...`)
- Ensure external files are marked with `is_external: true`

**If cleanup fails:**
- Check file permissions on uploads directory
- Verify MongoDB connection
- Review error logs for specific file issues
- Try dry-run mode to identify problems

**If performance is slow:**
- Consider adding database indexes on file path fields
- Run cleanup during off-peak hours
- Process files in smaller batches for very large directories

## Future Enhancements

- **Scheduled cleanup**: Automatic periodic orphaned file cleanup
- **File age filtering**: Only clean files older than X days
- **Storage analytics**: Detailed storage usage reporting
- **Backup integration**: Backup files before deletion
- **Restore functionality**: Ability to restore recently deleted files