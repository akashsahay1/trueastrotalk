import 'package:flutter/material.dart';

class Help extends StatefulWidget {
  const Help({super.key});

  @override
  State<Help> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<Help> {
  final List<Map<String, dynamic>> _faqItems = [
    {
      'question': 'How do I book a consultation?',
      'answer': 'To book a consultation, navigate to the home screen and select an astrologer from the list. Click on the call or chat button to initiate a consultation. You will need to have sufficient balance in your account to start the consultation.',
      'isExpanded': false,
    },
    {
      'question': 'How do I add money to my wallet?',
      'answer': 'To add money to your wallet, go to the Profile section from the bottom navigation bar, then select "Wallet". Click on "Add Money" and choose your preferred payment method. Follow the instructions to complete the transaction.',
      'isExpanded': false,
    },
    {
      'question': 'Are the astrologers verified?',
      'answer': 'Yes, all astrologers on our platform are thoroughly verified. We check their credentials, experience, and expertise before onboarding them. We also collect regular feedback from users to maintain quality.',
      'isExpanded': false,
    },
    {
      'question': 'What if I face technical issues?',
      'answer': 'If you face any technical issues during a consultation, please try to reconnect. If the problem persists, contact our customer support through the help section. If any charges were deducted for the interrupted session, we will investigate and provide appropriate compensation.',
      'isExpanded': false,
    },
    {
      'question': 'How do I get a refund?',
      'answer': 'Refund requests are evaluated on a case-by-case basis. Please contact our customer support with details of your consultation and reason for refund. We typically process valid refund requests within 5-7 business days.',
      'isExpanded': false,
    },
    {
      'question': 'How accurate are the predictions?',
      'answer': 'Our astrologers provide insights based on astrological principles and their experience. While they strive for accuracy, predictions should be taken as guidance rather than absolute certainty. Life outcomes also depend on your actions and choices.',
      'isExpanded': false,
    },
    {
      'question': 'Is my personal information secure?',
      'answer': 'Yes, we take your privacy seriously. Your personal information is encrypted and stored securely. We do not share your details with third parties without your consent. Please refer to our Privacy Policy for more information.',
      'isExpanded': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Support Card
            _buildSupportCard(),
            const SizedBox(height: 24),

            // FAQs Section
            const Text(
              'Frequently Asked Questions',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildFaqList(),
            const SizedBox(height: 40),

            // Contact Form
            //_buildContactForm(),
            //const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSupportCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.support_agent,
                    color: Colors.green,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Customer Support',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'We\'re here to help you',
                      style: TextStyle(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Our support team is available to assist you with any questions or issues you might have.',
              style: TextStyle(
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFaqList() {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _faqItems.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12), // Spacing between items
      itemBuilder: (context, index) {
        return Card(
          elevation: 1,
          margin: EdgeInsets.zero,
          child: ExpansionTile(
            title: Text(
              _faqItems[index]['question'],
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 16,
              ),
            ),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _faqItems[index]['answer'],
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.grey.shade700,
                      height: 1.5,
                    ),
                  ),
                ),
              ),
            ],
            onExpansionChanged: (isExpanded) {
              setState(() {
                _faqItems[index]['isExpanded'] = isExpanded;
              });
            },
            initiallyExpanded: _faqItems[index]['isExpanded'],
          ),
        );
      },
    );
  }

//   Widget _buildContactForm() {
//     return Card(
//       elevation: 2,
//       shape: RoundedRectangleBorder(
//         borderRadius: BorderRadius.circular(16),
//       ),
//       child: Padding(
//         padding: const EdgeInsets.all(16.0),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             const Text(
//               'Contact Us',
//               style: TextStyle(
//                 fontSize: 18,
//                 fontWeight: FontWeight.bold,
//               ),
//             ),
//             const SizedBox(height: 16),
//             TextField(
//               decoration: InputDecoration(
//                 labelText: 'Name',
//                 border: OutlineInputBorder(
//                   borderRadius: BorderRadius.circular(8),
//                 ),
//                 prefixIcon: const Icon(Icons.person),
//               ),
//             ),
//             const SizedBox(height: 16),
//             TextField(
//               decoration: InputDecoration(
//                 labelText: 'Email',
//                 border: OutlineInputBorder(
//                   borderRadius: BorderRadius.circular(8),
//                 ),
//                 prefixIcon: const Icon(Icons.email),
//               ),
//             ),
//             const SizedBox(height: 16),
//             TextField(
//               decoration: InputDecoration(
//                 labelText: 'Subject',
//                 border: OutlineInputBorder(
//                   borderRadius: BorderRadius.circular(8),
//                 ),
//                 prefixIcon: const Icon(Icons.subject),
//               ),
//             ),
//             const SizedBox(height: 16),
//             TextField(
//               maxLines: 4,
//               decoration: InputDecoration(
//                 labelText: 'Message',
//                 border: OutlineInputBorder(
//                   borderRadius: BorderRadius.circular(8),
//                 ),
//                 alignLabelWithHint: true,
//               ),
//             ),
//             const SizedBox(height: 24),
//             SizedBox(
//               width: double.infinity,
//               child: ElevatedButton(
//                 onPressed: () {},
//                 style: ElevatedButton.styleFrom(
//                   backgroundColor: Colors.green,
//                   foregroundColor: Colors.white,
//                   padding: const EdgeInsets.symmetric(vertical: 16),
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(8),
//                   ),
//                 ),
//                 child: const Text(
//                   'Submit',
//                   style: TextStyle(fontSize: 16),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
}
