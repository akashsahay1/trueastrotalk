/**
 * Auto-sync uploads folder with MongoDB media collection
 * Runs on app startup to ensure all files are in the database
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGODB_URL = process.env.MONGODB_URL!;
const DB_NAME = process.env.DB_NAME!;

if (!MONGODB_URL) {
  throw new Error('MONGODB_URL environment variable is required');
}

if (!DB_NAME) {
  throw new Error('DB_NAME environment variable is required');
}

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.gif': 'image/gif'
};

function generateMediaId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `media_${timestamp}_${random}`;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (!file.startsWith('.')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

/**
 * Get the base directory for the admin app
 * Works whether running from admin folder or root folder
 */
function getAdminBaseDir(): string {
  const cwd = process.cwd();
  // Check if we're already in the admin folder
  if (cwd.endsWith('admin') || cwd.endsWith('admin\\') || cwd.endsWith('admin/')) {
    return cwd;
  }
  // Check if admin folder exists in current directory
  const adminPath = path.join(cwd, 'admin');
  if (fs.existsSync(adminPath)) {
    return adminPath;
  }
  // Fallback to cwd (Next.js should set this correctly)
  return cwd;
}

export async function syncUploadsToMedia(): Promise<void> {
  const baseDir = getAdminBaseDir();
  const uploadsDir = path.join(baseDir, 'public', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    console.log('[Media Sync] Uploads directory does not exist, skipping sync');
    return;
  }

  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');

    const allFiles = getAllFiles(uploadsDir);
    if (allFiles.length === 0) {
      console.log('[Media Sync] No files found in uploads folder');
      return;
    }

    // Get existing media entries
    const existingMedia = await mediaCollection.find({}).toArray();
    const existingPaths = new Set(existingMedia.map(m => m.file_path));
    const existingFilenames = new Set(existingMedia.map(m => m.filename));

    let synced = 0;
    const publicDir = path.join(baseDir, 'public');

    for (const filePath of allFiles) {
      const relativePath = filePath.replace(publicDir, '').replace(/\\/g, '/');
      const filename = path.basename(filePath);
      const ext = path.extname(filename).toLowerCase();

      if (existingPaths.has(relativePath) || existingFilenames.has(filename)) {
        continue;
      }

      const stats = fs.statSync(filePath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      const mediaDoc = {
        media_id: generateMediaId(),
        filename,
        original_name: filename,
        file_path: relativePath,
        file_size: stats.size,
        mime_type: mimeType,
        file_type: 'image',
        uploaded_by: null,
        associated_record: null,
        is_external: false,
        uploaded_at: stats.mtime,
        created_at: new Date(),
        updated_at: new Date()
      };

      await mediaCollection.insertOne(mediaDoc);
      synced++;
    }

    if (synced > 0) {
      console.log(`[Media Sync] Synced ${synced} new files to media collection`);
    } else {
      console.log(`[Media Sync] All ${allFiles.length} files already in sync`);
    }

  } catch (error) {
    console.error('[Media Sync] Error:', error);
  } finally {
    await client.close();
  }
}
