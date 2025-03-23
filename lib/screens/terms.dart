import 'package:flutter/material.dart';

class Terms extends StatelessWidget {
  const Terms({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Terms and Conditions'),
          _buildSectionText('Welcome to True Astrotalk. By accessing or using our service, you agree to be bound by these terms and conditions.'),
          const SizedBox(height: 16),
          _buildSectionTitle('1. Acceptance of Terms'),
          _buildSectionText('By accessing and using True Astrotalk, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with these Terms, please do not use our service.'),
          const SizedBox(height: 16),
          _buildSectionTitle('2. Services Description'),
          _buildSectionText('True Astrotalk provides astrological consultations, horoscope readings, and related services through our platform. The services are provided "as is" and we do not guarantee the accuracy of readings or predictions.'),
          const SizedBox(height: 16),
          _buildSectionTitle('3. User Accounts'),
          _buildSectionText('To access certain features of our service, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.'),
          const SizedBox(height: 16),
          _buildSectionTitle('4. Payment Terms'),
          _buildSectionText('Payment for services is required in advance. All charges are non-refundable unless otherwise specified. We reserve the right to modify our pricing at any time.'),
          const SizedBox(height: 16),
          _buildSectionTitle('5. User Conduct'),
          _buildSectionText('You agree not to use our service for any unlawful purpose or in any way that could damage, disable, or impair our service. You also agree not to attempt to gain unauthorized access to any part of our service.'),
          const SizedBox(height: 16),
          _buildSectionTitle('6. Intellectual Property'),
          _buildSectionText('All content included on the True Astrotalk platform, such as text, graphics, logos, and software, is the property of True Astrotalk or its content suppliers and is protected by copyright laws.'),
          const SizedBox(height: 16),
          _buildSectionTitle('7. Disclaimer of Warranties'),
          _buildSectionText('Our services are provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the reliability, accuracy, or availability of our service.'),
          const SizedBox(height: 16),
          _buildSectionTitle('8. Limitation of Liability'),
          _buildSectionText('True Astrotalk shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our service.'),
          const SizedBox(height: 16),
          _buildSectionTitle('9. Changes to Terms'),
          _buildSectionText('We reserve the right to modify these Terms at any time. Your continued use of our service after any changes indicates your acceptance of the modified Terms.'),
          const SizedBox(height: 16),
          _buildSectionTitle('10. Governing Law'),
          _buildSectionText('These Terms shall be governed by and construed in accordance with the laws of the relevant jurisdiction, without regard to its conflict of law provisions.'),
          const SizedBox(height: 24),
          _buildSectionText('Last updated: March 7, 2025'),
          const SizedBox(height: 40),
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
          fontSize: 18,
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
}
