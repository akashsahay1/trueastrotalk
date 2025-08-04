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
import 'profile.dart';

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

  // Method to refresh user data - can be called when returning from profile screen
  Future<void> refreshUserData() async {
    await _loadUserData();
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

    String truncateTextWithComma(String text) {
      // Split the string by comma and trim whitespace from each part.
      List<String> parts = text.split(',').map((e) => e.trim()).toList();

      // If there are at least two parts, return the first two joined by a comma.
      if (parts.length >= 2) {
        return '${parts[0]}, ${parts[1]}';
      } 
      // If there's only one part, return that part.
      else if (parts.length == 1) {
        return parts[0];
      } 
      // If the string is empty or contains no valid parts after splitting, return an empty string.
      else {
        return '';
      }
    }

    return Card(
          margin: EdgeInsets.only(bottom: 16),
          elevation: 2,          
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: EdgeInsets.all(12),
            child: Row(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                    // Astrologer image with online indicator
                    Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                            Stack(
                              children: [
                                CircleAvatar(
                                  radius: 30,
                                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                  backgroundImage: astrologer.profileImage?.isNotEmpty == true ? NetworkImage(_getFullImageUrl(astrologer.profileImage!)) : null,
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
                            SizedBox(height: 10,),
                            Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                    Text(
                                        astrologer.ratingText,
                                        style: TextStyle(
                                            fontWeight: FontWeight.w500,
                                            fontSize: 18,
                                        ),
                                    ),
                                    SizedBox(width: 2),
                                    Icon(
                                        Icons.star,
                                        color: Colors.amber,
                                        size: 22,
                                    ),
                                ],
                            ),
                        ],
                    ),
                    SizedBox(width: 20.0,),
                    // Astrologer details
                    Expanded(
                        flex: 1,
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                                Row(
                                    children: [
                                        Text(
                                            astrologer.fullName,
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16,
                                            ),
                                        ),
                                    ],
                                ),
                                SizedBox(height: 4),                                
                                Row(
                                    children: [
                                        Icon(
                                            Icons.auto_graph,
                                            size: 18,
                                            color: Colors.grey[700],
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                            truncateTextWithComma(astrologer.specializationsText),
                                            style: TextStyle(
                                                color: Colors.grey.shade600,
                                                fontSize: 13,
                                            ),
                                        ),
                                    ],
                                ),                                
                                SizedBox(height: 4),                                
                                Row(
                                    children: [
                                        Icon(
                                            Icons.language,
                                            size: 18,
                                            color: Colors.grey[700],
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                            truncateTextWithComma(astrologer.languagesText),
                                            style: TextStyle(
                                                color: Colors.grey.shade600,
                                                fontSize: 13,
                                            ),
                                        ),
                                    ],
                                ),
                                SizedBox(height: 4),
                                Row(
                                    children: [
                                        Icon(
                                            Icons.work_outline,
                                            size: 18,
                                            color: Colors.grey[700],
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                            'Experience ${astrologer.experienceYears} years',
                                            style: TextStyle(
                                                color: Colors.grey.shade600,
                                                fontSize: 13,
                                            ),
                                        )
                                    ],
                                )                                
                            ],
                        ),
                    ),                    
                    Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [                                
                            ElevatedButton(
                                onPressed: (){
                                  _startChatWithAstrologer(astrologer);
                                },
                                style: ButtonStyle(
                                    backgroundColor: WidgetStatePropertyAll(Color(0xFF00C16e)),
                                    padding: WidgetStatePropertyAll(EdgeInsets.only(left: 10, right: 10, top: 2, bottom: 2)),
                                    minimumSize: WidgetStatePropertyAll(Size(90, 30)),
                                    shape: WidgetStatePropertyAll(
                                        RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(5),
                                        ),
                                    ),
                                ),
                                child: Text(
                                    astrologer.chatRate.toInt() == 0 ? "FREE" : "₹${astrologer.chatRate.toInt()}/min",
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,                                            
                                    ),
                                ),
                            ),                                
                            ElevatedButton(
                                onPressed: (){
                                  _startCallWithAstrologer(astrologer);
                                },
                                style: ButtonStyle(                                        
                                    padding: WidgetStatePropertyAll(EdgeInsets.only(left: 10, right: 10, top: 2, bottom: 2)),
                                    minimumSize: WidgetStatePropertyAll(Size(90, 30)),
                                    shape: WidgetStatePropertyAll(
                                        RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(5),
                                            side: BorderSide(color: Color(0xFF1877F2), width: 1),
                                        ),
                                    ),
                                ),
                                child: Text("Chat", style: TextStyle(color: Color(0xFFFFFFFF)),),
                            ),                                
                        ],
                    ),
                ]
            ),
          ),
        );    
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
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Profile',
          style: AppTextStyles.heading4.copyWith(color: AppColors.white),
        ),
        backgroundColor: AppColors.primary,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: AppColors.white),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ProfileScreen(),
                ),
              );
              // Always refresh user data when returning from profile screen
              await refreshUserData();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Profile Summary Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.black.withValues(alpha: 0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Profile Image
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary, width: 3),
                      ),
                      child: ClipOval(
                        child: _buildProfileImage(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _currentUser?.name ?? 'User',
                      style: AppTextStyles.heading5.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _currentUser?.email ?? '',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildProfileStat('Wallet Balance', '₹${_walletBalance.toStringAsFixed(0)}'),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Quick Actions
              _buildQuickActionsList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondaryLight,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionsList() {
    final actions = [
      {
        'icon': Icons.edit,
        'title': 'Edit Profile',
        'subtitle': 'Update your personal information',
        'onTap': () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const ProfileScreen(),
            ),
          );
          // Always refresh user data when returning from profile screen
          await refreshUserData();
        },
      },
      {
        'icon': Icons.account_balance_wallet,
        'title': 'Wallet',
        'subtitle': 'Manage your wallet and transactions',
        'onTap': () {
          setState(() {
            _selectedBottomNavIndex = 3;
          });
        },
      },
      {
        'icon': Icons.history,
        'title': 'History',
        'subtitle': 'View your past consultations',
        'onTap': _viewConsultationHistory,
      },
      {
        'icon': Icons.help,
        'title': 'Help',
        'subtitle': 'Get help and contact support',
        'onTap': _openHelp,
      },
      {
        'icon': Icons.logout,
        'title': 'Logout',
        'subtitle': 'Sign out of your account',
        'onTap': _handleLogout,
        'isDestructive': true,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: AppTextStyles.heading6.copyWith(
            color: AppColors.textPrimaryLight,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...actions.map((action) => _buildQuickActionItem(action)),
      ],
    );
  }

  Widget _buildQuickActionItem(Map<String, dynamic> action) {
    final isDestructive = action['isDestructive'] == true;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        elevation: 2,
        shadowColor: AppColors.black.withValues(alpha: 0.08),
        child: InkWell(
          onTap: action['onTap'],
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: isDestructive 
                        ? AppColors.error.withValues(alpha: 0.1)
                        : AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    action['icon'],
                    color: isDestructive ? AppColors.error : AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        action['title'],
                        style: AppTextStyles.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isDestructive 
                              ? AppColors.error 
                              : AppColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        action['subtitle'],
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: AppColors.textSecondaryLight,
                ),
              ],
            ),
          ),
        ),
      ),
    );
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
      final imageUrl = _getFullImageUrl(_currentUser!.profilePicture!);
      
      return Image.network(
        imageUrl,
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
          if (loadingProgress == null) {
            return child;
          }
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
