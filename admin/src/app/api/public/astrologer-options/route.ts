import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Type definitions for astrologer options
interface AstrologerOptionValue {
  name?: string;
  value?: string;
  isActive?: boolean;
}

type OptionValue = string | AstrologerOptionValue;

interface _AstrologerOption {
  type: string;
  values: OptionValue[];
}

// GET - Fetch astrologer options (public endpoint - no authentication required)
export async function GET(request: NextRequest) {
  try {

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const { db } = await connectToDatabase();
    const astrologerOptionsCollection = db.collection('astrologer_options');

    if (type) {
      // Get specific type of options (skills, languages, qualifications)
      const option = await astrologerOptionsCollection.findOne({ type: type });

      if (option?.values) {
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
      // Get all options grouped by type for frontend compatibility
      const options = await astrologerOptionsCollection
        .find({ type: { $exists: true }, values: { $exists: true } })
        .toArray();

      const result: Record<string, string[]> = {};
      
      for (const option of options) {
        if (option.values && Array.isArray(option.values)) {
          // Filter for active values only if they have isActive property
          const activeValues = option.values.filter((value: OptionValue) => {
            if (typeof value === 'string') return true;
            return (value as AstrologerOptionValue).isActive !== false;
          }).map((value: OptionValue) => {
            return typeof value === 'string' ? value : (value as AstrologerOptionValue).name || (value as AstrologerOptionValue).value || '';
          });
          
          result[option.type] = activeValues;
        }
      }

      // Ensure we have the basic required options
      if (!result.skills || result.skills.length === 0) {
        result.skills = [
          'Vedic Astrology',
          'Western Astrology',
          'Numerology',
          'Tarot Reading',
          'Palm Reading',
          'Vastu Shastra',
          'Face Reading',
          'Gemstone Consultation',
          'Love & Relationships',
          'Career Guidance',
          'Health & Wellness',
          'Financial Guidance'
        ];
      }

      if (!result.languages || result.languages.length === 0) {
        result.languages = [
          'English',
          'Hindi',
          'Bengali',
          'Tamil',
          'Telugu',
          'Marathi',
          'Gujarati',
          'Kannada',
          'Malayalam',
          'Punjabi',
          'Urdu',
          'Odia'
        ];
      }


      return NextResponse.json({
        success: true,
        ...result
      });
    }

  } catch (error) {
    console.error('Public astrologer options error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching astrologer options'
    }, { status: 500 });
  }
}