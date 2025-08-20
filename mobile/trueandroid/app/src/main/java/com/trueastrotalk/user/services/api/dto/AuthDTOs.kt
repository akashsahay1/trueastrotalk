package com.trueastrotalk.user.services.api.dto

import com.google.gson.annotations.SerializedName
import com.trueastrotalk.user.models.User

// Login Request
data class LoginRequest(
    @SerializedName("email_address") val emailAddress: String,
    @SerializedName("password") val password: String? = null,
    @SerializedName("auth_type") val authType: String? = null,
    @SerializedName("google_access_token") val googleAccessToken: String? = null,
    @SerializedName("google_photo_url") val googlePhotoUrl: String? = null,
    @SerializedName("google_display_name") val googleDisplayName: String? = null
)

// Login Response
data class LoginResponse(
    @SerializedName("data") val data: LoginData? = null,
    @SerializedName("user") val user: Map<String, Any>? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("message") val message: String? = null
)

data class LoginData(
    @SerializedName("user") val user: Map<String, Any>,
    @SerializedName("token") val token: String
)

// Register Request
data class RegisterRequest(
    @SerializedName("full_name") val fullName: String,
    @SerializedName("email_address") val emailAddress: String,
    @SerializedName("password") val password: String? = null,
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("user_type") val userType: String,
    @SerializedName("auth_type") val authType: String = "email",
    @SerializedName("date_of_birth") val dateOfBirth: String? = null,
    @SerializedName("time_of_birth") val timeOfBirth: String? = null,
    @SerializedName("place_of_birth") val placeOfBirth: String? = null,
    @SerializedName("google_id_token") val googleIdToken: String? = null,
    @SerializedName("google_access_token") val googleAccessToken: String? = null,
    @SerializedName("experience_years") val experienceYears: String? = null,
    @SerializedName("bio") val bio: String? = null,
    @SerializedName("languages") val languages: String? = null,
    @SerializedName("qualifications") val qualifications: String? = null,
    @SerializedName("skills") val skills: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("city") val city: String? = null,
    @SerializedName("state") val state: String? = null,
    @SerializedName("country") val country: String? = null,
    @SerializedName("zip") val zip: String? = null,
    @SerializedName("call_rate") val callRate: Double? = null,
    @SerializedName("chat_rate") val chatRate: Double? = null,
    @SerializedName("video_rate") val videoRate: Double? = null
)

// Register Response
data class RegisterResponse(
    @SerializedName("data") val data: Map<String, Any>? = null,
    @SerializedName("user") val user: Map<String, Any>? = null,
    @SerializedName("message") val message: String? = null
)

// Generic API Response
data class ApiResponse<T>(
    @SerializedName("data") val data: T? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("error") val error: String? = null,
    @SerializedName("success") val success: Boolean = true
)

// Error Response
data class ErrorResponse(
    @SerializedName("message") val message: String,
    @SerializedName("error") val error: String? = null,
    @SerializedName("errors") val errors: Map<String, List<String>>? = null
)