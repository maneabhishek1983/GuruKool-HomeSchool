---
description: Create a new REST API endpoint with TypeScript, validation, RLS, and tests
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Create New API Endpoint

Create a production-ready REST API endpoint following GuruKool patterns.

## Arguments

- **$1**: API path (e.g., `/api/lessons` or `/api/students/progress`)
- **$2**: HTTP method (GET, POST, PUT, DELETE)
- **$3**: Purpose description

## Implementation Steps

### 1. Analyze Existing Patterns

First, read similar endpoints for pattern consistency:

- For students-related: Read `src/app/api/students/route.ts`
- For sessions: Read `src/app/api/sessions/route.ts`
- For teachers: Read `src/app/api/teachers/route.ts`

### 2. Create Route File

File location: `src/app/api/<path>/route.ts`

Required imports:

```typescript
import { withRateLimit } from '@/lib/api-security';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database.service';
import { createClient } from '@supabase/supabase-js';
```

### 3. Add Validation Schema

Add to `src/lib/validation.ts`:

```typescript
export const <entityName>Schema = z.object({
  // Define schema based on requirements
});
```

### 4. Implement Route Handler

Pattern:

```typescript
export const POST = withRateLimit({
  keyPrefix: 'api:<path>:create',
  max: 20,
})(async (request: NextRequest) => {
  // 1. Authenticate
  const authHeader = request.headers.get('authorization');
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate input
  const body = await request.json();
  const validation = <entityName>Schema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // 3. Business logic with parent isolation
  // Use DatabaseService for all database operations

  // 4. Return response
  return NextResponse.json({ data: result }, { status: 201 });
});
```

### 5. Add TypeScript Types

Update `src/types/index.ts`:

```typescript
export interface <EntityName> {
  id: string;
  parent_id: string;
  // ... other fields
  created_at: string;
  updated_at: string;
}
```

### 6. Create Tests

#### Unit Test (`src/app/api/<path>/route.test.ts`):

```typescript
import { POST } from './route';

describe('POST /api/<path>', () => {
  it('should create <entity> successfully', async () => {
    // Test implementation
  });

  it('should require authentication', async () => {
    // Test implementation
  });

  it('should validate input', async () => {
    // Test implementation
  });
});
```

#### E2E Test (`e2e/<path>.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('API: <path>', () => {
  test('should create and retrieve <entity>', async ({ request }) => {
    // Test implementation
  });
});
```

### 7. Verification Checklist

Run these commands in order:

```bash
# TypeScript type checking (MUST PASS)
npm run type-check

# Run unit tests
npm test -- <path>

# Run E2E tests
npm run test:e2e

# Security verification with kluster.ai
# (will run automatically)
```

### 8. Update Documentation

Add endpoint to `API_DOCUMENTATION.md`:

```markdown
### <METHOD> /api/<path>

Description: <purpose>

**Request:**
\`\`\`json
{
// Request body schema
}
\`\`\`

**Response:**
\`\`\`json
{
"data": {
// Response schema
}
}
\`\`\`

**Authentication:** Required (Bearer token)
**Rate Limit:** 20 requests per minute
```

## Success Criteria

- [ ] Route file created with proper authentication
- [ ] Validation schema added
- [ ] TypeScript types defined
- [ ] Rate limiting configured
- [ ] Parent isolation enforced (RLS)
- [ ] Unit tests created and passing
- [ ] E2E tests created and passing
- [ ] npm run type-check passes (0 errors)
- [ ] Documentation updated
- [ ] kluster.ai verification passes

## Example Usage

```bash
# Create a lessons endpoint
/api-endpoint /api/lessons POST "Manage homeschool lessons with curriculum standards"

# Create a progress tracking endpoint
/api-endpoint /api/students/progress GET "Get student progress across all subjects"
```

## Notes

- Always use DatabaseService for database operations (enforces parent isolation)
- Never expose service role key in client code
- Use Zod for all input validation
- Follow existing patterns in similar endpoints
- Ensure RLS policies are enforced
