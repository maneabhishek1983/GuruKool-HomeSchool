import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gurukool_teacher/services/auth.service.dart';
import 'package:gurukool_teacher/services/supabase.service.dart';

class MockSupabaseClient extends Mock implements SupabaseClient {}
class MockGoTrueClient extends Mock implements GoTrueClient {}
class MockAuthResponse extends Mock implements AuthResponse {}
class MockUser extends Mock implements User {}
class MockSession extends Mock implements Session {}

void main() {
  late MockSupabaseClient mockSupabaseClient;
  late MockGoTrueClient mockAuthClient;

  setUp(() {
    mockSupabaseClient = MockSupabaseClient();
    mockAuthClient = MockGoTrueClient();
    
    // Setup SupabaseClient to return our mock Auth client
    when(() => mockSupabaseClient.auth).thenReturn(mockAuthClient);
    
    // Inject mock client into SupabaseService
    SupabaseService.client = mockSupabaseClient;
  });

  group('AuthService', () {
    test('signIn calls supabase auth.signInWithPassword', () async {
      const email = 'test@example.com';
      const password = 'password123';
      final mockResponse = MockAuthResponse();

      when(() => mockAuthClient.signInWithPassword(
        email: email,
        password: password,
      )).thenAnswer((_) async => mockResponse);

      final response = await AuthService.signIn(email: email, password: password);

      expect(response, equals(mockResponse));
      verify(() => mockAuthClient.signInWithPassword(
        email: email,
        password: password,
      )).called(1);
    });

    test('signIn throws AuthException on failure', () async {
      const email = 'test@example.com';
      const password = 'wrong_password';

      when(() => mockAuthClient.signInWithPassword(
        email: email,
        password: password,
      )).thenThrow(const AuthException('Invalid login credentials'));

      expect(
        () => AuthService.signIn(email: email, password: password),
        throwsA(isA<AuthException>()),
      );
    });

    test('signOut calls supabase auth.signOut', () async {
      when(() => mockAuthClient.signOut()).thenAnswer((_) async {});

      await AuthService.signOut();

      verify(() => mockAuthClient.signOut()).called(1);
    });
  });
}
