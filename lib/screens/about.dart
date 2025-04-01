import 'package:flutter/material.dart';
import 'package:trueastrotalk/config/colors.dart';

class About extends StatelessWidget {
  const About({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // App Banner
          Container(
            width: double.infinity,
            color: Colors.blue.shade50,
            padding: const EdgeInsets.symmetric(vertical: 30),
            child: Column(
              children: [
                Container(
                  height: 100,
                  width: 100,
                  decoration: BoxDecoration(
                    color: AppColors.accentColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.star,
                    size: 60,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'True Astrotalk',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Version 1.0.0',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),

          // About content
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                _buildSectionTitle('Our Mission'),
                _buildSectionText('At True Astrotalk, our mission is to make authentic astrological guidance accessible to everyone. We strive to connect individuals with experienced astrologers who can provide insights and clarity for life\'s important decisions.'),
                const SizedBox(height: 24),
                _buildSectionTitle('Our Story'),
                _buildSectionText(
                    'True Astrotalk was founded in 2025 with a vision to bridge the gap between people seeking guidance and authentic astrologers. What started as a small platform has now grown into a trusted community of astrologers and users from around the world.\n\nOur journey began when our founder recognized the need for reliable astrological services in the digital age. With dedication and a passion for astrology, we\'ve built a platform that maintains the essence of traditional astrological practices while leveraging modern technology.'),
                const SizedBox(height: 24),
                _buildSectionTitle('What We Offer'),
                _buildSectionText('• Live consultations with verified astrologers\n• Personalized horoscope readings\n• Remedial solutions for various life challenges\n• Expert guidance on career, relationships, health, and more\n• Vedic astrology, numerology, tarot reading, and more'),
                const SizedBox(height: 24),
                _buildSectionTitle('Our Values'),
                _buildSectionText(
                    '• Authenticity: We verify all our astrologers to ensure genuine guidance\n• Accessibility: We make astrological services available to everyone at affordable rates\n• Privacy: We respect your confidentiality and secure your personal information\n• Quality: We maintain high standards in our services and user experience'),
                const SizedBox(height: 24),
                _buildDivider(),
                const SizedBox(height: 24),
                _buildContactInfo(),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.black,
        ),
      ),
    );
  }

  Widget _buildSectionText(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 16,
        height: 1.5,
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 1,
      color: Colors.grey.shade300,
    );
  }

  Widget _buildContactInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Contact Us'),
        const SizedBox(height: 8),
        _buildContactItem(Icons.email, 'contact@trueastrotalk.com'),
        const SizedBox(height: 8),
        _buildContactItem(Icons.phone, '+91 9876543210'),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildContactItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppColors.accentColor,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 16,
            ),
          ),
        ),
      ],
    );
  }
}
