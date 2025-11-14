import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/app_strings.dart';
import '../common/constants/dimensions.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late PageController _pageController;
  int _currentPage = 0;

  // Title texts for each slide
  final List<String> _titles = [
    'Welcome to True Astrotalk',
    'Convenient Chat Message',
    'Easy & Secure Payments',
  ];

  // Description texts for each slide
  final List<String> _descriptions = [
    'Discover your cosmic journey with our selected, verified & experienced astrologers.',
    'Connect with our astrologers with one on one personalized chat service with our verified astrologers',
    'Make your payments with ease and peace with active and passive security with payment gateway.',
  ];

  // Lottie animation file paths
  final List<String> _animationPaths = [
    'assets/animations/intro1.json',
    'assets/animations/intro2.json',
    'assets/animations/intro3.json',
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            // Skip Button
            Padding(
              padding: const EdgeInsets.all(Dimensions.paddingMd),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _skipOnboarding,
                  child: Text(
                    AppStrings.skip,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ),
              ),
            ),

            // Page View with Slides
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _titles.length,
                itemBuilder: (context, index) {
                  return _buildOnboardingSlide(index);
                },
              ),
            ),

            // Bottom Section with Indicators and Navigation
            Padding(
              padding: const EdgeInsets.all(Dimensions.paddingLg),
              child: Column(
                children: [
                  // Page Indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _titles.length,
                      (index) => _buildPageIndicator(index),
                    ),
                  ),

                  const SizedBox(height: Dimensions.spacingXl),

                  // Navigation Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Previous Button
                      if (_currentPage > 0)
                        TextButton(
                          onPressed: _previousPage,
                          child: Text(
                            AppStrings.previous,
                            style: AppTextStyles.buttonMedium.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        )
                      else
                        const SizedBox(width: 80), // Placeholder for spacing

                      // Next/Get Started Button
                      ElevatedButton(
                        onPressed: _isLastPage ? _finishOnboarding : _nextPage,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(120, Dimensions.buttonHeightMd),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(Dimensions.radiusLg),
                          ),
                        ),
                        child: Text(
                          _isLastPage ? 'Get Started' : AppStrings.next,
                          style: AppTextStyles.buttonMedium,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOnboardingSlide(int index) {
    return Padding(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Lottie Animation
          Flexible(
            flex: 3,
            child: SizedBox(
              height: 250,
              child: Lottie.asset(
                _animationPaths[index],
                fit: BoxFit.contain,
                repeat: true,
                animate: _currentPage == index, // Only animate current page
                frameRate: FrameRate(30), // Limit frame rate to reduce buffer usage
              ),
            ),
          ),

          const SizedBox(height: Dimensions.spacingLg),

          // Title
          Flexible(
            flex: 1,
            child: Text(
              _titles[index],
              style: AppTextStyles.heading3.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          const SizedBox(height: Dimensions.spacingMd),

          // Description
          Flexible(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingMd),
              child: Text(
                _descriptions[index],
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textSecondaryLight,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPageIndicator(int index) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: Dimensions.spacingXs),
      width: _currentPage == index ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: _currentPage == index ? AppColors.primary : AppColors.grey300,
        borderRadius: BorderRadius.circular(Dimensions.radiusXs),
      ),
    );
  }

  bool get _isLastPage => _currentPage == _titles.length - 1;

  void _nextPage() {
    if (_currentPage < _titles.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _skipOnboarding() {
    _finishOnboarding();
  }

  void _finishOnboarding() async {
    // Mark onboarding as completed in shared preferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_completed', true);

    // Navigate to welcome screen
    // Note: Dependencies are already initialized in splash screen
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/welcome');
    }
  }
}