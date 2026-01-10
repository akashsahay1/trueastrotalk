import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { jwtVerify } from 'jose';
import { withSecurity } from '@/lib/api-security';
import { Media } from '@/models';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export const GET = withSecurity(async (request: NextRequest) => {
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
    const limitParam = searchParams.get('limit');
    
    if (!limitParam) {
      return NextResponse.json({ error: 'Limit parameter is required' }, { status: 400 });
    }
    
    const limit = parseInt(limitParam);
    const userType = searchParams.get('type');
    const search = searchParams.get('search') || '';
    
    // Filter parameters
    const accountStatus = searchParams.get('accountStatus') || '';
    const verificationStatus = searchParams.get('verificationStatus') || '';
    const featuredStatus = searchParams.get('featuredStatus') || '';
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
    
    // Search with regex (fallback approach since text index might not exist)
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email_address: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply individual filters
    if (accountStatus) {
      query.account_status = accountStatus;
    }
    
    if (verificationStatus) {
      query.verification_status = verificationStatus;
    }
    
    if (featuredStatus) {
      query.is_featured = featuredStatus === 'true';
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
    const usersCollection = await DatabaseService.getCollection('users');

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
        profile_image: await Media.resolveProfileImage(user, baseUrl)
      }))
    );
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
}, {
  requireAuth: true,
  allowedRoles: ['administrator'],
  requireCSRF: false, // GET requests don't need CSRF protection
  rateLimit: {
    requests: 100,
    windowMs: 15 * 60 * 1000,
  },
});