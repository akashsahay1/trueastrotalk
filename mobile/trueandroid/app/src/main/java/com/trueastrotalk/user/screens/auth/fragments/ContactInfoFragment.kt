package com.trueastrotalk.user.screens.auth.fragments

import android.os.Bundle
import android.util.Patterns
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.trueastrotalk.user.databinding.FragmentContactInfoBinding
import com.trueastrotalk.user.screens.auth.SignupData

class ContactInfoFragment : BaseSignupFragment() {
    
    private var _binding: FragmentContactInfoBinding? = null
    private val binding get() = _binding!!
    
    private var isGoogleLogin = false
    
    companion object {
        fun newInstance(signupData: SignupData, isGoogleLogin: Boolean): ContactInfoFragment {
            return ContactInfoFragment().apply {
                this.signupData = signupData
                this.isGoogleLogin = isGoogleLogin
            }
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentContactInfoBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
        loadData()
    }
    
    private fun setupUI() {
        // Setup password visibility toggles
        binding.passwordVisibilityToggle.setOnClickListener {
            val isVisible = binding.passwordEditText.inputType == 
                android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            
            if (isVisible) {
                binding.passwordEditText.inputType = 
                    android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
                binding.passwordVisibilityToggle.setImageResource(android.R.drawable.ic_menu_view)
            } else {
                binding.passwordEditText.inputType = 
                    android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                binding.passwordVisibilityToggle.setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            }
            binding.passwordEditText.setSelection(binding.passwordEditText.length())
        }
        
        binding.confirmPasswordVisibilityToggle.setOnClickListener {
            val isVisible = binding.confirmPasswordEditText.inputType == 
                android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            
            if (isVisible) {
                binding.confirmPasswordEditText.inputType = 
                    android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
                binding.confirmPasswordVisibilityToggle.setImageResource(android.R.drawable.ic_menu_view)
            } else {
                binding.confirmPasswordEditText.inputType = 
                    android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                binding.confirmPasswordVisibilityToggle.setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            }
            binding.confirmPasswordEditText.setSelection(binding.confirmPasswordEditText.length())
        }
        
        // Hide password fields for Google login
        if (isGoogleLogin) {
            binding.emailEditText.isEnabled = false
            binding.emailHint.visibility = View.VISIBLE
            binding.emailHint.text = "From your Google account"
            
            binding.passwordSection.visibility = View.GONE
        }
    }
    
    private fun loadData() {
        binding.emailEditText.setText(signupData.email)
        binding.passwordEditText.setText(signupData.password)
        binding.confirmPasswordEditText.setText(signupData.confirmPassword)
    }
    
    override fun validateForm(): Boolean {
        var isValid = true
        
        // Validate email (only for non-Google login)
        if (!isGoogleLogin) {
            val email = binding.emailEditText.text.toString().trim()
            if (email.isEmpty()) {
                binding.emailInputLayout.error = "Email is required"
                isValid = false
            } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                binding.emailInputLayout.error = "Please enter a valid email address"
                isValid = false
            } else {
                binding.emailInputLayout.error = null
                signupData.email = email
            }
            
            // Validate password
            val password = binding.passwordEditText.text.toString()
            if (password.isEmpty()) {
                binding.passwordInputLayout.error = "Password is required"
                isValid = false
            } else if (password.length < 8) {
                binding.passwordInputLayout.error = "Password must be at least 8 characters"
                isValid = false
            } else {
                binding.passwordInputLayout.error = null
                signupData.password = password
            }
            
            // Validate confirm password
            val confirmPassword = binding.confirmPasswordEditText.text.toString()
            if (confirmPassword.isEmpty()) {
                binding.confirmPasswordInputLayout.error = "Please confirm your password"
                isValid = false
            } else if (confirmPassword != password) {
                binding.confirmPasswordInputLayout.error = "Passwords do not match"
                isValid = false
            } else {
                binding.confirmPasswordInputLayout.error = null
                signupData.confirmPassword = confirmPassword
            }
        }
        
        return isValid
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}