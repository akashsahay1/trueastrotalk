import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';

// GET /api/astrologers/reviews?astrologer_id={id} - Get reviews for an astrologer
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const astrologer_id = searchParams.get('astrologer_id');
    
    if (!astrologer_id) {
      return NextResponse.json(
        { success: false, error: 'Astrologer ID is required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(astrologer_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid astrologer ID format' },
        { status: 400 }
      );
    }

    const reviewsCollection = await DatabaseService.getCollection('reviews');
    const usersCollection = await DatabaseService.getCollection('users');

    // Get reviews for the astrologer
    const reviews = await reviewsCollection.find({
      astrologer_id: new ObjectId(astrologer_id)
    }).sort({ created_at: -1 }).toArray();

    // Populate user details for each review
    const reviewsWithUserDetails = await Promise.all(
      reviews.map(async (review) => {
        const user = await usersCollection.findOne(
          { _id: review.user_id },
          { projection: { full_name: 1, email: 1, profile_image_id: 1 } }
        );

        return {
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          user: {
            name: user?.full_name || 'Anonymous',
            email: user?.email || '',
            profile_image_id: user?.profile_image_id || null
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      reviews: reviewsWithUserDetails,
      total_reviews: reviewsWithUserDetails.length
    });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/astrologers/reviews - Add a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { astrologer_id, user_id, rating, comment } = body;

    // Validate required fields
    if (!astrologer_id || !user_id || !rating) {
      return NextResponse.json(
        { success: false, error: 'Astrologer ID, user ID, and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(astrologer_id) || !ObjectId.isValid(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const reviewsCollection = await DatabaseService.getCollection('reviews');
    
    // Check if user has already reviewed this astrologer
    const existingReview = await reviewsCollection.findOne({
      astrologer_id: new ObjectId(astrologer_id),
      user_id: new ObjectId(user_id)
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this astrologer' },
        { status: 400 }
      );
    }

    // Create new review
    const newReview = {
      astrologer_id: new ObjectId(astrologer_id),
      user_id: new ObjectId(user_id),
      rating: parseInt(rating),
      comment: comment || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await reviewsCollection.insertOne(newReview);

    if (result.insertedId) {
      // Update astrologer's average rating
      await updateAstrologerRating(astrologer_id);

      return NextResponse.json({
        success: true,
        review_id: result.insertedId,
        message: 'Review added successfully'
      });
    } else {
      throw new Error('Failed to insert review');
    }

  } catch (error) {
    console.error('❌ Error adding review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add review' },
      { status: 500 }
    );
  }
}

// Helper function to update astrologer's average rating
async function updateAstrologerRating(astrologer_id: string) {
  try {
    const reviewsCollection = await DatabaseService.getCollection('reviews');
    const usersCollection = await DatabaseService.getCollection('users');

    // Calculate new average rating
    const reviews = await reviewsCollection.find({
      astrologer_id: new ObjectId(astrologer_id)
    }).toArray();

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      const totalReviews = reviews.length;

      // Update astrologer's rating and review count
      await usersCollection.updateOne(
        { _id: new ObjectId(astrologer_id) },
        {
          $set: {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            total_reviews: totalReviews,
            updated_at: new Date()
          }
        }
      );
    }
  } catch (error) {
    console.error('❌ Error updating astrologer rating:', error);
  }
}