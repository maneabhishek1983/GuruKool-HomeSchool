-- ================================
-- Fix Teachers RLS INSERT Policy - Migration 010
-- Allows parents to create teacher profiles
-- Date: 2025-11-12
-- ================================

-- Problem: Parents cannot create teachers because there's no INSERT policy
-- Error: "new row violates row-level security policy for table 'teachers'"

-- Solution: Add INSERT and full management policies for parents

-- 1. Allow parents to INSERT teachers where parent_id matches their auth.uid()
CREATE POLICY "Parents can create teachers" ON teachers
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

-- 2. Allow parents to SELECT their own teachers
CREATE POLICY "Parents can read their teachers" ON teachers
    FOR SELECT USING (auth.uid() = parent_id);

-- 3. Allow parents to UPDATE their own teachers
CREATE POLICY "Parents can update their teachers" ON teachers
    FOR UPDATE USING (auth.uid() = parent_id);

-- 4. Allow parents to DELETE their own teachers
CREATE POLICY "Parents can delete their teachers" ON teachers
    FOR DELETE USING (auth.uid() = parent_id);

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Check all policies on teachers table:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'teachers';

-- Expected policies:
-- 1. "Admins can manage all teachers" (FOR ALL)
-- 2. "Parents can create teachers" (FOR INSERT)
-- 3. "Parents can read their teachers" (FOR SELECT)
-- 4. "Parents can update their teachers" (FOR UPDATE)
-- 5. "Parents can delete their teachers" (FOR DELETE)
-- 6. "Teachers can read assigned students" (FOR SELECT) - if exists

-- ================================
-- ROLLBACK SCRIPT (if needed)
-- ================================

-- To rollback this migration:
-- DROP POLICY IF EXISTS "Parents can create teachers" ON teachers;
-- DROP POLICY IF EXISTS "Parents can read their teachers" ON teachers;
-- DROP POLICY IF EXISTS "Parents can update their teachers" ON teachers;
-- DROP POLICY IF EXISTS "Parents can delete their teachers" ON teachers;
