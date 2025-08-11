import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Fetch active astrologer options for mobile app (public endpoint)
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const options = await db
      .collection('astrologer_options')
      .find({ isActive: true })
      .sort({ category: 1, name: 1 })
      .toArray();

    // Group by category and return only the names
    const groupedOptions = {
      languages: options.filter(opt => opt.category === 'languages').map(opt => opt.name),
      skills: options.filter(opt => opt.category === 'skills').map(opt => opt.name)
    };

    return NextResponse.json({
      success: true,
      data: groupedOptions
    });
  } catch (error) {
    console.error('Error fetching astrologer options for mobile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch astrologer options' },
      { status: 500 }
    );
  }
}