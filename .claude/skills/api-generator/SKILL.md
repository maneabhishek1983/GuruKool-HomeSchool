---
description: Automatically generates production-ready REST API endpoints with authentication, validation, rate limiting, RLS, and tests when user mentions creating or modifying API routes
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# API Endpoint Generator Skill

## Automatic Activation

This skill activates when conversation contains:

- "create API endpoint"
- "new API route"
- "add endpoint"
- "API for <entity>"
- "REST API"
- "CRUD for"
- "GET/POST/PUT/DELETE endpoint"

## Core Capabilities

### 1. Pattern Analysis

- Read existing API routes for consistency
- Extract common patterns (auth, validation, rate limiting)
- Identify similar endpoints as templates
- Analyze database schema for data model

### 2. Endpoint Generation

- Create route files with proper structure
- Add authentication (Bearer token)
- Implement input validation (Zod)
- Configure rate limiting
- Enforce parent isolation (RLS)
- Add TypeScript types
- Generate comprehensive error handling

### 3. Test Generation

- Create Jest unit tests
- Generate Playwright E2E tests
- Add test fixtures and mocks
- Cover happy path and error cases

### 4. Documentation

- Update API_DOCUMENTATION.md
- Add request/response examples
- Document authentication requirements
- Include rate limit information

## Endpoint Templates

### GET Endpoint (List)

