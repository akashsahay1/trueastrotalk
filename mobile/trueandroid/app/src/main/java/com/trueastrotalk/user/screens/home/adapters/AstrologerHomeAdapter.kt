package com.trueastrotalk.user.screens.home.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.trueastrotalk.user.R
import com.trueastrotalk.user.screens.home.SampleAstrologer

class AstrologerHomeAdapter(
    private val onAstrologerClick: (SampleAstrologer) -> Unit
) : RecyclerView.Adapter<AstrologerHomeAdapter.AstrologerViewHolder>() {

    private var astrologers: List<SampleAstrologer> = emptyList()

    fun updateAstrologers(newAstrologers: List<SampleAstrologer>) {
        astrologers = newAstrologers
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AstrologerViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_astrologer_home, parent, false)
        return AstrologerViewHolder(view)
    }

    override fun onBindViewHolder(holder: AstrologerViewHolder, position: Int) {
        holder.bind(astrologers[position])
    }

    override fun getItemCount(): Int = astrologers.size

    inner class AstrologerViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val cardView: MaterialCardView = itemView.findViewById(R.id.astrologer_card)
        private val profileImage: ImageView = itemView.findViewById(R.id.astrologer_profile_image)
        private val onlineIndicator: View = itemView.findViewById(R.id.online_indicator)
        private val nameText: TextView = itemView.findViewById(R.id.astrologer_name)
        private val specializationText: TextView = itemView.findViewById(R.id.astrologer_specialization)
        private val languagesText: TextView = itemView.findViewById(R.id.astrologer_languages)
        private val experienceText: TextView = itemView.findViewById(R.id.astrologer_experience)
        private val ratingText: TextView = itemView.findViewById(R.id.astrologer_rating)
        private val rateText: TextView = itemView.findViewById(R.id.astrologer_rate)
        private val chatButton: MaterialButton = itemView.findViewById(R.id.chat_button)
        private val callButton: MaterialButton = itemView.findViewById(R.id.call_button)

        fun bind(astrologer: SampleAstrologer) {
            nameText.text = astrologer.name
            specializationText.text = astrologer.specialization
            languagesText.text = astrologer.languages
            experienceText.text = "${astrologer.experience} years exp"
            ratingText.text = "⭐ ${astrologer.rating}"
            rateText.text = "₹${String.format("%.0f", astrologer.rate)}/min"

            // Set online status
            onlineIndicator.visibility = if (astrologer.isOnline) View.VISIBLE else View.GONE
            
            // Set profile image (placeholder for now)
            profileImage.setImageResource(R.drawable.ic_person)

            // Set button states based on online status
            chatButton.isEnabled = astrologer.isOnline
            callButton.isEnabled = astrologer.isOnline

            if (!astrologer.isOnline) {
                chatButton.text = "Offline"
                callButton.text = "Offline"
                chatButton.alpha = 0.6f
                callButton.alpha = 0.6f
            } else {
                chatButton.text = "Chat"
                callButton.text = "Call"
                chatButton.alpha = 1.0f
                callButton.alpha = 1.0f
            }

            // Set click listeners
            cardView.setOnClickListener {
                onAstrologerClick(astrologer)
            }

            chatButton.setOnClickListener {
                if (astrologer.isOnline) {
                    onAstrologerClick(astrologer)
                }
            }

            callButton.setOnClickListener {
                if (astrologer.isOnline) {
                    onAstrologerClick(astrologer)
                }
            }
        }
    }
}