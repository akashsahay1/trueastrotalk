import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
// import { InputSanitizer } from '../../../../lib/security';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// Helper function to resolve profile image
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProfileImage(user: Record<string, unknown>, mediaCollection: any, baseUrl: string): Promise<string | null> {
  // Priority 1: If user has Google auth and social_auth_profile_image, use external URL
  if (user.auth_type === 'google' && user.social_auth_profile_image && typeof user.social_auth_profile_image === 'string') {
    return user.social_auth_profile_image;
  }
  
  // Priority 2: If user has profile_image_id, resolve from media library
  if (user.profile_image_id) {
    try {
      // Handle both string and ObjectId formats
      const mediaId = typeof user.profile_image_id === 'string' 
        ? (ObjectId.isValid(user.profile_image_id) ? new ObjectId(user.profile_image_id) : null)
        : user.profile_image_id;
        
      if (mediaId) {
        const mediaFile = await mediaCollection.findOne({ _id: mediaId });
        
        if (mediaFile) {
          return `${baseUrl}${mediaFile.file_path}`;
        }
      }
    } catch (error) {
      console.error('Error resolving media file:', error);
    }
  }
  
  // No profile image - return null to indicate no image uploaded
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`🔮 Available astrologers request from IP: ${ip}`);

    const { searchParams } = new URL(request.url);
    
    // Sanitize and validate query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const onlineOnly = searchParams.get('online_only') === 'true';
    // const specialization = searchParams.get('specialization');
    // const minRating = parseFloat(searchParams.get('min_rating') || '0');
    // const maxRate = parseFloat(searchParams.get('max_rate') || '1000');
    // const sortBy = searchParams.get('sort_by') || 'rating'; // rating, experience, rate

    const usersCollection = await DatabaseService.getCollection('users');
    const mediaCollection = await DatabaseService.getCollection('media');
    // const chatSessionsCollection = await DatabaseService.getCollection('chat_sessions');

    // Build query for available astrologers - only verified ones with complete profiles
    const query: Record<string, unknown> = {
      user_type: 'astrologer', // Only use standardized user_type field
      account_status: 'active',
      verification_status: 'verified', // Use verification_status instead of is_verified
      // All users now have profile_image_id, so no need for complex $or query
      profile_image_id: { $exists: true, $ne: null }
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

    // Optimized bulk session count calculation
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const astrologerIds = astrologers.map(a => a._id);
    
    const sessionCounts = await sessionsCollection.aggregate([
      {
        $match: {
          astrologer_id: { $in: astrologerIds }
        }
      },
      {
        $group: {
          _id: '$astrologer_id',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const astrologerSessionCounts = new Map();
    sessionCounts.forEach(item => {
      astrologerSessionCounts.set(item._id.toString(), item.count);
    });

    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);

    // Format the response with resolved profile images
    const formattedAstrologers = await Promise.all(
      astrologers.map(async (astrologer) => {
        const astrologerId = astrologer._id.toString();
        const realSessionCount = astrologerSessionCounts.get(astrologerId) || 0;
        
        // Resolve profile image from media library or fallback
        const resolvedProfileImage = await resolveProfileImage(astrologer, mediaCollection, baseUrl);
        
        return {
          id: astrologerId,
          full_name: astrologer.full_name,
          email_address: astrologer.email_address,
          phone_number: astrologer.phone_number,
          profile_image: resolvedProfileImage,
          bio: astrologer.bio || '',
          qualifications: astrologer.qualifications,
          skills: astrologer.skills,
          languages: astrologer.languages || ['Hindi', 'English'],
          experience_years: astrologer.experience_years || 5,
          is_online: astrologer.is_online || false,
          account_status: astrologer.account_status,
          rating: astrologer.rating || 4.5,
          total_reviews: astrologer.total_reviews || 0,
          total_consultations: realSessionCount, // Use real count from sessions collection
          chat_rate: astrologer.chat_rate || 15,
          call_rate: astrologer.call_rate || 25,
          video_rate: astrologer.video_rate || 35,
          is_available: astrologer.is_online,
          created_at: astrologer.created_at,
          updated_at: astrologer.updated_at
        };
      })
    );

    // Database connection is managed by DatabaseService

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