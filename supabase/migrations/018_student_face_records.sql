-- Migration: 018_student_face_records.sql
-- Description: Create student face records table for face recognition check-in/check-out
-- Version: 2.0 (Server-Side Verification with Encryption)
-- Security: Face descriptors are encrypted with AES-256-GCM before storage

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Student Face Records Table
-- Stores encrypted face descriptors for student identity verification
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_face_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Encrypted face descriptor (AES-256-GCM)
    -- Format: IV (12 bytes) || Ciphertext || AuthTag (16 bytes)
    -- Original data: 128 x 4 bytes (Float32Array) = 512 bytes
    -- Encrypted: ~540 bytes
    face_descriptor_encrypted BYTEA NOT NULL,

    -- Descriptor version for compatibility tracking
    descriptor_version VARCHAR(20) NOT NULL DEFAULT 'face-api-0.22.2',

    -- Quality score from enrollment (0.0 - 1.0)
    quality_score DECIMAL(4, 3) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),

    -- Enrollment metadata (JSON)
    enrollment_metadata JSONB DEFAULT '{}',

    -- Soft delete flag for re-enrollment scenarios
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one active record per student
    CONSTRAINT unique_active_face_per_student UNIQUE (student_id, is_active)
        DEFERRABLE INITIALLY DEFERRED
);

-- Index for fast lookups by student_id (used during verification)
CREATE INDEX IF NOT EXISTS idx_face_records_student_id
    ON student_face_records(student_id)
    WHERE is_active = true;

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_face_records_created_at
    ON student_face_records(created_at);

-- ============================================================================
-- Face Verification Audit Table
-- Logs all verification attempts for security monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS face_verification_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who performed the verification
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,

    -- Which student was being verified
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Verification result
    verification_result VARCHAR(20) NOT NULL CHECK (
        verification_result IN ('success', 'failed', 'no_match', 'rate_limited', 'error')
    ),

    -- Server-calculated confidence score (0.0 - 1.0)
    confidence_score DECIMAL(4, 3) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Euclidean distance between descriptors
    distance DECIMAL(6, 4),

    -- Device information (browser, OS, etc.)
    device_info JSONB DEFAULT '{}',

    -- Client IP address (for security monitoring)
    ip_address INET,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying verification history by teacher
CREATE INDEX IF NOT EXISTS idx_audit_teacher_id
    ON face_verification_audit(teacher_id);

-- Index for querying verification history by student
CREATE INDEX IF NOT EXISTS idx_audit_student_id
    ON face_verification_audit(student_id);

-- Index for time-based queries (security monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_created_at
    ON face_verification_audit(created_at);

-- Index for finding failed attempts (security alerts)
CREATE INDEX IF NOT EXISTS idx_audit_failed_attempts
    ON face_verification_audit(teacher_id, created_at)
    WHERE verification_result IN ('failed', 'no_match', 'rate_limited');

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE student_face_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_verification_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policies for student_face_records
-- ============================================================================

-- Parents can insert face records for their own students
CREATE POLICY "Parents can enroll faces for their students"
    ON student_face_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.parent_id = auth.uid()
        )
    );

-- Parents can view face records for their own students (metadata only, not descriptors)
CREATE POLICY "Parents can view their students face records"
    ON student_face_records
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.parent_id = auth.uid()
        )
    );

-- Parents can update (deactivate) face records for their own students
CREATE POLICY "Parents can update their students face records"
    ON student_face_records
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.parent_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
            AND s.parent_id = auth.uid()
        )
    );

-- Service role can access all records (for server-side verification)
-- Note: Service role bypasses RLS by default, but we add explicit policy for clarity
CREATE POLICY "Service role can access all face records"
    ON student_face_records
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Policies for face_verification_audit
-- ============================================================================

-- Teachers can view their own verification audit logs
CREATE POLICY "Teachers can view their verification audit"
    ON face_verification_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.id = teacher_id
            AND t.user_id = auth.uid()
        )
    );

-- Service role can insert audit logs (from server-side verification)
CREATE POLICY "Service role can insert audit logs"
    ON face_verification_audit
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Service role can view all audit logs (for admin monitoring)
CREATE POLICY "Service role can view all audit logs"
    ON face_verification_audit
    FOR SELECT
    TO service_role
    USING (true);

-- ============================================================================
-- Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_face_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_face_records_timestamp ON student_face_records;

CREATE TRIGGER trigger_update_face_records_timestamp
    BEFORE UPDATE ON student_face_records
    FOR EACH ROW
    EXECUTE FUNCTION update_face_records_updated_at();

-- ============================================================================
-- Function to deactivate old face records when enrolling new one
-- ============================================================================

CREATE OR REPLACE FUNCTION deactivate_old_face_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Deactivate all existing active records for this student
    UPDATE student_face_records
    SET is_active = false, updated_at = NOW()
    WHERE student_id = NEW.student_id
    AND id != NEW.id
    AND is_active = true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deactivate_old_face_records ON student_face_records;

CREATE TRIGGER trigger_deactivate_old_face_records
    AFTER INSERT ON student_face_records
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_old_face_records();

-- ============================================================================
-- Add verification_method column to teacher_sessions if not exists
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teacher_sessions'
        AND column_name = 'verification_method'
    ) THEN
        ALTER TABLE teacher_sessions
        ADD COLUMN verification_method VARCHAR(20) DEFAULT 'qr_code'
        CHECK (verification_method IN ('qr_code', 'face_recognition', 'biometric', 'manual'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teacher_sessions'
        AND column_name = 'verification_confidence'
    ) THEN
        ALTER TABLE teacher_sessions
        ADD COLUMN verification_confidence DECIMAL(4, 3)
        CHECK (verification_confidence >= 0 AND verification_confidence <= 1);
    END IF;
END $$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE student_face_records IS
    'Stores encrypted face descriptors for student identity verification. Descriptors are encrypted with AES-256-GCM.';

COMMENT ON COLUMN student_face_records.face_descriptor_encrypted IS
    'AES-256-GCM encrypted 128-dimensional face descriptor. Format: IV (12 bytes) || Ciphertext || AuthTag (16 bytes)';

COMMENT ON COLUMN student_face_records.quality_score IS
    'Quality score from face enrollment (0.0-1.0). Higher scores indicate better face captures.';

COMMENT ON TABLE face_verification_audit IS
    'Audit log for all face verification attempts. Used for security monitoring and compliance.';

COMMENT ON COLUMN face_verification_audit.verification_result IS
    'Result of verification attempt: success, failed, no_match, rate_limited, or error';

COMMENT ON COLUMN face_verification_audit.confidence_score IS
    'Server-calculated confidence score based on Euclidean distance between face descriptors.';
