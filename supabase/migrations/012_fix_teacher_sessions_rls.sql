-- Fix Teacher Sessions RLS policies to allow teachers to create sessions
-- without requiring parent_id in auth context

-- Drop existing teacher session creation policy
DROP POLICY IF EXISTS "Teachers can create their own sessions" ON teacher_sessions;

-- Create improved policy that allows teachers to create sessions
-- by verifying their teacher_id matches a valid teacher record
CREATE POLICY "Teachers can create their own sessions v2" ON teacher_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teachers
            WHERE teachers.id = teacher_sessions.teacher_id
            AND teachers.user_id = auth.uid()
        )
    );

-- Add policy to allow session creation via service role (for API endpoints)
-- This allows the API to create sessions on behalf of teachers using service role key
CREATE POLICY "Service role can create teacher sessions" ON teacher_sessions
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Add policy to allow service role to read all sessions (for admin operations)
CREATE POLICY "Service role can read all teacher sessions" ON teacher_sessions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Add policy to allow service role to update all sessions (for admin operations)
CREATE POLICY "Service role can update all teacher sessions" ON teacher_sessions
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Also update teacher_qr_codes policies for service role access
CREATE POLICY "Service role can read all teacher QR codes" ON teacher_qr_codes
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can update all teacher QR codes" ON teacher_qr_codes
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Add helpful comment
COMMENT ON POLICY "Service role can create teacher sessions" ON teacher_sessions IS
    'Allows API endpoints using service role key to create teacher sessions for QR code scanning';
