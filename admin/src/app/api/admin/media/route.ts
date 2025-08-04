import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Fetch all media files with filtering options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const fileType = searchParams.get('file_type'); // Filter by file type
    const isExternal = searchParams.get('is_external'); // Filter by internal/external
    const uploadedBy = searchParams.get('uploaded_by'); // Filter by uploader
    const skip = (page - 1) * limit;

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media_files');

    // Build query with filters
    const query: Record<string, unknown> = {};
    if (fileType) query.file_type = fileType;
    if (isExternal !== null && isExternal !== undefined) query.is_external = isExternal === 'true';
    if (uploadedBy) query.uploaded_by = uploadedBy;

    // Get media files with pagination and filters
    const files = await mediaCollection.find(query)
      .sort({ uploaded_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalFiles = await mediaCollection.countDocuments(query);

    // Get file type statistics for dashboard
    const fileTypeStats = await mediaCollection.aggregate([
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 },
          total_size: { $sum: '$file_size' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get internal vs external statistics
    const sourceStats = await mediaCollection.aggregate([
      {
        $group: {
          _id: '$is_external',
          count: { $sum: 1 },
          total_size: { $sum: '$file_size' }
        }
      }
    ]).toArray();

    await client.close();

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        total: totalFiles,
        page,
        limit,
        totalPages: Math.ceil(totalFiles / limit)
      },
      statistics: {
        file_types: fileTypeStats,
        sources: sourceStats
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching media files'
    }, { status: 500 });
  }
}