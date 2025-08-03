import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Fetch all media files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media_files');

    // Get media files with pagination
    const files = await mediaCollection.find({})
      .sort({ uploaded_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalFiles = await mediaCollection.countDocuments({});

    await client.close();

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        total: totalFiles,
        page,
        limit,
        totalPages: Math.ceil(totalFiles / limit)
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