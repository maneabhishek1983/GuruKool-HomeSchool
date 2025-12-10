---
description: Automatically creates and applies Supabase database migrations with proper RLS policies, indexes, and validation when user mentions database changes, schema modifications, or table operations
allowed-tools: [Read, Write, Bash, Glob]
---

# Supabase Migration Skill

## Automatic Activation

This skill activates automatically when the conversation contains:

- "create table"
- "add column"
- "database migration"
- "schema change"
- "modify database"
- "update table"
- "add index"
- "RLS policy"
- "trigger" or "function"

## Core Capabilities

### 1. Schema Analysis

- Read existing migrations in `supabase/migrations/`
- Determine next migration number automatically
- Analyze schema conflicts
- Validate migration dependencies

### 2. Migration Generation

- Generate properly numbered migration files
- Include RLS policies automatically
- Add performance indexes
- Create audit triggers
- Add helpful SQL comments

### 3. Validation & Application

- Dry-run validation
- RLS policy verification
- Apply via Supabase Dashboard or CLI
- Rollback support

### 4. Documentation

- Update QUICK_START_MIGRATIONS.md
- Add TypeScript types
- Update DatabaseService methods
- Create Flutter models (if needed)

## Migration Templates

### New Table with Full RLS

```sql
-- ============================================
-- Migration: <number> - <description>
-- Created: <date>
-- ============================================

CREATE TABLE IF NOT EXISTS <table_name> (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Fields
  name TEXT NOT NULL,
  description TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own <table_name>"
  ON <table_name> FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their own <table_name>"
  ON <table_name> FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own <table_name>"
  ON <table_name> FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own <table_name>"
  ON <table_name> FOR DELETE
  USING (auth.uid() = parent_id);

-- Indexes
CREATE INDEX idx_<table_name>_parent_id ON <table_name>(parent_id);
CREATE INDEX idx_<table_name>_created_at ON <table_name>(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_<table_name>_updated_at
  BEFORE UPDATE ON <table_name>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE <table_name> IS '<description>';
```

### Add Column

```sql
ALTER TABLE <table_name>
  ADD COLUMN IF NOT EXISTS <column_name> <data_type>;

CREATE INDEX IF NOT EXISTS idx_<table>_<column>
  ON <table>(<column>);

COMMENT ON COLUMN <table>.<column> IS '<description>';
```

### Data Sync Trigger

```sql
CREATE OR REPLACE FUNCTION sync_<source>_to_<target>()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO <target_table> (...)
  VALUES (NEW.id, ...)
  ON CONFLICT (id) DO UPDATE
  SET field = EXCLUDED.field,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_<source>_to_<target>
  AFTER INSERT OR UPDATE ON <source_table>
  FOR EACH ROW
  EXECUTE FUNCTION sync_<source>_to_<target>();
```

## Workflow

### Step 1: Analyze Request

Parse user request to understand:

- Type of migration (CREATE, ALTER, DROP, TRIGGER)
- Tables involved
- Columns/fields needed
- Data types and constraints
- Relationships and foreign keys

### Step 2: Check Existing Schema

```bash
# List existing migrations
ls supabase/migrations/ | tail -5

# Read relevant migrations
# (Read similar migrations for patterns)
```

### Step 3: Generate Migration

- Determine next migration number
- Create descriptive filename
- Generate SQL with RLS policies
- Add indexes for performance
- Include triggers if needed

### Step 4: Create Supporting Files

**TypeScript Types** (`src/types/index.ts`):

```typescript
export interface <Entity> {
  id: string;
  parent_id: string;
  // ... fields
  created_at: string;
  updated_at: string;
}

export type <Entity>Create = Omit<<Entity>, 'id' | 'created_at' | 'updated_at'>;
export type <Entity>Update = Partial<<Entity>Create>;
```

**DatabaseService Methods** (`src/services/database.service.ts`):

```typescript
static async get<Entity>s(parentId: string): Promise<<Entity>[]> {
  const { data, error } = await supabase
    .from('<table>')
    .select('*')
    .eq('parent_id', parentId);
  if (error) throw error;
  return data;
}

static async create<Entity>(data: <Entity>Create, parentId: string): Promise<<Entity>> {
  const { data: result, error } = await supabase
    .from('<table>')
    .insert({ ...data, parent_id: parentId })
    .select()
    .single();
  if (error) throw error;
  return result;
}
```

**Flutter Models** (if mobile app affected):

```dart
@JsonSerializable()
class <Entity> {
  final String id;
  final String parentId;
  final DateTime createdAt;

  <Entity>({required this.id, required this.parentId, required this.createdAt});

  factory <Entity>.fromJson(Map<String, dynamic> json) => _$<Entity>FromJson(json);
  Map<String, dynamic> toJson() => _$<Entity>ToJson(this);
}
```

### Step 5: Validation

```bash
# Verify Supabase connection
npm run verify:supabase

# Check migration syntax (if CLI available)
npm run db:diff
```

### Step 6: Apply Migration

Provide instructions for applying via:

- Supabase Dashboard (SQL Editor) - RECOMMENDED
- Supabase CLI (if configured)

### Step 7: Verify

```bash
# Verify RLS policies
npm run verify:rls

# Check migration status
npm run db:status
```

### Step 8: Update Documentation

Add to `QUICK_START_MIGRATIONS.md`:

```markdown
### Migration <number>: <name>

**Purpose:** <description>
**Changes:**

- Created/modified tables
- Added RLS policies
- Created indexes
  **Apply:** Run in Supabase SQL Editor
```

## Required Patterns

### Parent Isolation (MANDATORY)

Every table MUST have:

```sql
parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

### RLS Policies (MANDATORY)

Every table MUST have RLS enabled:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
```

Minimum policies:

- SELECT: `auth.uid() = parent_id`
- INSERT: `auth.uid() = parent_id`
- UPDATE: `auth.uid() = parent_id`
- DELETE: `auth.uid() = parent_id`

### Indexes (RECOMMENDED)

Always index:

- `parent_id` (for filtering)
- `created_at` (for sorting)
- Foreign keys
- Frequently queried columns

### Timestamps (RECOMMENDED)

```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Updated_at Trigger (RECOMMENDED)

```sql
CREATE TRIGGER update_<table>_updated_at
  BEFORE UPDATE ON <table>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Success Criteria

- ✅ Migration file created with correct numbering
- ✅ RLS policies included for all operations
- ✅ Indexes created for performance
- ✅ Triggers added (if needed)
- ✅ TypeScript types updated
- ✅ DatabaseService methods added
- ✅ Flutter models updated (if needed)
- ✅ Documentation updated
- ✅ RLS verification passes

## Error Handling

### Migration Number Conflicts

- Check existing migrations
- Use next sequential number
- Never reuse numbers

### RLS Policy Errors

- Ensure `auth.uid()` function exists
- Verify user table structure
- Test policies after application

### Type Errors

- Run `npm run type-check` after updates
- Fix any TypeScript errors
- Ensure types match database schema

## Notes

- This skill activates automatically - no manual invocation needed
- Always prioritize security (RLS) over convenience
- Test migrations in development first
- Keep migrations reversible when possible
- Document breaking changes clearly
- Coordinate with team on schema changes
