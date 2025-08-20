package com.trueastrotalk.user.services.api

import com.trueastrotalk.user.config.ApiConfig
import com.trueastrotalk.user.services.api.dto.*
import retrofit2.Response
import retrofit2.http.*

interface UserApiService {
    
    @POST(ApiConfig.Auth.LOGIN)
    suspend fun loginUser(@Body loginRequest: LoginRequest): Response<LoginResponse>
    
    @POST(ApiConfig.Auth.REGISTER)
    suspend fun registerUser(@Body registerRequest: RegisterRequest): Response<RegisterResponse>
    
    @POST(ApiConfig.Auth.LOGOUT)
    suspend fun logoutUser(@Header("Authorization") token: String): Response<ApiResponse<Nothing>>
    
    @GET(ApiConfig.Public.ASTROLOGER_OPTIONS)
    suspend fun getAstrologerOptions(): Response<ApiResponse<Map<String, List<String>>>>
    
    @GET("auth/status")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<ApiResponse<Map<String, Any>>>
}