---
description: Automatically verifies Row Level Security (RLS) policies are properly configured for all Supabase tables, ensuring parent isolation and data security
allowed-tools: [Read, Bash]
---

# RLS Policy Verifier Skill

## Automatic Activation

This skill activates when:

- New Supabase migration created
- Table structure modified
- User mentions "RLS", "security", "policies"
- Before deployment
- After database schema changes

## Core Capabilities

### 1. Policy Detection

- Scan all Supabase tables
- Check if RLS is enabled
- Identify missing policies
- Verify policy completeness

### 2. Policy Validation

- Verify SELECT policies enforce parent isolation
- Verify INSERT policies enforce parent ownership
- Verify UPDATE policies enforce parent ownership
- Verify DELETE policies enforce parent ownership
- Check for policy conflicts

### 3. Security Audit

- Identify tables without RLS
- Find weak or missing policies
- Check for unauthorized data access
- Validate authentication requirements

### 4. Remediation Guidance

- Suggest missing policies
- Provide SQL for fixes
- Prioritize by severity
- Generate migration for fixes

## Required RLS Patterns

### Pattern 1: Standard Parent Isolation

**For tables with `parent_id` column:**

```sql
-- Enable RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Parents can view their own <table_name>"
  ON <table_name>
  FOR SELECT
  USING (auth.uid() = parent_id);

-- INSERT policy
CREATE POLICY "Parents can insert their own <table_name>"
  ON <table_name>
  FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- UPDATE policy
CREATE POLICY "Parents can update their own <table_name>"
  ON <table_name>
  FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- DELETE policy
CREATE POLICY "Parents can delete their own <table_name>"
  ON <table_name>
  FOR DELETE
  USING (auth.uid() = parent_id);
```

### Pattern 2: Teacher Access

**For tables accessed by teachers:**

```sql
-- SELECT: Teacher can view assigned records
CREATE POLICY "Teachers can view assigned <table_name>"
  ON <table_name>
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_qr_codes
      WHERE teacher_id = auth.uid()
      AND student_id = <table_name>.student_id
      AND is_active = true
    )
  );

-- INSERT: Teacher can create for assigned students
CREATE POLICY "Teachers can create for assigned students"
  ON <table_name>
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_qr_codes
      WHERE teacher_id = auth.uid()
      AND student_id = <table_name>.student_id
      AND is_active = true
    )
  );
```

### Pattern 3: Multi-Role Access

**For tables with role-based access:**

```sql
-- Parents see their own
-- Teachers see assigned
-- Admins see all

CREATE POLICY "Multi-role access policy"
  ON <table_name>
  FOR SELECT
  USING (
    -- Parent access
    auth.uid() = parent_id
    OR
    -- Teacher access
    EXISTS (
      SELECT 1 FROM teacher_qr_codes
      WHERE teacher_id = auth.uid()
      AND student_id = <table_name>.student_id
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

## Verification Workflow

### Step 1: Run RLS Verification Script

```bash
# Run comprehensive RLS check
npm run verify:rls
```

This script should check:

- All tables have RLS enabled
- All tables have SELECT policy
- All tables have INSERT policy
- All tables have UPDATE policy (if updates allowed)
- All tables have DELETE policy (if deletes allowed)
- Policies enforce parent isolation

### Step 2: Analyze Results

**Check Output For:**

- ✅ Tables with complete RLS
- ⚠️ Tables with partial RLS
- ❌ Tables without RLS

**Expected Output:**

```
Checking RLS policies...

✅ students: RLS enabled, 4/4 policies
✅ teachers: RLS enabled, 4/4 policies
✅ teacher_qr_codes: RLS enabled, 4/4 policies
✅ teacher_sessions: RLS enabled, 4/4 policies
⚠️ sessions: RLS enabled, 3/4 policies (missing DELETE)
❌ data_sheets: RLS DISABLED

Summary:
- Total tables: 10
- Fully protected: 8
- Partially protected: 1
- Unprotected: 1
- Status: NEEDS ATTENTION
```

### Step 3: Manual Verification (If Script Unavailable)

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'sql_%';

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Check for tables without policies
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
AND p.policyname IS NULL
AND t.rowsecurity = true;
```

### Step 4: Test Policies

**Test Parent Isolation:**

```sql
-- As user1, should only see their records
SET request.jwt.claim.sub = 'user1-uuid';
SELECT * FROM students; -- Should return only user1's students

-- As user2, should only see their records
SET request.jwt.claim.sub = 'user2-uuid';
SELECT * FROM students; -- Should return only user2's students

-- Unauthenticated, should see nothing
RESET request.jwt.claim.sub;
SELECT * FROM students; -- Should return empty or error
```

### Step 5: Generate Remediation SQL

**For Missing RLS:**

