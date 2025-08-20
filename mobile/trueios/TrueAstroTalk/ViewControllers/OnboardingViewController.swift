import UIKit
import Lottie

class OnboardingViewController: UIViewController {
    
    // MARK: - IBOutlets
    @IBOutlet weak var skipButton: UIButton!
    @IBOutlet weak var pageControl: UIPageControl!
    @IBOutlet weak var collectionView: UICollectionView!
    @IBOutlet weak var previousButton: UIButton!
    @IBOutlet weak var nextButton: UIButton!
    
    // MARK: - Properties
    private var currentPage = 0
    private let onboardingItems: [OnboardingItem] = [
        OnboardingItem(
            title: "Welcome to True Astrotalk",
            description: "Discover your cosmic journey with our selected, verified & experienced astrologers.",
            animationName: "onboarding_1"
        ),
        OnboardingItem(
            title: "Convenient Chat Message",
            description: "Connect with our astrologers with one on one personalized chat service with our verified astrologers",
            animationName: "onboarding_2"
        ),
        OnboardingItem(
            title: "Easy & Secure Payments",
            description: "Make your payments with ease and peace with active and passive security with payment gateway.",
            animationName: "onboarding_3"
        )
    ]
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupCollectionView()
        updateUI(for: 0)
    }
    
    // MARK: - Setup
    private func setupUI() {
        view.backgroundColor = UIColor.systemBackground
        
        // Setup skip button
        skipButton.setTitle("Skip", for: .normal)
        skipButton.setTitleColor(.systemGray, for: .normal)
        skipButton.titleLabel?.font = UIFont.systemFont(ofSize: 16)
        
        // Setup page control
        pageControl.numberOfPages = onboardingItems.count
        pageControl.currentPage = 0
        pageControl.pageIndicatorTintColor = UIColor.systemGray4
        pageControl.currentPageIndicatorTintColor = UIColor.systemBlue
        
        // Setup buttons
        previousButton.setTitle("Previous", for: .normal)
        previousButton.setTitleColor(.systemGray, for: .normal)
        previousButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        previousButton.isHidden = true
        
        nextButton.setTitle("Next", for: .normal)
        nextButton.setTitleColor(.white, for: .normal)
        nextButton.backgroundColor = UIColor.systemBlue
        nextButton.layer.cornerRadius = 16
        nextButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        nextButton.contentEdgeInsets = UIEdgeInsets(top: 12, left: 24, bottom: 12, right: 24)
    }
    
    private func setupCollectionView() {
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.isPagingEnabled = true
        collectionView.showsHorizontalScrollIndicator = false
        
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.minimumLineSpacing = 0
        layout.minimumInteritemSpacing = 0
        collectionView.collectionViewLayout = layout
        
        collectionView.register(OnboardingCollectionViewCell.self, forCellWithReuseIdentifier: "OnboardingCell")
    }
    
    private func updateUI(for page: Int) {
        currentPage = page
        pageControl.currentPage = page
        
        // Update button visibility and text
        previousButton.isHidden = page == 0
        
        let isLastPage = page == onboardingItems.count - 1
        nextButton.setTitle(isLastPage ? "Get Started" : "Next", for: .normal)
    }
    
    // MARK: - Actions
    @IBAction func skipButtonTapped(_ sender: UIButton) {
        finishOnboarding()
    }
    
    @IBAction func previousButtonTapped(_ sender: UIButton) {
        if currentPage > 0 {
            let indexPath = IndexPath(item: currentPage - 1, section: 0)
            collectionView.scrollToItem(at: indexPath, at: .centeredHorizontally, animated: true)
        }
    }
    
    @IBAction func nextButtonTapped(_ sender: UIButton) {
        if currentPage < onboardingItems.count - 1 {
            let indexPath = IndexPath(item: currentPage + 1, section: 0)
            collectionView.scrollToItem(at: indexPath, at: .centeredHorizontally, animated: true)
        } else {
            finishOnboarding()
        }
    }
    
    private func finishOnboarding() {
        // Mark onboarding as completed
        UserDefaults.standard.set(true, forKey: "onboarding_completed")
        
        // Navigate to login screen
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        if let loginVC = storyboard.instantiateViewController(withIdentifier: "LoginViewController") as? LoginViewController {
            let navController = UINavigationController(rootViewController: loginVC)
            navController.modalPresentationStyle = .fullScreen
            present(navController, animated: true) {
                // Remove onboarding from navigation stack
                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                   let window = windowScene.windows.first {
                    window.rootViewController = navController
                }
            }
        }
    }
}

// MARK: - UICollectionViewDataSource
extension OnboardingViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return onboardingItems.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "OnboardingCell", for: indexPath) as! OnboardingCollectionViewCell
        cell.configure(with: onboardingItems[indexPath.item])
        return cell
    }
}

// MARK: - UICollectionViewDelegateFlowLayout
extension OnboardingViewController: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        return collectionView.bounds.size
    }
}

// MARK: - UIScrollViewDelegate
extension OnboardingViewController: UIScrollViewDelegate {
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        let page = Int(scrollView.contentOffset.x / scrollView.frame.width)
        updateUI(for: page)
    }
}

// MARK: - OnboardingItem
struct OnboardingItem {
    let title: String
    let description: String
    let animationName: String
}