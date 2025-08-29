import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/utils/error_handler.dart';
import '../services/api/user_api_service.dart';
import '../services/auth/auth_service.dart';
import '../services/service_locator.dart';

enum ConsultationStatus { active, completed, upcoming, cancelled }
enum ConsultationType { chat, voiceCall, videoCall }

class ConsultationItem {
  final String id;
  final String clientName;
  final String clientImage;
  final ConsultationType type;
  final ConsultationStatus status;
  final DateTime scheduledTime;
  final Duration duration;
  final double amount;
  final String? notes;
  final double? rating;
  final String? review;

  ConsultationItem({
    required this.id,
    required this.clientName,
    required this.clientImage,
    required this.type,
    required this.status,
    required this.scheduledTime,
    required this.duration,
    required this.amount,
    this.notes,
    this.rating,
    this.review,
  });

  factory ConsultationItem.fromJson(Map<String, dynamic> json) {
    return ConsultationItem(
      id: json['id'] ?? '',
      clientName: json['client_name'] ?? 'Unknown Client',
      clientImage: json['client_image'] ?? '',
      type: _parseConsultationType(json['type']),
      status: _parseConsultationStatus(json['status']),
      scheduledTime: DateTime.tryParse(json['scheduled_time'] ?? '') ?? DateTime.now(),
      duration: Duration(minutes: json['duration_minutes'] ?? 0),
      amount: (json['amount'] ?? 0).toDouble(),
      notes: json['notes'],
      rating: json['rating']?.toDouble(),
      review: json['review'],
    );
  }

  factory ConsultationItem.fromApiJson(Map<String, dynamic> json) {
    return ConsultationItem(
      id: json['id'] ?? json['consultation_id'] ?? '',
      clientName: json['client_name'] ?? 'Unknown Client',
      clientImage: json['client_image'] ?? '',
      type: _parseConsultationType(json['type']),
      status: _parseConsultationStatus(json['status']),
      scheduledTime: DateTime.tryParse(json['scheduled_time'] ?? '') ?? DateTime.now(),
      duration: Duration(minutes: json['duration_minutes'] ?? 0),
      amount: (json['total_amount'] ?? json['amount'] ?? 0).toDouble(),
      notes: json['notes'],
      rating: json['rating']?.toDouble(),
      review: json['review'],
    );
  }

  static ConsultationType _parseConsultationType(String? type) {
    switch (type?.toLowerCase()) {
      case 'chat':
        return ConsultationType.chat;
      case 'voice_call':
      case 'voice':
        return ConsultationType.voiceCall;
      case 'video_call':
      case 'video':
        return ConsultationType.videoCall;
      default:
        return ConsultationType.chat;
    }
  }

  static ConsultationStatus _parseConsultationStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'ongoing':
        return ConsultationStatus.active;
      case 'completed':
      case 'finished':
        return ConsultationStatus.completed;
      case 'upcoming':
      case 'scheduled':
        return ConsultationStatus.upcoming;
      case 'cancelled':
        return ConsultationStatus.cancelled;
      default:
        return ConsultationStatus.completed;
    }
  }
}

class AstrologerConsultationsScreen extends StatefulWidget {
  const AstrologerConsultationsScreen({super.key});

  @override
  State<AstrologerConsultationsScreen> createState() => _AstrologerConsultationsScreenState();
}

