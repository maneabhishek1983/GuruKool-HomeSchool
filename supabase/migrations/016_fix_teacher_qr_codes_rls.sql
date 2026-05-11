-- Fix Teacher QR Codes RLS to allow teachers to read QR codes they are associated with
-- This is required for checking QR validity during check-in/out

-- Idempotent: drop the policy if it was already created by a partial application,
-- matching the pattern used by migrations 012 / 020 / 021.
DROP POLICY IF EXISTS "Teachers can view their own QR codes" ON teacher_qr_codes;

-- Add policy for teachers to read their own QR codes
CREATE POLICY "Teachers can view their own QR codes" ON teacher_qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers
            WHERE teachers.id = teacher_qr_codes.teacher_id
            AND teachers.user_id = auth.uid()
        )
    );

-- Add helpful comment
COMMENT ON POLICY "Teachers can view their own QR codes" ON teacher_qr_codes IS
    'Allows teachers to read QR codes associated with them for validation during check-in/out';
