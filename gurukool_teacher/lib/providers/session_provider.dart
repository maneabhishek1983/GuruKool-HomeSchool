import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/teacher_session.dart';
import '../services/supabase.service.dart';
import 'state/session_state.dart';

/// Session state provider
final sessionProvider = StateNotifierProvider<SessionNotifier, SessionState>((ref) {
  return SessionNotifier();
});

/// Active session provider
final activeSessionProvider = Provider<TeacherSession?>((ref) {
  final sessionState = ref.watch(sessionProvider);
  return sessionState.activeSession;
});

/// Session history provider (FutureProvider for async data)
final sessionHistoryProvider = FutureProvider.family<List<TeacherSession>, String>(
  (ref, teacherId) async {
    return await SupabaseService.getTeacherSessions(teacherId);
  },
);

/// Today's sessions provider
final todaySessionsProvider = Provider<List<TeacherSession>>((ref) {
  final sessionState = ref.watch(sessionProvider);
  final now = DateTime.now();

  return sessionState.sessions.where((session) {
    final sessionDate = session.checkInTime;
    return sessionDate.year == now.year &&
           sessionDate.month == now.month &&
           sessionDate.day == now.day;
  }).toList();
});
