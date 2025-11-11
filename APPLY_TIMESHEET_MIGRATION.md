# Apply Timesheet Migration Guide

## Quick Start

This guide shows you how to apply the timesheet QR code migration to enable check-in/check-out functionality.

---

## Prerequisites

- Access to Supabase Dashboard
- Project admin privileges
- Migration file: `supabase/migrations/002_timesheet_tables.sql`

---

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Login with your credentials
3. Select your project: **GuruKool HomeSchool**

---

### Step 2: Navigate to SQL Editor

1. In the left sidebar, click **SQL Editor**
2. Click **New query** button
3. Give it a name: `002_timesheet_tables`

---

### Step 3: Copy Migration SQL

1. Open the file: `supabase/migrations/002_timesheet_tables.sql`
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor

---

### Step 4: Execute Migration

1. Click **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for execution to complete
3. Check for success message: "Success. No rows returned"

---

### Step 5: Verify Tables Created

1. In left sidebar, click **Table Editor**
2. Verify the following tables exist:
   - ✅ `parent_qr_codes`
   - ✅ `timesheet_entries`

3. Click on each table to verify columns:

#### `parent_qr_codes` columns:

- `id` (uuid, primary key)
- `parent_id` (uuid, foreign key to users)
- `student_id` (uuid, foreign key to students)
- `qr_code_data` (text)
- `qr_code_image` (text)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `expires_at` (timestamp)

#### `timesheet_entries` columns:

- `id` (uuid, primary key)
- `teacher_id` (uuid, foreign key to users)
- `student_id` (uuid, foreign key to students)
- `parent_id` (uuid, foreign key to users)
- `qr_code_id` (uuid, foreign key to parent_qr_codes)
- `check_in_time` (timestamp)
- `check_out_time` (timestamp)
- `duration_minutes` (integer)
- `location` (jsonb)
- `notes` (text)
- `status` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

### Step 6: Verify RLS Policies

1. In SQL Editor, run this query to check RLS policies:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('parent_qr_codes', 'timesheet_entries');
```

2. You should see policies like:
   - `Parents can view their own QR codes`
   - `Teachers can view QR codes for their students`
   - `Teachers can view their own timesheet entries`
   - `Parents can view timesheet entries for their students`

---

### Step 7: Test the System

#### Option 1: Run Test Script

```bash
# From project root
node scripts/test-qr-flow.js
```

Expected output:

```
✅ QR code generation works
✅ QR code validation works
✅ Check-in recording works
✅ Check-out recording works
✅ Timestamp tracking works
✅ Duration calculation works
✅ Timesheet queries work
```

#### Option 2: Manual Test in UI

1. **As Parent**:
   - Login to parent portal
   - Go to student profile
   - View QR code (should display)
   - Print or display QR code

2. **As Teacher**:
   - Login to teacher portal
   - Click "Check In/Out"
   - Scan parent's QR code
   - Select "Check In"
   - Verify timestamp recorded

3. **Check Database**:
   - In Supabase, go to Table Editor
   - Open `timesheet_entries` table
   - Verify entry exists with `status = 'checked_in'`
   - Check `check_in_time` has correct timestamp

---

## Troubleshooting

### Error: "table already exists"

**Solution**: The migration has already been applied. No action needed.

### Error: "relation does not exist"

**Possible Causes**:

- Migration `001_initial_schema.sql` not applied
- Missing `students` or `users` tables

**Solution**: Apply migrations in order:

1. `00_enable_uuid_extension.sql`
2. `001_initial_schema.sql`
3. `002_data_sheets_and_extended_features.sql`
4. `002_timesheet_tables.sql`

### Error: "foreign key constraint"

**Solution**: Ensure parent tables exist:

- `users` table must exist
- `students` table must exist
- Apply migrations in correct order

### No QR Code Displays in UI

**Checklist**:

- [ ] Migration applied successfully
- [ ] Tables created (`parent_qr_codes`, `timesheet_entries`)
- [ ] RLS policies enabled
- [ ] Student record exists in database
- [ ] Parent is logged in with correct credentials

---

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop views first
DROP VIEW IF EXISTS teacher_timesheet_summary;
DROP VIEW IF EXISTS parent_timesheet_summary;

-- Drop triggers
DROP TRIGGER IF EXISTS calculate_duration_on_checkout ON timesheet_entries;
DROP TRIGGER IF EXISTS update_timesheet_entries_updated_at ON timesheet_entries;
DROP TRIGGER IF EXISTS update_parent_qr_codes_updated_at ON parent_qr_codes;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_timesheet_duration();

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS timesheet_entries;
DROP TABLE IF EXISTS parent_qr_codes;
```

**⚠️ Warning**: This will delete all timesheet data!

---

## Next Steps After Migration

1. ✅ Verify tables created
2. ✅ Test QR code generation in parent portal
3. ✅ Test QR code scanning in teacher portal
4. ✅ Verify timestamps recorded correctly
5. ✅ Test timesheet reporting
6. ✅ Monitor system in production

---

## Support

For issues or questions:

1. Check [QR_CODE_FLOW_VALIDATION.md](QR_CODE_FLOW_VALIDATION.md) for detailed documentation
2. Review [CLAUDE.md](CLAUDE.md) for architecture details
3. Open GitHub issue if problem persists

---

**Last Updated**: 2025-11-11
**Migration Version**: 002_timesheet_tables
**Status**: Ready for Deployment ✅
