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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file ID'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const mediaCollection = db.collection('media_files');

    // Get file info before deleting
    const fileInfo = await mediaCollection.findOne({ _id: new ObjectId(id) });
    
    if (!fileInfo) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Delete file from database
    const result = await mediaCollection.deleteOne({ _id: new ObjectId(id) });
    
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