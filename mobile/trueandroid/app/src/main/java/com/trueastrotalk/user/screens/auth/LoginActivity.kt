package com.trueastrotalk.user.screens.auth

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.snackbar.Snackbar
import com.trueastrotalk.user.R
import com.trueastrotalk.user.config.AppConfig
import com.trueastrotalk.user.databinding.ActivityLoginBinding
import com.trueastrotalk.user.models.*
import com.trueastrotalk.user.screens.home.HomeActivity
import com.trueastrotalk.user.services.auth.UnifiedAuthService
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var authService: UnifiedAuthService
    private lateinit var sharedPreferences: SharedPreferences
    private var isLoading = false
    
    // Google Sign-In activity result launcher
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        lifecycleScope.launch {
            try {
                val user = authService.handleGoogleSignInResult(result.data)
                showSuccessMessage("Welcome ${user.name}!")
                navigateBasedOnUserRole(user)
            } catch (e: GoogleSignUpRequiredException) {
                // Navigate to signup with Google data
                android.util.Log.d("LoginActivity", "🎯 Caught GoogleSignUpRequiredException - navigating to signup")
                android.util.Log.d("LoginActivity", "   - Name: ${e.name}")
                android.util.Log.d("LoginActivity", "   - Email: ${e.email}")
                navigateToSignupWithGoogleData(e.name, e.email, e.accessToken)
            } catch (e: Exception) {
                val message = e.message ?: "Google Sign-In failed"
                if (!message.contains("cancelled")) {
                    showErrorMessage("Google Sign-In failed: $message")
                }
            } finally {
                // Always stop loading regardless of success or failure
                setLoading(false)
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        initializeServices()
        
        // Check if user is already logged in
        if (checkExistingSession()) {
            return // Early return, navigation handled in checkExistingSession()
        }
        
        setupUI()
        setupClickListeners()
    }
    
    private fun initializeServices() {
        authService = UnifiedAuthService(this)
        sharedPreferences = getSharedPreferences(AppConfig.PREFS_NAME, MODE_PRIVATE)
    }
    
    private fun checkExistingSession(): Boolean {
        val userName = sharedPreferences.getString(AppConfig.KEY_USER_NAME, null)
        val userRole = sharedPreferences.getString(AppConfig.KEY_USER_ROLE, null)
        val authToken = sharedPreferences.getString(AppConfig.KEY_AUTH_TOKEN, null)
        val isLoggedIn = sharedPreferences.getBoolean(AppConfig.KEY_IS_LOGGED_IN, false)
        
        return if (userName != null && userRole != null && authToken != null && isLoggedIn) {
            android.util.Log.d("LoginActivity", "🔍 Existing session found for: $userName ($userRole)")
            android.util.Log.d("LoginActivity", "🚀 Navigating directly to HomeActivity")
            navigateToHome()
            true
        } else {
            android.util.Log.d("LoginActivity", "❌ No valid session found, showing login screen")
            false
        }
    }
    
    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun setupUI() {
        // Hide loading overlay initially
        binding.loginLoadingOverlay.visibility = View.GONE
    }
    
    private fun setupClickListeners() {
        binding.loginButton.setOnClickListener {
            if (!isLoading) {
                performLogin()
            }
        }
        
        binding.googleSignInButton.setOnClickListener {
            if (!isLoading) {
                performGoogleSignIn()
            }
        }
        
        binding.registerButton.setOnClickListener {
            navigateToRegister()
        }
        
        binding.joinAstrologerText.setOnClickListener {
            navigateToAstrologerSignup()
        }
        
        binding.forgotPasswordText.setOnClickListener {
            navigateToForgotPassword()
        }
        
        binding.termsPrivacyText.setOnClickListener {
            // TODO: Show terms and privacy dialog
            showMessage("Terms and Privacy Policy functionality coming soon")
        }
    }
    
    private fun performLogin() {
        val email = binding.emailEditText.text.toString().trim()
        val password = binding.passwordEditText.text.toString()
        
        // Validate input
        if (!validateInputs(email, password)) {
            return
        }
        
        setLoading(true)
        
        lifecycleScope.launch {
            try {
                val user = authService.signInWithEmailPassword(email, password)
                
                // Show success message
                showSuccessMessage("Login successful!")
                
                // Navigate based on user role
                navigateBasedOnUserRole(user)
                
            } catch (e: Exception) {
                val errorMessage = e.message ?: "Login failed. Please try again."
                showErrorMessage("Login failed: $errorMessage")
            } finally {
                setLoading(false)
            }
        }
    }
    
    private fun performGoogleSignIn() {
        setLoading(true)
        
        // Launch Google Sign-In intent
        val intent = authService.getGoogleSignInIntent()
        googleSignInLauncher.launch(intent)
    }
    
    private fun validateInputs(email: String, password: String): Boolean {
        var isValid = true
        
        // Validate email
        if (email.isEmpty()) {
            binding.emailInputLayout.error = "Email is required"
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.emailInputLayout.error = "Please enter a valid email address"
            isValid = false
        } else {
            binding.emailInputLayout.error = null
        }
        
        // Validate password
        if (password.isEmpty()) {
            binding.passwordInputLayout.error = "Password is required"
            isValid = false
        } else if (password.length < 6) {
            binding.passwordInputLayout.error = "Password must be at least 6 characters"
            isValid = false
        } else {
            binding.passwordInputLayout.error = null
        }
        
        return isValid
    }
    
    private fun setLoading(loading: Boolean) {
        isLoading = loading
        
        binding.loginLoadingOverlay.visibility = if (loading) View.VISIBLE else View.GONE
        binding.loginButton.isEnabled = !loading
        binding.googleSignInButton.isEnabled = !loading
        binding.registerButton.isEnabled = !loading
        
        // Update button text
        if (loading) {
            binding.loginButton.text = "Logging in..."
        } else {
            binding.loginButton.text = "Login"
        }
    }
    
    
    private fun navigateBasedOnUserRole(user: User) {
        // Save user session data
        saveUserSession(user)
        
        // Navigate to HomeActivity for both customer and astrologer
        android.util.Log.d("LoginActivity", "✅ Login successful for ${user.name} (${user.role.value})")
        android.util.Log.d("LoginActivity", "🚀 Navigating to HomeActivity")
        navigateToHome()
    }
    
    private fun saveUserSession(user: User) {
        android.util.Log.d("LoginActivity", "💾 Saving user session data")
        sharedPreferences.edit().apply {
            putString(AppConfig.KEY_USER_NAME, user.name)
            putString(AppConfig.KEY_USER_EMAIL, user.email)
            putString(AppConfig.KEY_USER_ROLE, user.role.value)
            putString(AppConfig.KEY_USER_ID, user.id)
            putBoolean(AppConfig.KEY_IS_LOGGED_IN, true)
            // Note: Auth token should be handled by the authService
            apply()
        }
        android.util.Log.d("LoginActivity", "✅ Session data saved successfully")
    }
    
    private fun navigateToRegister() {
        val intent = Intent(this, SignupActivity::class.java)
        intent.putExtra("isAdvanced", false)
        startActivity(intent)
    }
    
    private fun navigateToSignupWithGoogleData(name: String, email: String, accessToken: String) {
        android.util.Log.d("LoginActivity", "🚀 Starting navigation to SignupActivity with Google data")
        android.util.Log.d("LoginActivity", "   - Name: $name")
        android.util.Log.d("LoginActivity", "   - Email: $email")
        android.util.Log.d("LoginActivity", "   - Auth type: google")
        
        val intent = Intent(this, SignupActivity::class.java)
        intent.putExtra("name", name)
        intent.putExtra("email", email)
        intent.putExtra("google_access_token", accessToken)
        intent.putExtra("auth_type", "google")
        intent.putExtra("isAdvanced", false) // Default to customer signup
        startActivity(intent)
        
        android.util.Log.d("LoginActivity", "✅ Started SignupActivity")
    }
    
    private fun navigateToAstrologerSignup() {
        val intent = Intent(this, SignupActivity::class.java)
        intent.putExtra("isAdvanced", true)
        startActivity(intent)
    }
    
    private fun navigateToForgotPassword() {
        // TODO: Create forgot password screen
        showMessage("Forgot password screen coming soon")
    }
    
    private fun showSuccessMessage(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_SHORT)
            .setBackgroundTint(getColor(R.color.primary))
            .show()
    }
    
    private fun showErrorMessage(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG)
            .setBackgroundTint(getColor(android.R.color.holo_red_dark))
            .show()
    }
    
    private fun showMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}