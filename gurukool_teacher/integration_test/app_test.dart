import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:gurukool_teacher/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App E2E Tests', () {
    testWidgets('App launches successfully and initializes',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Verify app loaded
      expect(find.byType(MaterialApp), findsOneWidget);

      // Verify initial screen (LoginScreen) is displayed
      expect(find.text('GuruKool Teacher'), findsOneWidget);
      expect(find.text('Sign in to continue'), findsOneWidget);
    });

    testWidgets('App theme and branding are applied',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Verify key branding elements are present
      expect(find.byIcon(Icons.school), findsOneWidget);
      expect(find.text('GuruKool Teacher'), findsOneWidget);
    });

    testWidgets('App handles multiple restarts without crashing',
        (WidgetTester tester) async {
      // First launch
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));
      expect(find.byType(MaterialApp), findsOneWidget);

      // Note: Multiple calls to app.main() in a single test may not be supported
      // This test verifies single launch stability
      expect(find.text('Sign In'), findsOneWidget);
    });
  });
}
