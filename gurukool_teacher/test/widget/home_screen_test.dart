import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gurukool_teacher/screens/home_screen.dart';
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

  bool logoutCalled = false;

  void setTestState(AuthState newState) {
    state = newState;
  }

  @override
  Future<void> login(String email, String password) async {}
  
  @override
  Future<void> logout() async {
    logoutCalled = true;
  }
  
  @override
  Future<void> _initialize() async {}
}

void main() {
  late MockAuthNotifier mockAuthNotifier;

  setUp(() {
    mockAuthNotifier = MockAuthNotifier();
  });

  testWidgets('HomeScreen renders correctly with user data', (WidgetTester tester) async {
    // Setup auth state with user
    mockAuthNotifier.setTestState(AuthState(user: null));

    await pumpWidgetWithProviders(
      tester,
      const HomeScreen(),
      overrides: [
        authProvider.overrideWith((ref) => mockAuthNotifier),
      ],
    );

    expect(find.text('GuruKool Teacher'), findsOneWidget);
    expect(find.text('Welcome back!'), findsOneWidget);
    expect(find.text('Teacher'), findsOneWidget);
    expect(find.text('Quick Actions'), findsOneWidget);
    
    // Verify Quick Action Cards
    expect(find.text('Scan QR Code'), findsOneWidget);
    expect(find.text('Session History'), findsOneWidget);
    expect(find.text('My Students'), findsOneWidget);
    expect(find.text('Schedule'), findsOneWidget);
  });

  testWidgets('Logout button triggers logout', (WidgetTester tester) async {
    mockAuthNotifier.setTestState(AuthState(user: null));

    await pumpWidgetWithProviders(
      tester,
      const HomeScreen(),
      overrides: [
        authProvider.overrideWith((ref) => mockAuthNotifier),
      ],
    );

    await tester.tap(find.byIcon(Icons.logout));
    await tester.pump();

    expect(mockAuthNotifier.logoutCalled, isTrue);
  });
}
