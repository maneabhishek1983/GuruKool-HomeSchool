-- ================================
-- Fix Data Sheets Teacher Access - Migration 021
-- Fixes RLS policy to properly check teacher access via teachers table
-- Date: 2026-02-23
-- ================================

-- PROBLEM:
-- The data_sheets.teacher_id column stores teachers.id (from teachers table)
-- But the RLS policy checks auth.uid() = teacher_id, expecting users.id
-- This means teachers can't access data sheets they created!
--
-- Additionally, the teacher_assignments.teacher_id stores users.id,
-- but the code sometimes uses teachers.id, causing lookup failures.

-- SOLUTION:
-- Update the RLS policy to check if the logged-in user is the teacher
-- by looking up the teachers table where teachers.id = data_sheets.teacher_id
-- and teachers.user_id = auth.uid()

-- Drop existing policy
DROP POLICY IF EXISTS "Parents and assigned teachers can manage data sheets" ON data_sheets;

-- Create improved policy that handles both ID types
CREATE POLICY "Parents and assigned teachers can manage data sheets" ON data_sheets
    FOR ALL USING (
        -- Parent access (parent_id is always users.id)
        auth.uid() = parent_id
        OR
        -- Direct teacher access (if teacher_id stores users.id)
        (teacher_id IS NOT NULL AND auth.uid() = teacher_id)
        OR
        -- Teacher access via teachers table (if teacher_id stores teachers.id)
        (teacher_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.id = data_sheets.teacher_id
            AND t.user_id = auth.uid()
        ))
        OR
        -- Teacher assigned to student via teacher_assignments (teacher_id = users.id)
        EXISTS (
            SELECT 1 FROM students s
            JOIN teacher_assignments ta ON s.id = ta.student_id
            WHERE s.id = data_sheets.student_id
            AND ta.teacher_id = auth.uid()
            AND ta.is_active = true
        )
        OR
        -- Teacher assigned to student via assigned_teachers JSONB (stores teachers.id)
        EXISTS (
            SELECT 1 FROM students s
            JOIN teachers t ON s.assigned_teachers ? t.id::text
            WHERE s.id = data_sheets.student_id
            AND t.user_id = auth.uid()
        )
    );

-- Also fix data_sheet_activities policy to match
DROP POLICY IF EXISTS "Users with data sheet access can manage activities" ON data_sheet_activities;

CREATE POLICY "Users with data sheet access can manage activities" ON data_sheet_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM data_sheets ds
            WHERE ds.id = data_sheet_activities.data_sheet_id
            AND (
                -- Parent access
                auth.uid() = ds.parent_id
                OR
                -- Direct teacher access (if teacher_id stores users.id)
                (ds.teacher_id IS NOT NULL AND auth.uid() = ds.teacher_id)
                OR
                -- Teacher access via teachers table (if teacher_id stores teachers.id)
                (ds.teacher_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM teachers t
                    WHERE t.id = ds.teacher_id
                    AND t.user_id = auth.uid()
                ))
                OR
                -- Teacher assigned to student via teacher_assignments
                EXISTS (
                    SELECT 1 FROM students s
                    JOIN teacher_assignments ta ON s.id = ta.student_id
                    WHERE s.id = ds.student_id
                    AND ta.teacher_id = auth.uid()
                    AND ta.is_active = true
                )
                OR
                -- Teacher assigned to student via assigned_teachers JSONB
                EXISTS (
                    SELECT 1 FROM students s
                    JOIN teachers t ON s.assigned_teachers ? t.id::text
                    WHERE s.id = ds.student_id
                    AND t.user_id = auth.uid()
                )
            )
        )
    );

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Check policies on data_sheets:
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'data_sheets';

-- Test teacher access (replace with actual IDs):
-- SET LOCAL role TO authenticated;
-- SET LOCAL "request.jwt.claim.sub" TO 'teacher-user-uuid';
-- SELECT * FROM data_sheets WHERE teacher_id = 'teacher-table-uuid';

-- ================================
-- ROLLBACK SCRIPT (if needed)
-- ================================

-- DROP POLICY IF EXISTS "Parents and assigned teachers can manage data sheets" ON data_sheets;
-- DROP POLICY IF EXISTS "Users with data sheet access can manage activities" ON data_sheet_activities;
--
-- Then recreate original policies from migration 002 or 006
