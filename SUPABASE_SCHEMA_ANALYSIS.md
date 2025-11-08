# Supabase Schema Analysis

**Generated**: 2025-11-08
**Status**: Complete schema documentation for production deployment

---

## Schema Overview

**Total Tables**: 21
**Custom Types (ENUM)**: Multiple (auth_status, billing_status, session_status, activity_status, country_code, grade_system, user_role, account_status, payment_method)

---

## Core Tables

### 1. Users & Authentication

#### `users` (Core user table)

- **Primary Key**: `id` (UUID)
- **Unique Fields**: `email`
- **Roles**: parent, teacher, admin, student (user_role ENUM)
- **Account Status**: active, inactive, suspended, deleted (account_status ENUM)
- **Key Fields**:
  - `email`, `name`, `role`, `phone_number`, `address` (JSONB)
  - `timezone`, `profile_picture_url`
  - `qualifications`, `specializations`, `availability` (JSONB)
  - `verification_status` (JSONB)
  - `emergency_contact` (JSONB)
  - `is_deleted` (soft delete flag)
  - Timestamps: `created_at`, `updated_at`, `last_active`

**RLS Requirements**:

- Users can only read/update their own records
- Admins can access all users
- Parents can view assigned teachers

#### `auth_sessions` (AI-enhanced authentication)

- **Foreign Key**: `user_id` → `users(id)`
- **Unique Fields**: `session_id`
- **Key Fields**:
  - `token_data` (JSONB)
  - `ai_context` (JSONB) - AI-powered authentication context
  - `risk_score` (numeric) - Security risk assessment
  - `status` (auth_status ENUM): pending, active, expired, revoked
  - `expires_at` (timestamp)

**RLS Requirements**: Users can only access their own sessions

---

### 2. Students & Teachers

#### `students`

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `parent_id` → `users(id)`
- **Key Fields**:
  - `name`, `age` (CHECK: 3-18), `birth_date`
  - `country` (country_code ENUM): UK, US, India
  - `grade_level`, `grade_system` (grade_system ENUM)
  - `learning_preferences`, `special_needs`, `academic_standards` (JSONB)
  - `assigned_teachers` (JSONB array)
  - `teacher_notes`, `profile_picture_url`

**RLS Requirements**:

- Parents can only access their own students
- Teachers can only access assigned students
- Admins have full access

#### `teachers`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `user_id` → `users(id)`
  - `parent_id` → `users(id)` (parent who created the teacher)
- **Key Fields**:
  - `name`, `email`, `phone`
  - `subjects`, `qualifications`, `specializations` (JSONB)
  - `experience_years`, `hourly_rate`
  - `availability`, `location` (JSONB)
  - `bio`, `status`, `verification_status`

**RLS Requirements**:

- Parents can access teachers they created
- Teachers can read their own profile
- Students/parents can view assigned teachers

#### `teacher_assignments`

- **Links**: teacher → student with subjects
- **Foreign Keys**: `teacher_id`, `student_id`, `parent_id`
- **Key Fields**:
  - `subjects` (JSONB array)
  - `start_date`, `end_date`, `is_active`

**RLS Requirements**: Parents can only manage their own assignments

---

### 3. Sessions & Scheduling

#### `sessions`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `student_id`, `teacher_id`, `parent_id`
- **Key Fields**:
  - `subject`, `scheduled_start`, `scheduled_end`
  - `actual_start`, `actual_end`
  - `location` (JSONB)
  - `status` (session_status ENUM): scheduled, in-progress, completed, cancelled, rescheduled
  - `notes`

**RLS Requirements**:

- Parents can access sessions for their students
- Teachers can access sessions they're assigned to
- Students can view their own sessions

#### `teacher_sessions` (Check-in/Check-out tracking)

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `teacher_id`, `student_id`, `parent_id`, `qr_code_used`
- **Key Fields**:
  - `session_type`, `teacher_name`, `student_name`, `subject`
  - `session_start`, `session_end`, `duration_minutes`
  - `check_in_time`, `check_out_time`, `total_hours`
  - `status` (CHECK: 'checked-in' or 'checked-out')
  - `location` (JSONB)
  - `verification_status`: pending, verified, failed
  - `qr_code_used` → `teacher_qr_codes(id)`

**RLS Requirements**: Same as sessions table

---

### 4. QR Code Authentication

#### `teacher_qr_codes`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `teacher_id` → `teachers(id)`, `student_id`, `parent_id`
- **Key Fields**:
  - `qr_code_data` (text) - Encrypted QR payload
  - `qr_code_type`: student_auth (default)
  - `is_active` (boolean)
  - `last_used`, `usage_count`

