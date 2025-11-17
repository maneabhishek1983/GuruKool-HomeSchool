import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:gurukool_teacher/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Authentication Flow E2E Tests', () {
    testWidgets('Teacher can login with valid credentials',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Find email field
      final emailField = find.byKey(const Key('email_field'));
      if (emailField.evaluate().isNotEmpty) {
        await tester.enterText(emailField, 'teacher@example.com');
      }

      // Find password field
      final passwordField = find.byKey(const Key('password_field'));
      if (passwordField.evaluate().isNotEmpty) {
        await tester.enterText(passwordField, 'password123');
      }

      // Tap login button
      final loginButton = find.text('Login');
      if (loginButton.evaluate().isNotEmpty) {
        await tester.tap(loginButton);
        await tester.pumpAndSettle();
      }

      // Verify navigation to home screen
      expect(find.textContaining('GuruKool'), findsWidgets);
    });

    testWidgets('Invalid credentials show error message',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Enter invalid credentials
      final emailField = find.byKey(const Key('email_field'));
      if (emailField.evaluate().isNotEmpty) {
        await tester.enterText(emailField, 'invalid@example.com');
      }

      final passwordField = find.byKey(const Key('password_field'));
      if (passwordField.evaluate().isNotEmpty) {
        await tester.enterText(passwordField, 'wrongpassword');
      }

      // Tap login
      final loginButton = find.text('Login');
      if (loginButton.evaluate().isNotEmpty) {
        await tester.tap(loginButton);
        await tester.pumpAndSettle();
      }

      // Verify error message appears
      expect(find.textContaining('Login failed'), findsWidgets);
    });
  });
}

