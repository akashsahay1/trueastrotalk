import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// PUT - Update astrologer option
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, isActive } = await request.json();
    const { id } = await params;

    if (!name || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Name and isActive status are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Handle both old format (type_value) and new format (ObjectId) IDs
    if (ObjectId.isValid(id)) {
      // New format: individual document with ObjectId
      const existingOption = await db
        .collection('astrologer_options')
        .findOne({ _id: new ObjectId(id) });

      if (!existingOption) {
        return NextResponse.json(
          { success: false, error: 'Astrologer option not found' },
          { status: 404 }
        );
      }

      await db
        .collection('astrologer_options')
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { name: name.trim(), isActive, updatedAt: new Date() } }
        );

      return NextResponse.json({
        success: true,
        message: 'Astrologer option updated successfully'
      });
    } else {
      // Old format: type_value ID, need to update array in existing document
      const [type, ...valueParts] = id.split('_');
      const oldValue = valueParts.join('_'); // Handle names with underscores
      
      if (!type || !oldValue) {
        return NextResponse.json(
          { success: false, error: 'Invalid option ID format' },
          { status: 400 }
        );
      }

      // Find the document with this type
      const existingDoc = await db
        .collection('astrologer_options')
        .findOne({ type: type });

      if (!existingDoc || !existingDoc.values) {
        return NextResponse.json(
          { success: false, error: 'Astrologer option not found' },
          { status: 404 }
        );
      }

      // Update the values array to convert strings to objects with isActive
      const updatedValues = existingDoc.values.map((value: string | { name: string; isActive: boolean }) => {
        const currentName = typeof value === 'string' ? value : value.name;
        
        if (currentName === oldValue) {
          return { name: name.trim(), isActive };
        } else if (typeof value === 'string') {
          return { name: value, isActive: true };
        } else {
          return value;
        }
      });

      // Update the document
      const result = await db
        .collection('astrologer_options')
        .updateOne(
          { type: type },
          { 
            $set: { 
              values: updatedValues,
              updated_at: new Date()
            }
          }
        );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to update astrologer option' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Astrologer option updated successfully'
      });
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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