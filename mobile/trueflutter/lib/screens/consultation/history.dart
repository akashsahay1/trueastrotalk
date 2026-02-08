import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../models/consultation_history.dart';
import '../../services/auth/auth_service.dart';
import '../../services/api/user_api_service.dart';
import '../../services/service_locator.dart';
import '../astrologer/astrologer_details.dart';

class HistoryScreen extends StatefulWidget {
  final int? initialTabIndex;
  
  const HistoryScreen({super.key, this.initialTabIndex});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  late final AuthService _authService;
  late final UserApiService _userApiService;

  List<ConsultationHistory> _allHistory = [];
  List<ConsultationHistory> _callHistory = [];
  List<ConsultationHistory> _videoHistory = [];
  List<ConsultationHistory> _audioHistory = [];
  List<ConsultationHistory> _chatHistory = [];
  bool _isLoading = true;
  bool _isAstrologer = false;

  // Sorting and search options
  String _sortBy = 'date_desc'; // date_desc, date_asc, amount_desc, amount_asc
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _isAstrologer = _authService.currentUser?.isAstrologer == true;

    // Astrologers get 4 tabs (All, Video, Audio, Chat), Customers get 3 tabs (All, Calls, Chats)
    _tabController = TabController(
      length: _isAstrologer ? 4 : 3,
      vsync: this,
      initialIndex: widget.initialTabIndex ?? 0,
    );
    _loadConsultationHistory();
  }

  Future<void> _loadConsultationHistory() async {
    try {
      final currentUser = _authService.currentUser;
      final token = _authService.authToken;

      if (token == null) {
        throw Exception('No access token available');
      }

      Map<String, dynamic> historyData;

      // Call appropriate API based on user type
      if (currentUser?.isAstrologer == true) {
        debugPrint('📋 Loading astrologer consultations...');
        historyData = await _userApiService.getAstrologerConsultations();
      } else {
        debugPrint('📋 Loading customer consultation history...');
        historyData = await _userApiService.getConsultationHistory(token);
      }

      final consultations = (historyData['consultations'] as List<dynamic>?)
          ?.map((json) => ConsultationHistory.fromJson(json))
          .toList() ?? [];

      debugPrint('📋 Loaded ${consultations.length} consultations');

      setState(() {
        _allHistory = consultations;
        _callHistory = consultations.where((c) => c.type == ConsultationType.call || c.type == ConsultationType.video).toList();
        _videoHistory = consultations.where((c) => c.type == ConsultationType.video).toList();
        _audioHistory = consultations.where((c) => c.type == ConsultationType.call).toList();
        _chatHistory = consultations.where((c) => c.type == ConsultationType.chat).toList();
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading consultation history: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text('Consultation History', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
        actions: [
          // Search button
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.white),
            tooltip: 'Search',
            onPressed: () => _showSearchDialog(),
          ),
          // Sort button
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort, color: AppColors.white),
            tooltip: 'Sort',
            onSelected: (value) {
              setState(() {
                _sortBy = value;
              });
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'date_desc',
                child: Row(
                  children: [
                    Icon(Icons.arrow_downward, size: 18, color: _sortBy == 'date_desc' ? AppColors.primary : null),
                    const SizedBox(width: 8),
                    const Text('Newest First'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'date_asc',
                child: Row(
                  children: [
                    Icon(Icons.arrow_upward, size: 18, color: _sortBy == 'date_asc' ? AppColors.primary : null),
                    const SizedBox(width: 8),
                    const Text('Oldest First'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'amount_desc',
                child: Row(
                  children: [
                    Icon(Icons.attach_money, size: 18, color: _sortBy == 'amount_desc' ? AppColors.primary : null),
                    const SizedBox(width: 8),
                    const Text('Highest Amount'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'amount_asc',
                child: Row(
                  children: [
                    Icon(Icons.money_off, size: 18, color: _sortBy == 'amount_asc' ? AppColors.primary : null),
                    const SizedBox(width: 8),
                    const Text('Lowest Amount'),
                  ],
                ),
              ),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.white,
          labelColor: AppColors.white,
          unselectedLabelColor: AppColors.white.withValues(alpha: 0.7),
          isScrollable: _isAstrologer, // Scrollable for 4 tabs
          tabs: _isAstrologer
              ? const [
                  Tab(text: 'All'),
                  Tab(text: 'Video'),
                  Tab(text: 'Audio'),
                  Tab(text: 'Chat'),
                ]
              : const [
                  Tab(text: 'All'),
                  Tab(text: 'Calls'),
                  Tab(text: 'Chats'),
                ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search filter indicator
                if (_searchQuery.isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: AppColors.primary.withValues(alpha: 0.1),
                    child: Row(
                      children: [
                        const Icon(Icons.search, size: 16, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Searching: "$_searchQuery"',
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _searchQuery = '';
                              _searchController.clear();
                            });
                          },
                          child: const Icon(Icons.close, size: 18, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                // Tab content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: _isAstrologer
                        ? [
                            _buildAllHistory(),
                            _buildHistory(_videoHistory, 'No video consultations yet'),
                            _buildHistory(_audioHistory, 'No audio consultations yet'),
                            _buildHistory(_chatHistory, 'No chat consultations yet'),
                          ]
                        : [
                            _buildAllHistory(),
                            _buildHistory(_callHistory, 'No call consultations yet'),
                            _buildHistory(_chatHistory, 'No chat consultations yet'),
                          ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildAllHistory() {
    final allHistory = List<ConsultationHistory>.from(_allHistory);
    _sortList(allHistory);
    return _buildHistory(allHistory, 'No consultations yet');
  }

  void _sortList(List<ConsultationHistory> list) {
    switch (_sortBy) {
      case 'date_desc':
        list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case 'date_asc':
        list.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        break;
      case 'amount_desc':
        list.sort((a, b) => b.amount.compareTo(a.amount));
        break;
      case 'amount_asc':
        list.sort((a, b) => a.amount.compareTo(b.amount));
        break;
    }
  }

  Widget _buildHistory(List<ConsultationHistory> history, String emptyMessage) {
    // Apply search filter
    var filteredHistory = history;
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filteredHistory = history.where((c) {
        return c.astrologerName.toLowerCase().contains(query) ||
               (c.clientPhone?.toLowerCase().contains(query) ?? false) ||
               (c.clientEmail?.toLowerCase().contains(query) ?? false);
      }).toList();
    }

    if (filteredHistory.isEmpty) {
      if (_searchQuery.isNotEmpty) {
        return _buildEmptyState('No results for "$_searchQuery"');
      }
      return _buildEmptyState(emptyMessage);
    }

    // Apply sorting to a copy
    final sortedHistory = List<ConsultationHistory>.from(filteredHistory);
    _sortList(sortedHistory);

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sortedHistory.length,
      itemBuilder: (context, index) {
        final consultation = sortedHistory[index];
        return _buildHistoryCard(consultation);
      },
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, size: 80, color: AppColors.grey400),
          const SizedBox(height: 16),
          Text(
            message,
            style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'Your consultation history will appear here',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(ConsultationHistory consultation) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getConsultationColor(consultation.type).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _getConsultationIcon(consultation.type),
                    color: _getConsultationColor(consultation.type),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        consultation.astrologerName,
                        style: AppTextStyles.bodyMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${consultation.type.name.toUpperCase()} • ${consultation.duration}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(consultation.status),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _formatDate(consultation.createdAt),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  '₹${consultation.amount.toStringAsFixed(0)}',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            if (consultation.status == ConsultationStatus.completed && consultation.rating != null) ...[
              const SizedBox(height: 8),
              const Divider(),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    'Your Rating: ',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Row(
                    children: List.generate(5, (index) {
                      return Icon(
                        index < consultation.rating!.floor()
                            ? Icons.star
                            : Icons.star_border,
                        color: Colors.amber,
                        size: 16,
                      );
                    }),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    consultation.rating!.toStringAsFixed(1),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
            if (consultation.status == ConsultationStatus.completed) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _viewDetails(consultation),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('View Details'),
                    ),
                  ),
                  // Only show "Consult Again" for customers, not astrologers
                  if (_authService.currentUser?.isAstrologer != true) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _consultAgain(consultation),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Consult Again'),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(ConsultationStatus status) {
    Color backgroundColor;
    Color textColor;
    String text;

    switch (status) {
      case ConsultationStatus.completed:
        backgroundColor = AppColors.success.withValues(alpha: 0.1);
        textColor = AppColors.success;
        text = 'Completed';
        break;
      case ConsultationStatus.cancelled:
        backgroundColor = AppColors.error.withValues(alpha: 0.1);
        textColor = AppColors.error;
        text = 'Cancelled';
        break;
      case ConsultationStatus.pending:
        backgroundColor = AppColors.warning.withValues(alpha: 0.1);
        textColor = AppColors.warning;
        text = 'Pending';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: AppTextStyles.bodySmall.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
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

  void _viewDetails(ConsultationHistory consultation) {
    // Show consultation details in a bottom sheet
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _buildDetailsBottomSheet(consultation),
    );
  }

  Widget _buildDetailsBottomSheet(ConsultationHistory consultation) {
    final isAstrologer = _authService.currentUser?.isAstrologer == true;
    final platformCommission = consultation.amount * 0.20; // 20% platform fee
    final astrologerEarnings = consultation.amount * 0.80; // 80% to astrologer

    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _getConsultationColor(consultation.type).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getConsultationIcon(consultation.type),
                  color: _getConsultationColor(consultation.type),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Consultation Details',
                      style: AppTextStyles.heading5,
                    ),
                    Text(
                      consultation.type.name.toUpperCase(),
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 16),

          // Show different labels based on user type
          _buildDetailRow(
            isAstrologer ? 'Client' : 'Astrologer',
            consultation.astrologerName,
          ),
          _buildDetailRow('Duration', consultation.duration),
          _buildDetailRow('Date', _formatDate(consultation.createdAt)),
          _buildDetailRow('Status', consultation.status.name.toUpperCase()),

          const SizedBox(height: 8),
          const Divider(),
          const SizedBox(height: 8),

          // Payment breakdown
          Text(
            'Payment Details',
            style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          _buildDetailRow('Total Amount', '₹${consultation.amount.toStringAsFixed(0)}'),
          _buildDetailRow('Platform Fee (20%)', '₹${platformCommission.toStringAsFixed(0)}'),
          if (isAstrologer) ...[
            _buildDetailRow(
              'Your Earnings (80%)',
              '₹${astrologerEarnings.toStringAsFixed(0)}',
              valueColor: AppColors.success,
            ),
          ] else ...[
            _buildDetailRow(
              'Astrologer Received',
              '₹${astrologerEarnings.toStringAsFixed(0)}',
            ),
          ],

          if (consultation.rating != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  'Your Rating: ',
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                ),
                Row(
                  children: List.generate(5, (index) {
                    return Icon(
                      index < consultation.rating!.floor() ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 20,
                    );
                  }),
                ),
                const SizedBox(width: 8),
                Text(
                  consultation.rating!.toStringAsFixed(1),
                  style: AppTextStyles.bodyMedium,
                ),
              ],
            ),
          ],

          if (consultation.review != null && consultation.review!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(
              'Your Review',
              style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              consultation.review!,
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
            ),
          ],

          const SizedBox(height: 24),

          // Action button - only show "Consult Again" for customers
          if (!isAstrologer) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _consultAgain(consultation);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Consult Again'),
              ),
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
          ),
          Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getConsultationIcon(ConsultationType type) {
    switch (type) {
      case ConsultationType.call:
        return Icons.call;
      case ConsultationType.video:
        return Icons.videocam;
      case ConsultationType.chat:
        return Icons.chat;
    }
  }

  Color _getConsultationColor(ConsultationType type) {
    switch (type) {
      case ConsultationType.call:
        return AppColors.primary;
      case ConsultationType.video:
        return Colors.purple;
      case ConsultationType.chat:
        return AppColors.success;
    }
  }

  void _consultAgain(ConsultationHistory consultation) {
    // Navigate to astrologer details page
    if (consultation.astrologerId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Astrologer information not available')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AstrologerDetailsScreen(
          astrologerId: consultation.astrologerId,
        ),
      ),
    );
  }

  void _showSearchDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.search, color: AppColors.primary),
            const SizedBox(width: 8),
            const Text('Search Consultations'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _searchController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: _isAstrologer
                    ? 'Search by client name, phone, or email'
                    : 'Search by astrologer name',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                          Navigator.pop(context);
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (value) {
                // Update UI in dialog
                (context as Element).markNeedsBuild();
              },
            ),
            if (_searchQuery.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    'Current filter: ',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                  ),
                  Chip(
                    label: Text(_searchQuery),
                    onDeleted: () {
                      _searchController.clear();
                      setState(() {
                        _searchQuery = '';
                      });
                      Navigator.pop(context);
                    },
                    deleteIcon: const Icon(Icons.close, size: 16),
                  ),
                ],
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              _searchController.clear();
              setState(() {
                _searchQuery = '';
              });
              Navigator.pop(context);
            },
            child: const Text('Clear'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _searchQuery = _searchController.text.trim();
              });
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
            ),
            child: const Text('Search'),
          ),
        ],
      ),
    );
  }
}

