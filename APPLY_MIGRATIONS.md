# Apply Database Migrations to Supabase

Your Supabase connection is working, but the database tables don't exist yet. Follow these steps to apply migrations.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: **GuruKool-HomeSchool**
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Migrations in Order

Run each migration file in sequence. Copy and paste the SQL from each file into the SQL editor and click "Run".

#### 1. Initial Schema (001_initial_schema.sql)

```bash
# Read the file
cat supabase/migrations/001_initial_schema.sql
```

Copy the output and run in SQL Editor. This creates:
- `users` table
- `students` table
- `sessions` table
- `ai_insights` table
- `learning_analytics` table
- Basic RLS policies

#### 2. Data Sheets and Extended Features (002_data_sheets_and_extended_features.sql)

```bash
cat supabase/migrations/002_data_sheets_and_extended_features.sql
```

This adds:
- Data sheets functionality
- Syllabus management
- Extended student/session features

#### 3. Teachers Table (003_teachers_table.sql)

```bash
cat supabase/migrations/003_teachers_table.sql
```

This creates:
- `teachers` table
- Teacher-student relationships

#### 4. Timesheet Schema (003_timesheet_schema.sql)

```bash
cat supabase/migrations/003_timesheet_schema.sql
```

This adds:
- Timesheet tracking
- Session duration management

#### 5. Teacher QR Codes (004_teacher_qr_codes.sql)

```bash
cat supabase/migrations/004_teacher_qr_codes.sql
```

This creates:
- `teacher_qr_codes` table
- `teacher_sessions` table
- QR code authentication system

#### 6. Fix RLS Policies (006_fix_rls_policies.sql)

```bash
cat supabase/migrations/006_fix_rls_policies.sql
```

This ensures:
- Proper RLS policies on all tables
- Secure access controls
- Parent isolation

## Method 2: Using Supabase CLI (Advanced)

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

### Link to Your Project

```bash
# Link to your project using Project ID
supabase link --project-ref miqhtpbutevdrkyndflf
```

### Apply Migrations

```bash
# Apply all migrations
supabase db push

# Or apply migrations one at a time
supabase db execute --file supabase/migrations/001_initial_schema.sql
supabase db execute --file supabase/migrations/002_data_sheets_and_extended_features.sql
# ... etc
```

## Verification

After running all migrations, verify the setup:

```bash
# 1. Test connection (should show 8 tables)
npm run verify:supabase

# 2. Test RLS policies (should pass all tests)
npm run verify:rls
```

Expected output from `verify:supabase`:
```
✅ Table 'users' exists
✅ Table 'students' exists
✅ Table 'teachers' exists
✅ Table 'sessions' exists
✅ Table 'teacher_qr_codes' exists
✅ Table 'teacher_sessions' exists
✅ Table 'ai_insights' exists
✅ Table 'learning_analytics' exists
```

Expected output from `verify:rls`:
```
✅ Passed: 6/7
⚠️  Warnings: 1
```

## Troubleshooting

### Migration Fails

If a migration fails:
1. Check the error message in SQL Editor
2. Look for existing tables/columns
3. You may need to modify migration to use `IF NOT EXISTS`
4. Or drop conflicting tables first (⚠️ WARNING: loses data!)

### Tables Already Exist

If tables already exist from manual creation:
1. Drop all tables in reverse order:
   ```sql
   DROP TABLE IF EXISTS teacher_sessions CASCADE;
   DROP TABLE IF EXISTS teacher_qr_codes CASCADE;
   DROP TABLE IF EXISTS learning_analytics CASCADE;
   DROP TABLE IF EXISTS ai_insights CASCADE;
   DROP TABLE IF EXISTS sessions CASCADE;
   DROP TABLE IF EXISTS students CASCADE;
   DROP TABLE IF EXISTS teachers CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
2. Re-run migrations from scratch

### RLS Policies Fail

If RLS verification still fails:
1. Go to Table Editor in Supabase Dashboard
2. For each table, click the "..." menu → "View policies"
3. Click "Enable RLS" if not enabled
4. Manually create policies from `006_fix_rls_policies.sql`

## Next Steps After Migration

1. ✅ Run `npm run verify:supabase` - should show all green
2. ✅ Run `npm run verify:rls` - should show RLS working
3. ✅ Create test user in Supabase Dashboard → Authentication → Users
4. ✅ Test login in your application: `npm run dev`
5. ✅ Create sample parent, students, teachers in the app

## Migration File Summary

| File | Purpose | Tables Created |
|------|---------|----------------|
| `001_initial_schema.sql` | Core schema | users, students, sessions, ai_insights, learning_analytics |
| `002_data_sheets_and_extended_features.sql` | Data sheets | data_sheets, syllabus tables |
| `003_teachers_table.sql` | Teachers | teachers |
| `003_timesheet_schema.sql` | Timesheets | timesheet_entries |
| `004_teacher_qr_codes.sql` | QR system | teacher_qr_codes, teacher_sessions |
| `006_fix_rls_policies.sql` | Security | RLS policies for all tables |

---

**Questions?**

Check the main [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for more details on Supabase configuration.
