import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/call.dart';
import '../services/call/call_service.dart';

class CallListScreen extends StatefulWidget {
  const CallListScreen({super.key});

  @override
  State<CallListScreen> createState() => _CallListScreenState();
}

class _CallListScreenState extends State<CallListScreen> {
  final CallService _callService = CallService.instance;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeCall();
  }

  Future<void> _initializeCall() async {
    try {
      await _callService.initialize();
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to initialize calls: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: Text(
          'Call History',
          style: AppTextStyles.heading6.copyWith(color: AppColors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _isLoading 
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            )
          : _buildCallList(),
    );
  }

  Widget _buildCallList() {
    return AnimatedBuilder(
      animation: _callService,
      builder: (context, _) {
        final callSessions = _callService.callSessions;
        
        if (callSessions.isEmpty) {
          return _buildEmptyState();
        }
        
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => _callService.loadCallSessions(),
          child: ListView.builder(
            padding: const EdgeInsets.all(Dimensions.paddingMd),
            itemCount: callSessions.length,
            itemBuilder: (context, index) {
              final session = callSessions[index];
              return _buildCallSessionItem(session);
            },
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.call,
              size: 64,
              color: AppColors.primary.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: Dimensions.spacingXl),
          Text(
            'No Call Sessions Yet',
            style: AppTextStyles.heading5.copyWith(
              color: AppColors.textPrimaryLight,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: Dimensions.spacingMd),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Text(
              'Start a voice or video call with an astrologer to see your call history here.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondaryLight,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: Dimensions.spacingXl),
          ElevatedButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.search, size: 20),
            label: const Text('Find Astrologer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallSessionItem(CallSession session) {
    return Container(
      margin: const EdgeInsets.only(bottom: Dimensions.spacingMd),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusLg),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(Dimensions.paddingMd),
        leading: _buildCallIcon(session),
        title: Text(
          session.astrologer.fullName,
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimaryLight,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  session.callType == CallType.video ? Icons.videocam : Icons.call,
                  size: 16,
                  color: AppColors.textSecondaryLight,
                ),
                const SizedBox(width: 4),
                Text(
                  '${session.callType.displayName} Call',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                _buildStatusChip(session.status),
                const SizedBox(width: 8),
                Text(
                  session.formattedStartTime,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (session.durationMinutes > 0) ...[
              Text(
                session.formattedDuration,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textPrimaryLight,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
            ],
            Text(
              session.formattedTotalAmount,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (session.canJoin) ...[
              const SizedBox(height: 4),
              IconButton(
                onPressed: () => _joinCall(session),
                icon: const Icon(
                  Icons.call,
                  color: AppColors.success,
                  size: 20,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCallIcon(CallSession session) {
    IconData iconData;
    Color backgroundColor;
    
    switch (session.status) {
      case CallStatus.completed:
        iconData = Icons.call_received;
        backgroundColor = AppColors.success;
        break;
      case CallStatus.missed:
        iconData = Icons.call_received;
        backgroundColor = AppColors.error;
        break;
      case CallStatus.cancelled:
        iconData = Icons.call_end;
        backgroundColor = AppColors.warning;
        break;
      case CallStatus.active:
        iconData = Icons.call;
        backgroundColor = AppColors.primary;
        break;
      default:
        iconData = Icons.call_made;
        backgroundColor = AppColors.info;
    }

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: backgroundColor.withValues(alpha: 0.1),
        shape: BoxShape.circle,
        border: Border.all(
          color: backgroundColor.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Icon(
        iconData,
        color: backgroundColor,
        size: 24,
      ),
    );
  }

  Widget _buildStatusChip(CallStatus status) {
    Color backgroundColor;
    Color textColor;
    
    switch (status) {
      case CallStatus.active:
        backgroundColor = AppColors.success.withValues(alpha: 0.1);
        textColor = AppColors.success;
        break;
      case CallStatus.completed:
        backgroundColor = AppColors.info.withValues(alpha: 0.1);
        textColor = AppColors.info;
        break;
      case CallStatus.cancelled:
        backgroundColor = AppColors.warning.withValues(alpha: 0.1);
        textColor = AppColors.warning;
        break;
      case CallStatus.missed:
        backgroundColor = AppColors.error.withValues(alpha: 0.1);
        textColor = AppColors.error;
        break;
      case CallStatus.ringing:
        backgroundColor = AppColors.primary.withValues(alpha: 0.1);
        textColor = AppColors.primary;
        break;
      default:
        backgroundColor = AppColors.grey300.withValues(alpha: 0.1);
        textColor = AppColors.textSecondaryLight;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.displayName.toUpperCase(),
        style: AppTextStyles.bodySmall.copyWith(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  void _joinCall(CallSession session) async {
    try {
      await _callService.joinCall(session.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Joining ${session.callType.displayName.toLowerCase()} call...'),
            backgroundColor: AppColors.success,
          ),
        );
        
        // TODO: Navigate to actual call screen
        // Navigator.of(context).push(
        //   MaterialPageRoute(
        //     builder: (context) => CallScreen(callSession: session),
        //   ),
        // );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to join call: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}