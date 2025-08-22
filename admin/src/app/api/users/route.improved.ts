import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../lib/database';
import { SecurityMiddleware } from '../../../lib/security';
import { ErrorHandler, ErrorCode } from '../../../lib/error-handler';
import { Validator } from '../../../lib/validation';
import APIMiddleware from '../../../lib/api-middleware';

// Helper function to get base URL for images
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// Helper function to resolve profile image to full URL
async function resolveProfileImage(user: Record<string, unknown>, mediaCollection: unknown, baseUrl: string): Promise<string | null> {
  try {
    // Priority 1: If user has Google auth and social_auth_profile_image, use external URL
    if (user.auth_type === 'google' && user.social_auth_profile_image && typeof user.social_auth_profile_image === 'string') {
      return user.social_auth_profile_image;
    }
    
    // Priority 2: If user has profile_image_id, resolve from media library
    if (user.profile_image_id) {
      // Handle both string and ObjectId formats
      const mediaId = typeof user.profile_image_id === 'string' 
        ? (ObjectId.isValid(user.profile_image_id) ? new ObjectId(user.profile_image_id) : null)
        : user.profile_image_id;
        
      if (mediaId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mediaCollectionTyped = mediaCollection as any;
        const mediaFile = await mediaCollectionTyped.findOne({ _id: mediaId });
        
        if (mediaFile) {
          return `${baseUrl}${mediaFile.file_path}`;
        }
      }
    }
    
    // No profile image - return null to indicate no image uploaded
    return null;
  } catch (error) {
    console.error('Error resolving media file:', error);
    return null;
  }
}

// GET - Fetch users with filtering and pagination
async function handleGetUsers(request: NextRequest): Promise<NextResponse> {
  // Apply middleware
  const middleware = APIMiddleware.createAPIMiddleware({
    rateLimit: { windowMs: 60000, max: 100 }, // 100 requests per minute
    maxRequestSize: 1024 * 1024, // 1MB
  });
  
  await middleware(request);

  // Authenticate user
  const authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
  
  if (authenticatedUser.user_type !== 'administrator') {
    throw ErrorHandler.accessDenied('Only administrators can access user data');
  }

  // Get query parameters with validation
  const { searchParams } = new URL(request.url);
  
  // Validate pagination parameters
  const { page, limit } = Validator.validatePagination(
    searchParams.get('page') || undefined,
    searchParams.get('limit') || undefined
  );
  
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
  
  // Validate user type if provided
  if (userType && !['customer', 'astrologer', 'administrator', 'manager'].includes(userType)) {
    throw ErrorHandler.validationError('Invalid user type provided');
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  // Build query with input sanitization
  const query: Record<string, unknown> = {};
  
  if (userType && userType !== 'all') {
    query.user_type = userType;
  }
  
  // Handle search with proper regex escaping
  if (search) {
    const searchRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
    query.$or = [
      { full_name: { $regex: searchRegex, $options: 'i' } },
      { email_address: { $regex: searchRegex, $options: 'i' } },
      { phone_number: { $regex: searchRegex, $options: 'i' } }
    ];
  }
  
  // Add filters
  if (accountStatus) {
    query.account_status = accountStatus;
  }
  
  if (verificationStatus) {
    query.verification_status = verificationStatus;
  }
  
  if (skills) {
    const skillsRegex = skills.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.skills = { $regex: skillsRegex, $options: 'i' };
  }
  
  if (city) {
    const cityRegex = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.city = { $regex: cityRegex, $options: 'i' };
  }
  
  if (state) {
    const stateRegex = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.state = { $regex: stateRegex, $options: 'i' };
  }
  
  if (country) {
    const countryRegex = country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.country = { $regex: countryRegex, $options: 'i' };
  }
  
  // Date range filter
  if (fromDate || toDate) {
    query.created_at = {};
    if (fromDate) {
      const from = new Date(fromDate);
      if (isNaN(from.getTime())) {
        throw ErrorHandler.validationError('Invalid fromDate format');
      }
      (query.created_at as Record<string, unknown>).$gte = from;
    }
    if (toDate) {
      const to = new Date(toDate);
      if (isNaN(to.getTime())) {
        throw ErrorHandler.validationError('Invalid toDate format');
      }
      // Set to end of day
      to.setHours(23, 59, 59, 999);
      (query.created_at as Record<string, unknown>).$lte = to;
    }
  }

  try {
    // Get collections
    const usersCollection = await DatabaseService.getCollection('users');
    const mediaCollection = await DatabaseService.getCollection('media');
    
    // Get base URL for image resolution
    const baseUrl = getBaseUrl(request);
    
    // Execute queries in parallel for better performance
    const [users, totalCount] = await Promise.all([
      usersCollection
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments(query)
    ]);

    // Process users and resolve profile images
    const processedUsers = await Promise.all(
      users.map(async (user) => {
        const profileImage = await resolveProfileImage(user, mediaCollection, baseUrl);
        
        return {
          _id: user._id,
          full_name: user.full_name || '',
          email_address: user.email_address || '',
          phone_number: user.phone_number || '',
          user_type: user.user_type || '',
          account_status: user.account_status || 'inactive',
          verification_status: user.verification_status || 'unverified',
          profile_image: profileImage,
          is_online: user.is_online || false,
          city: user.city || '',
          state: user.state || '',
          country: user.country || '',
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
          // Include additional fields for astrologers
          ...(user.user_type === 'astrologer' && {
            experience_years: user.experience_years || '',
            languages: user.languages || '',
            skills: user.skills || '',
            call_rate: user.call_rate || 0,
            chat_rate: user.chat_rate || 0,
            video_rate: user.video_rate || 0,
            rating: user.rating || 0,
            total_reviews: user.total_reviews || 0,
            total_consultations: user.total_consultations || 0
          })
        };
      })
    );

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users: processedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      }
    });

  } catch (error) {
    if ((error as Record<string, unknown>).name === 'MongoError' || (error as Record<string, unknown>).name === 'MongoServerError') {
      throw ErrorHandler.databaseError('Failed to fetch users from database');
    }
    throw error;
  }
}

