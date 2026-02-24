-- ================================
-- Fix Teachers RLS for Teacher Users - Migration 020
-- Allows teachers to read their OWN teacher record
-- Date: 2026-02-23
-- ================================

-- Problem: Teachers cannot read their own record from the teachers table
-- because the existing RLS policies only check `auth.uid() = parent_id`
-- but teachers have `user_id = auth.uid()`, not `parent_id = auth.uid()`.
--
-- This causes `/api/teacher/assigned-students` to fail with:
-- "Teacher profile not found" when the teacher tries to get their assigned students.
--
-- The parent's face recognition works because it queries directly by student_id
-- and doesn't need to look up the teacher record first.

-- Solution: Add a policy that allows teachers to read their own record

-- Drop existing policies if they exist (makes migration idempotent)
DROP POLICY IF EXISTS "Teachers can read own teacher record" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own teacher record" ON teachers;

-- Allow teachers to SELECT their own teacher record (by user_id)
CREATE POLICY "Teachers can read own teacher record" ON teachers
    FOR SELECT USING (auth.uid() = user_id);

-- Also allow teachers to UPDATE their own record (for profile updates)
CREATE POLICY "Teachers can update own teacher record" ON teachers
    FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Check all policies on teachers table:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'teachers';

-- Expected policies after this migration:
-- 1. "Admins can manage all teachers" (FOR ALL)
-- 2. "Parents can create teachers" (FOR INSERT)
-- 3. "Parents can read their teachers" (FOR SELECT) - for parents
-- 4. "Parents can update their teachers" (FOR UPDATE)
-- 5. "Parents can delete their teachers" (FOR DELETE)
-- 6. "Teachers can read own teacher record" (FOR SELECT) - NEW
-- 7. "Teachers can update own teacher record" (FOR UPDATE) - NEW

-- ================================
-- ROLLBACK SCRIPT (if needed)
-- ================================

-- To rollback this migration:
-- DROP POLICY IF EXISTS "Teachers can read own teacher record" ON teachers;
-- DROP POLICY IF EXISTS "Teachers can update own teacher record" ON teachers;