**RLS Requirements**:

- Parents can manage QR codes for their students
- Teachers can read QR codes assigned to them
- QR codes are student-specific

**Important**: QR codes are generated automatically when teachers are assigned to students (per CLAUDE.md)

---

### 5. Timesheets & Billing

#### `timesheets`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `session_id`, `teacher_id`, `student_id`, `parent_id`
- **Key Fields**:
  - `start_time`, `end_time`, `actual_duration`, `break_duration`
  - `location_start`, `location_end`, `location_verifications` (JSONB)
  - `billing_rate`, `total_amount`, `currency`, `rate_type`
  - `status` (session_status ENUM)
  - `auto_generated` (boolean) - Generated by automation service
  - `verification_level`: none, basic, verified, certified
  - `metadata` (JSONB)

**RLS Requirements**: Parents can access timesheets for their students

#### `teacher_rates`

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `teacher_id` → `users(id)`
- **Key Fields**:
  - `subject` (nullable - default rate if null)
  - `rate_type`: hourly, fixed, session
  - `rate_amount`, `currency`
  - `is_active`, `effective_date`, `end_date`

**RLS Requirements**:

- Parents can view rates for their teachers
- Teachers can manage their own rates

#### `billing`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `timesheet_id`, `teacher_id`, `parent_id`
- **Unique Fields**: `invoice_number`
- **Key Fields**:
  - `amount`, `currency`, `billing_date`, `due_date`
  - `status` (billing_status ENUM): pending, sent, paid, overdue, cancelled
  - `description`, `line_items` (JSONB)
  - `tax_amount`, `discount_amount`, `total_amount`

**RLS Requirements**: Parents can access their own billing records

#### `payments`

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `billing_id` → `billing(id)`
- **Key Fields**:
  - `amount`, `currency`
  - `payment_method` (ENUM): card, bank_transfer, cash, check, paypal
  - `payment_date`, `transaction_id`
  - `status`: pending, completed, failed, refunded
  - `metadata` (JSONB)

**RLS Requirements**: Parents can access their own payments

---

### 6. Data Sheets & Progress Tracking

#### `data_sheets`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `student_id`, `teacher_id`, `parent_id`
- **Key Fields**:
  - `date`, `title`, `description`
  - `activities`, `progress_summary`, `challenges`, `prompts` (JSONB)
  - `notes`
  - `is_template`, `template_name` (for reusable templates)

**RLS Requirements**:

- Parents can access data sheets for their students
- Teachers can create/update data sheets for assigned students

#### `data_sheet_activities`

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `data_sheet_id` → `data_sheets(id)`
- **Key Fields**:
  - `activity_type` (ENUM), `activity_name`, `description`
  - `scheduled_time`, `actual_start`, `actual_end`
  - `status` (activity_status ENUM): scheduled, in_progress, completed, cancelled
  - `progress_notes`, `prompts_used`, `challenges_encountered`, `success_indicators` (JSONB)
  - `rating` (CHECK: 1-5)
  - `observations`, `next_steps`, `attachments` (JSONB)

**RLS Requirements**: Same as data_sheets

#### `progress_tracking`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `student_id`, `data_sheet_id`, `activity_id`, `measured_by` → `users(id)`
- **Key Fields**:
  - `subject`, `skill_area`
  - `progress_data` (JSONB)
  - `measurement_date`, `notes`, `attachments` (JSONB)

**RLS Requirements**:

- Parents can view progress for their students
- Teachers can record progress for assigned students

---

### 7. AI & Analytics

#### `ai_insights`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `session_id` → `sessions(id)`, `user_id`
- **Key Fields**:
  - `type` (ENUM): learning, performance, recommendation, alert
  - `content` (text)
  - `confidence` (numeric, CHECK: 0-1)
  - `metadata` (JSONB)

**RLS Requirements**:

- Parents can access insights for their students
- Teachers can access insights for assigned students

#### `learning_analytics`

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `student_id`
- **Key Fields**:
  - `subject`
  - `progress_metrics`, `learning_patterns`, `recommendations` (JSONB)

**RLS Requirements**: Parents can access analytics for their students

#### `academic_standards`

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `country` (country_code ENUM): UK, US, India
  - `grade_level`, `grade_system` (ENUM)
  - `subject`
  - `standards`, `assessment_criteria` (JSONB)
  - `age_range` (JSONB)

**RLS Requirements**: Public read access (reference data)

---

### 8. Communication

#### `conversations`

