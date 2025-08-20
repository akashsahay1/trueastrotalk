package com.trueastrotalk.user.models

import com.trueastrotalk.user.models.enums.*
import java.util.*

data class User(
    // Basic user fields
    val id: String,
    val phone: String? = null,
    val email: String? = null,
    val name: String,
    val role: UserRole,
    val accountStatus: AccountStatus,
    val verificationStatus: VerificationStatus,
    val authType: AuthType,
    val createdAt: Date,
    val updatedAt: Date,
    val verifiedAt: Date? = null,
    val verifiedBy: String? = null,
    val rejectionReason: String? = null,
    
    // Customer-specific fields
    val walletBalance: Double? = null,
    val dateOfBirth: Date? = null,
    val timeOfBirth: String? = null,
    val placeOfBirth: String? = null,
    
    // Additional user fields
    val gender: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val country: String? = null,
    val zip: String? = null,
    
    // Astrologer-specific fields
    val isOnline: Boolean? = null,
    val bio: String? = null,
    val profilePicture: String? = null,
    val experienceYears: Int? = null,
    val languages: List<String>? = null,
    val skills: List<String>? = null,
    val qualifications: List<String>? = null,
    val certifications: List<String>? = null,
    
    // Consultation rates for astrologers
    val chatRate: Double? = null,
    val callRate: Double? = null,
    val videoRate: Double? = null,
    
    // Professional details for astrologers
    val education: String? = null,
    val experience: String? = null,
    val sampleVideoUrl: String? = null,
    val certificateUrls: List<String>? = null,
    val identityDocumentUrl: String? = null,
    
    // Payment details for astrologers
    val upiId: String? = null,
    val totalEarnings: Double? = null,
    val pendingPayouts: Double? = null,
    val lastPayoutAt: Date? = null,
    
    // Rating and reviews
    val rating: Double? = null,
    val totalReviews: Int? = null,
    val totalConsultations: Int? = null
) {
    // Helper properties
    val isCustomer: Boolean get() = role == UserRole.CUSTOMER
    val isAstrologer: Boolean get() = role == UserRole.ASTROLOGER
    val isAdmin: Boolean get() = role == UserRole.ADMIN
    val isManager: Boolean get() = role == UserRole.MANAGER
    
    val isEmailVerified: Boolean get() = verificationStatus == VerificationStatus.VERIFIED
    val isPending: Boolean get() = accountStatus == AccountStatus.PENDING
    val isActive: Boolean get() = accountStatus == AccountStatus.ACTIVE
    val isSuspended: Boolean get() = accountStatus == AccountStatus.SUSPENDED
    val isRejected: Boolean get() = accountStatus == AccountStatus.REJECTED
    
    // For astrologers
    val canProvideConsultations: Boolean 
        get() = isAstrologer && isActive && isEmailVerified && (isOnline ?: false)
    
    // For customers
    val canBookConsultations: Boolean
        get() = isCustomer && isActive && isEmailVerified
    
    val displayRole: String get() = role.displayName
    val displayStatus: String get() = accountStatus.displayName
    val displayVerificationStatus: String get() = verificationStatus.displayName
}