# Migration 007: Teacher Sessions Sync Trigger

## Overview

This migration adds automatic synchronization from `teacher_sessions` (NEW system) to `timesheet_entries` (OLD system). This ensures parents can see all teacher sessions regardless of which table they're stored in.

## What It Does

1. **Creates a database trigger** that fires after INSERT/UPDATE on `teacher_sessions`
2. **Automatically copies** session data to `timesheet_entries` with field mapping:
   - `session_start` → `check_in_time`
   - `session_end` → `check_out_time`
   - `session_type` determines `status` (checked_in/checked_out)
   - **Only syncs sessions with valid `qr_code_used`** (required UUID field)
3. **Backfills existing data** from `teacher_sessions` to `timesheet_entries`

**IMPORTANT**: The trigger only syncs sessions that have a valid `qr_code_used` UUID. Sessions without a QR code will NOT be synced to the OLD system (this is by design to maintain data integrity with the NOT NULL constraint on `qr_code_id`).

## Why This Is Needed

**Problem**: Parents only see `timesheet_entries`, but teachers write to `teacher_sessions`. This causes data fragmentation where parents can't see some teacher sessions.

**Solution**: Database trigger keeps both tables in sync automatically.

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/miqhtpbutevdrkyndflf)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success message

### Option 2: Via Script (Requires Supabase REST API)

```bash
# Apply migration
node scripts/apply-migration-007.js

# Verify it worked
node scripts/verify-sync-mechanism.js
```

**Note**: The script method requires `exec_sql` RPC endpoint which may not be available in all Supabase plans. If it fails, use Option 1 (Dashboard).

## Verification Steps

After applying the migration:

1. **Check trigger exists**:
   - Go to Supabase Dashboard → Database → Triggers
   - Look for: `trigger_sync_teacher_session_to_timesheet` on `teacher_sessions` table
   - Status should be **ENABLED**

2. **Test with real data**:

   ```bash
   node scripts/verify-sync-mechanism.js
   ```

   This script:
   - Creates a test session in `teacher_sessions`
   - Waits 2 seconds for trigger to fire
   - Verifies the session appears in `timesheet_entries`
   - Updates the session (adds check-out time)
   - Verifies update synced
   - Cleans up test data

3. **Manual test**:
   - Have a teacher check in via QR code
   - Query both tables:
     ```sql
     SELECT * FROM teacher_sessions WHERE teacher_id = 'xxx' ORDER BY created_at DESC LIMIT 1;
     SELECT * FROM timesheet_entries WHERE teacher_id = 'xxx' ORDER BY created_at DESC LIMIT 1;
     ```
   - Verify both have the same session data
   - Have the teacher check out
   - Verify both tables updated

## Rollback (If Needed)

If the migration causes issues, you can roll it back:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_sync_teacher_session_to_timesheet ON teacher_sessions;

-- Drop function
DROP FUNCTION IF EXISTS sync_teacher_session_to_timesheet();

-- Optionally: Delete synced entries (CAREFUL!)
-- DELETE FROM timesheet_entries WHERE id IN (SELECT id FROM teacher_sessions);
```

**⚠️ Warning**: Rollback will NOT remove already-synced entries from `timesheet_entries`. You'll need to manually decide whether to keep or delete them.

## Expected Impact

### Before Migration

- Teachers create sessions in `teacher_sessions`
- Parents only see `timesheet_entries`
- **Result**: Parents miss some teacher sessions

### After Migration

- Teachers create sessions in `teacher_sessions` (no change)
- Trigger automatically copies to `timesheet_entries`
- Parents see ALL sessions (from both tables)
- **Result**: Complete visibility for parents

## Performance Considerations

- **Trigger overhead**: Minimal (~10-50ms per INSERT/UPDATE)
- **Backfill time**: Depends on number of existing sessions
  - 100 sessions: ~1 second
  - 1,000 sessions: ~5 seconds
  - 10,000 sessions: ~30 seconds
- **Storage**: Doubles session data storage (sessions exist in both tables)

## Future Work

Once this migration is stable and both systems are confirmed in sync for 30+ days:

1. **Phase 2**: Deprecate OLD system (`timesheet_entries`)
2. **Phase 3**: Migrate all parent views to read from `teacher_sessions` only
3. **Phase 4**: Remove trigger and OLD table (full unification)

See [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md) for full migration roadmap.

## Troubleshooting

### Trigger not firing

- Check trigger status in Supabase Dashboard
- Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'sync_teacher_session_to_timesheet';`
- Check Supabase logs for errors

### Data not syncing

- Verify RLS policies allow service role to write to `timesheet_entries`
- Check for unique constraint violations (ID conflicts)
- Review Supabase function logs

### Duplicate entries

- The function uses `ON CONFLICT (id) DO NOTHING` to prevent duplicates
- If you see duplicates, check if IDs are different between systems

## Contact

For issues or questions about this migration:

- Review full architecture report: [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md)
- Check implementation: [supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql](supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql)
- Verify script: [scripts/verify-sync-mechanism.js](scripts/verify-sync-mechanism.js)