- **Primary Key**: `id` (UUID)
- **Foreign Key**: `created_by` → `users(id)`
- **Key Fields**:
  - `participants` (JSONB array)
  - `conversation_type`: group, direct
  - `title`, `context` (JSONB)
  - `is_archived`

**RLS Requirements**: Users can only access conversations they're participants in

#### `messages`

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `conversation_id`, `sender_id`, `replied_to` → `messages(id)`
- **Key Fields**:
  - `content`, `message_type`: text, image, file, voice
  - `attachments`, `read_by` (JSONB)

**RLS Requirements**: Users can only access messages in their conversations

---

## Critical Schema Observations

### 1. **Parent Isolation Pattern**

Nearly every table has a `parent_id` foreign key, ensuring proper data isolation at the database level. This is critical for RLS policies.

### 2. **JSONB Heavy Design**

Extensive use of JSONB for flexible data structures:

- `activities`, `qualifications`, `specializations`, `availability`
- `location`, `metadata`, `context`
- `line_items`, `attachments`, `read_by`

**Implications**:

- Flexible schema evolution
- Complex querying may be needed (use JSONB operators)
- Indexing on JSONB fields may improve performance

### 3. **Soft Delete Pattern**

`users` table has `is_deleted` flag. Other tables may need similar patterns.

### 4. **Dual Teacher Tracking**

- `teachers` table: Teacher profiles created by parents
- `users` table with `role='teacher'`: User accounts
- Relationship: `teachers.user_id` → `users.id`

**Implication**: Teacher creation flow requires creating both a user AND a teacher record.

### 5. **Session Types**

Two session-related tables:

- `sessions`: Scheduled teaching sessions
- `teacher_sessions`: Check-in/check-out logs via QR codes

**Relationship**: A `timesheet` references a `session` (via `session_id` FK)

### 6. **Missing Foreign Keys**

Some tables are missing explicit foreign key constraints:

- `timesheets.session_id` → Should reference `sessions(id)` but constraint is missing
- `sessions.student_id` → Should reference `students(id)` but constraint is missing

**Action Required**: Verify if these are intentional or need to be added in migrations.

---

## Migration Status

Based on `supabase/migrations/` directory (per DEPLOYMENT_GAPS.md):

1. `00_enable_uuid_extension.sql` - UUID support
2. `001_initial_schema.sql` - Core tables (users, students, sessions)
3. `002_data_sheets_and_extended_features.sql` - Data sheets, progress tracking
4. `003_teachers_table.sql` - Teacher profiles
5. `004_teacher_qr_codes.sql` - QR authentication
6. `005_timesheet_schema.sql` - Timesheets and billing
7. `006_fix_rls_policies.sql` - Row Level Security
8. `007_update_teacher_sessions_for_timesheet.sql` - Timesheet integration
9. `01_fix_uuid_function.sql` - UUID function fixes

**Total**: 9 migration files

**Status**: ⚠️ Need to verify all migrations are applied in production Supabase

---

## Row Level Security (RLS) Requirements

### Critical RLS Policies Needed

#### Users Table

```sql
-- Users can read their own record
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY users_select_admin ON users FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

#### Students Table

```sql
-- Parents can access their own students
CREATE POLICY students_select_parent ON students FOR SELECT USING (parent_id = auth.uid());

-- Parents can insert students
CREATE POLICY students_insert_parent ON students FOR INSERT WITH CHECK (parent_id = auth.uid());

-- Parents can update their own students
CREATE POLICY students_update_parent ON students FOR UPDATE USING (parent_id = auth.uid());

-- Teachers can view assigned students
CREATE POLICY students_select_teacher ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments
    WHERE student_id = students.id
      AND teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
      AND is_active = true
  )
);
```

#### Sessions Table

```sql
-- Parents can access sessions for their students
CREATE POLICY sessions_select_parent ON sessions FOR SELECT USING (parent_id = auth.uid());

-- Teachers can access sessions they're assigned to
CREATE POLICY sessions_select_teacher ON sessions FOR SELECT USING (
  teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
);

-- Similar policies for INSERT, UPDATE, DELETE
```

#### Timesheets & Billing

```sql
-- Parents can access their own timesheets and billing
CREATE POLICY timesheets_select_parent ON timesheets FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY billing_select_parent ON billing FOR SELECT USING (parent_id = auth.uid());

