import 'package:flutter/foundation.dart';
import '../../models/user.dart';
import '../../models/enums.dart';

/// Represents a section of the astrologer profile that needs completion
class ProfileSection {
  final String id;
  final String title;
  final String description;
  final bool isComplete;
  final String routeName;
  final List<String> missingFields;

  const ProfileSection({
    required this.id,
    required this.title,
    required this.description,
    required this.isComplete,
    required this.routeName,
    this.missingFields = const [],
  });

  ProfileSection copyWith({
    String? id,
    String? title,
    String? description,
    bool? isComplete,
    String? routeName,
    List<String>? missingFields,
  }) {
    return ProfileSection(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      isComplete: isComplete ?? this.isComplete,
      routeName: routeName ?? this.routeName,
      missingFields: missingFields ?? this.missingFields,
    );
  }
}

/// Service to track astrologer profile completion status
class ProfileCompletionService extends ChangeNotifier {
  User? _user;

  // Completion status for each section
  bool _isEmailVerified = false;
  bool _isProfessionalInfoComplete = false;
  bool _isRatesComplete = false;
  bool _isBankDetailsComplete = false;
  bool _isAddressComplete = false;

  // Missing fields for each section
  List<String> _emailMissingFields = [];
  List<String> _professionalMissingFields = [];
  List<String> _ratesMissingFields = [];
  List<String> _bankMissingFields = [];
  List<String> _addressMissingFields = [];

  ProfileCompletionService();

  /// Update the service with new user data
  void updateUser(User? user) {
    _user = user;
    if (user != null && user.role == UserRole.astrologer) {
      _calculateCompletion();
    }
    notifyListeners();
  }

  /// Calculate completion status for all sections
  void _calculateCompletion() {
    if (_user == null) return;

    // 1. Email Verification Section
    _emailMissingFields = [];
    if (_user!.email == null || _user!.email!.isEmpty) {
      _emailMissingFields.add('Email address');
    }
    if (_user!.emailVerified != true) {
      _emailMissingFields.add('Email verification');
    }
    _isEmailVerified = _emailMissingFields.isEmpty;

    // 2. Professional Info Section
    _professionalMissingFields = [];
    if (_user!.bio == null || _user!.bio!.isEmpty) {
      _professionalMissingFields.add('Bio/Description');
    }
    if (_user!.experienceYears == null || _user!.experienceYears! <= 0) {
      _professionalMissingFields.add('Experience years');
    }
    if (_user!.skills == null || _user!.skills!.length < 2) {
      _professionalMissingFields.add('Skills (minimum 2)');
    }
    if (_user!.languages == null || _user!.languages!.isEmpty) {
      _professionalMissingFields.add('Languages (minimum 1)');
    }
    _isProfessionalInfoComplete = _professionalMissingFields.isEmpty;

    // 3. Session Rates Section
    _ratesMissingFields = [];
    final hasAnyRate = (_user!.chatRate != null && _user!.chatRate! > 0) ||
        (_user!.callRate != null && _user!.callRate! > 0) ||
        (_user!.videoRate != null && _user!.videoRate! > 0);
    if (!hasAnyRate) {
      _ratesMissingFields.add('At least one service rate');
    }
    _isRatesComplete = _ratesMissingFields.isEmpty;

    // 4. Bank Details Section
    _bankMissingFields = [];
    if (_user!.accountHolderName == null || _user!.accountHolderName!.isEmpty) {
      _bankMissingFields.add('Account holder name');
    }
    if (_user!.accountNumber == null || _user!.accountNumber!.isEmpty) {
      _bankMissingFields.add('Account number');
    }
    if (_user!.bankName == null || _user!.bankName!.isEmpty) {
      _bankMissingFields.add('Bank name');
    }
    if (_user!.ifscCode == null || _user!.ifscCode!.isEmpty) {
      _bankMissingFields.add('IFSC code');
    }
    _isBankDetailsComplete = _bankMissingFields.isEmpty;

    // 5. Address Section (optional but recommended)
    _addressMissingFields = [];
    if (_user!.address == null || _user!.address!.isEmpty) {
      _addressMissingFields.add('Address');
    }
    if (_user!.city == null || _user!.city!.isEmpty) {
      _addressMissingFields.add('City');
    }
    if (_user!.state == null || _user!.state!.isEmpty) {
      _addressMissingFields.add('State');
    }
    _isAddressComplete = _addressMissingFields.isEmpty;
  }

  /// Get overall completion percentage (0-100)
  int get completionPercentage {
    if (_user == null || _user!.role != UserRole.astrologer) return 100;

    // Weight each section
    // Email: 20%, Professional: 30%, Rates: 25%, Bank: 25%
    double percentage = 0;
    if (_isEmailVerified) percentage += 20;
    if (_isProfessionalInfoComplete) percentage += 30;
    if (_isRatesComplete) percentage += 25;
    if (_isBankDetailsComplete) percentage += 25;

    return percentage.round();
  }

