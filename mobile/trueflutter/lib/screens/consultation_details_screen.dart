import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import 'astrologer_consultations_screen.dart';

class ConsultationDetailsScreen extends StatelessWidget {
  final ConsultationItem consultation;
  final bool isAstrologer;

  const ConsultationDetailsScreen({
    super.key,
    required this.consultation,
    this.isAstrologer = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Consultation Details'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            _buildHeaderCard(),
            const SizedBox(height: 16),

            // Customer details
            if (isAstrologer) ...[
              _buildSectionCard(
                'Customer Details',
                [
                  _buildDetailRow(Icons.person, 'Name', consultation.clientName),
                  if (consultation.clientImage.isNotEmpty)
                    _buildImageRow(consultation.clientImage),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // Consultation details
            _buildSectionCard(
              'Consultation Details',
              [
                _buildDetailRow(
                  _getTypeIcon(),
                  'Type',
                  _getTypeLabel(),
                ),
                _buildDetailRow(
                  Icons.info_outline,
                  'Status',
                  _getStatusLabel(),
                ),
                _buildDetailRow(
                  Icons.access_time,
                  'Scheduled Time',
                  _formatDateTime(consultation.scheduledTime),
                ),
                _buildDetailRow(
                  Icons.timer,
                  'Duration',
                  '${consultation.duration.inMinutes} minutes',
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Payment details
            _buildSectionCard(
              'Payment Details',
              [
                _buildDetailRow(
                  Icons.currency_rupee,
                  'Total Amount',
                  '₹${consultation.amount.toStringAsFixed(2)}',
                ),
                if (consultation.status == ConsultationStatus.completed) ...[
                  _buildDetailRow(
                    Icons.check_circle,
                    'Payment Status',
                    'Completed',
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),

            // Notes
            if (consultation.notes?.isNotEmpty == true) ...[
              _buildSectionCard(
                'Notes',
                [
                  Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Text(
                      consultation.notes!,
                      style: AppTextStyles.bodyMedium,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // Rating and review
            if (consultation.rating != null) ...[
              _buildSectionCard(
                'Rating & Review',
                [
                  Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            ...List.generate(5, (index) {
                              return Icon(
                                index < consultation.rating!.floor()
                                    ? Icons.star
                                    : Icons.star_border,
                                color: AppColors.warning,
                                size: 24,
                              );
                            }),
                            const SizedBox(width: 8),
                            Text(
                              consultation.rating!.toStringAsFixed(1),
                              style: AppTextStyles.bodyLarge.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        if (consultation.review?.isNotEmpty == true) ...[
                          const SizedBox(height: 12),
                          Text(
                            consultation.review!,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // ID for reference
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                'ID: ${consultation.id}',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: AppColors.white,
            child: consultation.clientImage.isEmpty
                ? Text(
                    consultation.clientName[0].toUpperCase(),
                    style: AppTextStyles.heading2.copyWith(
                      color: AppColors.primary,
                    ),
                  )
                : ClipOval(
                    child: Image.network(
                      consultation.clientImage,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Text(
                          consultation.clientName[0].toUpperCase(),
                          style: AppTextStyles.heading2.copyWith(
                            color: AppColors.primary,
                          ),
                        );
                      },
                    ),
                  ),
          ),
          const SizedBox(height: 12),
          Text(
            consultation.clientName,
            style: AppTextStyles.heading2.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _getStatusColor().withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.white.withValues(alpha: 0.5)),
            ),
            child: Text(
              _getStatusLabel(),
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
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
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              title,
              style: AppTextStyles.bodyLarge.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ),
          const Divider(height: 1),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(width: 12),
          Text(
            '$label:',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageRow(String imageUrl) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(
          imageUrl,
          width: double.infinity,
          height: 200,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              width: double.infinity,
              height: 200,
              color: AppColors.background,
              child: const Icon(Icons.person, size: 64),
            );
          },
        ),
      ),
    );
  }

  IconData _getTypeIcon() {
    switch (consultation.type) {
      case ConsultationType.chat:
        return Icons.chat;
      case ConsultationType.voiceCall:
        return Icons.phone;
      case ConsultationType.videoCall:
        return Icons.videocam;
    }
  }

  String _getTypeLabel() {
    switch (consultation.type) {
      case ConsultationType.chat:
        return 'Chat';
      case ConsultationType.voiceCall:
        return 'Voice Call';
      case ConsultationType.videoCall:
        return 'Video Call';
    }
  }

  String _getStatusLabel() {
    switch (consultation.status) {
      case ConsultationStatus.active:
        return 'Active';
      case ConsultationStatus.upcoming:
        return 'Upcoming';
      case ConsultationStatus.completed:
        return 'Completed';
      case ConsultationStatus.cancelled:
        return 'Cancelled';
    }
  }

  Color _getStatusColor() {
    switch (consultation.status) {
      case ConsultationStatus.active:
        return AppColors.success;
      case ConsultationStatus.upcoming:
        return AppColors.info;
      case ConsultationStatus.completed:
        return AppColors.primary;
      case ConsultationStatus.cancelled:
        return AppColors.error;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      return 'Today ${DateFormat('h:mm a').format(dateTime)}';
    } else if (difference.inDays == 1) {
      return 'Yesterday ${DateFormat('h:mm a').format(dateTime)}';
    } else if (difference.inDays < 7) {
      return DateFormat('EEEE h:mm a').format(dateTime);
    } else {
      return DateFormat('MMM dd, yyyy h:mm a').format(dateTime);
    }
  }
}
