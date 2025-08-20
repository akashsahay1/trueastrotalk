import UIKit
import Lottie

class OnboardingCollectionViewCell: UICollectionViewCell {
    
    // MARK: - UI Components
    private let animationView = LottieAnimationView()
    private let titleLabel = UILabel()
    private let descriptionLabel = UILabel()
    private let stackView = UIStackView()
    
    // MARK: - Initialization
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }
    
    // MARK: - Setup
    private func setupUI() {
        contentView.backgroundColor = UIColor.systemBackground
        
        // Setup animation view
        animationView.contentMode = .scaleAspectFit
        animationView.loopMode = .loop
        animationView.translatesAutoresizingMaskIntoConstraints = false
        
        // Setup title label
        titleLabel.textAlignment = .center
        titleLabel.font = UIFont.systemFont(ofSize: 24, weight: .bold)
        titleLabel.textColor = .label
        titleLabel.numberOfLines = 0
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Setup description label
        descriptionLabel.textAlignment = .center
        descriptionLabel.font = UIFont.systemFont(ofSize: 18)
        descriptionLabel.textColor = .secondaryLabel
        descriptionLabel.numberOfLines = 0
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Setup stack view
        stackView.axis = .vertical
        stackView.alignment = .center
        stackView.distribution = .equalSpacing
        stackView.spacing = 32
        stackView.translatesAutoresizingMaskIntoConstraints = false
        
        // Add subviews
        contentView.addSubview(stackView)
        stackView.addArrangedSubview(animationView)
        stackView.addArrangedSubview(titleLabel)
        stackView.addArrangedSubview(descriptionLabel)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            stackView.leadingAnchor.constraint(greaterThanOrEqualTo: contentView.leadingAnchor, constant: 24),
            stackView.trailingAnchor.constraint(lessThanOrEqualTo: contentView.trailingAnchor, constant: -24),
            
            animationView.widthAnchor.constraint(equalToConstant: 300),
            animationView.heightAnchor.constraint(equalToConstant: 300),
            
            titleLabel.leadingAnchor.constraint(greaterThanOrEqualTo: contentView.leadingAnchor, constant: 24),
            titleLabel.trailingAnchor.constraint(lessThanOrEqualTo: contentView.trailingAnchor, constant: -24),
            
            descriptionLabel.leadingAnchor.constraint(greaterThanOrEqualTo: contentView.leadingAnchor, constant: 24),
            descriptionLabel.trailingAnchor.constraint(lessThanOrEqualTo: contentView.trailingAnchor, constant: -24)
        ])
    }
    
    // MARK: - Configuration
    func configure(with item: OnboardingItem) {
        titleLabel.text = item.title
        descriptionLabel.text = item.description
        
        // Load animation from Resources/Animations folder
        if let animationPath = Bundle.main.path(forResource: item.animationName, ofType: "json", inDirectory: "Resources/Animations"),
           let animation = LottieAnimation.filepath(animationPath) {
            animationView.animation = animation
            animationView.play()
        } else if let animation = LottieAnimation.named(item.animationName) {
            // Fallback to default bundle location
            animationView.animation = animation
            animationView.play()
        } else {
            // Hide animation view if animation not found
            animationView.isHidden = true
            print("Warning: Animation \(item.animationName) not found")
        }
    }
    
    override func prepareForReuse() {
        super.prepareForReuse()
        animationView.stop()
        animationView.isHidden = false
    }
}