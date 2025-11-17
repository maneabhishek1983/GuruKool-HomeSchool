import 'package:gurukool_teacher/models/flutter/students.dart';
import 'package:gurukool_teacher/models/flutter/teachers.dart';
import 'package:gurukool_teacher/models/flutter/teacher_sessions.dart';

/// Test data fixtures for all test types
class TestData {
  static final Student mockStudent = Student(
    id: 'student-1',
    name: 'John Doe',
    email: 'john@example.com',
    parentId: 'parent-1',
    createdAt: DateTime.now(),
  );

  static final Teacher mockTeacher = Teacher(
    id: 'teacher-1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    createdAt: DateTime.now(),
  );

  static final TeacherSession mockSession = TeacherSession(
    id: 'session-1',
    teacherId: 'teacher-1',
    studentId: 'student-1',
    checkInTime: DateTime.now().subtract(const Duration(hours: 2)),
    checkOutTime: DateTime.now(),
  );

  static final List<TeacherSession> mockSessions = [
    mockSession,
    TeacherSession(
      id: 'session-2',
      teacherId: 'teacher-1',
      studentId: 'student-1',
      checkInTime: DateTime.now().subtract(const Duration(days: 1, hours: 3)),
      checkOutTime: DateTime.now().subtract(const Duration(days: 1, hours: 1)),
    ),
  ];

  static const String mockQRData = '''
    {
      "studentId": "student-1",
      "teacherId": "teacher-1",
      "timestamp": "2025-11-17T10:00:00Z",
      "expiresAt": "2025-11-17T10:05:00Z",
      "signature": "mock_signature_base64"
    }
  ''';

  static const String mockEmail = 'teacher@example.com';
  static const String mockPassword = 'password123';
}

