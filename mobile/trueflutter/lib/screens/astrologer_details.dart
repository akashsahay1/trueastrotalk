import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/astrologer.dart';
import '../services/api/user_api_service.dart';
import '../services/api/reviews_api_service.dart';
import '../services/service_locator.dart';
import '../services/auth/auth_service.dart';
import '../services/chat/chat_service.dart';
import '../services/call/call_service.dart';
import '../services/wallet/wallet_service.dart';
import '../models/call.dart';
import 'package:share_plus/share_plus.dart';
import 'chat_screen.dart';
import 'wallet.dart';

class AstrologerDetailsScreen extends StatefulWidget {
  final Astrologer? astrologer;
  final String? astrologerId;

  const AstrologerDetailsScreen({
    super.key, 
    this.astrologer,
    this.astrologerId,
  }) : assert(astrologer != null || astrologerId != null, 'Either astrologer or astrologerId must be provided');

  @override
  State<AstrologerDetailsScreen> createState() => _AstrologerDetailsScreenState();
}

class _AstrologerDetailsScreenState extends State<AstrologerDetailsScreen> {
  Astrologer? _astrologer;
  bool _isLoading = false;
  bool _isAboutExpanded = false;
  bool _canAddReview = false;
  bool _hasUserReviewed = false;
  List<Map<String, dynamic>> _reviews = [];
  
  late final WalletService _walletService;

