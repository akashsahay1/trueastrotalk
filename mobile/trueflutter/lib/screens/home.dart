import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../services/auth/auth_service.dart';
import '../services/api/user_api_service.dart';
import '../services/service_locator.dart';
import '../models/user.dart' as app_user;
import '../models/enums.dart';
import '../models/astrologer.dart';
import '../models/product.dart';
import '../config/config.dart';
import '../common/widgets/astrologer_call_card.dart';
import '../common/widgets/product_card.dart';
import 'profile.dart';
import 'astrologer_details.dart';
import 'astrologers_call.dart';
import 'astrologers_chat.dart';
import 'astrologer_consultations_screen.dart';
import 'astrologer_earnings_screen.dart';
import 'wallet.dart';
import 'history.dart';
import 'help.dart';
import 'products_list.dart';
import 'product_details.dart';
import 'cart.dart';
import 'chat_list.dart';
import 'chat_screen.dart';
import 'call_list.dart';
import '../services/cart_service.dart';
import '../services/chat/chat_service.dart';
import '../services/socket/socket_service.dart';
import '../services/wallet/wallet_service.dart';
import '../services/notifications/notification_service.dart';
import '../services/call/call_service.dart';
import '../models/call.dart';
import 'incoming_call_screen.dart';
import 'active_call_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<HomeScreen> {
  late final AuthService _authService;
  late final UserApiService _userApiService;
  late final CartService _cartService;
  late final SocketService _socketService;
  late final WalletService _walletService;
  late final NotificationService _notificationService;
  late final CallService _callService;

  app_user.User? _currentUser;
  double _walletBalance = 0.0;
  List<Astrologer> _featuredAstrologers = [];
  List<Product> _featuredProducts = [];

  bool _isLoading = true;
  bool _isLoadingWallet = true;
  bool _isLoadingAstrologers = true;
  bool _isLoadingProducts = true;
  int _selectedBottomNavIndex = 0;

  // Astrologer-specific data
  bool _isLoadingDashboard = true;
  bool _isOnlineToggleLoading = false;
  int _todaysConsultations = 0;
  int _totalConsultations = 0;
  double _todaysEarnings = 0.0;
  double _totalEarnings = 0.0;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _cartService = getIt<CartService>();
    _socketService = getIt<SocketService>();
    _walletService = getIt<WalletService>();
    _notificationService = getIt<NotificationService>();
    _callService = getIt<CallService>();

    // Listen to cart changes to update cart icon badge
    _cartService.addListener(_onCartChanged);

    // Initialize notifications
    _initializeNotifications();

    _loadData();
  }

  @override
  void dispose() {
    _cartService.removeListener(_onCartChanged);
    _socketService.disconnect();
    super.dispose();
  }

  void _onCartChanged() {
    if (mounted) {
      setState(() {}); // Rebuild to update cart icon badge
    }
  }

  /// Initialize notification service with handlers
  Future<void> _initializeNotifications() async {
    try {
      await _notificationService.initialize(
        onCallNotification: (data) {
          debugPrint('📞 Call notification received: $data');
          _handleIncomingCallNotification(data);
        },
        onMessageNotification: (data) {
          debugPrint('💬 Message notification received: $data');
          _handleIncomingMessageNotification(data);
        },
        onNotificationTapped: (data) {
          debugPrint('👆 Notification tapped: $data');
          _handleNotificationTapped(data);
        },
      );

      debugPrint('✅ Notification service initialized successfully');
    } catch (e) {
      debugPrint('❌ Failed to initialize notifications: $e');
    }
  }

  Future<void> _loadData() async {
    try {
      // First load user data to determine user type
      await _loadUserData();

      debugPrint('📱 User loaded: ${_currentUser?.name}, isAstrologer: ${_currentUser?.isAstrologer}');

      // Initialize Socket.IO connection after user is loaded
      _initializeSocketConnection();

      // Initialize wallet service for all users
      await _walletService.initialize();

      // Then load type-specific data
      if (_currentUser?.isAstrologer == true) {
        await _loadAstrologerDashboard();
      } else {
        await Future.wait([_loadWalletBalance(), _loadFeaturedAstrologers(), _loadFeaturedProducts()]);
      }
    } catch (e) {
      debugPrint('❌ Error in _loadData: $e');
      // Ensure loading states are turned off even if there's an error
      setState(() {
        _isLoading = false;
        _isLoadingDashboard = false;
        _isLoadingWallet = false;
        _isLoadingAstrologers = false;
        _isLoadingProducts = false;
      });
    }
  }

  Future<void> _onRefresh() async {
    try {
      // Reload user-specific data based on user type
      if (_currentUser?.isAstrologer == true) {
        await _loadAstrologerDashboard();
      } else {
        // Reload all customer data in parallel
        await Future.wait([
          _loadWalletBalance(),
          _loadFeaturedAstrologers(),
          _loadFeaturedProducts(),
        ]);
      }
    } catch (e) {
      debugPrint('❌ Error refreshing data: $e');
    }
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

  // Initialize Socket.IO connection for real-time features
  Future<void> _initializeSocketConnection() async {
    try {
      if (_currentUser != null) {
        debugPrint('🔌 Initializing Socket.IO connection...');
        await _socketService.connect();

        // Setup incoming call listeners
        _setupCallListeners();

        debugPrint('✅ Socket.IO connection initialized');
      }
    } catch (e) {
      debugPrint('❌ Failed to initialize Socket.IO: $e');
    }
  }

  // Setup listeners for incoming calls and messages
  void _setupCallListeners() {
    // Listen for incoming calls
    _socketService.on('incoming_call', (data) {
      debugPrint('📞 RAW Incoming call data received: $data');
      debugPrint('📞 Incoming call data type: ${data.runtimeType}');
      
      // Debug each field specifically
      if (data is Map) {
        debugPrint('📞 Incoming call fields:');
        data.forEach((key, value) {
          debugPrint('   - $key: "$value" (${value.runtimeType})');
        });
        
        final callerName = data['callerName'];
        final callerId = data['callerId'];
        final sessionId = data['sessionId'];
        final callType = data['callType'];
        
        debugPrint('📞 Key fields extracted:');
        debugPrint('   - callerName: "$callerName"');
        debugPrint('   - callerId: "$callerId"');
        debugPrint('   - sessionId: "$sessionId"');
        debugPrint('   - callType: "$callType"');
      }
      
      _showIncomingCallDialog(data);
    });

    // Listen for call status changes
    _socketService.on('call_answered', (data) {
      debugPrint('✅ Call answered: $data');
      // Notify any active call screen to start timer
      if (_callService.isCallScreenActive) {
        debugPrint('🕒 Notifying call screen about answered call');
      }
    });

    _socketService.on('call_rejected', (data) {
      debugPrint('❌ Call rejected: $data');
    });

    _socketService.on('call_ended', (data) {
      debugPrint('📴 Call ended: $data');
    });
  }

  // Show incoming call screen
  void _showIncomingCallDialog(Map<String, dynamic> callData) {
    if (!mounted) return;

    Navigator.of(context).push(MaterialPageRoute(builder: (context) => IncomingCallScreen(callData: callData), fullscreenDialog: true));
  }

  // Method to refresh astrologer dashboard data
  Future<void> _loadAstrologerDashboard() async {
    debugPrint('📱 Loading astrologer dashboard...');

    // Set data from current user (no API call needed since /astrologers/profile doesn't exist yet)
    setState(() {
      _totalConsultations = _currentUser?.totalConsultations ?? 0;
      _totalEarnings = _currentUser?.totalEarnings ?? 0.0;
      _todaysConsultations = 0;
      _todaysEarnings = 0.0;
      _isLoadingDashboard = false;
    });

    debugPrint('📱 Dashboard loaded with user data (API endpoint not yet implemented)');
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
      backgroundColor: const Color.fromARGB(255, 206, 206, 206),
      body: _buildSelectedScreen(),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildSelectedScreen() {
    switch (_selectedBottomNavIndex) {
      case 0:
        return _currentUser?.isAstrologer == true ? _buildAstrologerHomeContent() : _buildHomeContent();
      case 1:
        return _currentUser?.isAstrologer == true ? _buildConsultationsScreen() : _buildCallScreen();
      case 2:
        return _currentUser?.isAstrologer == true ? _buildEarningsScreen() : _buildChatScreen();
      case 3:
        return _currentUser?.isAstrologer == true ? _buildProfileScreen() : const WalletScreen();
      case 4:
        return _buildProfileScreen(); // Profile for customers (5th tab)
      default:
        return _currentUser?.isAstrologer == true ? _buildAstrologerHomeContent() : _buildHomeContent();
    }
  }

  Widget _buildHomeContent() {
    return Container(
      color: AppColors.primary,
      child: SafeArea(
        top: false,
        child: Scaffold(
          backgroundColor: const Color.fromARGB(255, 243, 245, 249),
          appBar: _buildNewAppBar(),
          drawer: _buildDrawer(),
          body: RefreshIndicator(
            onRefresh: _onRefresh,
            color: AppColors.primary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  _buildWelcomeCard(),
                  _buildWalletBalanceCard(),
                  _buildFeaturedAstrologers(),
                  const SizedBox(height: Dimensions.spacingMd),
                  _buildFeaturedProducts(),
                  const SizedBox(height: Dimensions.spacingLg),
                  _buildHoroscopeSection(),
                  const SizedBox(height: Dimensions.spacingXl),
                ],
              ),
            ),
          ),
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
      centerTitle: false,
      actions: [
        // Cart icon with badge
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.shopping_cart_outlined, color: AppColors.white),
              onPressed: _openCart,
            ),
            if (_cartService.totalItems > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '${_cartService.totalItems}',
                      style: const TextStyle(
                        color: AppColors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
          ],
        ),
        IconButton(
          icon: const Icon(Icons.account_balance_wallet, color: AppColors.white),
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const WalletScreen()));
          },
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
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Home', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedBottomNavIndex = 0;
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedBottomNavIndex = 4; // Profile is index 4 for customers
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet),
            title: const Text('Wallet', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedBottomNavIndex = 3; // Wallet is index 3 for customers
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('History', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (context) => const HistoryScreen()));
            },
          ),
          ListTile(
            leading: const Icon(Icons.help),
            title: const Text('Help', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (context) => const HelpScreen()));
            },
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard() {
    final greeting = _getGreeting();
    final firstName = _currentUser?.name.split(' ').first ?? 'User';
    
    return Container(
      margin: const EdgeInsets.fromLTRB(Dimensions.paddingLg, Dimensions.paddingLg, Dimensions.paddingLg, 0),
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary,
            AppColors.primary.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(Dimensions.radiusLg),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  greeting,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.white.withValues(alpha: 0.9),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Welcome back, $firstName!',
                  style: AppTextStyles.heading5.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Discover your destiny with expert astrologers',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.white.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.star,
              color: AppColors.white,
              size: 32,
            ),
          ),
        ],
      ),
    );
  }
  
  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  Widget _buildWalletBalanceCard() {
    return Container(
      margin: const EdgeInsets.all(Dimensions.paddingLg),
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200, width: 1),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
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
                  Text('Wallet Balance', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight)),
                  const SizedBox(height: Dimensions.spacingSm),
                  Text(
                    _isLoadingWallet ? 'Loading...' : '₹${_walletBalance.toStringAsFixed(2)}',
                    style: AppTextStyles.heading3.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingMd),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Icon(Icons.account_balance_wallet, color: AppColors.primary, size: 28),
              ),
            ],
          ),
          const SizedBox(height: Dimensions.spacingMd),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openWalletRecharge,
              icon: const Icon(Icons.account_balance_wallet, size: 18),
              label: const Text('View Wallet'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
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
                itemBuilder: (context, index) => AstrologerCallCard(astrologer: _featuredAstrologers[index], onTap: () => _navigateToAstrologerDetails(_featuredAstrologers[index]), onStartCall: () => _startCallWithAstrologer(_featuredAstrologers[index])),
              ),
      ],
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
                  itemBuilder: (context, index) => SizedBox(
                    width: 200,
                    child: ProductCard(product: _featuredProducts[index], onTap: () => _viewProduct(_featuredProducts[index]), isGridView: true, isHorizontalScroll: true),
                  ),
                ),
              ),
      ],
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

  Widget _buildCallScreen() {
    return Scaffold(
      body: AstrologersCallScreen(userApiService: _userApiService, onAstrologerTap: _navigateToAstrologerDetails, onStartCall: _startCallWithAstrologer),
      floatingActionButton: ListenableBuilder(
        listenable: _callService,
        builder: (context, _) {
          if (_callService.hasActiveCallToReturn) {
            // Show "Return to Call" button when there's an active call
            return FloatingActionButton.extended(
              onPressed: _returnToActiveCall,
              icon: const Icon(Icons.phone, color: AppColors.white),
              label: Text('Return to Call', style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white)),
              backgroundColor: AppColors.success,
            );
          } else {
            // Show "Call History" button when no active call
            return FloatingActionButton.extended(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CallListScreen()));
              },
              icon: const Icon(Icons.history, color: AppColors.white),
              label: Text('Call History', style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white)),
              backgroundColor: AppColors.primary,
            );
          }
        },
      ),
    );
  }

  Widget _buildChatScreen() {
    return Scaffold(
      body: AstrologersChatScreen(userApiService: _userApiService, onAstrologerTap: _navigateToAstrologerDetails, onStartChat: _startChatWithAstrologer),
      floatingActionButton: ListenableBuilder(
        listenable: _callService,
        builder: (context, _) {
          if (_callService.hasActiveCallToReturn) {
            // Show "Return to Call" button when there's an active call
            return FloatingActionButton.extended(
              onPressed: _returnToActiveCall,
              icon: const Icon(Icons.phone, color: AppColors.white),
              label: Text('Return to Call', style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white)),
              backgroundColor: AppColors.success,
            );
          } else {
            // Show "My Chats" button when no active call
            return FloatingActionButton.extended(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (context) => const ChatListScreen()));
              },
              icon: const Icon(Icons.chat_bubble_outline, color: AppColors.white),
              label: Text('My Chats', style: AppTextStyles.buttonMedium.copyWith(color: AppColors.white)),
              backgroundColor: AppColors.primary,
            );
          }
        },
      ),
    );
  }

  Widget _buildProfileScreen() {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: AppColors.white),
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
              // Always refresh user data when returning from profile screen
              if (mounted) {
                await refreshUserData();
              }
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
                  boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
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
                      child: ClipOval(child: _buildProfileImage()),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _currentUser?.name ?? 'User',
                      style: AppTextStyles.heading5.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimaryLight),
                    ),
                    const SizedBox(height: 4),
                    Text(_currentUser?.email ?? '', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight)),
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
          style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        const SizedBox(height: 4),
        Text(label, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
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
          await Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
          // Always refresh user data when returning from profile screen
          if (mounted) {
            await refreshUserData();
          }
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
      {'icon': Icons.history, 'title': 'History', 'subtitle': 'View your past consultations', 'onTap': _viewConsultationHistory},
      {'icon': Icons.logout, 'title': 'Logout', 'subtitle': 'Sign out of your account', 'onTap': _handleLogout, 'isDestructive': true},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
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
                  decoration: BoxDecoration(color: isDestructive ? AppColors.error.withValues(alpha: 0.1) : AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Icon(action['icon'], color: isDestructive ? AppColors.error : AppColors.primary, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        action['title'],
                        style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: isDestructive ? AppColors.error : AppColors.textPrimaryLight),
                      ),
                      const SizedBox(height: 2),
                      Text(action['subtitle'], style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textSecondaryLight),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    // Different navigation items for astrologers vs customers
    final List<BottomNavigationBarItem> items = _currentUser?.isAstrologer == true
        ? const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_outlined), activeIcon: Icon(Icons.chat), label: 'Consultations'),
            BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Earnings'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
          ]
        : const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.call_outlined), activeIcon: Icon(Icons.call), label: 'Call'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_outlined), activeIcon: Icon(Icons.chat), label: 'Chat'),
            BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
          ];

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
      items: items,
    );
  }

  // Action handlers
  void _openNotifications() {
    // Navigate to notifications screen
  }

  void _openHelp() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => const HelpScreen()));
  }

  void _openWalletRecharge() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => const WalletScreen()));
  }

  void _openCart() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => const CartScreen()));
  }

  void _viewAllAstrologers() {
    setState(() {
      _selectedBottomNavIndex = 1; // Switch to Call tab
    });
  }

  void _viewFullHoroscope() {
    // Navigate to full horoscope screen
  }

  void _viewConsultationHistory() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => const HistoryScreen()));
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

  void _startChatWithAstrologer(Astrologer astrologer) async {
    // Check if astrologer is online and available for chats
    if (!astrologer.isOnline || !astrologer.isAvailable) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${astrologer.fullName} is currently ${!astrologer.isOnline ? 'offline' : 'unavailable'}. Please try again later.'),
            backgroundColor: AppColors.warning,
            duration: const Duration(seconds: 3),
          ),
        );
      }
      return;
    }

    // Check wallet balance for chat
    final hasSufficientBalance = _walletService.hasSufficientBalanceForChat(astrologer);

    if (!hasSufficientBalance) {
      final message = _walletService.getInsufficientChatBalanceMessage(astrologer);

      // Show insufficient balance dialog with recharge option
      final shouldRecharge = await _showInsufficientBalanceDialog(message);
      if (shouldRecharge == true && mounted) {
        // Navigate to wallet screen for recharge
        Navigator.of(context).push(MaterialPageRoute(builder: (context) => const WalletScreen()));
      }
      return;
    }

    try {
      // Show loading indicator
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Starting chat with ${astrologer.fullName}...'), backgroundColor: AppColors.info));
      }

      // Start chat session
      final chatService = getIt<ChatService>();
      await chatService.initialize(); // Ensure chat service is initialized
      final chatSession = await chatService.startChatSession(astrologer.id);

      // Navigate to chat screen
      if (mounted) {
        Navigator.of(context).push(MaterialPageRoute(builder: (context) => ChatScreen(chatSession: chatSession)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to start chat: $e'), backgroundColor: AppColors.error));
      }
    }
  }

  void _startCallWithAstrologer(Astrologer astrologer) async {
    // Check if astrologer is online and available for calls
    if (!astrologer.isOnline || !astrologer.isAvailable) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${astrologer.fullName} is currently ${!astrologer.isOnline ? 'offline' : 'unavailable'}. Please try again later.'),
            backgroundColor: AppColors.warning,
            duration: const Duration(seconds: 3),
          ),
        );
      }
      return;
    }

    try {
      // Show call type selection dialog
      final callType = await _showCallTypeDialog();
      if (callType == null) return; // User cancelled

      // Check wallet balance for selected call type
      final callTypeStr = callType == CallType.video ? 'video' : 'voice';
      final hasSufficientBalance = _walletService.hasSufficientBalanceForCall(astrologer, callTypeStr);

      if (!hasSufficientBalance) {
        final message = _walletService.getInsufficientCallBalanceMessage(astrologer, callTypeStr);

        // Show insufficient balance dialog with recharge option
        final shouldRecharge = await _showInsufficientBalanceDialog(message);
        if (shouldRecharge == true && mounted) {
          // Navigate to wallet screen for recharge
          Navigator.of(context).push(MaterialPageRoute(builder: (context) => const WalletScreen()));
        }
        return;
      }

      // Show brief loading message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connecting to ${astrologer.fullName}...'),
            backgroundColor: AppColors.info,
            duration: const Duration(seconds: 1),
          ),
        );
      }

      // Basic validation - user should always be available at this point
      if (_currentUser == null) {
        throw Exception('User not authenticated. Please log in again.');
      }

      // Generate session ID for this call
      final sessionId = 'call-${DateTime.now().millisecondsSinceEpoch}';

      // Debug log the caller information
      debugPrint('📞 Initiating call with caller info:');
      debugPrint('   - userId: ${_currentUser!.id}');
      debugPrint('   - callerName: "${_currentUser!.name}"');
      debugPrint('   - astrologerId: ${astrologer.id}');
      
      // Initiate call via Socket.IO only (WebRTC will be handled in ActiveCallScreen)
      _socketService.emit('initiate_call', {
        'callType': callType == CallType.video ? 'video' : 'voice', 
        'sessionId': sessionId, 
        'astrologerId': astrologer.id, 
        'userId': _currentUser!.id,
        'callerName': _currentUser!.name,
        'callerType': 'customer'
      });

      debugPrint('📞 Call initiated with ${astrologer.fullName}, sessionId: $sessionId');

      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ActiveCallScreen(
              callData: {
                'sessionId': sessionId,
                'callId': sessionId,
                'callType': callType == CallType.video ? 'video' : 'voice',
                'receiverId': astrologer.id,
                'receiverName': astrologer.fullName,
                'receiverProfileImage': astrologer.profileImage,
                'callerId': _currentUser?.id,
                'callerName': _currentUser?.name ?? 'You', // Better fallback
                'astrologer': astrologer.toJson(), // Pass full astrologer data
              },
              isIncoming: false,
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('❌ Failed to start call: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start call: ${e.toString().replaceAll('Exception: ', '')}'), 
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  void _returnToActiveCall() {
    final activeCallData = _callService.activeCallData;
    if (activeCallData != null && mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => ActiveCallScreen(
            callData: activeCallData,
            isIncoming: false,
          ),
        ),
      );
    }
  }

  // Show dialog to select call type (voice or video)
  Future<CallType?> _showCallTypeDialog() async {
    return showDialog<CallType>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.white,
        surfaceTintColor: AppColors.white,
        title: Text(
          'Select Call Type',
          style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimaryLight),
        ),
        content: Text(
          'Choose the type of call you want to make:',
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(CallType.voice),
            child: Row(
              mainAxisSize: MainAxisSize.min, 
              children: [
                Icon(Icons.phone, color: AppColors.primary), 
                const SizedBox(width: 8), 
                Text('Voice Call', style: TextStyle(color: AppColors.primary)),
              ],
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(CallType.video),
            child: Row(
              mainAxisSize: MainAxisSize.min, 
              children: [
                Icon(Icons.videocam, color: AppColors.primary), 
                const SizedBox(width: 8), 
                Text('Video Call', style: TextStyle(color: AppColors.primary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Show dialog for insufficient wallet balance
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

  void _viewAllProducts() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => const ProductsListScreen()));
  }

  void _viewProduct(Product product) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => ProductDetailsScreen(product: product)));
  }

  Widget _buildProfileImage() {
    // For Google users, prioritize Google photo URL from local storage
    if (_currentUser?.authType == AuthType.google) {
      return FutureBuilder<String?>(
        future: _authService.getGooglePhotoUrl(),
        builder: (context, snapshot) {
          final googlePhotoUrl = snapshot.data;

          if (googlePhotoUrl?.isNotEmpty == true) {
            debugPrint('🌐 Home: Showing Google profile image: $googlePhotoUrl');
            return Image.network(
              googlePhotoUrl!,
              width: 70,
              height: 70,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                debugPrint('❌ Home: Failed to load Google image: $error');
                return _buildGoogleFallbackAvatar();
              },
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) {
                  return child;
                }
                return _buildLoadingAvatar();
              },
            );
          } else {
            debugPrint('🔍 Home: Google user without photo URL, showing Google fallback');
            return _buildGoogleFallbackAvatar();
          }
        },
      );
    }

    // For non-Google users, show server profile image
    if (_currentUser?.profilePicture?.isNotEmpty == true) {
      debugPrint('🖼️ Home: Loading server profile image: ${_currentUser!.profilePicture}');

      String imageUrl = _currentUser!.profilePicture!;

      // Handle server image URLs - construct full URL if needed
      if (!imageUrl.startsWith('http')) {
        final baseUrl = Config.baseUrlSync.replaceAll('/api', '');
        if (!imageUrl.startsWith('/')) {
          imageUrl = '/$imageUrl';
        }
        imageUrl = baseUrl + imageUrl;
        debugPrint('🔗 Home: Constructed server image URL: $imageUrl');
      }

      return Image.network(
        imageUrl,
        width: 70,
        height: 70,
        fit: BoxFit.cover,
        headers: {'Accept': 'image/*'},
        errorBuilder: (context, error, stackTrace) {
          debugPrint('❌ Home: Failed to load server image: $error');
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

    // Show fallback avatar for non-Google users without images
    debugPrint('👤 Home: No profile image, showing fallback avatar');
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

  // Astrologer-specific screens
  Widget _buildAstrologerHomeContent() {
    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: AppColors.white),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Text('Home', style: TextStyle(color: AppColors.white)),
        centerTitle: false,
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: AppColors.white),
            onPressed: _openNotifications,
            tooltip: 'Notifications',
          ),
          IconButton(
            icon: const Icon(Icons.help_outline, color: AppColors.white),
            onPressed: _openHelp,
            tooltip: 'Help',
          ),
        ],
      ),
      drawer: _buildAstrologerDrawer(),
      body: _isLoadingDashboard
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _loadAstrologerDashboard,
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome Section
                    _buildWelcomeSection(),
                    const SizedBox(height: 20),

                    // Online Status Toggle
                    _buildOnlineStatusSection(),
                    const SizedBox(height: 20),

                    // Stats Cards
                    _buildStatsSection(),
                    const SizedBox(height: 20),

                    // Quick Actions
                    _buildQuickActionsSection(),
                    const SizedBox(height: 20),

                    // Recent Activity
                    _buildRecentActivitySection(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildConsultationsScreen() {
    return const AstrologerConsultationsScreen();
  }

  Widget _buildEarningsScreen() {
    return const AstrologerEarningsScreen();
  }

  Widget _buildAstrologerDrawer() {
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
                      _currentUser?.name ?? 'Astrologer',
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
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Home', style: TextStyle(fontSize: 14.0)),
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.chat),
            title: const Text('Consultations', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedBottomNavIndex = 1;
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet),
            title: const Text('Earnings', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              setState(() {
                _selectedBottomNavIndex = 2;
              });
            },
          ),
          ListTile(
            leading: const Icon(Icons.help),
            title: const Text('Help', style: TextStyle(fontSize: 14.0)),
            onTap: () {
              Navigator.pop(context);
              _openHelp();
            },
          ),
        ],
      ),
    );
  }

  // Astrologer Dashboard Components
  Widget _buildWelcomeSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 25,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Icon(Icons.person, color: Colors.white, size: 30),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Welcome back,', style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 14)),
                    Text(
                      _currentUser?.name ?? 'Astrologer',
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Row(
            children: [
              Icon(Icons.star, color: Colors.amber, size: 16),
              const SizedBox(width: 5),
              Text('${_currentUser?.rating?.toStringAsFixed(1) ?? 'N/A'} Rating', style: const TextStyle(color: Colors.white, fontSize: 14)),
              const SizedBox(width: 20),
              Icon(Icons.chat, color: Colors.white, size: 16),
              const SizedBox(width: 5),
              Text('$_totalConsultations Consultations', style: const TextStyle(color: Colors.white, fontSize: 14)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOnlineStatusSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Icon(_currentUser?.isOnline == true ? Icons.circle : Icons.circle_outlined, color: _currentUser?.isOnline == true ? AppColors.success : AppColors.grey400, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_currentUser?.isOnline == true ? 'You are Online' : 'You are Offline', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                Text(_currentUser?.isOnline == true ? 'Available for consultations' : 'Turn online to receive consultations', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          _isOnlineToggleLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Switch(value: _currentUser?.isOnline ?? false, onChanged: (value) => _toggleOnlineStatus(), activeThumbColor: AppColors.success),
        ],
      ),
    );
  }

  Widget _buildStatsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Today\'s Performance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(icon: Icons.chat_bubble_outline, title: 'Consultations', value: '$_todaysConsultations', subtitle: 'Today', color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(icon: Icons.account_balance_wallet, title: 'Earnings', value: '₹${_todaysEarnings.toStringAsFixed(0)}', subtitle: 'Today', color: AppColors.success),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(icon: Icons.timeline, title: 'Total Earnings', value: '₹${_totalEarnings.toStringAsFixed(0)}', subtitle: 'All time', color: AppColors.info),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(icon: Icons.star_outline, title: 'Rating', value: _currentUser?.rating?.toStringAsFixed(1) ?? 'N/A', subtitle: '${_currentUser?.totalReviews ?? 0} reviews', color: AppColors.warning),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard({required IconData icon, required String title, required String value, required String subtitle, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
          ),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          Text(subtitle, style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection() {
    final actions = [
      {'icon': Icons.chat, 'title': 'View Consultations', 'subtitle': 'Manage your consultations', 'onTap': () => setState(() => _selectedBottomNavIndex = 1), 'color': AppColors.primary},
      {'icon': Icons.account_balance_wallet, 'title': 'View Earnings', 'subtitle': 'Check your earnings', 'onTap': () => setState(() => _selectedBottomNavIndex = 2), 'color': AppColors.success},
      {
        'icon': Icons.person,
        'title': 'Edit Profile',
        'subtitle': 'Update your profile',
        'onTap': () async {
          await Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
          if (mounted) {
            await refreshUserData();
          }
        },
        'color': AppColors.info,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...actions.map(
          (action) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: action['onTap'] as VoidCallback,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.grey200),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(Dimensions.paddingLg),
                        decoration: BoxDecoration(color: (action['color'] as Color).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                        child: Icon(action['icon'] as IconData, color: action['color'] as Color, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(action['title'] as String, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text(action['subtitle'] as String, style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentActivitySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Recent Activity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.grey200),
          ),
          child: Center(
            child: Column(
              children: [
                Icon(Icons.history, size: 48, color: AppColors.textSecondary),
                const SizedBox(height: 12),
                Text(
                  'No Recent Activity',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your recent consultations will appear here',
                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _toggleOnlineStatus() async {
    final token = _authService.authToken;
    if (token == null) return;

    setState(() {
      _isOnlineToggleLoading = true;
    });

    try {
      // API call to toggle online status
      final currentStatus = _currentUser?.isOnline ?? false;
      // await _userApiService.updateOnlineStatus(token, !currentStatus);

      // Update local state
      _currentUser = _currentUser?.copyWith(isOnline: !currentStatus);

      setState(() {
        _isOnlineToggleLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_currentUser?.isOnline == true ? 'You are now online' : 'You are now offline'), backgroundColor: AppColors.success));
      }
    } catch (e) {
      setState(() {
        _isOnlineToggleLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update status: $e')));
      }
    }
  }

  void _navigateToAstrologerDetails(Astrologer astrologer) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => AstrologerDetailsScreen(astrologer: astrologer)));
  }

  /// Handle incoming call notifications
  void _handleIncomingCallNotification(Map<String, dynamic> data) {
    if (!mounted) return;

    // Navigate to incoming call screen
    Navigator.of(context).push(MaterialPageRoute(builder: (context) => IncomingCallScreen(callData: data), fullscreenDialog: true));
  }

  /// Handle incoming message notifications
  void _handleIncomingMessageNotification(Map<String, dynamic> data) {
    if (!mounted) return;

    // Show snackbar for new message when app is in foreground
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('New message from ${data['sender_name'] ?? 'Unknown'}'),
        action: SnackBarAction(
          label: 'View',
          onPressed: () {
            // Navigate to chat screen
            setState(() {
              _selectedBottomNavIndex = 2; // Switch to chat tab
            });
          },
        ),
      ),
    );
  }

  /// Handle notification taps
  void _handleNotificationTapped(Map<String, dynamic> data) {
    if (!mounted) return;

    final type = data['type'] as String?;

    switch (type) {
      case 'incoming_call':
        _handleIncomingCallNotification(data);
        break;
      case 'new_message':
        // Navigate to chat screen
        setState(() {
          _selectedBottomNavIndex = 2; // Switch to chat tab
        });
        break;
      case 'call_ended':
      case 'call_missed':
        // Navigate to call history
        setState(() {
          _selectedBottomNavIndex = 1; // Switch to call tab
        });
        break;
      default:
        debugPrint('Unknown notification type: $type');
    }
  }
}
