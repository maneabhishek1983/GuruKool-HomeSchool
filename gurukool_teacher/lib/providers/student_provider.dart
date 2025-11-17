import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/student.dart';
import '../services/supabase.service.dart';

/// Students list provider
final studentsProvider = FutureProvider<List<Student>>((ref) async {
  return await SupabaseService.getStudents();
});

/// Student by ID provider
final studentByIdProvider = FutureProvider.family<Student?, String>(
  (ref, studentId) async {
    return await SupabaseService.getStudentById(studentId);
  },
);

/// Assigned students provider (for teacher)
final assignedStudentsProvider = FutureProvider.family<List<Student>, String>(
  (ref, teacherId) async {
    return await SupabaseService.getAssignedStudents(teacherId);
  },
);
