import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { unlink } from 'fs/promises';
import path from 'path';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// DELETE - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media');

    // Get file info before deleting - only support custom media_id
    let fileInfo;
    let deleteQuery;
    
    // Check if it's our custom media ID format
    if (id.startsWith('media_')) {
      fileInfo = await mediaCollection.findOne({ media_id: id });
      deleteQuery = { media_id: id };
    } else {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Invalid file ID format - must be custom media_id'
      }, { status: 400 });
    }
    
    if (!fileInfo) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Delete file from database
    const result = await mediaCollection.deleteOne(deleteQuery);
    
    await client.close();

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete',
        message: 'File could not be deleted from database'
      }, { status: 400 });
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), 'public', fileInfo.file_path);
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Don't fail the entire operation if physical file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch(error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting the file'
    }, { status: 500 });
  }
}