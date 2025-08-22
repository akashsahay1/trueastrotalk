import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// Helper function to resolve profile image to full URL
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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const userType = searchParams.get('type');
    const search = searchParams.get('search') || '';
    
    // Filter parameters
    const accountStatus = searchParams.get('accountStatus') || '';
    const verificationStatus = searchParams.get('verificationStatus') || '';
    const skills = searchParams.get('skills') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const country = searchParams.get('country') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    
    // Calculate skip
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (userType && userType !== 'all') {
      query.user_type = userType;
    }
    
    // Optimized search with text index
    if (search) {
      // Use text search if available, fallback to regex
      if (search.length > 2) {
        query.$text = { $search: search };
      } else {
        query.$or = [
          { full_name: { $regex: `^${search}`, $options: 'i' } },
          { email_address: { $regex: `^${search}`, $options: 'i' } },
          { phone_number: { $regex: search, $options: 'i' } }
        ];
      }
    }

    // Apply individual filters
    if (accountStatus) {
      query.account_status = accountStatus;
    }
    
    if (verificationStatus) {
      query.verification_status = verificationStatus;
    }
    
    if (skills) {
      query.skills = { $elemMatch: { $regex: skills, $options: 'i' } };
    }
    
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }
    
    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }
    
    // Date range filter
    if (fromDate || toDate) {
      const dateQuery: Record<string, Date> = {};
      if (fromDate) {
        dateQuery.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Add one day to include the entire toDate
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        dateQuery.$lt = endDate;
      }
      query.created_at = dateQuery;
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const mediaCollection = db.collection('media_files');

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      usersCollection.find(query, {
        projection: {
          password: 0 // Exclude password from results
        }
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
      
      usersCollection.countDocuments(query)
    ]);

    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);

    // Resolve profile images for all users
    const usersWithResolvedImages = await Promise.all(
      users.map(async (user) => ({
        ...user,
        profile_image: await resolveProfileImage(user, mediaCollection, baseUrl)
      }))
    );

    await client.close();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithResolvedImages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}