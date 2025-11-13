-- Migration: Sync teacher_sessions to timesheet_entries
-- Purpose: Unify dual timesheet systems by automatically syncing NEW system → OLD system
-- Date: 2025-11-13
-- Issue: Parents only see timesheet_entries, teachers write to teacher_sessions
-- Solution: Database trigger copies teacher_sessions → timesheet_entries on INSERT/UPDATE

-- Step 1: Create function to sync teacher_sessions → timesheet_entries
CREATE OR REPLACE FUNCTION sync_teacher_session_to_timesheet()
RETURNS TRIGGER AS $$
DECLARE
  existing_entry_id UUID;
BEGIN
  -- Check if an entry already exists in timesheet_entries for this session
  SELECT id INTO existing_entry_id
  FROM timesheet_entries
  WHERE id = NEW.id;

  IF existing_entry_id IS NULL THEN
    -- INSERT: Create new entry in timesheet_entries
    -- Only insert if qr_code_used is not null (required field in timesheet_entries)
    IF NEW.qr_code_used IS NOT NULL THEN
      INSERT INTO timesheet_entries (
        id,
        teacher_id,
        student_id,
        parent_id,
        check_in_time,
        check_out_time,
        duration_minutes,
        location,
        notes,
        qr_code_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.teacher_id,
        NEW.student_id,
        NEW.parent_id,
        COALESCE(NEW.session_start, NOW()),
        NEW.session_end,
        NEW.duration_minutes,
        NEW.location,
        NEW.notes,
        NEW.qr_code_used,
        CASE
          WHEN NEW.session_end IS NOT NULL THEN 'checked_out'
          ELSE 'checked_in'
        END,
        NEW.created_at,
        NEW.updated_at
      );
    END IF;
  ELSE
    -- UPDATE: Sync changes to existing entry (only if qr_code_used is not null)
    IF NEW.qr_code_used IS NOT NULL THEN
      UPDATE timesheet_entries
      SET
        teacher_id = NEW.teacher_id,
        student_id = NEW.student_id,
        parent_id = NEW.parent_id,
        check_in_time = COALESCE(NEW.session_start, check_in_time),
        check_out_time = NEW.session_end,
        duration_minutes = NEW.duration_minutes,
        location = NEW.location,
        notes = NEW.notes,
        qr_code_id = NEW.qr_code_used,
        status = CASE
          WHEN NEW.session_end IS NOT NULL THEN 'checked_out'
          ELSE 'checked_in'
        END,
        updated_at = NEW.updated_at
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger to fire on INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_sync_teacher_session_to_timesheet ON teacher_sessions;
CREATE TRIGGER trigger_sync_teacher_session_to_timesheet
  AFTER INSERT OR UPDATE ON teacher_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_session_to_timesheet();

-- Step 3: Backfill existing teacher_sessions → timesheet_entries
-- This handles any sessions created before the trigger was installed
-- ONLY backfill sessions that have qr_code_used (required field)
INSERT INTO timesheet_entries (
  id,
  teacher_id,
  student_id,
  parent_id,
  check_in_time,
  check_out_time,
  duration_minutes,
  location,
  notes,
  qr_code_id,
  status,
  created_at,
  updated_at
)
SELECT
  ts.id,
  ts.teacher_id,
  ts.student_id,
  ts.parent_id,
  COALESCE(ts.session_start, ts.created_at),
  ts.session_end,
  ts.duration_minutes,
  ts.location,
  ts.notes,
  ts.qr_code_used,
  CASE
    WHEN ts.session_end IS NOT NULL THEN 'checked_out'
    ELSE 'checked_in'
  END,
  ts.created_at,
  ts.updated_at
FROM teacher_sessions ts
LEFT JOIN timesheet_entries te ON ts.id = te.id
WHERE te.id IS NULL  -- Only insert if not already in timesheet_entries
  AND ts.qr_code_used IS NOT NULL  -- Only backfill sessions with QR code
ON CONFLICT (id) DO NOTHING;  -- Skip if ID already exists (safety check)

-- Step 4: Add comment to document the trigger
COMMENT ON FUNCTION sync_teacher_session_to_timesheet() IS
'Automatically syncs teacher_sessions (NEW system) to timesheet_entries (OLD system) to unify dual timesheet tracking. Converts session_start/session_end to check_in_time/check_out_time format.';

COMMENT ON TRIGGER trigger_sync_teacher_session_to_timesheet ON teacher_sessions IS
'Syncs NEW system (teacher_sessions) to OLD system (timesheet_entries) for parent visibility. Part of Fix #3 from Architecture Review.';
