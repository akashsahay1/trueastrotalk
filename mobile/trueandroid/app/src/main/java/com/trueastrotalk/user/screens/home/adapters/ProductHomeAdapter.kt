package com.trueastrotalk.user.screens.home.adapters

import android.graphics.Paint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.trueastrotalk.user.R
import com.trueastrotalk.user.screens.home.SampleProduct

class ProductHomeAdapter(
    private val onProductClick: (SampleProduct) -> Unit
) : RecyclerView.Adapter<ProductHomeAdapter.ProductViewHolder>() {

    private var products: List<SampleProduct> = emptyList()

    fun updateProducts(newProducts: List<SampleProduct>) {
        products = newProducts
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProductViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_product_home, parent, false)
        return ProductViewHolder(view)
    }

    override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
        holder.bind(products[position])
    }

    override fun getItemCount(): Int = products.size

    inner class ProductViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val cardView: MaterialCardView = itemView.findViewById(R.id.product_card)
        private val productImage: ImageView = itemView.findViewById(R.id.product_image)
        private val nameText: TextView = itemView.findViewById(R.id.product_name)
        private val categoryText: TextView = itemView.findViewById(R.id.product_category)
        private val originalPriceText: TextView = itemView.findViewById(R.id.product_original_price)
        private val discountedPriceText: TextView = itemView.findViewById(R.id.product_discounted_price)
        private val stockBadge: TextView = itemView.findViewById(R.id.stock_badge)
        private val discountBadge: TextView = itemView.findViewById(R.id.discount_badge)
        private val addToCartButton: MaterialButton = itemView.findViewById(R.id.add_to_cart_button)

        fun bind(product: SampleProduct) {
            nameText.text = product.name
            categoryText.text = product.category

            // Handle pricing
            if (product.discountedPrice != null) {
                // Show both prices with discount
                originalPriceText.text = "₹${String.format("%.0f", product.originalPrice)}"
                originalPriceText.paintFlags = originalPriceText.paintFlags or Paint.STRIKE_THRU_TEXT_FLAG
                originalPriceText.visibility = View.VISIBLE
                
                discountedPriceText.text = "₹${String.format("%.0f", product.discountedPrice)}"
                discountedPriceText.visibility = View.VISIBLE
                
                // Calculate and show discount percentage
                val discountPercent = ((product.originalPrice - product.discountedPrice) / product.originalPrice * 100).toInt()
                discountBadge.text = "${discountPercent}% OFF"
                discountBadge.visibility = View.VISIBLE
            } else {
                // Show only original price
                originalPriceText.text = "₹${String.format("%.0f", product.originalPrice)}"
                originalPriceText.paintFlags = originalPriceText.paintFlags and Paint.STRIKE_THRU_TEXT_FLAG.inv()
                originalPriceText.visibility = View.VISIBLE
                
                discountedPriceText.visibility = View.GONE
                discountBadge.visibility = View.GONE
            }

            // Handle stock status
            if (product.inStock) {
                stockBadge.text = "In Stock"
                stockBadge.setTextColor(itemView.context.getColor(R.color.success))
                stockBadge.setBackgroundResource(R.drawable.badge_success)
                addToCartButton.isEnabled = true
                addToCartButton.text = "Add to Cart"
                addToCartButton.alpha = 1.0f
            } else {
                stockBadge.text = "Out of Stock"
                stockBadge.setTextColor(itemView.context.getColor(R.color.error))
                stockBadge.setBackgroundResource(R.drawable.badge_error)
                addToCartButton.isEnabled = false
                addToCartButton.text = "Out of Stock"
                addToCartButton.alpha = 0.6f
            }

            // Set product image (placeholder for now)
            productImage.setImageResource(when (product.category) {
                "Spiritual Items" -> R.drawable.ic_temple
                "Jewelry" -> R.drawable.ic_diamond
                "Healing" -> R.drawable.ic_healing
                else -> R.drawable.ic_shopping
            })

            // Set click listeners
            cardView.setOnClickListener {
                onProductClick(product)
            }

            addToCartButton.setOnClickListener {
                if (product.inStock) {
                    onProductClick(product)
                }
            }
        }
    }
}