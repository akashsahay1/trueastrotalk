import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Fetch all astrologer options
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';

    if (type) {
      // Get specific type of options (skills, languages, qualifications)
      const option = await db
        .collection('astrologer_options')
        .findOne({ type: type });

      if (option && option.values) {
        return NextResponse.json({
          success: true,
          [type]: option.values
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `No ${type} options found`
        }, { status: 404 });
      }
    } else {
      // Get all options (legacy support)
      const options = await db
        .collection('astrologer_options')
        .find({})
        .sort({ type: 1 })
        .toArray();

      return NextResponse.json({
        success: true,
        data: options,
        total: options.length
      });
    }
  } catch (error) {
    console.error('Error fetching astrologer options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch astrologer options' },
      { status: 500 }
    );
  }
}

// POST - Create new astrologer option
export async function POST(request: NextRequest) {
  try {
    const { category, name } = await request.json();

    // Validation
    if (!category || !name) {
      return NextResponse.json(
        { success: false, error: 'Category and name are required' },
        { status: 400 }
      );
    }

    if (!['languages', 'skills'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category. Must be languages or skills' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if item already exists in this category
    const existingOption = await db
      .collection('astrologer_options')
      .findOne({ category, name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (existingOption) {
      return NextResponse.json(
        { success: false, error: 'An option with this name already exists in this category' },
        { status: 409 }
      );
    }

    // Create new option
    const newOption = {
      category,
      name: name.trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('astrologer_options').insertOne(newOption);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...newOption },
      message: 'Astrologer option created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating astrologer option:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create astrologer option' },
      { status: 500 }
    );
  }
}