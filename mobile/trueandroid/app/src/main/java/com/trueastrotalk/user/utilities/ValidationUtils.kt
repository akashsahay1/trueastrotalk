package com.trueastrotalk.user.utilities

import android.util.Patterns

object ValidationUtils {
    
    fun isValidEmail(email: String): Boolean {
        return email.isNotEmpty() && Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
    
    fun isValidPassword(password: String): Boolean {
        return password.length >= 6
    }
    
    fun isValidPhoneNumber(phoneNumber: String): Boolean {
        return phoneNumber.isNotEmpty() && phoneNumber.length >= 10
    }
    
    fun isValidName(name: String): Boolean {
        return name.isNotEmpty() && name.length >= 2
    }
    
    fun doPasswordsMatch(password: String, confirmPassword: String): Boolean {
        return password == confirmPassword
    }
    
    fun getEmailError(email: String): String? {
        return when {
            email.isEmpty() -> "Email is required"
            !isValidEmail(email) -> "Please enter a valid email address"
            else -> null
        }
    }
    
    fun getPasswordError(password: String): String? {
        return when {
            password.isEmpty() -> "Password is required"
            !isValidPassword(password) -> "Password must be at least 6 characters"
            else -> null
        }
    }
    
    fun getNameError(name: String): String? {
        return when {
            name.isEmpty() -> "Name is required"
            !isValidName(name) -> "Name must be at least 2 characters"
            else -> null
        }
    }
    
    fun getPhoneNumberError(phoneNumber: String): String? {
        return when {
            phoneNumber.isEmpty() -> "Phone number is required"
            !isValidPhoneNumber(phoneNumber) -> "Please enter a valid phone number"
            else -> null
        }
    }
}