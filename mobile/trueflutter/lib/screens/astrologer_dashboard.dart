import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/api/user_api_service.dart';
import '../services/local/local_storage_service.dart';
import '../services/service_locator.dart';
import '../models/user.dart';
import 'astrologer_rate_management_screen.dart';

/// Enhanced Astrologer Dashboard Screen
/// 
/// Features:
/// - Complete earnings tracking
/// - Consultation session management
/// - Online status management
/// - Rate management
/// - Performance analytics
/// - Profile completion tracking
class AstrologerDashboardScreen extends StatefulWidget {
  const AstrologerDashboardScreen({super.key});

  @override
  State<AstrologerDashboardScreen> createState() => _AstrologerDashboardScreenState();
}

class _AstrologerDashboardScreenState extends State<AstrologerDashboardScreen> {
  late final UserApiService _userApiService;
  late final LocalStorageService _localStorage;
  
  User? _currentUser;
  bool _isLoading = true;
  bool _isOnline = false;
  bool _isToggling = false;
  
  // Dashboard metrics
  double _walletBalance = 0.0;
  double _todaysEarnings = 0.0;
  double _totalEarnings = 0.0;
  int _todaysSessions = 0;
  int _totalSessions = 0;
  int _pendingSessions = 0;
  double _averageRating = 0.0;
  int _totalReviews = 0;
  
  // Recent activity
  List<Map<String, dynamic>> _recentSessions = [];
  List<Map<String, dynamic>> _recentTransactions = [];