-- Teachers can view timesheets for their sessions
CREATE POLICY timesheets_select_teacher ON timesheets FOR SELECT USING (
  teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
);
```

**Status**: RLS policies defined in `006_fix_rls_policies.sql` - need verification

---

## Data Integrity Concerns

### 1. **Orphaned Records Risk**

If foreign key constraints are missing:

- Deleting a student won't cascade to sessions, data_sheets, etc.
- Deleting a teacher won't cascade to teacher_sessions, timesheets, etc.

**Recommendation**: Use `ON DELETE CASCADE` or `ON DELETE SET NULL` appropriately

### 2. **JSONB Validation**

JSONB fields lack schema validation at the database level:

- `activities`, `qualifications`, `location`, etc.

**Recommendation**:

- Implement application-level validation (already done via Zod schemas in `src/lib/validation.ts`)
- Consider PostgreSQL CHECK constraints with JSONB operators for critical fields

### 3. **Enum Type Management**

Multiple custom ENUM types used. Changes require careful migration:

- `ALTER TYPE ... ADD VALUE` can't be rolled back
- Removing enum values requires recreating the type

**Recommendation**: Document all enum types and their allowed values

---

## Performance Considerations

### Recommended Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Students
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_country_grade ON students(country, grade_level);

-- Sessions
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX idx_sessions_parent_id ON sessions(parent_id);
CREATE INDEX idx_sessions_scheduled_start ON sessions(scheduled_start);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Teacher QR Codes
CREATE INDEX idx_teacher_qr_codes_teacher_student ON teacher_qr_codes(teacher_id, student_id);
CREATE INDEX idx_teacher_qr_codes_active ON teacher_qr_codes(is_active) WHERE is_active = true;

-- Timesheets
CREATE INDEX idx_timesheets_teacher_id ON timesheets(teacher_id);
CREATE INDEX idx_timesheets_parent_id ON timesheets(parent_id);
CREATE INDEX idx_timesheets_start_time ON timesheets(start_time);

-- JSONB Indexes (for common queries)
CREATE INDEX idx_students_assigned_teachers ON students USING GIN (assigned_teachers);
CREATE INDEX idx_sessions_location ON sessions USING GIN (location);
```

**Status**: Need to verify which indexes exist in production

---

## Action Items for Production

### Critical (Before Launch)

- [ ] **Apply all 9 migrations** via Supabase Dashboard
- [ ] **Verify RLS policies** are active on all tables (`npm run verify:rls`)
- [ ] **Test parent isolation** - Ensure parents can't access other parents' data
- [ ] **Verify foreign key constraints** - Check if session_id, student_id FKs exist
- [ ] **Enable RLS** on all tables (currently may be disabled for development)

### High Priority

- [ ] **Create recommended indexes** for performance
- [ ] **Document all ENUM types** and their allowed values
- [ ] **Set up database backups** (Supabase PITR)
- [ ] **Test soft delete behavior** for users table

### Medium Priority

- [ ] **Add missing foreign keys** if identified
- [ ] **Implement CASCADE delete** rules where appropriate
- [ ] **Monitor JSONB query performance** and add GIN indexes if needed
- [ ] **Review and optimize N+1 query patterns** in application code

---

## Schema-Application Alignment Check

### ✅ Aligned

- TypeScript types in `src/types/index.ts` match database schema
- Database service methods properly handle parent isolation
- QR code generation aligns with `teacher_qr_codes` table structure

### ⚠️ Potential Mismatches

1. **SessionRecord type** vs **sessions table**:
   - TypeScript has `aiInsights`, `aiRecommendations`, `learningPatterns`, `sessionAnalytics`
   - Database table doesn't have these columns (likely stored in separate `ai_insights` table)
   - **Impact**: Application may be using in-memory data that doesn't persist

2. **Teacher creation flow**:
   - Requires creating both `users` record (with role='teacher') AND `teachers` record
   - Current `DatabaseService.createTeacher()` may not handle dual creation
   - **Impact**: Teacher creation may fail in production

3. **Timesheet automation**:
   - `timesheets.session_id` foreign key may be missing
   - Automation service expects this relationship to exist
   - **Impact**: Timesheet generation may create orphaned records

---

## Conclusion

The Supabase schema is comprehensive and well-designed for a homeschooling platform with:

- Strong parent isolation patterns
- Flexible JSONB-based data structures
- AI-enhanced features (insights, analytics)
- Complete billing and timesheet tracking

**Critical next steps**:

1. Apply all migrations in production
2. Verify and test RLS policies
3. Create recommended indexes
4. Validate foreign key constraints
5. Test teacher creation and QR code generation flows

See [DEPLOYMENT_GAPS.md](DEPLOYMENT_GAPS.md) for the complete production readiness checklist.
