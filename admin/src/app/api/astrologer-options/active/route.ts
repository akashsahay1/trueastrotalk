import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Fetch only active astrologer options grouped by category
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const options = await db
      .collection('astrologer_options')
      .find({ isActive: true })
      .sort({ category: 1, name: 1 })
      .toArray();

    // Group by category
    const groupedOptions = {
      languages: options.filter(opt => opt.category === 'languages').map(opt => opt.name),
      skills: options.filter(opt => opt.category === 'skills').map(opt => opt.name)
    };

    return NextResponse.json({
      success: true,
      data: groupedOptions
    });
  } catch (error) {
    console.error('Error fetching active astrologer options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active astrologer options' },
      { status: 500 }
    );
  }
}