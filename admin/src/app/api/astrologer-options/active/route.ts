import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

interface OptionValue {
  name?: string;
  isActive?: boolean;
}

// GET - Fetch only active astrologer options grouped by category
export async function GET() {
  try {
    const optionsCollection = await DatabaseService.getCollection('astrologer_options');
    
    // Get options in the current format (type + values array)
    const options = await optionsCollection
      .find({ type: { $exists: true }, values: { $exists: true } })
      .toArray();

    // Group by type and extract active values
    const groupedOptions: { languages: string[]; skills: string[] } = {
      languages: [],
      skills: []
    };

    for (const option of options) {
      if (option.type === 'skills') {
        groupedOptions.skills = option.values
          .filter((val: string | OptionValue) => typeof val === 'string' || val.isActive !== false)
          .map((val: string | OptionValue) => typeof val === 'string' ? val : val.name);
      } else if (option.type === 'languages') {
        groupedOptions.languages = option.values
          .filter((val: string | OptionValue) => typeof val === 'string' || val.isActive !== false)
          .map((val: string | OptionValue) => typeof val === 'string' ? val : val.name);
      }
    }

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