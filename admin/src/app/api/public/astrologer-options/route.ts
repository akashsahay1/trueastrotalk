import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Fetch active astrologer options for mobile app (public endpoint)
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const options = await db
      .collection('astrologer_options')
      .find({})
      .toArray();

    // Extract values from the documents
    const groupedOptions = {
      languages: [],
      skills: []
    };

    options.forEach(opt => {
      if (opt.type === 'languages' && opt.values) {
        groupedOptions.languages = opt.values;
      } else if (opt.type === 'skills' && opt.values) {
        groupedOptions.skills = opt.values;
      }
    });

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