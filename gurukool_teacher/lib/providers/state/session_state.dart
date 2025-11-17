import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/teacher_session.dart';

/// Session state model
class SessionState {
  final List<TeacherSession> sessions;
  final TeacherSession? activeSession;
  final bool isLoading;
  final String? error;

  SessionState({
    this.sessions = const [],
    this.activeSession,
    this.isLoading = false,
    this.error,
  });

  SessionState copyWith({
    List<TeacherSession>? sessions,
    TeacherSession? activeSession,
    bool? isLoading,
    String? error,
  }) {
    return SessionState(
      sessions: sessions ?? this.sessions,
      activeSession: activeSession ?? this.activeSession,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

/// Session state notifier
class SessionNotifier extends StateNotifier<SessionState> {
  SessionNotifier() : super(SessionState());

  /// Load sessions from backend
  Future<void> loadSessions(String teacherId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Load sessions from Supabase
      final sessions = <TeacherSession>[];

      state = state.copyWith(
        sessions: sessions,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Check-in (start session)
  Future<void> checkIn(String teacherId, String studentId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Create session in Supabase
      final newSession = TeacherSession(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        teacherId: teacherId,
        studentId: studentId,
        checkInTime: DateTime.now(),
      );

      state = state.copyWith(
        sessions: [...state.sessions, newSession],
        activeSession: newSession,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Check-out (end session)
  Future<void> checkOut(String sessionId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Update session in Supabase
      final updatedSessions = state.sessions.map((session) {
        if (session.id == sessionId) {
          return session.copyWith(checkOutTime: DateTime.now());
        }
        return session;
      }).toList();

      state = state.copyWith(
        sessions: updatedSessions,
        activeSession: null,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear all sessions (for logout)
  void clearSessions() {
    state = SessionState();
  }
}
