import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
// Future API integration
// import '../services/api/user_api_service.dart';
// import '../services/local/local_storage_service.dart';
// import '../services/service_locator.dart';

enum TransactionType { earning, withdrawal, bonus, penalty, refund }
enum EarningsPeriod { today, week, month, year, all }

class EarningTransaction {
  final String id;
  final TransactionType type;
  final double amount;
  final DateTime timestamp;
  final String description;
  final String? clientName;
  final String? consultationId;
  final String? status;

  EarningTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.timestamp,
    required this.description,
    this.clientName,
    this.consultationId,
    this.status,
  });

  factory EarningTransaction.fromJson(Map<String, dynamic> json) {
    return EarningTransaction(
      id: json['id'] ?? '',
      type: _parseTransactionType(json['type']),
      amount: (json['amount'] ?? 0).toDouble(),
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      description: json['description'] ?? '',
      clientName: json['client_name'],
      consultationId: json['consultation_id'],
      status: json['status'],
    );
  }

  static TransactionType _parseTransactionType(String? type) {
    switch (type?.toLowerCase()) {
      case 'earning':
      case 'consultation':
        return TransactionType.earning;
      case 'withdrawal':
      case 'payout':
        return TransactionType.withdrawal;
      case 'bonus':
      case 'incentive':
        return TransactionType.bonus;
      case 'penalty':
      case 'deduction':
        return TransactionType.penalty;
      case 'refund':
        return TransactionType.refund;
      default:
        return TransactionType.earning;
    }
  }
}

class EarningsStats {
  final double todaysEarnings;
  final double weeksEarnings;
  final double monthsEarnings;
  final double totalEarnings;
  final double availableBalance;
  final double pendingAmount;
  final int totalConsultations;
  final int completedConsultations;
  final double averageEarningPerConsultation;

  EarningsStats({
    required this.todaysEarnings,
    required this.weeksEarnings,
    required this.monthsEarnings,
    required this.totalEarnings,
    required this.availableBalance,
    required this.pendingAmount,
    required this.totalConsultations,
    required this.completedConsultations,
    required this.averageEarningPerConsultation,
  });
}

class AstrologerEarningsScreen extends StatefulWidget {
  const AstrologerEarningsScreen({super.key});

  @override
  State<AstrologerEarningsScreen> createState() => _AstrologerEarningsScreenState();
}

