package com.trueastrotalk.user.services.auth

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.identity.BeginSignInRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.SignInClient
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.trueastrotalk.user.R
import com.trueastrotalk.user.config.AppConfig
import com.trueastrotalk.user.models.*
import com.trueastrotalk.user.models.enums.*
import com.trueastrotalk.user.services.api.ApiClient
import com.trueastrotalk.user.services.api.dto.*
import retrofit2.Response
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

class UnifiedAuthService(private val context: Context) {
    
    private val sharedPreferences: SharedPreferences = 
        context.getSharedPreferences(AppConfig.PREFS_NAME, Context.MODE_PRIVATE)
    
    private var currentUser: User? = null
    private var authToken: String? = null
    
    // Google Sign-In clients
    private var googleSignInClient: GoogleSignInClient
    private var oneTapClient: SignInClient
    
    companion object {
        private const val TAG = "UnifiedAuthService"
    }
    
    init {
        // Configure Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(context.getString(R.string.default_web_client_id))
            .requestEmail()
            .requestProfile()
            .build()
        
        googleSignInClient = GoogleSignIn.getClient(context, gso)
        oneTapClient = Identity.getSignInClient(context)
        
        // Initialize auth state
        initializeAuthState()
    }
    
    // Public properties
    val user: User? get() = currentUser
    val token: String? get() = authToken
    val isLoggedIn: Boolean get() = currentUser != null && authToken != null
    
    private fun initializeAuthState() {
        val savedToken = sharedPreferences.getString(AppConfig.KEY_AUTH_TOKEN, null)
        if (savedToken != null) {
            authToken = savedToken
            // Try to load user data from local storage
            loadUserFromPreferences()
        }
    }
    
    // MARK: - Email Authentication
    
