#!/usr/bin/env node

/**
 * Comprehensive Testing Framework for Gurukool Homeschool Application
 * Inspired by TestSprite's autonomous testing approach
 *
 * This script performs:
 * 1. Regression Testing - Automated functional testing
 * 2. Penetration Testing - Security vulnerability assessment
 * 3. Performance Testing - Load and stress testing
 * 4. Accessibility Testing - WCAG compliance
 * 5. API Security Testing - OWASP Top 10 validation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class ComprehensiveTestingFramework {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.testResults = {
      regression: { passed: 0, failed: 0, total: 0, details: [] },
      penetration: { passed: 0, failed: 0, total: 0, details: [] },
      performance: { passed: 0, failed: 0, total: 0, details: [] },
      accessibility: { passed: 0, failed: 0, total: 0, details: [] },
      apiSecurity: { passed: 0, failed: 0, total: 0, details: [] },
    };
    this.startTime = Date.now();
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const result = execSync(command, {
          encoding: 'utf8',
          stdio: 'pipe',
          ...options,
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.request(url, options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () =>
          resolve({ status: res.statusCode, headers: res.headers, body: data })
        );
      });
      req.on('error', reject);
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  // Regression Testing - Functional Testing
  async runRegressionTests() {
    this.log('Starting Regression Testing...', 'REGRESSION');

    const testCases = [
      {
        name: 'Homepage Load Test',
        test: async () => {
          const response = await this.makeRequest(`${this.baseUrl}/`);
          return response.status === 200;
        },
      },
      {
        name: 'Authentication Flow Test',
        test: async () => {
          const response = await this.makeRequest(`${this.baseUrl}/login`);
          return response.status === 200 && response.body.includes('login');
        },
      },
      {
        name: 'QR Code Generation Test',
        test: async () => {
          const response = await this.makeRequest(`${this.baseUrl}/auth/qr`);
          return response.status === 200;
        },
      },
      {
        name: 'API Health Check Test',
        test: async () => {
          const response = await this.makeRequest(`${this.baseUrl}/api/health`);
          return response.status === 200;
        },
      },
      {
        name: 'Teacher Dashboard Access Test',
        test: async () => {
          const response = await this.makeRequest(
            `${this.baseUrl}/teacher/dashboard`
          );
          return response.status === 200 || response.status === 401; // 401 is expected for unauthenticated
        },
      },
    ];

    for (const testCase of testCases) {
      try {
        const result = await testCase.test();
        this.testResults.regression.total++;
        if (result) {
          this.testResults.regression.passed++;
          this.log(`✓ ${testCase.name}`, 'PASS');
        } else {
          this.testResults.regression.failed++;
          this.log(`✗ ${testCase.name}`, 'FAIL');
        }
        this.testResults.regression.details.push({
          name: testCase.name,
          status: result ? 'PASS' : 'FAIL',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.testResults.regression.failed++;
        this.testResults.regression.total++;
        this.log(`✗ ${testCase.name} - Error: ${error.message}`, 'ERROR');
        this.testResults.regression.details.push({
          name: testCase.name,
          status: 'ERROR',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // Penetration Testing - Security Testing
  async runPenetrationTests() {
    this.log('Starting Penetration Testing...', 'PENETRATION');

    const securityTests = [
      {
        name: 'SQL Injection Test',
        test: async () => {
          const payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1' UNION SELECT * FROM users --",
          ];
          for (const payload of payloads) {
            const response = await this.makeRequest(
              `${this.baseUrl}/api/search?q=${encodeURIComponent(payload)}`
            );
            if (response.status === 500) {
              return false;
            } // Potential SQL injection vulnerability
          }
          return true;
        },
      },
      {
        name: 'XSS Vulnerability Test',
        test: async () => {
          const xssPayloads = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src="x" onerror="alert(\'XSS\')">',
          ];
          for (const payload of xssPayloads) {
            const response = await this.makeRequest(
              `${this.baseUrl}/api/comment`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: payload }),
              }
            );
            if (response.body.includes(payload)) {
              return false;
            } // XSS vulnerability detected
          }
          return true;
        },
      },
      {
        name: 'CSRF Protection Test',
        test: async () => {
          const response = await this.makeRequest(
            `${this.baseUrl}/api/user/update`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'test@example.com' }),
            }
          );
          return response.status === 401 || response.status === 403; // Should require authentication
        },
      },
      {
        name: 'Rate Limiting Test',
        test: async () => {
          const requests = Array(100)
            .fill()
            .map(() => this.makeRequest(`${this.baseUrl}/api/health`));
          const responses = await Promise.all(requests);
          const rateLimited = responses.some(r => r.status === 429);
          return rateLimited; // Should have rate limiting
        },
      },
      {
        name: 'Secure Headers Test',
        test: async () => {
          const response = await this.makeRequest(`${this.baseUrl}/`);
          const headers = response.headers;
          const requiredHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
          ];
          return requiredHeaders.every(header => headers[header.toLowerCase()]);
        },
      },
    ];

    for (const test of securityTests) {
      try {
        const result = await test.test();
        this.testResults.penetration.total++;
        if (result) {
          this.testResults.penetration.passed++;
          this.log(`✓ ${test.name}`, 'PASS');
        } else {
          this.testResults.penetration.failed++;
          this.log(
            `✗ ${test.name} - Security vulnerability detected!`,
            'SECURITY'
          );
        }
        this.testResults.penetration.details.push({
          name: test.name,
          status: result ? 'PASS' : 'FAIL',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.testResults.penetration.failed++;
        this.testResults.penetration.total++;
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  // Performance Testing
  async runPerformanceTests() {
    this.log('Starting Performance Testing...', 'PERFORMANCE');

    const performanceTests = [
      {
        name: 'Page Load Time Test',
        test: async () => {
          const start = Date.now();
          await this.makeRequest(`${this.baseUrl}/`);
          const loadTime = Date.now() - start;
          return loadTime < 3000; // Should load in under 3 seconds
        },
      },
      {
        name: 'API Response Time Test',
        test: async () => {
          const start = Date.now();
          await this.makeRequest(`${this.baseUrl}/api/health`);
          const responseTime = Date.now() - start;
          return responseTime < 1000; // Should respond in under 1 second
        },
      },
    ];

    for (const test of performanceTests) {
      try {
        const result = await test.test();
        this.testResults.performance.total++;
        if (result) {
          this.testResults.performance.passed++;
          this.log(`✓ ${test.name}`, 'PASS');
        } else {
          this.testResults.performance.failed++;
          this.log(
            `✗ ${test.name} - Performance issue detected!`,
            'PERFORMANCE'
          );
        }
      } catch (error) {
        this.testResults.performance.failed++;
        this.testResults.performance.total++;
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  // Accessibility Testing
  async runAccessibilityTests() {
    this.log('Starting Accessibility Testing...', 'ACCESSIBILITY');

    try {
      // Run Playwright accessibility tests
      await this.runCommand('npx playwright test --grep "accessibility"', {
        stdio: 'inherit',
      });
      this.testResults.accessibility.passed++;
      this.testResults.accessibility.total++;
      this.log('✓ Accessibility tests passed', 'PASS');
    } catch (error) {
      this.testResults.accessibility.failed++;
      this.testResults.accessibility.total++;
      this.log('✗ Accessibility tests failed', 'FAIL');
    }
  }

  // API Security Testing
  async runAPISecurityTests() {
    this.log('Starting API Security Testing...', 'API_SECURITY');

    const apiSecurityTests = [
      {
        name: 'Authentication Required Test',
        test: async () => {
          const response = await this.makeRequest(
            `${this.baseUrl}/api/metrics`
          );
          return response.status === 401; // Should require authentication
        },
      },
      {
        name: 'Input Validation Test',
        test: async () => {
          const response = await this.makeRequest(
            `${this.baseUrl}/api/search?q=<script>alert(1)</script>`
          );
          return response.status === 400; // Should reject malicious input
        },
      },
    ];

    for (const test of apiSecurityTests) {
      try {
        const result = await test.test();
        this.testResults.apiSecurity.total++;
        if (result) {
          this.testResults.apiSecurity.passed++;
          this.log(`✓ ${test.name}`, 'PASS');
        } else {
          this.testResults.apiSecurity.failed++;
          this.log(`✗ ${test.name} - API security issue detected!`, 'SECURITY');
        }
      } catch (error) {
        this.testResults.apiSecurity.failed++;
        this.testResults.apiSecurity.total++;
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  // Generate Test Report
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const report = {
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      results: this.testResults,
      recommendations: [],
    };

    // Calculate totals
    Object.values(this.testResults).forEach(category => {
      report.summary.totalTests += category.total;
      report.summary.totalPassed += category.passed;
      report.summary.totalFailed += category.failed;
    });

    // Generate recommendations
    if (this.testResults.penetration.failed > 0) {
      report.recommendations.push(
        'CRITICAL: Security vulnerabilities detected. Immediate action required.'
      );
    }
    if (this.testResults.performance.failed > 0) {
      report.recommendations.push(
        'WARNING: Performance issues detected. Consider optimization.'
      );
    }
    if (this.testResults.regression.failed > 0) {
      report.recommendations.push(
        'WARNING: Functional issues detected. Review recent changes.'
      );
    }

    return report;
  }

  // Save Report
  saveReport(report) {
    const reportPath = path.join(
      __dirname,
      '../test-results/comprehensive-test-report.json'
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Test report saved to: ${reportPath}`, 'REPORT');
  }

  // Print Summary
  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('           COMPREHENSIVE TESTING SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nTotal Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.totalPassed}`);
    console.log(`Failed: ${report.summary.totalFailed}`);
    console.log(`Duration: ${report.summary.duration}`);

    console.log('\n' + '-'.repeat(40));
    console.log('DETAILED RESULTS:');
    console.log('-'.repeat(40));

    Object.entries(report.results).forEach(([category, results]) => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Passed: ${results.passed}/${results.total}`);
      console.log(`  Failed: ${results.failed}/${results.total}`);
    });

    if (report.recommendations.length > 0) {
      console.log('\n' + '-'.repeat(40));
      console.log('RECOMMENDATIONS:');
      console.log('-'.repeat(40));
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
    }

    console.log('\n' + '='.repeat(60));
  }

  // Main execution method
  async run() {
    this.log('Starting Comprehensive Testing Framework...', 'START');

    try {
      // Run all test suites
      await this.runRegressionTests();
      await this.runPenetrationTests();
      await this.runPerformanceTests();
      await this.runAccessibilityTests();
      await this.runAPISecurityTests();

      // Generate and save report
      const report = this.generateReport();
      this.saveReport(report);
      this.printSummary(report);

      // Exit with appropriate code
      process.exit(report.summary.totalFailed > 0 ? 1 : 0);
    } catch (error) {
      this.log(`Fatal error during testing: ${error.message}`, 'FATAL');
      process.exit(1);
    }
  }
}

// Run the testing framework
if (require.main === module) {
  const framework = new ComprehensiveTestingFramework();
  framework.run();
}

module.exports = ComprehensiveTestingFramework;
