import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../models/consultation_history.dart';
import '../services/auth/auth_service.dart';
import '../services/api/user_api_service.dart';
import '../services/service_locator.dart';
import 'astrologer_details.dart';

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
  List<ConsultationHistory> _chatHistory = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3, 
      vsync: this, 
      initialIndex: widget.initialTabIndex ?? 0,
    );
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _loadConsultationHistory();
  }

  Future<void> _loadConsultationHistory() async {
    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('No access token available');
      }

      final historyData = await _userApiService.getConsultationHistory(token);
      final consultations = (historyData['consultations'] as List<dynamic>?)
          ?.map((json) => ConsultationHistory.fromJson(json))
          .toList() ?? [];

      setState(() {
        _allHistory = consultations;
        _callHistory = consultations.where((c) => c.type == ConsultationType.call).toList();
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
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.white,
          labelColor: AppColors.white,
          unselectedLabelColor: AppColors.white.withValues(alpha: 0.7),
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Calls'),
            Tab(text: 'Chats'),
          ],
        ),
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAllHistory(),
                _buildHistory(_callHistory, 'No call consultations yet'),
                _buildHistory(_chatHistory, 'No chat consultations yet'),
              ],
            ),
    );
  }

  Widget _buildAllHistory() {
    final allHistory = List<ConsultationHistory>.from(_allHistory);
    allHistory.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    
    return _buildHistory(allHistory, 'No consultations yet');
  }

  Widget _buildHistory(List<ConsultationHistory> history, String emptyMessage) {
    if (history.isEmpty) {
      return _buildEmptyState(emptyMessage);
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: history.length,
      itemBuilder: (context, index) {
        final consultation = history[index];
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
                    color: consultation.type == ConsultationType.call
                        ? AppColors.primary.withValues(alpha: 0.1)
                        : AppColors.success.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    consultation.type == ConsultationType.call ? Icons.call : Icons.chat,
                    color: consultation.type == ConsultationType.call ? AppColors.primary : AppColors.success,
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
    // Navigate to consultation details
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Viewing details for ${consultation.astrologerName}')),
    );
  }

  void _consultAgain(ConsultationHistory consultation) {
    // Navigate to astrologer details page
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AstrologerDetailsScreen(
          astrologerId: consultation.astrologerId,
        ),
      ),
    );
  }
}

