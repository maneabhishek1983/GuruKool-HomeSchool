---
description: Automatically generates comprehensive tests (Jest unit, Playwright E2E, Flutter) for new code, ensuring test coverage and quality when user creates new features or mentions testing
allowed-tools: [Read, Write, Bash, Grep, Glob]
---

# Test Generator Skill

## Automatic Activation

This skill activates when:

- New API endpoint created
- New component/screen added
- New service/utility implemented
- User mentions "tests", "testing", "test coverage"
- User says "add tests for..."

## Core Capabilities

### 1. Context Analysis

- Identify code that needs testing
- Analyze function signatures and types
- Extract test scenarios from implementation
- Determine appropriate test type (unit/integration/E2E)

### 2. Test Generation

- Generate Jest unit tests for services/utilities
- Create Playwright E2E tests for user flows
- Generate Flutter tests for mobile app
- Add test fixtures and mocks
- Cover happy path + error cases + edge cases

### 3. Test Organization

- Follow existing test structure
- Use proper naming conventions
- Group related tests
- Add descriptive test names

### 4. Verification

- Run generated tests
- Check coverage thresholds
- Ensure tests are passing
- Report coverage gaps

## Test Templates

### Jest Unit Test (API Route)

**File:** `src/app/api/<path>/route.test.ts`

```typescript
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/services/database.service');
jest.mock('@supabase/supabase-js');

describe('GET /api/<path>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 without authorization header', async () => {
    const request = new NextRequest('http://localhost/api/<path>');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Missing authorization header');
  });

  it('should return 401 with invalid token', async () => {
    const request = new NextRequest('http://localhost/api/<path>', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    // Mock auth failure
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return data for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockData = [{ id: '1', parent_id: 'user-123', name: 'Test' }];

    // Mock successful auth
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database query
    const mockGetData = jest.fn().mockResolvedValue(mockData);

    const request = new NextRequest('http://localhost/api/<path>', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toEqual(mockData);
  });

  it('should support pagination with query parameters', async () => {
    const request = new NextRequest(
      'http://localhost/api/<path>?limit=10&offset=20',
      { headers: { Authorization: 'Bearer valid-token' } }
    );

    const response = await GET(request);
    // Assert pagination parameters were used
  });

  it('should return 500 on database error', async () => {
    // Mock database error
    const mockError = new Error('Database connection failed');
    const mockGetData = jest.fn().mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost/api/<path>', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});

describe('POST /api/<path>', () => {
  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/<path>', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should validate request body', async () => {
    const request = new NextRequest('http://localhost/api/<path>', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('should create entity successfully', async () => {
    const mockUser = { id: 'user-123' };
    const createData = { name: 'Test Entity', description: 'Test' };
    const createdEntity = {
      id: 'entity-123',
      ...createData,
      parent_id: 'user-123',
    };

    // Mock auth + database
    const mockCreate = jest.fn().mockResolvedValue(createdEntity);

    const request = new NextRequest('http://localhost/api/<path>', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify(createData),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.data).toEqual(createdEntity);
  });

  it('should enforce parent isolation', async () => {
    // Verify parent_id is set to authenticated user
    // Verify other users cannot create for different parent
  });
});
```

### Jest Unit Test (Service)

**File:** `src/services/<service>.test.ts`

```typescript
import { <Service> } from './<service>.service';

describe('<Service>', () => {
  describe('<method>', () => {
    it('should handle happy path', () => {
      const result = <Service>.<method>(validInput);
      expect(result).toEqual(expectedOutput);
    });

    it('should handle null/undefined input', () => {
      expect(() => <Service>.<method>(null)).toThrow();
    });

    it('should handle edge cases', () => {
      const result = <Service>.<method>(edgeCaseInput);
      expect(result).toBeDefined();
    });

    it('should validate input parameters', () => {
      expect(() => <Service>.<method>(invalidInput)).toThrow('Invalid input');
    });
  });
});
```

### Playwright E2E Test

**File:** `e2e/<feature>.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('<Feature> E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/parent\/dashboard/);
  });

  test('should complete happy path user flow', async ({ page }) => {
    // Navigate to feature
    await page.click('text=<Feature>');

    // Perform actions
    await page.click('button:has-text("Create New")');
    await page.fill('[name="name"]', 'Test Entity');
    await page.fill('[name="description"]', 'Test Description');
    await page.click('button:has-text("Save")');

    // Verify success
    await expect(page.locator('text=Successfully created')).toBeVisible();
    await expect(page.locator('text=Test Entity')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.click('text=<Feature>');
    await page.click('button:has-text("Create New")');

    // Submit without required fields
    await page.click('button:has-text("Save")');

    // Verify validation messages
    await expect(page.locator('text=Name is required')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page, context }) => {
    // Intercept API and return error
    await context.route('**/api/<path>', route => {
      route.fulfill({ status: 500, body: '{"error": "Internal error"}' });
    });

    await page.click('text=<Feature>');

    // Verify error message shown to user
    await expect(page.locator('text=Something went wrong')).toBeVisible();
  });

  test('should support pagination', async ({ page }) => {
    await page.click('text=<Feature>');

    // Load more items
    await page.click('button:has-text("Load More")');

    // Verify more items loaded
    const itemCount = await page.locator('[data-testid="item"]').count();
    expect(itemCount).toBeGreaterThan(10);
  });
});
```

