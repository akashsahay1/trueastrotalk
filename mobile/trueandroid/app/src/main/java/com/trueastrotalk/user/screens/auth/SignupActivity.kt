package com.trueastrotalk.user.screens.auth

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.trueastrotalk.user.R
import com.trueastrotalk.user.config.AppConfig
import com.trueastrotalk.user.databinding.ActivitySignupBinding
import com.trueastrotalk.user.models.*
import com.trueastrotalk.user.models.enums.*
import com.trueastrotalk.user.screens.auth.adapters.SignupPagerAdapter
import com.trueastrotalk.user.screens.home.HomeActivity
import com.trueastrotalk.user.services.auth.UnifiedAuthService
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class SignupActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySignupBinding
    private lateinit var authService: UnifiedAuthService
    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var pagerAdapter: SignupPagerAdapter
    
    // Signup mode (false = customer, true = astrologer)
    private var isAdvancedSignup = false
    
    // Form data
    var signupData = SignupData()
    
    // Current section tracking
    private var currentSection = 0
    private var totalSections = 3 // Will be updated based on signup mode
    
    // Loading state
    private var isLoading = false
    
    // Google login data (if coming from Google login)
    private var isGoogleLogin = false
    
    // Image picker
    private var profileImageUri: Uri? = null
    
    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            profileImageUri = it
            pagerAdapter.updateProfileImage(it)
        }
    }
    
    private val cameraLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            profileImageUri?.let { uri ->
                pagerAdapter.updateProfileImage(uri)
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySignupBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        initializeServices()
        handleIntentData()
        setupUI()
        setupClickListeners()
    }
    
    private fun initializeServices() {
        authService = UnifiedAuthService(this)
        sharedPreferences = getSharedPreferences(AppConfig.PREFS_NAME, MODE_PRIVATE)
    }
    
    private fun handleIntentData() {
        // Check if this is from Google login
        val name = intent.getStringExtra("name")
        val email = intent.getStringExtra("email")
        val googleAccessToken = intent.getStringExtra("google_access_token")
        val authType = intent.getStringExtra("auth_type")
        
        if (name != null && email != null && googleAccessToken != null && authType == "google") {
            isGoogleLogin = true
            signupData.name = name
            signupData.email = email
            signupData.googleAccessToken = googleAccessToken
            signupData.authType = authType
            currentSection = 0 // Start from personal info section with prefilled data
        }
        
        // Check signup mode
        isAdvancedSignup = intent.getBooleanExtra("isAdvanced", false)
        totalSections = if (isAdvancedSignup) 6 else 3
    }
    
    private fun setupUI() {
        // Setup app bar
        binding.toolbar.title = if (isAdvancedSignup) "Join as Astrologer" else "Create Account"
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        // Setup ViewPager2
        pagerAdapter = SignupPagerAdapter(this, isAdvancedSignup, isGoogleLogin, signupData)
        binding.viewPager.adapter = pagerAdapter
        binding.viewPager.isUserInputEnabled = false // Disable swipe navigation
        
        // Move to correct initial section if Google login
        if (currentSection > 0) {
            binding.viewPager.setCurrentItem(currentSection, false)
        }
        
        updateProgressIndicator()
        updateNavigationButton()
    }
    
    private fun setupClickListeners() {
        binding.toolbar.setNavigationOnClickListener {
            if (currentSection > 0) {
                previousSection()
            } else {
                finish()
            }
        }
        
        binding.nextButton.setOnClickListener {
            nextSection()
        }
        
        binding.viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                currentSection = position
                updateProgressIndicator()
                updateNavigationButton()
            }
        })
    }
    
    fun pickImage() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Select Profile Photo")
            .setItems(arrayOf("Camera", "Gallery")) { _, which ->
                when (which) {
                    0 -> openCamera()
                    1 -> openGallery()
                }
            }
            .show()
    }
    
    private fun openCamera() {
        val photoFile = File(getExternalFilesDir(null), "profile_${System.currentTimeMillis()}.jpg")
        val uri = FileProvider.getUriForFile(this, "${packageName}.provider", photoFile)
        profileImageUri = uri
        cameraLauncher.launch(uri)
    }
    
    private fun openGallery() {
        imagePickerLauncher.launch("image/*")
    }
    
    fun showDatePicker(onDateSelected: (String, Calendar) -> Unit) {
        val calendar = Calendar.getInstance()
        val datePicker = DatePickerDialog(
            this,
            { _, year, month, dayOfMonth ->
                calendar.set(year, month, dayOfMonth)
                val format = SimpleDateFormat("dd MMMM yyyy", Locale.getDefault())
                onDateSelected(format.format(calendar.time), calendar)
            },
            calendar.get(Calendar.YEAR) - 25,
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        
        // Set date constraints
        datePicker.datePicker.maxDate = Calendar.getInstance().apply {
            add(Calendar.YEAR, -12)
        }.timeInMillis
        datePicker.datePicker.minDate = Calendar.getInstance().apply {
            set(1950, 0, 1)
        }.timeInMillis
        
        datePicker.show()
    }
    
    fun showTimePicker(onTimeSelected: (String, Calendar) -> Unit) {
        val calendar = Calendar.getInstance()
        TimePickerDialog(
            this,
            { _, hourOfDay, minute ->
                calendar.set(Calendar.HOUR_OF_DAY, hourOfDay)
                calendar.set(Calendar.MINUTE, minute)
                val format = SimpleDateFormat("hh:mm a", Locale.getDefault())
                onTimeSelected(format.format(calendar.time), calendar)
            },
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            false
        ).show()
    }
    
    fun showMultiSelectDialog(
        title: String, 
        items: Array<String>,
        selectedItems: BooleanArray,
        onSelectionChanged: (BooleanArray) -> Unit
    ) {
        val tempSelection = selectedItems.copyOf()
        
        MaterialAlertDialogBuilder(this)
            .setTitle(title)
            .setMultiChoiceItems(items, tempSelection) { _, which, isChecked ->
                tempSelection[which] = isChecked
            }
            .setPositiveButton("Done") { _, _ ->
                onSelectionChanged(tempSelection)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun nextSection() {
        if (isLoading) return
        
        // Validate current section
        val currentFragment = pagerAdapter.getFragment(currentSection)
        if (!currentFragment.validateForm()) {
            return
        }
        
        if (currentSection < totalSections - 1) {
            currentSection++
            binding.viewPager.setCurrentItem(currentSection, true)
        } else {
            submitForm()
        }
    }
    
    private fun previousSection() {
        if (currentSection > 0) {
            currentSection--
            binding.viewPager.setCurrentItem(currentSection, true)
        }
    }
    
    private fun updateProgressIndicator() {
        binding.progressBar.progress = ((currentSection + 1) * 100) / totalSections
        binding.sectionTitle.text = getSectionTitle(currentSection)
        binding.sectionSubtitle.text = getSectionSubtitle(currentSection)
    }
    
    private fun updateNavigationButton() {
        val isLastSection = currentSection == totalSections - 1
        binding.nextButton.text = when {
            isLoading -> "Loading..."
            isLastSection && isAdvancedSignup -> "Create Profile"
            isLastSection -> "Create Account"
            else -> "Continue"
        }
        binding.nextButton.isEnabled = !isLoading
    }
    
    private fun getSectionTitle(section: Int): String {
        return when (section) {
            0 -> "Personal Information"
            1 -> "Contact & Security"
            2 -> "Birth Details"
            3 -> "Professional Profile"
            4 -> "Address Information"
            5 -> "Consultation Rates"
            else -> ""
        }
    }
    
    private fun getSectionSubtitle(section: Int): String {
        return when (section) {
            0 -> if (isGoogleLogin) "Confirm your details" else "Tell us who you are"
            1 -> if (isGoogleLogin) "Add your contact info" else "Secure your account"
            2 -> "For personalized guidance"
            3 -> "Share your expertise"
            4 -> "Where you're located"
            5 -> "Set your consultation rates"
            else -> ""
        }
    }
    
    private fun submitForm() {
        if (!signupData.acceptTerms) {
            showErrorMessage("Please accept the terms and conditions")
            return
        }
        
        setLoading(true)
        
        lifecycleScope.launch {
            try {
                val userType = if (isAdvancedSignup) UserType.ASTROLOGER else UserType.CUSTOMER
                
                val result = if (isGoogleLogin && signupData.googleAccessToken != null) {
                    // Google signup
                    val user = authService.registerWithGoogle(
                        name = signupData.name,
                        email = signupData.email,
                        phone = signupData.phone,
                        role = userType.value,
                        googleAccessToken = signupData.googleAccessToken!!,
                        dateOfBirth = signupData.dateOfBirth?.let { Date(it.timeInMillis) },
                        timeOfBirth = signupData.timeOfBirth?.let { 
                            SimpleDateFormat("HH:mm", Locale.getDefault()).format(it.time)
                        },
                        placeOfBirth = signupData.placeOfBirth,
                        bio = signupData.bio,
                        experience = signupData.experience,
                        languages = signupData.selectedLanguages.joinToString(", "),
                        specializations = signupData.qualifications.joinToString(", "),
                        skills = signupData.selectedSkills.joinToString(", "),
                        address = signupData.address,
                        city = signupData.city,
                        state = signupData.state,
                        country = signupData.country,
                        zip = signupData.zip,
                        callRate = signupData.callRate,
                        chatRate = signupData.chatRate,
                        videoRate = signupData.videoRate,
                        profileImageUri = profileImageUri
                    )
                    AuthResult.success(user = user)
                } else {
                    // Regular signup
                    authService.register(
                        name = signupData.name,
                        email = signupData.email,
                        phone = signupData.phone,
                        password = signupData.password,
                        userType = userType,
                        dateOfBirth = signupData.dateOfBirth?.let { Date(it.timeInMillis) },
                        timeOfBirth = signupData.timeOfBirth?.let {
                            SimpleDateFormat("HH:mm", Locale.getDefault()).format(it.time)
                        },
                        placeOfBirth = signupData.placeOfBirth,
                        experience = signupData.experience,
                        bio = signupData.bio,
                        languages = signupData.selectedLanguages.joinToString(", "),
                        specializations = signupData.qualifications.joinToString(", "),
                        skills = signupData.selectedSkills.joinToString(", "),
                        address = signupData.address,
                        city = signupData.city,
                        state = signupData.state,
                        country = signupData.country,
                        zip = signupData.zip,
                        callRate = signupData.callRate,
                        chatRate = signupData.chatRate,
                        videoRate = signupData.videoRate,
                        profileImageUri = profileImageUri
                    )
                }
                
                if (result.success) {
                    val user = result.user
                    val message = result.message ?: ""
                    
                    // Show success message and navigate
                    if (isAdvancedSignup) {
                        showSuccessDialog(
                            "Application Submitted Successfully!",
                            message.ifEmpty { "We'll review your profile and notify you once approved." },
                            onConfirm = { finish() }
                        )
                    } else {
                        showSuccessDialog(
                            "Account Created Successfully!",
                            message.ifEmpty { "Welcome aboard! You can now start consulting with astrologers." },
                            onConfirm = { 
                                navigateToHome(user!!)
                            }
                        )
                    }
                } else {
                    showErrorMessage(result.message ?: "Registration failed")
                }
                
            } catch (e: Exception) {
                showErrorMessage("Registration failed: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }
    
    private fun setLoading(loading: Boolean) {
        isLoading = loading
        binding.nextButton.isEnabled = !loading
        updateNavigationButton()
    }
    
    
    private fun showSuccessDialog(title: String, message: String, onConfirm: () -> Unit) {
        MaterialAlertDialogBuilder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("Continue") { _, _ -> onConfirm() }
            .setCancelable(false)
            .show()
    }
    
    private fun showErrorMessage(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG)
            .setBackgroundTint(getColor(android.R.color.holo_red_dark))
            .show()
    }
    
    private fun showMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    private fun navigateToHome(user: User) {
        // Save user session data
        saveUserSession(user)
        
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun saveUserSession(user: User) {
        android.util.Log.d("SignupActivity", "💾 Saving user session data")
        sharedPreferences.edit().apply {
            putString(AppConfig.KEY_USER_NAME, user.name)
            putString(AppConfig.KEY_USER_EMAIL, user.email)
            putString(AppConfig.KEY_USER_ROLE, user.role.value)
            putString(AppConfig.KEY_USER_ID, user.id)
            putBoolean(AppConfig.KEY_IS_LOGGED_IN, true)
            // Note: Auth token should be handled by the authService
            apply()
        }
        android.util.Log.d("SignupActivity", "✅ Session data saved successfully")
    }
    
    override fun onSupportNavigateUp(): Boolean {
        if (currentSection > 0) {
            previousSection()
            return true
        }
        return super.onSupportNavigateUp()
    }
}

// Data class to hold all signup form data
data class SignupData(
    var name: String = "",
    var email: String = "",
    var phone: String = "",
    var password: String = "",
    var confirmPassword: String = "",
    var dateOfBirth: Calendar? = null,
    var timeOfBirth: Calendar? = null,
    var placeOfBirth: String = "",
    var bio: String = "",
    var experience: String = "",
    var qualifications: MutableList<String> = mutableListOf(),
    var selectedLanguages: MutableSet<String> = mutableSetOf(),
    var selectedSkills: MutableSet<String> = mutableSetOf(),
    var address: String = "",
    var city: String = "",
    var state: String = "",
    var country: String = "India",
    var zip: String = "",
    var callRate: Double? = null,
    var chatRate: Double? = null,
    var videoRate: Double? = null,
    var acceptTerms: Boolean = false,
    var googleAccessToken: String? = null,
    var authType: String? = null
)