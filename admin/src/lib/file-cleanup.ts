import { unlink, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export interface FileCleanupOptions {
  deleteFromFilesystem?: boolean;
  deleteFromDatabase?: boolean;
  logActivity?: boolean;
}

/**
 * Delete a single file from the filesystem
 */
export async function deleteFile(filePath: string, options: FileCleanupOptions = {}): Promise<boolean> {
  const { deleteFromFilesystem = true, logActivity = true } = options;
  
  if (!deleteFromFilesystem) return true;
  
  try {
    if (filePath && typeof filePath === 'string') {
      // Handle both absolute and relative paths
      const fullPath = filePath.startsWith('/') 
        ? path.join(process.cwd(), 'public', filePath)
        : filePath;
        
      if (existsSync(fullPath)) {
        await unlink(fullPath);
        if (logActivity) {
          console.log(`✅ Deleted file: ${filePath}`);
        }
        return true;
      }
    }
    return false;
  } catch (error) {
    if (logActivity) {
      console.warn(`⚠️ Failed to delete file ${filePath}:`, error);
    }
    return false;
  }
}

/**
 * Delete multiple files from the filesystem
 */
export async function deleteFiles(filePaths: string[], options: FileCleanupOptions = {}): Promise<number> {
  let deletedCount = 0;
  
  for (const filePath of filePaths) {
    const deleted = await deleteFile(filePath, options);
    if (deleted) deletedCount++;
  }
  
  return deletedCount;
}

/**
 * Clean up all files associated with a user
 */
export async function cleanupUserFiles(userId: string, options: FileCleanupOptions = {}): Promise<void> {
  const { deleteFromDatabase = true, logActivity = true } = options;
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const mediaCollection = db.collection('media_files');

    // Get user data
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return;

    const filesToDelete: string[] = [];

    // Add profile image if it exists and is a local file
    if (user.profile_image && typeof user.profile_image === 'string') {
      if (user.profile_image.startsWith('/uploads/')) {
        filesToDelete.push(user.profile_image);
      }
    }

    // Find all media files associated with this user
    const userMediaFiles = await mediaCollection.find({
      $or: [
        { uploaded_by: userId },
        { associated_record: userId }
      ]
    }).toArray();

    // Add media library files to deletion list
    for (const mediaFile of userMediaFiles) {
      if (mediaFile.file_path && !mediaFile.is_external) {
        filesToDelete.push(mediaFile.file_path);
      }
    }

    // Delete files from filesystem
    const deletedCount = await deleteFiles(filesToDelete, options);
    
    if (logActivity && deletedCount > 0) {
      console.log(`✅ Deleted ${deletedCount} files for user ${userId}`);
    }

    // Remove media files from database
    if (deleteFromDatabase && userMediaFiles.length > 0) {
      await mediaCollection.deleteMany({
        $or: [
          { uploaded_by: userId },
          { associated_record: userId }
        ]
      });
      
      if (logActivity) {
        console.log(`✅ Deleted ${userMediaFiles.length} media records from database`);
      }
    }

  } catch (error) {
    if (logActivity) {
      console.error('Error cleaning up user files:', error);
    }
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Get all files recursively from a directory
 */
async function getAllFilesRecursively(dirPath: string, baseUploadPath: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const items = await readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        const subFiles = await getAllFilesRecursively(fullPath, baseUploadPath);
        files.push(...subFiles);
      } else if (stats.isFile()) {
        // Convert to relative path from uploads directory
        const relativePath = path.relative(baseUploadPath, fullPath).replace(/\\/g, '/');
        files.push(`/uploads/${relativePath}`);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}:`, error);
  }
  
  return files;
}

/**
 * Find orphaned files by checking database references
 */
export async function findOrphanedFiles(options: FileCleanupOptions = {}): Promise<{
  orphanedFiles: string[];
  totalFiles: number;
  referencedFiles: string[];
}> {
  const { logActivity = true } = options;
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get upload directory path
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadsPath)) {
      return { orphanedFiles: [], totalFiles: 0, referencedFiles: [] };
    }

    if (logActivity) {
      console.log('🔍 Scanning uploads directory for files...');
    }

    // Get all files in uploads directory
    const allFiles = await getAllFilesRecursively(uploadsPath, uploadsPath);
    
    if (logActivity) {
      console.log(`📂 Found ${allFiles.length} files in uploads directory`);
    }

    // Get all file references from database
    const referencedFiles = new Set<string>();

    // 1. Profile images from users collection
    const usersCollection = db.collection('users');
    const usersWithImages = await usersCollection.find({
      profile_image: { $exists: true, $ne: null, $nin: ['', null] }
    }, {
      projection: { profile_image: 1 }
    }).toArray();

    usersWithImages.forEach(user => {
      if (user.profile_image && typeof user.profile_image === 'string') {
        // Only count local uploads as referenced files that actually exist
        if (user.profile_image.startsWith('/uploads/')) {
          const fullPath = path.join(process.cwd(), 'public', user.profile_image);
          if (existsSync(fullPath)) {
            referencedFiles.add(user.profile_image);
          } else {
            // Log missing referenced files for cleanup later
            if (logActivity) {
              console.log(`⚠️ User ${user.full_name || 'Unknown'} references missing file: ${user.profile_image}`);
            }
          }
        }
      }
    });

    // 2. Files from media_files collection
    const mediaCollection = db.collection('media_files');
    const mediaFiles = await mediaCollection.find({
      file_path: { $exists: true, $nin: ['', null] },
      is_external: { $ne: true }
    }, {
      projection: { file_path: 1 }
    }).toArray();

    mediaFiles.forEach(media => {
      if (media.file_path && typeof media.file_path === 'string') {
        const fullPath = path.join(process.cwd(), 'public', media.file_path);
        if (existsSync(fullPath)) {
          referencedFiles.add(media.file_path);
        } else {
          // Log missing media files for cleanup later
          if (logActivity) {
            console.log(`⚠️ Media file record references missing file: ${media.file_path}`);
          }
        }
      }
    });

    // 3. Product images (if you have a products collection)
    const productsCollection = db.collection('products');
    const productsWithImages = await productsCollection.find({
      $or: [
        { image_url: { $exists: true, $nin: ['', null] } },
        { images: { $exists: true, $ne: [] } }
      ]
    }, {
      projection: { image_url: 1, images: 1 }
    }).toArray();

    productsWithImages.forEach(product => {
      if (product.image_url && typeof product.image_url === 'string' && product.image_url.startsWith('/uploads/')) {
        referencedFiles.add(product.image_url);
      }
      if (Array.isArray(product.images)) {
        product.images.forEach(img => {
          if (typeof img === 'string' && img.startsWith('/uploads/')) {
            referencedFiles.add(img);
          }
        });
      }
    });

    // Find orphaned files
    const orphanedFiles = allFiles.filter(file => !referencedFiles.has(file));

    if (logActivity) {
      console.log(`📊 Database references: ${referencedFiles.size} files`);
      console.log(`🗑️ Orphaned files found: ${orphanedFiles.length} files`);
    }

    return {
      orphanedFiles,
      totalFiles: allFiles.length,
      referencedFiles: Array.from(referencedFiles)
    };

  } catch (error) {
    if (logActivity) {
      console.error('Error finding orphaned files:', error);
    }
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Clean up orphaned files (files that exist in filesystem but not in database)
 */
export async function cleanupOrphanedFiles(options: FileCleanupOptions = {}): Promise<{
  deletedCount: number;
  failedCount: number;
  totalSize: number;
  errors: string[];
}> {
  const { deleteFromFilesystem = true, logActivity = true } = options;
  
  if (logActivity) {
    console.log('🧹 Starting orphaned files cleanup...');
  }

  const result = {
    deletedCount: 0,
    failedCount: 0,
    totalSize: 0,
    errors: [] as string[]
  };

  try {
    // Find orphaned files
    const { orphanedFiles } = await findOrphanedFiles(options);

    if (orphanedFiles.length === 0) {
      if (logActivity) {
        console.log('✅ No orphaned files found!');
      }
      return result;
    }

    if (logActivity) {
      console.log(`🗑️ Found ${orphanedFiles.length} orphaned files to delete`);
    }

    // Delete orphaned files
    for (const filePath of orphanedFiles) {
      try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        
        if (existsSync(fullPath)) {
          // Get file size before deletion
          const stats = await stat(fullPath);
          const fileSize = stats.size;

          if (deleteFromFilesystem) {
            await unlink(fullPath);
            result.deletedCount++;
            result.totalSize += fileSize;
            
            if (logActivity) {
              console.log(`✅ Deleted: ${filePath} (${fileSize} bytes)`);
            }
          } else {
            result.totalSize += fileSize;
            if (logActivity) {
              console.log(`📝 Would delete: ${filePath} (${fileSize} bytes)`);
            }
          }
        }
      } catch (error) {
        result.failedCount++;
        const errorMsg = `Failed to delete ${filePath}: ${error}`;
        result.errors.push(errorMsg);
        
        if (logActivity) {
          console.warn(`⚠️ ${errorMsg}`);
        }
      }
    }

    if (logActivity) {
      console.log(`🧹 Cleanup completed:`);
      console.log(`   ✅ Deleted: ${result.deletedCount} files`);
      console.log(`   ❌ Failed: ${result.failedCount} files`);
      console.log(`   💾 Space freed: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
    }

  } catch (error) {
    if (logActivity) {
      console.error('Error during orphaned files cleanup:', error);
    }
    throw error;
  }

  return result;
}