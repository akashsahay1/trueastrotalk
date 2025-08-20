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
      // Get all options and convert old format to new format for frontend compatibility
      const oldFormatOptions = await db
        .collection('astrologer_options')
        .find({ type: { $exists: true }, values: { $exists: true } })
        .toArray();

      // Convert old format to new format expected by frontend
      const convertedOptions: Array<{
        _id: string;
        category: string;
        name: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }> = [];
      
      for (const option of oldFormatOptions) {
        if (option.values && Array.isArray(option.values)) {
          for (const value of option.values) {
            // Handle both string values and object values with isActive
            const itemName = typeof value === 'string' ? value : value.name;
            const isActive = typeof value === 'string' ? true : (value.isActive !== false);
            
            convertedOptions.push({
              _id: `${option.type}_${itemName}`,
              category: option.type === 'skills' ? 'skills' : 'languages',
              name: itemName,
              isActive: isActive,
              createdAt: option.created_at || new Date().toISOString(),
              updatedAt: option.updated_at || new Date().toISOString()
            });
          }
        }
      }

      // Also get any new format options (individual documents)
      const newFormatOptions = await db
        .collection('astrologer_options')
        .find({ category: { $exists: true }, name: { $exists: true } })
        .toArray();

      // Combine both formats
      const allOptions = [...convertedOptions, ...newFormatOptions];

      return NextResponse.json({
        success: true,
        data: allOptions,
        total: allOptions.length
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