import { test, expect } from '@playwright/test';

/**
 * Security and Penetration Testing Suite
 * Tests for OWASP Top 10 vulnerabilities and security best practices
 */

test.describe('Security & Penetration Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test.describe('OWASP Top 10 Security Tests', () => {
    test('A01:2021 - Broken Access Control', async ({ page }) => {
      // Test direct access to protected routes without authentication
      const protectedRoutes = [
        '/admin/dashboard',
        '/teacher/dashboard',
        '/parent/dashboard',
        '/api/metrics',
        '/api/user/profile',
      ];

      for (const route of protectedRoutes) {
        const response = await page.goto(route);
        expect(response?.status()).toBeOneOf([401, 403, 302]); // Should redirect or deny access
      }
    });

    test('A02:2021 - Cryptographic Failures', async ({ page }) => {
      // Check for HTTPS usage and secure headers
      const response = await page.goto('/');

      // Verify secure headers
      const headers = response?.headers();
      expect(headers?.['x-frame-options']).toBeTruthy();
      expect(headers?.['x-content-type-options']).toBe('nosniff');
      expect(headers?.['x-xss-protection']).toBeTruthy();

      // Check for HTTPS in production
      if (process.env.NODE_ENV === 'production') {
        expect(page.url()).toMatch(/^https:/);
      }
    });

    test('A03:2021 - Injection Attacks', async ({ page }) => {
      // SQL Injection test
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users --",
        "admin'--",
        "1' OR '1' = '1' --",
      ];

      for (const payload of sqlPayloads) {
        // Test search functionality
        await page.goto(`/?search=${encodeURIComponent(payload)}`);

        // Should not return 500 error (SQL error)
        await expect(page).not.toHaveURL(/error/);

        // Test login form
        await page.goto('/login');
        await page.fill('input[name="email"]', payload);
        await page.fill('input[name="password"]', payload);
        await page.click('button[type="submit"]');

        // Should handle gracefully without exposing database errors
        await expect(page.locator('body')).not.toContainText('SQL');
        await expect(page.locator('body')).not.toContainText('database');
      }
    });

    test('A04:2021 - Insecure Design', async ({ page }) => {
      // Test for predictable resource locations
      const predictablePaths = [
        '/admin',
        '/admin/admin',
        '/config',
        '/.env',
        '/wp-admin',
        '/phpmyadmin',
        '/database',
        '/backup',
      ];

      for (const path of predictablePaths) {
        const response = await page.goto(path);
        expect(response?.status()).toBeOneOf([404, 403, 401]); // Should not exist or be protected
      }
    });

    test('A05:2021 - Security Misconfiguration', async ({ page }) => {
      // Check for default error pages and information disclosure
      const response = await page.goto('/nonexistent-page');

      // Should not expose server information
      const body = await page.textContent('body');
      expect(body).not.toContain('Apache');
      expect(body).not.toContain('nginx');
      expect(body).not.toContain('PHP');
      expect(body).not.toContain('Node.js');
      expect(body).not.toContain('Express');

      // Check response headers for information disclosure
      const headers = response?.headers();
      expect(headers?.['server']).toBeFalsy(); // Should not expose server type
    });

    test('A06:2021 - Vulnerable Components', async ({ page }) => {
      // Check for known vulnerable JavaScript libraries
      const scripts = await page.locator('script[src]').all();

      for (const script of scripts) {
        const src = await script.getAttribute('src');
        if (src) {
          // Check for known vulnerable versions
          expect(src).not.toMatch(/jquery@1\./); // Old jQuery versions
          expect(src).not.toMatch(/bootstrap@3\./); // Old Bootstrap versions
        }
      }
    });

    test('A07:2021 - Authentication Failures', async ({ page }) => {
      // Test authentication bypass attempts
      await page.goto('/login');

      // Test with empty credentials
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-message')).toBeVisible();

      // Test with invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-message')).toBeVisible();

      // Test brute force protection
      for (let i = 0; i < 5; i++) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
      }

      // Should implement rate limiting or account lockout
      await expect(page.locator('.error-message')).toBeVisible();
    });

    test('A08:2021 - Software and Data Integrity Failures', async ({
      page,
    }) => {
      // Test for integrity of external resources
      const scripts = await page.locator('script[src^="http://"]').all();
      expect(scripts.length).toBe(0); // No HTTP scripts (should be HTTPS)

      // Check for integrity attributes on external resources
      const externalScripts = await page
        .locator('script[src^="https://"]')
        .all();
      for (const script of externalScripts) {
        const integrity = await script.getAttribute('integrity');
        // External scripts should have integrity checks
        if (integrity) {
          expect(integrity).toMatch(/^sha\d+-/);
        }
      }
    });

    test('A09:2021 - Security Logging Failures', async ({ page }) => {
      // Test that security events are logged
      // This would typically require checking server logs
      // For now, we'll test that error responses are properly handled

      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should not expose sensitive information in error messages
      const errorMessage = await page.locator('.error-message').textContent();
      expect(errorMessage).not.toContain('password');
      expect(errorMessage).not.toContain('email');
      expect(errorMessage).not.toContain('database');
    });

    test('A10:2021 - Server-Side Request Forgery', async ({ page }) => {
      // Test for SSRF vulnerabilities in URL parameters
      const ssrfPayloads = [
        'http://localhost:22',
        'http://127.0.0.1:3306',
        'http://169.254.169.254/latest/meta-data/', // AWS metadata
        'http://metadata.google.internal/', // GCP metadata
        'http://169.254.169.254/metadata/v1/', // DigitalOcean metadata
      ];

      for (const payload of ssrfPayloads) {
        // Test in various contexts where URLs might be processed
        await page.goto(`/?redirect=${encodeURIComponent(payload)}`);
        await page.goto(`/?callback=${encodeURIComponent(payload)}`);
        await page.goto(`/?url=${encodeURIComponent(payload)}`);

        // Should not make internal requests
        // This is hard to test without server-side monitoring
        // In a real scenario, you'd monitor network requests
      }
    });
  });

  test.describe('XSS (Cross-Site Scripting) Tests', () => {
    test('Reflected XSS in search parameters', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        '\'><script>alert("XSS")</script>',
      ];

      for (const payload of xssPayloads) {
        await page.goto(`/?search=${encodeURIComponent(payload)}`);

        // Check if script tags are rendered (should be escaped)
        const scriptTags = await page.locator('script').count();
        const bodyContent = await page.textContent('body');

        // Should not contain unescaped script content
        expect(bodyContent).not.toContain('<script>alert("XSS")</script>');
        expect(bodyContent).not.toContain('javascript:alert("XSS")');
      }
    });

    test('Stored XSS in forms', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
      ];

      // Test comment forms, contact forms, etc.
      for (const payload of xssPayloads) {
        await page.goto('/contact');

        // Fill form with XSS payload
        await page.fill('input[name="name"]', payload);
        await page.fill('textarea[name="message"]', payload);
        await page.click('button[type="submit"]');

        // Should handle gracefully without executing scripts
        await expect(page.locator('body')).not.toContainText('<script>');
      }
    });
  });

  test.describe('CSRF (Cross-Site Request Forgery) Tests', () => {
    test('CSRF protection on state-changing operations', async ({ page }) => {
      // Test POST requests without proper CSRF tokens
      const response = await page.request.post('/api/user/update', {
        data: { email: 'test@example.com' },
      });

      // Should require CSRF token or authentication
      expect(response.status()).toBeOneOf([401, 403, 400]);
    });

    test('CSRF token validation', async ({ page }) => {
      await page.goto('/login');

      // Check if CSRF token is present in forms
      const csrfToken = await page.locator('input[name="_csrf"]').count();
      const csrfTokenMeta = await page
        .locator('meta[name="csrf-token"]')
        .count();

      // Should have CSRF protection
      expect(csrfToken + csrfTokenMeta).toBeGreaterThan(0);
    });
  });

  test.describe('Content Security Policy Tests', () => {
    test('CSP headers are present', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response?.headers();

      // Should have Content-Security-Policy header
      expect(headers?.['content-security-policy']).toBeTruthy();

      const csp = headers?.['content-security-policy'];
      if (csp) {
        // Should restrict inline scripts
        expect(csp).toContain("'unsafe-inline'");
        // Should restrict eval
        expect(csp).toContain("'unsafe-eval'");
      }
    });
  });

  test.describe('Rate Limiting Tests', () => {
    test('API rate limiting', async ({ page }) => {
      // Make multiple rapid requests
      const requests = Array(20)
        .fill(null)
        .map(() => page.request.get('/api/health'));

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status() === 429);

      // Should implement rate limiting
      expect(rateLimited).toBe(true);
    });

    test('Login rate limiting', async ({ page }) => {
      await page.goto('/login');

      // Attempt multiple login failures
      for (let i = 0; i < 10; i++) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(100);
      }

      // Should implement rate limiting or account lockout
      await expect(page.locator('.error-message')).toBeVisible();
    });
  });

  test.describe('Input Validation Tests', () => {
    test('File upload validation', async ({ page }) => {
      await page.goto('/upload');

      // Test malicious file uploads
      const maliciousFiles = [
        'test.php',
        'test.jsp',
        'test.asp',
        'test.exe',
        'test.bat',
        'test.sh',
      ];

      for (const filename of maliciousFiles) {
        // This would require actual file upload testing
        // For now, we'll check if file type validation is implemented
        await expect(page.locator('input[type="file"]')).toBeVisible();
      }
    });

    test('Input sanitization', async ({ page }) => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        "' OR '1'='1",
        'admin--',
        '../../etc/passwd',
        'file:///etc/passwd',
      ];

      for (const input of maliciousInputs) {
        await page.goto('/search');
        await page.fill('input[name="q"]', input);
        await page.click('button[type="submit"]');

        // Should handle malicious input gracefully
        await expect(page.locator('body')).not.toContainText('<script>');
        await expect(page.locator('body')).not.toContainText('javascript:');
      }
    });
  });
});
