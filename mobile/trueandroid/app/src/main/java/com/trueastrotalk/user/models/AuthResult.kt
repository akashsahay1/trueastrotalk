package com.trueastrotalk.user.models

data class AuthResult(
    val success: Boolean,
    val message: String? = null,
    val user: User? = null,
    val token: String? = null
) {
    companion object {
        fun success(message: String? = null, user: User? = null, token: String? = null): AuthResult {
            return AuthResult(success = true, message = message, user = user, token = token)
        }

        fun failure(message: String): AuthResult {
            return AuthResult(success = false, message = message)
        }
    }
}

// Custom exceptions for authentication flows
class GoogleSignUpRequiredException(
    val name: String,
    val email: String,
    val accessToken: String
) : Exception("Google user needs to complete signup")

class CustomerExistsException(
    val existingUser: User,
    val token: String
) : Exception("Customer with this email already exists")

class AstrologerExistsException(
    val existingUser: User
) : Exception("Astrologer with this email already exists")

class AstrologerRegistrationSuccessException(
    val newUser: User
) : Exception("Astrologer registration successful - pending verification")