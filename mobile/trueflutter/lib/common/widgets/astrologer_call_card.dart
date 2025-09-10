import 'package:flutter/material.dart';
import '../themes/app_colors.dart';
import '../../models/astrologer.dart';
import '../../models/enums.dart';

class AstrologerCallCard extends StatelessWidget {
  final Astrologer astrologer;
  final VoidCallback onTap;
  final VoidCallback onStartCall;

  const AstrologerCallCard({
    super.key,
    required this.astrologer,
    required this.onTap,
    required this.onStartCall,
  });

  @override
  Widget build(BuildContext context) {
    print("Hi");
    print(astrologer.verificationStatus);
    print("Hiii");
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Column(
            children: [
              Row(
                children: [
                  // Left section: Profile image and rating
                  Column(
                    children: [
                      // Profile image with golden border (no online indicator here)
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.primary, // Blue color
                            width: 2,
                          ),
                        ),
                        child: _buildAstrologerProfileImage(),
                      ),
                      const SizedBox(height: 12),
                      // Rating with stars
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(
                          5,
                          (index) => Icon(
                            Icons.star,
                            size: 16,
                            color: index < astrologer.rating.round()
                                ? Colors.amber
                                : Colors.grey.shade300,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Orders count
                      Text(
                        '${astrologer.totalConsultations} sessions',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  // Middle section: Astrologer details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Name with verification badge
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                astrologer.fullName,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            // Show badge for all astrologers - blue if verified, grey if not
                            Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: astrologer.verificationStatus == VerificationStatus.verified
                                    ? Colors.blue
                                    : Colors.grey,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Skills (no icon)
                        Text(
                          _truncateTextWithComma(astrologer.skillsText),
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        // Languages and Experience on left, Call button on right (positioned between Experience and Price)
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Languages (no icon)
                                  Text(
                                    _truncateTextWithComma(
                                      astrologer.languagesText,
                                    ),
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w400,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  // Experience (no icon)
                                  Text(
                                    'Exp- ${astrologer.experienceYears} Years',
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Call button positioned between Experience and Price
                            Container(
                              margin: const EdgeInsets.only(top: 15),
                              width: 90,
                              height: 40,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppColors.primary,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(10),
                                  onTap: astrologer.isOnline
                                      ? onStartCall
                                      : null,
                                  child: Container(
                                    alignment: Alignment.center,
                                    child: Text(
                                      'Call',
                                      style: TextStyle(
                                        color: astrologer.isOnline
                                            ? AppColors.primary
                                            : Colors.grey,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        // Price
                        RichText(
                          text: TextSpan(
                            children: [
                              const TextSpan(
                                text: '₹',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.primary,
                                ),
                              ),
                              TextSpan(
                                text: astrologer.callRate.toInt() == 0
                                    ? "FREE"
                                    : "${astrologer.callRate.toInt()}",
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                              ),
                              if (astrologer.callRate.toInt() != 0)
                                const TextSpan(
                                  text: '/min',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.normal,
                                    color: Colors.grey,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
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
    const double imageSize = 70;
    // Check if we have a valid profile image URL
    if (astrologer.profileImage != null &&
        astrologer.profileImage!.isNotEmpty) {
      return ClipOval(
        child: SizedBox(
          width: imageSize,
          height: imageSize,
          child: Image.network(
            astrologer.profileImage!,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Container(
                width: imageSize,
                height: imageSize,
                color: Colors.grey.shade200,
                child: Icon(
                  Icons.person,
                  size: 30,
                  color: Colors.grey.shade400,
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              return Container(
                width: imageSize,
                height: imageSize,
                color: Colors.grey.shade200,
                child: Icon(
                  Icons.person,
                  size: 30,
                  color: Colors.grey.shade400,
                ),
              );
            },
          ),
        ),
      );
    }
    // Fallback to icon if no profile image
    return Container(
      width: imageSize,
      height: imageSize,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        shape: BoxShape.circle,
      ),
      child: Icon(Icons.person, size: 30, color: Colors.grey.shade400),
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
