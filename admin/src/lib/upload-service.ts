import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL!;
const DB_NAME = process.env.DB_NAME!;

if (!MONGODB_URL) {
  throw new Error('MONGODB_URL environment variable is required');
}

if (!DB_NAME) {
  throw new Error('DB_NAME environment variable is required');
}

export interface UploadOptions {
  file: File;
  fileType?: string;
  uploadedBy?: string;
  associatedRecord?: string;
  isExternal?: boolean;
}

export interface UploadResult {
  success: boolean;
  message?: string;
  error?: string;
  file_id?: string;
  file_path?: string;
  filename?: string;
}

export interface ExternalImageOptions {
  imageUrl: string;
  originalName?: string;
  fileType?: string;
  uploadedBy?: string;
  associatedRecord?: string;
}

/**
 * Unified upload service for handling file uploads consistently across the app
 * Follows WordPress-like media library structure with year/month organization
 */
export class UploadService {
  
  /**
   * Upload a file and save it to the media library
   */
  static async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      const { file, fileType = 'general', uploadedBy = null, associatedRecord = null, isExternal = false } = options;

      // Validate file type
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
        return {
          success: false,
          error: `Invalid file type. Received: ${file.type}. Only JPEG, PNG, WebP, and HEIC are allowed.`
        };
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size too large. Maximum size is 10MB.'
        };
      }

      // Get current date for directory structure (WordPress-like)
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Create directory path: /public/uploads/YYYY/MM/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
      
      // Create directory if it doesn't exist
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Generate unique filename with ta- prefix (consistent across app)
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = path.extname(file.name);
      const filename = `ta-${timestamp}${randomString}${extension}`;
      
      // Full file path
      const filePath = path.join(uploadDir, filename);
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filePath, buffer);
      
      // Generate public URL path
      const publicUrl = `/uploads/${year}/${month}/${filename}`;

      // Save to media library in database
      const mediaId = await this.saveToMediaLibrary({
        filename,
        originalName: file.name,
        filePath: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        fileType,
        uploadedBy,
        associatedRecord,
        isExternal
      });

      return {
        success: true,
        message: 'File uploaded successfully',
        file_id: mediaId,
        file_path: publicUrl,
        filename
      };

    } catch (error) {
      console.error('Upload Service Error:', error);
      return {
        success: false,
        error: 'Failed to upload file'
      };
    }
  }

  /**
   * @deprecated External URLs are no longer supported. All files must be uploaded locally.
   * This method now returns an error.
   */
  static async registerExternalImage(): Promise<UploadResult> {
    console.warn('registerExternalImage is deprecated: External URLs are no longer supported');
    return {
      success: false,
      error: 'External URLs are not supported. Please upload the file locally.'
    };
  }

  /**
   * Generate a unique media ID that persists across database exports/imports
   * Format: media_{timestamp}_{random}
   */
  private static generateMediaId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `media_${timestamp}_${random}`;
  }

  /**
   * Save file metadata to media library collection
   */
  private static async saveToMediaLibrary(data: {
    filename: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileType: string;
    uploadedBy: string | null;
    associatedRecord: string | null;
    isExternal: boolean;
  }): Promise<string> {
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');

    // Generate custom media ID that persists across exports
    const mediaId = this.generateMediaId();

    const fileData = {
      media_id: mediaId, // Our custom unique ID
      filename: data.filename,
      original_name: data.originalName,
      file_path: data.filePath,
      file_size: data.fileSize,
      mime_type: data.mimeType,
      file_type: data.fileType,
      uploaded_by: data.uploadedBy,
      associated_record: data.associatedRecord,
      is_external: data.isExternal,
      uploaded_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    await mediaCollection.insertOne(fileData);
    
    await client.close();
    
    // Return our custom media ID instead of MongoDB's ObjectId
    return mediaId;
  }

  /**
   * Get all media files from library with pagination
   */
  static async getMediaFiles(page: number = 1, limit: number = 50, fileType?: string) {
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');

    const skip = (page - 1) * limit;
    const query = fileType ? { file_type: fileType } : {};

    const files = await mediaCollection.find(query)
      .sort({ uploaded_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalFiles = await mediaCollection.countDocuments(query);

    await client.close();

    return {
      files,
      pagination: {
        total: totalFiles,
        page,
        limit,
        totalPages: Math.ceil(totalFiles / limit)
      }
    };
  }

  /**
   * Delete media file by ID
   */
  static async deleteMediaFile(fileId: string): Promise<UploadResult> {
    try {
      const client = new MongoClient(MONGODB_URL);
      await client.connect();
      
      const db = client.db(DB_NAME);
      const mediaCollection = db.collection('media');

      // Get file info before deletion
      const file = await mediaCollection.findOne({ _id: new ObjectId(fileId) });
      if (!file) {
        await client.close();
        return {
          success: false,
          error: 'File not found'
        };
      }

      // Delete from database
      await mediaCollection.deleteOne({ _id: new ObjectId(fileId) });
      
      // If it's an internal file, also delete from filesystem
      if (!file.is_external && file.file_path.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', file.file_path);
        try {
          const { unlink } = await import('fs/promises');
          await unlink(filePath);
        } catch (error) {
          console.warn('Could not delete physical file:', error);
        }
      }

      await client.close();

      return {
        success: true,
        message: 'File deleted successfully'
      };

    } catch (error) {
      console.error('Delete Media File Error:', error);
      return {
        success: false,
        error: 'Failed to delete file'
      };
    }
  }
}