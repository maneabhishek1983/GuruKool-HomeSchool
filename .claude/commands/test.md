---
description: Run comprehensive tests (unit, E2E, Flutter, security) with verification
allowed-tools: [Bash, Read]
---

# Run Comprehensive Tests

Run all test suites for GuruKool HomeSchool with automatic verification.

## Arguments

- **$1**: Test scope (optional: `web`, `flutter`, `security`, `all`) - defaults to `all`
- **$2**: Specific test pattern (optional, e.g., `session`, `auth`)

## Test Execution

### Option 1: Run All Tests (Default)

```bash
# Web application tests
echo "🧪 Running Web Application Tests..."
npm run type-check
npm test
npm run test:e2e

# Flutter tests
echo "🧪 Running Flutter Tests..."
cd gurukool_teacher
flutter analyze
flutter test
cd ..

# Security tests
echo "🔒 Running Security Tests..."
npm run test:security
npm run verify:rls

# Comprehensive suite
echo "🎯 Running Comprehensive Test Suite..."
npm run test:comprehensive
```

### Option 2: Web Tests Only

```bash
echo "🧪 Running Web Application Tests..."

# TypeScript type checking (CRITICAL)
npm run type-check

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Security penetration tests
npm run test:security

# Verify Supabase connection
npm run verify:supabase

# Verify RLS policies
npm run verify:rls
```

### Option 3: Flutter Tests Only

```bash
echo "🧪 Running Flutter Tests..."

cd gurukool_teacher

# Static analysis
flutter analyze

# Unit tests
flutter test test/unit/

# Widget tests
flutter test test/widget/

# Integration tests
flutter test integration_test/

# Generate coverage
flutter test --coverage

# Check coverage threshold
if [ -f coverage/lcov.info ]; then
  echo "📊 Checking coverage threshold..."
  # Coverage report generated
fi

cd ..
```

### Option 4: Security Tests Only

```bash
echo "🔒 Running Security Tests..."

# Penetration tests
npm run test:security

# RLS policy verification
npm run verify:rls

# Supabase connection verification
npm run verify:supabase

# Security verification with kluster.ai
# (will run automatically after code changes)
```

### Option 5: Specific Test Pattern

```bash
# Run specific web test
npm test -- $2

# Run specific Flutter test
cd gurukool_teacher
flutter test --name "$2"
cd ..

# Run specific E2E test
npm run test:e2e -- $2
```

## Test Results Interpretation

### Web Tests

**TypeScript Type Check:**

- ✅ Success: 0 errors
- ❌ Failure: Fix type errors before proceeding

**Jest Unit Tests:**

- ✅ Success: All tests passing
- ❌ Failure: Review failed tests, fix issues

**Playwright E2E Tests:**

- ✅ Success: All user journeys work
- ❌ Failure: Debug failing flows

**Security Tests:**

- ✅ Success: No vulnerabilities found
- ❌ Failure: Address security issues immediately

### Flutter Tests

**Flutter Analyze:**

- ✅ Success: 0 issues
- ❌ Failure: Fix linting/analysis issues

**Unit Tests:**

- ✅ Success: All tests passing
- ⚠️ Warning: Coverage below 80%
- ❌ Failure: Review failed tests

**Integration Tests:**

- ✅ Success: All flows work end-to-end
- ❌ Failure: Debug integration issues

## Automatic Actions After Tests

### If All Tests Pass:

1. ✅ Code is ready for commit
2. ✅ Safe to deploy
3. ✅ kluster.ai verification will confirm quality

### If Tests Fail:

1. ❌ Do NOT commit code
2. ❌ Do NOT deploy
3. 🔧 Fix failing tests first
4. 🔁 Re-run tests

## Pre-Commit Checklist

Before committing code, ensure:

- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm test` passes (all tests)
- [ ] `npm run test:e2e` passes
- [ ] `flutter analyze` passes (if Flutter changes)
- [ ] `flutter test` passes (if Flutter changes)
- [ ] No kluster.ai security issues
- [ ] RLS policies verified

## CI/CD Integration

These tests run automatically on:

- Pull requests to `main` or `develop`
- Pushes to `main`
- Manual workflow dispatch

GitHub Actions workflows:

- `.github/workflows/comprehensive-testing.yml` (web)
- `.github/workflows/flutter-tests.yml` (Flutter)

## Performance Benchmarks

**Expected Test Duration:**

- TypeScript type-check: 5-10 seconds
- Jest unit tests: 10-20 seconds
- Playwright E2E tests: 1-2 minutes
- Flutter analyze: 5-10 seconds
- Flutter tests: 20-40 seconds
- Security tests: 30-60 seconds

**Total: 3-5 minutes for full suite**

## Troubleshooting

### "Type errors found"

```bash
# Check specific errors
npm run type-check

# Fix errors in reported files
# Re-run type-check
```

### "Jest tests failing"

```bash
# Run specific test in watch mode
npm test -- --watch <test-name>

# Check test output for details
# Fix failing assertions
```

### "E2E tests timing out"

```bash
# Run E2E tests in UI mode for debugging
npm run test:e2e:ui

# Check if dev server is running
# Verify test selectors are correct
```

### "Flutter analyze issues"

```bash
# See detailed analysis
cd gurukool_teacher
flutter analyze --verbose

# Auto-fix formatting issues
dart format .
```

### "RLS policy verification failing"

```bash
# Check RLS policies
npm run verify:rls

# Verify Supabase connection
npm run verify:supabase

# Check migration status
npm run db:status
```

## Success Criteria

- [ ] All TypeScript type checks pass
- [ ] All Jest unit tests pass
- [ ] All Playwright E2E tests pass
- [ ] Flutter analyze passes
- [ ] All Flutter tests pass (≥80% coverage)
- [ ] Security tests pass
- [ ] RLS policies verified
- [ ] kluster.ai verification passes

## Example Usage

```bash
# Run all tests
/test all

# Run only web tests
/test web

# Run only Flutter tests
/test flutter

# Run only security tests
/test security

# Run specific test pattern
/test web session

# Run specific Flutter test
/test flutter auth
```

## Notes

- Always run full test suite before deploying
- TypeScript type-check is mandatory (builds fail without it)
- Flutter coverage threshold is 80%
- Security tests are non-negotiable
- kluster.ai will run automatically on code changes
- CI/CD pipelines enforce these tests on pull requests