### Flutter Unit Test

**File:** `gurukool_teacher/test/unit/<service>_test.dart`

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:gurukool_teacher/services/<service>.dart';

class Mock<Dependency> extends Mock implements <Dependency> {}

void main() {
  group('<Service> Tests', () {
    late <Service> service;
    late Mock<Dependency> mockDependency;

    setUp(() {
      mockDependency = Mock<Dependency>();
      service = <Service>(mockDependency);
    });

    group('<method>', () {
      test('should return success on happy path', () async {
        // Arrange
        when(() => mockDependency.someMethod())
            .thenAnswer((_) async => mockData);

        // Act
        final result = await service.<method>();

        // Assert
        expect(result, isNotNull);
        expect(result.data, equals(expectedData));
        verify(() => mockDependency.someMethod()).called(1);
      });

      test('should throw exception on error', () async {
        // Arrange
        when(() => mockDependency.someMethod())
            .thenThrow(Exception('API error'));

        // Act & Assert
        expect(
          () => service.<method>(),
          throwsException,
        );
      });

      test('should handle null input', () {
        expect(
          () => service.<method>(null),
          throwsArgumentError,
        );
      });
    });
  });
}
```

### Flutter Widget Test

**File:** `gurukool_teacher/test/widget/<screen>_test.dart`

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gurukool_teacher/screens/<screen>_screen.dart';

void main() {
  group('<Screen> Widget Tests', () {
    testWidgets('should render screen', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: <Screen>Screen(),
          ),
        ),
      );

      expect(find.byType(<Screen>Screen), findsOneWidget);
      expect(find.text('<Screen Title>'), findsOneWidget);
    });

    testWidgets('should show loading indicator', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            <provider>.overrideWith((ref) => <MockNotifier>()),
          ],
          child: const MaterialApp(home: <Screen>Screen()),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should display error message', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            <provider>.overrideWith((ref) => <MockNotifierWithError>()),
          ],
          child: const MaterialApp(home: <Screen>Screen()),
        ),
      );

      await tester.pump();

      expect(find.text('Error loading data'), findsOneWidget);
    });

    testWidgets('should handle button tap', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: <Screen>Screen()),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      // Verify action performed
    });
  });
}
```

## Workflow

### Step 1: Analyze Code to Test

- Read the implementation file
- Extract function signatures
- Identify test scenarios:
  - Happy path (expected input → expected output)
  - Error cases (invalid input → error handling)
  - Edge cases (boundary conditions)
  - Authentication/authorization checks
  - Parent isolation enforcement

### Step 2: Read Similar Tests

```bash
# Find similar tests for patterns
find . -name "*.test.ts" -o -name "*.spec.ts" | head -5
find gurukool_teacher/test -name "*_test.dart" | head -5

# Read 2-3 similar tests
```

### Step 3: Generate Test File

- Create test file with proper naming
- Import dependencies
- Set up mocks and fixtures
- Write test cases

### Step 4: Run Tests

```bash
# Web tests
npm test -- <test-file>

# Flutter tests
cd gurukool_teacher && flutter test test/unit/<test-file>
```

### Step 5: Check Coverage

```bash
# Web coverage
npm run test:coverage

# Flutter coverage
cd gurukool_teacher && flutter test --coverage
```

### Step 6: Fix Failing Tests

- Debug failing assertions
- Adjust mocks/fixtures
- Update test expectations
- Re-run tests

## Test Coverage Guidelines

### Minimum Coverage

- Unit tests: 80% coverage
- E2E tests: Critical user flows
- Flutter tests: 80% coverage

### What to Test

**Must Test:**

- Authentication/authorization
- Input validation
- Error handling
- Parent isolation
- CRUD operations
- Business logic

**Should Test:**

- Edge cases
- Boundary conditions
- Async operations
- State management
- UI interactions

**Can Skip:**

- Simple getters/setters
- Trivial utility functions
- Type definitions
- Configuration files

## Success Criteria

- ✅ Test files created with proper naming
- ✅ Happy path covered
- ✅ Error cases covered
- ✅ Edge cases covered
- ✅ All tests passing
- ✅ Coverage ≥ 80%
- ✅ Mocks properly configured
- ✅ Test names descriptive
- ✅ Tests are fast (<100ms unit, <5s E2E)

## Notes

- This skill activates automatically when new code is written
- Always test authentication and parent isolation
- Write tests before fixing bugs (TDD for bug fixes)
- Keep tests focused and independent
- Use descriptive test names
- Mock external dependencies
- Don't test implementation details
