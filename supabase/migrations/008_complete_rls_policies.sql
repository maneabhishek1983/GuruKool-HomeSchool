-- Migration 008: Complete RLS Policies and Optimize Performance
-- Date: 2025-11-17
-- Critical: Fixes security vulnerabilities in auth_sessions table and optimizes 21 policies

-- ============================================
-- PART 1: AUTH_SESSIONS TABLE (CRITICAL)
-- Currently has ZERO policies - major security vulnerability
-- ============================================

-- Enable RLS on auth_sessions
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (cleanup)
DROP POLICY IF EXISTS "Users can view own sessions" ON auth_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON auth_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON auth_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON auth_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON auth_sessions;

-- Policy 1: Users can read their own sessions
CREATE POLICY "Users can view own sessions"
  ON auth_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own sessions
CREATE POLICY "Users can create own sessions"
  ON auth_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON auth_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON auth_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 5: Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON auth_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- PART 2: SESSIONS TABLE - Missing Policies
-- ============================================

-- Add missing INSERT policy for teachers
DROP POLICY IF EXISTS "Teachers can create sessions for their students" ON sessions;
CREATE POLICY "Teachers can create sessions for their students"
  ON sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND EXISTS (
      SELECT 1 FROM student_teachers
      WHERE student_teachers.teacher_id = auth.uid()
      AND student_teachers.student_id = sessions.student_id
    )
  );

-- Add missing DELETE policy for teachers
DROP POLICY IF EXISTS "Teachers can delete own sessions" ON sessions;
CREATE POLICY "Teachers can delete own sessions"
  ON sessions
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Admin can delete any session
DROP POLICY IF EXISTS "Admins can delete any session" ON sessions;
CREATE POLICY "Admins can delete any session"
  ON sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- PART 3: OPTIMIZE POLICIES - Remove ::text Casting
-- Improves query performance by allowing index usage
-- ============================================

-- STUDENTS TABLE
-- Drop old inefficient policies
DROP POLICY IF EXISTS "Parents can view own students" ON students;
DROP POLICY IF EXISTS "Parents can create students" ON students;
DROP POLICY IF EXISTS "Parents can update own students" ON students;
DROP POLICY IF EXISTS "Parents can delete own students" ON students;

