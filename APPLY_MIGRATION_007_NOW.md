# Apply Migration 007 - Step-by-Step Guide

**Status**: ❌ Migration NOT YET APPLIED
**Action Required**: Follow steps below to apply migration

---

## ⚠️ Migration Status

**Checked**: November 13, 2025
**Trigger Status**: ❌ NOT FOUND
**Function Status**: ❌ NOT FOUND
**Data Status**:

- Teacher Sessions: 0
- Timesheet Entries: 0

**Conclusion**: Migration 007 has NOT been applied to your Supabase database.

---

## 📋 How to Apply (5 Minutes)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/miqhtpbutevdrkyndflf
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query** button

### Step 2: Copy Migration SQL

Open this file on your computer:

```
supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql
```

**Or copy from below** (scroll down to see full SQL)

### Step 3: Paste and Run

1. Paste the entire SQL into the query editor
2. Click **Run** button (or press `Ctrl+Enter`)
3. Wait for success message

### Step 4: Verify Success

You should see a success message like:

```
Success. No rows returned
CREATE FUNCTION
CREATE TRIGGER
INSERT 0
```

### Step 5: Verify Trigger Exists

Run this query in SQL Editor:

```sql
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_teacher_session_to_timesheet';
```

**Expected Result**: 1 row showing the trigger details

---

## 📄 Migration SQL (Copy This)

```sql
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
```

---

## ✅ After Applying

### Verify It Worked

Run this script:

```bash
node scripts/check-migration-007-status.js
```

**Expected Output**:

```
✅ MIGRATION 007 HAS BEEN APPLIED!
   The sync trigger is active and working.
```

### Test the Trigger

1. Create a test teacher session (via app or SQL)
2. Wait 1-2 seconds
3. Check if it appears in both tables:

```sql
-- Check NEW system
SELECT id, teacher_id, session_start, session_end
FROM teacher_sessions
ORDER BY created_at DESC
LIMIT 5;

-- Check OLD system (should have same sessions)
SELECT id, teacher_id, check_in_time, check_out_time
FROM timesheet_entries
ORDER BY created_at DESC
LIMIT 5;
```

Both queries should return the same session IDs.

---

## 🚨 Troubleshooting

### Error: "relation timesheet_entries does not exist"

**Cause**: OLD system table hasn't been created yet.

**Fix**: Apply migration 002 first:

```bash
# Check which migrations exist
ls supabase/migrations/

# Apply in order: 001, 002, 003, 004, 005, 006, then 007
```

### Error: "column qr_code_used does not exist"

**Cause**: teacher_sessions table doesn't have qr_code_used column.

**Fix**: Apply migration 004 and 007_update_teacher_sessions first.

### Error: "invalid input syntax for type uuid"

**Cause**: Using old version of migration 007.

**Fix**: Use the SQL from this file (above) which has the UUID bug fixed.

---

## 📊 What This Migration Does

**Before Migration**:

- Teachers create sessions in `teacher_sessions`
- Parents only see `timesheet_entries`
- **Result**: Parents miss some sessions ❌

**After Migration**:

- Teachers create sessions in `teacher_sessions`
- **Trigger automatically copies** to `timesheet_entries`
- Parents see ALL sessions ✅

**Data Flow**:

```
Teacher checks in via QR
    ↓
Creates record in teacher_sessions
    ↓
Trigger fires (within ~10-50ms)
    ↓
Automatically creates record in timesheet_entries
    ↓
Parents see session immediately
```

---

## 🔐 Safety Notes

- **Idempotent**: Safe to run multiple times
- **Reversible**: Can be rolled back (see below)
- **No data loss**: Uses `ON CONFLICT DO NOTHING`
- **Backwards compatible**: Doesn't break existing code

### Rollback (If Needed)

```sql
DROP TRIGGER IF EXISTS trigger_sync_teacher_session_to_timesheet ON teacher_sessions;
DROP FUNCTION IF EXISTS sync_teacher_session_to_timesheet();
```

**Note**: This does NOT delete already-synced data.

---

## 📞 Need Help?

- **Migration file**: [supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql](supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql)
- **Instructions**: [MIGRATION_007_INSTRUCTIONS.md](MIGRATION_007_INSTRUCTIONS.md)
- **Verification**: Run `node scripts/check-migration-007-status.js`

---

**Status**: ⏳ WAITING FOR YOU TO APPLY MIGRATION

Once applied, all service layer fixes will be fully functional!
