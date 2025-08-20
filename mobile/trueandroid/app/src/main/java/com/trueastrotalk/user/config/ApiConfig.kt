package com.trueastrotalk.user.config

object ApiConfig {
    // Base API URLs - Try actual machine IP if 10.0.2.2 doesn't work
    const val BASE_URL = "https://your-api-domain.com/api/"
    const val BASE_URL_DEV_EMULATOR = "http://10.0.2.2:3000/api/"
    const val BASE_URL_DEV_LOCAL_IP = "http://192.168.1.234:3000/api/"
    
    // Use local IP for now (fallback from emulator IP)
    const val CURRENT_BASE_URL = BASE_URL_DEV_LOCAL_IP
    
    // API Endpoints
    object Auth {
        const val REGISTER = "auth/register"
        const val LOGIN = "auth/login"
        const val VERIFY_OTP = "auth/verify-otp"
        const val REFRESH_TOKEN = "auth/refresh-token"
        const val LOGOUT = "auth/logout"
    }
    
    object Customer {
        const val PROFILE = "customers/profile"
        const val WALLET_BALANCE = "customers/wallet/balance"
        const val WALLET_RECHARGE = "customers/wallet/recharge"
        const val CONSULTATIONS_BOOK = "customers/consultations/book"
    }
    
    object Astrologer {
        const val PROFILE = "astrologers/profile"
        const val SUBMIT_PROFILE = "astrologers/profile/submit"
        const val ONLINE_STATUS = "astrologers/online-status"
        const val WALLET_BALANCE = "astrologers/wallet/balance"
    }
    
    object Public {
        const val AVAILABLE_ASTROLOGERS = "astrologers/available"
        const val ASTROLOGER_DETAIL = "astrologers/%s/profile"
        const val SEARCH_ASTROLOGERS = "astrologers/search"
        const val ASTROLOGER_OPTIONS = "public/astrologer-options"
    }
    
    // Network timeouts
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L
}