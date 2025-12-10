---
description: Create and apply Supabase database migration with RLS policies and validation
allowed-tools: [Read, Write, Bash, Glob]
---

# Create Supabase Migration

Create a production-ready database migration following GuruKool patterns with proper RLS policies.

## Arguments

- **$1**: Migration name (descriptive, e.g., `create_lessons_table`, `add_progress_tracking`)
- **$2**: Migration description

## Implementation Steps

### 1. Analyze Current Schema

First, check existing migrations:

```bash
# List existing migrations
ls supabase/migrations/

# Check latest migration number
ls supabase/migrations/ | tail -5
```

Read recent migrations for patterns:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/006_fix_rls_policies.sql`
- `supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql`

### 2. Determine Migration Number

Next available number based on existing migrations (e.g., `008`, `009`)

### 3. Create Migration File

File: `supabase/migrations/<number>_<migration_name>.sql`

### 4. Migration Structure

#### A. For New Table:

```sql
-- ============================================
-- Migration: <Number> - <Name>
-- Description: <description>
-- Created: <date>
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
CREATE TABLE IF NOT EXISTS <table_name> (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Add your columns here
  name TEXT NOT NULL,
  description TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can view their own records
CREATE POLICY "Parents can view their own <table_name>"
  ON <table_name>
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Policy: Parents can insert their own records
CREATE POLICY "Parents can insert their own <table_name>"
  ON <table_name>
  FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Policy: Parents can update their own records
CREATE POLICY "Parents can update their own <table_name>"
  ON <table_name>
  FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- Policy: Parents can delete their own records
CREATE POLICY "Parents can delete their own <table_name>"
  ON <table_name>
  FOR DELETE
  USING (auth.uid() = parent_id);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index on parent_id for efficient filtering
CREATE INDEX idx_<table_name>_parent_id ON <table_name>(parent_id);

-- Index on created_at for sorting
CREATE INDEX idx_<table_name>_created_at ON <table_name>(created_at DESC);

-- Add other indexes as needed

-- ============================================
-- Triggers
-- ============================================

-- Updated_at trigger function (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_<table_name>_updated_at
  BEFORE UPDATE ON <table_name>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments (Documentation)
-- ============================================

COMMENT ON TABLE <table_name> IS '<description>';
COMMENT ON COLUMN <table_name>.parent_id IS 'References the parent user who owns this record';
```

#### B. For Adding Column(s):

```sql
-- ============================================
-- Migration: <Number> - <Name>
-- Description: <description>
-- ============================================

-- Add column(s)
ALTER TABLE <table_name>
  ADD COLUMN IF NOT EXISTS <column_name> <data_type> <constraints>;

-- Example:
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS grade_level TEXT,
  ADD COLUMN IF NOT EXISTS learning_style TEXT;

-- Update existing data (if needed)
UPDATE students
SET grade_level = 'Year 1'
WHERE grade_level IS NULL;

-- Add index (if needed)
CREATE INDEX IF NOT EXISTS idx_<table>_<column> ON <table>(<column>);

-- Add comment
COMMENT ON COLUMN <table>.<column> IS '<description>';
```

#### C. For Data Sync/Trigger:

```sql
-- ============================================
-- Migration: <Number> - <Name>
-- Description: <description>
-- ============================================

-- Create trigger function
CREATE OR REPLACE FUNCTION sync_<source>_to_<target>()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync logic
  INSERT INTO <target_table> (...)
  VALUES (NEW.id, NEW.field1, ...)
  ON CONFLICT (id) DO UPDATE
  SET field1 = EXCLUDED.field1,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_sync_<source>_to_<target>
  AFTER INSERT OR UPDATE ON <source_table>
  FOR EACH ROW
  EXECUTE FUNCTION sync_<source>_to_<target>();
```

### 5. Verify Migration Locally

```bash
# Check Supabase connection
npm run verify:supabase

# Dry run (if using Supabase CLI)
npm run db:diff
```

### 6. Apply Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration SQL
3. Execute in SQL Editor
4. Verify success

**Option B: Via CLI**

```bash
# Link to project (if not already)
npm run db:link

# Push migration
npm run db:push

# Check status
npm run db:status
```

### 7. Verify RLS Policies

```bash
# Run RLS verification script
npm run verify:rls
```

Check that:

- [ ] All tables have RLS enabled
- [ ] SELECT policies enforce parent isolation
- [ ] INSERT policies enforce parent ownership
- [ ] UPDATE policies enforce parent ownership
- [ ] DELETE policies enforce parent ownership

### 8. Update TypeScript Types

Add types to `src/types/index.ts`:

```typescript
export interface <EntityName> {
  id: string;
  parent_id: string;
  // ... fields from migration
  created_at: string;
  updated_at: string;
}

export type <EntityName>Create = Omit<<EntityName>, 'id' | 'created_at' | 'updated_at'>;
export type <EntityName>Update = Partial<<EntityName>Create>;
```

### 9. Update DatabaseService

Add methods to `src/services/database.service.ts`:

```typescript
// Get records with parent isolation
static async get<EntityName>s(parentId: string): Promise<<EntityName>[]> {
  const { data, error } = await supabase
    .from('<table_name>')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Create with parent assignment
static async create<EntityName>(
  data: <EntityName>Create,
  parentId: string
): Promise<<EntityName>> {
  const { data: result, error } = await supabase
    .from('<table_name>')
    .insert({ ...data, parent_id: parentId })
    .select()
    .single();

  if (error) throw error;
  return result;
}
```

### 10. Update Flutter Models

If used by mobile app, add to `gurukool_teacher/lib/models/flutter/`:

```dart
import 'package:json_annotation/json_annotation.dart';

part '<entity>.g.dart';

@JsonSerializable()
class <Entity> {
  final String id;
  final String parentId;
  // ... fields
  final DateTime createdAt;
  final DateTime updatedAt;

  <Entity>({
    required this.id,
    required this.parentId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory <Entity>.fromJson(Map<String, dynamic> json) => _$<Entity>FromJson(json);
  Map<String, dynamic> toJson() => _$<Entity>ToJson(this);
}
```

Generate code:

```bash
cd gurukool_teacher
flutter pub run build_runner build --delete-conflicting-outputs
```

### 11. Update Documentation

Add to `QUICK_START_MIGRATIONS.md`:

```markdown
### Migration <Number>: <Name>

**Purpose:** <description>

**Changes:**

- Created `<table_name>` table
- Added RLS policies for parent isolation
- Created indexes for performance

**Apply:**

1. Go to Supabase Dashboard → SQL Editor
2. Run migration file: `supabase/migrations/<number>_<name>.sql`
3. Verify: `npm run verify:rls`
```

## Success Criteria

- [ ] Migration file created with correct numbering
- [ ] RLS policies included (SELECT, INSERT, UPDATE, DELETE)
- [ ] Indexes created for performance
- [ ] Triggers added (if needed)
- [ ] Migration applied successfully in Supabase
- [ ] RLS verification passes
- [ ] TypeScript types updated
- [ ] DatabaseService methods added
- [ ] Flutter models updated (if needed)
- [ ] Documentation updated

## Example Usage

```bash
# Create lessons table
/migration create_lessons_table "Add lessons table for homeschool curriculum management"

# Add progress tracking
/migration add_progress_tracking "Add student progress tracking fields to lessons table"

# Create sync trigger
/migration sync_sessions_to_billing "Sync teacher sessions to billing entries automatically"
```

## Common Migration Patterns

### Parent Isolation (REQUIRED)

Every table must have:

```sql
parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

### RLS Policies (REQUIRED)

Every table must have RLS enabled with parent isolation:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own records"
  ON <table> FOR SELECT
  USING (auth.uid() = parent_id);
```

### Timestamps (RECOMMENDED)

```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Soft Delete (OPTIONAL)

```sql
deleted_at TIMESTAMP WITH TIME ZONE
```

## Notes

- Always test migrations in development first
- Never skip RLS policies (security critical)
- Use CASCADE on foreign keys carefully
- Add indexes for frequently queried columns
- Document purpose in SQL comments
- Keep migrations reversible when possible
