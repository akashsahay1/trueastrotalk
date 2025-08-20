import UIKit

class SplashViewController: UIViewController {
    
    // MARK: - IBOutlets
    @IBOutlet weak var logoContainerView: UIView!
    @IBOutlet weak var logoImageView: UIImageView!
    @IBOutlet weak var appNameLabel: UILabel!
    @IBOutlet weak var taglineLabel: UILabel!
    @IBOutlet weak var progressContainerView: UIView!
    @IBOutlet weak var progressLabel: UILabel!
    
    // MARK: - Properties
    private let splashDuration: TimeInterval = 3.0
    private let progressDuration: TimeInterval = 2.5
    private var circularProgressLayer: CAShapeLayer!
    private var progressBackgroundLayer: CAShapeLayer!
    private var progressTimer: Timer?
    private var currentProgress: Float = 0.0
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        initializeAnimations()
        // Progress setup will be called in viewDidLayoutSubviews
        navigateToNextScreen()
    }
    
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    // MARK: - Setup
    private func setupUI() {
        // Set background color
        view.backgroundColor = UIColor(named: "PrimaryColor")
        
        // Configure logo container
        logoContainerView.backgroundColor = .white
        logoContainerView.layer.cornerRadius = 20
        logoContainerView.layer.shadowColor = UIColor.black.cgColor
        logoContainerView.layer.shadowOffset = CGSize(width: 0, height: 10)
        logoContainerView.layer.shadowRadius = 20
        logoContainerView.layer.shadowOpacity = 0.2
        
        // Configure logo image
        logoImageView.image = UIImage(named: "logo")
        logoImageView.contentMode = .scaleAspectFit
        
        // Configure app name label
        appNameLabel.text = "True Astrotalk"
        appNameLabel.textColor = .white
        appNameLabel.font = UIFont.boldSystemFont(ofSize: 28)
        appNameLabel.textAlignment = .center
        
        // Configure tagline label
        taglineLabel.text = "Your trusted platform for astrology consultations"
        taglineLabel.textColor = UIColor.white.withAlphaComponent(0.9)
        taglineLabel.font = UIFont.systemFont(ofSize: 16)
        taglineLabel.textAlignment = .center
        taglineLabel.numberOfLines = 0
        
        // Configure progress label
        progressLabel.text = "0%"
        progressLabel.textColor = .white
        progressLabel.font = UIFont.boldSystemFont(ofSize: 14)
        progressLabel.textAlignment = .center
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        if circularProgressLayer == nil {
            setupCircularProgress()
            startProgressAnimation()
        }
    }
    
    private func setupCircularProgress() {
        let center = CGPoint(x: progressContainerView.bounds.midX, y: progressContainerView.bounds.midY)
        let radius: CGFloat = 35
        let lineWidth: CGFloat = 4
        
        // Background circle
        progressBackgroundLayer = CAShapeLayer()
        let backgroundPath = UIBezierPath(arcCenter: center, radius: radius, startAngle: 0, endAngle: 2 * .pi, clockwise: true)
        progressBackgroundLayer.path = backgroundPath.cgPath
        progressBackgroundLayer.strokeColor = UIColor.white.withAlphaComponent(0.3).cgColor
        progressBackgroundLayer.lineWidth = lineWidth
        progressBackgroundLayer.fillColor = UIColor.clear.cgColor
        progressContainerView.layer.addSublayer(progressBackgroundLayer)
        
        // Progress circle
        circularProgressLayer = CAShapeLayer()
        let progressPath = UIBezierPath(arcCenter: center, radius: radius, startAngle: -.pi/2, endAngle: 1.5 * .pi, clockwise: true)
        circularProgressLayer.path = progressPath.cgPath
        circularProgressLayer.strokeColor = UIColor.white.cgColor
        circularProgressLayer.lineWidth = lineWidth
        circularProgressLayer.fillColor = UIColor.clear.cgColor
        circularProgressLayer.lineCap = .round
        circularProgressLayer.strokeEnd = 0.0
        progressContainerView.layer.addSublayer(circularProgressLayer)
    }
    
    private func initializeAnimations() {
        // Set initial states for animations
        logoContainerView.alpha = 0
        logoContainerView.transform = CGAffineTransform(scaleX: 0.3, y: 0.3)
        appNameLabel.alpha = 0
        taglineLabel.alpha = 0
        progressContainerView.alpha = 0
        
        // Animate logo container with scale and fade
        UIView.animate(withDuration: 1.0, delay: 0, usingSpringWithDamping: 0.6, initialSpringVelocity: 0.5, options: .curveEaseOut) {
            self.logoContainerView.alpha = 1
            self.logoContainerView.transform = .identity
        }
        
        // Animate text elements
        UIView.animate(withDuration: 1.0, delay: 0.4, options: .curveEaseInOut) {
            self.appNameLabel.alpha = 1
            self.taglineLabel.alpha = 1
        }
        
        // Animate progress container
        UIView.animate(withDuration: 0.8, delay: 0.5, options: .curveEaseInOut) {
            self.progressContainerView.alpha = 1
        }
    }
    
    private func startProgressAnimation() {
        let updateInterval: TimeInterval = 0.02
        let incrementPerUpdate = Float(100.0 / (progressDuration / updateInterval))
        
        progressTimer = Timer.scheduledTimer(withTimeInterval: updateInterval, repeats: true) { _ in
            self.currentProgress += incrementPerUpdate
            
            if self.currentProgress >= 100.0 {
                self.currentProgress = 100.0
                self.progressTimer?.invalidate()
            }
            
            DispatchQueue.main.async {
                self.updateProgress(self.currentProgress)
            }
        }
    }
    
    private func updateProgress(_ progress: Float) {
        let progressPercentage = progress / 100.0
        circularProgressLayer.strokeEnd = CGFloat(progressPercentage)
        progressLabel.text = "\(Int(progress))%"
    }
    
    private func navigateToNextScreen() {
        DispatchQueue.main.asyncAfter(deadline: .now() + splashDuration) {
            // Check if this is first time user
            let userDefaults = UserDefaults.standard
            let isFirstTime = !userDefaults.bool(forKey: "onboarding_completed")
            
            if isFirstTime {
                self.performSegue(withIdentifier: "showOnboarding", sender: nil)
            } else {
                // TODO: Check authentication and navigate accordingly
                self.performSegue(withIdentifier: "showLogin", sender: nil)
            }
        }
    }
    
    // MARK: - Navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "showOnboarding" {
            // Configure transition if needed
        } else if segue.identifier == "showLogin" {
            // Configure transition if needed
        }
    }
    
    deinit {
        progressTimer?.invalidate()
    }
}