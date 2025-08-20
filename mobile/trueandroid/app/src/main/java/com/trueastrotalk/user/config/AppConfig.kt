package com.trueastrotalk.user.config

object AppConfig {
    const val APP_NAME = "True Astrotalk"
    const val APP_VERSION = "1.0.0"
    
    // SharedPreferences Keys
    const val PREFS_NAME = "TrueAstroTalkPrefs"
    const val KEY_FIRST_TIME = "is_first_time"
    const val KEY_ONBOARDING_COMPLETED = "onboarding_completed"
    const val KEY_AUTH_TOKEN = "auth_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_USER_EMAIL = "user_email"
    const val KEY_USER_NAME = "user_name"
    const val KEY_USER_ROLE = "user_role"
    const val KEY_USER_TYPE = "user_type"
    const val KEY_IS_LOGGED_IN = "is_logged_in"
    
    // Timeouts
    const val SPLASH_DURATION = 3000L
    const val API_TIMEOUT = 30000L
    
    // Request Codes
    const val REQUEST_CODE_PERMISSION = 1001
    const val REQUEST_CODE_IMAGE_PICKER = 1002
}