import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:gurukool_teacher/models/flutter/teacher_sessions.dart';
import 'package:gurukool_teacher/models/flutter/students.dart';
import 'package:gurukool_teacher/models/flutter/teachers.dart';
import 'package:gurukool_teacher/models/flutter/teacher_qr_codes.dart';

void main() {
  group('Supabase Data Model Validation', () {
    late SupabaseClient client;

    setUpAll(() async {
      // Try loading .env.test first (for local testing), then fallback to .env
      try {
        await dotenv.load(fileName: ".env.test");
        print('Loaded .env.test');
      } catch (e) {
        await dotenv.load(fileName: ".env");
        print('Loaded .env');
      }
      
      final url = dotenv.env['SUPABASE_URL'];
      final anonKey = dotenv.env['SUPABASE_ANON_KEY'];

      if (url == null || anonKey == null) {
        throw Exception('Supabase credentials not found in .env or .env.test');
      }

      client = SupabaseClient(url, anonKey);
    });

    test('Validate TeacherSessions model', () async {
      try {
        final response = await client.from('teacher_sessions').select().limit(1);
        if (response.isNotEmpty) {
          final data = response.first;
          expect(() => TeacherSessions.fromJson(data), returnsNormally);
        } else {
          print('Warning: teacher_sessions table is empty, cannot validate model structure fully.');
        }
      } catch (e) {
        fail('Failed to validate TeacherSessions: $e');
      }
    });

    test('Validate Students model', () async {
      try {
        final response = await client.from('students').select().limit(1);
        if (response.isNotEmpty) {
          final data = response.first;
          expect(() => Students.fromJson(data), returnsNormally);
        } else {
          print('Warning: students table is empty, cannot validate model structure fully.');
        }
      } catch (e) {
        fail('Failed to validate Students: $e');
      }
    });

    test('Validate Teachers model', () async {
      try {
        final response = await client.from('teachers').select().limit(1);
        if (response.isNotEmpty) {
          final data = response.first;
          expect(() => Teachers.fromJson(data), returnsNormally);
        } else {
          print('Warning: teachers table is empty, cannot validate model structure fully.');
        }
      } catch (e) {
        fail('Failed to validate Teachers: $e');
      }
    });

    test('Validate TeacherQrCodes model', () async {
      try {
        final response = await client.from('teacher_qr_codes').select().limit(1);
        if (response.isNotEmpty) {
          final data = response.first;
          expect(() => TeacherQrCodes.fromJson(data), returnsNormally);
        } else {
          print('Warning: teacher_qr_codes table is empty, cannot validate model structure fully.');
        }
      } catch (e) {
        fail('Failed to validate TeacherQrCodes: $e');
      }
    });
  });
}