```typescript
import { withRateLimit } from '@/lib/api-security';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database.service';
import { createClient } from '@supabase/supabase-js';

export const GET = withRateLimit({
  keyPrefix: 'api:<entity>:list',
  max: 60,
})(async (request: NextRequest) => {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Fetch data with parent isolation
    const data =
      (await DatabaseService.get) < Entity > s(user.id, { limit, offset });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching <entity>s:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

### POST Endpoint (Create)

```typescript
import { withRateLimit } from '@/lib/api-security';
import { <entity>CreateSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database.service';
import { createClient } from '@supabase/supabase-js';

export const POST = withRateLimit({
  keyPrefix: 'api:<entity>:create',
  max: 20,
})(async (request: NextRequest) => {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const validation = <entity>CreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    // 3. Create with parent isolation
    const data = await DatabaseService.create<Entity>(
      validation.data,
      user.id
    );

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating <entity>:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

### PUT Endpoint (Update)

```typescript
export const PUT = withRateLimit({
  keyPrefix: 'api:<entity>:update',
  max: 30,
})(async (request: NextRequest) => {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate input
    const body = await request.json();
    const validation = <entity>UpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    // 3. Extract ID from request
    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing entity ID' }, { status: 400 });
    }

    // 4. Update with parent isolation check
    const data = await DatabaseService.update<Entity>(
      id,
      validation.data,
      user.id
    );

    if (!data) {
      return NextResponse.json(
        { error: 'Entity not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error updating <entity>:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

### DELETE Endpoint

```typescript
export const DELETE = withRateLimit({
  keyPrefix: 'api:<entity>:delete',
  max: 20,
})(async (request: NextRequest) => {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing entity ID' }, { status: 400 });
    }

    // 3. Delete with parent isolation check
    const success = await DatabaseService.delete<Entity>(id, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Entity not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting <entity>:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

## Workflow

### Step 1: Analyze Request

Parse user request for:

- Entity name (e.g., "lessons", "progress", "assignments")
- HTTP methods needed (GET, POST, PUT, DELETE)
- Special requirements (pagination, filtering, sorting)
- Related entities (foreign keys, relationships)

### Step 2: Read Similar Endpoints

```bash
# Find similar endpoints for patterns
grep -r "withRateLimit" src/app/api/
grep -r "DatabaseService" src/app/api/

# Read 2-3 similar endpoints
# Extract common patterns
```

### Step 3: Create Validation Schema

Add to `src/lib/validation.ts`:

```typescript
import { z } from 'zod';

export const <entity>CreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  // ... other fields based on requirements
});

export const <entity>UpdateSchema = <entity>CreateSchema.partial();
```

### Step 4: Add TypeScript Types

Update `src/types/index.ts`:

```typescript
export interface <Entity> {
  id: string;
  parent_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type <Entity>Create = Omit<<Entity>, 'id' | 'parent_id' | 'created_at' | 'updated_at'>;
export type <Entity>Update = Partial<<Entity>Create>;
```

### Step 5: Generate Route Files

Create files in `src/app/api/<path>/`:

- `route.ts` - Main endpoint file
- `route.test.ts` - Unit tests

### Step 6: Update DatabaseService

Add methods to `src/services/database.service.ts`:

- `get<Entity>s(parentId, options)`
- `get<Entity>ById(id, parentId)`
- `create<Entity>(data, parentId)`
- `update<Entity>(id, data, parentId)`
- `delete<Entity>(id, parentId)`

### Step 7: Generate Tests

**Unit Test** (`route.test.ts`):

```typescript
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/<entity>', () => {
  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/<entity>');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return <entity>s for authenticated user', async () => {
    // Test implementation with mocked auth
  });
});

describe('POST /api/<entity>', () => {
  it('should validate input', async () => {
    // Test validation
  });

  it('should create <entity> successfully', async () => {
    // Test creation
  });
});
```

**E2E Test** (`e2e/<entity>.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('API: /<entity>', () => {
  test('should create and retrieve <entity>', async ({ request }) => {
    // Login and get token
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: 'test@example.com', password: 'test123' },
    });
    const { token } = await loginResponse.json();

    // Create <entity>
    const createResponse = await request.post('/api/<entity>', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Test <Entity>' },
    });
    expect(createResponse.ok()).toBeTruthy();

    // Retrieve <entity>
    const getResponse = await request.get('/api/<entity>', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getResponse.ok()).toBeTruthy();
    const { data } = await getResponse.json();
    expect(data.length).toBeGreaterThan(0);
  });
});
```

### Step 8: Update Documentation

Add to `API_DOCUMENTATION.md`:

```markdown
### GET /api/<entity>

Get all <entity>s for authenticated user with pagination.

**Authentication:** Required (Bearer token)
**Rate Limit:** 60 requests/minute

**Query Parameters:**

- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
\`\`\`json
{
"data": [
{
"id": "uuid",
"parent_id": "uuid",
"name": "string",
"created_at": "ISO8601"
}
]
}
\`\`\`

### POST /api/<entity>

Create a new <entity>.

**Authentication:** Required (Bearer token)
**Rate Limit:** 20 requests/minute

**Request Body:**
\`\`\`json
{
"name": "string",
"description": "string (optional)"
}
\`\`\`

**Response:** (201 Created)
\`\`\`json
{
"data": {
"id": "uuid",
"parent_id": "uuid",
"name": "string",
"created_at": "ISO8601"
}
}
\`\`\`
```

### Step 9: Verification

```bash
# Type check
npm run type-check

# Run tests
npm test -- <entity>
npm run test:e2e

# kluster.ai verification
# (runs automatically)
```

## Required Patterns

### Authentication (MANDATORY)

Every endpoint must:

1. Check Authorization header
2. Validate Bearer token
3. Get authenticated user
4. Return 401 if unauthorized

### Input Validation (MANDATORY)

Every POST/PUT must:

1. Parse request body
2. Validate with Zod schema
3. Return 400 with details if invalid

### Parent Isolation (MANDATORY)

Every data operation must:

1. Use authenticated user.id as parent_id
2. Filter by parent_id in queries
3. Enforce parent_id in creates/updates
4. Verify ownership in updates/deletes

### Rate Limiting (MANDATORY)

Every endpoint must:

- Use `withRateLimit()` wrapper
- Configure appropriate limits
- Use descriptive keyPrefix

### Error Handling (MANDATORY)

Every endpoint must:

- Use try/catch blocks
- Log errors with console.error
- Return 500 for unhandled errors
- Never expose internal details

## Rate Limit Guidelines

- GET (list): 60 req/min
- GET (single): 100 req/min
- POST: 20 req/min
- PUT: 30 req/min
- DELETE: 20 req/min

## Success Criteria

- ✅ Route file created with authentication
- ✅ Validation schema added
- ✅ TypeScript types defined
- ✅ Rate limiting configured
- ✅ Parent isolation enforced
- ✅ DatabaseService methods added
- ✅ Unit tests created and passing
- ✅ E2E tests created and passing
- ✅ Documentation updated
- ✅ npm run type-check passes
- ✅ kluster.ai verification passes

## Notes

- This skill activates automatically - no manual invocation needed
- Always follow existing endpoint patterns
- Never bypass authentication or validation
- Always enforce parent isolation (security critical)
- Test thoroughly before deploying
- Update documentation as part of implementation
