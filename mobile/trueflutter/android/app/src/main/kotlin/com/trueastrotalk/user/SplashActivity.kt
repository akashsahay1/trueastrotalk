package com.trueastrotalk.user

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set the splash screen layout with animated loading indicator
        setContentView(R.layout.splash_screen)

        // Navigate to MainActivity after a short delay
        // This allows users to see the splash screen with loading animation
        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish() // Close splash activity

            // Remove transition animation for seamless experience
            overridePendingTransition(0, 0)
        }, 1500) // 1.5 second splash duration
    }

    override fun onBackPressed() {
        // Disable back button on splash screen
    }
}
