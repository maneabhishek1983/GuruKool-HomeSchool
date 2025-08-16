const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

class SecurityVerification {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      csrf: { passed: 0, failed: 0, details: [] },
      rateLimit: { passed: 0, failed: 0, details: [] },
      headers: { passed: 0, failed: 0, details: [] },
      accessibility: { passed: 0, failed: 0, details: [] },
    };
    this.cookies = {};
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  buildCookieHeader() {
    const parts = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`);
    return parts.join('; ');
  }

  parseSetCookie(headers) {
    const setCookie = headers['set-cookie'];
    if (!setCookie) {
      return;
    }
    const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const cookie of arr) {
      const [pair] = cookie.split(';');
      const [name, value] = pair.split('=');
      this.cookies[name.trim()] = value;
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const headers = Object.assign({}, options.headers || {});
      if (Object.keys(this.cookies).length) {
        headers['cookie'] = this.buildCookieHeader();
      }

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers,
        timeout: 10000,
      };

      const req = client.request(requestOptions, res => {
        let data = '';
        this.parseSetCookie(res.headers);
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  async testCSRFProtection() {
    this.log('Testing CSRF Protection...', 'CSRF');

    try {
      // Step 1: GET homepage to receive CSRF token cookie
      const getResponse = await this.makeRequest(`${this.baseUrl}/`);
      const hasCsrfCookie = Object.keys(this.cookies).some(
        k => k === 'csrf-token'
      );
      if (hasCsrfCookie) {
        this.results.csrf.passed++;
        this.results.csrf.details.push('✓ CSRF cookie set on GET');
      } else {
        this.results.csrf.failed++;
        this.results.csrf.details.push('✗ CSRF cookie missing on GET');
      }

      // Step 2: POST without header token should be rejected (403)
      const noHeaderPost = await this.makeRequest(`${this.baseUrl}/api/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true }),
      });
      if (noHeaderPost.statusCode === 403) {
        this.results.csrf.passed++;
        this.results.csrf.details.push('✓ POST without CSRF header rejected');
      } else {
        this.results.csrf.failed++;
        this.results.csrf.details.push(
          `✗ POST without CSRF header not rejected (status: ${noHeaderPost.statusCode})`
        );
      }

      // Step 3: POST with matching CSRF header (send cookie value as header) should succeed (200)
      const csrfCookie = this.cookies['csrf-token'];
      const withHeaderPost = await this.makeRequest(
        `${this.baseUrl}/api/test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfCookie,
          },
          body: JSON.stringify({ ping: true }),
        }
      );
      if (withHeaderPost.statusCode === 200) {
        this.results.csrf.passed++;
        this.results.csrf.details.push(
          '✓ POST with valid CSRF header succeeded'
        );
      } else {
        this.results.csrf.failed++;
        this.results.csrf.details.push(
          `✗ POST with valid CSRF header failed (status: ${withHeaderPost.statusCode})`
        );
      }
    } catch (error) {
      this.results.csrf.failed++;
      this.results.csrf.details.push(`✗ CSRF test error: ${error.message}`);
    }
  }

  async testRateLimiting() {
    this.log('Testing Rate Limiting...', 'RATE_LIMIT');
    try {
      // Burst requests to trigger 429
      const responses = await Promise.all(
        Array.from({ length: 150 }).map(() =>
          this.makeRequest(`${this.baseUrl}/api/health`)
        )
      );
      const any429 = responses.some(r => r.statusCode === 429);
      if (any429) {
        this.results.rateLimit.passed++;
        this.results.rateLimit.details.push('✓ 429 received under burst load');
      } else {
        this.results.rateLimit.failed++;
        this.results.rateLimit.details.push(
          '✗ No 429 received under burst load'
        );
      }

      // Accept rate limit headers from any response
      const rlRes =
        responses.find(
          r =>
            r.headers['x-ratelimit-limit'] || r.headers['x-ratelimit-remaining']
        ) || (await this.makeRequest(`${this.baseUrl}/api/health`));
      const hasHeaders = !!(
        rlRes.headers['x-ratelimit-limit'] ||
        rlRes.headers['x-ratelimit-remaining']
      );
      if (hasHeaders) {
        this.results.rateLimit.passed++;
        this.results.rateLimit.details.push('✓ Rate limit headers present');
      } else {
        this.results.rateLimit.failed++;
        this.results.rateLimit.details.push('✗ Rate limit headers missing');
      }
    } catch (error) {
      this.results.rateLimit.failed++;
      this.results.rateLimit.details.push(
        `✗ Rate limit test error: ${error.message}`
      );
    }
  }

  async testSecurityHeaders() {
    this.log('Testing Security Headers...', 'HEADERS');
    try {
      const response = await this.makeRequest(`${this.baseUrl}/`);
      const required = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'referrer-policy',
      ];
      for (const h of required) {
        if (response.headers[h]) {
          this.results.headers.passed++;
          this.results.headers.details.push(`✓ ${h} present`);
        } else {
          this.results.headers.failed++;
          this.results.headers.details.push(`✗ ${h} missing`);
        }
      }
      const csp = response.headers['content-security-policy'];
      if (csp && csp.includes("default-src 'self'")) {
        this.results.headers.passed++;
        this.results.headers.details.push('✓ CSP policy looks valid');
      } else {
        this.results.headers.failed++;
        this.results.headers.details.push('✗ CSP policy invalid');
      }
    } catch (error) {
      this.results.headers.failed++;
      this.results.headers.details.push(
        `✗ Headers test error: ${error.message}`
      );
    }
  }

  async testAccessibility() {
    this.log('Testing Accessibility Features...', 'ACCESSIBILITY');
    try {
      const res = await this.makeRequest(`${this.baseUrl}/`);
      if (res.data.includes('id="main-content"')) {
        this.results.accessibility.passed++;
      } else {
        this.results.accessibility.failed++;
      }
      if (res.data.includes('id="skip-to-main"')) {
        this.results.accessibility.passed++;
      } else {
        this.results.accessibility.failed++;
      }
      if (res.data.includes('role="main"')) {
        this.results.accessibility.passed++;
      } else {
        this.results.accessibility.failed++;
      }
    } catch (error) {
      this.results.accessibility.failed++;
      this.results.accessibility.details.push(
        `✗ Accessibility test error: ${error.message}`
      );
    }
  }

  async runAllTests() {
    this.log('Starting Security Verification Tests...', 'START');
    await this.testCSRFProtection();
    await this.testRateLimiting();
    await this.testSecurityHeaders();
    await this.testAccessibility();
    this.generateReport();
  }

  generateReport() {
    this.log('Generating Security Verification Report...', 'REPORT');
    const totalTests = Object.values(this.results).reduce(
      (s, c) => s + c.passed + c.failed,
      0
    );
    const totalPassed = Object.values(this.results).reduce(
      (s, c) => s + c.passed,
      0
    );
    const totalFailed = Object.values(this.results).reduce(
      (s, c) => s + c.failed,
      0
    );
    console.log('\n' + '='.repeat(60));
    console.log('           SECURITY VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(
      `Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`
    );
  }
}

async function main() {
  const verifier = new SecurityVerification();
  await verifier.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SecurityVerification;