```sql
-- Enable RLS on unprotected table
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Add required policies
CREATE POLICY "Parents can view their own <table>"
  ON <table_name> FOR SELECT
  USING (auth.uid() = parent_id);

-- ... (other policies)
```

**For Incomplete Policies:**

```sql
-- Add missing DELETE policy
CREATE POLICY "Parents can delete their own <table>"
  ON <table_name> FOR DELETE
  USING (auth.uid() = parent_id);
```

## Critical Tables to Verify

### Must Have RLS:

- `students` - Student profiles
- `teachers` - Teacher profiles
- `teacher_qr_codes` - QR authentication codes
- `teacher_sessions` - Session logs
- `timesheet_entries` - Timesheet data
- `sessions` - Legacy sessions
- `data_sheets` - Student data
- Any custom tables with parent_id

### Exceptions (No RLS Needed):

- `users` - Supabase auth handles this
- System/lookup tables (if read-only and non-sensitive)

## Security Audit Checklist

### Table-Level Security

- [ ] All tables with `parent_id` have RLS enabled
- [ ] All user-data tables have RLS enabled
- [ ] No tables expose data without authentication

### Policy Completeness

- [ ] All tables have SELECT policy
- [ ] All tables have INSERT policy
- [ ] Tables allowing updates have UPDATE policy
- [ ] Tables allowing deletes have DELETE policy

### Policy Correctness

- [ ] SELECT policies check `auth.uid() = parent_id`
- [ ] INSERT policies check `auth.uid() = parent_id`
- [ ] UPDATE policies check ownership in both USING and WITH CHECK
- [ ] DELETE policies check `auth.uid() = parent_id`

### Teacher Access

- [ ] Teachers can only view assigned students
- [ ] Teachers can only create sessions for assigned students
- [ ] Teachers cannot modify parent-owned data

### Admin Access

- [ ] Admins have appropriate elevated access (if needed)
- [ ] Admin access is properly scoped
- [ ] Admin actions are auditable

## Common RLS Vulnerabilities

### 1. Missing RLS

```sql
-- ❌ VULNERABLE: Table without RLS
-- Anyone can access any row
```

**Fix:**

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
```

### 2. Missing WITH CHECK

```sql
-- ❌ VULNERABLE: Can read own data but insert for others
CREATE POLICY "policy" ON <table> FOR INSERT
  USING (auth.uid() = parent_id);
-- Missing: WITH CHECK (auth.uid() = parent_id)
```

**Fix:**

```sql
CREATE POLICY "policy" ON <table> FOR INSERT
  WITH CHECK (auth.uid() = parent_id);
```

### 3. Missing USING on UPDATE

```sql
-- ❌ VULNERABLE: Can update others' data
CREATE POLICY "policy" ON <table> FOR UPDATE
  WITH CHECK (auth.uid() = parent_id);
-- Missing: USING (auth.uid() = parent_id)
```

**Fix:**

```sql
CREATE POLICY "policy" ON <table> FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);
```

### 4. Overly Permissive Policy

```sql
-- ❌ VULNERABLE: Returns all rows
CREATE POLICY "policy" ON <table> FOR SELECT
  USING (true);
```

**Fix:**

```sql
CREATE POLICY "policy" ON <table> FOR SELECT
  USING (auth.uid() = parent_id);
```

### 5. No Authentication Check

```sql
-- ❌ VULNERABLE: Allows unauthenticated access
CREATE POLICY "policy" ON <table> FOR SELECT
  USING (parent_id IS NOT NULL);
```

**Fix:**

```sql
CREATE POLICY "policy" ON <table> FOR SELECT
  USING (auth.uid() = parent_id);
```

## Integration with Workflow

### Before Database Migration

```bash
# 1. Apply migration
# 2. Verify RLS
npm run verify:rls
# 3. Fix any issues before proceeding
```

### Before Deployment

```bash
# RLS verification is part of deploy checklist
npm run verify:rls

# Should output: "✅ All tables properly protected"
```

### During Code Review

- Check that new tables include RLS policies in migration
- Verify policies follow standard patterns
- Test policies manually if complex

## Success Criteria

- ✅ All user-data tables have RLS enabled
- ✅ All tables have complete policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ All policies enforce parent isolation
- ✅ No unauthorized data access possible
- ✅ `npm run verify:rls` passes
- ✅ Manual policy testing confirms isolation

## Automated Integration

This skill should automatically run:

1. After creating/modifying migrations
2. Before deploying to production
3. When user mentions security concerns
4. As part of comprehensive test suite

## Notes

- RLS is the primary security mechanism - never skip it
- Test policies thoroughly with different user contexts
- Document any exceptions to standard patterns
- Consider performance impact of complex policies
- Use indexes on columns used in policies (especially `parent_id`)
- RLS policies run for every query - keep them efficient
- Never bypass RLS by using service role in client code
