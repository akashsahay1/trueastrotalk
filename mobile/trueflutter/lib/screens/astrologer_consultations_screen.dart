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
    // Parse UTC time and convert to local timezone
    final parsedTime = DateTime.tryParse(json['scheduled_time'] ?? '');
    final localTime = parsedTime?.toLocal() ?? DateTime.now();

    return ConsultationItem(
      id: json['id'] ?? '',
      clientName: json['client_name'] ?? 'Unknown Client',
      clientImage: json['client_image'] ?? '',
      type: _parseConsultationType(json['type']),
      status: _parseConsultationStatus(json['status']),
      scheduledTime: localTime,
      duration: Duration(minutes: json['duration_minutes'] ?? 0),
      amount: (json['amount'] ?? 0).toDouble(),
      notes: json['notes'],
      rating: json['rating']?.toDouble(),
      review: json['review'],
    );
  }

  factory ConsultationItem.fromApiJson(Map<String, dynamic> json) {
    // Parse UTC time and convert to local timezone
    final parsedTime = DateTime.tryParse(json['scheduled_time'] ?? '');
    final localTime = parsedTime?.toLocal() ?? DateTime.now();

    return ConsultationItem(
      id: json['id'] ?? json['consultation_id'] ?? '',
      clientName: json['client_name'] ?? 'Unknown Client',
      clientImage: json['client_image'] ?? '',
      type: _parseConsultationType(json['type']),
      status: _parseConsultationStatus(json['status']),
      scheduledTime: localTime,
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
        return ConsultationType.voiceCall;
      case 'video_call':
        return ConsultationType.videoCall;
      default:
        throw ArgumentError('Invalid consultation type: $type. Expected: chat, voice_call, or video_call');
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
  late ScrollController _scrollController;

  List<ConsultationItem> _allConsultations = [];
  List<ConsultationItem> _chatConsultations = [];
  List<ConsultationItem> _audioConsultations = [];
  List<ConsultationItem> _videoConsultations = [];

  bool _isLoading = true;
  bool _isLoadingMore = false;
  String _searchQuery = '';
  int _currentPage = 1;
  bool _hasMore = true;
  int _currentTabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _scrollController = ScrollController();
    _authService = getIt<AuthService>();
    _userApiService = getIt<UserApiService>();

    // Listen to tab changes
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        setState(() {
          _currentTabIndex = _tabController.index;
          _currentPage = 1;
          _hasMore = true;
        });
        _loadConsultations();
      }
    });

    // Listen to scroll for pagination
    _scrollController.addListener(_onScroll);

    _loadConsultations();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.9) {
      if (!_isLoadingMore && _hasMore) {
        _loadMoreConsultations();
      }
    }
  }

  String? _getCurrentTypeFilter() {
    switch (_currentTabIndex) {
      case 0:
        return null; // All
      case 1:
        return 'chat';
      case 2:
        return 'voice_call';
      case 3:
        return 'video_call';
      default:
        return null;
    }
  }

  Future<void> _loadConsultations() async {
    setState(() {
      _isLoading = true;
      _currentPage = 1;
      _allConsultations.clear();
      _chatConsultations.clear();
      _audioConsultations.clear();
      _videoConsultations.clear();
    });

    try {
      final response = await _userApiService.getAstrologerConsultations(
        type: _getCurrentTypeFilter(),
        page: _currentPage,
        limit: 20,
      );

      if (response['success'] == true) {
        // API returns data under 'data' key
        final data = response['data'] as Map<String, dynamic>? ?? response;
        final consultations = (data['consultations'] as List<dynamic>? ?? [])
            .map((json) => ConsultationItem.fromApiJson(json as Map<String, dynamic>))
            .toList();

        final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
        final statistics = data['statistics'] as Map<String, dynamic>? ?? {};
        debugPrint('Loaded ${consultations.length} consultations with stats: $statistics');

        setState(() {
          _allConsultations = consultations;
          _filterConsultations();
          _hasMore = pagination['has_next'] == true;
        });

        // Debug pagination info
        debugPrint('Loaded ${consultations.length} consultations, has more: $_hasMore');
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

  Future<void> _loadMoreConsultations() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });

    try {
      final response = await _userApiService.getAstrologerConsultations(
        type: _getCurrentTypeFilter(),
        page: _currentPage,
        limit: 20,
      );

      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>? ?? response;
        final newConsultations = (data['consultations'] as List<dynamic>? ?? [])
            .map((json) => ConsultationItem.fromApiJson(json as Map<String, dynamic>))
            .toList();

        final pagination = data['pagination'] as Map<String, dynamic>? ?? {};

        setState(() {
          _allConsultations.addAll(newConsultations);
          _filterConsultations();
          _hasMore = pagination['has_next'] == true;
        });

        debugPrint('Loaded ${newConsultations.length} more consultations, total: ${_allConsultations.length}');
      }
    } catch (e) {
      setState(() {
        _currentPage--; // Revert page increment on error
      });
      debugPrint('Error loading more consultations: $e');
    }

    setState(() {
      _isLoadingMore = false;
    });
  }

  void _filterConsultations() {
    _chatConsultations = _allConsultations
        .where((c) => c.type == ConsultationType.chat)
        .toList();

    _audioConsultations = _allConsultations
        .where((c) => c.type == ConsultationType.voiceCall)
        .toList();

    _videoConsultations = _allConsultations
        .where((c) => c.type == ConsultationType.videoCall)
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

  void _navigateToConsultationDetails(ConsultationItem consultation) {
    Navigator.pushNamed(
      context,
      '/consultation-details',
      arguments: {
        'consultation': consultation,
        'isAstrologer': true,
      },
    );
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
        automaticallyImplyLeading: false, // This screen is a tab, no back button
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
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Chat'),
            Tab(text: 'Audio'),
            Tab(text: 'Video'),
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
                      _buildConsultationsList(_allConsultations),
                      _buildConsultationsList(_chatConsultations),
                      _buildConsultationsList(_audioConsultations),
                      _buildConsultationsList(_videoConsultations),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildConsultationsList(List<ConsultationItem> consultations) {
    if (consultations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              'No consultations found',
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
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: consultations.length + (_isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == consultations.length) {
            // Loading indicator at the end
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            );
          }
          return _buildConsultationCard(consultations[index]);
        },
      ),
    );
  }

  Widget _buildConsultationCard(ConsultationItem consultation) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _navigateToConsultationDetails(consultation),
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

        // Navigate to consultation details screen
        _navigateToConsultationDetails(consultation);
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