    suspend fun signInWithEmailPassword(email: String, password: String): User {
        try {
            Log.d(TAG, "🔐 Starting email sign-in for: $email")
            
            // Make actual API call
            val loginRequest = LoginRequest(
                emailAddress = email,
                password = password,
                authType = "email"
            )
            
            val response = ApiClient.userApiService.loginUser(loginRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                
                // Handle different response formats (matching Flutter logic)
                val responseData = loginResponse.data ?: run {
                    // If no data wrapper, create one from direct fields
                    LoginData(
                        user = loginResponse.user ?: emptyMap(),
                        token = loginResponse.token ?: ""
                    )
                }
                
                val userData = responseData.user
                val token = responseData.token
                
                if (userData.isEmpty() || token.isEmpty()) {
                    throw Exception("Invalid response format from server")
                }
                
                Log.d(TAG, "🔍 Login API Response - User Data received")
                
                // Parse user data
                val user = UserParser.fromJson(userData)
                
                // Check astrologer account status
                if (user.isAstrologer) {
                    Log.d(TAG, "🔍 Astrologer login check - Status: ${user.accountStatus}, Verification: ${user.verificationStatus}")
                    
                    if (user.accountStatus != AccountStatus.ACTIVE) {
                        throw Exception("Your astrologer account is ${user.displayStatus.lowercase()}. Please wait for admin approval.")
                    }
                    
                    if (user.verificationStatus == VerificationStatus.REJECTED) {
                        throw Exception("Your astrologer account verification was rejected. Please contact support.")
                    }
                }
                
                // Save auth data
                saveAuthData(user, token)
                
                Log.d(TAG, "✅ Email sign-in successful for user: ${user.name}")
                return user
                
            } else {
                val errorMessage = parseErrorResponse(response)
                Log.e(TAG, "❌ Login failed: $errorMessage")
                throw Exception(errorMessage)
            }
            
        } catch (e: java.net.ConnectException) {
            Log.e(TAG, "❌ Cannot connect to server: ${e.message}")
            throw Exception("Cannot connect to server at localhost:3000. Please start your Next.js server with 'npm run dev'")
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "❌ Network error: ${e.message}")
            throw Exception("Network error. Please check your internet connection and ensure your server is running at localhost:3000")
        } catch (e: java.security.cert.CertificateException) {
            Log.e(TAG, "❌ SSL Certificate error: ${e.message}")
            throw Exception("SSL certificate error. For development, ensure your server supports HTTP or configure HTTPS properly.")
        } catch (e: javax.net.ssl.SSLException) {
            Log.e(TAG, "❌ SSL error: ${e.message}")
            throw Exception("SSL connection error. For development, ensure your server supports HTTP connections.")
        } catch (e: java.net.UnknownServiceException) {
            Log.e(TAG, "❌ Network security policy error: ${e.message}")
            throw Exception("Network security error. App has been updated to allow HTTP connections for development.")
        } catch (e: Exception) {
            if (e.message?.contains("Login failed:") == true || e.message?.contains("Cannot connect") == true || e.message?.contains("Network error") == true) {
                throw e
            }
            Log.e(TAG, "❌ Email sign-in failed: ${e.message}")
            throw Exception("Login failed: ${e.message}")
        }
    }
    
    // MARK: - Google Authentication
    
    suspend fun signInWithGoogle(activity: AppCompatActivity): User {
        return try {
            Log.d(TAG, "🔐 Starting Google sign-in")
            
            // Try one-tap sign-in first
            val account = tryOneTapSignIn(activity) ?: tryLegacyGoogleSignIn()
            
            account?.let { processGoogleUser(it) } 
                ?: throw Exception("Google Sign-In failed")
            
        } catch (e: GoogleSignUpRequiredException) {
            Log.d(TAG, "🔄 Google user needs to complete signup")
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "❌ Google sign-in failed: ${e.message}")
            throw Exception("Google Sign-In failed: ${e.message}")
        }
    }
    
    private suspend fun tryOneTapSignIn(activity: AppCompatActivity): GoogleSignInAccount? {
        return try {
            val signInRequest = BeginSignInRequest.builder()
                .setGoogleIdTokenRequestOptions(
                    BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
                        .setSupported(true)
                        .setServerClientId(activity.getString(R.string.default_web_client_id))
                        .setFilterByAuthorizedAccounts(false)
                        .build()
                )
                .setAutoSelectEnabled(true)
                .build()
            
            val result = oneTapClient.beginSignIn(signInRequest)
            // This would require activity result handling
            null // For now, fallback to legacy
        } catch (e: Exception) {
            Log.d(TAG, "One-tap sign-in not available, using legacy Google Sign-In")
            null
        }
    }
    
    private suspend fun tryLegacyGoogleSignIn(): GoogleSignInAccount? {
        return try {
            // Check if user is already signed in
            val lastAccount = GoogleSignIn.getLastSignedInAccount(context)
            if (lastAccount != null && !lastAccount.isExpired) {
                Log.d(TAG, "Using existing Google account")
                return lastAccount
            }
            
            // For demo purposes, return null to trigger sign-in intent
            null
        } catch (e: Exception) {
            Log.w(TAG, "Legacy Google sign-in check failed: ${e.message}")
            null
        }
    }
    
    fun getGoogleSignInIntent() = googleSignInClient.signInIntent
    
    suspend fun handleGoogleSignInResult(data: android.content.Intent?): User {
        return try {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            val account = task.getResult(ApiException::class.java)
            processGoogleUser(account)
        } catch (e: GoogleSignUpRequiredException) {
            Log.d(TAG, "🔄 Caught GoogleSignUpRequiredException in handleGoogleSignInResult - rethrowing to LoginActivity")
            throw e
        } catch (e: ApiException) {
            val errorMessage = when (e.statusCode) {
                12501 -> "Sign in was cancelled"
                7 -> "Network error. Please check your connection and try again"
                8 -> "Internal error occurred"
                else -> "Google Sign-In failed: ${e.message}"
            }
            throw Exception(errorMessage)
        }
    }
    
    private suspend fun processGoogleUser(googleAccount: GoogleSignInAccount): User {
        Log.d(TAG, "🔄 Processing Google user: ${googleAccount.email}")
        Log.d(TAG, "🔍 Google Account Details - Name: ${googleAccount.displayName}, Photo: ${googleAccount.photoUrl}")
        Log.d(TAG, "🔍 ID Token available: ${googleAccount.idToken != null}")
        if (googleAccount.idToken != null) {
            Log.d(TAG, "🔍 ID Token (first 50 chars): ${googleAccount.idToken!!.take(50)}...")
        }
        
        val profileImageUrl = googleAccount.photoUrl?.toString()?.let { url ->
            if (url.contains("=s96")) url.replace("=s96", "=s400") else url
        }
        
        try {
            // Make API call to login with Google (match Flutter format exactly)
            val loginRequest = LoginRequest(
                emailAddress = googleAccount.email ?: "",
                authType = "google",
                googleAccessToken = googleAccount.idToken, // Flutter sends ID token as access token
                googlePhotoUrl = profileImageUrl,
                googleDisplayName = googleAccount.displayName
            )
            
            Log.d(TAG, "🌐 Making Google login API request for: ${loginRequest.emailAddress}")
            
            val response = ApiClient.userApiService.loginUser(loginRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                
                // Handle different response formats
                val responseData = loginResponse.data ?: run {
                    LoginData(
                        user = loginResponse.user ?: emptyMap(),
                        token = loginResponse.token ?: ""
                    )
                }
                
                val userData = responseData.user
                val token = responseData.token
                
                if (userData.isEmpty() || token.isEmpty()) {
                    throw Exception("Invalid response format from server")
                }
                
                // Parse user data
                val user = UserParser.fromJson(userData)
                
                // Save auth data
                saveAuthData(user, token)
                
                Log.d(TAG, "✅ Google user logged in: ${user.name}")
                return user
                
            } else {
                val errorMessage = parseErrorResponse(response)
                Log.e(TAG, "❌ Google login API failed: $errorMessage")
                Log.e(TAG, "📋 Response code: ${response.code()}")
                
                // For Google authentication, if user doesn't exist (404), throw signup exception
                // This matches the Flutter logic: any login error = user needs to sign up
                if (response.code() == 404) {
                    Log.d(TAG, "🆕 Google user not found, needs to register: ${googleAccount.email}")
                    
                    // Format name from email or use display name
                    val formattedName = googleAccount.displayName ?: run {
                        val emailName = googleAccount.email?.substringBefore("@") ?: "User"
                        emailName.replace(".", " ")
                            .replace("_", " ")
                            .split(" ")
                            .joinToString(" ") { word ->
                                word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
                            }
                    }
                    
                    Log.d(TAG, "🚀 About to throw GoogleSignUpRequiredException:")
                    Log.d(TAG, "   - Name: $formattedName")
                    Log.d(TAG, "   - Email: ${googleAccount.email}")
                    Log.d(TAG, "   - Has Access Token: ${googleAccount.idToken != null}")
                    
                    throw GoogleSignUpRequiredException(
                        name = formattedName,
                        email = googleAccount.email ?: "",
                        accessToken = googleAccount.idToken ?: ""
                    )
                } else {
                    // Other error - show specific API error message
                    throw Exception("Google authentication failed: $errorMessage")
                }
            }
            
        } catch (e: GoogleSignUpRequiredException) {
            Log.d(TAG, "✅ Caught GoogleSignUpRequiredException in processGoogleUser - rethrowing")
            throw e
        } catch (e: java.net.ConnectException) {
            Log.e(TAG, "❌ Cannot connect to server: ${e.message}")
            throw Exception("Cannot connect to server at localhost:3000. Please start your Next.js server with 'npm run dev'")
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "❌ Network error: ${e.message}")
            throw Exception("Network error. Please check your internet connection and ensure your server is running at localhost:3000")
        } catch (e: java.security.cert.CertificateException) {
            Log.e(TAG, "❌ SSL Certificate error: ${e.message}")
            throw Exception("SSL certificate error. For development, ensure your server supports HTTP or configure HTTPS properly.")
        } catch (e: javax.net.ssl.SSLException) {
            Log.e(TAG, "❌ SSL error: ${e.message}")
            throw Exception("SSL connection error. For development, ensure your server supports HTTP connections.")
        } catch (e: java.net.UnknownServiceException) {
            Log.e(TAG, "❌ Network security policy error: ${e.message}")
            throw Exception("Network security error. App has been updated to allow HTTP connections for development.")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to process Google login: ${e.message}")
            Log.e(TAG, "❌ Exception type: ${e.javaClass.simpleName}")
            throw Exception("Failed to process Google login: ${e.message}")
        }
    }
    
    // MARK: - Registration
    
    suspend fun register(
        name: String,
        email: String,
        phone: String,
        password: String,
        userType: UserType,
        dateOfBirth: Date? = null,
        timeOfBirth: String? = null,
        placeOfBirth: String? = null,
        experience: String? = null,
        bio: String? = null,
        languages: String? = null,
        specializations: String? = null,
        skills: String? = null,
        address: String? = null,
        city: String? = null,
        state: String? = null,
        country: String? = null,
        zip: String? = null,
        callRate: Double? = null,
        chatRate: Double? = null,
        videoRate: Double? = null,
        profileImageUri: Uri? = null
    ): AuthResult {
        return try {
            val user = registerWithEmailPassword(
                name = name,
                email = email,
                password = password,
                phone = phone,
                role = userType.value,
                dateOfBirth = dateOfBirth,
                timeOfBirth = timeOfBirth,
                placeOfBirth = placeOfBirth,
                experience = experience,
                bio = bio,
                languages = languages,
                specializations = specializations,
                skills = skills,
                address = address,
                city = city,
                state = state,
                country = country,
                zip = zip,
                callRate = callRate,
                chatRate = chatRate,
                videoRate = videoRate,
                profileImageUri = profileImageUri
            )
            
            AuthResult.success(message = "Registration successful", user = user)
            
        } catch (e: AstrologerRegistrationSuccessException) {
            AuthResult.success(
                message = "Astrologer registration submitted successfully. Please wait for admin approval.",
                user = e.newUser
            )
        } catch (e: Exception) {
            AuthResult.failure(e.message ?: "Registration failed")
        }
    }
    
    suspend fun registerWithEmailPassword(
        name: String,
        email: String,
        password: String,
        phone: String,
        role: String,
        dateOfBirth: Date? = null,
        timeOfBirth: String? = null,
        placeOfBirth: String? = null,
        authType: String? = null,
        googleAccessToken: String? = null,
        experience: String? = null,
        bio: String? = null,
        languages: String? = null,
        specializations: String? = null,
        skills: String? = null,
        address: String? = null,
        city: String? = null,
        state: String? = null,
        country: String? = null,
        zip: String? = null,
        callRate: Double? = null,
        chatRate: Double? = null,
        videoRate: Double? = null,
        profileImageUri: Uri? = null
    ): User {
        try {
            Log.d(TAG, "📝 Registering user: $email as $role")
            
            // Format date of birth for API
            val dobString = dateOfBirth?.let { 
                SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(it)
            }
            
            // Create registration request
            val registerRequest = RegisterRequest(
                fullName = name,
                emailAddress = email,
                password = password,
                phoneNumber = phone,
                userType = role,
                authType = authType ?: "email",
                dateOfBirth = dobString,
                timeOfBirth = timeOfBirth,
                placeOfBirth = placeOfBirth,
                googleAccessToken = googleAccessToken,
                experienceYears = experience,
                bio = bio,
                languages = languages,
                qualifications = specializations,
                skills = skills,
                address = address,
                city = city,
                state = state,
                country = country,
                zip = zip,
                callRate = callRate,
                chatRate = chatRate,
                videoRate = videoRate
            )
            
            // Make actual API call
            val response = ApiClient.userApiService.registerUser(registerRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val registerResponse = response.body()!!
                
                // Handle different response formats
                val userData = registerResponse.data ?: registerResponse.user
                
                if (userData == null) {
                    throw Exception("Invalid response format from server")
                }
                
                Log.d(TAG, "🔍 Registration API Response - User Data received")
                
                // Parse user data
                val user = UserParser.fromJson(userData)
                
                if (user.role == UserRole.ASTROLOGER) {
                    // Astrologers need admin approval
                    throw AstrologerRegistrationSuccessException(user)
                }
                
                if (user.role == UserRole.CUSTOMER) {
                    // For customers, try to auto-login
                    try {
                        return signInWithEmailPassword(email, password)
                    } catch (loginError: Exception) {
                        Log.w(TAG, "Auto-login after registration failed: ${loginError.message}")
                        return user
                    }
                }
                
                return user
                
            } else {
                val errorMessage = parseErrorResponse(response)
                Log.e(TAG, "❌ Registration failed: $errorMessage")
                throw Exception(errorMessage)
            }
            
        } catch (e: AstrologerRegistrationSuccessException) {
            throw e
        } catch (e: Exception) {
            if (e.message?.contains("Registration failed:") == true) {
                throw e
            }
            Log.e(TAG, "❌ Registration failed: ${e.message}")
            throw Exception("Registration failed: ${e.message}")
        }
    }
    
    suspend fun registerWithGoogle(
        name: String,
        email: String,
        phone: String,
        role: String,
        googleAccessToken: String,
        dateOfBirth: Date? = null,
        timeOfBirth: String? = null,
        placeOfBirth: String? = null,
        bio: String? = null,
        experience: String? = null,
        languages: String? = null,
        specializations: String? = null,
        skills: String? = null,
        address: String? = null,
        city: String? = null,
        state: String? = null,
        country: String? = null,
        zip: String? = null,
        callRate: Double? = null,
        chatRate: Double? = null,
        videoRate: Double? = null,
        profileImageUri: Uri? = null
    ): User {
        return registerWithEmailPassword(
            name = name,
            email = email,
            password = "", // No password for Google users
            phone = phone,
            role = role,
            authType = "google",
            googleAccessToken = googleAccessToken,
            dateOfBirth = dateOfBirth,
            timeOfBirth = timeOfBirth,
            placeOfBirth = placeOfBirth,
            bio = bio,
            experience = experience,
            languages = languages,
            specializations = specializations,
            skills = skills,
            address = address,
            city = city,
            state = state,
            country = country,
            zip = zip,
            callRate = callRate,
            chatRate = chatRate,
            videoRate = videoRate,
            profileImageUri = profileImageUri
        )
    }
    
    // MARK: - User Management
    
    
    
    // MARK: - Session Management
    
    private fun saveAuthData(user: User, token: String) {
        currentUser = user
        authToken = token
        
        sharedPreferences.edit()
            .putString(AppConfig.KEY_AUTH_TOKEN, token)
            .putString(AppConfig.KEY_USER_ID, user.id)
            .putString(AppConfig.KEY_USER_EMAIL, user.email)
            .putString(AppConfig.KEY_USER_NAME, user.name)
            .putString(AppConfig.KEY_USER_ROLE, user.role.value)
            .putBoolean(AppConfig.KEY_IS_LOGGED_IN, true)
            .apply()
        
        Log.d(TAG, "💾 Auth data saved for user: ${user.name}")
    }
    
    private fun loadUserFromPreferences() {
        val userId = sharedPreferences.getString(AppConfig.KEY_USER_ID, null)
        val userEmail = sharedPreferences.getString(AppConfig.KEY_USER_EMAIL, null)
        val userName = sharedPreferences.getString(AppConfig.KEY_USER_NAME, null)
        val userRole = sharedPreferences.getString(AppConfig.KEY_USER_ROLE, null)
        val isLoggedIn = sharedPreferences.getBoolean(AppConfig.KEY_IS_LOGGED_IN, false)
        
        if (userId != null && userName != null && userRole != null && isLoggedIn) {
            try {
                currentUser = User(
                    id = userId,
                    name = userName,
                    email = userEmail,
                    role = UserRole.fromString(userRole),
                    accountStatus = AccountStatus.ACTIVE, // Default assumption
                    verificationStatus = VerificationStatus.VERIFIED, // Default assumption
                    authType = AuthType.EMAIL, // Default assumption
                    createdAt = Date(),
                    updatedAt = Date()
                )
                Log.d(TAG, "🔄 User loaded from preferences: ${currentUser?.name}")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to load user from preferences: ${e.message}")
                clearAuthData()
            }
        }
    }
    
    suspend fun signOut() {
        try {
            Log.d(TAG, "🚪 Signing out user")
            
            // Sign out from Google
            googleSignInClient.signOut()
            oneTapClient.signOut()
            
            // Clear local data
            clearAuthData()
            
        } catch (e: Exception) {
            Log.w(TAG, "Sign out failed: ${e.message}")
            clearAuthData() // Clear anyway
        }
    }
    
    private fun clearAuthData() {
        currentUser = null
        authToken = null
        
        sharedPreferences.edit()
            .remove(AppConfig.KEY_AUTH_TOKEN)
            .remove(AppConfig.KEY_USER_ID)
            .remove(AppConfig.KEY_USER_EMAIL)
            .remove(AppConfig.KEY_USER_NAME)
            .remove(AppConfig.KEY_USER_ROLE)
            .putBoolean(AppConfig.KEY_IS_LOGGED_IN, false)
            .apply()
        
        Log.d(TAG, "🗑️ Auth data cleared")
    }
    
    // MARK: - Utility Methods
    
    suspend fun getAstrologerOptions(): Map<String, List<String>> {
        return try {
            Log.d(TAG, "🔍 Fetching astrologer options from API")
            
            val response = ApiClient.userApiService.getAstrologerOptions()
            
            if (response.isSuccessful && response.body() != null) {
                val apiResponse = response.body()!!
                apiResponse.data ?: mapOf()
            } else {
                Log.w(TAG, "Failed to fetch astrologer options, using fallback")
                getFallbackAstrologerOptions()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error fetching astrologer options: ${e.message}, using fallback")
            getFallbackAstrologerOptions()
        }
    }
    
    private fun getFallbackAstrologerOptions(): Map<String, List<String>> {
        return mapOf(
            "languages" to listOf(
                "English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", 
                "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "Oriya"
            ),
            "skills" to listOf(
                "Vedic Astrology", "Numerology", "Tarot Reading", "Palmistry", "Vastu Shastra",
                "Face Reading", "Gemology", "Horary Astrology", "KP Astrology", "Lal Kitab",
                "Nadi Astrology", "Western Astrology", "Chinese Astrology", "Prashna Astrology"
            )
        )
    }
    
    // MARK: - Error Handling
    
    private fun parseErrorResponse(response: Response<*>): String {
        return try {
            val errorBody = response.errorBody()?.string()
            if (errorBody != null) {
                val gson = com.google.gson.Gson()
                val errorResponse = gson.fromJson(errorBody, ErrorResponse::class.java)
                errorResponse.message
            } else {
                "Login failed: ${response.code()} ${response.message()}"
            }
        } catch (e: Exception) {
            "Login failed: ${response.code()} ${response.message()}"
        }
    }
    
    // Helper properties for UI
    val needsProfileCompletion: Boolean
        get() = currentUser?.role == UserRole.ASTROLOGER && currentUser?.accountStatus == AccountStatus.PROFILE_INCOMPLETE
    
    val isAstrologerVerified: Boolean
        get() = currentUser?.role == UserRole.ASTROLOGER && 
                currentUser?.accountStatus == AccountStatus.ACTIVE && 
                currentUser?.verificationStatus == VerificationStatus.VERIFIED
    
    val userDisplayName: String get() = currentUser?.name ?: "User"
    val userRoleDisplay: String get() = currentUser?.displayRole ?: "User"
}