import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../models/transaction.dart';
import '../services/auth/auth_service.dart';
import '../services/api/user_api_service.dart';
import '../services/service_locator.dart';
import '../services/payment/razorpay_service.dart';
import '../config/config.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late final AuthService _authService;
  late final UserApiService _userApiService;
  
  double _walletBalance = 0.0;
  List<Transaction> _recentTransactions = [];
  bool _isLoadingTransactions = true;
  bool _isLoadingBalance = true;

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _loadData();
  }

  Future<void> _loadData() async {
    await Future.wait([
      _loadWalletBalance(),
      _loadTransactions(),
    ]);
  }

  Future<void> _loadWalletBalance() async {
    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('No access token available');
      }

      final walletData = await _userApiService.getWalletBalance(token);
      setState(() {
        _walletBalance = (walletData['wallet_balance'] ?? 0).toDouble();
        _isLoadingBalance = false;
      });
    } catch (e) {
      debugPrint('Error loading wallet balance: $e');
      setState(() {
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
      body: Column(
        children: [
          _buildWalletBalanceCard(),
          _buildQuickActions(),
          Expanded(child: _buildTransactionsList()),
        ],
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
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildActionButton(
              icon: Icons.add,
              label: 'Add Money',
              onTap: _showRechargeDialog,
            ),
          ),
          const SizedBox(width: 12),
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
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
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
          Expanded(
            child: _isLoadingTransactions
                ? const Center(child: CircularProgressIndicator())
                : _recentTransactions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
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
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.only(bottom: 16),
                        itemCount: _recentTransactions.length,
                        separatorBuilder: (context, index) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final transaction = _recentTransactions[index];
                          return _buildTransactionItem(transaction);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(Transaction transaction) {
    final isCredit = transaction.type == TransactionType.credit;
    return ListTile(
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
      ),
      trailing: Text(
        '${isCredit ? '+' : '-'}₹${transaction.amount.toStringAsFixed(2)}',
        style: AppTextStyles.bodyMedium.copyWith(
          color: isCredit ? AppColors.success : AppColors.error,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
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
        builder: (context) => const AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 16),
              Text('Processing payment...'),
            ],
          ),
        ),
      );

      // Initialize Razorpay payment
      await _processRazorpayPayment(amount, token);
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment failed: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showFullHistory() {
    // Navigate to full transaction history page
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Full transaction history coming soon!')),
    );
  }

  Future<void> _processRazorpayPayment(double amount, String token) async {
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
        // For testing on simulator, show a mock payment dialog
        _showMockPaymentDialog(amount, token);
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

            if (mounted) {
              Navigator.pop(context); // Close loading dialog
              
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
            if (mounted) {
              Navigator.pop(context); // Close loading dialog
              
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
          if (mounted) {
            Navigator.pop(context); // Close loading dialog
            
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
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment initialization failed: $e'),
            backgroundColor: AppColors.error,
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
        title: Text(
          'Test Payment',
          style: AppTextStyles.heading6.copyWith(
            color: AppColors.textPrimaryLight,
            fontWeight: FontWeight.bold,
          ),
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
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Simulator Payment',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'This is a test payment for development purposes.',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Amount:',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textPrimaryLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '₹${amount.toStringAsFixed(0)}',
                    style: AppTextStyles.heading6.copyWith(
                      color: AppColors.success,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Would you like to simulate a successful payment?',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textPrimaryLight,
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
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Pay Now',
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.white,
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

        // Refresh wallet data
        await _loadData();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('₹${amount.toStringAsFixed(0)} added successfully! (Mock Payment)'),
              backgroundColor: AppColors.success,
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
}

