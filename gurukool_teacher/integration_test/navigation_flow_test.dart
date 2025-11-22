import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:gurukool_teacher/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Navigation Flow E2E Tests', () {
    testWidgets('App initializes and shows login screen',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify LoginScreen is displayed
      expect(find.text('GuruKool Teacher'), findsOneWidget);
      expect(find.text('Sign in to continue'), findsOneWidget);
    });

    testWidgets('Back navigation from Forgot Password works',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Forgot Password
      final forgotPasswordButton = find.text('Forgot Password?');
      if (forgotPasswordButton.evaluate().isNotEmpty) {
        await tester.tap(forgotPasswordButton);
        await tester.pumpAndSettle();

        // Try to go back
        final backButton = find.byType(BackButton);
        if (backButton.evaluate().isNotEmpty) {
          await tester.tap(backButton);
          await tester.pumpAndSettle();

          // Should be back at login screen
          expect(find.text('Sign In'), findsOneWidget);
        }
      }
    });

    testWidgets('Demo account info is displayed',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify demo account info is shown
      expect(find.text('Demo Account'), findsOneWidget);
      expect(find.text('Use demo teacher account for testing'), findsOneWidget);
    });
  });
}
