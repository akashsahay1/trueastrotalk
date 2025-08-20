package com.trueastrotalk.user.screens.auth.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.trueastrotalk.user.databinding.FragmentBirthDetailsBinding
import com.trueastrotalk.user.screens.auth.SignupData
import java.util.*

class BirthDetailsFragment : BaseSignupFragment() {
    
    private var _binding: FragmentBirthDetailsBinding? = null
    private val binding get() = _binding!!
    
    companion object {
        fun newInstance(signupData: SignupData): BirthDetailsFragment {
            return BirthDetailsFragment().apply {
                this.signupData = signupData
            }
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBirthDetailsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
        loadData()
    }
    
    private fun setupUI() {
        // Setup date picker
        binding.dateOfBirthEditText.setOnClickListener {
            signupActivity.showDatePicker { dateString, calendar ->
                binding.dateOfBirthEditText.setText(dateString)
                signupData.dateOfBirth = calendar
            }
        }
        
        // Setup time picker
        binding.timeOfBirthEditText.setOnClickListener {
            signupActivity.showTimePicker { timeString, calendar ->
                binding.timeOfBirthEditText.setText(timeString)
                signupData.timeOfBirth = calendar
            }
        }
        
        // Setup terms checkbox
        binding.termsCheckbox.setOnCheckedChangeListener { _, isChecked ->
            signupData.acceptTerms = isChecked
        }
    }
    
    private fun loadData() {
        signupData.dateOfBirth?.let {
            binding.dateOfBirthEditText.setText(
                java.text.SimpleDateFormat("dd MMMM yyyy", Locale.getDefault()).format(it.time)
            )
        }
        
        signupData.timeOfBirth?.let {
            binding.timeOfBirthEditText.setText(
                java.text.SimpleDateFormat("hh:mm a", Locale.getDefault()).format(it.time)
            )
        }
        
        binding.placeOfBirthEditText.setText(signupData.placeOfBirth)
        binding.termsCheckbox.isChecked = signupData.acceptTerms
    }
    
    override fun validateForm(): Boolean {
        var isValid = true
        
        // Validate date of birth (required)
        if (signupData.dateOfBirth == null) {
            binding.dateOfBirthInputLayout.error = "Date of birth is required"
            isValid = false
        } else {
            binding.dateOfBirthInputLayout.error = null
        }
        
        // Time of birth is optional
        // Place of birth is optional
        signupData.placeOfBirth = binding.placeOfBirthEditText.text.toString().trim()
        
        // Terms acceptance is not required here as it's checked in final submission
        
        return isValid
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}