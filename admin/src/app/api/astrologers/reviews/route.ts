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

    if (!astrologer_id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Invalid astrologer ID format' },
        { status: 400 }
      );
    }

    const reviewsCollection = await DatabaseService.getCollection('reviews');
    const usersCollection = await DatabaseService.getCollection('users');

    // Get reviews for the astrologer
    const reviews = await reviewsCollection.find({
      astrologer_id: astrologer_id
    }).sort({ created_at: -1 }).toArray();

    // Populate user details for each review
    const reviewsWithUserDetails = await Promise.all(
      reviews.map(async (review) => {
        const user = await usersCollection.findOne(
          { user_id: review.user_id },
          { projection: { full_name: 1, email_address: 1, social_profile_image: 1, profile_picture: 1, profile_image: 1 } }
        );

        // Log missing users for data integrity monitoring
        if (!user) {
          console.warn(`⚠️ Review ${review._id} references missing user: ${review.user_id}`);
        }

        return {
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          user: {
            name: user?.full_name,
            email: user?.email_address,
            social_profile_image: user?.social_profile_image,
            profile_picture: user?.profile_picture,
            profile_image: user?.profile_image
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

    console.log('📝 Review submission request:', { astrologer_id, user_id, rating, comment: comment?.substring(0, 50) });

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

    // Validate IDs are non-empty strings
    if (typeof astrologer_id !== 'string' || typeof user_id !== 'string' ||
        !astrologer_id.trim() || !user_id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const reviewsCollection = await DatabaseService.getCollection('reviews');
    const usersCollection = await DatabaseService.getCollection('users');

    // Verify astrologer exists using custom user_id field
    const astrologer = await usersCollection.findOne({
      user_id: astrologer_id,
      user_type: 'astrologer'
    });

    if (!astrologer) {
      return NextResponse.json(
        { success: false, error: 'Astrologer not found' },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this astrologer using custom user_id fields
    const existingReview = await reviewsCollection.findOne({
      astrologer_id: astrologer_id,
      user_id: user_id
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this astrologer' },
        { status: 400 }
      );
    }

    // Create new review using custom user_id strings
    const newReview = {
      astrologer_id: astrologer_id,
      user_id: user_id,
      rating: parseInt(rating),
      comment: comment || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await reviewsCollection.insertOne(newReview);

    if (result.insertedId) {
      // Update astrologer's average rating
      await updateAstrologerRating(astrologer_id);

      console.log('✅ Review added successfully:', result.insertedId);

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

// PUT /api/astrologers/reviews - Update an existing review
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { review_id, user_id, rating, comment } = body;

    console.log('✏️ Review update request:', { review_id, user_id, rating });

    // Validate required fields
    if (!review_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Review ID and user ID are required' },
        { status: 400 }
      );
    }

    // Validate review_id is a valid ObjectId
    if (!ObjectId.isValid(review_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID format' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const reviewsCollection = await DatabaseService.getCollection('reviews');

    // Find the review and verify ownership
    const review = await reviewsCollection.findOne({
      _id: new ObjectId(review_id),
      user_id: user_id
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    // Update the review
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    if (rating !== undefined) {
      updateData.rating = parseInt(rating);
    }

    if (comment !== undefined) {
      updateData.comment = comment;
    }

    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(review_id) },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      // Update astrologer's average rating
      await updateAstrologerRating(review.astrologer_id);

      console.log('✅ Review updated successfully:', review_id);

      return NextResponse.json({
        success: true,
        message: 'Review updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'No changes made to the review' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/astrologers/reviews - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const review_id = searchParams.get('review_id');
    const user_id = searchParams.get('user_id');

    console.log('🗑️ Review delete request:', { review_id, user_id });

    // Validate required parameters
    if (!review_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Review ID and user ID are required' },
        { status: 400 }
      );
    }

    // Validate review_id is a valid ObjectId
    if (!ObjectId.isValid(review_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID format' },
        { status: 400 }
      );
    }

    const reviewsCollection = await DatabaseService.getCollection('reviews');

    // Find the review and verify ownership
    const review = await reviewsCollection.findOne({
      _id: new ObjectId(review_id),
      user_id: user_id
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Store astrologer_id before deleting
    const astrologer_id = review.astrologer_id;

    // Delete the review
    const result = await reviewsCollection.deleteOne({
      _id: new ObjectId(review_id)
    });

    if (result.deletedCount > 0) {
      // Update astrologer's average rating
      await updateAstrologerRating(astrologer_id);

      console.log('✅ Review deleted successfully:', review_id);

      return NextResponse.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete review' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

// Helper function to update astrologer's average rating
async function updateAstrologerRating(astrologer_id: string) {
  try {
    const reviewsCollection = await DatabaseService.getCollection('reviews');
    const usersCollection = await DatabaseService.getCollection('users');

    // Calculate new average rating using custom user_id field
    const reviews = await reviewsCollection.find({
      astrologer_id: astrologer_id
    }).toArray();

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      const totalReviews = reviews.length;

      // Update astrologer's rating and review count using custom user_id field
      await usersCollection.updateOne(
        { user_id: astrologer_id },
        {
          $set: {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            total_reviews: totalReviews,
            updated_at: new Date()
          }
        }
      );

      console.log(`✅ Updated rating for astrologer ${astrologer_id}: ${averageRating.toFixed(1)} (${totalReviews} reviews)`);
    }
  } catch (error) {
    console.error('❌ Error updating astrologer rating:', error);
  }
}