class _AstrologerConsultationsScreenState extends State<AstrologerConsultationsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late final AuthService _authService;
  late final UserApiService _userApiService;

  List<ConsultationItem> _allConsultations = [];
  List<ConsultationItem> _activeConsultations = [];
  List<ConsultationItem> _upcomingConsultations = [];
  List<ConsultationItem> _completedConsultations = [];

  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 1;
  // Pagination fields will be added when infinite scrolling is implemented

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();
    _loadConsultations();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadConsultations() async {
    setState(() {
      _isLoading = true;
      _allConsultations.clear();
    });

    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await _userApiService.getAstrologerConsultations(
        token,
        search: _searchQuery.isEmpty ? null : _searchQuery,
        page: _currentPage,
        limit: 20,
      );

      if (response['success'] == true) {
        final consultations = (response['consultations'] as List<dynamic>? ?? [])
            .map((json) => ConsultationItem.fromApiJson(json as Map<String, dynamic>))
            .toList();

        final pagination = response['pagination'] as Map<String, dynamic>? ?? {};
        final statistics = response['statistics'] as Map<String, dynamic>? ?? {};
        debugPrint('Loaded ${consultations.length} consultations with stats: $statistics');
        
        setState(() {
          _allConsultations = consultations;
          _filterConsultations();
        });
        
        // Debug pagination info
        debugPrint('Loaded ${consultations.length} consultations, has more: ${pagination['has_next']}');
      } else {
        throw Exception(response['message'] ?? 'Failed to load consultations');
      }
    } catch (e) {
      final appError = ErrorHandler.handleError(e, context: 'consultation');
      ErrorHandler.logError(appError);
      if (mounted) {
        ErrorHandler.showError(context, appError);
      }
    }

    setState(() {
      _isLoading = false;
    });
  }

  void _filterConsultations() {
    _activeConsultations = _allConsultations
        .where((c) => c.status == ConsultationStatus.active)
        .toList();

    _upcomingConsultations = _allConsultations
        .where((c) => c.status == ConsultationStatus.upcoming)
        .toList();

    _completedConsultations = _allConsultations
        .where((c) => c.status == ConsultationStatus.completed)
        .toList();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      _currentPage = 1;
    });
    
    // Debounce the API call
    Future.delayed(const Duration(milliseconds: 500), () {
      if (_searchQuery == query && mounted) {
        _loadConsultations();
      }
    });
  }

  void _navigateToConsultation(ConsultationItem consultation) {
    switch (consultation.type) {
      case ConsultationType.chat:
        Navigator.pushNamed(context, '/chat', arguments: {
          'sessionId': consultation.id,
          'clientName': consultation.clientName,
          'isAstrologer': true,
        });
        break;
      case ConsultationType.voiceCall:
        Navigator.pushNamed(context, '/call', arguments: {
          'sessionId': consultation.id,
          'clientName': consultation.clientName,
          'callType': 'voice',
          'isAstrologer': true,
        });
        break;
      case ConsultationType.videoCall:
        Navigator.pushNamed(context, '/call', arguments: {
          'sessionId': consultation.id,
          'clientName': consultation.clientName,
          'callType': 'video',
          'isAstrologer': true,
        });
        break;
    }
  }

  // Demo data generation method removed - now using real API data

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Consultations'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadConsultations,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.white,
          labelColor: AppColors.white,
          unselectedLabelColor: AppColors.white.withValues(alpha: 0.7),
          tabs: [
            Tab(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Active'),
                  if (_activeConsultations.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 2),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_activeConsultations.length}',
                        style: const TextStyle(fontSize: 10, color: AppColors.white),
                      ),
                    ),
                ],
              ),
            ),
            Tab(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Upcoming'),
                  if (_upcomingConsultations.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 2),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.warning,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_upcomingConsultations.length}',
                        style: const TextStyle(fontSize: 10, color: AppColors.white),
                      ),
                    ),
                ],
              ),
            ),
            const Tab(text: 'Completed'),
            const Tab(text: 'All'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.white,
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search consultations...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: AppColors.background,
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          
          // Tab content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildConsultationsList(_activeConsultations, ConsultationStatus.active),
                      _buildConsultationsList(_upcomingConsultations, ConsultationStatus.upcoming),
                      _buildConsultationsList(_completedConsultations, ConsultationStatus.completed),
                      _buildConsultationsList(_allConsultations, null),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildConsultationsList(List<ConsultationItem> consultations, ConsultationStatus? filterStatus) {
    if (consultations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _getEmptyStateIcon(filterStatus),
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              _getEmptyStateMessage(filterStatus),
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadConsultations,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: consultations.length,
        itemBuilder: (context, index) {
          return _buildConsultationCard(consultations[index]);
        },
      ),
    );
  }

  Widget _buildConsultationCard(ConsultationItem consultation) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: consultation.clientImage.isEmpty
                      ? Text(
                          consultation.clientName[0].toUpperCase(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        )
                      : ClipOval(
                          child: Image.network(
                            consultation.clientImage,
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Text(consultation.clientName[0].toUpperCase());
                            },
                          ),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        consultation.clientName,
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Row(
                        children: [
                          _buildTypeChip(consultation.type),
                          const SizedBox(width: 8),
                          _buildStatusChip(consultation.status),
                        ],
                      ),
                    ],
                  ),
                ),
                Text(
                  '₹${consultation.amount.toStringAsFixed(0)}',
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Time and duration
            Row(
              children: [
                Icon(Icons.access_time, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  _formatDateTime(consultation.scheduledTime),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(Icons.timer, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${consultation.duration.inMinutes} min',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            
            if (consultation.notes?.isNotEmpty == true) ...[
              const SizedBox(height: 12),
              Text(
                consultation.notes!,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
            
            if (consultation.rating != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  ...List.generate(5, (index) {
                    return Icon(
                      index < consultation.rating!.floor()
                          ? Icons.star
                          : Icons.star_border,
                      color: AppColors.warning,
                      size: 16,
                    );
                  }),
                  const SizedBox(width: 8),
                  Text(
                    consultation.rating!.toStringAsFixed(1),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              if (consultation.review?.isNotEmpty == true) ...[
                const SizedBox(height: 8),
                Text(
                  consultation.review!,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
            
            // Actions
            if (consultation.status == ConsultationStatus.active) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _joinConsultation(consultation),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(_getTypeIcon(consultation.type)),
                          const SizedBox(width: 8),
                          const Text('Join'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: () => _endConsultation(consultation),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                    ),
                    child: const Text('End'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTypeChip(ConsultationType type) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _getTypeColor(type).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _getTypeColor(type).withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getTypeIcon(type),
            size: 12,
            color: _getTypeColor(type),
          ),
          const SizedBox(width: 4),
          Text(
            _getTypeLabel(type),
            style: AppTextStyles.bodySmall.copyWith(
              color: _getTypeColor(type),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(ConsultationStatus status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.3)),
      ),
      child: Text(
        _getStatusLabel(status),
        style: AppTextStyles.bodySmall.copyWith(
          color: _getStatusColor(status),
          fontSize: 10,
        ),
      ),
    );
  }

  Color _getTypeColor(ConsultationType type) {
    switch (type) {
      case ConsultationType.chat:
        return AppColors.primary;
      case ConsultationType.voiceCall:
        return AppColors.success;
      case ConsultationType.videoCall:
        return AppColors.info;
    }
  }

  IconData _getTypeIcon(ConsultationType type) {
    switch (type) {
      case ConsultationType.chat:
        return Icons.chat;
      case ConsultationType.voiceCall:
        return Icons.call;
      case ConsultationType.videoCall:
        return Icons.videocam;
    }
  }

  String _getTypeLabel(ConsultationType type) {
    switch (type) {
      case ConsultationType.chat:
        return 'Chat';
      case ConsultationType.voiceCall:
        return 'Voice';
      case ConsultationType.videoCall:
        return 'Video';
    }
  }

  Color _getStatusColor(ConsultationStatus status) {
    switch (status) {
      case ConsultationStatus.active:
        return AppColors.error;
      case ConsultationStatus.completed:
        return AppColors.success;
      case ConsultationStatus.upcoming:
        return AppColors.warning;
      case ConsultationStatus.cancelled:
        return AppColors.textSecondary;
    }
  }

  String _getStatusLabel(ConsultationStatus status) {
    switch (status) {
      case ConsultationStatus.active:
        return 'Active';
      case ConsultationStatus.completed:
        return 'Completed';
      case ConsultationStatus.upcoming:
        return 'Upcoming';
      case ConsultationStatus.cancelled:
        return 'Cancelled';
    }
  }

  IconData _getEmptyStateIcon(ConsultationStatus? status) {
    switch (status) {
      case ConsultationStatus.active:
        return Icons.chat_bubble_outline;
      case ConsultationStatus.upcoming:
        return Icons.schedule;
      case ConsultationStatus.completed:
        return Icons.check_circle_outline;
      default:
        return Icons.list_alt;
    }
  }

  String _getEmptyStateMessage(ConsultationStatus? status) {
    switch (status) {
      case ConsultationStatus.active:
        return 'No active consultations\nActive sessions will appear here';
      case ConsultationStatus.upcoming:
        return 'No upcoming consultations\nScheduled sessions will appear here';
      case ConsultationStatus.completed:
        return 'No completed consultations\nFinished sessions will appear here';
      default:
        return 'No consultations found\nYour consultation history will appear here';
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays == 0) {
      // Today
      return 'Today ${_formatTime(dateTime)}';
    } else if (difference.inDays == 1) {
      // Yesterday
      return 'Yesterday ${_formatTime(dateTime)}';
    } else if (difference.inDays == -1) {
      // Tomorrow
      return 'Tomorrow ${_formatTime(dateTime)}';
    } else if (difference.inDays > 0) {
      // Past
      return '${difference.inDays} days ago';
    } else {
      // Future
      return 'In ${(-difference.inDays)} days';
    }
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }

  void _joinConsultation(ConsultationItem consultation) async {
    try {
      final token = _authService.authToken;
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final sessionType = consultation.type == ConsultationType.chat ? 'chat' : 
                         consultation.type == ConsultationType.voiceCall ? 'voice_call' : 'video_call';

      final response = await _userApiService.updateConsultation(
        token,
        consultationId: consultation.id,
        action: 'join',
        sessionType: sessionType,
      );

      if (response['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Joining ${_getTypeLabel(consultation.type).toLowerCase()} with ${consultation.clientName}'),
              backgroundColor: AppColors.success,
            ),
          );
        }
        
        // Refresh consultations to show updated status
        _currentPage = 1;
        _loadConsultations();
        
        // Navigate to appropriate consultation screen
        _navigateToConsultation(consultation);
      } else {
        throw Exception(response['message'] ?? 'Failed to join consultation');
      }
    } catch (e) {
      if (mounted) {
        final appError = ErrorHandler.handleError(e, context: 'consultation');
        ErrorHandler.logError(appError);
        ErrorHandler.showError(context, appError);
      }
    }
  }

  void _endConsultation(ConsultationItem consultation) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Consultation'),
        content: Text('Are you sure you want to end the consultation with ${consultation.clientName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              
              // Extract context references before async operations
              final messenger = ScaffoldMessenger.of(context);
              
              try {
                final token = _authService.authToken;
                if (token == null) {
                  throw Exception('Authentication token not found');
                }

                final sessionType = consultation.type == ConsultationType.chat ? 'chat' : 
                                   consultation.type == ConsultationType.voiceCall ? 'voice_call' : 'video_call';

                final response = await _userApiService.updateConsultation(
                  token,
                  consultationId: consultation.id,
                  action: 'end',
                  sessionType: sessionType,
                );

                if (response['success'] == true) {
                  if (mounted) {
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('Consultation ended successfully'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                  
                  // Refresh consultations to show updated status
                  _currentPage = 1;
                  _loadConsultations();
                } else {
                  throw Exception(response['message'] ?? 'Failed to end consultation');
                }
              } catch (e) {
                final appError = ErrorHandler.handleError(e, context: 'consultation');
                ErrorHandler.logError(appError);
                if (mounted && appError.userMessage.isNotEmpty) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(appError.userMessage),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              }
            },
            child: const Text('End'),
          ),
        ],
      ),
    );
  }
}