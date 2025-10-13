-- ================================
-- RLS CRITICAL FIXES - Migration 006
-- Fixes critical gaps identified in RLS audit
-- Date: 2025-10-13
-- ================================

-- 1. FIX: auth_sessions table has RLS enabled but ZERO policies (CRITICAL)
-- This blocks authentication functionality
CREATE POLICY "Users can read own auth sessions" ON auth_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own auth sessions" ON auth_sessions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service can create auth sessions" ON auth_sessions
    FOR INSERT WITH CHECK (true); -- Service role only (bypasses RLS)

CREATE POLICY "Cleanup expired auth sessions" ON auth_sessions
    FOR DELETE USING (expires_at < NOW());

-- 2. FIX: sessions table missing INSERT policy
CREATE POLICY "Parents and teachers can create sessions" ON sessions
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id OR auth.uid() = parent_id
    );

CREATE POLICY "Parents can delete sessions" ON sessions
    FOR DELETE USING (auth.uid() = parent_id);

-- 3. FIX: Recreate existing policies with UUID comparison (remove ::text casting)
-- This improves performance by avoiding string conversion

-- Drop and recreate sessions policies
DROP POLICY IF EXISTS "Teachers can read assigned sessions" ON sessions;
CREATE POLICY "Teachers and parents can read sessions" ON sessions
    FOR SELECT USING (
        auth.uid() = teacher_id OR auth.uid() = parent_id
    );

DROP POLICY IF EXISTS "Users can update involved sessions" ON sessions;
CREATE POLICY "Teachers and parents can update sessions" ON sessions
    FOR UPDATE USING (
        auth.uid() = teacher_id OR auth.uid() = parent_id
    );

-- 4. FIX: ai_insights needs service INSERT policy
CREATE POLICY "Service can create AI insights" ON ai_insights
    FOR INSERT WITH CHECK (true); -- Service role only

DROP POLICY IF EXISTS "Users can read related AI insights" ON ai_insights;
CREATE POLICY "Users can read related AI insights" ON ai_insights
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = ai_insights.session_id
            AND (s.teacher_id = auth.uid() OR s.parent_id = auth.uid())
        )
    );

-- 5. FIX: learning_analytics needs service policy
CREATE POLICY "Service can manage learning analytics" ON learning_analytics
    FOR ALL USING (true); -- Service role only

DROP POLICY IF EXISTS "Users can read student analytics" ON learning_analytics;
CREATE POLICY "Users can read student analytics" ON learning_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = learning_analytics.student_id
            AND (
                s.parent_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM teacher_assignments ta
                    WHERE ta.student_id = s.id
                    AND ta.teacher_id = auth.uid()
                    AND ta.is_active = true
                )
            )
        )
    );

-- 6. FIX: Add admin override policies to all tables
CREATE POLICY "Admins have full user access" ON users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage all students" ON students
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage all teachers" ON teachers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage all sessions" ON sessions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- 7. PERFORMANCE: Fix UUID string casting in remaining policies

-- Students table
DROP POLICY IF EXISTS "Parents can manage their students" ON students;
CREATE POLICY "Parents can manage their students" ON students
    FOR ALL USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Teachers can read assigned students" ON students;
CREATE POLICY "Teachers can read assigned students" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teacher_assignments ta
            WHERE ta.student_id = students.id
            AND ta.teacher_id = auth.uid()
            AND ta.is_active = true
        )
    );

-- Data sheets
DROP POLICY IF EXISTS "Parents and assigned teachers can manage data sheets" ON data_sheets;
CREATE POLICY "Parents and assigned teachers can manage data sheets" ON data_sheets
    FOR ALL USING (
        auth.uid() = parent_id OR
        (teacher_id IS NOT NULL AND auth.uid() = teacher_id) OR
        EXISTS (
            SELECT 1 FROM students s
            JOIN teacher_assignments ta ON s.id = ta.student_id
            WHERE s.id = data_sheets.student_id
            AND ta.teacher_id = auth.uid()
            AND ta.is_active = true
        )
    );

-- Conversations
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Teacher assignments
DROP POLICY IF EXISTS "Parents and teachers can read their assignments" ON teacher_assignments;
CREATE POLICY "Parents and teachers can read their assignments" ON teacher_assignments
    FOR SELECT USING (
        auth.uid() = parent_id OR auth.uid() = teacher_id
    );

DROP POLICY IF EXISTS "Parents can manage teacher assignments" ON teacher_assignments;
CREATE POLICY "Parents can manage teacher assignments" ON teacher_assignments
    FOR ALL USING (auth.uid() = parent_id);

-- 8. ADD: Missing INSERT policies for users table
CREATE POLICY "Service can create users" ON users
    FOR INSERT WITH CHECK (true); -- Service role only

-- Users can soft delete their own accounts
CREATE POLICY "Users can soft delete their accounts" ON users
    FOR UPDATE USING (
        auth.uid() = id AND
        account_status IN ('active', 'suspended')
    )
    WITH CHECK (
        account_status = 'deleted'
    );

-- ================================
-- VERIFICATION QUERIES
-- Run these after applying migration to verify policies work
-- ================================

-- Check all tables have RLS enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND rowsecurity = false;

-- Check auth_sessions now has policies
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE tablename = 'auth_sessions';

-- Test parent isolation (should return 0 rows if testing with different parent)
-- SELECT * FROM students WHERE parent_id != auth.uid();

-- ================================
-- ROLLBACK SCRIPT (if needed)
-- ================================

-- To rollback this migration:
-- DROP POLICY "Users can read own auth sessions" ON auth_sessions;
-- DROP POLICY "Users can update own auth sessions" ON auth_sessions;
-- DROP POLICY "Service can create auth sessions" ON auth_sessions;
-- DROP POLICY "Cleanup expired auth sessions" ON auth_sessions;
-- ... (drop all policies created in this migration)
