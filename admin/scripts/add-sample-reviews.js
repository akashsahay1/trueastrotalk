const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

async function addSampleReviews() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    const usersCollection = db.collection('users');
    const reviewsCollection = db.collection('reviews');
    
    // Get customer users (excluding administrators and astrologers)
    const customers = await usersCollection.find({
      user_type: { $in: ['customer', null] }, // null for users without explicit type
      account_status: 'active'
    }).limit(5).toArray();
    
    console.log(`📋 Found ${customers.length} customers`);
    
    // Get astrologer users
    const astrologers = await usersCollection.find({
      user_type: 'astrologer',
      account_status: 'active'
    }).limit(3).toArray();
    
    console.log(`👨‍🏫 Found ${astrologers.length} astrologers`);
    
    if (customers.length === 0 || astrologers.length === 0) {
      console.log('❌ Need at least 1 customer and 1 astrologer to create reviews');
      return;
    }
    
    // Sample review data
    const sampleReviews = [
      {
        rating: 5,
        comment: "Excellent consultation! Very insightful and accurate predictions. Highly recommended!"
      },
      {
        rating: 4,
        comment: "Good session, helpful guidance. Looking forward to next consultation."
      },
      {
        rating: 5,
        comment: "Amazing experience! The astrologer was very knowledgeable and patient."
      },
      {
        rating: 3,
        comment: "Decent consultation, some predictions were helpful."
      },
      {
        rating: 5,
        comment: "Best astrologer I've consulted with. Very detailed and accurate reading."
      }
    ];
    
    let reviewsAdded = 0;
    
    // Create reviews for each astrologer from different customers
    for (const astrologer of astrologers) {
      console.log(`\n⭐ Adding reviews for astrologer: ${astrologer.full_name}`);
      
      // Add 2-3 reviews per astrologer from different customers
      const numReviews = Math.min(customers.length, 3);
      const selectedCustomers = customers.slice(0, numReviews);
      
      for (let i = 0; i < selectedCustomers.length; i++) {
        const customer = selectedCustomers[i];
        const reviewData = sampleReviews[i % sampleReviews.length];
        
        // Check if review already exists
        const existingReview = await reviewsCollection.findOne({
          astrologer_id: astrologer._id,
          user_id: customer._id
        });
        
        if (existingReview) {
          console.log(`  ⏭️  Review already exists for ${customer.full_name}`);
          continue;
        }
        
        // Create review
        const review = {
          astrologer_id: astrologer._id,
          user_id: customer._id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          updated_at: new Date()
        };
        
        const result = await reviewsCollection.insertOne(review);
        
        if (result.insertedId) {
          console.log(`  ✅ Added review from ${customer.full_name} (${reviewData.rating}⭐)`);
          reviewsAdded++;
        }
      }
      
      // Update astrologer's rating
      const astrologerReviews = await reviewsCollection.find({
        astrologer_id: astrologer._id
      }).toArray();
      
      if (astrologerReviews.length > 0) {
        const totalRating = astrologerReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round((totalRating / astrologerReviews.length) * 10) / 10;
        
        await usersCollection.updateOne(
          { _id: astrologer._id },
          {
            $set: {
              rating: averageRating,
              total_reviews: astrologerReviews.length,
              updated_at: new Date()
            }
          }
        );
        
        console.log(`  📊 Updated astrologer rating: ${averageRating} (${astrologerReviews.length} reviews)`);
      }
    }
    
    console.log(`\n🎉 Successfully added ${reviewsAdded} reviews!`);
    console.log(`📊 Updated ratings for ${astrologers.length} astrologers`);
    
  } catch (error) {
    console.error('❌ Error adding sample reviews:', error);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
addSampleReviews();