import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:gurukool_teacher/screens/login_screen.dart';
import 'package:gurukool_teacher/providers/auth_provider.dart';

/// Helper to pump widget with Riverpod ProviderScope
Future<void> pumpWidgetWithProviders(
  WidgetTester tester,
  Widget widget, {
  List<Override>? overrides,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides ?? [],
      child: MaterialApp(home: widget),
    ),
  );
  await tester.pumpAndSettle();
}

// Mock AuthNotifier
class MockAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  MockAuthNotifier() : super(AuthState());

  @override
  Future<void> login(String email, String password) async {}
  
  @override
  Future<void> logout() async {}
  
  @override
  Future<void> _initialize() async {}
}

void main() {
  late MockAuthNotifier mockAuthNotifier;

  setUp(() {
    mockAuthNotifier = MockAuthNotifier();
  });

  testWidgets('LoginScreen renders correctly', (WidgetTester tester) async {
    await pumpWidgetWithProviders(
      tester,
      const LoginScreen(),
      overrides: [
        authProvider.overrideWith((ref) => mockAuthNotifier),
      ],
    );

    expect(find.text('GuruKool Teacher'), findsOneWidget);
    expect(find.text('Sign in to continue'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2)); // Email & Password
    expect(find.text('Sign In'), findsOneWidget);
  });

  testWidgets('LoginScreen shows validation errors', (WidgetTester tester) async {
    await pumpWidgetWithProviders(
      tester,
      const LoginScreen(),
      overrides: [
        authProvider.overrideWith((ref) => mockAuthNotifier),
      ],
    );

    // Tap login without entering data
    await tester.tap(find.text('Sign In'));
    await tester.pump();

    expect(find.text('Please enter your email'), findsOneWidget);
    expect(find.text('Please enter your password'), findsOneWidget);
  });

  testWidgets('LoginScreen toggles password visibility', (WidgetTester tester) async {
    await pumpWidgetWithProviders(
      tester,
      const LoginScreen(),
      overrides: [
        authProvider.overrideWith((ref) => mockAuthNotifier),
      ],
    );

    // Initially obscured
    final passwordField = tester.widget<TextField>(
      find.descendant(
        of: find.widgetWithText(TextFormField, 'Password'),
        matching: find.byType(TextField),
      ),
    );
    expect(passwordField.obscureText, isTrue);

    // Tap toggle button
    await tester.tap(find.byIcon(Icons.visibility_outlined));
    await tester.pump();

    // Now visible
    final passwordFieldVisible = tester.widget<TextField>(
      find.descendant(
        of: find.widgetWithText(TextFormField, 'Password'),
        matching: find.byType(TextField),
      ),
    );
    expect(passwordFieldVisible.obscureText, isFalse);
  });
}
