package com.trueastrotalk.user.models.enums

enum class UserRole(val value: String, val displayName: String) {
    CUSTOMER("customer", "Customer"),
    ASTROLOGER("astrologer", "Astrologer"),
    ADMIN("admin", "Administrator"),
    MANAGER("manager", "Manager");

    companion object {
        fun fromString(value: String): UserRole {
            return when (value.lowercase()) {
                "customer" -> CUSTOMER
                "astrologer" -> ASTROLOGER
                "admin" -> ADMIN
                "manager" -> MANAGER
                else -> throw IllegalArgumentException("Invalid user role: $value")
            }
        }
    }
}

enum class AuthType(val value: String, val displayName: String) {
    EMAIL("email", "Email"),
    GOOGLE("google", "Google"),
    PHONE("phone", "Phone"),
    APPLE("apple", "Apple"),
    FACEBOOK("facebook", "Facebook"),
    TWITTER("twitter", "Twitter"),
    OTHER("other", "Other");

    companion object {
        fun fromString(value: String): AuthType {
            return when (value.lowercase()) {
                "email" -> EMAIL
                "google" -> GOOGLE
                "phone" -> PHONE
                "apple" -> APPLE
                "facebook" -> FACEBOOK
                "twitter" -> TWITTER
                else -> OTHER
            }
        }
    }
}

enum class AccountStatus(val value: String, val displayName: String) {
    PENDING("pending", "Pending"),
    PROFILE_INCOMPLETE("profile_incomplete", "Profile Incomplete"),
    SUBMITTED("submitted", "Submitted"),
    VERIFIED("verified", "Verified"),
    ACTIVE("active", "Active"),
    SUSPENDED("suspended", "Suspended"),
    REJECTED("rejected", "Rejected");

    companion object {
        fun fromString(value: String): AccountStatus {
            return when (value.lowercase()) {
                "pending" -> PENDING
                "profile_incomplete" -> PROFILE_INCOMPLETE
                "submitted" -> SUBMITTED
                "verified" -> VERIFIED
                "active" -> ACTIVE
                "suspended" -> SUSPENDED
                "rejected" -> REJECTED
                else -> throw IllegalArgumentException("Invalid account status: $value")
            }
        }
    }
}

enum class VerificationStatus(val value: String, val displayName: String) {
    PENDING("pending", "Pending"),
    VERIFIED("verified", "Verified"),
    REJECTED("rejected", "Rejected"),
    UNVERIFIED("unverified", "Unverified"); // Keep for backward compatibility

    companion object {
        fun fromString(value: String): VerificationStatus {
            return when (value.lowercase()) {
                "pending" -> PENDING
                "verified" -> VERIFIED
                "rejected" -> REJECTED
                "unverified" -> UNVERIFIED
                else -> PENDING // Default to pending instead of throwing
            }
        }
    }
}

enum class UserType(val value: String) {
    CUSTOMER("customer"),
    ASTROLOGER("astrologer");

    companion object {
        fun fromString(value: String): UserType {
            return when (value.lowercase()) {
                "customer" -> CUSTOMER
                "astrologer" -> ASTROLOGER
                else -> throw IllegalArgumentException("Invalid user type: $value")
            }
        }
    }
}