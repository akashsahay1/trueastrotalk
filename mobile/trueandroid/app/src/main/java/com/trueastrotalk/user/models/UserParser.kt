package com.trueastrotalk.user.models

import android.util.Log
import com.trueastrotalk.user.models.enums.*
import java.text.SimpleDateFormat
import java.util.*

object UserParser {
    
    private const val TAG = "UserParser"
    
    fun fromJson(json: Map<String, Any>): User {
        try {
            Log.d(TAG, "🔍 Parsing user data: ${json.keys.joinToString(", ")}")
            
            return User(
                // Basic user fields
                id = json["id"]?.toString() ?: "",
                phone = json["phone_number"]?.toString(),
                email = json["email_address"]?.toString() ?: json["email"]?.toString(),
                name = json["full_name"]?.toString() ?: json["name"]?.toString() ?: "",
                role = UserRole.fromString(json["user_type"]?.toString() ?: json["role"]?.toString() ?: "customer"),
                accountStatus = AccountStatus.fromString(json["account_status"]?.toString() ?: "active"),
                verificationStatus = parseVerificationStatus(json),
                authType = AuthType.fromString(json["auth_type"]?.toString() ?: "email"),
                createdAt = parseDate(json["created_at"]?.toString()) ?: Date(),
                updatedAt = parseDate(json["updated_at"]?.toString()) ?: Date(),
                verifiedAt = parseDate(json["verified_at"]?.toString()),
                verifiedBy = json["verified_by"]?.toString(),
                rejectionReason = json["rejection_reason"]?.toString(),
                
                // Customer-specific fields
                walletBalance = parseDouble(json["wallet_balance"]),
                dateOfBirth = parseDate(json["date_of_birth"]?.toString()),
                timeOfBirth = json["time_of_birth"]?.toString() ?: json["birth_time"]?.toString(),
                placeOfBirth = json["place_of_birth"]?.toString() ?: json["birth_place"]?.toString(),
                
                // Additional user fields
                gender = json["gender"]?.toString(),
                address = json["address"]?.toString(),
                city = json["city"]?.toString(),
                state = json["state"]?.toString(),
                country = json["country"]?.toString(),
                zip = json["zip"]?.toString(),
                
                // Astrologer-specific fields
                isOnline = parseBool(json["is_online"]),
                bio = json["bio"]?.toString(),
                profilePicture = json["profile_picture"]?.toString() ?: json["profile_image"]?.toString(),
                experienceYears = parseInt(json["experience_years"]),
                languages = parseStringList(json["languages"]),
                skills = parseStringList(json["skills"]),
                qualifications = parseStringList(json["qualifications"]) ?: parseStringList(json["specializations"]),
                certifications = parseStringList(json["certifications"]),
                
                // Consultation rates
                chatRate = parseDouble(json["chat_rate"]),
                callRate = parseDouble(json["call_rate"]),
                videoRate = parseDouble(json["video_rate"]),
                
                // Professional details
                education = json["education"]?.toString(),
                experience = json["experience"]?.toString(),
                sampleVideoUrl = json["sample_video_url"]?.toString(),
                certificateUrls = parseStringList(json["certificate_urls"]),
                identityDocumentUrl = json["identity_document_url"]?.toString(),
                
                // Payment details
                upiId = json["upi_id"]?.toString(),
                totalEarnings = parseDouble(json["total_earnings"]),
                pendingPayouts = parseDouble(json["pending_payouts"]),
                lastPayoutAt = parseDate(json["last_payout_at"]?.toString()),
                
                // Rating and reviews
                rating = parseDouble(json["rating"]),
                totalReviews = parseInt(json["total_reviews"]),
                totalConsultations = parseInt(json["total_consultations"])
            )
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error parsing user data: ${e.message}")
            Log.e(TAG, "📋 JSON data: $json")
            throw e
        }
    }
    
    private fun parseVerificationStatus(json: Map<String, Any>): VerificationStatus {
        // Parse verification_status field
        val explicitStatus = json["verification_status"]?.toString()
        if (!explicitStatus.isNullOrEmpty()) {
            return VerificationStatus.fromString(explicitStatus)
        }
        
        // Default fallback if verification_status is missing
        return VerificationStatus.PENDING
    }
    
    private fun parseDate(dateString: String?): Date? {
        if (dateString.isNullOrEmpty()) return null
        
        return try {
            val formats = listOf(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'", 
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd"
            )
            
            for (format in formats) {
                try {
                    return SimpleDateFormat(format, Locale.getDefault()).parse(dateString)
                } catch (e: Exception) {
                    continue
                }
            }
            null
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse date: $dateString")
            null
        }
    }
    
    private fun parseDouble(value: Any?): Double? {
        return when (value) {
            null -> null
            is Double -> value
            is Int -> value.toDouble()
            is String -> {
                if (value.isEmpty()) null
                else value.toDoubleOrNull()
            }
            else -> null
        }
    }
    
    private fun parseInt(value: Any?): Int? {
        return when (value) {
            null -> null
            is Int -> value
            is Double -> value.toInt()
            is String -> {
                if (value.isEmpty()) null
                else value.toIntOrNull() ?: value.toDoubleOrNull()?.toInt()
            }
            else -> null
        }
    }
    
    private fun parseBool(value: Any?): Boolean? {
        return when (value) {
            null -> null
            is Boolean -> value
            is String -> value.lowercase() == "true" || value == "1"
            is Int -> value == 1
            else -> null
        }
    }
    
    private fun parseStringList(value: Any?): List<String>? {
        return when (value) {
            null -> null
            is List<*> -> {
                value.mapNotNull { it?.toString() }
                    .filter { it.isNotEmpty() }
                    .takeIf { it.isNotEmpty() }
            }
            is String -> {
                if (value.isEmpty()) null
                else value.split(",")
                    .map { it.trim() }
                    .filter { it.isNotEmpty() }
                    .takeIf { it.isNotEmpty() }
            }
            else -> null
        }
    }
}