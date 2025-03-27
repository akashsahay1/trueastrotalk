class Environment {
  // App-wide environment settings that can be changed at runtime
  static bool _appInDevMode = true;
  static bool _useRazorpayTestMode = true;

  // Getters and setters for app mode
  static bool get isAppInDevMode => _appInDevMode;
  static set setAppMode(bool isDev) => _appInDevMode = isDev;

  // Getters and setters for Razorpay mode
  static bool get isRazorpayInTestMode => _useRazorpayTestMode;
  static set setRazorpayMode(bool isTest) => _useRazorpayTestMode = isTest;

  // API URLs based on app mode
  static String get baseApiUrl {
    return 'https://www.trueastrotalk.com/api';
  }

  // API URLs based on app mode
  static String get baseUrl {
    return 'https://www.trueastrotalk.com';
  }

  // Razorpay keys based on Razorpay mode (independent of app mode)
  static String get razorpayKeyId {
    return _useRazorpayTestMode ? 'rzp_test_QYSelosncyKgT5' : 'rzp_live_QYSelosncyKgT5';
  }

  // For specific API endpoints
  static String get walletApiUrl => '$baseApiUrl/wallet';
  static String get addMoneyApiUrl => '$walletApiUrl/add-money';
  static String get deductMoneyApiUrl => '$walletApiUrl/deduct';
}
