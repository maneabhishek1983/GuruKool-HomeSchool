-- Run this in Supabase SQL Editor to verify Migration 007 was applied

-- Check if trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_teacher_session_to_timesheet';

-- Check if function exists
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'sync_teacher_session_to_timesheet';

-- Expected Results:
-- If migration applied: Both queries return 1 row each
-- If migration NOT applied: Both queries return 0 rows
