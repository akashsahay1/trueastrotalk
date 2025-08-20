package com.trueastrotalk.user.screens.auth

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.viewpager2.widget.ViewPager2
import com.trueastrotalk.user.databinding.ActivityOnboardingBinding
import com.trueastrotalk.user.screens.auth.LoginActivity
import com.trueastrotalk.user.config.AppConfig

class OnboardingActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityOnboardingBinding
    private lateinit var adapter: OnboardingAdapter
    private lateinit var sharedPreferences: SharedPreferences
    
    private val onboardingItems = listOf(
        OnboardingItem(
            title = "Welcome to True Astrotalk",
            description = "Discover your cosmic journey with our selected, verified & experienced astrologers.",
            animationResource = "intro1.json"
        ),
        OnboardingItem(
            title = "Convenient Chat Message",
            description = "Connect with our astrologers with one on one personalized chat service with our verified astrologers",
            animationResource = "intro2.json"
        ),
        OnboardingItem(
            title = "Easy & Secure Payments",
            description = "Make your payments with ease and peace with active and passive security with payment gateway.",
            animationResource = "intro3.json"
        )
    )
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOnboardingBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        sharedPreferences = getSharedPreferences(AppConfig.PREFS_NAME, MODE_PRIVATE)
        
        setupViewPager()
        setupIndicators()
        setupClickListeners()
        updateUI(0)
    }
    
    private fun setupViewPager() {
        adapter = OnboardingAdapter(onboardingItems)
        binding.viewPager.adapter = adapter
        binding.viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                super.onPageSelected(position)
                updateUI(position)
            }
        })
    }
    
    private fun setupIndicators() {
        binding.indicatorContainer.removeAllViews()
        repeat(onboardingItems.size) { index ->
            val indicator = createIndicator(false)
            binding.indicatorContainer.addView(indicator)
        }
        updateIndicators(0)
    }
    
    private fun createIndicator(isActive: Boolean): android.view.View {
        val indicator = android.view.View(this)
        val params = android.widget.LinearLayout.LayoutParams(
            if (isActive) dpToPx(24) else dpToPx(8),
            dpToPx(8)
        )
        params.setMargins(dpToPx(4), 0, dpToPx(4), 0)
        indicator.layoutParams = params
        indicator.setBackgroundResource(
            if (isActive) 
                com.trueastrotalk.user.R.drawable.indicator_active 
            else 
                com.trueastrotalk.user.R.drawable.indicator_inactive
        )
        return indicator
    }
    
    private fun updateIndicators(position: Int) {
        for (i in 0 until binding.indicatorContainer.childCount) {
            val indicator = binding.indicatorContainer.getChildAt(i)
            val params = indicator.layoutParams as android.widget.LinearLayout.LayoutParams
            if (i == position) {
                params.width = dpToPx(24)
                indicator.setBackgroundResource(com.trueastrotalk.user.R.drawable.indicator_active)
            } else {
                params.width = dpToPx(8)
                indicator.setBackgroundResource(com.trueastrotalk.user.R.drawable.indicator_inactive)
            }
            indicator.layoutParams = params
        }
    }
    
    private fun setupClickListeners() {
        binding.btnSkip.setOnClickListener {
            finishOnboarding()
        }
        
        binding.btnPrevious.setOnClickListener {
            val currentItem = binding.viewPager.currentItem
            if (currentItem > 0) {
                binding.viewPager.currentItem = currentItem - 1
            }
        }
        
        binding.btnNext.setOnClickListener {
            val currentItem = binding.viewPager.currentItem
            if (currentItem < onboardingItems.size - 1) {
                binding.viewPager.currentItem = currentItem + 1
            } else {
                finishOnboarding()
            }
        }
    }
    
    private fun updateUI(position: Int) {
        updateIndicators(position)
        
        // Update button visibility and text
        binding.btnPrevious.visibility = if (position > 0) android.view.View.VISIBLE else android.view.View.INVISIBLE
        
        val isLastPage = position == onboardingItems.size - 1
        binding.btnNext.text = if (isLastPage) "Get Started" else "Next"
    }
    
    private fun finishOnboarding() {
        // Mark onboarding as completed
        sharedPreferences.edit()
            .putBoolean(AppConfig.KEY_ONBOARDING_COMPLETED, true)
            .apply()
        
        // Navigate to login screen
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
    
    override fun onPause() {
        super.onPause()
        // Pause animations to save battery
        pauseCurrentAnimation()
    }
    
    override fun onResume() {
        super.onResume()
        // Resume animations when activity comes back
        resumeCurrentAnimation()
    }
    
    private fun pauseCurrentAnimation() {
        try {
            val currentPosition = binding.viewPager.currentItem
            val viewHolder = getViewHolderAtPosition(currentPosition)
            viewHolder?.pauseAnimation()
        } catch (e: Exception) {
            // Ignore if view holder not available
        }
    }
    
    private fun resumeCurrentAnimation() {
        try {
            val currentPosition = binding.viewPager.currentItem
            val viewHolder = getViewHolderAtPosition(currentPosition)
            viewHolder?.resumeAnimation()
        } catch (e: Exception) {
            // Ignore if view holder not available
        }
    }
    
    private fun getViewHolderAtPosition(position: Int): OnboardingAdapter.OnboardingViewHolder? {
        return try {
            val recyclerView = binding.viewPager.getChildAt(0) as? androidx.recyclerview.widget.RecyclerView
            recyclerView?.findViewHolderForAdapterPosition(position) as? OnboardingAdapter.OnboardingViewHolder
        } catch (e: Exception) {
            null
        }
    }
}