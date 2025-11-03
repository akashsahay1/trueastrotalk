import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  final List<FAQItem> _faqs = [
    FAQItem(
      question: 'How do I start a consultation?',
      answer: 'You can start a consultation by browsing our astrologers, selecting one that matches your needs, and clicking either "Call" or "Chat" button. Make sure you have sufficient wallet balance for the consultation.',
    ),
    FAQItem(
      question: 'How do I add money to my wallet?',
      answer: 'Go to the Wallet section from the bottom navigation or drawer menu. Click on "Add Money" and choose from the available amounts or enter a custom amount. You can pay using various payment methods.',
    ),
    FAQItem(
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'We have a satisfaction guarantee policy. If you\'re not satisfied with your consultation, please contact our support team within 24 hours and we\'ll review your case for a possible refund.',
    ),
    FAQItem(
      question: 'How are consultation charges calculated?',
      answer: 'Consultation charges are calculated per minute based on the astrologer\'s rate. The timer starts when the astrologer accepts your consultation request and ends when either party disconnects.',
    ),
    FAQItem(
      question: 'What if an astrologer doesn\'t respond?',
      answer: 'If an astrologer doesn\'t respond within 2 minutes, the consultation request will be automatically cancelled and any deducted amount will be refunded to your wallet.',
    ),
    FAQItem(
      question: 'How can I rate an astrologer?',
      answer: 'After completing a consultation, you\'ll be prompted to rate the astrologer. You can also access your consultation history and rate astrologers from there.',
    ),
    FAQItem(
      question: 'Is my personal information safe?',
      answer: 'Yes, we take privacy seriously. All consultations are confidential and your personal information is encrypted and securely stored. We never share your data with third parties.',
    ),
    FAQItem(
      question: 'Can I choose my preferred astrologer?',
      answer: 'Absolutely! You can browse through our list of verified astrologers, view their profiles, ratings, and specializations, then choose the one that best fits your needs.',
    ),
  ];

  final List<ContactOption> _contactOptions = [
    ContactOption(
      icon: Icons.email_outlined,
      title: 'Email Support',
      subtitle: 'support@trueastrotalk.com',
      description: 'Get help via email (24-48 hours response)',
    ),
    ContactOption(
      icon: Icons.phone_outlined,
      title: 'Phone Support',
      subtitle: '+91 9876543210',
      description: 'Call us (Mon-Sat, 9 AM - 9 PM)',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text('Help & Support', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHelpHeader(),
            _buildQuickActions(),
            _buildFAQSection(),
            _buildContactSection(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildHelpHeader() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary.withValues(alpha: 0.1), AppColors.primary.withValues(alpha: 0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.help_outline, color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'How can we help you?',
                      style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Find answers to common questions or contact our support team',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildQuickActionCard(
                  icon: Icons.account_balance_wallet_outlined,
                  title: 'Wallet Issues',
                  onTap: () => _showWalletHelp(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickActionCard(
                  icon: Icons.call_outlined,
                  title: 'Call Problems',
                  onTap: () => _showCallHelp(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickActionCard(
                  icon: Icons.chat_outlined,
                  title: 'Chat Issues',
                  onTap: () => _showChatHelp(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.grey200),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFAQSection() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Frequently Asked Questions',
            style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _faqs.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final faq = _faqs[index];
                return ExpansionTile(
                  title: Text(
                    faq.question,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Text(
                        faq.answer,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Contact Support',
            style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _contactOptions.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final option = _contactOptions[index];
                return ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(option.icon, color: AppColors.primary, size: 20),
                  ),
                  title: Text(
                    option.title,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 2),
                      Text(
                        option.subtitle,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        option.description,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () => _handleContactOption(option),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showWalletHelp() {
    _showHelpDialog(
      'Wallet Help',
      'Common wallet issues:\n\n• Money not added: Check your payment method and internet connection\n• Refund not received: Refunds take 3-5 business days\n• Balance not showing: Try refreshing the app or logout/login\n\nFor other issues, contact our support team.',
    );
  }

  void _showCallHelp() {
    _showHelpDialog(
      'Call Help',
      'Common call issues:\n\n• Call not connecting: Check your internet connection and microphone permissions\n• Poor call quality: Switch to a better network or move closer to your router\n• Astrologer not answering: They might be busy, try again later\n\nFor technical issues, contact our support team.',
    );
  }

  void _showChatHelp() {
    _showHelpDialog(
      'Chat Help',
      'Common chat issues:\n\n• Messages not sending: Check your internet connection\n• Chat history not loading: Try refreshing the app\n• Astrologer not responding: They might be with another client\n\nFor other issues, contact our support team.',
    );
  }

  void _showHelpDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleContactOption(ContactOption option) async {
    try {
      Uri? uri;

      if (option.title == 'Email Support') {
        // Open email app with pre-filled email address
        uri = Uri.parse('mailto:${option.subtitle}?subject=Support%20Request');
      } else if (option.title == 'Phone Support') {
        // Open phone app with pre-filled phone number
        uri = Uri.parse('tel:${option.subtitle}');
      }

      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open ${option.title}: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}

class FAQItem {
  final String question;
  final String answer;

  FAQItem({required this.question, required this.answer});
}

class ContactOption {
  final IconData icon;
  final String title;
  final String subtitle;
  final String description;

  ContactOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.description,
  });
}