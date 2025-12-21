import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../models/transaction.dart';
import '../models/user.dart' as app_user;
import '../services/auth/auth_service.dart';
import '../services/api/user_api_service.dart';
import '../services/service_locator.dart';
import '../common/utils/error_handler.dart';
import '../services/payment/razorpay_service.dart';
import '../config/config.dart';
import '../config/payment_config.dart';
import 'transaction_history.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late final AuthService _authService;
  late final UserApiService _userApiService;

  app_user.User? _currentUser;
  double _walletBalance = 0.0;
  List<Transaction> _recentTransactions = [];
  bool _isLoadingTransactions = true;
  bool _isLoadingBalance = true;
  bool _isLoadingEarnings = true;

  // Astrologer-specific data
  double _todaysEarnings = 0.0;
  double _totalEarnings = 0.0;
  int _todaysConsultations = 0;
  int _totalConsultations = 0;
  double _averageRating = 0.0;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _currentUser = _authService.currentUser;
    _loadData();
    _refreshUserProfile();
  }

  Future<void> _refreshUserProfile() async {
    try {
      final token = _authService.authToken;
      if (token != null) {
        final user = await _userApiService.getCurrentUser(token);
        if (mounted) {
          setState(() {
            _currentUser = user;
          });
          // Reload data with updated user info
          _loadData();
        }
      }
    } catch (e) {
      debugPrint('Error refreshing user profile: $e');
    }
  }

  Future<void> _loadData() async {
    final futures = [
      _loadWalletBalance(),
      _loadTransactions(),
    ];

    if (_currentUser?.isAstrologer == true) {
      futures.add(_loadEarningsData());
    }

    await Future.wait(futures);
  }

  Future<void> _loadWalletBalance() async {
    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('No access token available');
      }

      // First try to get from API
      try {
        final walletData = await _userApiService.getWalletBalance(token);
        setState(() {
          _walletBalance = (walletData['wallet_balance'] ?? walletData['balance'] ?? 0).toDouble();
          _isLoadingBalance = false;
        });
        return;
      } catch (apiError) {
        debugPrint('API Error loading wallet balance: $apiError');
      }

      // Fallback to user profile data
      final user = _authService.currentUser;
      setState(() {
        _walletBalance = user?.walletBalance ?? 0.0;
        _isLoadingBalance = false;
      });
    } catch (e) {
      debugPrint('Error loading wallet balance: $e');
      // Final fallback to user profile data
      final user = _authService.currentUser;
      setState(() {
        _walletBalance = user?.walletBalance ?? 0.0;
        _isLoadingBalance = false;
      });
    }
  }

  Future<void> _loadTransactions() async {
    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('No access token available');
      }

      final transactionsData = await _userApiService.getWalletTransactions(token, limit: 10);
      final transactions = (transactionsData['transactions'] as List<dynamic>?)
          ?.map((json) => Transaction.fromJson(json))
          .toList() ?? [];

      setState(() {
        _recentTransactions = transactions;
        _isLoadingTransactions = false;
      });
    } catch (e) {
      debugPrint('Error loading transactions: $e');
      setState(() {
        _isLoadingTransactions = false;
      });
    }
  }

  Future<void> _loadEarningsData() async {
    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('No access token available');
      }

      // Get the current user profile data
      final user = _authService.currentUser;

      // Try to load dashboard data for earnings info
      final dashboardResponse = await _userApiService.getAstrologerDashboard();

      if (dashboardResponse['success'] == true) {
        // Use ONLY real data from the response (fields are at top level, not nested under 'data')
        setState(() {
          _todaysEarnings = (dashboardResponse['today_earnings'] ?? 0).toDouble();
          _totalEarnings = (dashboardResponse['total_earnings'] ?? user?.totalEarnings ?? 0).toDouble();
          _todaysConsultations = dashboardResponse['today_consultations'] ?? 0;
          _totalConsultations = dashboardResponse['total_consultations'] ?? user?.totalConsultations ?? 0;
          _averageRating = (dashboardResponse['average_rating'] ?? user?.rating ?? 0).toDouble();
          _isLoadingEarnings = false;
        });
      } else {
        // Use ONLY real data from user profile - NO DUMMY DATA
        setState(() {
          _todaysEarnings = 0.0; // No API for today's data yet
          _totalEarnings = user?.totalEarnings ?? 0.0;
          _todaysConsultations = 0; // No API for today's data yet
          _totalConsultations = user?.totalConsultations ?? 0;
          _averageRating = user?.rating ?? 0.0;
          _isLoadingEarnings = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading earnings data: $e');
      // Use ONLY real data from user profile - NO DUMMY DATA
      final user = _authService.currentUser;
      setState(() {
        _todaysEarnings = 0.0;
        _totalEarnings = user?.totalEarnings ?? 0.0;
        _todaysConsultations = 0;
        _totalConsultations = user?.totalConsultations ?? 0;
        _averageRating = user?.rating ?? 0.0;
        _isLoadingEarnings = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text('My Wallet', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _refreshUserProfile();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              _buildWalletBalanceCard(),
              if (_currentUser?.isAstrologer == true) ...[
                _buildEarningsSection(),
                _buildAnalyticsSection(),
              ],
              _buildQuickActions(),
              _buildTransactionsList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWalletBalanceCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet, color: AppColors.white, size: 28),
              const SizedBox(width: 12),
              Text(
                'Available Balance',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.white.withValues(alpha: 0.9),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _isLoadingBalance
              ? const CircularProgressIndicator(color: AppColors.white)
              : Text(
                  '₹${_walletBalance.toStringAsFixed(2)}',
                  style: AppTextStyles.heading3.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    final isCustomer = _currentUser?.isCustomer == true;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Only show Add Money for customers (astrologers earn money, they don't add it)
          if (isCustomer) ...[
            Expanded(
              child: _buildActionButton(
                icon: Icons.add,
                label: 'Add Money',
                onTap: _showRechargeDialog,
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: _buildActionButton(
              icon: Icons.history,
              label: 'Transaction History',
              onTap: _showFullHistory,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(height: 8),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Transactions',
                style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
              ),
              TextButton(
                onPressed: _showFullHistory,
                child: Text(
                  'View All',
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary),
                ),
              ),
            ],
          ),
        ),

        // Transaction list
        if (_isLoadingTransactions)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_recentTransactions.isEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(32, 154, 32, 32),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long, size: 64, color: AppColors.grey400),
                  const SizedBox(height: 16),
                  Text(
                    'No transactions yet',
                    style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your transaction history will appear here',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _recentTransactions.length,
            itemBuilder: (context, index) {
              final transaction = _recentTransactions[index];
              return _buildTransactionItem(transaction);
            },
          ),
      ],
    );
  }

  Widget _buildTransactionItem(Transaction transaction) {
    final isCredit = transaction.type == TransactionType.credit;

    // Determine status color and icon
    Color statusColor;
    IconData statusIcon;
    switch (transaction.status) {
      case TransactionStatus.completed:
        statusColor = AppColors.success;
        statusIcon = Icons.check_circle;
        break;
      case TransactionStatus.pending:
        statusColor = Colors.orange;
        statusIcon = Icons.pending;
        break;
      case TransactionStatus.failed:
        statusColor = AppColors.error;
        statusIcon = Icons.cancel;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        onTap: () => _showTransactionDetails(transaction),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isCredit
                ? AppColors.success.withValues(alpha: 0.1)
                : AppColors.error.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isCredit ? Icons.add : Icons.remove,
            color: isCredit ? AppColors.success : AppColors.error,
            size: 18,
          ),
        ),
        title: Text(
          transaction.description,
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w500,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          _formatDate(transaction.createdAt),
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: statusColor.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    statusIcon,
                    color: statusColor,
                    size: 12,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    transaction.status.name.toUpperCase(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '₹${transaction.amount.toStringAsFixed(2)}',
              style: AppTextStyles.bodyMedium.copyWith(
                color: isCredit ? AppColors.success : AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    // Convert UTC to local timezone (IST)
    final localDate = date.toLocal();
    final now = DateTime.now();

    // Check if same day by comparing year, month, and day
    final isToday = localDate.year == now.year &&
                    localDate.month == now.month &&
                    localDate.day == now.day;

    if (isToday) {
      return 'Today ${localDate.hour.toString().padLeft(2, '0')}:${localDate.minute.toString().padLeft(2, '0')}';
    }

    // Check if yesterday
    final yesterday = now.subtract(const Duration(days: 1));
    final isYesterday = localDate.year == yesterday.year &&
                        localDate.month == yesterday.month &&
                        localDate.day == yesterday.day;

    if (isYesterday) {
      return 'Yesterday';
    }

    // Check if within last 7 days
    final difference = now.difference(localDate);
    if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    }

    // Default: show date
    return '${localDate.day}/${localDate.month}/${localDate.year}';
  }

  String _formatFullDateTime(DateTime date) {
    // Convert UTC to local timezone (IST)
    final localDate = date.toLocal();

    final day = localDate.day.toString().padLeft(2, '0');
    final month = localDate.month.toString().padLeft(2, '0');
    final year = localDate.year;
    final hour = localDate.hour.toString().padLeft(2, '0');
    final minute = localDate.minute.toString().padLeft(2, '0');
    final second = localDate.second.toString().padLeft(2, '0');

    return '$day/$month/$year at $hour:$minute:$second';
  }

  void _showTransactionDetails(Transaction transaction) {
    final isCredit = transaction.type == TransactionType.credit;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isCredit
                    ? AppColors.success.withValues(alpha: 0.1)
                    : AppColors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isCredit ? Icons.add_circle : Icons.remove_circle,
                color: isCredit ? AppColors.success : AppColors.error,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Transaction Details',
                    style: AppTextStyles.heading5.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isCredit ? 'Money Added' : 'Money Deducted',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Divider(),
              const SizedBox(height: 16),

              // Amount
              _buildDetailRow(
                'Amount',
                '₹${transaction.amount.toStringAsFixed(2)}',
                valueColor: isCredit ? AppColors.success : AppColors.error,
                isBold: true,
              ),

              const SizedBox(height: 16),

              // Description
              _buildDetailRow(
                'Description',
                transaction.description,
              ),

              const SizedBox(height: 16),

              // Transaction Type
              _buildDetailRow(
                'Type',
                isCredit ? 'Credit' : 'Debit',
                valueColor: isCredit ? AppColors.success : AppColors.error,
              ),

              const SizedBox(height: 16),

              // Status
              _buildDetailRow(
                'Status',
                transaction.status.name.toUpperCase(),
                valueColor: transaction.status == TransactionStatus.completed
                    ? AppColors.success
                    : transaction.status == TransactionStatus.pending
                        ? Colors.orange
                        : AppColors.error,
              ),

              const SizedBox(height: 16),

              // Date & Time
              _buildDetailRow(
                'Date & Time',
                _formatFullDateTime(transaction.createdAt),
              ),

              if (transaction.paymentMethod != null) ...[
                const SizedBox(height: 16),
                _buildDetailRow(
                  'Payment Method',
                  transaction.paymentMethod!.toUpperCase(),
                ),
              ],

              if (transaction.paymentId != null) ...[
                const SizedBox(height: 16),
                _buildDetailRow(
                  'Transaction ID',
                  transaction.paymentId!,
                  isMonospace: true,
                ),
              ],

              const SizedBox(height: 16),

              // Reference ID (internal)
              _buildDetailRow(
                'Reference ID',
                transaction.id,
                isMonospace: true,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Close',
              style: AppTextStyles.button.copyWith(
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    Color? valueColor,
    bool isBold = false,
    bool isMonospace = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(
            label,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              color: valueColor ?? AppColors.textPrimary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              fontFamily: isMonospace ? 'monospace' : null,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  void _showRechargeDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _buildRechargeBottomSheet(),
    );
  }

  Widget _buildRechargeBottomSheet() {
    final rechargeAmounts = [100, 250, 500, 1000, 2000, 5000];
    
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Add Money to Wallet',
            style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 20),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.5,
            ),
            itemCount: rechargeAmounts.length,
            itemBuilder: (context, index) {
              final amount = rechargeAmounts[index];
              return InkWell(
                onTap: () => _processRecharge(amount.toDouble()),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.primary),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '₹$amount',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                'Custom Amount',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _processRecharge(double amount) async {
    Navigator.pop(context);
    
    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('No access token available');
      }

      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppColors.white,
          surfaceTintColor: AppColors.white,
          content: Row(
            children: [
              const CircularProgressIndicator(),
              const SizedBox(width: 16),
              Text(
                'Processing payment...',
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
              ),
            ],
          ),
        ),
      );

      // Initialize Razorpay payment
      await _processRazorpayPayment(amount, token);
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        
        // Handle payment errors gracefully
        final appError = ErrorHandler.handleError(e, context: 'payment');
        ErrorHandler.logError(appError);
        ErrorHandler.showError(context, appError);
      }
    }
  }

  void _showFullHistory() {
    // Navigate to full transaction history page
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TransactionHistoryScreen(),
      ),
    );
  }

  Future<void> _processRazorpayPayment(double amount, String token) async {
    bool dialogClosed = false;

    try {
      // Get current user for payment details
      final currentUser = _authService.currentUser;
      if (currentUser == null) {
        throw Exception('User not found');
      }

      // Check if running on simulator or physical device
      // Use the base URL to determine device type
      bool isSimulator = false;
      try {
        final baseUrl = await Config.baseUrl;
        isSimulator = baseUrl.contains('localhost') || baseUrl.contains('127.0.0.1');
      } catch (e) {
        // If we can't determine, assume physical device to use real Razorpay
        isSimulator = false;
      }

      if (isSimulator) {
        // Close loading dialog before showing mock payment
        if (mounted && !dialogClosed) {
          Navigator.pop(context);
          dialogClosed = true;
        }
        // For testing on simulator, show a mock payment dialog
        _showMockPaymentDialog(amount, token);
        return;
      }

      // Initialize payment configuration with timeout
      try {
        debugPrint('🔄 Initializing payment config...');
        await PaymentConfig.instance.initialize().timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            throw Exception('Payment configuration timeout. Please check your internet connection.');
          },
        );
        debugPrint('✅ Payment config initialized successfully');
      } catch (e) {
        debugPrint('❌ Failed to initialize payment config: $e');
        if (mounted && !dialogClosed) {
          Navigator.pop(context); // Close loading dialog
          dialogClosed = true;

          // Show user-friendly error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Payment service unavailable: ${e.toString()}'),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 5),
              action: SnackBarAction(
                label: 'Retry',
                textColor: AppColors.white,
                onPressed: () => _processRecharge(amount),
              ),
            ),
          );
        }
        return;
      }

      // Initialize Razorpay service
      RazorpayService.instance.initialize();

      // Process payment with Razorpay
      if (!mounted) return;
      
      await RazorpayService.instance.processWalletRecharge(
        context: context,
        amount: amount,
        user: currentUser,
        onSuccess: (paymentId, orderId) async {
          // Payment successful - now add money to wallet
          try {
            await _userApiService.rechargeWallet(
              token,
              amount: amount,
              paymentMethod: 'razorpay',
              paymentId: paymentId,
            );

            if (mounted && !dialogClosed) {
              Navigator.pop(context); // Close loading dialog
              dialogClosed = true;

              // Small delay to ensure transaction is committed to database
              await Future.delayed(const Duration(milliseconds: 500));

              // Refresh wallet data
              await _loadData();

              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('₹${amount.toStringAsFixed(0)} added successfully!'),
                    backgroundColor: AppColors.success,
                  ),
                );
              }
            }
          } catch (e) {
            if (mounted && !dialogClosed) {
              Navigator.pop(context); // Close loading dialog
              dialogClosed = true;

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Payment successful but wallet update failed: $e'),
                  backgroundColor: AppColors.error,
                ),
              );
            }
          }
        },
        onError: (response) {
          if (mounted && !dialogClosed) {
            Navigator.pop(context); // Close loading dialog
            dialogClosed = true;

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Payment failed: ${response.message ?? 'Unknown error'}'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
      );
    } catch (e) {
      debugPrint('❌ Payment process error: $e');
      if (mounted && !dialogClosed) {
        Navigator.pop(context); // Close loading dialog
        dialogClosed = true;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment initialization failed: $e'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Retry',
              textColor: AppColors.white,
              onPressed: () => _processRecharge(amount),
            ),
          ),
        );
      }
    }
  }

  void _showMockPaymentDialog(double amount, String token) async {
    Navigator.pop(context); // Close loading dialog
    
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: Colors.orange,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Simulator Detected',
              style: AppTextStyles.heading6.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.orange.withValues(alpha: 0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: Colors.orange,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'DEVELOPMENT MODE',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: Colors.orange,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'You are running this app on a simulator.',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Razorpay payment gateway cannot be used on simulators. To test real payments:',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '• ',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            'Use a physical device (iPhone/Android)',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '• ',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            'Ensure backend is accessible from device',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Test Amount:',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    Text(
                      '₹${amount.toStringAsFixed(0)}',
                      style: AppTextStyles.heading6.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'For development testing only:',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondaryLight,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You can simulate a successful payment to test the wallet recharge flow. This will add test money to your wallet (not real money).',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.textSecondaryLight,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: Text(
              'Cancel',
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context, true),
            icon: const Icon(Icons.science_outlined, size: 18),
            label: Text(
              'Simulate Payment',
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.white,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );

    if (result == true) {
      // Simulate successful payment
      try {
        await _userApiService.rechargeWallet(
          token,
          amount: amount,
          paymentMethod: 'razorpay',
          paymentId: 'pay_mock_${DateTime.now().millisecondsSinceEpoch}',
        );

        // Small delay to ensure transaction is committed to database
        await Future.delayed(const Duration(milliseconds: 500));

        // Refresh wallet data
        await _loadData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.science_outlined, color: AppColors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('₹${amount.toStringAsFixed(0)} added (Simulator Test - Not Real Money)'),
                  ),
                ],
              ),
              backgroundColor: Colors.orange,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Mock payment failed: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  // Astrologer-specific sections
  Widget _buildEarningsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.trending_up, color: AppColors.success, size: 24),
              const SizedBox(width: 12),
              Text(
                'Earnings Overview',
                style: AppTextStyles.heading5.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
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
              const SizedBox(width: 12),
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
        ],
      ),
    );
  }

  Widget _buildAnalyticsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.analytics, color: AppColors.info, size: 24),
              const SizedBox(width: 12),
              Text(
                'Analytics',
                style: AppTextStyles.heading5.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildAnalyticsItem(
                  'Today\'s Consultations',
                  _todaysConsultations.toString(),
                  Icons.today,
                  AppColors.info,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildAnalyticsItem(
                  'Total Consultations',
                  _totalConsultations.toString(),
                  Icons.chat,
                  AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildAnalyticsItem(
            'Average Rating',
            '${_averageRating.toStringAsFixed(1)} ⭐',
            Icons.star,
            AppColors.warning,
            isFullWidth: true,
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsItem(String title, String amount, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
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
          _isLoadingEarnings
              ? SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                )
              : Text(
                  amount,
                  style: AppTextStyles.heading6.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsItem(String title, String value, IconData icon, Color color, {bool isFullWidth = false}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
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
          _isLoadingEarnings
              ? SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                )
              : Text(
                  value,
                  style: AppTextStyles.heading6.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ],
      ),
    );
  }
}

