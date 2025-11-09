import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { JWTSecurity } from '@/lib/security';
import { withSecurity, SecurityPresets } from '@/lib/api-security';
import DatabaseService from '@/lib/database';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// Helper function to resolve profile image to full URL
async function resolveProfileImage(user: Record<string, unknown>, mediaCollection: Awaited<ReturnType<typeof DatabaseService.getCollection>>, baseUrl: string): Promise<string | null> {
  // Priority 1: If user has Google auth and social_auth_profile_image, use external URL
  if (user.auth_type === 'google' && user.social_auth_profile_image && typeof user.social_auth_profile_image === 'string') {
    return user.social_auth_profile_image;
  }
  
  // Priority 2: If user has profile_image_id, resolve from media library
  if (user.profile_image_id || user.profile_image) {
    try {
      const mediaRef = user.profile_image_id || user.profile_image;
      let mediaFile = null;
      
      if (typeof mediaRef === 'string') {
        // Check if it's our custom media_id format
        if (mediaRef.startsWith('media_')) {
          mediaFile = await mediaCollection.findOne({ media_id: mediaRef });
        } else if (mediaRef.length === 24) {
          // Try legacy ObjectId lookup first
          try {
            mediaFile = await mediaCollection.findOne({ _id: new ObjectId(mediaRef) });
          } catch {
            // If ObjectId conversion fails, try as string
            mediaFile = await mediaCollection.findOne({ media_id: mediaRef });
          }
        }
      } else if (mediaRef instanceof ObjectId) {
        mediaFile = await mediaCollection.findOne({ _id: mediaRef });
      }
        
      if (mediaFile && mediaFile.file_path) {
        return `${baseUrl}${mediaFile.file_path}`;
      }
    } catch (error) {
      console.error('Error resolving media file:', error);
    }
  }

  // No profile image - return null to indicate no image uploaded
  return null;
}

async function handleGET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const payload = JWTSecurity.verifyAccessToken(token);
      if (!payload || payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const userType = searchParams.get('type');
    const searchQuery = searchParams.get('search');

    const usersCollection = await DatabaseService.getCollection('users');
    const mediaCollection = await DatabaseService.getCollection('media');

    // Build filter query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    
    if (userType) {
      filter.user_type = userType;
    }

    if (searchQuery) {
      filter.$or = [
        { full_name: { $regex: searchQuery, $options: 'i' } },
        { email_address: { $regex: searchQuery, $options: 'i' } },
        { phone_number: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const totalCount = await usersCollection.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch users with pagination
    const users = await usersCollection
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const baseUrl = getBaseUrl(request);

    // Resolve profile images for all users
    const usersWithImages = await Promise.all(
      users.map(async (user) => {
        const profileImageUrl = await resolveProfileImage(user, mediaCollection, baseUrl);
        return {
          ...user,
          profile_image: profileImageUrl,
          _id: user._id.toString()
        };
      })
    );


    return NextResponse.json({
      success: true,
      data: {
        users: usersWithImages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const payload = JWTSecurity.verifyAccessToken(token);
      if (!payload || payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const usersCollection = await DatabaseService.getCollection('users');
    const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });


    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const GET = withSecurity(handleGET, SecurityPresets.admin);
export const DELETE = withSecurity(handleDELETE, SecurityPresets.admin);