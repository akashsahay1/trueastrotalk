class ApiEndpoints {
  // Products endpoints
  static const String products = '/products';
  static String productById(String id) => '$products/$id';
  
  // Cart endpoints
  static const String cart = '/cart';
  
  // Orders endpoints
  static const String orders = '/orders';
  static String orderById(String id) => '$orders/$id';
  
  // Addresses endpoints
  static const String addresses = '/addresses';
  
  // Chat endpoints
  static const String chat = '/chat';
  static String chatById(String id) => '$chat/$id';
  static const String chatMessages = '/chat/messages';
  
  // Calls endpoints
  static const String calls = '/calls';
  static String callById(String id) => '$calls/$id';
  
  // Sessions endpoints
  static const String sessions = '/sessions';
  static const String updateSessionBilling = '/sessions';
  
  // Notifications endpoints
  static const String pushNotifications = '/notifications/push';
  static const String emailNotifications = '/notifications/email';
  static const String updateFcmToken = '/notifications/fcm-token';
  
  // Socket endpoints
  static const String socket = '/socket';

  // Auth endpoints (for future implementation)
  static const String auth = '/auth';
  static const String customers = '/customers';
  static const String astrologers = '/astrologers';
  static const String consultations = '/consultations';
  static const String wallet = '/wallet';
  static const String upload = '/upload';

  // Auth endpoints
  static const String register = '$auth/register';
  static const String login = '$auth/login';
  static const String verifyOtp = '$auth/verify-otp';
  static const String refreshToken = '$auth/refresh-token';
  static const String logout = '$auth/logout';
  static const String authStatus = '$auth/status';
  static const String googleAuth = '$auth/google';

  // Customer endpoints
  static const String customerProfile = '$customers/profile';
  static const String customerWalletBalance = '$customers/wallet/balance';
  static const String customerWalletRecharge = '$customers/wallet/recharge';
  static const String customerWalletTransactions = '$customers/wallet/transactions';
  static const String customerConsultationsBook = '$customers/consultations/book';
  static const String customerConsultationsHistory = '$customers/consultations/history';

  // Astrologer endpoints
  static const String astrologerProfile = '$astrologers/profile';
  static const String astrologerProfileSubmit = '$astrologers/profile/submit';
  static const String astrologerOnlineStatus = '$astrologers/online-status';
  static const String astrologerWalletBalance = '$astrologers/wallet/balance';
  static const String astrologerWalletEarningsHistory = '$astrologers/wallet/earnings-history';
  static const String astrologerWalletUpiDetails = '$astrologers/wallet/upi-details';
  static const String astrologerConsultationsPending = '$astrologers/consultations/pending';
  static String astrologerConsultationStatus(String id) => '$astrologers/consultations/$id/status';

  // Public discovery endpoints
  static const String astrologersAvailable = '$astrologers/available';
  static String astrologerProfileById(String id) => '$astrologers/$id/profile';
  static const String astrologersSearch = '$astrologers/search';
  static const String categoriesSpecializations = '/categories/specializations';
  static String horoscopeDaily(String sign) => '/horoscope/daily/$sign';

  // Upload endpoints
  static const String uploadProfileImage = '$upload/profile-image';
  static const String uploadCertificate = '$upload/certificate';
  static const String uploadIdentityDocument = '$upload/identity-document';
  static const String uploadSampleVideo = '$upload/sample-video';

  // Admin endpoints
  static const String adminProducts = '/admin/products';
  
  // Public endpoints
  static const String publicAstrologerOptions = '/public/astrologer-options';
}