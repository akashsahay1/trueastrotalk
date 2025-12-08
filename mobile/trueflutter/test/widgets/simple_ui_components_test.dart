import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Simple UI Components Tests', () {
    group('Custom Button Component', () {
      testWidgets('should render custom button with text and onPressed', (WidgetTester tester) async {
        bool buttonPressed = false;

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: CustomButton(
                text: 'Test Button',
                onPressed: () => buttonPressed = true,
              ),
            ),
          ),
        );

        expect(find.text('Test Button'), findsOneWidget);
        expect(find.byType(ElevatedButton), findsOneWidget);

        await tester.tap(find.byType(ElevatedButton));
        await tester.pump();

        expect(buttonPressed, true);
      });

      testWidgets('should handle disabled state', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: CustomButton(
                text: 'Disabled Button',
                onPressed: null,
              ),
            ),
          ),
        );

        expect(find.text('Disabled Button'), findsOneWidget);
        final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
        expect(button.onPressed, isNull);
      });

      testWidgets('should display loading state', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: CustomButton(
                text: 'Loading Button',
                onPressed: () {},
                isLoading: true,
              ),
            ),
          ),
        );

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      });
    });

    group('Rating Widget', () {
      testWidgets('should display correct number of stars', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: RatingWidget(rating: 4.5),
            ),
          ),
        );

        // Should have 5 star icons
        expect(find.byIcon(Icons.star), findsNWidgets(4));
        expect(find.byIcon(Icons.star_half), findsNWidgets(1));
      });

      testWidgets('should handle zero rating', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: RatingWidget(rating: 0.0),
            ),
          ),
        );

        // Should have 5 empty star icons
        expect(find.byIcon(Icons.star_border), findsNWidgets(5));
      });

      testWidgets('should handle maximum rating', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: RatingWidget(rating: 5.0),
            ),
          ),
        );

        // Should have 5 filled star icons
        expect(find.byIcon(Icons.star), findsNWidgets(5));
      });
    });

    group('Avatar Widget', () {
      testWidgets('should display initials when no image provided', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: AvatarWidget(
                name: 'John Doe',
              ),
            ),
          ),
        );

        expect(find.text('JD'), findsOneWidget);
        expect(find.byType(CircleAvatar), findsOneWidget);
      });

      testWidgets('should display image when provided', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: AvatarWidget(
                name: 'John Doe',
                imageUrl: 'https://example.com/avatar.jpg',
              ),
            ),
          ),
        );

        expect(find.byType(CircleAvatar), findsOneWidget);
        expect(find.byType(NetworkImage), findsOneWidget);
      });

      testWidgets('should handle different sizes', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: Column(
                children: [
                  AvatarWidget(name: 'John Doe', size: 30),
                  AvatarWidget(name: 'Jane Smith', size: 60),
                ],
              ),
            ),
          ),
        );

        final avatars = tester.widgetList<CircleAvatar>(find.byType(CircleAvatar));
        expect(avatars.length, 2);
      });
    });

    group('Price Display Widget', () {
      testWidgets('should format price correctly', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: PriceDisplayWidget(price: 299.99),
            ),
          ),
        );

        expect(find.textContaining('₹299.99'), findsOneWidget);
      });

      testWidgets('should display discount price with strikethrough', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: PriceDisplayWidget(
                price: 299.99,
                originalPrice: 399.99,
              ),
            ),
          ),
        );

        expect(find.textContaining('₹299.99'), findsOneWidget);
        expect(find.textContaining('₹399.99'), findsOneWidget);
      });

      testWidgets('should show discount percentage', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: PriceDisplayWidget(
                price: 200.0,
                originalPrice: 250.0,
                showDiscount: true,
              ),
            ),
          ),
        );

        expect(find.textContaining('20% OFF'), findsOneWidget);
      });
    });

    group('Status Badge Widget', () {
      testWidgets('should display online status', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: StatusBadgeWidget(
                status: 'online',
                text: 'Online',
              ),
            ),
          ),
        );

        expect(find.text('Online'), findsOneWidget);
        expect(find.byType(Container), findsWidgets);
      });

      testWidgets('should display offline status', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: StatusBadgeWidget(
                status: 'offline',
                text: 'Offline',
              ),
            ),
          ),
        );

        expect(find.text('Offline'), findsOneWidget);
      });

      testWidgets('should display busy status', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: StatusBadgeWidget(
                status: 'busy',
                text: 'Busy',
              ),
            ),
          ),
        );

        expect(find.text('Busy'), findsOneWidget);
      });
    });

    group('Loading Widget', () {
      testWidgets('should display loading spinner with message', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: LoadingWidget(message: 'Loading...'),
            ),
          ),
        );

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
        expect(find.text('Loading...'), findsOneWidget);
      });

      testWidgets('should display loading spinner without message', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: LoadingWidget(),
            ),
          ),
        );

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
        expect(find.text('Loading...'), findsNothing);
      });
    });

    group('Empty State Widget', () {
      testWidgets('should display empty state with icon and message', (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: EmptyStateWidget(
                icon: Icons.inbox,
                title: 'No Items',
                message: 'There are no items to display',
              ),
            ),
          ),
        );

        expect(find.byIcon(Icons.inbox), findsOneWidget);
        expect(find.text('No Items'), findsOneWidget);
        expect(find.text('There are no items to display'), findsOneWidget);
      });

      testWidgets('should display empty state with action button', (WidgetTester tester) async {
        bool actionPressed = false;

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: EmptyStateWidget(
                icon: Icons.add,
                title: 'No Products',
                message: 'Add your first product',
                actionText: 'Add Product',
                onAction: () => actionPressed = true,
              ),
            ),
          ),
        );

        expect(find.text('Add Product'), findsOneWidget);
        
        await tester.tap(find.text('Add Product'));
        await tester.pump();

        expect(actionPressed, true);
      });
    });
  });
}

