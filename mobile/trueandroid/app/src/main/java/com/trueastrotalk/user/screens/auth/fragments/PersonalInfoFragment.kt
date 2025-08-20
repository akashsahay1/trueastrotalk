package com.trueastrotalk.user.screens.auth.fragments

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.bumptech.glide.Glide
import com.trueastrotalk.user.R
import com.trueastrotalk.user.databinding.FragmentPersonalInfoBinding
import com.trueastrotalk.user.screens.auth.SignupData

class PersonalInfoFragment : BaseSignupFragment() {
    
    private var _binding: FragmentPersonalInfoBinding? = null
    private val binding get() = _binding!!
    
    private var isAdvanced = false
    private var isGoogleLogin = false
    private var profileImageUri: Uri? = null
    
    companion object {
        fun newInstance(signupData: SignupData, isAdvanced: Boolean, isGoogleLogin: Boolean): PersonalInfoFragment {
            return PersonalInfoFragment().apply {
                this.signupData = signupData
                this.isAdvanced = isAdvanced
                this.isGoogleLogin = isGoogleLogin
            }
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPersonalInfoBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
        loadData()
    }
    
    private fun setupUI() {
        // Show profile image picker only for astrologers
        binding.profileImageSection.visibility = if (isAdvanced) View.VISIBLE else View.GONE
        
        // Setup profile image click listener
        binding.profileImageContainer.setOnClickListener {
            signupActivity.pickImage()
        }
        
        // Set readonly fields for Google login
        if (isGoogleLogin) {
            binding.nameEditText.isEnabled = false
            binding.nameHint.text = "From your Google account"
        }
    }
    
    private fun loadData() {
        binding.nameEditText.setText(signupData.name)
        binding.phoneEditText.setText(signupData.phone)
    }
    
    fun updateProfileImage(uri: Uri) {
        profileImageUri = uri
        Glide.with(this)
            .load(uri)
            .circleCrop()
            .placeholder(R.drawable.ic_person_24)
            .into(binding.profileImageView)
        
        binding.profileImagePlaceholder.visibility = View.GONE
        binding.profileImageView.visibility = View.VISIBLE
    }
    
    override fun validateForm(): Boolean {
        var isValid = true
        
        // Validate name
        val name = binding.nameEditText.text.toString().trim()
        if (name.isEmpty()) {
            binding.nameInputLayout.error = "Full name is required"
            isValid = false
        } else if (name.length < 2) {
            binding.nameInputLayout.error = "Name must be at least 2 characters"
            isValid = false
        } else {
            binding.nameInputLayout.error = null
            signupData.name = name
        }
        
        // Validate phone
        val phone = binding.phoneEditText.text.toString().trim()
        if (phone.isEmpty()) {
            binding.phoneInputLayout.error = "Phone number is required"
            isValid = false
        } else if (phone.length != 10) {
            binding.phoneInputLayout.error = "Please enter a valid 10-digit phone number"
            isValid = false
        } else {
            binding.phoneInputLayout.error = null
            signupData.phone = phone
        }
        
        return isValid
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}