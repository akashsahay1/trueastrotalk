package com.trueastrotalk.user

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    
    private var showSplash = false
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Check if this is a cold start (new task) or warm start (existing task)
        showSplash = savedInstanceState == null && 
                    (intent.flags and Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT) == 0
        
        if (showSplash) {
            // Set splash theme before calling super.onCreate()
            setTheme(R.style.SplashTheme)
        }
        
        super.onCreate(savedInstanceState)
        
        if (showSplash) {
            // Switch back to normal theme after splash delay
            Handler(Looper.getMainLooper()).postDelayed({
                setTheme(R.style.NormalTheme)
                // Recreate to apply the new theme
                recreate()
            }, 2000) // 2 second splash
        }
    }
}