  @override
  void initState() {
    super.initState();
    
    // Initialize services
    _walletService = getIt<WalletService>();
    
    // Set initial astrologer if provided
    _astrologer = widget.astrologer;
    
    // Load astrologer data if only ID is provided
    if (_astrologer == null && widget.astrologerId != null) {
      _loadAstrologerData();
    } else if (_astrologer != null) {
      _loadReviews();
    }
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _loadAstrologerData() async {
    if (widget.astrologerId == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      // Fetch astrologer details from API
      final userApiService = getIt<UserApiService>();
      _astrologer = await userApiService.getAstrologerById(widget.astrologerId!);
      
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        _loadReviews();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load astrologer details: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _loadReviews() async {
    try {
      debugPrint('🔍 Loading reviews for astrologer: ${_astrologer!.id}');
      
      final reviewsApiService = getIt<ReviewsApiService>();
      final result = await reviewsApiService.getAstrologerReviews(_astrologer!.id);
      
      if (result['success']) {
        final reviewsList = result['reviews'] as List;
        if (mounted) {
          setState(() {
            _reviews = reviewsList.cast<Map<String, dynamic>>();
          });
        }
        debugPrint('✅ Loaded ${_reviews.length} reviews');
      } else {
        debugPrint('❌ Failed to load reviews: ${result['error']}');
        if (mounted) {
          setState(() {
            _reviews = [];
          });
        }
      }
      
      // Check if user can add a review
      await _checkReviewEligibility();
    } catch (e) {
      debugPrint('❌ Error loading reviews: $e');
      if (mounted) {
        setState(() {
          _reviews = [];
        });
      }
    }
  }

  Future<void> _checkReviewEligibility() async {
    try {
      debugPrint('🔍 Checking review eligibility for astrologer: ${_astrologer!.id}');
      debugPrint('🔍 Astrologer name: ${_astrologer!.fullName}');
      
      // Check if user is logged in
      final authService = getIt<AuthService>();
      final currentUser = authService.currentUser;
      debugPrint('🔍 Current user: ${currentUser?.name} (${currentUser?.email}) - ID: ${currentUser?.id}');
      
      if (currentUser == null) {
        debugPrint('❌ User not logged in');
        return;
      }
      
      final reviewsApiService = getIt<ReviewsApiService>();
      final result = await reviewsApiService.checkReviewEligibility(_astrologer!.id);
      
      debugPrint('🔍 Review eligibility API result: $result');
      
      if (result['success']) {
        if (mounted) {
          setState(() {
            _canAddReview = result['canAddReview'] ?? false;
            _hasUserReviewed = result['hasUserReviewed'] ?? false;
          });
        }
        debugPrint('✅ Review eligibility: canAdd=$_canAddReview, hasReviewed=$_hasUserReviewed');
      } else {
        debugPrint('❌ Failed to check review eligibility: ${result['error']}');
        if (mounted) {
          setState(() {
            _canAddReview = false;
            _hasUserReviewed = false;
          });
        }
      }
    } catch (e) {
      debugPrint('❌ Error checking review eligibility: $e');
      if (mounted) {
        setState(() {
          _canAddReview = false;
          _hasUserReviewed = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show loading spinner if astrologer data is being loaded
    if (_isLoading || _astrologer == null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: Text(
            'Profile',
            style: AppTextStyles.heading6.copyWith(color: AppColors.white),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.share, color: AppColors.white),
              onPressed: () {},
            ),
          ],
        ),
        body: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Profile',
          style: AppTextStyles.heading6.copyWith(color: AppColors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: AppColors.white),
            onPressed: _shareAstrologer,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildProfileCard(),
            _buildAboutSection(),
            _buildSkillsSection(),
            _buildReviewsSection(),
            if (_canAddReview && !_hasUserReviewed)
              _buildAddReviewSection(),
            const SizedBox(height: 100), // Space for bottom action bar
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomActionBar(),
    );
  }

  Widget _buildProfileCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProfileImage(),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _astrologer!.fullName,
                        style: AppTextStyles.heading5.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimaryLight,
                        ),
                      ),
                    ),
                    Icon(
                      Icons.check_circle,
                      color: Colors.blue,
                      size: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: List.generate(5, (index) {
                    return Icon(
                      index < _astrologer!.rating.round() ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 16,
                    );
                  }),
                ),
                const SizedBox(height: 8),
                Text(
                  '${_astrologer!.experienceYears}+ years • ${_astrologer!.languagesText}',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${_astrologer!.totalConsultations} consultations completed',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileImage() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipOval(
        child: _astrologer!.profileImage != null && _astrologer!.profileImage!.isNotEmpty
            ? Image.network(
                _astrologer!.profileImage!,
                width: 60,
                height: 60,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildFallbackAvatar();
                },
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return _buildLoadingAvatar();
                },
              )
            : _buildFallbackAvatar(),
      ),
    );
  }

  Widget _buildFallbackAvatar() {
    final name = _astrologer!.fullName;
    final initials = name.isNotEmpty ? name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase() : 'A';

    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.primary.withValues(alpha: 0.7), AppColors.primary], begin: Alignment.topLeft, end: Alignment.bottomRight),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.heading6.copyWith(color: AppColors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildLoadingAvatar() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(color: AppColors.grey200, shape: BoxShape.circle),
      child: const Center(child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary))),
    );
  }





  Widget _buildAboutSection() {
    final bioText = _astrologer!.bio ?? 'Experienced astrologer with ${_astrologer!.experienceYears} years of practice. Specializes in providing accurate readings and guidance to help you navigate life\'s challenges.';
    final shouldShowToggle = bioText.length > 100;
    final displayText = _isAboutExpanded || !shouldShowToggle 
        ? bioText 
        : '${bioText.substring(0, 100)}...';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Heading outside the card
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            'About Me',
            style: AppTextStyles.bodyLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ),
        // About card
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(16),
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                displayText,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondaryLight,
                  height: 1.5,
                ),
              ),
              if (shouldShowToggle) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: GestureDetector(
                    onTap: () {
                      if (mounted) {
                        setState(() {
                          _isAboutExpanded = !_isAboutExpanded;
                        });
                      }
                    },
                    child: Text(
                      _isAboutExpanded ? 'Less' : 'More',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSkillsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Heading outside the card
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            'Skills & Specializations',
            style: AppTextStyles.bodyLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ),
        // Skills card
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(16),
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _astrologer!.skills.map((skill) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: Text(
                  skill,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewsSection() {
    // Reviews are loaded from the API via ReviewsApiService
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Heading outside the card
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            'Reviews & Ratings',
            style: AppTextStyles.bodyLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ),
        if (_reviews.isEmpty)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                Icon(
                  Icons.rate_review_outlined,
                  size: 48,
                  color: AppColors.textSecondaryLight,
                ),
                const SizedBox(height: 12),
                Text(
                  'No reviews yet',
                  style: AppTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Be the first to leave a review!',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        if (_reviews.isNotEmpty) ...[
          ..._reviews.map((review) => _buildReviewCard(review)),
          const SizedBox(height: 16),
          _buildSeeAllReviewsButton(),
        ],
      ],
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> review) {
    final user = review['user'] as Map<String, dynamic>? ?? {};
    final userName = user['name']?.toString() ?? 'Anonymous';
    final rating = review['rating'] as int? ?? 0;
    final comment = review['comment']?.toString() ?? '';
    
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [AppColors.primary.withValues(alpha: 0.7), AppColors.primary],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Center(
              child: Text(
                userName.isNotEmpty ? userName[0].toUpperCase() : 'A',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      userName,
                      style: AppTextStyles.bodyLarge.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    Icon(
                      Icons.check_circle,
                      color: Colors.blue,
                      size: 18,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: List.generate(5, (index) {
                    return Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 16,
                    );
                  }),
                ),
                if (comment.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    comment,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSeeAllReviewsButton() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: TextButton(
        onPressed: () {
          // Navigate to all reviews screen
        },
        child: Text(
          'See all reviews',
          style: AppTextStyles.bodyLarge.copyWith(
            color: Colors.green,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  int _selectedRating = 0;
  final TextEditingController _reviewController = TextEditingController();
  bool _isSubmittingReview = false;

  Widget _buildAddReviewSection() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Add Your Review',
            style: AppTextStyles.bodyLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 12),
          // Rating selector
          Row(
            children: [
              Text(
                'Rating: ',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(width: 8),
              ...List.generate(5, (index) {
                return GestureDetector(
                  onTap: () {
                    if (mounted) {
                      setState(() {
                        _selectedRating = index + 1;
                      });
                    }
                  },
                  child: Icon(
                    index < _selectedRating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 28,
                  ),
                );
              }),
            ],
          ),
          const SizedBox(height: 12),
          // Comment input
          TextField(
            controller: _reviewController,
            maxLines: 3,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: 'Write your review (optional)...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: AppColors.borderLight),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Submit button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedRating > 0 && !_isSubmittingReview ? _submitReview : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isSubmittingReview
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                      ),
                    )
                  : const Text('Submit Review'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitReview() async {
    if (_selectedRating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a rating'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (mounted) {
      setState(() {
        _isSubmittingReview = true;
      });
    }

    try {
      final reviewsApiService = getIt<ReviewsApiService>();
      // Get current user ID from auth service
      final authService = getIt<AuthService>();
      final currentUser = authService.currentUser;
      
      if (currentUser == null) {
        throw Exception('User not logged in');
      }

      final result = await reviewsApiService.addReview(
        astrologerId: _astrologer!.id,
        userId: currentUser.id,
        rating: _selectedRating,
        comment: _reviewController.text.trim(),
      );

      if (result['success']) {
        // Show success message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Review submitted successfully!'),
              backgroundColor: AppColors.success,
            ),
          );
        }

        // Reset form
        if (mounted) {
          setState(() {
            _selectedRating = 0;
            _reviewController.clear();
            _hasUserReviewed = true;
            _canAddReview = false;
          });
        }

        // Reload reviews
        await _loadReviews();
      } else {
        throw Exception(result['error'] ?? 'Failed to submit review');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit review: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingReview = false;
        });
      }
    }
  }







  Widget _buildBottomActionBar() {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!_astrologer!.isOnline) 
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.offline_bolt, size: 16, color: AppColors.error),
                    const SizedBox(width: 8),
                    Text(
                      'Astrologer is currently offline',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _astrologer!.isOnline ? () => _startChat() : null,
                    icon: Icon(
                      Icons.chat, 
                      size: 20,
                      color: _astrologer!.isOnline ? Colors.green : AppColors.grey400,
                    ),
                    label: Text(
                      'Chat',
                      style: AppTextStyles.buttonMedium.copyWith(
                        color: _astrologer!.isOnline ? Colors.green : AppColors.grey400,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: _astrologer!.isOnline ? Colors.green : AppColors.grey400,
                        width: 1.5,
                      ),
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
                    ),
                  ),
                ),
                const SizedBox(width: Dimensions.spacingMd),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _astrologer!.isOnline ? () => _startCall() : null,
                    icon: Icon(
                      Icons.call, 
                      size: 20,
                      color: _astrologer!.isOnline ? Colors.green : AppColors.grey400,
                    ),
                    label: Text(
                      'Call',
                      style: AppTextStyles.buttonMedium.copyWith(
                        color: _astrologer!.isOnline ? Colors.green : AppColors.grey400,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: _astrologer!.isOnline ? Colors.green : AppColors.grey400,
                        width: 1.5,
                      ),
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Action methods
  void _shareAstrologer() async {
    try {
      final shareText = '''
🔮 ${_astrologer!.fullName} - Expert Astrologer

⭐ Rating: ${_astrologer!.ratingText} (${_astrologer!.totalReviews} reviews)
💼 Experience: ${_astrologer!.experienceYears} years
🎯 Specializations: ${_astrologer!.skills.take(3).join(', ')}

💬 Chat: ${_astrologer!.chatRate == 0 ? 'FREE' : '₹${_astrologer!.chatRate.toInt()}/min'}
📞 Call: ₹${_astrologer!.callRate.toInt()}/min
🎥 Video: ₹${_astrologer!.videoRate.toInt()}/min

Connect now on True AstroTalk! 🌟
      ''';
      
      await Share.share(
        shareText,
        subject: '${_astrologer!.fullName} - Expert Astrologer on True AstroTalk',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to share: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }


  void _startChat() async {
    if (!_astrologer!.isOnline) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${_astrologer!.fullName} is currently offline'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    try {
      // Show loading indicator
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Starting chat with ${_astrologer!.fullName}...'),
          backgroundColor: AppColors.info,
        ),
      );

      // Start chat session
      final chatService = getIt<ChatService>();
      final chatSession = await chatService.startChatSession(_astrologer!.id);

      // Navigate to chat screen
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              chatSession: chatSession,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start chat: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _startCall() async {
    if (!_astrologer!.isOnline) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${_astrologer!.fullName} is currently offline'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // Show call type selection dialog
    final callType = await _showCallTypeDialog();
    if (callType == null) return;

    // Check wallet balance for selected call type
    final callTypeStr = callType == CallType.video ? 'video' : 'voice';
    final hasSufficientBalance = _walletService.hasSufficientBalanceForCall(_astrologer!, callTypeStr);

    if (!hasSufficientBalance) {
      final message = _walletService.getInsufficientCallBalanceMessage(_astrologer!, callTypeStr);

      // Show insufficient balance dialog with recharge option
      final shouldRecharge = await _showInsufficientBalanceDialog(message);
      if (shouldRecharge == true && mounted) {
        // Navigate to wallet screen for recharge
        Navigator.of(context).push(MaterialPageRoute(builder: (context) => const WalletScreen()));
      }
      return;
    }

    // Show loading state immediately after dialog closes
    if (mounted) {
      setState(() {
        _isLoading = true;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Starting ${callType.displayName.toLowerCase()} call...'),
              ),
            ],
          ),
          backgroundColor: AppColors.info,
          duration: const Duration(seconds: 10), // Longer duration for loading
        ),
      );
    }

    try {
      // Defer heavy work to prevent UI freezing
      await Future.microtask(() async {
        final callService = getIt<CallService>();
        await callService.initialize(); // Ensure call service is initialized
        await callService.startCallSession(_astrologer!.id, callType);
      });
      
      // Success feedback
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${callType.displayName} call initiated successfully!'),
            backgroundColor: AppColors.success,
            duration: const Duration(seconds: 2),
          ),
        );
      }
      
    } catch (e) {
      debugPrint('❌ Call initiation failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start call: ${e.toString()}'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      // Always hide loading state
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<CallType?> _showCallTypeDialog() async {
    return showDialog<CallType>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text(
          'Choose Call Type',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.call, color: AppColors.primary),
              title: const Text(
                'Voice Call',
                style: TextStyle(
                  color: Colors.black87,
                  fontWeight: FontWeight.w500,
                ),
              ),
              subtitle: Text(
                '₹${_astrologer!.callRate.toInt()}/min',
                style: TextStyle(
                  color: Colors.grey[700],
                ),
              ),
              onTap: () => Navigator.pop(context, CallType.voice),
            ),
            ListTile(
              leading: const Icon(Icons.videocam, color: AppColors.primary),
              title: const Text(
                'Video Call',
                style: TextStyle(
                  color: Colors.black87,
                  fontWeight: FontWeight.w500,
                ),
              ),
              subtitle: Text(
                '₹${_astrologer!.videoRate.toInt()}/min',
                style: TextStyle(
                  color: Colors.grey[700],
                ),
              ),
              onTap: () => Navigator.pop(context, CallType.video),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ],
      ),
    );
  }

  Future<bool?> _showInsufficientBalanceDialog(String message) async {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: Row(
          children: [
            Icon(Icons.account_balance_wallet, color: AppColors.error),
            const SizedBox(width: 8),
            const Text(
              'Insufficient Balance',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: TextStyle(
            color: Colors.black87,
            fontSize: 14,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false), 
            child: Text(
              'Cancel',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary, 
              foregroundColor: AppColors.white,
              elevation: 2,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min, 
              children: [
                const Icon(Icons.add, size: 16), 
                const SizedBox(width: 4), 
                const Text(
                  'Recharge Wallet',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

}
