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
async function resolveProfileImage(user: Record<string, unknown>, mediaCollection: any, baseUrl: string): Promise<string> {
  // Priority 1: If user has profile_image_id, resolve from media library
  if (user.profile_image_id && typeof user.profile_image_id === 'string' && ObjectId.isValid(user.profile_image_id)) {
    try {
      const mediaFile = await mediaCollection.findOne({ 
        _id: new ObjectId(user.profile_image_id) 
      });
      
      if (mediaFile) {
        return `${baseUrl}${mediaFile.file_path}`;
      }
    } catch (error) {
      console.error('Error resolving media file:', error);
    }
  }
  
  // Priority 2: Direct profile_image URL
  if (user.profile_image && typeof user.profile_image === 'string') {
    if (user.profile_image.startsWith('/')) {
      return `${user.profile_image}`;
    }
    return user.profile_image;
  }
  
  // Priority 3: profile_picture URL (fallback)
  if (user.profile_picture && typeof user.profile_picture === 'string') {
    if (user.profile_picture.startsWith('/')) {
      return `${baseUrl}${user.profile_picture}`;
    }
    return user.profile_picture;
  }
  
  // Default fallback image
  return `${baseUrl}/assets/images/avatar-1.jpg`;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
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
    
    // Calculate skip
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (userType && userType !== 'all') {
      query.user_type = userType;
    }
    
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email_address: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } }
      ];
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

  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}