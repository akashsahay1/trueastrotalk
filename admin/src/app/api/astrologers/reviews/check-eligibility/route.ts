import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { SecurityMiddleware } from '@/lib/security';
import { ObjectId } from 'mongodb';

// GET - Check if current user can add a review for an astrologer
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await SecurityMiddleware.authenticateRequest(request);
    const currentUserId = user.userId as string;
    
    // Get astrologer ID from query params
    const { searchParams } = new URL(request.url);
    const astrologerId = searchParams.get('astrologer_id');
    
    if (!astrologerId) {
      return NextResponse.json(
        { success: false, error: 'Astrologer ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(currentUserId) || !ObjectId.isValid(astrologerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user or astrologer ID' },
        { status: 400 }
      );
    }

    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const reviewsCollection = await DatabaseService.getCollection('reviews');
    
    // Check if user has had a completed session with this astrologer
    const completedSession = await sessionsCollection.findOne({
      user_id: new ObjectId(currentUserId),
      astrologer_id: new ObjectId(astrologerId),
      status: 'completed'
    });
    
    const hasConsulted = !!completedSession;
    
    // Check if user has already reviewed this astrologer
    const existingReview = await reviewsCollection.findOne({
      user_id: new ObjectId(currentUserId),
      astrologer_id: new ObjectId(astrologerId)
    });
    
    const hasUserReviewed = !!existingReview;
    
    // User can add review if they have consulted and haven't reviewed yet
    const canAddReview = hasConsulted && !hasUserReviewed;
    
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