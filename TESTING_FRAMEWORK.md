# Comprehensive Testing Framework

## Overview

This testing framework provides comprehensive regression testing and penetration testing for the Gurukool Homeschool application, inspired by TestSprite's autonomous testing approach. The framework includes multiple testing layers to ensure application quality, security, and performance.

## Testing Categories

### 1. Regression Testing

- **Purpose**: Ensure existing functionality continues to work after changes
- **Coverage**: Core application features, navigation, forms, API endpoints
- **Tools**: Playwright, Jest, Custom Node.js scripts

### 2. Penetration Testing

- **Purpose**: Identify security vulnerabilities and weaknesses
- **Coverage**: OWASP Top 10, XSS, CSRF, SQL Injection, Authentication bypass
- **Tools**: Playwright security tests, Custom security scripts

### 3. Performance Testing

- **Purpose**: Validate application performance under various load conditions
- **Coverage**: Load testing, stress testing, endurance testing, spike testing
- **Tools**: Custom Node.js performance testing framework

### 4. Accessibility Testing

- **Purpose**: Ensure application meets WCAG compliance standards
- **Coverage**: Keyboard navigation, screen reader compatibility, color contrast
- **Tools**: Playwright accessibility tests, Storybook accessibility addon

### 5. API Security Testing

- **Purpose**: Validate API endpoint security and input validation
- **Coverage**: Authentication, authorization, input sanitization, rate limiting
- **Tools**: Custom API testing scripts, Playwright API tests

## Quick Start

### Prerequisites

```bash
npm install
```

### Running Tests

#### 1. Comprehensive Testing (All-in-one)

```bash
npm run test:comprehensive
```

This runs all testing categories in sequence and generates a comprehensive report.

#### 2. Individual Test Categories

**Regression Testing:**

```bash
npm run test:regression
```

**Security & Penetration Testing:**

```bash
npm run test:security
```

**Performance Testing:**

```bash
npm run test:performance
```

**Full Test Suite:**

```bash
npm run test:full-suite
```

