import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gurukool_teacher/main.dart';
import 'package:gurukool_teacher/test/test_helpers/test_helpers.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    await pumpWidgetWithProviders(tester, const MyApp());
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
