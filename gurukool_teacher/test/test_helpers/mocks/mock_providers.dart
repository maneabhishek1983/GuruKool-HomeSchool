import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:gurukool_teacher/providers/auth_provider.dart';
import 'package:gurukool_teacher/providers/session_provider.dart';
import 'package:gurukool_teacher/providers/student_provider.dart';

/// Mock container for testing providers
class MockProviderContainer extends Mock implements ProviderContainer {}

/// Helper to override providers in tests
ProviderContainer createTestProviderContainer({
  ProviderContainer? parent,
  List<Override>? overrides,
}) {
  return ProviderContainer(
    parent: parent,
    overrides: overrides ?? [],
  );
}


