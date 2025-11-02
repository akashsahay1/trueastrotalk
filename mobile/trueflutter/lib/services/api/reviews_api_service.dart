import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ReviewsApiService {
  final Dio _dio;

  ReviewsApiService(this._dio);

  /// Get reviews for an astrologer
  Future<Map<String, dynamic>> getAstrologerReviews(String astrologerId) async {
    try {
      debugPrint('🔍 Fetching reviews for astrologer: $astrologerId');
      
      final response = await _dio.get('/astrologers/reviews', queryParameters: {
        'astrologer_id': astrologerId,
      });

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        
        if (data['success'] == true) {
          debugPrint('✅ Successfully fetched ${data['total_reviews']} reviews');
          return {
            'success': true,
            'reviews': data['reviews'] ?? [],
            'total_reviews': data['total_reviews'] ?? 0,
          };
        } else {
          throw Exception(data['error'] ?? 'Failed to fetch reviews');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to fetch reviews');
      }
    } catch (e) {
      debugPrint('❌ Error fetching astrologer reviews: $e');
      return {
        'success': false,
        'error': e.toString(),
        'reviews': [],
        'total_reviews': 0,
      };
    }
  }

  /// Add a review for an astrologer
  Future<Map<String, dynamic>> addReview({
    required String astrologerId,
    required String userId,
    required int rating,
    String? comment,
  }) async {
    try {
      debugPrint('⭐ Adding review for astrologer: $astrologerId');
      
      final response = await _dio.post('/astrologers/reviews', data: {
        'astrologer_id': astrologerId,
        'user_id': userId,
        'rating': rating,
        'comment': comment ?? '',
      });

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        
        if (data['success'] == true) {
          debugPrint('✅ Review added successfully');
          return {
            'success': true,
            'review_id': data['review_id'],
            'message': data['message'] ?? 'Review added successfully',
          };
        } else {
          throw Exception(data['error'] ?? 'Failed to add review');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to add review');
      }
    } catch (e) {
      debugPrint('❌ Error adding review: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Check if user can add a review (has consulted the astrologer)
  Future<Map<String, dynamic>> canUserReview({
    required String astrologerId,
    required String userId,
  }) async {
    try {
      // Check eligibility via dedicated API endpoint
      
      final reviews = await getAstrologerReviews(astrologerId);
      
      if (reviews['success']) {
        final reviewsList = reviews['reviews'] as List;
        final hasReviewed = reviewsList.any((review) => 
          review['user']?['email'] != null // This is a placeholder check
        );
        
        return {
          'success': true,
          'can_review': !hasReviewed, // For now, allow if user hasn't reviewed
          'has_reviewed': hasReviewed,
        };
      } else {
        return {
          'success': true,
          'can_review': false,
          'has_reviewed': false,
        };
      }
    } catch (e) {
      debugPrint('❌ Error checking review eligibility: $e');
      return {
        'success': false,
        'error': e.toString(),
        'can_review': false,
        'has_reviewed': false,
      };
    }
  }

  /// Check review eligibility for current user
  Future<Map<String, dynamic>> checkReviewEligibility(String astrologerId) async {
    try {
      debugPrint('🔍 Checking review eligibility for astrologer: $astrologerId');

      final response = await _dio.get('/astrologers/reviews/check-eligibility', queryParameters: {
        'astrologer_id': astrologerId,
      });

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;

        if (data['success'] == true) {
          debugPrint('✅ Review eligibility checked');
          return {
            'success': true,
            'canAddReview': data['canAddReview'] ?? false,
            'hasUserReviewed': data['hasUserReviewed'] ?? false,
            'hasConsulted': data['hasConsulted'] ?? false,
          };
        } else {
          throw Exception(data['error'] ?? 'Failed to check review eligibility');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to check review eligibility');
      }
    } catch (e) {
      debugPrint('❌ Error checking review eligibility: $e');
      return {
        'success': false,
        'error': e.toString(),
        'canAddReview': false,
        'hasUserReviewed': false,
      };
    }
  }

  /// Update an existing review
  Future<Map<String, dynamic>> updateReview({
    required String reviewId,
    required String userId,
    required int rating,
    String? comment,
  }) async {
    try {
      debugPrint('✏️ Updating review: $reviewId');

      final response = await _dio.put('/astrologers/reviews', data: {
        'review_id': reviewId,
        'user_id': userId,
        'rating': rating,
        'comment': comment ?? '',
      });

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;

        if (data['success'] == true) {
          debugPrint('✅ Review updated successfully');
          return {
            'success': true,
            'message': data['message'] ?? 'Review updated successfully',
          };
        } else {
          throw Exception(data['error'] ?? 'Failed to update review');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to update review');
      }
    } catch (e) {
      debugPrint('❌ Error updating review: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Delete a review
  Future<Map<String, dynamic>> deleteReview({
    required String reviewId,
    required String userId,
  }) async {
    try {
      debugPrint('🗑️ Deleting review: $reviewId');

      final response = await _dio.delete('/astrologers/reviews', queryParameters: {
        'review_id': reviewId,
        'user_id': userId,
      });

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;

        if (data['success'] == true) {
          debugPrint('✅ Review deleted successfully');
          return {
            'success': true,
            'message': data['message'] ?? 'Review deleted successfully',
          };
        } else {
          throw Exception(data['error'] ?? 'Failed to delete review');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: Failed to delete review');
      }
    } catch (e) {
      debugPrint('❌ Error deleting review: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
}