// Simple widget components for testing
class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(text),
    );
  }
}

class RatingWidget extends StatelessWidget {
  final double rating;
  final double maxRating;

  const RatingWidget({
    super.key,
    required this.rating,
    this.maxRating = 5.0,
  });

  @override
  Widget build(BuildContext context) {
    List<Widget> stars = [];
    
    for (int i = 0; i < maxRating.floor(); i++) {
      if (i < rating.floor()) {
        stars.add(const Icon(Icons.star, color: Colors.amber));
      } else if (i == rating.floor() && rating % 1 != 0) {
        stars.add(const Icon(Icons.star_half, color: Colors.amber));
      } else {
        stars.add(const Icon(Icons.star_border, color: Colors.grey));
      }
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: stars,
    );
  }
}

class AvatarWidget extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final double size;

  const AvatarWidget({
    super.key,
    required this.name,
    this.imageUrl,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final initials = name.split(' ')
        .map((word) => word.isNotEmpty ? word[0].toUpperCase() : '')
        .take(2)
        .join('');

    return CircleAvatar(
      radius: size / 2,
      backgroundImage: imageUrl != null ? NetworkImage(imageUrl!) : null,
      backgroundColor: Colors.blue,
      child: imageUrl == null
          ? Text(
              initials,
              style: TextStyle(
                color: Colors.white,
                fontSize: size / 3,
                fontWeight: FontWeight.bold,
              ),
            )
          : null,
    );
  }
}

class PriceDisplayWidget extends StatelessWidget {
  final double price;
  final double? originalPrice;
  final bool showDiscount;

  const PriceDisplayWidget({
    super.key,
    required this.price,
    this.originalPrice,
    this.showDiscount = false,
  });

  @override
  Widget build(BuildContext context) {
    final hasDiscount = originalPrice != null && originalPrice! > price;
    final discountPercentage = hasDiscount
        ? ((originalPrice! - price) / originalPrice! * 100).round()
        : 0;

    return Row(
      children: [
        Text(
          '₹${price.toStringAsFixed(2)}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
        if (hasDiscount) ...[
          const SizedBox(width: 8),
          Text(
            '₹${originalPrice!.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 14,
              decoration: TextDecoration.lineThrough,
              color: Colors.grey,
            ),
          ),
        ],
        if (showDiscount && hasDiscount) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.red,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '$discountPercentage% OFF',
              style: const TextStyle(
                fontSize: 12,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class StatusBadgeWidget extends StatelessWidget {
  final String status;
  final String text;

  const StatusBadgeWidget({
    super.key,
    required this.status,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor = Colors.white;

    switch (status.toLowerCase()) {
      case 'online':
        backgroundColor = Colors.green;
        break;
      case 'offline':
        backgroundColor = Colors.grey;
        break;
      case 'busy':
        backgroundColor = Colors.orange;
        break;
      default:
        backgroundColor = Colors.blue;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class LoadingWidget extends StatelessWidget {
  final String? message;

  const LoadingWidget({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: const TextStyle(fontSize: 16),
            ),
          ],
        ],
      ),
    );
  }
}

class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionText;
  final VoidCallback? onAction;

  const EmptyStateWidget({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionText,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            if (actionText != null && onAction != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionText!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}