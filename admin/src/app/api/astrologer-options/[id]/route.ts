import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// PUT - Update astrologer option
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, isActive } = await request.json();
    const { id } = params;

    // Validation
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid option ID' },
        { status: 400 }
      );
    }

    if (!name || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Name and isActive status are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if option exists
    const existingOption = await db
      .collection('astrologer_options')
      .findOne({ _id: new ObjectId(id) });

    if (!existingOption) {
      return NextResponse.json(
        { success: false, error: 'Astrologer option not found' },
        { status: 404 }
      );
    }

    // Check if name already exists in the same category (excluding current item)
    const duplicateOption = await db
      .collection('astrologer_options')
      .findOne({
        _id: { $ne: new ObjectId(id) },
        category: existingOption.category,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });

    if (duplicateOption) {
      return NextResponse.json(
        { success: false, error: 'An option with this name already exists in this category' },
        { status: 409 }
      );
    }

    // Update option
    const updateData = {
      name: name.trim(),
      isActive,
      updatedAt: new Date()
    };

    const result = await db
      .collection('astrologer_options')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Astrologer option not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Astrologer option updated successfully'
    });

  } catch (error) {
    console.error('Error updating astrologer option:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update astrologer option' },
      { status: 500 }
    );
  }
}

// DELETE - Delete astrologer option
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validation
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid option ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if option exists
    const existingOption = await db
      .collection('astrologer_options')
      .findOne({ _id: new ObjectId(id) });

    if (!existingOption) {
      return NextResponse.json(
        { success: false, error: 'Astrologer option not found' },
        { status: 404 }
      );
    }

    // Delete option
    const result = await db
      .collection('astrologer_options')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Astrologer option not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Astrologer option deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting astrologer option:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete astrologer option' },
      { status: 500 }
    );
  }
}