#### 3. Traditional Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All traditional tests
npm run test:all
```

## Test Configuration

### Environment Variables

```bash
BASE_URL=http://localhost:3000  # Application URL for testing
NODE_ENV=test                   # Environment for testing
```

### Playwright Configuration

The framework uses Playwright for browser-based testing with the following configuration:

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari, Tablet
- **Parallel Execution**: Enabled for faster test execution
- **Retries**: 2 retries in CI environment
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure

## Test Reports

### Report Locations

- **Comprehensive Tests**: `test-results/comprehensive-test-report.json`
- **Performance Tests**: `test-results/performance-test-report.json`
- **Playwright Reports**: `test-results/` (HTML, JSON, JUnit formats)

### Report Structure

```json
{
  "summary": {
    "totalTests": 0,
    "totalPassed": 0,
    "totalFailed": 0,
    "duration": "0ms",
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  "results": {
    "regression": { "passed": 0, "failed": 0, "total": 0, "details": [] },
    "penetration": { "passed": 0, "failed": 0, "total": 0, "details": [] },
    "performance": { "passed": 0, "failed": 0, "total": 0, "details": [] },
    "accessibility": { "passed": 0, "failed": 0, "total": 0, "details": [] },
    "apiSecurity": { "passed": 0, "failed": 0, "total": 0, "details": [] }
  },
  "recommendations": []
}
```

## Security Testing Details

### OWASP Top 10 Coverage

1. **A01:2021 - Broken Access Control**
   - Tests direct access to protected routes
   - Validates authentication requirements

2. **A02:2021 - Cryptographic Failures**
   - Checks for HTTPS usage
   - Validates secure headers

3. **A03:2021 - Injection Attacks**
   - SQL Injection testing
   - XSS vulnerability detection
   - Command injection prevention

4. **A04:2021 - Insecure Design**
   - Tests predictable resource locations
   - Validates secure defaults

5. **A05:2021 - Security Misconfiguration**
   - Checks for information disclosure
   - Validates error handling

6. **A06:2021 - Vulnerable Components**
   - Scans for known vulnerable libraries
   - Validates dependency versions

7. **A07:2021 - Authentication Failures**
   - Tests authentication bypass
   - Validates brute force protection

8. **A08:2021 - Software and Data Integrity Failures**
   - Checks external resource integrity
   - Validates secure supply chain

9. **A09:2021 - Security Logging Failures**
   - Tests error message security
   - Validates audit logging

10. **A10:2021 - Server-Side Request Forgery**
    - Tests SSRF vulnerabilities
    - Validates URL parameter handling

### Additional Security Tests

- **XSS (Cross-Site Scripting)**
  - Reflected XSS in search parameters
  - Stored XSS in forms
  - DOM-based XSS prevention

- **CSRF (Cross-Site Request Forgery)**
  - CSRF token validation
  - State-changing operation protection

- **Content Security Policy**
  - CSP header validation
  - Inline script restriction

- **Rate Limiting**
  - API rate limiting tests
  - Login rate limiting validation

- **Input Validation**
  - File upload validation
  - Input sanitization testing

## Performance Testing Details

### Load Testing

- **Concurrent Users**: 10
- **Duration**: 1 minute
- **Endpoints**: Homepage, Login, QR Auth, Health Check
- **Metrics**: Response time, success rate, throughput

### Stress Testing

- **Concurrent Users**: 50
- **Duration**: 30 seconds
- **Endpoints**: Random selection from available endpoints
- **Metrics**: Error rate, response time degradation

### Endurance Testing

- **Duration**: 5 minutes
- **Endpoints**: Homepage, Health Check
- **Metrics**: Performance degradation over time

### Spike Testing

- **Normal Load**: 5 concurrent users
- **Spike Load**: 100 concurrent users
- **Spike Duration**: 10 seconds
- **Metrics**: Recovery time, success rate during spike

## Regression Testing Details

### Core Functionality

- Homepage loading and navigation
- Authentication system validation
- QR code generation and scanning
- Form validation and submission

### User Interface

- Responsive design across devices
- Cross-browser compatibility
- Accessibility compliance
- Error handling and user feedback

### API Endpoints

- Health check validation
- Authentication requirements
- Error response handling
- Data validation

### State Management

- Application state consistency
- Data persistence validation
- Session management
- Navigation state preservation

## Continuous Integration

### GitHub Actions Integration

The framework includes GitHub Actions workflows for automated testing:

```yaml
# .github/workflows/test.yml
name: Comprehensive Testing
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:full-suite
```

### Pre-commit Hooks

Husky is configured to run tests before commits:

- Unit tests
- Linting
- Type checking
- Security tests

## Customization

### Adding New Tests

#### 1. Regression Tests

Create new test files in `e2e/` directory:

```typescript
// e2e/custom-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Custom Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/custom-feature');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

#### 2. Security Tests

Add new security test cases in `e2e/security-penetration.spec.ts`:

```typescript
test('Custom Security Test', async ({ page }) => {
  // Test implementation
});
```

#### 3. Performance Tests

Extend the performance testing framework in `scripts/performance-testing.js`:

```javascript
async runCustomPerformanceTest() {
  // Custom performance test implementation
}
```

### Configuration Options

#### Playwright Configuration

Modify `playwright.config.ts` for custom browser configurations:

```typescript
export default defineConfig({
  projects: [
    {
      name: 'custom-browser',
      use: { ...devices['Custom Device'] },
    },
  ],
});
```

#### Performance Test Parameters

Adjust performance test parameters in `scripts/performance-testing.js`:

```javascript
const concurrentUsers = 20; // Adjust load
const testDuration = 120000; // Adjust duration
```

## Troubleshooting

### Common Issues

#### 1. Tests Failing Due to Network Issues

```bash
# Increase timeout
export PLAYWRIGHT_TIMEOUT=60000
npm run test:e2e
```

#### 2. Performance Tests Timing Out

```bash
# Adjust performance test parameters
BASE_URL=http://localhost:3000 npm run test:performance
```

#### 3. Security Tests Blocked by Firewall

```bash
# Run tests locally
npm run test:security -- --headed
```

### Debug Mode

Run tests in debug mode for detailed investigation:

```bash
npm run test:e2e:debug
```

### Verbose Logging

Enable verbose logging for troubleshooting:

```bash
DEBUG=pw:api npm run test:e2e
```

## Best Practices

### 1. Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Maintain test independence

### 2. Security Testing

- Never test against production environments
- Use dedicated test data
- Follow responsible disclosure practices

### 3. Performance Testing

- Start with small load and gradually increase
- Monitor system resources during testing
- Use realistic test data

### 4. Maintenance

- Update test dependencies regularly
- Review and update test cases with new features
- Monitor test execution times

## Contributing

### Adding New Test Categories

1. Create test files in appropriate directories
2. Update package.json scripts
3. Add documentation
4. Update CI/CD pipelines

### Reporting Issues

1. Create detailed bug reports
2. Include test logs and screenshots
3. Provide reproduction steps
4. Specify environment details

## References

- [TestSprite Documentation](https://docs.testsprite.com/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## License

This testing framework is part of the Gurukool Homeschool project and follows the same licensing terms.
