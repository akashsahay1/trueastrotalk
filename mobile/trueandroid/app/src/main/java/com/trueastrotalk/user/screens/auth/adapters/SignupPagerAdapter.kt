package com.trueastrotalk.user.screens.auth.adapters

import android.net.Uri
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.trueastrotalk.user.screens.auth.SignupActivity
import com.trueastrotalk.user.screens.auth.SignupData
import com.trueastrotalk.user.screens.auth.fragments.*

class SignupPagerAdapter(
    private val activity: SignupActivity,
    private val isAdvanced: Boolean,
    private val isGoogleLogin: Boolean,
    private val signupData: SignupData
) : FragmentStateAdapter(activity) {
    
    private val fragments = mutableListOf<BaseSignupFragment>()
    
    init {
        createFragments()
    }
    
    private fun createFragments() {
        fragments.clear()
        
        // Personal Information
        fragments.add(PersonalInfoFragment.newInstance(signupData, isAdvanced, isGoogleLogin))
        
        // Contact & Security
        fragments.add(ContactInfoFragment.newInstance(signupData, isGoogleLogin))
        
        // Birth Details
        fragments.add(BirthDetailsFragment.newInstance(signupData))
        
        if (isAdvanced) {
            // Professional Profile
            fragments.add(ProfessionalInfoFragment.newInstance(signupData))
            
            // Address Information
            fragments.add(AddressInfoFragment.newInstance(signupData))
            
            // Consultation Rates
            fragments.add(RatesInfoFragment.newInstance(signupData))
        }
    }
    
    override fun getItemCount(): Int = fragments.size
    
    override fun createFragment(position: Int): Fragment = fragments[position]
    
    fun getFragment(position: Int): BaseSignupFragment = fragments[position]
    
    fun updateProfileImage(uri: Uri) {
        if (fragments.isNotEmpty() && fragments[0] is PersonalInfoFragment) {
            (fragments[0] as PersonalInfoFragment).updateProfileImage(uri)
        }
    }
}