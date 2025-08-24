import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../models/transaction.dart';
import '../services/auth/auth_service.dart';
import '../services/api/user_api_service.dart';
import '../services/service_locator.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  late final AuthService _authService;
  late final UserApiService _userApiService;
  
  List<Transaction> _transactions = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _page = 1;
  final int _limit = 20;
  
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    
    _scrollController.addListener(_onScroll);
    _loadTransactions();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
      if (_hasMore && !_isLoading) {
        _loadMoreTransactions();
      }
    }
  }

  Future<void> _loadTransactions() async {
    if (!mounted) return;
    
    setState(() {
      _isLoading = true;
      _page = 1;
    });

    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await _userApiService.getWalletTransactions(
        token, 
        limit: _limit,
        offset: (_page - 1) * _limit
      );
      
      if (mounted) {
        final transactionsList = response['transactions'] as List<dynamic>? ?? [];
        final transactions = transactionsList
            .map((json) => Transaction.fromJson(json as Map<String, dynamic>))
            .toList();
            
        setState(() {
          _transactions = transactions;
          _hasMore = (transactions.length >= _limit);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load transactions: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _loadMoreTransactions() async {
    if (!_hasMore || _isLoading) return;

    setState(() => _isLoading = true);

    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await _userApiService.getWalletTransactions(
        token, 
        limit: _limit,
        offset: _page * _limit
      );
      
      if (mounted) {
        final transactionsList = response['transactions'] as List<dynamic>? ?? [];
        final newTransactions = transactionsList
            .map((json) => Transaction.fromJson(json as Map<String, dynamic>))
            .toList();
            
        setState(() {
          _page++;
          _transactions.addAll(newTransactions);
          _hasMore = (newTransactions.length >= _limit);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load more transactions: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String _getTransactionTypeDisplay(TransactionType type) {
    switch (type) {
      case TransactionType.credit:
        return 'Credit';
      case TransactionType.debit:
        return 'Debit';
    }
  }

  String _getPurposeDisplay(String description) {
    switch (description.toLowerCase()) {
      case 'wallet recharge':
      case 'recharge':
        return 'Wallet Recharge';
      case 'consultation payment':
      case 'consultation':
        return 'Consultation Payment';
      case 'consultation refund':
      case 'refund':
        return 'Consultation Refund';
      case 'product purchase':
        return 'Product Purchase';
      case 'commission payout':
        return 'Commission Payout';
      default:
        return description.isNotEmpty 
            ? description[0].toUpperCase() + description.substring(1)
            : 'Transaction';
    }
  }

  Color _getTransactionColor(TransactionType type) {
    switch (type) {
      case TransactionType.credit:
        return AppColors.success;
      case TransactionType.debit:
        return AppColors.error;
    }
  }

  IconData _getTransactionIcon(TransactionType type, String description) {
    switch (type) {
      case TransactionType.credit:
        if (description.toLowerCase().contains('recharge')) {
          return Icons.add_circle;
        } else if (description.toLowerCase().contains('refund')) {
          return Icons.refresh;
        }
        return Icons.arrow_downward;
      case TransactionType.debit:
        if (description.toLowerCase().contains('consultation')) {
          return Icons.video_call;
        } else if (description.toLowerCase().contains('product')) {
          return Icons.shopping_cart;
        }
        return Icons.arrow_upward;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    try {
      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return 'Unknown';
    }
  }

  Widget _buildTransactionCard(Transaction transaction) {
    final isCredit = transaction.type == TransactionType.credit;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight, width: 1),
      ),
      child: Row(
        children: [
          // Transaction Icon
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _getTransactionColor(transaction.type).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Icon(
              _getTransactionIcon(transaction.type, transaction.description),
              color: _getTransactionColor(transaction.type),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          
          // Transaction Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getPurposeDisplay(transaction.description),
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _getTransactionTypeDisplay(transaction.type),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: _getTransactionColor(transaction.type),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDateTime(transaction.createdAt),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                ),
                if (transaction.status != TransactionStatus.completed) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: transaction.status == TransactionStatus.pending
                          ? AppColors.warning.withValues(alpha: 0.1)
                          : AppColors.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      transaction.status.name.toUpperCase(),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: transaction.status == TransactionStatus.pending
                            ? AppColors.warning
                            : AppColors.error,
                        fontWeight: FontWeight.w500,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          
          // Amount
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isCredit ? '+' : '-'}₹${transaction.amount.toStringAsFixed(2)}',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: _getTransactionColor(transaction.type),
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (transaction.paymentMethod?.isNotEmpty == true) ...[
                const SizedBox(height: 4),
                Text(
                  transaction.paymentMethod!.toUpperCase(),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondaryLight,
                    fontSize: 10,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long,
              size: 64,
              color: AppColors.textSecondaryLight,
            ),
            const SizedBox(height: 16),
            Text(
              'No Transactions Found',
              style: AppTextStyles.heading5.copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your transaction history will appear here once you make your first payment.',
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        title: Text(
          'Transaction History',
          style: AppTextStyles.heading5.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadTransactions,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTransactions,
        child: _isLoading && _transactions.isEmpty
            ? _buildLoadingIndicator()
            : _transactions.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _transactions.length + (_hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _transactions.length) {
                        // Loading indicator at bottom
                        return _isLoading
                            ? const Padding(
                                padding: EdgeInsets.all(16),
                                child: Center(child: CircularProgressIndicator()),
                              )
                            : const SizedBox.shrink();
                      }
                      
                      return _buildTransactionCard(_transactions[index]);
                    },
                  ),
      ),
    );
  }
}