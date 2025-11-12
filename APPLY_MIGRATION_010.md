# Apply Migration 010: Fix Teachers RLS INSERT Policy

## 🔴 Problem

**Error**: "Failed to create user profile" when creating teachers

**Root Cause**: Row Level Security (RLS) policy on `teachers` table is missing INSERT permission for parents

**Error Code**: 42501 - "new row violates row-level security policy for table 'teachers'"

---

## ✅ Solution

Apply migration `010_fix_teachers_rls_insert_policy.sql` to add the missing RLS policies.

---

## 📋 Step-by-Step Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `gurukool-homeschool`

2. **Navigate to SQL Editor**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"** button

3. **Copy Migration SQL**
   - Open file: `supabase/migrations/010_fix_teachers_rls_insert_policy.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

4. **Paste and Execute**
   - Paste SQL into the SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for success message: ✅ "Success. No rows returned"

5. **Verify Policies Created**
   - In SQL Editor, run this query:

   ```sql
   SELECT policyname, cmd
   FROM pg_policies
   WHERE tablename = 'teachers'
   ORDER BY policyname;
   ```

   - Expected output:

   ```
   policyname                          | cmd
   ------------------------------------|--------
   Admins can manage all teachers      | ALL
   Parents can create teachers         | INSERT
   Parents can read their teachers     | SELECT
   Parents can update their teachers   | UPDATE
   Parents can delete their teachers   | DELETE
   ```

6. **Test Teacher Creation**
   - Go back to your GuruKool app
   - Try creating a teacher profile again
   - Should now work without errors ✅

---

### Option 2: Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd c:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src

# Apply migration
supabase db push

# Or apply specific migration
supabase migration up --file supabase/migrations/010_fix_teachers_rls_insert_policy.sql
```

**Note**: CLI may not work if you haven't linked your local project to Supabase.

---

## 🧪 Testing After Migration

### Test 1: Run Diagnostic Script

```bash
node test-teacher-creation.js
```

**Expected Output**:

- ✅ All tests pass
- ✅ RLS policies allow teacher creation
- ✅ No "42501" errors

### Test 2: Create Teacher via App

1. Login as parent
2. Navigate to "Add Teacher" or "Create Teacher Profile"
3. Fill in teacher details:
   - Name: Test Teacher
   - Email: test@example.com
   - Subjects: Math, Science
   - Experience: 5 years
   - Hourly Rate: $50
4. Click "Create Teacher"
5. **Expected**: ✅ Success message "Teacher created successfully"

---

## 📊 What This Migration Does

### Before Migration:

```
teachers table RLS policies:
- ❌ No INSERT policy for parents
- ✅ Admins can manage all teachers (FOR ALL)
Result: Parents cannot create teachers → Error 42501
```

### After Migration:

```
teachers table RLS policies:
- ✅ Parents can INSERT where parent_id = auth.uid()
- ✅ Parents can SELECT where parent_id = auth.uid()
- ✅ Parents can UPDATE where parent_id = auth.uid()
- ✅ Parents can DELETE where parent_id = auth.uid()
- ✅ Admins can manage all teachers (FOR ALL)
Result: Parents CAN create teachers ✅
```

---

## 🔒 Security Implications

### ✅ Secure Parent Isolation

Each policy checks `auth.uid() = parent_id`, which means:

1. **Parents can ONLY create teachers assigned to themselves**
   - Cannot create teachers for other parents
   - `parent_id` must match logged-in user's ID

2. **Parents can ONLY see their own teachers**
   - Cannot query other parents' teachers
   - SELECT filtered by `parent_id`

3. **Parents can ONLY modify their own teachers**
   - Cannot update/delete other parents' teachers
   - UPDATE/DELETE filtered by `parent_id`

4. **Admins have full access**
   - Existing admin policy (FOR ALL) still works
   - Admins can manage all teachers regardless of parent_id

### ✅ No Security Vulnerabilities

- Row-level security enforced at database level
- Cannot be bypassed by API manipulation
- Auth token required for all operations
- Parent isolation guaranteed by Supabase Auth

---

## ❓ Troubleshooting

### Issue: "Policy already exists"

**Solution**: Some policies may already exist. That's OK!

- Check which policies exist: `SELECT policyname FROM pg_policies WHERE tablename = 'teachers';`
- Skip creating policies that already exist
- Or drop and recreate: `DROP POLICY IF EXISTS "policy_name" ON teachers;`

### Issue: Still getting 42501 error after migration

**Possible Causes**:

1. Migration not applied successfully
2. RLS still enabled but no policies
3. Auth token expired

**Debug Steps**:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'teachers';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'teachers';

-- Check if user is authenticated
SELECT auth.uid();  -- Should return your user ID, not NULL
```

### Issue: "Teachers table does not exist"

**Solution**: Apply earlier migrations first:

1. `001_initial_schema.sql`
2. `003_teachers_table.sql`
3. `006_fix_rls_policies.sql`
4. `008_make_teachers_user_id_nullable.sql`
5. `009_fix_teacher_rates_foreign_key.sql`
6. `010_fix_teachers_rls_insert_policy.sql` ← THIS ONE

---

## 📝 Related Files

- Migration SQL: `supabase/migrations/010_fix_teachers_rls_insert_policy.sql`
- Diagnostic Script: `test-teacher-creation.js`
- API Route: `src/app/api/teachers/route.ts`
- Database Service: `src/services/database.service.ts`

---

## ✅ Success Criteria

After applying this migration, you should be able to:

- ✅ Create teacher profiles as a parent
- ✅ View list of your teachers
- ✅ Update teacher details
- ✅ Delete teachers
- ✅ Assign teachers to students
- ✅ Generate QR codes for teachers

---

## 🎉 Next Steps After Success

1. Create teacher profiles for your students
2. Assign teachers to students (auto-generates QR codes)
3. Test QR scanner with real teacher QR codes
4. Test teacher check-in/check-out flow

---

**Created**: 2025-11-12
**Migration File**: `010_fix_teachers_rls_insert_policy.sql`
**Status**: Ready to apply
