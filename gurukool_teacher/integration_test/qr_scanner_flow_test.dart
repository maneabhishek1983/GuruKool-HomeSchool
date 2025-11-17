import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:gurukool_teacher/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('QR Scanner Flow E2E Tests', () {
    testWidgets('Teacher can navigate to QR scanner',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to QR scanner
      final qrButton = find.byIcon(Icons.qr_code_scanner);
      if (qrButton.evaluate().isNotEmpty) {
        await tester.tap(qrButton);
        await tester.pumpAndSettle();
      }

      // Verify scanner screen loaded
      expect(find.textContaining('Scan'), findsWidgets);
    });

    testWidgets('QR scanner requests camera permission',
        (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to QR scanner
      final qrButton = find.byIcon(Icons.qr_code_scanner);
      if (qrButton.evaluate().isNotEmpty) {
        await tester.tap(qrButton);
        await tester.pumpAndSettle();
      }

      // Verify permission request or camera view
      expect(
        find.textContaining('Camera').or(find.textContaining('Permission')),
        findsWidgets,
      );
    });
  });
}

