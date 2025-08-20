package com.trueastrotalk.user.utilities

import android.content.Context
import android.util.TypedValue
import android.widget.Toast

/**
 * Extension functions for common operations
 */

// Context extensions
fun Context.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) {
    Toast.makeText(this, message, duration).show()
}

fun Context.dpToPx(dp: Int): Int {
    return TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        dp.toFloat(),
        resources.displayMetrics
    ).toInt()
}

// String extensions
fun String.isValidEmail(): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()
}

fun String.isValidPhone(): Boolean {
    return this.length >= 10 && this.all { it.isDigit() }
}

// Int extensions
fun Int.toDp(context: Context): Int {
    return (this / context.resources.displayMetrics.density).toInt()
}