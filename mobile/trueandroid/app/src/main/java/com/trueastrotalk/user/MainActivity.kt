package com.trueastrotalk.user

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import com.trueastrotalk.user.screens.auth.OnboardingActivity
import com.trueastrotalk.user.screens.auth.LoginActivity
import com.trueastrotalk.user.config.AppConfig
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var sharedPreferences: SharedPreferences
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Handle the splash screen transition with loading indicator
        val splashScreen = installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        sharedPreferences = getSharedPreferences(AppConfig.PREFS_NAME, MODE_PRIVATE)
        
        // Keep the splash screen visible with loading animation
        splashScreen.setKeepOnScreenCondition { true }
        
        // Navigate to appropriate screen after splash
        lifecycleScope.launch {
            delay(3000) // Show native splash with loading for 3 seconds
            navigateToNextScreen()
        }
    }
    
    private fun navigateToNextScreen() {
        // Check if this is the first time opening the app
        val isFirstTime = sharedPreferences.getBoolean(AppConfig.KEY_FIRST_TIME, true)
        val onboardingCompleted = sharedPreferences.getBoolean(AppConfig.KEY_ONBOARDING_COMPLETED, false)
        
        val intent = if (isFirstTime || !onboardingCompleted) {
            // First time user or onboarding not completed - show onboarding
            sharedPreferences.edit().putBoolean(AppConfig.KEY_FIRST_TIME, false).apply()
            Intent(this, OnboardingActivity::class.java)
        } else {
            // Returning user - go to login
            Intent(this, LoginActivity::class.java)
        }
        
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}