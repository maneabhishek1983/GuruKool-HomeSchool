-- Migration 007: Update teacher_sessions table for timesheet features
-- This adds columns required by the Teacher Timesheet Recording system
-- Run this AFTER migrations 001-006

-- Add missing columns to teacher_sessions table
ALTER TABLE teacher_sessions
  ADD COLUMN IF NOT EXISTS teacher_name TEXT,
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'checked-in' CHECK (status IN ('checked-in', 'checked-out')),
  ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS total_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS qr_code_used TEXT;

-- Backfill teacher_name and student_name for existing records
UPDATE teacher_sessions ts
SET
  teacher_name = t.name,
  student_name = s.name,
  check_in_time = COALESCE(ts.session_start, ts.created_at),
  status = CASE
    WHEN ts.session_end IS NOT NULL THEN 'checked-out'
    ELSE 'checked-in'
  END,
  total_hours = CASE
    WHEN ts.session_end IS NOT NULL THEN
      EXTRACT(EPOCH FROM (ts.session_end - ts.session_start)) / 3600
    ELSE NULL
  END
FROM teachers t, students s
WHERE ts.teacher_id = t.id
  AND ts.student_id = s.id
  AND (ts.teacher_name IS NULL OR ts.student_name IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_status ON teacher_sessions(status);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_check_in_time ON teacher_sessions(check_in_time);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_subject ON teacher_sessions(subject);

-- Update table comment
COMMENT ON TABLE teacher_sessions IS 'Teacher timesheet tracking with QR-based check-in/out and location tracking';

-- Add comments for new columns
COMMENT ON COLUMN teacher_sessions.teacher_name IS 'Denormalized teacher name for faster queries';
COMMENT ON COLUMN teacher_sessions.student_name IS 'Denormalized student name for faster queries';
COMMENT ON COLUMN teacher_sessions.subject IS 'Subject taught in this session';
COMMENT ON COLUMN teacher_sessions.status IS 'Session status: checked-in or checked-out';
COMMENT ON COLUMN teacher_sessions.check_in_time IS 'When teacher checked in (start of session)';
COMMENT ON COLUMN teacher_sessions.check_out_time IS 'When teacher checked out (end of session)';
COMMENT ON COLUMN teacher_sessions.total_hours IS 'Calculated session duration in hours';
COMMENT ON COLUMN teacher_sessions.qr_code_used IS 'QR code data used for check-in';
