import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    // const specialization = searchParams.get('specialization'); // TODO: implement specialization filtering
    const onlineOnly = searchParams.get('online_only') === 'true';

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Build query for available astrologers - only verified ones
    const query: Record<string, unknown> = {
      $or: [
        { user_type: 'astrologer' },
        { role: 'astrologer' }
      ],
      account_status: 'active',
      verification_status: 'verified'
    };

    if (onlineOnly) {
      query.is_online = true;
    }

    // Get astrologers with their profile data
    const astrologers = await usersCollection.find(query)
      .sort({ is_online: -1, created_at: -1 }) // Online first, then newest
      .skip(offset)
      .limit(limit)
      .toArray();

    await client.close();

    // Sample profile images for demo
    const sampleImages = [
      'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face'
    ];

    // Format the response
    const formattedAstrologers = astrologers.map((astrologer, index) => ({
      id: astrologer._id.toString(),
      full_name: astrologer.full_name,
      email_address: astrologer.email_address,
      phone_number: astrologer.phone_number,
      profile_image: astrologer.profile_image || sampleImages[index % sampleImages.length],
      bio: astrologer.bio || '',
      specializations: astrologer.specializations || ['Vedic', 'Numerology'],
      languages: astrologer.languages || ['Hindi', 'English'],
      experience_years: astrologer.experience_years || 5,
      is_online: astrologer.is_online || false,
      account_status: astrologer.account_status,
      verification_status: astrologer.verification_status,
      rating: astrologer.rating || 4.5,
      total_reviews: astrologer.total_reviews || 0,
      total_consultations: astrologer.total_consultations || 0,
      chat_rate: astrologer.chat_rate || 15,
      call_rate: astrologer.call_rate || 25,
      video_rate: astrologer.video_rate || 35,
      is_available: astrologer.is_online,
      created_at: astrologer.created_at,
      updated_at: astrologer.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        astrologers: formattedAstrologers,
        total_count: formattedAstrologers.length,
        offset,
        limit,
        has_more: formattedAstrologers.length === limit
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while retrieving astrologers'
    }, { status: 500 });
  }
}