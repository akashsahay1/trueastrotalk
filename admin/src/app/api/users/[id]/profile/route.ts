import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:4001';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

// Helper function to resolve profile image to full URL
async function resolveProfileImage(user: Record<string, any>, mediaCollection: any, baseUrl: string): Promise<string | null> {
  // Check if user has profile_image_id
  if (!user.profile_image_id) {
    return null;
  }

  try {
    const mediaFile = await mediaCollection.findOne({ media_id: user.profile_image_id });
    
    if (mediaFile && mediaFile.file_path) {
      return `${baseUrl}${mediaFile.file_path}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving media file:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const usersCollection = await DatabaseService.getCollection('users');
    const mediaCollection = await DatabaseService.getCollection('media');

    // Find user by user_id field (custom format like user_xxx)
    const user = await usersCollection.findOne({ user_id: id });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Resolve profile image to full URL
    const baseUrl = getBaseUrl(request);
    const profileImage = await resolveProfileImage(user, mediaCollection, baseUrl);

    // Prepare response based on user type
    const userResponse: any = {
      id: user.user_id,
      full_name: user.full_name,
      email_address: user.email_address,
      phone_number: user.phone_number,
      user_type: user.user_type,
      account_status: user.account_status,
      verification_status: user.verification_status,
      profile_image: profileImage,
      date_of_birth: user.date_of_birth,
      birth_time: user.birth_time,
      birth_place: user.birth_place,
      gender: user.gender,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      zip: user.zip,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    // Add astrologer-specific fields if user is an astrologer
    if (user.user_type === 'astrologer') {
      userResponse.bio = user.bio;
      userResponse.skills = user.skills;
      userResponse.languages = user.languages;
      userResponse.qualifications = user.qualifications;
      userResponse.experience_years = user.experience_years;
      userResponse.call_rate = user.call_rate;
      userResponse.chat_rate = user.chat_rate;
      userResponse.video_rate = user.video_rate;
      userResponse.is_online = user.is_online;
      userResponse.is_featured = user.is_featured;
      userResponse.rating = user.rating || 0;
      userResponse.total_reviews = user.total_reviews || 0;
      userResponse.total_consultations = user.total_consultations || 0;
    }

    return NextResponse.json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}