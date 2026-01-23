-- Migration: Add Biometric Authentication and Geofencing Support
-- Version: 015
-- Date: 2026-01-22
-- Description: Adds location tracking and biometric credentials for secure teacher check-in/out

-- ============================================================================
-- 1. Add Location Fields to Students Table
-- ============================================================================

-- Add home address and geofencing fields
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER DEFAULT 100 CHECK (geofence_radius_meters BETWEEN 10 AND 1000);

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_students_location ON students(home_latitude, home_longitude) 
WHERE home_latitude IS NOT NULL AND home_longitude IS NOT NULL;

-- Add comment
COMMENT ON COLUMN students.home_address IS 'Student home address for location verification';
COMMENT ON COLUMN students.home_latitude IS 'Latitude of student home (for geofencing)';
COMMENT ON COLUMN students.home_longitude IS 'Longitude of student home (for geofencing)';
COMMENT ON COLUMN students.geofence_radius_meters IS 'Allowed radius in meters for check-in/out (default: 100m)';

-- ============================================================================
-- 2. Create Biometric Credentials Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS teacher_biometric_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT unique_teacher_credential UNIQUE(teacher_id, credential_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_biometric_teacher ON teacher_biometric_credentials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credential ON teacher_biometric_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_biometric_active ON teacher_biometric_credentials(teacher_id, is_active) 
WHERE is_active = TRUE;

-- Add comments
COMMENT ON TABLE teacher_biometric_credentials IS 'WebAuthn biometric credentials for teacher authentication';
COMMENT ON COLUMN teacher_biometric_credentials.credential_id IS 'WebAuthn credential ID (base64 encoded)';
COMMENT ON COLUMN teacher_biometric_credentials.public_key IS 'WebAuthn public key (base64 encoded)';
COMMENT ON COLUMN teacher_biometric_credentials.counter IS 'WebAuthn signature counter (prevents replay attacks)';
COMMENT ON COLUMN teacher_biometric_credentials.device_name IS 'User-friendly device name';

-- ============================================================================
-- 3. Add Location Tracking to Teacher Sessions
-- ============================================================================

-- Add check-in location fields
ALTER TABLE teacher_sessions
ADD COLUMN IF NOT EXISTS check_in_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS check_in_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS check_in_accuracy_meters DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS check_in_address TEXT;

-- Add check-out location fields
ALTER TABLE teacher_sessions
ADD COLUMN IF NOT EXISTS check_out_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS check_out_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS check_out_accuracy_meters DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS check_out_address TEXT;

-- Add verification flags
ALTER TABLE teacher_sessions
ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS biometric_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_method TEXT CHECK (verification_method IN ('qr_code', 'biometric', 'biometric_location', 'exception'));

-- Add distance tracking
ALTER TABLE teacher_sessions
ADD COLUMN IF NOT EXISTS check_in_distance_meters DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS check_out_distance_meters DECIMAL(8, 2);

-- Add indexes for location queries
CREATE INDEX IF NOT EXISTS idx_sessions_check_in_location ON teacher_sessions(check_in_latitude, check_in_longitude)
WHERE check_in_latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_location_verified ON teacher_sessions(location_verified);
CREATE INDEX IF NOT EXISTS idx_sessions_verification_method ON teacher_sessions(verification_method);

-- Add comments
COMMENT ON COLUMN teacher_sessions.check_in_latitude IS 'GPS latitude at check-in';
COMMENT ON COLUMN teacher_sessions.check_in_longitude IS 'GPS longitude at check-in';
COMMENT ON COLUMN teacher_sessions.check_in_accuracy_meters IS 'GPS accuracy in meters at check-in';
COMMENT ON COLUMN teacher_sessions.location_verified IS 'Whether location was within geofence';
COMMENT ON COLUMN teacher_sessions.biometric_verified IS 'Whether biometric authentication was used';
COMMENT ON COLUMN teacher_sessions.verification_method IS 'Method used for check-in verification';

-- ============================================================================
-- 4. Create Geofence Exceptions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS geofence_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Exception details
  reason TEXT NOT NULL,
  alternate_location TEXT,
  alternate_latitude DECIMAL(10, 8),
  alternate_longitude DECIMAL(11, 8),
  
  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,
  
  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_exceptions_teacher ON geofence_exceptions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_student ON geofence_exceptions(student_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_parent ON geofence_exceptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON geofence_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_validity ON geofence_exceptions(valid_from, valid_until);

-- Add comments
COMMENT ON TABLE geofence_exceptions IS 'Approved exceptions for check-in outside geofence';
COMMENT ON COLUMN geofence_exceptions.reason IS 'Teacher-provided reason for exception request';
COMMENT ON COLUMN geofence_exceptions.alternate_location IS 'Alternate location address (e.g., library, park)';
COMMENT ON COLUMN geofence_exceptions.status IS 'Approval status: pending, approved, denied, expired';

-- ============================================================================
-- 5. Create Location Verification Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID REFERENCES teacher_sessions(id) ON DELETE CASCADE,
  
  -- Location data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(8, 2),
  
  -- Verification result
  distance_meters DECIMAL(8, 2) NOT NULL,
  within_geofence BOOLEAN NOT NULL,
  geofence_radius_meters INTEGER NOT NULL,
  
  -- Context
  verification_type TEXT NOT NULL CHECK (verification_type IN ('check_in', 'check_out', 'manual_check')),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_location_log_teacher ON location_verification_log(teacher_id);
CREATE INDEX IF NOT EXISTS idx_location_log_student ON location_verification_log(student_id);
CREATE INDEX IF NOT EXISTS idx_location_log_session ON location_verification_log(session_id);
CREATE INDEX IF NOT EXISTS idx_location_log_created ON location_verification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_log_success ON location_verification_log(success);

-- Add comments
COMMENT ON TABLE location_verification_log IS 'Audit log of all location verification attempts';
COMMENT ON COLUMN location_verification_log.distance_meters IS 'Calculated distance from student home';
COMMENT ON COLUMN location_verification_log.within_geofence IS 'Whether location was within allowed radius';

-- ============================================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE teacher_biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_verification_log ENABLE ROW LEVEL SECURITY;

-- Biometric Credentials Policies
CREATE POLICY "Teachers can view own biometric credentials"
  ON teacher_biometric_credentials FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own biometric credentials"
  ON teacher_biometric_credentials FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own biometric credentials"
  ON teacher_biometric_credentials FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own biometric credentials"
  ON teacher_biometric_credentials FOR DELETE
  USING (auth.uid() = teacher_id);

-- Geofence Exceptions Policies
CREATE POLICY "Teachers can view own exception requests"
  ON geofence_exceptions FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create exception requests"
  ON geofence_exceptions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Parents can view exceptions for their students"
  ON geofence_exceptions FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can update exceptions for their students"
  ON geofence_exceptions FOR UPDATE
  USING (auth.uid() = parent_id);

-- Location Verification Log Policies
CREATE POLICY "Teachers can view own location logs"
  ON location_verification_log FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Parents can view location logs for their students"
  ON location_verification_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = location_verification_log.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371000; -- Earth's radius in meters
  phi1 DECIMAL;
  phi2 DECIMAL;
  delta_phi DECIMAL;
  delta_lambda DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  phi1 := RADIANS(lat1);
  phi2 := RADIANS(lat2);
  delta_phi := RADIANS(lat2 - lat1);
  delta_lambda := RADIANS(lon2 - lon1);
  
  a := SIN(delta_phi / 2) * SIN(delta_phi / 2) +
       COS(phi1) * COS(phi2) *
       SIN(delta_lambda / 2) * SIN(delta_lambda / 2);
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance in meters between two GPS coordinates using Haversine formula';

-- Function to verify if location is within geofence
CREATE OR REPLACE FUNCTION is_within_geofence(
  teacher_lat DECIMAL,
  teacher_lon DECIMAL,
  student_id UUID
) RETURNS TABLE(
  within_geofence BOOLEAN,
  distance_meters DECIMAL,
  geofence_radius_meters INTEGER
) AS $$
DECLARE
  student_lat DECIMAL;
  student_lon DECIMAL;
  radius INTEGER;
  distance DECIMAL;
BEGIN
  -- Get student home location and geofence radius
  SELECT home_latitude, home_longitude, geofence_radius_meters
  INTO student_lat, student_lon, radius
  FROM students
  WHERE id = student_id;
  
  -- If no location set, return false
  IF student_lat IS NULL OR student_lon IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Calculate distance
  distance := calculate_distance(teacher_lat, teacher_lon, student_lat, student_lon);
  
  -- Check if within geofence
  RETURN QUERY SELECT (distance <= radius), distance, radius;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_within_geofence IS 'Check if teacher location is within student geofence radius';

-- Function to auto-expire old exceptions
CREATE OR REPLACE FUNCTION expire_old_exceptions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE geofence_exceptions
  SET status = 'expired'
  WHERE status = 'approved'
  AND valid_until < NOW()
  AND status != 'expired';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-expire exceptions
DROP TRIGGER IF EXISTS trigger_expire_exceptions ON geofence_exceptions;
CREATE TRIGGER trigger_expire_exceptions
  AFTER INSERT OR UPDATE ON geofence_exceptions
  FOR EACH STATEMENT
  EXECUTE FUNCTION expire_old_exceptions();

-- ============================================================================
-- 8. Update Existing Data
-- ============================================================================

-- Set default verification method for existing sessions
UPDATE teacher_sessions
SET verification_method = 'qr_code'
WHERE verification_method IS NULL;

-- ============================================================================
-- 9. Grants
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON teacher_biometric_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE ON geofence_exceptions TO authenticated;
GRANT SELECT, INSERT ON location_verification_log TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION is_within_geofence TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration record
INSERT INTO schema_migrations (version, name, executed_at)
VALUES (
  '015',
  'biometric_geofencing',
  NOW()
)
ON CONFLICT (version) DO NOTHING;
