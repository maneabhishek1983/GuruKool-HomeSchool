-- Migration 013: Fix sync trigger and foreign key constraints for timesheet_entries
--
-- Issues:
-- 1. teacher_sessions.teacher_id references teachers(id)
--    timesheet_entries.teacher_id references users(id)
--    The sync trigger was copying the wrong ID
--
-- 2. timesheet_entries.qr_code_id references parent_qr_codes(id)
--    But we're inserting teacher_qr_codes IDs from teacher_sessions
--
-- Fixes:
-- 1. Look up teachers.user_id when syncing to timesheet_entries
-- 2. Drop the qr_code_id FK constraint and make it nullable (two QR systems coexist)

-- Step 0: Fix the qr_code_id foreign key constraint
-- Drop the constraint that references parent_qr_codes since we're using teacher_qr_codes
ALTER TABLE timesheet_entries DROP CONSTRAINT IF EXISTS timesheet_entries_qr_code_id_fkey;

-- Make qr_code_id nullable since not all entries come from QR scans
ALTER TABLE timesheet_entries ALTER COLUMN qr_code_id DROP NOT NULL;

-- Step 1: Drop the existing sync trigger
DROP TRIGGER IF EXISTS trigger_sync_teacher_session_to_timesheet ON teacher_sessions;

-- Step 2: Replace the sync function with corrected version
CREATE OR REPLACE FUNCTION sync_teacher_session_to_timesheet()
RETURNS TRIGGER AS $$
DECLARE
  existing_entry_id UUID;
  teacher_user_id UUID;
BEGIN
  -- Look up the user_id from teachers table
  -- teacher_sessions.teacher_id is a foreign key to teachers.id
  -- timesheet_entries.teacher_id expects users.id
  SELECT user_id INTO teacher_user_id
  FROM teachers
  WHERE id = NEW.teacher_id;

  -- If teacher not found or user_id is null, skip sync but don't fail
  IF teacher_user_id IS NULL THEN
    RAISE WARNING 'Teacher user_id not found for teacher_id %, skipping timesheet sync', NEW.teacher_id;
    RETURN NEW;
  END IF;

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
        teacher_id,  -- This is now the user_id, not the teacher table id
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
        teacher_user_id,  -- Use the looked-up user_id
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
        teacher_id = teacher_user_id,  -- Use the looked-up user_id
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

-- Step 3: Recreate the trigger
CREATE TRIGGER trigger_sync_teacher_session_to_timesheet
  AFTER INSERT OR UPDATE ON teacher_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_session_to_timesheet();

-- Step 4: Add comment documenting the fix
COMMENT ON FUNCTION sync_teacher_session_to_timesheet() IS
'Syncs teacher_sessions to timesheet_entries. Fixed in migration 013 to correctly resolve teachers.user_id for the timesheet_entries.teacher_id foreign key constraint.';
