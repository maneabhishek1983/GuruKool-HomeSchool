import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gurukool_teacher/screens/session_history_screen.dart';
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

  void setTestState(AuthState newState) {
    state = newState;
  }

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

  testWidgets('SessionHistoryScreen shows app bar and filter tabs', (WidgetTester tester) async {
    // Setup auth state with null user (to avoid query execution)
    mockAuthNotifier.setTestState(AuthState(user: null));

    await pumpWidgetWithProviders(
      tester,
      const SessionHistoryScreen(),
      overrides: [
        authProvider.overrideWith((ref) => mockAuthNotifier),
      ],
    );

    // Verify basic UI elements
    expect(find.text('Session History'), findsOneWidget);
    expect(find.text('All'), findsOneWidget);
    expect(find.text('Active'), findsOneWidget);
    expect(find.text('Completed'), findsOneWidget);
    expect(find.byIcon(Icons.refresh), findsOneWidget);
  });

  testWidgets('SessionHistoryScreen shows loading indicator initially', (WidgetTester tester) async {
    mockAuthNotifier.setTestState(AuthState(user: null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => mockAuthNotifier),
        ],
        child: const MaterialApp(home: SessionHistoryScreen()),
      ),
    );

    // Should show loading indicator
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    
    await tester.pumpAndSettle();
  });
}
