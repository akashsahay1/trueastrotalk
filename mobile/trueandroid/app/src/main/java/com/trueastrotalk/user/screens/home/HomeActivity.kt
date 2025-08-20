package com.trueastrotalk.user.screens.home

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.view.MenuItem
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.GravityCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.trueastrotalk.user.R
import com.trueastrotalk.user.config.AppConfig
import com.trueastrotalk.user.databinding.ActivityHomeBinding
import com.trueastrotalk.user.models.User
import com.trueastrotalk.user.models.enums.UserRole
import com.trueastrotalk.user.screens.auth.LoginActivity
import com.trueastrotalk.user.screens.home.adapters.AstrologerHomeAdapter
import com.trueastrotalk.user.screens.home.adapters.ProductHomeAdapter
import com.trueastrotalk.user.services.auth.UnifiedAuthService

class HomeActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityHomeBinding
    private lateinit var authService: UnifiedAuthService
    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var drawerToggle: ActionBarDrawerToggle
    
    private var currentUser: User? = null
    private var authToken: String? = null
    private var userName: String = ""
    private var userEmail: String = ""
    private var userRole: String = ""
    
    private lateinit var astrologerAdapter: AstrologerHomeAdapter
    private lateinit var productAdapter: ProductHomeAdapter
    
    private var isLoading = false
    private var walletBalance = 0.0
    
    companion object {
        private const val TAG = "HomeActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        initializeServices()
        loadUserSession()
        setupToolbar()
        setupDrawer()
        setupUI()
        setupClickListeners()
        loadHomeData()
    }
    
    private fun initializeServices() {
        authService = UnifiedAuthService(this)
        sharedPreferences = getSharedPreferences(AppConfig.PREFS_NAME, MODE_PRIVATE)
    }
    
    private fun loadUserSession() {
        userName = sharedPreferences.getString(AppConfig.KEY_USER_NAME, null) ?: ""
        userEmail = sharedPreferences.getString(AppConfig.KEY_USER_EMAIL, null) ?: ""
        userRole = sharedPreferences.getString(AppConfig.KEY_USER_ROLE, null) ?: ""
        authToken = sharedPreferences.getString(AppConfig.KEY_AUTH_TOKEN, null)
        
        if (userName.isEmpty() || userRole.isEmpty() || authToken == null) {
            Log.w(TAG, "Invalid session found")
            navigateToLogin()
            return
        }
        
        Log.d(TAG, "Loaded user session: $userName ($userRole)")
        setupUserInterface()
    }
    
    private fun setupUserInterface() {
        // Update welcome message
        binding.welcomeText.text = "Hello, $userName"
        
        // Update drawer header
        binding.navHeaderName.text = userName
        binding.navHeaderEmail.text = userEmail
        
        // Show appropriate sections based on user type
        when (userRole.lowercase()) {
            "customer" -> setupCustomerView()
            "astrologer" -> setupAstrologerView()
            else -> setupCustomerView()
        }
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowTitleEnabled(false)
        
        // Set toolbar title
        binding.toolbarTitle.text = "True Astrotalk"
        
        // Setup wallet balance button
        updateWalletBalance(0.0)
    }
    
    private fun setupDrawer() {
        drawerToggle = ActionBarDrawerToggle(
            this,
            binding.drawerLayout,
            binding.toolbar,
            R.string.navigation_drawer_open,
            R.string.navigation_drawer_close
        )
        binding.drawerLayout.addDrawerListener(drawerToggle)
        drawerToggle.syncState()
        
        binding.navView.setNavigationItemSelectedListener { menuItem ->
            handleDrawerItemClick(menuItem)
            binding.drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
    }
    
    private fun setupUI() {
        // Setup recycler views
        astrologerAdapter = AstrologerHomeAdapter { astrologer ->
            showMessage("Opening astrologer: ${astrologer.name}")
        }
        
        productAdapter = ProductHomeAdapter { product ->
            showMessage("Opening product: ${product.name}")
        }
        
        binding.astrologersRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@HomeActivity)
            adapter = astrologerAdapter
        }
        
        binding.productsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@HomeActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = productAdapter
        }
    }
    
    private fun setupCustomerView() {
        Log.d(TAG, "Setting up customer view")
        
        // Show customer sections
        binding.walletSection.visibility = android.view.View.VISIBLE
        binding.astrologersSection.visibility = android.view.View.VISIBLE
        binding.productsSection.visibility = android.view.View.VISIBLE
        binding.horoscopeSection.visibility = android.view.View.VISIBLE
        
        // Hide astrologer sections
        binding.astrologerDashboardSection.visibility = android.view.View.GONE
        
        // Load sample astrologers and products
        loadSampleAstrologers()
        loadSampleProducts()
    }
    
    private fun setupAstrologerView() {
        Log.d(TAG, "Setting up astrologer view")
        
        // Show astrologer sections
        binding.astrologerDashboardSection.visibility = android.view.View.VISIBLE
        
        // Hide customer sections
        binding.walletSection.visibility = android.view.View.GONE
        binding.astrologersSection.visibility = android.view.View.GONE
        binding.productsSection.visibility = android.view.View.GONE
        binding.horoscopeSection.visibility = android.view.View.GONE
        
        // Setup dashboard data
        binding.todayConsultationsText.text = "0"
        binding.totalEarningsText.text = "₹0.00"
        binding.pendingConsultationsText.text = "0"
        binding.onlineStatusSwitch.isChecked = false
    }
    
    private fun setupClickListeners() {
        // Wallet card click
        binding.walletCard.setOnClickListener {
            showMessage("Opening wallet")
        }
        
        // Wallet recharge button
        binding.rechargeWalletButton.setOnClickListener {
            showMessage("Opening wallet recharge")
        }
        
        // View all buttons
        binding.viewAllAstrologersButton.setOnClickListener {
            showMessage("Opening all astrologers")
        }
        
        binding.viewAllProductsButton.setOnClickListener {
            showMessage("Opening all products")
        }
        
        binding.viewAllHoroscopeButton.setOnClickListener {
            showMessage("Opening full horoscope")
        }
        
        // Refresh layout
        binding.swipeRefreshLayout.setOnRefreshListener {
            loadHomeData()
        }
        
        // Astrologer dashboard clicks
        binding.consultationsCard.setOnClickListener {
            showMessage("Opening consultations")
        }
        
        binding.earningsCard.setOnClickListener {
            showMessage("Opening earnings")
        }
        
        binding.onlineStatusSwitch.setOnCheckedChangeListener { _, isChecked ->
            showMessage("Online status: ${if (isChecked) "Online" else "Offline"}")
        }
        
        // Notifications
        binding.notificationsButton.setOnClickListener {
            showMessage("Opening notifications")
        }
    }
    
    private fun loadHomeData() {
        setLoading(true)
        
        // Simulate API calls
        binding.swipeRefreshLayout.postDelayed({
            walletBalance = (50..1000).random().toDouble()
            updateWalletBalance(walletBalance)
            setLoading(false)
            showMessage("Home refreshed")
        }, 1500)
    }
    
    private fun loadSampleAstrologers() {
        val sampleAstrologers = listOf(
            createSampleAstrologer("Dr. Rajesh Kumar", "Vedic, Numerology", "Hindi, English", 15, 4.8, true, 25.0),
            createSampleAstrologer("Priya Sharma", "Tarot, Love & Relationships", "Hindi, English", 8, 4.6, false, 30.0),
            createSampleAstrologer("Amit Gupta", "Career, Business", "English, Gujarati", 12, 4.9, true, 20.0),
            createSampleAstrologer("Sunita Devi", "Health, Family", "Hindi, Bengali", 20, 4.7, true, 35.0)
        )
        astrologerAdapter.updateAstrologers(sampleAstrologers)
    }
    
    private fun loadSampleProducts() {
        val sampleProducts = listOf(
            createSampleProduct("Rudraksha Mala", "Spiritual Items", 599.0, 499.0, true),
            createSampleProduct("Gemstone Ring", "Jewelry", 2999.0, 1999.0, true),
            createSampleProduct("Yantra Set", "Spiritual Items", 899.0, null, true),
            createSampleProduct("Crystal Healing Kit", "Healing", 1299.0, 999.0, false)
        )
        productAdapter.updateProducts(sampleProducts)
    }
    
    private fun createSampleAstrologer(
        name: String,
        specialization: String,
        languages: String,
        experience: Int,
        rating: Double,
        isOnline: Boolean,
        rate: Double
    ): SampleAstrologer {
        return SampleAstrologer(
            name = name,
            specialization = specialization,
            languages = languages,
            experience = experience,
            rating = rating,
            isOnline = isOnline,
            rate = rate
        )
    }
    
    private fun createSampleProduct(
        name: String,
        category: String,
        originalPrice: Double,
        discountedPrice: Double?,
        inStock: Boolean
    ): SampleProduct {
        return SampleProduct(
            name = name,
            category = category,
            originalPrice = originalPrice,
            discountedPrice = discountedPrice,
            inStock = inStock
        )
    }
    
    private fun updateWalletBalance(balance: Double) {
        binding.walletBalanceText.text = "₹${String.format("%.0f", balance)}"
        binding.toolbarWalletBalance.text = "₹${String.format("%.0f", balance)}"
    }
    
    private fun setLoading(loading: Boolean) {
        isLoading = loading
        binding.swipeRefreshLayout.isRefreshing = loading
    }
    
    private fun handleDrawerItemClick(menuItem: MenuItem) {
        when (menuItem.itemId) {
            R.id.nav_home -> {
                // Already on home
            }
            R.id.nav_profile -> {
                showMessage("Opening profile")
            }
            R.id.nav_wallet -> {
                showMessage("Opening wallet")
            }
            R.id.nav_history -> {
                showMessage("Opening history")
            }
            R.id.nav_help -> {
                showMessage("Opening help")
            }
            R.id.nav_logout -> {
                handleLogout()
            }
        }
    }
    
    private fun handleLogout() {
        // Clear session data
        sharedPreferences.edit().clear().apply()
        
        // Navigate to login
        navigateToLogin()
        
        showMessage("Logged out successfully")
    }
    
    private fun showMessage(message: String) {
        Snackbar.make(binding.coordinatorLayout, message, Snackbar.LENGTH_SHORT).show()
    }
    
    private fun showErrorMessage(message: String) {
        Snackbar.make(binding.coordinatorLayout, message, Snackbar.LENGTH_LONG)
            .setBackgroundTint(ContextCompat.getColor(this, android.R.color.holo_red_dark))
            .show()
    }
    
    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    override fun onBackPressed() {
        if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        } else {
            super.onBackPressed()
        }
    }
}

// Sample data classes for demonstration
data class SampleAstrologer(
    val name: String,
    val specialization: String,
    val languages: String,
    val experience: Int,
    val rating: Double,
    val isOnline: Boolean,
    val rate: Double
)

data class SampleProduct(
    val name: String,
    val category: String,
    val originalPrice: Double,
    val discountedPrice: Double?,
    val inStock: Boolean
)