  /// Check if profile is complete enough for approval
  bool get isProfileComplete {
    if (_user == null || _user!.role != UserRole.astrologer) return true;

    // Already verified by admin - consider complete
    if (_user!.verificationStatus == VerificationStatus.verified) return true;

    return _isEmailVerified &&
           _isProfessionalInfoComplete &&
           _isRatesComplete &&
           _isBankDetailsComplete;
  }

  /// Check if profile needs completion
  bool get needsProfileCompletion {
    if (_user == null || _user!.role != UserRole.astrologer) return false;

    // Already verified - no need to complete
    if (_user!.verificationStatus == VerificationStatus.verified) return false;

    return !isProfileComplete;
  }

  /// Get list of incomplete sections with details
  List<ProfileSection> get incompleteSections {
    if (_user == null || _user!.role != UserRole.astrologer) return [];

    final sections = <ProfileSection>[];

    if (!_isEmailVerified) {
      sections.add(ProfileSection(
        id: 'email',
        title: 'Email Verification',
        description: 'Verify your email address to receive important notifications',
        isComplete: false,
        routeName: 'editPersonalInfo',
        missingFields: _emailMissingFields,
      ));
    }

    if (!_isProfessionalInfoComplete) {
      sections.add(ProfileSection(
        id: 'professional',
        title: 'Professional Information',
        description: 'Complete your bio, skills, and experience details',
        isComplete: false,
        routeName: 'editProfessionalInfo',
        missingFields: _professionalMissingFields,
      ));
    }

    if (!_isRatesComplete) {
      sections.add(ProfileSection(
        id: 'rates',
        title: 'Session Rates',
        description: 'Set your consultation rates for chat, call, and video',
        isComplete: false,
        routeName: 'editSessionRates',
        missingFields: _ratesMissingFields,
      ));
    }

    if (!_isBankDetailsComplete) {
      sections.add(ProfileSection(
        id: 'bank',
        title: 'Bank Details',
        description: 'Add your bank details to receive payouts',
        isComplete: false,
        routeName: 'editBankDetails',
        missingFields: _bankMissingFields,
      ));
    }

    return sections;
  }

  /// Get all sections with completion status
  List<ProfileSection> get allSections {
    if (_user == null || _user!.role != UserRole.astrologer) return [];

    return [
      ProfileSection(
        id: 'email',
        title: 'Email Verification',
        description: 'Verify your email address',
        isComplete: _isEmailVerified,
        routeName: 'editPersonalInfo',
        missingFields: _emailMissingFields,
      ),
      ProfileSection(
        id: 'professional',
        title: 'Professional Info',
        description: 'Bio, skills, experience',
        isComplete: _isProfessionalInfoComplete,
        routeName: 'editProfessionalInfo',
        missingFields: _professionalMissingFields,
      ),
      ProfileSection(
        id: 'rates',
        title: 'Session Rates',
        description: 'Consultation pricing',
        isComplete: _isRatesComplete,
        routeName: 'editSessionRates',
        missingFields: _ratesMissingFields,
      ),
      ProfileSection(
        id: 'bank',
        title: 'Bank Details',
        description: 'Payout information',
        isComplete: _isBankDetailsComplete,
        routeName: 'editBankDetails',
        missingFields: _bankMissingFields,
      ),
      ProfileSection(
        id: 'address',
        title: 'Address',
        description: 'Location details',
        isComplete: _isAddressComplete,
        routeName: 'editAddress',
        missingFields: _addressMissingFields,
      ),
    ];
  }

  /// Get count of completed sections
  int get completedSectionsCount {
    int count = 0;
    if (_isEmailVerified) count++;
    if (_isProfessionalInfoComplete) count++;
    if (_isRatesComplete) count++;
    if (_isBankDetailsComplete) count++;
    return count;
  }

  /// Get total required sections count (excluding optional address)
  int get totalRequiredSections => 4;

  /// Get all missing fields across all sections
  List<String> get allMissingFields {
    return [
      ..._emailMissingFields,
      ..._professionalMissingFields,
      ..._ratesMissingFields,
      ..._bankMissingFields,
    ];
  }

  /// Get a summary message for the user
  String get summaryMessage {
    if (isProfileComplete) {
      if (_user?.verificationStatus == VerificationStatus.verified) {
        return 'Your profile is verified and complete.';
      }
      return 'Your profile is complete. Waiting for admin approval.';
    }

    final incomplete = incompleteSections;
    if (incomplete.length == 1) {
      return 'Complete your ${incomplete.first.title.toLowerCase()} to get verified.';
    }
    return '${incomplete.length} sections need completion before verification.';
  }

  // Getters for individual section status
  bool get isEmailVerified => _isEmailVerified;
  bool get isProfessionalInfoComplete => _isProfessionalInfoComplete;
  bool get isRatesComplete => _isRatesComplete;
  bool get isBankDetailsComplete => _isBankDetailsComplete;
  bool get isAddressComplete => _isAddressComplete;
}
