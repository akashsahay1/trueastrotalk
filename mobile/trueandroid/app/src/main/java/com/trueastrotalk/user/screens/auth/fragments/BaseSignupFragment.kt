package com.trueastrotalk.user.screens.auth.fragments

import androidx.fragment.app.Fragment
import com.trueastrotalk.user.screens.auth.SignupActivity
import com.trueastrotalk.user.screens.auth.SignupData

abstract class BaseSignupFragment : Fragment() {
    
    protected lateinit var signupActivity: SignupActivity
    protected lateinit var signupData: SignupData
    
    override fun onResume() {
        super.onResume()
        signupActivity = requireActivity() as SignupActivity
        signupData = signupActivity.signupData
    }
    
    abstract fun validateForm(): Boolean
    
    protected fun showError(message: String) {
        // Show error using Snackbar or similar
        // Implementation depends on specific UI needs
    }
}