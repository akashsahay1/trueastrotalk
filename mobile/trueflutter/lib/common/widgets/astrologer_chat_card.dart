import 'package:flutter/material.dart';
import '../themes/app_colors.dart';
import '../../models/astrologer.dart';

class AstrologerChatCard extends StatelessWidget {
  final Astrologer astrologer;
  final VoidCallback onTap;
  final VoidCallback onStartChat;

  const AstrologerChatCard({
    super.key,
    required this.astrologer,
    required this.onTap,
    required this.onStartChat,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Astrologer image with online indicator
              Column(
                children: [
                  Stack(
                    children: [
                      _buildAstrologerProfileImage(),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: astrologer.isOnline ? AppColors.success : AppColors.error,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.white, width: 2),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        astrologer.ratingText, 
                        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 16)
                      ),
                      const SizedBox(width: 2),
                      const Icon(Icons.star, color: Colors.amber, size: 20),
                    ],
                  ),
                ],
              ),
              const SizedBox(width: 16),
              // Astrologer details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      astrologer.fullName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.auto_graph, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            _truncateTextWithComma(astrologer.skillsText),
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.language, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            _truncateTextWithComma(astrologer.languagesText),
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.work_outline, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(
                          '${astrologer.experienceYears} years exp',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Chat button with pricing - vertically centered
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 100,
                    height: 40,
                    child: ElevatedButton.icon(
                      onPressed: astrologer.isOnline ? onStartChat : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: astrologer.isOnline ? AppColors.primary : AppColors.grey300,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                        elevation: 0,
                      ),
                      icon: const Icon(
                        Icons.chat,
                        size: 18,
                        color: AppColors.white,
                      ),
                      label: const Text(
                        'Chat',
                        style: TextStyle(
                          color: AppColors.white, 
                          fontWeight: FontWeight.bold, 
                          fontSize: 14
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Pricing below button
                  Text(
                    astrologer.chatRate.toInt() == 0 
                        ? "FREE" 
                        : "₹${astrologer.chatRate.toInt()}/min",
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAstrologerProfileImage() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.network(
        astrologer.profileImage ?? '',
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(
          width: 80,
          height: 80,
          color: AppColors.grey200,
          child: const Icon(Icons.person, color: AppColors.grey400),
        ),
      ),
    );
  }

  String _truncateTextWithComma(String text) {
    List<String> parts = text.split(',').map((e) => e.trim()).toList();
    if (parts.length >= 2) {
      return '${parts[0]}, ${parts[1]}';
    } else if (parts.length == 1) {
      return parts[0];
    } else {
      return '';
    }
  }
}