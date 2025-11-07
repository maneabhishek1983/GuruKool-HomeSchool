# Quick Start: Apply Migrations in 5 Minutes

Follow these steps to get your database set up immediately.

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/miqhtpbutevdrkyndflf/sql
2. You should see the SQL Editor

## Step 2: Run Each Migration

Copy and paste each SQL file content below into the SQL Editor and click **"Run"**.

### Migration 1: Initial Schema

**File:** `001_initial_schema.sql`

**What to do:**
1. In your terminal, run:
   ```bash
   cat supabase/migrations/001_initial_schema.sql
   ```
2. Copy the entire output
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for "Success" message

**Creates:** users, sessions, auth_sessions, students, ai_insights, learning_analytics tables

---

### Migration 2: Data Sheets

**File:** `002_data_sheets_and_extended_features.sql`

Repeat same process:
```bash
cat supabase/migrations/002_data_sheets_and_extended_features.sql
```

**Creates:** Data sheets functionality, syllabus management

---

### Migration 3: Teachers Table

**File:** `003_teachers_table.sql`

```bash
cat supabase/migrations/003_teachers_table.sql
```

**Creates:** teachers table, teacher-student relationships

---

### Migration 4: Timesheet

**File:** `003_timesheet_schema.sql`

```bash
cat supabase/migrations/003_timesheet_schema.sql
```

**Creates:** Timesheet tracking

---

### Migration 5: Teacher QR Codes

**File:** `004_teacher_qr_codes.sql`

```bash
cat supabase/migrations/004_teacher_qr_codes.sql
```

**Creates:** teacher_qr_codes, teacher_sessions tables

---

### Migration 6: RLS Policies (CRITICAL)

**File:** `006_fix_rls_policies.sql`

```bash
cat supabase/migrations/006_fix_rls_policies.sql
```

**Creates:** Row Level Security policies for all tables

---

## Step 3: Verify Setup

Run this in your project directory:

```bash
npm run verify:supabase
npm run verify:rls
```

Expected output:
```
✅ All 8 tables exist
✅ RLS policies working
✅ Connection successful
```

## Step 4: Start Development

```bash
npm run dev
```

Open http://localhost:3000

---

## If Something Goes Wrong

### Error: "relation already exists"

Some tables may already exist. Two options:

**Option A: Skip that migration** and continue with the next one.

**Option B: Drop all tables first:**

Run this in SQL Editor (⚠️ **WARNING: Deletes all data**):
```sql
DROP TABLE IF EXISTS teacher_sessions CASCADE;
DROP TABLE IF EXISTS teacher_qr_codes CASCADE;
DROP TABLE IF EXISTS learning_analytics CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS auth_status CASCADE;
DROP TYPE IF EXISTS insight_type CASCADE;
```

Then re-run all migrations from Migration 1.

### Error: "permission denied"

Make sure you're logged in as the project owner.

### Error: "syntax error"

Make sure you copied the **entire** SQL file, including the first line.

---

## Alternative: Use Supabase CLI

If you want to use CLI instead (faster for future migrations):

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref miqhtpbutevdrkyndflf

# Push all migrations at once
supabase db push
```

---

## Summary

After completing all 6 migrations, you'll have:

- ✅ User management (parents, teachers, admins)
- ✅ Student profiles with academic standards
- ✅ Session scheduling and tracking
- ✅ Teacher QR code authentication
- ✅ AI insights and analytics
- ✅ Row Level Security enabled
- ✅ Data sheets and syllabus management

**Total time:** ~5 minutes

**Ready to code!** 🚀
