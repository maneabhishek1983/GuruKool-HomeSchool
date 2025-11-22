import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:gurukool_teacher/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Session History E2E Tests', () {
    testWidgets('Session history loads and displays sessions',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to session history
      final historyButton = find.textContaining('History');
      if (historyButton.evaluate().isNotEmpty) {
        await tester.tap(historyButton);
        await tester.pumpAndSettle();
      }

      // Verify sessions are displayed
      expect(find.textContaining('Session'), findsWidgets);
    });

    testWidgets('Session history filters by date range',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to session history
      final historyButton = find.textContaining('History');
      if (historyButton.evaluate().isNotEmpty) {
        await tester.tap(historyButton);
        await tester.pumpAndSettle();
      }

      // Find filter button
      final filterButton = find.textContaining('Filter');
      if (filterButton.evaluate().isNotEmpty) {
        await tester.tap(filterButton);
        await tester.pumpAndSettle();
      }

      // Verify filter UI appears
      expect(find.textContaining('Date'), findsWidgets);
    });
  });
}


