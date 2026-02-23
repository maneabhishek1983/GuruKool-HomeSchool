-- Fix RLS policies on teacher_biometric_credentials and location_verification_log
-- Bug: auth.uid() = teacher_id will never match because teacher_id references
-- teachers(id), not users(id). We need to join through the teachers table.

-- Drop broken policies on teacher_biometric_credentials
DROP POLICY IF EXISTS "Teachers can view own biometric credentials" ON teacher_biometric_credentials;
DROP POLICY IF EXISTS "Teachers can insert own biometric credentials" ON teacher_biometric_credentials;
DROP POLICY IF EXISTS "Teachers can update own biometric credentials" ON teacher_biometric_credentials;
DROP POLICY IF EXISTS "Teachers can delete own biometric credentials" ON teacher_biometric_credentials;

-- Recreate with correct join through teachers table
CREATE POLICY "Teachers can view own biometric credentials"
  ON teacher_biometric_credentials FOR SELECT
  USING (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

CREATE POLICY "Teachers can insert own biometric credentials"
  ON teacher_biometric_credentials FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

CREATE POLICY "Teachers can update own biometric credentials"
  ON teacher_biometric_credentials FOR UPDATE
  USING (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

CREATE POLICY "Teachers can delete own biometric credentials"
  ON teacher_biometric_credentials FOR DELETE
  USING (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

-- Drop broken policy on location_verification_log
DROP POLICY IF EXISTS "Teachers can view own location logs" ON location_verification_log;

-- Recreate with correct join
CREATE POLICY "Teachers can view own location logs"
  ON location_verification_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

-- Also fix geofence_exceptions teacher policies
DROP POLICY IF EXISTS "Teachers can view own exception requests" ON geofence_exceptions;
DROP POLICY IF EXISTS "Teachers can create exception requests" ON geofence_exceptions;

CREATE POLICY "Teachers can view own exception requests"
  ON geofence_exceptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

CREATE POLICY "Teachers can create exception requests"
  ON geofence_exceptions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));
