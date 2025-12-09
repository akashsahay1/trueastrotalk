/**
 * Sync uploads folder to MongoDB media collection
 *
 * This script scans the uploads folder and creates media collection entries
 * for any files that don't already exist in the database.
 *
 * Usage: node scripts/sync-uploads-to-media.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

// Get base directory - works from admin folder or root
function getAdminBaseDir() {
  const cwd = process.cwd();
  if (cwd.endsWith('admin') || cwd.endsWith('admin\\') || cwd.endsWith('admin/')) {
    return cwd;
  }
  const adminPath = path.join(cwd, 'admin');
  if (fs.existsSync(adminPath)) {
    return adminPath;
  }
  // If running from scripts folder
  if (__dirname.includes('scripts')) {
    return path.join(__dirname, '..');
  }
  return cwd;
}

const UPLOADS_DIR = path.join(getAdminBaseDir(), 'public', 'uploads');

// MIME type mapping
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.gif': 'image/gif'
};

/**
 * Generate a unique media ID
 */
function generateMediaId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `media_${timestamp}_${random}`;
}

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Skip .gitkeep and other hidden files
      if (!file.startsWith('.')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

/**
 * Main sync function
 */
async function syncUploadsToMedia() {
  console.log('Starting uploads to media sync...\n');

  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');

    // Get all files in uploads directory
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('Uploads directory does not exist:', UPLOADS_DIR);
      return;
    }

    const allFiles = getAllFiles(UPLOADS_DIR);
    console.log(`Found ${allFiles.length} files in uploads folder\n`);

    // Get existing media entries by file_path
    const existingMedia = await mediaCollection.find({}).toArray();
    const existingPaths = new Set(existingMedia.map(m => m.file_path));
    const existingFilenames = new Set(existingMedia.map(m => m.filename));

    console.log(`Found ${existingMedia.length} existing media entries in database\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const filePath of allFiles) {
      const relativePath = filePath.replace(path.join(getAdminBaseDir(), 'public'), '').replace(/\\/g, '/');
      const filename = path.basename(filePath);
      const ext = path.extname(filename).toLowerCase();

      // Skip if already exists in database
      if (existingPaths.has(relativePath) || existingFilenames.has(filename)) {
        skipped++;
        continue;
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      // Create media document
      const mediaDoc = {
        media_id: generateMediaId(),
        filename: filename,
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

      try {
        await mediaCollection.insertOne(mediaDoc);
        console.log(`✓ Synced: ${relativePath}`);
        synced++;
      } catch (err) {
        console.error(`✗ Error syncing ${relativePath}:`, err.message);
        errors++;
      }
    }

    console.log('\n--- Sync Summary ---');
    console.log(`Synced: ${synced} files`);
    console.log(`Skipped (already exists): ${skipped} files`);
    console.log(`Errors: ${errors} files`);
    console.log(`Total processed: ${allFiles.length} files`);

  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the sync
syncUploadsToMedia();
