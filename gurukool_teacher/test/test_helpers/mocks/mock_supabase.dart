import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Mock Supabase client for testing
class MockSupabaseClient extends Mock implements SupabaseClient {}

/// Mock Supabase query builder
class MockPostgrestQueryBuilder extends Mock implements PostgrestQueryBuilder {}

/// Mock Supabase auth
class MockGoTrueClient extends Mock implements GoTrueClient {}

/// Mock Supabase realtime
class MockRealtimeClient extends Mock implements RealtimeClient {}

/// Test helper to create mock Supabase client
MockSupabaseClient createMockSupabaseClient() {
  final mockClient = MockSupabaseClient();
  final mockAuth = MockGoTrueClient();
  final mockRealtime = MockRealtimeClient();

  when(() => mockClient.auth).thenReturn(mockAuth);
  when(() => mockClient.realtime).thenReturn(mockRealtime);

  return mockClient;
}

/// Helper to setup default mock behaviors
void setupMockSupabaseDefaults(MockSupabaseClient mockClient) {
  when(() => mockClient.auth.currentUser).thenReturn(null);
  when(() => mockClient.auth.currentSession).thenReturn(null);
}