  @override
  void initState() {
    super.initState();
    _userApiService = getIt<UserApiService>();
    _localStorage = getIt<LocalStorageService>();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    
    try {
      // Load user profile
      final token = await _localStorage.getAuthToken();
      if (token != null) {
        try {
          final dashboardResponse = await _userApiService.getAstrologerDashboard(token);
          if (dashboardResponse['success']) {
            final data = dashboardResponse['data'];
            setState(() {
              _walletBalance = (data['walletBalance'] ?? 0).toDouble();
              _todaysEarnings = (data['todaysEarnings'] ?? 0).toDouble();
              _totalEarnings = (data['totalEarnings'] ?? 0).toDouble();
              _todaysSessions = data['todaysConsultations'] ?? 0;
              _totalSessions = data['totalConsultations'] ?? 0;
              _pendingSessions = data['pendingConsultations'] ?? 0;
              _averageRating = (data['averageRating'] ?? 0).toDouble();
              _totalReviews = data['totalReviews'] ?? 0;
              _isOnline = data['isOnline'] ?? false;
              
              // Parse recent sessions
              if (data['recentSessions'] != null) {
                _recentSessions = List<Map<String, dynamic>>.from(data['recentSessions']);
              }
              
              // Parse recent transactions
              if (data['recentTransactions'] != null) {
                _recentTransactions = List<Map<String, dynamic>>.from(data['recentTransactions']);
              }
            });
          }
        } catch (e) {
          debugPrint('Dashboard data load failed: $e');
        }
      }
      
      // Load dashboard metrics
      await _loadDashboardMetrics();
      
      // Load recent activity
      await _loadRecentActivity();
      
    } catch (e) {
      debugPrint('Error loading dashboard data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadDashboardMetrics() async {
    try {
      // Simulate API calls for dashboard metrics
      // In real implementation, these would be actual API calls
      await Future.delayed(const Duration(seconds: 1));
      
      setState(() {
        _walletBalance = 2450.75;
        _todaysEarnings = 185.50;
        _totalEarnings = 12350.25;
        _todaysSessions = 3;
        _totalSessions = 145;
        _pendingSessions = 2;
        _averageRating = 4.7;
        _totalReviews = 89;
      });
    } catch (e) {
      debugPrint('Error loading dashboard metrics: $e');
    }
  }

  Future<void> _loadRecentActivity() async {
    try {
      // Simulate loading recent sessions and transactions
      await Future.delayed(const Duration(milliseconds: 500));
      
      setState(() {
        _recentSessions = [
          {
            'customer': 'Priya S.',
            'type': 'Chat',
            'duration': '15 min',
            'amount': '₹75',
            'time': '2 hours ago',
            'status': 'Completed'
          },
          {
            'customer': 'Rahul K.',
            'type': 'Voice Call',
            'duration': '22 min',
            'amount': '₹110',
            'time': '4 hours ago',
            'status': 'Completed'
          },
          {
            'customer': 'Anita M.',
            'type': 'Video Call',
            'duration': '30 min',
            'amount': '₹180',
            'time': '1 day ago',
            'status': 'Completed'
          },
        ];
        
        _recentTransactions = [
          {
            'type': 'Earning',
            'amount': '+₹75',
            'description': 'Chat consultation with Priya S.',
            'time': '2 hours ago',
            'status': 'Credited'
          },
          {
            'type': 'Earning',
            'amount': '+₹110',
            'description': 'Voice call with Rahul K.',
            'time': '4 hours ago',
            'status': 'Credited'
          },
          {
            'type': 'Withdrawal',
            'amount': '-₹1000',
            'description': 'Bank transfer',
            'time': '2 days ago',
            'status': 'Processed'
          },
        ];
      });
    } catch (e) {
      debugPrint('Error loading recent activity: $e');
    }
  }

  Future<void> _toggleOnlineStatus() async {
    if (_isToggling) return;
    
    setState(() => _isToggling = true);
    
    try {
      final newStatus = !_isOnline;
      final token = await _localStorage.getAuthToken();
      
      if (token != null) {
        final response = await _userApiService.updateAstrologerOnlineStatus(token, newStatus);
        
        if (response['success']) {
          setState(() {
            _isOnline = response['isOnline'] ?? newStatus;
            _isToggling = false;
          });
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('You are now ${_isOnline ? 'online' : 'offline'}'),
                backgroundColor: _isOnline ? AppColors.success : AppColors.warning,
              ),
            );
          }
        } else {
          setState(() => _isToggling = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(response['message'] ?? 'Failed to update status'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        }
      } else {
        setState(() => _isToggling = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Authentication required. Please login again.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isToggling = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update status. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildWelcomeSection(),
              const SizedBox(height: 20),
              _buildOnlineStatusCard(),
              const SizedBox(height: 20),
              _buildEarningsOverview(),
              const SizedBox(height: 20),
              _buildSessionsOverview(),
              const SizedBox(height: 20),
              _buildPerformanceMetrics(),
              const SizedBox(height: 20),
              _buildRecentSessions(),
              const SizedBox(height: 20),
              _buildRecentTransactions(),
              const SizedBox(height: 20),
              _buildQuickActions(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection() {
    final userName = _currentUser?.name;
    final name = userName != null ? userName.split(' ').first : 'Astrologer';
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back, $name!',
            style: AppTextStyles.heading4.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Ready to guide and inspire your clients today?',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.white.withValues(alpha: 0.9),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildStatChip('Sessions Today', _todaysSessions.toString()),
              const SizedBox(width: 12),
              _buildStatChip('Total Reviews', _totalReviews.toString()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.white.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOnlineStatusCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _isOnline ? AppColors.success : AppColors.warning,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Status: ${_isOnline ? 'Online' : 'Offline'}',
                  style: AppTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  _isOnline 
                    ? 'You\'re available for consultations'
                    : 'Go online to receive consultation requests',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: _isToggling ? null : _toggleOnlineStatus,
            style: ElevatedButton.styleFrom(
              backgroundColor: _isOnline ? AppColors.warning : AppColors.success,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
            child: _isToggling
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                  ),
                )
              : Text(_isOnline ? 'Go Offline' : 'Go Online'),
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsOverview() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Earnings Overview',
            style: AppTextStyles.heading5.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildEarningsItem(
                  'Today\'s Earnings',
                  '₹${_todaysEarnings.toStringAsFixed(2)}',
                  Icons.today,
                  AppColors.success,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildEarningsItem(
                  'Total Earnings',
                  '₹${_totalEarnings.toStringAsFixed(2)}',
                  Icons.account_balance_wallet,
                  AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildEarningsItem(
            'Wallet Balance',
            '₹${_walletBalance.toStringAsFixed(2)}',
            Icons.wallet,
            AppColors.secondary,
            isFullWidth: true,
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsItem(String title, String amount, IconData icon, Color color, {bool isFullWidth = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            amount,
            style: AppTextStyles.heading5.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionsOverview() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Session Statistics',
            style: AppTextStyles.heading5.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildSessionItem('Today', _todaysSessions, AppColors.info),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSessionItem('Total', _totalSessions, AppColors.success),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSessionItem('Pending', _pendingSessions, AppColors.warning),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSessionItem(String label, int count, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Text(
            count.toString(),
            style: AppTextStyles.heading5.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildPerformanceMetrics() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Performance Metrics',
            style: AppTextStyles.heading5.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Average Rating',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.star, color: AppColors.warning, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          _averageRating.toStringAsFixed(1),
                          style: AppTextStyles.heading5.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Reviews',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _totalReviews.toString(),
                      style: AppTextStyles.heading5.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentSessions() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Sessions',
                style: AppTextStyles.heading5.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  // Navigate to full sessions history
                },
                child: const Text('View All'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._recentSessions.map((session) => _buildSessionTile(session)),
        ],
      ),
    );
  }

  Widget _buildSessionTile(Map<String, dynamic> session) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              session['type'] == 'Chat' ? Icons.chat : 
              session['type'] == 'Voice Call' ? Icons.call : Icons.videocam,
              color: AppColors.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${session['type']} with ${session['customer']}',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '${session['duration']} • ${session['time']}',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                session['amount'],
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  session['status'],
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.success,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentTransactions() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Transactions',
                style: AppTextStyles.heading5.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  // Navigate to full transaction history
                },
                child: const Text('View All'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._recentTransactions.map((transaction) => _buildTransactionTile(transaction)),
        ],
      ),
    );
  }

  Widget _buildTransactionTile(Map<String, dynamic> transaction) {
    final isCredit = transaction['amount'].toString().startsWith('+');
    final color = isCredit ? AppColors.success : AppColors.error;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction['description'],
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  transaction['time'],
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                transaction['amount'],
                style: AppTextStyles.bodyMedium.copyWith(
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  transaction['status'],
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.success,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: AppTextStyles.heading5.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'Update Rates',
                  Icons.monetization_on,
                  AppColors.primary,
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AstrologerRateManagementScreen(),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  'Availability',
                  Icons.schedule,
                  AppColors.info,
                  () {
                    // Navigate to availability settings
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'Profile',
                  Icons.person,
                  AppColors.secondary,
                  () {
                    // Navigate to profile edit
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  'Withdraw',
                  Icons.account_balance,
                  AppColors.success,
                  () {
                    // Navigate to withdrawal
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppTextStyles.bodySmall.copyWith(
                color: color,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}