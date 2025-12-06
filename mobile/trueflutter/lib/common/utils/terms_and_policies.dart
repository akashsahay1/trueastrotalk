import 'package:flutter/material.dart';
import '../themes/app_colors.dart';
import '../themes/text_styles.dart';

class TermsAndPolicies {
  /// Shows Terms & Conditions dialog only
  static void showTermsDialog(BuildContext context) {
    showGeneralDialog(
      context: context,
      pageBuilder: (context, animation, secondaryAnimation) {
        return AlertDialog(
          backgroundColor: AppColors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Center(
            child: Text(
              'Terms of Use',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildParagraph(
                    'Welcome to true Astrotalk, your personal Astro consultation platform. This Agreement sets out the legally binding terms for your use of the Site, usage and membership. This Agreement may be modified by Us from time to time. The access, membership and rights of admissions are reserved.',
                  ),
                  _buildParagraph(
                    'This Terms of Use is published in accordance with the Rule 3 (1) of the Information Technology (Intermediaries Guidelines and Digital Media Ethics Code) Rules, 2021.',
                  ),

                  _buildSectionTitle('General Description'),
                  _buildParagraph(
                    'The Site/App ("We/Site/Us") offers astrological content, reports, data, and consultations through video chat, Call and email (hereinafter referred to as "Content") via the Site and Mobile applications, and other electronic mediums. We provide both "Free Services" and "Paid Services" (collectively referred to as "Services"). To access the Site/App and avail the Services, you are required to register as a member on the Site/App.',
                  ),
                  _buildParagraph('By registering on the Site/App you agree to:'),
                  _buildBulletPoint('Provide current, complete, and accurate information as prompted by the Site/App. Creating a user profile with true Astrotalk involves providing specific information, including your phone number/email for OTP (One-Time Password) verification, which is required to ensure the security and validity of the registration process. Additionally, you may provide your first name, last name, date and time of birth (DOB), birth place etc. Please note that providing your date of birth is optional during the registration process, but may be needed while communicating with Astrologers to compile and calculate horoscope information.'),
                  _buildBulletPoint('Maintain and update the provided information as required, ensuring that it remains current and accurate.'),

                  _buildSectionTitle('USER CONSENT'),
                  _buildParagraph(
                    'By registering, accessing and using the Site/App, you ("Member," "You," "Your") confirm that you understand and unconditionally consent to the Terms of Usage. If you do not agree to the Terms, please do not click the "I AGREE" button. It is advised that you carefully read the Terms of Usage before starting using, registering on, or accessing any content, information, or services on the Site/App.',
                  ),
                  _buildParagraph(
                    'Additionally, by using this Site/App, you give your consent to receive communications from us via SMS/WhatsApp/Email/Call. Your continued use of the Site/App, including any updates or modifications to the Terms of Usage, signifies your acceptance and agreement to be legally bound by these terms till your account is deleted from Site/App. If you have any objection in collecting/processing your personal data, we advise you not to register with our Site.',
                  ),
                  _buildParagraph(
                    'If you want to withdraw this consent or if you have any objection in continuous collection or storage of your personal details, you must discontinue using our Service and delete your account by sending an email from your registered email ID to help@trueAstrotalk.com as we shall not be able to provide you any Service without having your personally identifiable information listed above.',
                  ),

                  _buildSectionTitle('Registration and Eligibility'),
                  _buildParagraph(
                    'By using this Site/App, you confirm that you are over the age of 18 and legally capable of entering into a binding contract under the Indian Contract Act, 1872. We shall not be held responsible for any misuse of the services by minors by misrepresenting the age or any person using the Site/App inappropriately. However, you are allowed to ask questions related to minors in your family as per the terms outlined in this policy.',
                  ),
                  _buildParagraph(
                    'By using this Site/App, you represent and warrant that you have the right, consent, authority, and legal capacity to enter into this Agreement; submit relevant information to us; and that you are not prohibited or prevented by any applicable law for the time being in force or any order or decree or injunction from any court, tribunal or any such competent authority restraining you from entering into this Agreement and the Services thereof.',
                  ),
                  _buildParagraph(
                    'To access the services, you must register as a Member on the Site/App. By doing so, you agree to provide current, accurate, and complete information when filling out the sign-up form. All information you provide and update during your registration is referred to as "Registration Data."',
                  ),
                  _buildParagraph(
                    'You may create an account using your phone number (for OTP verification) or a valid email ID. By creating an account, you represent and warrant that all provided information is accurate and up to date, and you agree to keep it updated. Using another user\'s account information/personal details is strictly prohibited. If any of the provided information is found to be inaccurate, incomplete, or outdated, the Site/App reserves the right to suspend or terminate the account and restrict or refuse access to future services.',
                  ),

                  _buildSectionTitle('FEATURE "CALL WITH ASTROLOGER"'),
                  _buildParagraph(
                    'The Site/App offers a service that allows you to have a conversation with an astrologer via various modes of communication such as Chat, Voice, & Video calling. By agreeing to these Terms of Usage, you provide your unconditional consent to the Site/App to arrange for these communications on your registered mobile number, via any means (including but not limited to chat, SMS, WhatsApp, regular calling, VOIP calling or video calling) even if your number is enrolled in Do Not Disturb (DND) services.',
                  ),

                  _buildSectionTitle('First Free Chat/Call'),
                  _buildBulletPoint('We offer each unique user a first free chat or call, with a maximum duration of 3 minutes. A "unique user," as defined by the Site/App, is an individual whose mobile number or device have not been previously registered with Us or any of its subsidiaries.'),
                  _buildBulletPoint('We reserve the right to withdraw this promotion at any time without giving prior notice or reason to the users.'),

                  _buildSectionTitle('Content/Service'),
                  _buildBulletPoint('Any information provided on or by the Site/App should not be considered as medical, legal, financial or mental health advice.'),
                  _buildBulletPoint('The content available on Site/App does not represent or warrant that any specific medication, treatment, or procedure is safe, suitable, or effective for any User.'),
                  _buildBulletPoint('Site/App does not provide any guarantees regarding the services or advice rendered by third-party service providers, including registered astrologers.'),
                  _buildBulletPoint('Site/App does not guarantee any specific outcomes or results from the services provided.'),
                  _buildBulletPoint('By utilizing Site/App and its services, you agree that any legal remedies or liabilities arising from actions or omissions of other Members shall be limited to claims against the specific party deemed responsible.'),

                  _buildSectionTitle('USER ACCOUNT ACCESS'),
                  _buildParagraph(
                    'The Site/App may access the User\'s account and associated information to ensure the provision of high-quality services and to effectively address customer needs. By using the Site/App, you grant unconditional consent for Site/App, its employees, agents, and other authorized personnel to access their account for these purposes.',
                  ),

                  _buildSectionTitle('BREACH AND TERMINATION'),
                  _buildParagraph(
                    'Site/App reserves the right, at its sole discretion and without prior notice to the User, to modify, discontinue, or alter the services or the User\'s account. Violation of any terms outlined in these Terms of Usage may result in the immediate termination of the User\'s registration and services without any refund.',
                  ),
                  _buildParagraph(
                    'We maintain a zero-tolerance policy towards the use of abusive, offensive, or inappropriate language by Users. If Site/App determines that a User has engaged in such conduct, it reserves the right to take appropriate action, which may include suspension or termination of the User\'s account.',
                  ),

                  _buildSectionTitle('USER OBLIGATION'),
                  _buildParagraph(
                    'All Users are obligated to comply with Site/App\'s Privacy Policy, Terms and Conditions, and any additional guidelines set forth on Site/App. The rights to access and use the services offered by Site/App are strictly personal to the User and may not be transferred to any other party.',
                  ),
                  _buildParagraph('While using the Site/App, the User agrees not to:'),
                  _buildBulletPoint('Post inappropriate, false, misleading, or harmful content'),
                  _buildBulletPoint('Share unauthorized content or infringe intellectual property rights'),
                  _buildBulletPoint('Collect personal information of other members for solicitation'),
                  _buildBulletPoint('Send unsolicited communications or spam'),
                  _buildBulletPoint('Distribute harmful files or viruses'),
                  _buildBulletPoint('Interfere with platform access or attempt unauthorized access'),
                  _buildBulletPoint('Engage in commercial exploitation without consent'),
                  _buildBulletPoint('Transmit objectionable material or encourage illegal conduct'),

                  _buildSectionTitle('Content Policies'),
                  _buildSubSectionTitle('Inappropriate Content'),
                  _buildParagraph(
                    'We do not allow accounts that contain or promote sexual content, profanity, hate speech, violence, terrorist content, or content related to dangerous products. Accounts that violate these policies are subject to immediate deletion without refunds.',
                  ),
                  _buildSubSectionTitle('Black Magic, Witchcraft, Voodoo and Tantrism'),
                  _buildParagraph(
                    'We strictly prohibit users from engaging in or promoting any form of black magic, witchcraft, voodoo, tantrism, or any related occult practices. If it comes to our attention that a user is involved in such activities, we reserve the right to immediately suspend or delete the user\'s account without prior notice.',
                  ),

                  _buildSectionTitle('DELIVERY, CANCELLATION AND REFUND'),
                  _buildSubSectionTitle('Refunds on Wallet Recharges'),
                  _buildParagraph(
                    'Once a member adds funds to their wallet, those funds can only be refunded if the refund request reaches us within 48 hours of the wallet credit and no portion of the credited amount has been used.',
                  ),
                  _buildSubSectionTitle('Refunds of Service Charges'),
                  _buildParagraph(
                    'Refunds will only be considered under specific circumstances such as network issues, consultant communication problems, or inappropriate responses. No refund will be provided for inaccuracies in consultation or if incorrect contact information is provided.',
                  ),

                  _buildSectionTitle('DISCLAIMER/LIMITATION OF LIABILITY'),
                  _buildParagraph(
                    'The Site/App offers services through a verified panel of astrologers. These services are provided on an "as is" basis without any warranty. The Site/App is not responsible for the accuracy of consultations, technical difficulties, or any damages arising from the use of services.',
                  ),
                  _buildParagraph(
                    'Important: The Services offered by the Site/App are for entertainment purposes only. The Site/App is not a suicide helpline. If you are contemplating suicide or in immediate danger, please seek help from a licensed professional immediately.',
                    isImportant: true,
                  ),

                  _buildSectionTitle('INDEMNIFICATION'),
                  _buildParagraph(
                    'The User agrees to indemnify, defend, and hold harmless the Site/App from any and all third-party claims, liabilities, damages, or costs arising from your use of the Services, violation of terms, or infringement of third party rights.',
                  ),

                  _buildSectionTitle('PROPRIETARY RIGHTS TO CONTENT'),
                  _buildParagraph(
                    'You acknowledge that the Content is protected by copyrights, trademarks, service marks, patents, and other proprietary rights. You are not permitted to copy, use, reproduce, distribute, or create derivative works from the Content unless expressly authorized.',
                  ),

                  _buildSectionTitle('GRIEVANCE OFFICER'),
                  _buildParagraph(
                    'For any grievances or complaints, please contact our Grievance Officer at the contact details provided on our website.',
                  ),

                  _buildSectionTitle('UPDATES'),
                  _buildParagraph(
                    'The Site/App may update, amend, or modify these Terms of Usage periodically. It is the User\'s responsibility to review these Terms regularly to ensure compliance with the latest version.',
                  ),

                  _buildSectionTitle('DISPUTE RESOLUTION'),
                  _buildParagraph(
                    'Any dispute arising in operation of the above firm will be settled within Ranchi jurisdiction (Jharkhand High Court).',
                  ),

                  _buildSectionTitle('Contact Us'),
                  _buildParagraph(
                    'For questions or concerns, please email us at help@trueastrotalk.com or contact us at the address - Near DAV Nageswar Public School, Chandaghasi, Ranchi-834010.',
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text(
                'Close',
                style: AppTextStyles.labelLarge.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Shows Privacy Policy dialog only
  static void showPrivacyDialog(BuildContext context) {
    showGeneralDialog(
      context: context,
      pageBuilder: (context, animation, secondaryAnimation) {
        return AlertDialog(
          backgroundColor: AppColors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Center(
            child: Text(
              'Privacy Policy',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildParagraph(
                    'true Astrotalk ("we", "our", "true Astrotalk"), operated by Naamre Services(OPC) Pvt. Ltd., is committed to safeguarding the privacy of its users, including both astrologers and clients, whether registered or not. This Privacy Policy outlines how we collect, use, store, and disclose your information in compliance with applicable data protection laws.',
                  ),

                  _buildSectionTitle('User Consent'),
                  _buildParagraph(
                    'By accessing or using the true Astrotalk platform, you consent to this Privacy Policy. Continued use of the platform indicates your unconditional consent to our practices regarding your personal data. By using this website, you also consent to receive communications from us via WhatsApp and other communication channels.',
                  ),

                  _buildSectionTitle('Information We Collect'),
                  _buildBulletPoint('Personal Data: We collect personal information that you provide when creating an account, including your name, contact number, email, date of birth, gender, and any other details you voluntarily provide.'),
                  _buildBulletPoint('Payment Information: To process transactions, we collect payment details through secure third-party payment gateways.'),
                  _buildBulletPoint('Device Data: We automatically gather technical data, such as IP addresses, browser type, device identifiers, and cookies, to enhance your experience and provide a personalized experience.'),
                  _buildBulletPoint('Usage Data: We may collect data regarding your interactions with our platform, including your preferences, to optimise our services and offerings.'),
                  _buildBulletPoint('Chat History: We may collect the information you share with Astrologers via Chat or Voice & Video channels for internal audit and training purposes.'),

                  _buildSectionTitle('How We Use Your Information'),
                  _buildBulletPoint('Service Delivery: To facilitate consultations, communication between astrologers and clients, and process transactions.'),
                  _buildBulletPoint('Personalization: To customize your experience and recommend relevant content and services.'),
                  _buildBulletPoint('Marketing and Communication: To send promotional offers, newsletters, and updates through email, SMS, and WhatsApp.'),
                  _buildBulletPoint('Customer Support: To respond to your inquiries and provide assistance.'),
                  _buildBulletPoint('Analytics and Improvements: To analyse usage patterns, improve service quality, and develop new features.'),

                  _buildSectionTitle('Data Sharing and Disclosure'),
                  _buildParagraph(
                    'true Astrotalk does not sell or rent your personal data to third parties. However, we may share your data under the following circumstances:',
                  ),
                  _buildBulletPoint('Service Providers: With trusted third-party vendors who assist with business operations, such as payment processors and hosting services.'),
                  _buildBulletPoint('Legal Obligations: When required by law or to protect our rights, privacy, safety, or property.'),
                  _buildBulletPoint('Business Transfers: In the event of mergers, acquisitions, or asset sales, user data may be transferred.'),

                  _buildSectionTitle('Data Security'),
                  _buildParagraph(
                    'We implement industry-standard security measures, such as encryption and access controls, to safeguard your data. Despite our efforts, no system is completely secure, and we cannot guarantee absolute security.',
                  ),

                  _buildSectionTitle('Data Retention'),
                  _buildParagraph(
                    'We retain personal data only for as long as necessary for the purposes outlined in this policy, unless a longer retention period is required by law. Users may request data deletion by following the account deletion instructions within the app.',
                  ),

                  _buildSectionTitle('Your Rights'),
                  _buildParagraph(
                    'Depending on your jurisdiction, you may have rights regarding your personal data, including the right to access, update, or delete your information. You can exercise these rights by contacting us at help@trueastrotalk.com.',
                  ),

                  _buildSectionTitle('Camera, Voice and Microphone Access'),
                  _buildParagraph(
                    'true Astrotalk requires microphone, camera access solely to enable audio, video interactions for voice and video inputs. This access is used only during active sessions and is not stored or shared.',
                  ),

                  _buildSectionTitle('Cookies and Tracking Technologies'),
                  _buildParagraph(
                    'We use cookies and similar technologies to collect data and enhance user experience. Users can manage cookie preferences through browser settings.',
                  ),

                  _buildSectionTitle('Children\'s Privacy'),
                  _buildParagraph(
                    'true Astrotalk services are intended for users aged 18 and above. We do not knowingly collect personal information from minors. If we learn that we have collected data from a child under 18, we will take steps to delete such information promptly.',
                  ),

                  _buildSectionTitle('Changes to This Privacy Policy'),
                  _buildParagraph(
                    'This policy may be updated from time to time to reflect changes in our practices or legal requirements. We encourage periodic review of this policy.',
                  ),

                  _buildSectionTitle('Contact Us'),
                  _buildParagraph(
                    'For questions or concerns about this policy, please email us at help@trueastrotalk.com or contact us at the address - Near DAV Nageswar Public School, Chandaghasi, Ranchi-834010.',
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text(
                'Close',
                style: AppTextStyles.labelLarge.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Shows combined Terms & Policies dialog (for signup screen checkbox)
  static void showDialog(BuildContext context) {
    showGeneralDialog(
      context: context,
      pageBuilder: (context, animation, secondaryAnimation) {
        return AlertDialog(
          backgroundColor: AppColors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Center(
            child: Text(
              'Terms & Policies',
              style: AppTextStyles.heading4.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Terms of Use Section
                  Text(
                    '📜 TERMS OF USE',
                    style: AppTextStyles.labelLarge.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildBulletPoint('By using True Astrotalk, you agree to these terms and conditions.'),
                  _buildBulletPoint('Users must provide accurate and complete information during registration.'),
                  _buildBulletPoint('You are responsible for maintaining the confidentiality of your account.'),
                  _buildBulletPoint('Prohibited activities include: fraudulent transactions, harassment, or misuse of services.'),
                  _buildBulletPoint('We reserve the right to suspend or terminate accounts that violate our terms.'),
                  _buildBulletPoint('All consultations are for entertainment and guidance purposes only.'),
                  const SizedBox(height: 20),

                  // Privacy Policy Section
                  Text(
                    '🔒 PRIVACY POLICY',
                    style: AppTextStyles.labelLarge.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildBulletPoint('We collect personal information to provide and improve our services.'),
                  _buildBulletPoint('Your data is encrypted and stored securely on our servers.'),
                  _buildBulletPoint('We do not sell, rent, or share your personal information with third parties.'),
                  _buildBulletPoint('Payment information is processed through secure, PCI-compliant payment gateways.'),
                  _buildBulletPoint('You can request data deletion or modification by contacting support.'),
                  _buildBulletPoint('We use cookies to enhance your browsing experience.'),
                  const SizedBox(height: 20),

                  // Refund Policy Section
                  Text(
                    '💳 REFUND POLICY',
                    style: AppTextStyles.labelLarge.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildBulletPoint('Wallet recharges can be refunded within 48 hours if unused.'),
                  _buildBulletPoint('Consultation refunds are processed only if the astrologer fails to join the session.'),
                  _buildBulletPoint('Refund requests must be submitted through the app or by contacting support.'),
                  _buildBulletPoint('Processing time: 5-7 business days for wallet refunds.'),
                  _buildBulletPoint('Partial refunds may apply for interrupted sessions (pro-rated basis).'),
                  _buildBulletPoint('No refunds for completed consultations or services already delivered.'),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text(
                'Close',
                style: AppTextStyles.labelLarge.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  static Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        title,
        style: AppTextStyles.labelLarge.copyWith(
          color: AppColors.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  static Widget _buildSubSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 6),
      child: Text(
        title,
        style: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static Widget _buildParagraph(String text, {bool isImportant = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 14,
          height: 1.5,
          color: isImportant ? AppColors.error : AppColors.textPrimary,
          fontWeight: isImportant ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
    );
  }

  static Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '• ',
            style: TextStyle(
              fontSize: 14,
              height: 1.4,
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                height: 1.4,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
