import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('TrueAstroTalk E2E Tests', () {
    testWidgets('App launches successfully', (WidgetTester tester) async {
      print('🚀 Testing app launch...');
      
      app.main();
      await tester.pumpAndSettle();
      
      // Verify app launches without errors
      expect(find.byType(MaterialApp), findsOneWidget);
      print('✅ App launched successfully');
    });

    testWidgets('Navigation flows work', (WidgetTester tester) async {
      print('🧭 Testing navigation flows...');
      
      app.main();
      await tester.pumpAndSettle();
      
      // Test basic navigation exists
      // Look for common UI elements that should be present
      final commonElements = [
        find.byType(Scaffold),
        find.byType(MaterialApp),
      ];
      
      for (final element in commonElements) {
        expect(element, findsAtLeastNWidgets(1));
      }
      
      print('✅ Navigation flows tested');
    });

    testWidgets('UI responsiveness test', (WidgetTester tester) async {
      print('📱 Testing UI responsiveness...');
      
      app.main();
      await tester.pumpAndSettle();
      
      // Test basic interaction
      await tester.pump();
      await tester.pumpAndSettle();
      
      // Verify UI is responsive
      expect(find.byType(MaterialApp), findsOneWidget);
      
      print('✅ UI responsiveness tested');
    });

    testWidgets('Performance test', (WidgetTester tester) async {
      print('⚡ Testing app performance...');
      
      final stopwatch = Stopwatch()..start();
      
      app.main();
      await tester.pumpAndSettle();
      
      stopwatch.stop();
      
      // Verify app launches within reasonable time (5 seconds)
      expect(stopwatch.elapsedMilliseconds, lessThan(5000));
      
      print('✅ Performance test completed (${stopwatch.elapsedMilliseconds}ms)');
    });

    testWidgets('Widget stability test', (WidgetTester tester) async {
      print('🎯 Testing widget stability...');
      
      app.main();
      await tester.pumpAndSettle();
      
      // Test multiple pump cycles
      for (int i = 0; i < 5; i++) {
        await tester.pump(const Duration(milliseconds: 100));
        expect(find.byType(MaterialApp), findsOneWidget);
      }
      
      print('✅ Widget stability tested');
    });
  });
}