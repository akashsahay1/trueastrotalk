import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { SecurityMiddleware } from '@/lib/security';
import { ObjectId } from 'mongodb';

// GET - Check if current user can add a review for an astrologer
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await SecurityMiddleware.authenticateRequest(request);
    console.log('🔍 Authenticated user:', user);
    
    const currentUserId = user.userId as string;
    console.log('🔍 Current user ID:', currentUserId);
    
    // Get astrologer ID from query params
    const { searchParams } = new URL(request.url);
    const astrologerId = searchParams.get('astrologer_id');
    console.log('🔍 Astrologer ID:', astrologerId);
    
    if (!astrologerId) {
      return NextResponse.json(
        { success: false, error: 'Astrologer ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(currentUserId) || !ObjectId.isValid(astrologerId)) {
      console.log('❌ Invalid ObjectId - userId:', currentUserId, 'astrologerId:', astrologerId);
      return NextResponse.json(
        { success: false, error: 'Invalid user or astrologer ID' },
        { status: 400 }
      );
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const reviewsCollection = await DatabaseService.getCollection('reviews');
    
    // Check if user has had a completed session with this astrologer
    const sessionQuery = {
      user_id: new ObjectId(currentUserId),
      astrologer_id: new ObjectId(astrologerId),
      status: 'completed'
    };
    console.log('🔍 Session query:', sessionQuery);
    
    const completedSession = await sessionsCollection.findOne(sessionQuery);
    console.log('🔍 Found completed session:', completedSession ? 'YES' : 'NO');
    if (completedSession) {
      console.log('   Session details:', {
        id: completedSession._id,
        type: completedSession.session_type,
        status: completedSession.status,
        created: completedSession.created_at
      });
    }
    
    const hasConsulted = !!completedSession;
    
    // Check if user has already reviewed this astrologer
    const reviewQuery = {
      user_id: new ObjectId(currentUserId),
      astrologer_id: new ObjectId(astrologerId)
    };
    console.log('🔍 Review query:', reviewQuery);
    
    const existingReview = await reviewsCollection.findOne(reviewQuery);
    console.log('🔍 Found existing review:', existingReview ? 'YES' : 'NO');
    
    const hasUserReviewed = !!existingReview;
    
    // User can add review if they have consulted and haven't reviewed yet
    const canAddReview = hasConsulted && !hasUserReviewed;
    
    console.log('🔍 Final result:', {
      hasConsulted,
      hasUserReviewed,
      canAddReview
    });
    
    return NextResponse.json({
      success: true,
      canAddReview,
      hasUserReviewed,
      hasConsulted,
      sessionId: completedSession?._id?.toString() || null
    });
    
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check review eligibility',
        canAddReview: false,
        hasUserReviewed: false,
        hasConsulted: false
      },
      { status: 500 }
    );
  }
}