import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Base URL for serving images - should be configurable via environment variables
const getBaseUrl = (request: NextRequest) => {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
};

// GET - Resolve media ObjectId to full URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');
    
    if (!mediaId) {
      return NextResponse.json({
        success: false,
        error: 'Media ID required',
        message: 'Please provide a media ID to resolve'
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid media ID',
        message: 'The provided media ID is not a valid ObjectId'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');

    // Find the media file by ObjectId
    const mediaFile = await mediaCollection.findOne({ 
      _id: new ObjectId(mediaId) 
    });

    await client.close();

    if (!mediaFile) {
      return NextResponse.json({
        success: false,
        error: 'Media not found',
        message: 'No media file found with the provided ID'
      }, { status: 404 });
    }

    // Construct full URL
    const baseUrl = getBaseUrl(request);
    const fullUrl = `${baseUrl}${mediaFile.file_path}`;

    return NextResponse.json({
      success: true,
      media: {
        id: mediaFile._id,
        filename: mediaFile.filename,
        original_name: mediaFile.original_name,
        file_path: mediaFile.file_path,
        full_url: fullUrl,
        file_size: mediaFile.file_size,
        mime_type: mediaFile.mime_type,
        file_type: mediaFile.file_type,
        uploaded_at: mediaFile.uploaded_at
      }
    });

  } catch (error) {
    console.error('Error resolving media:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while resolving the media file'
    }, { status: 500 });
  }
}

// POST - Resolve multiple media ObjectIds to full URLs (batch operation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { media_ids } = body;

    if (!media_ids || !Array.isArray(media_ids)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        message: 'Please provide an array of media IDs'
      }, { status: 400 });
    }

    // Validate all ObjectId formats
    for (const id of media_ids) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid media ID',
          message: `Invalid ObjectId format: ${id}`
        }, { status: 400 });
      }
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');

    // Find all media files by ObjectIds
    const mediaFiles = await mediaCollection.find({ 
      _id: { $in: media_ids.map(id => new ObjectId(id)) }
    }).toArray();

    await client.close();

    // Construct full URLs for all found media files
    const baseUrl = getBaseUrl(request);
    
    const resolvedMedia = mediaFiles.map(file => ({
      id: file._id,
      filename: file.filename,
      original_name: file.original_name,
      file_path: file.file_path,
      full_url: `${baseUrl}${file.file_path}`,
      file_size: file.file_size,
      mime_type: file.mime_type,
      file_type: file.file_type,
      uploaded_at: file.uploaded_at
    }));

    // Create a map for easy lookup
    const mediaMap: Record<string, unknown> = {};
    resolvedMedia.forEach(media => {
      mediaMap[media.id.toString()] = media;
    });

    return NextResponse.json({
      success: true,
      media_files: resolvedMedia,
      media_map: mediaMap,
      found_count: resolvedMedia.length,
      requested_count: media_ids.length
    });

  } catch (error) {
    console.error('Error resolving media batch:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while resolving the media files'
    }, { status: 500 });
  }
}