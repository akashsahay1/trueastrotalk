package com.trueastrotalk.user

import android.os.Bundle
import android.view.View
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // The splash screen is now handled by flutter_native_splash package
        // and our custom splash_screen.xml layout via drawable/launch_background.xml
    }

    override fun onPostResume() {
        super.onPostResume()

        // Keep the native splash visible by using the splash drawable
        // flutter_native_splash will handle removal when Flutter is ready
    }
}