// POST - Create new user (admin only)
async function handleCreateUser(request: NextRequest): Promise<NextResponse> {
  // Apply middleware
  const middleware = APIMiddleware.createAPIMiddleware({
    rateLimit: { windowMs: 60000, max: 10 }, // 10 user creations per minute
    maxRequestSize: 5 * 1024 * 1024, // 5MB for potential file uploads
  });
  
  await middleware(request);

  // Authenticate user
  const authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
  
  if (authenticatedUser.user_type !== 'administrator') {
    throw ErrorHandler.accessDenied('Only administrators can create users');
  }

  // Parse and validate request body
  const body = await request.json();
  
  // Validate required fields
  Validator.validateRequestBody(body, [
    { field: 'full_name', value: body.full_name, rules: ['required', 'minLength:2', 'maxLength:100'] },
    { field: 'email_address', value: body.email_address, rules: ['required', 'email'] },
    { field: 'user_type', value: body.user_type, rules: ['required'] }
  ]);

  // Validate user type
  if (!['customer', 'astrologer', 'administrator', 'manager'].includes(body.user_type)) {
    throw ErrorHandler.validationError('Invalid user type');
  }

  // Validate optional fields
  if (body.phone_number) {
    Validator.validateRequestBody(body, [
      { field: 'phone_number', value: body.phone_number, rules: ['phone'] }
    ]);
  }

  if (body.password) {
    Validator.validatePassword(body.password, false); // Don't require strong password for admin-created users
  }

  try {
    const usersCollection = await DatabaseService.getCollection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email_address: body.email_address },
        ...(body.phone_number ? [{ phone_number: body.phone_number }] : [])
      ]
    });

    if (existingUser) {
      throw ErrorHandler.createError(
        ErrorCode.DUPLICATE_ENTRY,
        'User already exists',
        'A user with this email or phone number already exists'
      );
    }

    // Create user data
    const userData = {
      full_name: body.full_name,
      email_address: body.email_address.toLowerCase(),
      phone_number: body.phone_number || '',
      user_type: body.user_type,
      account_status: body.account_status || 'active',
      verification_status: body.verification_status || 'verified', // Admin-created users are verified by default
      created_at: new Date(),
      updated_at: new Date(),
      created_by: authenticatedUser.userId,
      // Add additional fields based on user type
      ...(body.user_type === 'astrologer' && {
        experience_years: body.experience_years || '',
        languages: body.languages || '',
        skills: body.skills || '',
        call_rate: parseFloat(body.call_rate) || 0,
        chat_rate: parseFloat(body.chat_rate) || 0,
        video_rate: parseFloat(body.video_rate) || 0,
        qualifications: body.qualifications || []
      })
    };

    // Hash password if provided
    if (body.password) {
      const { PasswordSecurity } = await import('../../../lib/security');
      (userData as Record<string, unknown>).password = await PasswordSecurity.hashPassword(body.password as string);
    }

    // Insert user
    const result = await usersCollection.insertOne(userData);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        userId: result.insertedId.toString(),
        user: {
          _id: result.insertedId,
          full_name: userData.full_name,
          email_address: userData.email_address,
          user_type: userData.user_type,
          account_status: userData.account_status,
          created_at: userData.created_at
        }
      }
    }, { status: 201 });

  } catch (error) {
    if ((error as Record<string, unknown>).name === 'MongoError' || (error as Record<string, unknown>).name === 'MongoServerError') {
      throw ErrorHandler.databaseError('Failed to create user');
    }
    throw error;
  }
}

// Export functions directly
export const GET = handleGetUsers;
export const POST = handleCreateUser;