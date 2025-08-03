import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/dimensions.dart';
import '../../services/auth/auth_service.dart';
import '../../services/api/user_api_service.dart';
import '../../services/service_locator.dart';
import '../../models/user.dart' as app_user;
import '../../models/enums.dart';
import '../../models/astrologer.dart';
import '../../models/product.dart';
import '../../config/config.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  late final AuthService _authService;
  late final UserApiService _userApiService;

  app_user.User? _currentUser;
  double _walletBalance = 0.0;
  List<Astrologer> _featuredAstrologers = [];
  List<Product> _featuredProducts = [];

  bool _isLoading = true;
  bool _isLoadingWallet = true;
  bool _isLoadingAstrologers = true;
  bool _isLoadingProducts = true;
  int _selectedBottomNavIndex = 0;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _loadData();
  }

  Future<void> _loadData() async {
    await Future.wait([_loadUserData(), _loadWalletBalance(), _loadFeaturedAstrologers(), _loadFeaturedProducts()]);
  }

  Future<void> _loadUserData() async {
    try {
      _currentUser = _authService.currentUser;
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadWalletBalance() async {
    try {
      final token = _authService.authToken;
      if (token != null) {
        final walletData = await _userApiService.getWalletBalance(token);
        setState(() {
          _walletBalance = (walletData['wallet_balance'] as num?)?.toDouble() ?? 0.0;
          _isLoadingWallet = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingWallet = false;
      });
    }
  }

  Future<void> _loadFeaturedAstrologers() async {
    try {
      final astrologersData = await _userApiService.getAvailableAstrologers(limit: 20, onlineOnly: false);
      final astrologersList = astrologersData['astrologers'] as List<dynamic>;
      setState(() {
        _featuredAstrologers = astrologersList.map((json) => Astrologer.fromJson(json)).toList();
        _isLoadingAstrologers = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingAstrologers = false;
      });
    }
  }

  Future<void> _loadFeaturedProducts() async {
    try {
      final products = await _userApiService.getFeaturedProducts(limit: 6);
      setState(() {
        _featuredProducts = products;
        _isLoadingProducts = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingProducts = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(child: _buildSelectedScreen()),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildSelectedScreen() {
    switch (_selectedBottomNavIndex) {
      case 0:
        return _buildHomeContent();
      case 1:
        return _buildAstrologersScreen();
      case 2:
        return _buildKundliScreen();
      case 3:
        return _buildWalletScreen();
      case 4:
        return _buildProfileScreen();
      default:
        return _buildHomeContent();
    }
  }

  Widget _buildHomeContent() {
    return Scaffold(
      appBar: _buildNewAppBar(),
      drawer: _buildDrawer(),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildWalletBalanceCard(),
            const SizedBox(height: Dimensions.spacingLg),
            _buildFeaturedAstrologers(),
            const SizedBox(height: Dimensions.spacingLg),
            _buildFeaturedProducts(),
            const SizedBox(height: Dimensions.spacingLg),
            _buildHoroscopeSection(),
            const SizedBox(height: Dimensions.spacingXl),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildNewAppBar() {
    return AppBar(
      backgroundColor: AppColors.primary,
      elevation: 0,
      leading: Builder(
        builder: (context) => IconButton(
          icon: const Icon(Icons.menu, color: AppColors.white),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      title: Text('True Astrotalk', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
      centerTitle: true,
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: AppColors.white),
          onPressed: _openNotifications,
        ),
        Container(
          margin: const EdgeInsets.only(right: 8),
          child: TextButton.icon(
            onPressed: _openWalletRecharge,
            icon: const Icon(Icons.account_balance_wallet, color: AppColors.white, size: 18),
            label: Text(
              _isLoadingWallet ? '...' : '₹${_walletBalance.toStringAsFixed(0)}',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.white, fontWeight: FontWeight.w600),
            ),
            style: TextButton.styleFrom(
              backgroundColor: AppColors.white.withValues(alpha: 0.2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Column(
        children: [
          Container(
            alignment: Alignment.center,
            width: double.infinity,
            height: 200,
            decoration: const BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.zero),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Profile Picture with Google Image
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.white, width: 2),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 2))],
                      ),
                      child: ClipOval(child: _buildProfileImage()),
                    ),

                    const SizedBox(height: 16),

                    // User Name
                    Text(
                      _currentUser?.name ?? 'User',
                      style: AppTextStyles.heading5.copyWith(color: AppColors.white, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 4),

                    // User Email
                    Text(
                      _currentUser?.email ?? '',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.white.withValues(alpha: 0.9)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
          ListTile(leading: const Icon(Icons.home), title: const Text('Home'), onTap: () => Navigator.pop(context)),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedBottomNavIndex = 4;
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet),
            title: const Text('Wallet'),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedBottomNavIndex = 3;
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('History'),
            onTap: () {
              Navigator.pop(context);
              _viewConsultationHistory();
            },
          ),
          ListTile(
            leading: const Icon(Icons.help),
            title: const Text('Help'),
            onTap: () {
              Navigator.pop(context);
              _openHelp();
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.error),
            title: const Text('Logout', style: TextStyle(color: AppColors.error)),
            onTap: _handleLogout,
          ),
        ],
      ),
    );
  }

  Widget _buildWalletBalanceCard() {
    return Container(
      margin: const EdgeInsets.all(Dimensions.paddingLg),
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(Dimensions.radiusLg),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Wallet Balance', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.white.withValues(alpha: 0.8))),
                  const SizedBox(height: Dimensions.spacingSm),
                  Text(
                    _isLoadingWallet ? 'Loading...' : '₹${_walletBalance.toStringAsFixed(2)}',
                    style: AppTextStyles.heading3.copyWith(color: AppColors.white, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingMd),
                decoration: BoxDecoration(color: AppColors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
                child: const Icon(Icons.account_balance_wallet, color: AppColors.white, size: 28),
              ),
            ],
          ),
          const SizedBox(height: Dimensions.spacingMd),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openWalletRecharge,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Recharge Wallet'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.white,
                foregroundColor: AppColors.primary,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedAstrologers() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Featured Astrologers', style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimaryLight)),
              TextButton(
                onPressed: _viewAllAstrologers,
                child: Text('View All', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary)),
              ),
            ],
          ),
        ),
        const SizedBox(height: Dimensions.spacingMd),
        _isLoadingAstrologers
            ? const Padding(
                padding: EdgeInsets.all(Dimensions.paddingLg),
                child: Center(child: CircularProgressIndicator()),
              )
            : _featuredAstrologers.isEmpty
            ? const Padding(
                padding: EdgeInsets.all(Dimensions.paddingLg),
                child: Center(
                  child: Text('No astrologers available at the moment', style: TextStyle(color: AppColors.textSecondaryLight)),
                ),
              )
            : ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
                itemCount: _featuredAstrologers.length,
                separatorBuilder: (context, index) => const SizedBox(height: Dimensions.spacingMd),
                itemBuilder: (context, index) => _buildNewAstrologerCard(_featuredAstrologers[index]),
              ),
      ],
    );
  }

  Widget _buildNewAstrologerCard(Astrologer astrologer) {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingMd),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusMd),
        boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile Image with status indicator
              Stack(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    backgroundImage: astrologer.profileImage?.isNotEmpty == true ? NetworkImage(astrologer.profileImage!) : null,
                    child: astrologer.profileImage?.isEmpty != false ? const Icon(Icons.person, size: 32, color: AppColors.primary) : null,
                  ),
                  Positioned(
                    top: 2,
                    right: 2,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: astrologer.isOnline ? AppColors.success : AppColors.error,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: Dimensions.spacingMd),
              // Astrologer Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      astrologer.displayName,
                      style: AppTextStyles.heading5.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, color: AppColors.warning, size: 16),
                        const SizedBox(width: 4),
                        Text(astrologer.ratingText, style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w600)),
                        const SizedBox(width: 8),
                        Text('• ${astrologer.totalConsultations} sessions', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.auto_awesome, size: 14, color: AppColors.textSecondaryLight),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            astrologer.specializationsText,
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.schedule, size: 14, color: AppColors.textSecondaryLight),
                        const SizedBox(width: 4),
                        Text('${astrologer.experienceYears} yrs', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
                        const SizedBox(width: 8),
                        Text(
                          '• ${astrologer.languagesText}',
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          '₹${astrologer.chatRate.toInt()}/min',
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight, decoration: astrologer.isOnline ? TextDecoration.lineThrough : null),
                        ),
                        const SizedBox(width: 8),
                        if (astrologer.isOnline)
                          Text(
                            'FREE',
                            style: AppTextStyles.bodyLarge.copyWith(color: AppColors.success, fontWeight: FontWeight.bold),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: _getStatusColor(astrologer), borderRadius: BorderRadius.circular(4)),
                            child: Text(_getStatusText(astrologer), style: AppTextStyles.overline.copyWith(color: AppColors.white, fontSize: 10)),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: Dimensions.spacingMd),
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: astrologer.isOnline ? () => _startCallWithAstrologer(astrologer) : null,
                  icon: const Icon(Icons.video_call, size: 18),
                  label: const Text('Video'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: astrologer.isOnline ? AppColors.primary : AppColors.grey300,
                    foregroundColor: astrologer.isOnline ? AppColors.white : AppColors.grey600,
                    padding: const EdgeInsets.symmetric(vertical: 0),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: Dimensions.spacingMd),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: astrologer.isOnline ? () => _startCallWithAstrologer(astrologer) : null,
                  icon: const Icon(Icons.phone, size: 18),
                  label: const Text('Call'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: astrologer.isOnline ? AppColors.primary : AppColors.grey300,
                    foregroundColor: astrologer.isOnline ? AppColors.white : AppColors.grey600,
                    padding: const EdgeInsets.symmetric(vertical: 0),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: Dimensions.spacingMd),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: astrologer.isOnline ? () => _startChatWithAstrologer(astrologer) : null,
                  icon: const Icon(Icons.chat_bubble, size: 18),
                  label: const Text('Chat'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: astrologer.isOnline ? AppColors.primary : AppColors.grey300,
                    foregroundColor: astrologer.isOnline ? AppColors.white : AppColors.grey600,
                    padding: const EdgeInsets.symmetric(vertical: 0),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(Astrologer astrologer) {
    if (astrologer.isOnline) {
      return AppColors.success; // Green for online
    } else {
      return AppColors.grey500; // Grey for offline
    }
  }

  String _getStatusText(Astrologer astrologer) {
    if (astrologer.isOnline) {
      return 'Online';
    } else {
      return 'Offline';
    }
  }

  Widget _buildFeaturedProducts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Featured Products', style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimaryLight)),
              TextButton(
                onPressed: _viewAllProducts,
                child: Text('View All', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary)),
              ),
            ],
          ),
        ),
        const SizedBox(height: Dimensions.spacingMd),
        _isLoadingProducts
            ? const Padding(
                padding: EdgeInsets.all(Dimensions.paddingLg),
                child: Center(child: CircularProgressIndicator()),
              )
            : _featuredProducts.isEmpty
            ? const Padding(
                padding: EdgeInsets.all(Dimensions.paddingLg),
                child: Center(
                  child: Text('No products available at the moment', style: TextStyle(color: AppColors.textSecondaryLight)),
                ),
              )
            : SizedBox(
                height: 310,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
                  itemCount: _featuredProducts.length,
                  separatorBuilder: (context, index) => const SizedBox(width: Dimensions.spacingMd),
                  itemBuilder: (context, index) => _buildProductCard(_featuredProducts[index]),
                ),
              ),
      ],
    );
  }

  Widget _buildProductCard(Product product) {
    return Container(
      width: 200,
      height: 310, // Reduced from 320 to prevent overflow
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusMd),
        boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Image
          ClipRRect(
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(Dimensions.radiusMd), topRight: Radius.circular(Dimensions.radiusMd)),
            child: Container(
              height: 140,
              width: double.infinity,
              color: AppColors.grey100,
              child: product.imageUrl?.isNotEmpty == true ? Image.network(_getFullImageUrl(product.imageUrl!), fit: BoxFit.cover, errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage()) : _buildPlaceholderImage(),
            ),
          ),
          // Product Details - Fixed height to prevent overflow
          SizedBox(
            height: 170, // Fixed height for content area
            child: Padding(
              padding: const EdgeInsets.all(10), // Reduced from 12
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Name - Fixed height
                  SizedBox(
                    height: 40, // Fixed height for name
                    child: Text(
                      product.name,
                      style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(product.category, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          product.formattedPrice,
                          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold, color: AppColors.primary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(color: product.isInStock ? AppColors.success : AppColors.error, borderRadius: BorderRadius.circular(3)),
                        child: Text(
                          product.stockText,
                          style: AppTextStyles.overline.copyWith(color: AppColors.white, fontSize: 8),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Button - Fixed at bottom
                  Expanded(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: SizedBox(
                        width: double.infinity,
                        height: 30, // Fixed button height
                        child: ElevatedButton(
                          onPressed: product.isInStock ? () => _viewProduct(product) : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: product.isInStock ? AppColors.primary : AppColors.grey300,
                            foregroundColor: product.isInStock ? AppColors.white : AppColors.grey600,
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                          ),
                          child: Text(
                            product.isInStock ? 'View Details' : 'Out of Stock',
                            style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w600, fontSize: 11),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      height: 140,
      width: double.infinity,
      color: AppColors.grey100,
      child: const Icon(Icons.image, size: 40, color: AppColors.grey400),
    );
  }

  Widget _buildHoroscopeSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Daily Horoscope', style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimaryLight)),
              TextButton(
                onPressed: _viewFullHoroscope,
                child: Text('View All', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: Dimensions.spacingMd),
          Container(
            padding: const EdgeInsets.all(Dimensions.paddingLg),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.warning.withValues(alpha: 0.1), AppColors.primary.withValues(alpha: 0.1)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(Dimensions.radiusMd),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(Dimensions.paddingSm),
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.2), shape: BoxShape.circle),
                      child: const Icon(Icons.star_outline, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: Dimensions.spacingMd),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Today\'s Fortune',
                          style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
                        ),
                        Text('Aries - ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: Dimensions.spacingMd),
                Text('Today brings opportunities for growth and positive changes. Trust your intuition and take calculated risks.', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAstrologersScreen() {
    return const Center(child: Text('Astrologers Screen - Coming Soon'));
  }

  Widget _buildKundliScreen() {
    return const Center(child: Text('Kundli Screen - Coming Soon'));
  }

  Widget _buildWalletScreen() {
    return const Center(child: Text('Wallet Screen - Coming Soon'));
  }

  Widget _buildProfileScreen() {
    return const Center(child: Text('Profile Screen - Coming Soon'));
  }

  Widget _buildBottomNavigationBar() {
    return BottomNavigationBar(
      currentIndex: _selectedBottomNavIndex,
      onTap: (index) {
        setState(() {
          _selectedBottomNavIndex = index;
        });
      },
      type: BottomNavigationBarType.fixed,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textSecondaryLight,
      backgroundColor: AppColors.white,
      elevation: 10,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'Astrologers'),
        BottomNavigationBarItem(icon: Icon(Icons.auto_awesome_outlined), activeIcon: Icon(Icons.auto_awesome), label: 'Kundli'),
        BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
        BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
      ],
    );
  }

  // Action handlers
  void _openNotifications() {
    // Navigate to notifications screen
  }

  void _openHelp() {
    // Navigate to help screen
  }

  void _openWalletRecharge() {
    // Navigate to wallet recharge screen
  }

  void _viewAllAstrologers() {
    setState(() {
      _selectedBottomNavIndex = 1; // Switch to Astrologers tab
    });
  }

  void _viewFullHoroscope() {
    // Navigate to full horoscope screen
  }

  void _viewConsultationHistory() {
    // Navigate to consultation history screen
  }

  Future<void> _handleLogout() async {
    try {
      await _authService.signOut();
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil('/onboarding', (route) => false);
      }
    } catch (e) {
      // Handle logout error silently
    }
  }

  void _startChatWithAstrologer(Astrologer astrologer) {
    // Navigate to chat consultation with specific astrologer
    debugPrint('Starting chat with ${astrologer.displayName}');
  }

  void _startCallWithAstrologer(Astrologer astrologer) {
    // Navigate to call consultation with specific astrologer
    debugPrint('Starting call with ${astrologer.displayName}');
  }

  void _viewAllProducts() {
    // Navigate to products listing screen
    debugPrint('Viewing all products');
  }

  void _viewProduct(Product product) {
    // Navigate to product detail screen
    debugPrint('Viewing product: ${product.name}');
  }

  Widget _buildProfileImage() {
    // Check if user has profile picture in database (works for Google and other users)
    if (_currentUser?.profilePicture != null && _currentUser!.profilePicture!.isNotEmpty) {
      return Image.network(
        _currentUser!.profilePicture!,
        width: 70,
        height: 70,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          // If image fails to load, use appropriate fallback
          if (_currentUser?.authType == AuthType.google) {
            return _buildGoogleFallbackAvatar();
          }
          return _buildFallbackAvatar();
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return _buildLoadingAvatar();
        },
      );
    }

    // For Google users without stored image, use Google-themed fallback
    if (_currentUser?.authType == AuthType.google) {
      return _buildGoogleFallbackAvatar();
    }

    // For other users, use standard fallback
    return _buildFallbackAvatar();
  }

  Widget _buildFallbackAvatar() {
    return Container(
      width: 70,
      height: 70,
      color: AppColors.white.withValues(alpha: 0.2),
      child: Center(
        child: Text(_currentUser?.name != null && _currentUser!.name.isNotEmpty ? _currentUser!.name.substring(0, 1).toUpperCase() : 'U', style: AppTextStyles.heading3.copyWith(color: AppColors.white)),
      ),
    );
  }

  Widget _buildLoadingAvatar() {
    return Container(
      width: 70,
      height: 70,
      color: AppColors.white.withValues(alpha: 0.2),
      child: const Center(child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(AppColors.white))),
    );
  }

  Widget _buildGoogleFallbackAvatar() {
    // Create a nice gradient avatar for Google users
    final name = _currentUser?.name ?? '';
    final initials = name.isNotEmpty ? name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase() : 'G';

    return Container(
      width: 70,
      height: 70,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4285F4), Color(0xFF34A853)], // Google blue to green
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.heading4.copyWith(color: AppColors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  String _getFullImageUrl(String imageUrl) {
    // If the URL is already a full URL (starts with http), return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // If it's a relative path, prepend the server base URL
    // Remove leading slash if present to avoid double slashes
    final cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;

    // Use the current config mode to determine base URL
    final baseUrl = Config.mode == 'local' ? 'http://localhost:3000' : 'https://www.trueastrotalk.com';
    return '$baseUrl/$cleanPath';
  }
}
