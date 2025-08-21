import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/astrologer.dart';
import '../models/enums.dart';
import '../services/api/user_api_service.dart';
import '../services/service_locator.dart';
import '../services/chat/chat_service.dart';
import '../services/call/call_service.dart';
import '../models/call.dart';
import 'package:share_plus/share_plus.dart';
import 'chat_screen.dart';

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

class _AstrologerDetailsScreenState extends State<AstrologerDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Astrologer? _astrologer;
  bool _isLoading = false;
  bool _isFavorite = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    
    // Set initial astrologer if provided
    _astrologer = widget.astrologer;
    
    // Load astrologer data if only ID is provided
    if (_astrologer == null && widget.astrologerId != null) {
      _loadAstrologerData();
    } else if (_astrologer != null) {
      _loadFavoriteStatus();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
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
        _loadFavoriteStatus();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load astrologer details: $e'),
            backgroundColor: AppColors.error,
          ),
        );
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
            'Astrologer Details',
            style: AppTextStyles.heading6.copyWith(color: AppColors.white),
          ),
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
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(child: Column(children: [_buildAstrologerHeader(), _buildTabSection()])),
        ],
      ),
      floatingActionButton: _astrologer!.isOnline
          ? FloatingActionButton.extended(
              onPressed: _startChat,
              icon: const Icon(Icons.chat, color: AppColors.white),
              label: Text(
                'Quick Chat',
                style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white),
              ),
              backgroundColor: AppColors.success,
            )
          : null,
      bottomNavigationBar: _buildBottomActionBar(),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: AppColors.primary,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: AppColors.white),
        onPressed: () => Navigator.of(context).pop(),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.share, color: AppColors.white),
          onPressed: _shareAstrologer,
        ),
        IconButton(
          icon: Icon(
            _isFavorite ? Icons.favorite : Icons.favorite_border,
            color: AppColors.white,
          ),
          onPressed: _toggleFavorite,
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
          ),
          child: SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 60), // Space for app bar
                  _buildProfileImage(),
                  const SizedBox(height: Dimensions.spacingMd),
                  Text(
                    _astrologer!.fullName,
                    style: AppTextStyles.heading4.copyWith(color: AppColors.white, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: Dimensions.spacingSm),
                  _buildOnlineStatus(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileImage() {
    return Stack(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.white, width: 3),
            boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.2), blurRadius: 10, offset: const Offset(0, 5))],
          ),
          child: ClipOval(
            child: _astrologer!.profileImage != null && _astrologer!.profileImage!.isNotEmpty
                ? Image.network(
                    _astrologer!.profileImage!,
                    width: 100,
                    height: 100,
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
        ),
        if (_astrologer!.isOnline)
          Positioned(
            bottom: 5,
            right: 5,
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.white, width: 2),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildFallbackAvatar() {
    final name = _astrologer!.fullName;
    final initials = name.isNotEmpty ? name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase() : 'A';

    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.primary.withValues(alpha: 0.7), AppColors.primary], begin: Alignment.topLeft, end: Alignment.bottomRight),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.heading3.copyWith(color: AppColors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildLoadingAvatar() {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(color: AppColors.grey200, shape: BoxShape.circle),
      child: const Center(child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary))),
    );
  }

  Widget _buildOnlineStatus() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingMd, vertical: Dimensions.paddingSm),
      decoration: BoxDecoration(
        color: _astrologer!.isOnline ? AppColors.success.withValues(alpha: 0.2) : AppColors.error.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _astrologer!.isOnline ? AppColors.success : AppColors.error, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: _astrologer!.isOnline ? AppColors.success : AppColors.error, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            _astrologer!.isOnline ? 'Online' : 'Offline',
            style: AppTextStyles.bodySmall.copyWith(color: _astrologer!.isOnline ? AppColors.success : AppColors.error, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildAstrologerHeader() {
    return Container(
      margin: const EdgeInsets.all(Dimensions.paddingLg),
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusLg),
        boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          // Rating and Experience Row
          Row(
            children: [
              Expanded(
                child: _buildStatItem(icon: Icons.star, iconColor: AppColors.warning, value: _astrologer!.ratingText, label: '${_astrologer!.totalReviews} Reviews'),
              ),
              Container(width: 1, height: 40, color: AppColors.borderLight),
              Expanded(
                child: _buildStatItem(icon: Icons.work_outline, iconColor: AppColors.info, value: '${_astrologer!.experienceYears}+', label: 'Years Experience'),
              ),
              Container(width: 1, height: 40, color: AppColors.borderLight),
              Expanded(
                child: _buildStatItem(icon: Icons.chat_bubble_outline, iconColor: AppColors.success, value: _astrologer!.totalConsultations.toString(), label: 'Consultations'),
              ),
            ],
          ),
          const SizedBox(height: Dimensions.spacingLg),
          // Pricing Row
          Row(
            children: [
              Expanded(
                child: _buildPricingCard(title: 'Chat', price: _astrologer!.chatRate, icon: Icons.chat),
              ),
              const SizedBox(width: Dimensions.spacingMd),
              Expanded(
                child: _buildPricingCard(title: 'Call', price: _astrologer!.callRate, icon: Icons.call),
              ),
              const SizedBox(width: Dimensions.spacingMd),
              Expanded(
                child: _buildPricingCard(title: 'Video', price: _astrologer!.videoRate, icon: Icons.videocam),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({required IconData icon, required Color iconColor, required String value, required String label}) {
    return Column(
      children: [
        Icon(icon, color: iconColor, size: 24),
        const SizedBox(height: 6),
        Text(
          value,
          style: AppTextStyles.heading6.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimaryLight),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildPricingCard({required String title, required double price, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingMd),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(Dimensions.radiusMd),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primary, size: 24),
          const SizedBox(height: 6),
          Text(
            title,
            style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
          ),
          const SizedBox(height: 2),
          Text(
            price == 0 ? 'FREE' : '₹${price.toInt()}/min',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildTabSection() {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(Dimensions.radiusLg),
            boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: TabBar(
            controller: _tabController,
            indicator: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(Dimensions.radiusLg)),
            labelColor: AppColors.white,
            unselectedLabelColor: AppColors.textSecondaryLight,
            labelStyle: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
            unselectedLabelStyle: AppTextStyles.bodyMedium,
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            tabs: const [
              Tab(text: 'About'),
              Tab(text: 'Skills'),
              Tab(text: 'Reviews'),
            ],
          ),
        ),
        const SizedBox(height: Dimensions.spacingLg),
        SizedBox(
          height: 300,
          child: TabBarView(controller: _tabController, children: [_buildAboutTab(), _buildSpecializationsTab(), _buildReviewsTab()]),
        ),
        const SizedBox(height: 100), // Space for bottom action bar
      ],
    );
  }

  Widget _buildAboutTab() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg, vertical: Dimensions.paddingLg),
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusLg),
        boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'About ${_astrologer!.fullName}',
              style: AppTextStyles.heading6.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimaryLight),
            ),
            const SizedBox(height: 10),
            Text(
              _astrologer!.bio ?? 'Experienced astrologer with ${_astrologer!.experienceYears} years of practice. Specializes in providing accurate readings and guidance to help you navigate life\'s challenges.',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight, height: 1.5),
            ),
            const SizedBox(height: Dimensions.spacingLg),
            _buildInfoRow('Languages', _astrologer!.languagesText),
            const SizedBox(height: Dimensions.spacingMd),
            _buildInfoRow('Experience', '${_astrologer!.experienceYears} years'),
            const SizedBox(height: Dimensions.spacingMd),
            _buildInfoRow('Status', _astrologer!.verificationStatus.name),
            const SizedBox(height: Dimensions.spacingMd),
            _buildInfoRow('Phone', _astrologer!.phoneNumber ?? 'Not provided'),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppColors.textSecondaryLight),
          ),
        ),
        const SizedBox(width: Dimensions.spacingMd),
        Expanded(
          child: Text(value, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight)),
        ),
      ],
    );
  }

  Widget _buildSpecializationsTab() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusLg),
        boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Specializations',
              style: AppTextStyles.heading6.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimaryLight),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _astrologer!.skills.map((skill) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingMd, vertical: Dimensions.paddingSm),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    skill,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewsTab() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusLg),
        boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingMd),
                decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Icon(Icons.star, color: AppColors.warning, size: 32),
              ),
              const SizedBox(width: Dimensions.spacingMd),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _astrologer!.ratingText,
                    style: AppTextStyles.heading4.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimaryLight),
                  ),
                  Text('${_astrologer!.totalReviews} Reviews', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight)),
                ],
              ),
            ],
          ),
          const SizedBox(height: Dimensions.spacingLg),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.rate_review_outlined, size: 48, color: AppColors.textSecondaryLight),
                  const SizedBox(height: Dimensions.spacingMd),
                  Text(
                    'Reviews Coming Soon',
                    style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: AppColors.textSecondaryLight),
                  ),
                  const SizedBox(height: Dimensions.spacingSm),
                  Text(
                    'User reviews will be displayed here',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
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
                  child: ElevatedButton.icon(
                    onPressed: _astrologer!.isOnline ? () => _startChat() : null,
                    icon: const Icon(Icons.chat, size: 20),
                    label: Text(
                      _astrologer!.chatRate == 0 ? 'FREE CHAT' : 'CHAT ₹${_astrologer!.chatRate.toInt()}/min',
                      style: AppTextStyles.buttonMedium,
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _astrologer!.isOnline ? AppColors.success : AppColors.grey400,
                      foregroundColor: AppColors.white,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
                      elevation: _astrologer!.isOnline ? 2 : 0,
                    ),
                  ),
                ),
                const SizedBox(width: Dimensions.spacingMd),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _astrologer!.isOnline ? () => _startCall() : null,
                    icon: const Icon(Icons.call, size: 20),
                    label: Text('CALL ₹${_astrologer!.callRate.toInt()}/min', style: AppTextStyles.buttonMedium),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _astrologer!.isOnline ? AppColors.primary : AppColors.grey400,
                      foregroundColor: AppColors.white,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
                      elevation: _astrologer!.isOnline ? 2 : 0,
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

  void _toggleFavorite() async {
    setState(() {
      _isFavorite = !_isFavorite;
    });
    
    try {
      // TODO: Save to local storage or call API to update favorite status
      // final localStorage = getIt<LocalStorageService>();
      // await localStorage.saveFavoriteAstrologer(_astrologer!.id, _isFavorite);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isFavorite 
                ? '${_astrologer!.fullName} added to favorites' 
                : '${_astrologer!.fullName} removed from favorites',
            ),
            backgroundColor: _isFavorite ? AppColors.success : AppColors.info,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      // Revert state on error
      setState(() {
        _isFavorite = !_isFavorite;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update favorites: $e'),
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

    try {
      // Show loading indicator
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Starting ${callType.displayName.toLowerCase()} call with ${_astrologer!.fullName}...'),
            backgroundColor: AppColors.info,
          ),
        );
      }

      // Start call session
      final callService = getIt<CallService>();
      await callService.initialize(); // Ensure call service is initialized
      await callService.startCallSession(_astrologer!.id, callType);

      // TODO: Navigate to call screen when implemented
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${callType.displayName} call initiated! Call screen coming soon.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start call: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<CallType?> _showCallTypeDialog() async {
    return showDialog<CallType>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Choose Call Type'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.call, color: AppColors.primary),
              title: Text('Voice Call'),
              subtitle: Text('₹${_astrologer!.callRate.toInt()}/min'),
              onTap: () => Navigator.pop(context, CallType.voice),
            ),
            ListTile(
              leading: const Icon(Icons.videocam, color: AppColors.primary),
              title: Text('Video Call'),
              subtitle: Text('₹${_astrologer!.videoRate.toInt()}/min'),
              onTap: () => Navigator.pop(context, CallType.video),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _loadFavoriteStatus() async {
    try {
      // TODO: Load favorite status from local storage or API
      // final localStorage = getIt<LocalStorageService>();
      // final isFavorite = await localStorage.isAstrologerFavorite(_astrologer!.id);
      // setState(() {
      //   _isFavorite = isFavorite;
      // });
    } catch (e) {
      debugPrint('Failed to load favorite status: $e');
    }
  }
}
