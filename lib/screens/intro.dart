import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:lottie/lottie.dart';

class Intro extends StatefulWidget {
  const Intro({super.key});

  @override
  State<Intro> createState() => _OnboardingSliderState();
}

class _OnboardingSliderState extends State<Intro> with SingleTickerProviderStateMixin {
  final PageController _pageController = PageController();
  late AnimationController _animationController;
  int _currentPage = 0;

  // Theme colors
  final Color _primaryColor = const Color(0xFFFFE70D);
  final Color _textDarkColor = Colors.black87;
  final Color _textLightColor = Colors.black54;

  // List of background colors for each slide
  final List<Color> _bgColors = [
    const Color.fromARGB(255, 255, 255, 255),
    const Color.fromARGB(255, 255, 255, 255),
    const Color.fromARGB(255, 255, 255, 255),
  ];

  // Sample Lottie animation URLs - replace with your actual assets
  final List<String> _lottieAnimations = [
    'assets/lotties/intro.json',
    'assets/lotties/intro.json',
    'assets/lotties/intro.json',
  ];

  // Title texts for each slide
  final List<String> _titles = [
    'Welcome to True Astrotalk',
    'Explore Cosmic Insights',
    'Explore Cosmic Insights',
  ];

  // Description texts for each slide
  final List<String> _descriptions = [
    'Discover your cosmic journey with expert astrologers',
    'Get personalized readings and daily horoscopes from verified astrologers',
    'Connect with your spiritual side and find guidance for your life path',
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _goToNextPage() {
    _pageController.nextPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
    );
  }

  void _goToPreviousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
    );
  }

  void _goToSignup() async {
    // Play a quick animation
    await _animationController.forward();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('first_launch', false);
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/signup');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          color: _bgColors[_currentPage],
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Skip button (only show on first two pages)
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.only(top: 16, right: 16),
                  child: AnimatedOpacity(
                    opacity: _currentPage < 2 ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 300),
                    child: TextButton(
                      onPressed: _currentPage < 2 ? _goToSignup : null,
                      child: Text(
                        'Skip',
                        style: TextStyle(
                          color: _textLightColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // PageView for swipeable content
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: 3,
                  onPageChanged: (index) {
                    setState(() {
                      _currentPage = index;
                    });
                  },
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Lottie Animation
                          Hero(
                            tag: 'intro_animation',
                            child: Lottie.asset(
                              _lottieAnimations[index],
                              width: 300,
                              height: 300,
                              fit: BoxFit.contain,
                            ),
                          ),

                          const SizedBox(height: 30),

                          // Title with shadow for depth
                          Text(
                            _titles[index],
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: _textDarkColor,
                              letterSpacing: 0.5,
                              shadows: [
                                Shadow(
                                  blurRadius: 2.0,
                                  color: Colors.black.withValues(alpha: 0.1),
                                  offset: const Offset(1.0, 1.0),
                                ),
                              ],
                            ),
                            textAlign: TextAlign.center,
                          ),

                          const SizedBox(height: 20),

                          // Description with slightly larger text
                          Text(
                            _descriptions[index],
                            style: TextStyle(
                              fontSize: 17,
                              color: _textLightColor,
                              height: 1.3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Fixed bottom section with indicators and buttons
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 30),
                child: Column(
                  children: [
                    // Page Indicators with animated effect
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        3,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 6),
                          width: i == _currentPage ? 20 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            color: i == _currentPage ? _primaryColor : Colors.grey.withValues(alpha: 0.5),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 30),

                    // Fixed position buttons that change based on current page
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      transitionBuilder: (Widget child, Animation<double> animation) {
                        return FadeTransition(
                          opacity: animation,
                          child: child,
                        );
                      },
                      child: _currentPage == 0
                          // First page - Get Started button
                          ? _buildPrimaryButton(
                              key: const ValueKey('get_started'),
                              label: 'Get Started',
                              onPressed: _goToNextPage,
                              width: 220,
                            )
                          : _currentPage == 1
                              // Second page - Previous and Next buttons
                              ? Row(
                                  key: const ValueKey('prev_next'),
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    _buildSecondaryButton(
                                      label: 'Back',
                                      icon: Icons.arrow_back_rounded,
                                      onPressed: _goToPreviousPage,
                                      width: 130,
                                    ),
                                    const SizedBox(width: 20),
                                    _buildPrimaryButton(
                                      label: 'Next',
                                      icon: Icons.arrow_forward_rounded,
                                      onPressed: _goToNextPage,
                                      width: 130,
                                    ),
                                  ],
                                )
                              // Third page - Previous and Signup buttons
                              : Row(
                                  key: const ValueKey('prev_signup'),
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    _buildSecondaryButton(
                                      label: 'Back',
                                      icon: Icons.arrow_back_rounded,
                                      onPressed: _goToPreviousPage,
                                      width: 130,
                                    ),
                                    const SizedBox(width: 20),
                                    _buildPrimaryButton(
                                      label: 'Sign Up',
                                      onPressed: _goToSignup,
                                      width: 160,
                                      icon: Icons.arrow_forward_rounded,
                                    ),
                                  ],
                                ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Enhanced primary button with optional icon
  Widget _buildPrimaryButton({
    Key? key,
    required String label,
    required VoidCallback onPressed,
    double width = 220,
    IconData? icon,
  }) {
    return SizedBox(
      key: key,
      width: width,
      height: 50,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryColor,
          foregroundColor: Colors.black,
          elevation: 3,
          shadowColor: _primaryColor.withValues(alpha: .5),
          padding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 12,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            if (icon != null) ...[
              const SizedBox(width: 8),
              Icon(icon, size: 18),
            ],
          ],
        ),
      ),
    );
  }

  // Secondary button with lighter style
  Widget _buildSecondaryButton({
    required String label,
    required VoidCallback onPressed,
    double width = 220,
    IconData? icon,
  }) {
    return SizedBox(
      width: width,
      height: 50,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryColor,
          foregroundColor: Colors.black87,
          elevation: 2,
          shadowColor: Colors.grey.withValues(alpha: 0.3),
          side: BorderSide(
            color: _primaryColor.withValues(alpha: 0.5),
            width: 1.5,
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: _textDarkColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
