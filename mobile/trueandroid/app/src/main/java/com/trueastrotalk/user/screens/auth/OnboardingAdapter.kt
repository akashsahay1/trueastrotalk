package com.trueastrotalk.user.screens.auth

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.airbnb.lottie.LottieAnimationView
import com.trueastrotalk.user.databinding.ItemOnboardingBinding

class OnboardingAdapter(
    private val items: List<OnboardingItem>
) : RecyclerView.Adapter<OnboardingAdapter.OnboardingViewHolder>() {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OnboardingViewHolder {
        val binding = ItemOnboardingBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return OnboardingViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: OnboardingViewHolder, position: Int) {
        holder.bind(items[position])
    }
    
    override fun getItemCount(): Int = items.size
    
    class OnboardingViewHolder(
        private val binding: ItemOnboardingBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(item: OnboardingItem) {
            binding.apply {
                titleText.text = item.title
                descriptionText.text = item.description
                
                // Clear any previous animation first
                animationView.cancelAnimation()
                animationView.clearAnimation()
                
                // Load Lottie animation with conservative settings (using older Lottie version)
                try {
                    val animationPath = "animations/${item.animationResource}"
                    
                    android.util.Log.d("OnboardingAdapter", "Loading animation: $animationPath")
                    
                    animationView.visibility = android.view.View.VISIBLE
                    
                    // Use conservative settings for better compatibility
                    animationView.setAnimation(animationPath)
                    animationView.repeatCount = com.airbnb.lottie.LottieDrawable.INFINITE
                    
                    // Use HARDWARE rendering (default) for better performance but safer fallback
                    animationView.setRenderMode(com.airbnb.lottie.RenderMode.AUTOMATIC)
                    
                    // Enable merge paths for better performance (should be safer in v5.2.0)
                    animationView.enableMergePathsForKitKatAndAbove(true)
                    
                    // Add failure listener for graceful error handling
                    animationView.setFailureListener { result ->
                        android.util.Log.e("OnboardingAdapter", "Animation failed to load: ${item.animationResource}", result)
                        animationView.visibility = android.view.View.GONE
                    }
                    
                    // Start animation
                    animationView.playAnimation()
                    
                    android.util.Log.d("OnboardingAdapter", "Animation started successfully: ${item.animationResource}")
                    
                } catch (e: Exception) {
                    android.util.Log.e("OnboardingAdapter", "Failed to load animation: ${item.animationResource}", e)
                    
                    // Gracefully hide animation view on any error
                    animationView.visibility = android.view.View.GONE
                }
            }
        }
        
        fun pauseAnimation() {
            try {
                if (binding.animationView.isAnimating) {
                    binding.animationView.pauseAnimation()
                }
            } catch (e: Exception) {
                android.util.Log.e("OnboardingAdapter", "Error pausing animation", e)
            }
        }
        
        fun resumeAnimation() {
            try {
                if (!binding.animationView.isAnimating && binding.animationView.visibility == android.view.View.VISIBLE) {
                    binding.animationView.resumeAnimation()
                }
            } catch (e: Exception) {
                android.util.Log.e("OnboardingAdapter", "Error resuming animation", e)
            }
        }
    }
}