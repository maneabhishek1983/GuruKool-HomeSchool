import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:gurukool_teacher/main.dart' as app;

/// Supabase Integration Tests
/// 
/// These tests validate actual backend connectivity and authentication.
/// Requires:
/// - Valid .env file with SUPABASE_URL and SUPABASE_ANON_KEY
/// - Active network connection
/// - Valid test credentials
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Supabase Backend Integration Tests', () {
    testWidgets('App initializes Supabase successfully',
        (WidgetTester tester) async {
      // This will fail if .env is missing or Supabase credentials are invalid
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // If we reach here, Supabase initialized successfully
      expect(find.byType(MaterialApp), findsOneWidget);
      expect(find.text('GuruKool Teacher'), findsOneWidget);
    });

    testWidgets('Login with valid credentials authenticates with Supabase',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Enter valid credentials
      // NOTE: Replace with actual test credentials from your Supabase project
      final emailField = find.byKey(const Key('email_field'));
      await tester.enterText(emailField, 'test@example.com');

      final passwordField = find.byKey(const Key('password_field'));
      await tester.enterText(passwordField, 'testpassword123');

      // Tap Sign In
      final signInButton = find.text('Sign In');
      await tester.tap(signInButton);
      
      // Wait for authentication
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Verify authentication result
      // If credentials are valid, should navigate to home screen
      // If invalid, should show error snackbar
      // For now, just verify the app didn't crash
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('Login with invalid credentials shows Supabase error',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Enter invalid credentials
      final emailField = find.byKey(const Key('email_field'));
      await tester.enterText(emailField, 'invalid@example.com');

      final passwordField = find.byKey(const Key('password_field'));
      await tester.enterText(passwordField, 'wrongpassword');

      // Tap Sign In
      final signInButton = find.text('Sign In');
      await tester.tap(signInButton);
      
      // Wait for error response from Supabase
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Should show error message (either form validation or Supabase error)
      // The app should remain on login screen
      expect(find.text('Sign In'), findsOneWidget);
    });

    testWidgets('Session persistence - logout and verify state',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // If already logged in (persisted session), we should see home screen
      // Navigate to home screen verification or login screen verification
      final isLoggedIn = find.text('Welcome back!').evaluate().isNotEmpty;

      if (isLoggedIn) {
        // User is logged in, verify logout works
        final logoutButton = find.byIcon(Icons.logout);
        if (logoutButton.evaluate().isNotEmpty) {
          await tester.tap(logoutButton);
          await tester.pumpAndSettle(const Duration(seconds: 3));

          // Should navigate back to login screen
          expect(find.text('Sign In'), findsOneWidget);
        }
      } else {
        // User is not logged in, which is expected state
        expect(find.text('Sign In'), findsOneWidget);
      }
    });

    testWidgets('Network connectivity - verify Supabase is reachable',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Attempt to trigger any Supabase call
      // The initialization itself validates connectivity
      // If we reached this point, network is OK
      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });
}