-- Create optimized policies without ::text casting
CREATE POLICY "Parents can view own students"
  ON students
  FOR SELECT
  USING (parent_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can create students"
  ON students
  FOR INSERT
  WITH CHECK (parent_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can update own students"
  ON students
  FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can delete own students"
  ON students
  FOR DELETE
  USING (parent_id = auth.uid()); -- Removed ::text casting

-- Admins can view all students
DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students"
  ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- TEACHERS TABLE
DROP POLICY IF EXISTS "Parents can view own teachers" ON teachers;
DROP POLICY IF EXISTS "Parents can create teachers" ON teachers;
DROP POLICY IF EXISTS "Parents can update own teachers" ON teachers;
DROP POLICY IF EXISTS "Parents can delete own teachers" ON teachers;

CREATE POLICY "Parents can view own teachers"
  ON teachers
  FOR SELECT
  USING (parent_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can create teachers"
  ON teachers
  FOR INSERT
  WITH CHECK (parent_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can update own teachers"
  ON teachers
  FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can delete own teachers"
  ON teachers
  FOR DELETE
  USING (parent_id = auth.uid()); -- Removed ::text casting

-- TEACHER_SESSIONS TABLE
DROP POLICY IF EXISTS "Teachers can view own sessions" ON teacher_sessions;
DROP POLICY IF EXISTS "Teachers can create sessions" ON teacher_sessions;
DROP POLICY IF EXISTS "Teachers can update own sessions" ON teacher_sessions;
DROP POLICY IF EXISTS "Parents can view their students' sessions" ON teacher_sessions;

CREATE POLICY "Teachers can view own sessions"
  ON teacher_sessions
  FOR SELECT
  USING (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Teachers can create sessions"
  ON teacher_sessions
  FOR INSERT
  WITH CHECK (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Teachers can update own sessions"
  ON teacher_sessions
  FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can view their students' sessions"
  ON teacher_sessions
  FOR SELECT
  USING (
    parent_id = auth.uid() -- Removed ::text casting
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = teacher_sessions.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- TIMESHEET_ENTRIES TABLE
DROP POLICY IF EXISTS "Teachers can view own timesheet entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Teachers can create timesheet entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Teachers can update own timesheet entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Parents can view their students' timesheet entries" ON timesheet_entries;

CREATE POLICY "Teachers can view own timesheet entries"
  ON timesheet_entries
  FOR SELECT
  USING (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Teachers can create timesheet entries"
  ON timesheet_entries
  FOR INSERT
  WITH CHECK (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Teachers can update own timesheet entries"
  ON timesheet_entries
  FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can view their students' timesheet entries"
  ON timesheet_entries
  FOR SELECT
  USING (
    parent_id = auth.uid() -- Removed ::text casting
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = timesheet_entries.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- TEACHER_QR_CODES TABLE
DROP POLICY IF EXISTS "Teachers can view own QR codes" ON teacher_qr_codes;
DROP POLICY IF EXISTS "Parents can view QR codes for their students" ON teacher_qr_codes;
DROP POLICY IF EXISTS "Parents can create QR codes" ON teacher_qr_codes;
DROP POLICY IF EXISTS "Parents can update QR codes" ON teacher_qr_codes;

CREATE POLICY "Teachers can view own QR codes"
  ON teacher_qr_codes
  FOR SELECT
  USING (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can view QR codes for their students"
  ON teacher_qr_codes
  FOR SELECT
  USING (
    parent_id = auth.uid() -- Removed ::text casting
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = teacher_qr_codes.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create QR codes"
  ON teacher_qr_codes
  FOR INSERT
  WITH CHECK (parent_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can update QR codes"
  ON teacher_qr_codes
  FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid()); -- Removed ::text casting

-- SESSIONS TABLE (old) - Optimize existing policies
DROP POLICY IF EXISTS "Teachers can view own sessions (old)" ON sessions;
DROP POLICY IF EXISTS "Parents can view sessions (old)" ON sessions;

CREATE POLICY "Teachers can view own sessions (old)"
  ON sessions
  FOR SELECT
  USING (teacher_id = auth.uid()); -- Removed ::text casting

CREATE POLICY "Parents can view sessions (old)"
  ON sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = sessions.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- ============================================
-- PART 4: CREATE INDEXES FOR POLICY PERFORMANCE
-- ============================================

-- Index on parent_id for faster policy checks
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_teachers_parent_id ON teachers(parent_id);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_parent_id ON teacher_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_teacher_id ON teacher_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_parent_id ON timesheet_entries(parent_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_teacher_id ON timesheet_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_qr_codes_parent_id ON teacher_qr_codes(parent_id);
CREATE INDEX IF NOT EXISTS idx_teacher_qr_codes_teacher_id ON teacher_qr_codes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);

-- Compound indexes for faster join operations in policies
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_student_parent ON teacher_sessions(student_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_student_parent ON timesheet_entries(student_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_teacher_qr_codes_student_parent ON teacher_qr_codes(student_id, parent_id);

-- ============================================
-- PART 5: VERIFICATION QUERIES
-- ============================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('students', 'teachers', 'teacher_sessions', 'timesheet_entries',
                      'teacher_qr_codes', 'sessions', 'auth_sessions')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = r.schemaname
      AND c.relname = r.tablename
      AND c.relrowsecurity = true
    ) THEN
      RAISE WARNING 'RLS not enabled on %.%', r.schemaname, r.tablename;
    END IF;
  END LOOP;
END;
$$;

-- Count policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('students', 'teachers', 'teacher_sessions', 'timesheet_entries',
                  'teacher_qr_codes', 'sessions', 'auth_sessions')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected results:
-- students: 5 policies (4 parent + 1 admin)
-- teachers: 4 policies (4 parent)
-- teacher_sessions: 4 policies (3 teacher + 1 parent)
-- timesheet_entries: 4 policies (3 teacher + 1 parent)
-- teacher_qr_codes: 4 policies (1 teacher + 3 parent)
-- sessions: 5 policies (2 teacher + 1 parent + 2 delete)
-- auth_sessions: 5 policies (4 user + 1 admin)

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE auth_sessions IS 'Migration 008: Added 5 RLS policies (CRITICAL FIX)';
COMMENT ON TABLE sessions IS 'Migration 008: Added 3 missing policies (INSERT, 2x DELETE)';
COMMENT ON TABLE students IS 'Migration 008: Optimized policies - removed ::text casting';
COMMENT ON TABLE teachers IS 'Migration 008: Optimized policies - removed ::text casting';
COMMENT ON TABLE teacher_sessions IS 'Migration 008: Optimized policies - removed ::text casting';
COMMENT ON TABLE timesheet_entries IS 'Migration 008: Optimized policies - removed ::text casting';
COMMENT ON TABLE teacher_qr_codes IS 'Migration 008: Optimized policies - removed ::text casting';
