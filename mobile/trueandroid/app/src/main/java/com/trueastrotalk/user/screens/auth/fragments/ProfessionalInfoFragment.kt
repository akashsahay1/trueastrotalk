package com.trueastrotalk.user.screens.auth.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.trueastrotalk.user.screens.auth.SignupData

class ProfessionalInfoFragment : BaseSignupFragment() {
    
    companion object {
        fun newInstance(signupData: SignupData): ProfessionalInfoFragment {
            return ProfessionalInfoFragment().apply {
                this.signupData = signupData
            }
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        // Simple placeholder layout for professional info
        return TextView(requireContext()).apply {
            text = "Professional Information\n\n(Bio, Experience, Languages, Skills, etc.)\n\nThis section would contain:\n- Years of Experience\n- Professional Bio\n- Languages Spoken\n- Specialization Skills\n- Qualifications"
            textSize = 16f
            setPadding(48, 48, 48, 48)
        }
    }
    
    override fun validateForm(): Boolean {
        // For demo purposes, always return true
        // In real implementation, this would validate professional fields
        return true
    }
}

class AddressInfoFragment : BaseSignupFragment() {
    
    companion object {
        fun newInstance(signupData: SignupData): AddressInfoFragment {
            return AddressInfoFragment().apply {
                this.signupData = signupData
            }
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return TextView(requireContext()).apply {
            text = "Address Information\n\n(Address, City, State, Country, ZIP)\n\nThis section would contain:\n- Full Address\n- City\n- State\n- Country (Default: India)\n- ZIP/Postal Code"
            textSize = 16f
            setPadding(48, 48, 48, 48)
        }
    }
    
    override fun validateForm(): Boolean {
        // For demo purposes, always return true
        return true
    }
}

class RatesInfoFragment : BaseSignupFragment() {
    
    companion object {
        fun newInstance(signupData: SignupData): RatesInfoFragment {
            return RatesInfoFragment().apply {
                this.signupData = signupData
            }
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return TextView(requireContext()).apply {
            text = "Consultation Rates\n\n(Call Rate, Chat Rate, Video Rate)\n\nThis section would contain:\n- Call Rate (₹/min)\n- Chat Rate (₹/min)\n- Video Call Rate (₹/min)\n\nNote: These rates will be reviewed and approved by admin team."
            textSize = 16f
            setPadding(48, 48, 48, 48)
        }
    }
    
    override fun validateForm(): Boolean {
        // For demo purposes, always return true
        return true
    }
}