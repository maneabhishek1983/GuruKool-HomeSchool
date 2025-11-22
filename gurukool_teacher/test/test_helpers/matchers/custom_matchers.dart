import 'package:flutter_test/flutter_test.dart';
import 'package:gurukool_teacher/models/flutter/teacher_sessions.dart';

/// Custom matchers for testing
class CustomMatchers {
  /// Matches a session with specific student ID
  static Matcher sessionWithStudent(String studentId) {
    return predicate<TeacherSession>(
      (session) => session.studentId == studentId,
      'session with studentId $studentId',
    );
  }

  /// Matches a session within time range
  static Matcher sessionInTimeRange(DateTime start, DateTime end) {
    return predicate<TeacherSession>(
      (session) =>
          session.checkInTime.isAfter(start) &&
          session.checkInTime.isBefore(end),
      'session in time range $start to $end',
    );
  }
}


