import UIKit

class LoginViewController: UIViewController {
    
    // MARK: - UI Components
    private let scrollView = UIScrollView()
    private let contentView = UIView()
    private let logoImageView = UIImageView()
    private let welcomeLabel = UILabel()
    private let taglineLabel = UILabel()
    private let emailTextField = UITextField()
    private let passwordTextField = UITextField()
    private let forgotPasswordButton = UIButton()
    private let loginButton = UIButton()
    private let googleSignInButton = UIButton()
    private let registerButton = UIButton()
    private let joinAstrologerButton = UIButton()
    private let termsLabel = UILabel()
    private let loadingView = UIView()
    private let activityIndicator = UIActivityIndicatorView(style: .large)
    private let loadingLabel = UILabel()
    
    // MARK: - Properties
    private var isLoading = false
    private var isPasswordVisible = false
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
        setupGestures()
        checkExistingSession()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: animated)
    }
    
    // MARK: - Setup
    private func setupUI() {
        // Configure view
        view.backgroundColor = UIColor.systemBackground
        
        // Configure scroll view
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        contentView.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure logo
        logoImageView.image = UIImage(named: "logo") ?? UIImage(systemName: "star.circle.fill")
        logoImageView.layer.cornerRadius = 16
        logoImageView.layer.shadowColor = UIColor.systemBlue.cgColor
        logoImageView.layer.shadowOffset = CGSize(width: 0, height: 4)
        logoImageView.layer.shadowRadius = 8
        logoImageView.layer.shadowOpacity = 0.3
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure labels
        welcomeLabel.text = "Welcome Back!"
        welcomeLabel.font = UIFont.systemFont(ofSize: 28, weight: .bold)
        welcomeLabel.textColor = .label
        welcomeLabel.textAlignment = .center
        welcomeLabel.translatesAutoresizingMaskIntoConstraints = false
        
        taglineLabel.text = "Connect with Verified Astrologers"
        taglineLabel.font = UIFont.systemFont(ofSize: 16)
        taglineLabel.textColor = .secondaryLabel
        taglineLabel.textAlignment = .center
        taglineLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure text fields
        setupTextField(emailTextField, placeholder: "Email Address", keyboardType: .emailAddress)
        setupTextField(passwordTextField, placeholder: "Password", isSecure: true)
        
        // Configure buttons
        setupPrimaryButton(loginButton, title: "Login")
        setupSecondaryButton(googleSignInButton, title: "Continue with Google", icon: "person.circle.fill")
        setupOutlinedButton(registerButton, title: "Create New Account")
        
        forgotPasswordButton.setTitle("Forgot Password?", for: .normal)
        forgotPasswordButton.setTitleColor(.systemBlue, for: .normal)
        forgotPasswordButton.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        forgotPasswordButton.translatesAutoresizingMaskIntoConstraints = false
        
        joinAstrologerButton.setTitle("Join as Astrologer →", for: .normal)
        joinAstrologerButton.setTitleColor(.systemBlue, for: .normal)
        joinAstrologerButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        joinAstrologerButton.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure terms label
        termsLabel.text = "By continuing, you agree to our Terms of Service and Privacy Policy"
        termsLabel.font = UIFont.systemFont(ofSize: 12)
        termsLabel.textColor = .secondaryLabel
        termsLabel.textAlignment = .center
        termsLabel.numberOfLines = 0
        termsLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Configure loading view
        loadingView.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        loadingView.isHidden = true
        loadingView.translatesAutoresizingMaskIntoConstraints = false
        
        loadingLabel.text = "Signing you in..."
        loadingLabel.textColor = .white
        loadingLabel.font = UIFont.systemFont(ofSize: 16)
        loadingLabel.textAlignment = .center
        loadingLabel.translatesAutoresizingMaskIntoConstraints = false
        
        activityIndicator.color = .white
        activityIndicator.translatesAutoresizingMaskIntoConstraints = false
        
        // Add password toggle
        addPasswordToggle()
        
        // Add targets
        loginButton.addTarget(self, action: #selector(loginButtonTapped), for: .touchUpInside)
        googleSignInButton.addTarget(self, action: #selector(googleSignInButtonTapped), for: .touchUpInside)
        registerButton.addTarget(self, action: #selector(registerButtonTapped), for: .touchUpInside)
        forgotPasswordButton.addTarget(self, action: #selector(forgotPasswordButtonTapped), for: .touchUpInside)
        joinAstrologerButton.addTarget(self, action: #selector(joinAstrologerButtonTapped), for: .touchUpInside)
        
        // Set text field delegates
        emailTextField.delegate = self
        passwordTextField.delegate = self
    }
    
    private func setupConstraints() {
        // Add subviews
        view.addSubview(scrollView)
        scrollView.addSubview(contentView)
        
        contentView.addSubview(logoImageView)
        contentView.addSubview(welcomeLabel)
        contentView.addSubview(taglineLabel)
        contentView.addSubview(emailTextField)
        contentView.addSubview(passwordTextField)
        contentView.addSubview(forgotPasswordButton)
        contentView.addSubview(loginButton)
        contentView.addSubview(googleSignInButton)
        contentView.addSubview(registerButton)
        contentView.addSubview(joinAstrologerButton)
        contentView.addSubview(termsLabel)
        
        view.addSubview(loadingView)
        loadingView.addSubview(activityIndicator)
        loadingView.addSubview(loadingLabel)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            // Scroll view
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            // Content view
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            
            // Logo
            logoImageView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 40),
            logoImageView.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            logoImageView.widthAnchor.constraint(equalToConstant: 80),
            logoImageView.heightAnchor.constraint(equalToConstant: 80),
            
            // Welcome label
            welcomeLabel.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 32),
            welcomeLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            welcomeLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            
            // Tagline label
            taglineLabel.topAnchor.constraint(equalTo: welcomeLabel.bottomAnchor, constant: 8),
            taglineLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            taglineLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            
            // Email field
            emailTextField.topAnchor.constraint(equalTo: taglineLabel.bottomAnchor, constant: 40),
            emailTextField.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            emailTextField.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            emailTextField.heightAnchor.constraint(equalToConstant: 50),
            
            // Password field
            passwordTextField.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 16),
            passwordTextField.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            passwordTextField.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            passwordTextField.heightAnchor.constraint(equalToConstant: 50),
            
            // Forgot password button
            forgotPasswordButton.topAnchor.constraint(equalTo: passwordTextField.bottomAnchor, constant: 8),
            forgotPasswordButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            
            // Login button
            loginButton.topAnchor.constraint(equalTo: forgotPasswordButton.bottomAnchor, constant: 32),
            loginButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            loginButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            loginButton.heightAnchor.constraint(equalToConstant: 50),
            
            // Google sign in button
            googleSignInButton.topAnchor.constraint(equalTo: loginButton.bottomAnchor, constant: 24),
            googleSignInButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            googleSignInButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            googleSignInButton.heightAnchor.constraint(equalToConstant: 50),
            
            // Register button
            registerButton.topAnchor.constraint(equalTo: googleSignInButton.bottomAnchor, constant: 16),
            registerButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            registerButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            registerButton.heightAnchor.constraint(equalToConstant: 50),
            
            // Join astrologer button
            joinAstrologerButton.topAnchor.constraint(equalTo: registerButton.bottomAnchor, constant: 16),
            joinAstrologerButton.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            
            // Terms label
            termsLabel.topAnchor.constraint(equalTo: joinAstrologerButton.bottomAnchor, constant: 24),
            termsLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 32),
            termsLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -32),
            termsLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -32),
            
            // Loading view
            loadingView.topAnchor.constraint(equalTo: view.topAnchor),
            loadingView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            loadingView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            loadingView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            // Activity indicator
            activityIndicator.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            activityIndicator.centerYAnchor.constraint(equalTo: loadingView.centerYAnchor),
            
            // Loading label
            loadingLabel.topAnchor.constraint(equalTo: activityIndicator.bottomAnchor, constant: 16),
            loadingLabel.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor)
        ])
    }
    
    private func setupTextField(_ textField: UITextField, placeholder: String, keyboardType: UIKeyboardType = .default, isSecure: Bool = false) {
        textField.placeholder = placeholder
        textField.borderStyle = .roundedRect
        textField.layer.borderWidth = 1
        textField.layer.borderColor = UIColor.systemGray4.cgColor
        textField.layer.cornerRadius = 12
        textField.font = UIFont.systemFont(ofSize: 16)
        textField.keyboardType = keyboardType
        textField.isSecureTextEntry = isSecure
        textField.autocapitalizationType = .none
        textField.autocorrectionType = .no
        textField.translatesAutoresizingMaskIntoConstraints = false
        
        // Add padding
        let paddingView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 50))
        textField.leftView = paddingView
        textField.leftViewMode = .always
    }
    
    private func setupPrimaryButton(_ button: UIButton, title: String) {
        button.setTitle(title, for: .normal)
        button.backgroundColor = .systemBlue
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        button.layer.cornerRadius = 12
        button.layer.shadowColor = UIColor.systemBlue.cgColor
        button.layer.shadowOffset = CGSize(width: 0, height: 2)
        button.layer.shadowRadius = 4
        button.layer.shadowOpacity = 0.3
        button.translatesAutoresizingMaskIntoConstraints = false
    }
    
    private func setupSecondaryButton(_ button: UIButton, title: String, icon: String) {
        button.setTitle(title, for: .normal)
        button.setTitleColor(.label, for: .normal)
        button.backgroundColor = .systemBackground
        button.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor.systemGray4.cgColor
        button.layer.cornerRadius = 12
        button.translatesAutoresizingMaskIntoConstraints = false
        
        if let iconImage = UIImage(systemName: icon) {
            button.setImage(iconImage, for: .normal)
            button.tintColor = .systemRed
            button.imageEdgeInsets = UIEdgeInsets(top: 0, left: -8, bottom: 0, right: 8)
        }
    }
    
    private func setupOutlinedButton(_ button: UIButton, title: String) {
        button.setTitle(title, for: .normal)
        button.setTitleColor(.systemBlue, for: .normal)
        button.backgroundColor = .clear
        button.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
        button.layer.borderWidth = 2
        button.layer.borderColor = UIColor.systemBlue.cgColor
        button.layer.cornerRadius = 12
        button.translatesAutoresizingMaskIntoConstraints = false
    }
    
    private func addPasswordToggle() {
        let toggleButton = UIButton(type: .custom)
        toggleButton.setImage(UIImage(systemName: "eye.slash"), for: .normal)
        toggleButton.setImage(UIImage(systemName: "eye"), for: .selected)
        toggleButton.tintColor = .systemGray
        toggleButton.frame = CGRect(x: 0, y: 0, width: 44, height: 44)
        toggleButton.addTarget(self, action: #selector(togglePasswordVisibility), for: .touchUpInside)
        
        passwordTextField.rightView = toggleButton
        passwordTextField.rightViewMode = .always
    }
    
    private func setupGestures() {
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        view.addGestureRecognizer(tapGesture)
    }
    
    private func checkExistingSession() {
        let isLoggedIn = UserDefaults.standard.bool(forKey: "is_logged_in")
        let userName = UserDefaults.standard.string(forKey: "user_name")
        let authToken = UserDefaults.standard.string(forKey: "auth_token")
        
        if isLoggedIn && userName != nil && authToken != nil {
            navigateToHome()
        }
    }
    
    // MARK: - Actions
    @objc private func loginButtonTapped() {
        performLogin()
    }
    
    @objc private func googleSignInButtonTapped() {
        performGoogleSignIn()
    }
    
    @objc private func registerButtonTapped() {
        navigateToRegister()
    }
    
    @objc private func forgotPasswordButtonTapped() {
        showAlert(title: "Coming Soon", message: "Forgot password functionality will be available soon.")
    }
    
    @objc private func joinAstrologerButtonTapped() {
        navigateToAstrologerSignup()
    }
    
    @objc private func togglePasswordVisibility() {
        isPasswordVisible.toggle()
        passwordTextField.isSecureTextEntry = !isPasswordVisible
        
        if let toggleButton = passwordTextField.rightView as? UIButton {
            toggleButton.isSelected = isPasswordVisible
        }
    }
    
    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }
    
    // MARK: - Login Logic
    private func performLogin() {
        guard validateInputs() else { return }
        
        let email = emailTextField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let password = passwordTextField.text ?? ""
        
        setLoading(true)
        
        // TODO: Implement AuthService
        // For now, simulate login
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.setLoading(false)
            
            // Simulate successful login
            self.saveUserSession(name: "Demo User", email: email, role: "customer")
            self.showSuccessMessage("Login successful!")
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.navigateToHome()
            }
        }
    }
    
    private func performGoogleSignIn() {
        setLoading(true)
        
        // TODO: Implement Google Sign-In
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.setLoading(false)
            self.showAlert(title: "Coming Soon", message: "Google Sign-In will be available soon.")
        }
    }
    
    private func validateInputs() -> Bool {
        var isValid = true
        
        // Validate email
        let email = emailTextField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if email.isEmpty {
            showFieldError(for: emailTextField, message: "Email is required")
            isValid = false
        } else if !isValidEmail(email) {
            showFieldError(for: emailTextField, message: "Please enter a valid email address")
            isValid = false
        } else {
            clearFieldError(for: emailTextField)
        }
        
        // Validate password
        let password = passwordTextField.text ?? ""
        if password.isEmpty {
            showFieldError(for: passwordTextField, message: "Password is required")
            isValid = false
        } else if password.count < 6 {
            showFieldError(for: passwordTextField, message: "Password must be at least 6 characters")
            isValid = false
        } else {
            clearFieldError(for: passwordTextField)
        }
        
        return isValid
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    private func showFieldError(for textField: UITextField, message: String) {
        textField.layer.borderColor = UIColor.systemRed.cgColor
        textField.layer.borderWidth = 2
        
        // Show error message in a toast-like manner
        let alertController = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(alertController, animated: true)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            alertController.dismiss(animated: true)
        }
    }
    
    private func clearFieldError(for textField: UITextField) {
        textField.layer.borderColor = UIColor.systemGray4.cgColor
        textField.layer.borderWidth = 1
    }
    
    private func setLoading(_ loading: Bool) {
        isLoading = loading
        loadingView.isHidden = !loading
        
        if loading {
            activityIndicator.startAnimating()
        } else {
            activityIndicator.stopAnimating()
        }
        
        // Disable/enable buttons
        loginButton.isEnabled = !loading
        googleSignInButton.isEnabled = !loading
        registerButton.isEnabled = !loading
        
        // Update login button appearance
        loginButton.alpha = loading ? 0.6 : 1.0
        loginButton.setTitle(loading ? "Signing in..." : "Login", for: .normal)
    }
    
    // MARK: - Navigation
    private func navigateToHome() {
        // TODO: Navigate to HomeViewController
        showAlert(title: "Success", message: "Login successful! Home screen will be available soon.")
    }
    
    private func navigateToRegister() {
        // TODO: Navigate to SignupViewController
        showAlert(title: "Coming Soon", message: "Registration screen will be available soon.")
    }
    
    private func navigateToAstrologerSignup() {
        // TODO: Navigate to AstrologerSignupViewController
        showAlert(title: "Coming Soon", message: "Astrologer signup will be available soon.")
    }
    
    // MARK: - User Session
    private func saveUserSession(name: String, email: String, role: String) {
        UserDefaults.standard.set(true, forKey: "is_logged_in")
        UserDefaults.standard.set(name, forKey: "user_name")
        UserDefaults.standard.set(email, forKey: "user_email")
        UserDefaults.standard.set(role, forKey: "user_role")
        UserDefaults.standard.set("demo_token", forKey: "auth_token")
    }
    
    // MARK: - Helpers
    private func showSuccessMessage(_ message: String) {
        let alertController = UIAlertController(title: "Success", message: message, preferredStyle: .alert)
        alertController.view.tintColor = .systemGreen
        present(alertController, animated: true)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            alertController.dismiss(animated: true)
        }
    }
    
    private func showAlert(title: String, message: String) {
        let alertController = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alertController.addAction(UIAlertAction(title: "OK", style: .default))
        present(alertController, animated: true)
    }
}

// MARK: - UITextFieldDelegate
extension LoginViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        if textField == emailTextField {
            passwordTextField.becomeFirstResponder()
        } else if textField == passwordTextField {
            textField.resignFirstResponder()
            performLogin()
        }
        return true
    }
    
    func textFieldDidBeginEditing(_ textField: UITextField) {
        clearFieldError(for: textField)
    }
}