class _AstrologerEarningsScreenState extends State<AstrologerEarningsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  // API services for future use
  // late UserApiService _userApiService;
  // late LocalStorageService _localStorage;

  EarningsStats? _earningsStats;
  List<EarningTransaction> _transactions = [];
  EarningsPeriod _selectedPeriod = EarningsPeriod.month;
  
  bool _isLoading = true;
  bool _isWithdrawing = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    // _userApiService = getIt<UserApiService>();
    // _localStorage = getIt<LocalStorageService>();
    _loadEarningsData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadEarningsData() async {
    setState(() => _isLoading = true);

    try {
      // Generate demo data (replace with actual API calls)
      await Future.delayed(const Duration(milliseconds: 800));
      _earningsStats = _generateDemoStats();
      _transactions = _generateDemoTransactions();
    } catch (e) {
      debugPrint('Error loading earnings data: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to load earnings data'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }

    setState(() => _isLoading = false);
  }

  EarningsStats _generateDemoStats() {
    return EarningsStats(
      todaysEarnings: 1250.0,
      weeksEarnings: 8350.0,
      monthsEarnings: 24750.0,
      totalEarnings: 147500.0,
      availableBalance: 15600.0,
      pendingAmount: 2400.0,
      totalConsultations: 245,
      completedConsultations: 238,
      averageEarningPerConsultation: 585.0,
    );
  }

  List<EarningTransaction> _generateDemoTransactions() {
    final now = DateTime.now();
    return [
      EarningTransaction(
        id: '1',
        type: TransactionType.earning,
        amount: 300.0,
        timestamp: now.subtract(const Duration(hours: 2)),
        description: 'Video consultation',
        clientName: 'Priya Sharma',
        consultationId: 'CS001',
        status: 'completed',
      ),
      EarningTransaction(
        id: '2',
        type: TransactionType.earning,
        amount: 150.0,
        timestamp: now.subtract(const Duration(hours: 4)),
        description: 'Chat consultation',
        clientName: 'Rahul Kumar',
        consultationId: 'CS002',
        status: 'completed',
      ),
      EarningTransaction(
        id: '3',
        type: TransactionType.withdrawal,
        amount: -5000.0,
        timestamp: now.subtract(const Duration(days: 1)),
        description: 'Bank transfer to HDFC ***1234',
        status: 'processed',
      ),
      EarningTransaction(
        id: '4',
        type: TransactionType.bonus,
        amount: 500.0,
        timestamp: now.subtract(const Duration(days: 2)),
        description: 'Weekly performance bonus',
        status: 'credited',
      ),
      EarningTransaction(
        id: '5',
        type: TransactionType.earning,
        amount: 200.0,
        timestamp: now.subtract(const Duration(days: 2)),
        description: 'Voice call consultation',
        clientName: 'Anita Mehta',
        consultationId: 'CS003',
        status: 'completed',
      ),
      EarningTransaction(
        id: '6',
        type: TransactionType.refund,
        amount: -75.0,
        timestamp: now.subtract(const Duration(days: 3)),
        description: 'Consultation refund',
        clientName: 'Vikash Singh',
        consultationId: 'CS004',
        status: 'processed',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Earnings'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadEarningsData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.white,
          labelColor: AppColors.white,
          unselectedLabelColor: AppColors.white.withValues(alpha: 0.7),
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Transactions'),
            Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildTransactionsTab(),
                _buildAnalyticsTab(),
              ],
            ),
    );
  }

  Widget _buildOverviewTab() {
    return RefreshIndicator(
      onRefresh: _loadEarningsData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Balance cards
            Row(
              children: [
                Expanded(
                  child: _buildBalanceCard(
                    'Available Balance',
                    _earningsStats!.availableBalance,
                    Icons.account_balance_wallet,
                    AppColors.success,
                    showWithdrawButton: true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildBalanceCard(
                    'Pending Amount',
                    _earningsStats!.pendingAmount,
                    Icons.schedule,
                    AppColors.warning,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // Period selector
            _buildPeriodSelector(),
            
            const SizedBox(height: 16),
            
            // Earnings summary
            _buildEarningsGrid(),
            
            const SizedBox(height: 20),
            
            // Recent transactions
            Text(
              'Recent Transactions',
              style: AppTextStyles.heading5.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            
            // Show last 3 transactions
            ..._transactions.take(3).map(_buildTransactionTile),
            
            const SizedBox(height: 16),
            
            // View all transactions button
            Center(
              child: TextButton(
                onPressed: () => _tabController.animateTo(1),
                child: const Text('View All Transactions'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionsTab() {
    return Column(
      children: [
        // Filter bar
        Container(
          padding: const EdgeInsets.all(16),
          color: AppColors.white,
          child: Row(
            children: [
              Expanded(
                child: _buildPeriodSelector(),
              ),
              const SizedBox(width: 12),
              IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: _showTransactionFilters,
              ),
            ],
          ),
        ),
        
        // Transactions list
        Expanded(
          child: _transactions.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long, size: 64, color: AppColors.textSecondary),
                      SizedBox(height: 16),
                      Text(
                        'No transactions found',
                        style: TextStyle(
                          fontSize: 18,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadEarningsData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _transactions.length,
                    itemBuilder: (context, index) {
                      return _buildTransactionTile(_transactions[index]);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildAnalyticsTab() {
    return RefreshIndicator(
      onRefresh: _loadEarningsData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Performance metrics
            Text(
              'Performance Metrics',
              style: AppTextStyles.heading5.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            _buildMetricCard(
              'Total Consultations',
              '${_earningsStats!.totalConsultations}',
              Icons.chat_bubble_outline,
              AppColors.primary,
            ),
            
            const SizedBox(height: 12),
            
            _buildMetricCard(
              'Completed Consultations',
              '${_earningsStats!.completedConsultations}',
              Icons.check_circle_outline,
              AppColors.success,
            ),
            
            const SizedBox(height: 12),
            
            _buildMetricCard(
              'Average Earning per Consultation',
              '₹${_earningsStats!.averageEarningPerConsultation.toStringAsFixed(0)}',
              Icons.trending_up,
              AppColors.info,
            ),
            
            const SizedBox(height: 12),
            
            _buildMetricCard(
              'Completion Rate',
              '${((_earningsStats!.completedConsultations / _earningsStats!.totalConsultations) * 100).toStringAsFixed(1)}%',
              Icons.percent,
              AppColors.warning,
            ),
            
            const SizedBox(height: 24),
            
            // Chart placeholder
            Container(
              height: 200,
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
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bar_chart,
                    size: 64,
                    color: AppColors.textSecondary.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Earnings Chart',
                    style: AppTextStyles.heading5.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Visual analytics coming soon',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard(String title, double amount, IconData icon, Color color, {bool showWithdrawButton = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            '₹${amount.toStringAsFixed(2)}',
            style: AppTextStyles.heading5.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (showWithdrawButton) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isWithdrawing || amount < 100 ? null : _initiateWithdrawal,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isWithdrawing
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Withdraw'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPeriodSelector() {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: EarningsPeriod.values.take(4).map((period) {
          final isSelected = _selectedPeriod == period;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedPeriod = period;
                });
              },
              child: Container(
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Center(
                  child: Text(
                    _getPeriodLabel(period),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: isSelected ? AppColors.white : AppColors.textSecondary,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEarningsGrid() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildEarningsCard(
                'Today',
                _earningsStats!.todaysEarnings,
                Icons.today,
                AppColors.info,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildEarningsCard(
                'This Week',
                _earningsStats!.weeksEarnings,
                Icons.date_range,
                AppColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildEarningsCard(
                'This Month',
                _earningsStats!.monthsEarnings,
                Icons.calendar_month,
                AppColors.warning,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildEarningsCard(
                'All Time',
                _earningsStats!.totalEarnings,
                Icons.insights,
                AppColors.primary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEarningsCard(String title, double amount, IconData icon, Color color) {
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
            '₹${amount.toStringAsFixed(0)}',
            style: AppTextStyles.heading5.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: AppTextStyles.heading5.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionTile(EarningTransaction transaction) {
    final isPositive = transaction.amount > 0;
    final color = _getTransactionColor(transaction.type);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getTransactionIcon(transaction.type),
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
                  transaction.description,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      _formatDate(transaction.timestamp),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    if (transaction.clientName != null) ...[
                      Text(
                        ' • ',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Text(
                        transaction.clientName!,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isPositive ? '+' : ''}₹${transaction.amount.abs().toStringAsFixed(0)}',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: isPositive ? AppColors.success : AppColors.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (transaction.status != null) ...[
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(transaction.status!).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    transaction.status!.toUpperCase(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: _getStatusColor(transaction.status!),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Color _getTransactionColor(TransactionType type) {
    switch (type) {
      case TransactionType.earning:
        return AppColors.success;
      case TransactionType.withdrawal:
        return AppColors.primary;
      case TransactionType.bonus:
        return AppColors.info;
      case TransactionType.penalty:
        return AppColors.error;
      case TransactionType.refund:
        return AppColors.warning;
    }
  }

  IconData _getTransactionIcon(TransactionType type) {
    switch (type) {
      case TransactionType.earning:
        return Icons.trending_up;
      case TransactionType.withdrawal:
        return Icons.account_balance;
      case TransactionType.bonus:
        return Icons.card_giftcard;
      case TransactionType.penalty:
        return Icons.trending_down;
      case TransactionType.refund:
        return Icons.undo;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'processed':
      case 'credited':
        return AppColors.success;
      case 'pending':
        return AppColors.warning;
      case 'failed':
      case 'rejected':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getPeriodLabel(EarningsPeriod period) {
    switch (period) {
      case EarningsPeriod.today:
        return 'Today';
      case EarningsPeriod.week:
        return 'Week';
      case EarningsPeriod.month:
        return 'Month';
      case EarningsPeriod.year:
        return 'Year';
      case EarningsPeriod.all:
        return 'All';
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today ${_formatTime(date)}';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  String _formatTime(DateTime date) {
    final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  void _initiateWithdrawal() async {
    // Show withdrawal dialog
    final amount = await _showWithdrawalDialog();
    if (amount == null) return;

    setState(() => _isWithdrawing = true);

    try {
      // Simulate withdrawal process
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        setState(() => _isWithdrawing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Withdrawal of ₹$amount initiated successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        
        // Refresh data
        _loadEarningsData();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isWithdrawing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Withdrawal failed. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<double?> _showWithdrawalDialog() async {
    final TextEditingController amountController = TextEditingController();
    
    return showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Withdraw Earnings'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Available Balance: ₹${_earningsStats!.availableBalance.toStringAsFixed(2)}',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.success,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Withdrawal Amount',
                hintText: 'Enter amount',
                prefixText: '₹',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Minimum withdrawal: ₹100\nProcessing time: 1-2 business days',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final amount = double.tryParse(amountController.text);
              if (amount == null || amount < 100) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please enter a valid amount (minimum ₹100)'),
                    backgroundColor: AppColors.error,
                  ),
                );
                return;
              }
              if (amount > _earningsStats!.availableBalance) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Amount exceeds available balance'),
                    backgroundColor: AppColors.error,
                  ),
                );
                return;
              }
              Navigator.of(context).pop(amount);
            },
            child: const Text('Withdraw'),
          ),
        ],
      ),
    );
  }

  void _showTransactionFilters() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Filter Transactions',
              style: AppTextStyles.heading5.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            const Text('Feature coming soon...'),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}