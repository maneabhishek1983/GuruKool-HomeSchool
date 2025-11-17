# Flutter Testing Framework

Comprehensive testing system for GuruKool Teacher Flutter app with automated test generation, CI/CD integration, E2E scenarios, performance testing, accessibility checks, regression tracking, and self-healing tests.

## Overview

This testing framework provides:

- **Test Generation & Maintenance**: Automatically creates unit, widget, and integration tests
- **Continuous Testing Pipeline**: CI/CD integration with failure notifications
- **Automated E2E Scenarios**: Login, QR scanning, offline sync, session history
- **Performance & Stress Tests**: Startup time, scanning latency, database response times
- **Accessibility Checks**: Contrast ratios, focus management, screen-reader labels
- **Regression Tracking**: Database of past defects with prevention tests
- **Self-Healing Tests**: Adapts to schema and UI changes automatically

## Quick Start

### Run All Tests

```bash
cd gurukool_teacher
flutter test
flutter test integration_test
```

### Generate Tests Automatically

```bash
# Generate unit tests for services
npx tsx scripts/flutter-test-generator.ts ./gurukool_teacher unit

# Generate widget tests for screens
npx tsx scripts/flutter-test-generator.ts ./gurukool_teacher widget

# Generate with mutation testing
npx tsx scripts/flutter-test-generator.ts ./gurukool_teacher unit --mutation
```

### Run Performance Tests

```bash
npx tsx scripts/flutter-performance-test.ts
```

### Run Accessibility Tests

```bash
npx tsx scripts/flutter-accessibility-test.ts
```

### Track Regression Bugs

```bash
# Record a bug
npx tsx scripts/flutter-regression-tracker.ts record "Bug title" "Description" P1 lib/services/auth.service.dart

# Mark bug as fixed with test
npx tsx scripts/flutter-regression-tracker.ts fix BUG-123456 test/regression_test.dart "Test description"

# List bugs without tests
npx tsx scripts/flutter-regression-tracker.ts list
```

## Test Structure

```
gurukool_teacher/
├── test/
│   ├── test_helpers/          # Shared test utilities
│   │   ├── mocks/             # Mock objects
│   │   ├── fixtures/          # Test data
│   │   └── matchers/          # Custom matchers
│   ├── unit/                  # Unit tests
│   │   └── services/          # Service tests
│   └── widget/                # Widget tests
├── integration_test/          # E2E tests
│   ├── app_test.dart
│   ├── auth_flow_test.dart
│   ├── qr_scanner_flow_test.dart
│   ├── offline_sync_test.dart
│   └── session_history_test.dart
└── scripts/                    # Test automation scripts
    ├── flutter-test-generator.ts
    ├── flutter-performance-test.ts
    ├── flutter-accessibility-test.ts
    ├── flutter-regression-tracker.ts
    └── flutter-self-healing-tests.ts
```

## CI/CD Integration

Tests run automatically on every commit via GitHub Actions (`.github/workflows/flutter-tests.yml`):

- Unit & Widget Tests
- Integration Tests
- Performance Tests
- Accessibility Tests

Failures notify the Orchestrator agent automatically.

## Test Coverage

Target: **80% code coverage**

Check coverage:

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

## E2E Test Scenarios

1. **Login Flow**: Valid/invalid credentials, logout
2. **QR Scanner**: Navigation, camera permissions, scanning
3. **Offline Sync**: Queue sessions offline, sync when online
4. **Session History**: Load sessions, filter by date

## Performance Benchmarks

- **App Startup**: < 3s target
- **QR Scanner Init**: < 2s target
- **Database Response**: < 200ms target
- **Memory Consumption**: < 100MB target

## Accessibility Standards

- **WCAG AA Compliance**: Required
- **WCAG AAA Compliance**: Target
- **Contrast Ratio**: ≥ 4.5:1 for text
- **Tap Targets**: ≥ 48x48 logical pixels
- **Semantic Labels**: Required for all interactive elements

## Regression Prevention

When a bug is fixed:

1. Record bug in regression database
2. Create regression test
3. Test runs on every commit
4. Prevents bug recurrence

## Self-Healing Tests

Tests automatically adapt when:

- UI structure changes (selectors updated)
- Backend schema changes (mocks updated)
- Widget keys/semantic labels change (fallbacks used)

## Mutation Testing

Verifies test robustness by:

- Mutating code
- Running tests
- Ensuring tests catch mutations
- Regenerating tests if needed

## Best Practices

1. **Write tests first** (TDD) when possible
2. **Use test helpers** for common setup
3. **Mock external dependencies** (Supabase, network)
4. **Keep tests isolated** and independent
5. **Update regression tests** when fixing bugs
6. **Run performance tests** before releases
7. **Check accessibility** on every screen

## Troubleshooting

### Tests failing after code changes

Run self-healing adapter:

```bash
npx tsx scripts/flutter-self-healing-tests.ts adapt-selectors test/path_test.dart lib/path.dart
```

### Performance regressions

Check baseline and compare:

```bash
cat gurukool_teacher/test/performance_baseline.json
cat gurukool_teacher/test/performance_report.json
```

### Accessibility issues

Review report and fix:

```bash
cat gurukool_teacher/test/accessibility_report.json
```

## Integration with Orchestrator

The Testing & QA Agent:

- Receives code changes from other agents
- Generates tests automatically
- Reports failures to Orchestrator
- Blocks releases on test failures

## Next Steps

1. Implement mutation testing with `mutation_test` package
2. Add Playwright/Cypress for web E2E tests
3. Setup test result dashboards
4. Integrate with monitoring (Sentry, etc.)
5. Add visual regression testing
