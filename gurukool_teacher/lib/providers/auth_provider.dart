import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'state/auth_state.dart' as app_auth;

// Export auth state for use in widgets
export 'state/auth_state.dart' show AuthState, AuthNotifier;

/// Auth provider using StateNotifier
final authProvider = StateNotifierProvider<app_auth.AuthNotifier, app_auth.AuthState>((ref) {
  return app_auth.AuthNotifier();
});

/// Current user provider
final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user;
});

/// Auth status provider
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.isAuthenticated;
});
