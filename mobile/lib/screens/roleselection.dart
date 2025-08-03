import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/app_strings.dart';
import '../../common/constants/dimensions.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingLg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // App Logo
              Container(
                width: Dimensions.iconXxl,
                height: Dimensions.iconXxl,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(Dimensions.radiusLg),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.auto_awesome,
                  size: Dimensions.iconLg,
                  color: AppColors.white,
                ),
              ),

              const SizedBox(height: Dimensions.spacingLg),

              // Welcome Text
              Text(
                AppStrings.welcome,
                style: AppTextStyles.heading3.copyWith(
                  color: AppColors.textPrimaryLight,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: Dimensions.spacingSm),

              Text(
                AppStrings.selectRole,
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: Dimensions.spacingXl),

              // Role Selection Cards
              _buildRoleCard(
                context: context,
                title: AppStrings.customer,
                subtitle: AppStrings.customerDesc,
                icon: Icons.person,
                onTap: () => _onRoleSelected(context, 'customer'),
              ),

              const SizedBox(height: Dimensions.spacingLg),

              _buildRoleCard(
                context: context,
                title: AppStrings.astrologer,
                subtitle: AppStrings.astrologerDesc,
                icon: Icons.auto_awesome,
                onTap: () => _onRoleSelected(context, 'astrologer'),
              ),

              const SizedBox(height: Dimensions.spacingXxl),

              // Footer Text
              Text(
                AppStrings.iam,
                style: AppTextStyles.labelMedium.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(Dimensions.radiusLg),
          border: Border.all(
            color: AppColors.borderLight,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Icon Container
            Container(
              width: Dimensions.iconXl,
              height: Dimensions.iconXl,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(Dimensions.radiusMd),
              ),
              child: Icon(
                icon,
                size: Dimensions.iconLg,
                color: AppColors.primary,
              ),
            ),

            const SizedBox(width: Dimensions.spacingMd),

            // Text Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.heading6.copyWith(
                      color: AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: Dimensions.spacingXs),
                  Text(
                    subtitle,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),

            // Arrow Icon
            Icon(
              Icons.arrow_forward_ios,
              size: Dimensions.iconSm,
              color: AppColors.textSecondaryLight,
            ),
          ],
        ),
      ),
    );
  }

  void _onRoleSelected(BuildContext context, String role) {
    // Save selected role and navigate to appropriate screen
    // For now, just show a snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Selected role: $role'),
        duration: const Duration(seconds: 2),
      ),
    );

    // Navigate to login/registration screen based on role
    if (role == 'customer') {
      // Navigate to customer auth flow
      // Navigator.pushNamed(context, '/customer/auth');
    } else {
      // Navigate to astrologer auth flow
      // Navigator.pushNamed(context, '/astrologer/auth');
    }
  }
}