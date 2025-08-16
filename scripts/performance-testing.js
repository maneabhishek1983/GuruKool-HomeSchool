#!/usr/bin/env node

/**
 * Performance Testing Script
 * Load testing and stress testing for the Gurukool Homeschool Application
 * Inspired by TestSprite's performance testing capabilities
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class PerformanceTestingFramework {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.results = {
      loadTests: [],
      stressTests: [],
      enduranceTests: [],
      spikeTests: [],
    };
    this.startTime = Date.now();
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const startTime = Date.now();

      const req = protocol.request(url, options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          const endTime = Date.now();
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime: endTime - startTime,
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => req.destroy()); // 30 second timeout

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  // Load Testing - Normal expected load
  async runLoadTests() {
    this.log('Starting Load Testing...', 'LOAD');

    const concurrentUsers = 10;
    const testDuration = 60000; // 1 minute
    const endpoints = ['/', '/login', '/auth/qr', '/api/health'];

    const startTime = Date.now();
    const results = [];

    while (Date.now() - startTime < testDuration) {
      const promises = endpoints.map(endpoint =>
        this.makeRequest(`${this.baseUrl}${endpoint}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        results.push({
          endpoint: endpoints[index],
          status: response.status,
          responseTime: response.responseTime,
          timestamp: new Date().toISOString(),
        });
      });

      // Wait 1 second between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.results.loadTests = results;
    this.analyzeLoadResults(results);
  }

  // Stress Testing - Beyond normal capacity
  async runStressTests() {
    this.log('Starting Stress Testing...', 'STRESS');

    const concurrentUsers = 50;
    const testDuration = 30000; // 30 seconds
    const endpoints = ['/', '/api/health', '/login'];

    const startTime = Date.now();
    const results = [];

    while (Date.now() - startTime < testDuration) {
      const promises = Array(concurrentUsers)
        .fill()
        .map(() => {
          const endpoint =
            endpoints[Math.floor(Math.random() * endpoints.length)];
          return this.makeRequest(`${this.baseUrl}${endpoint}`);
        });

      const responses = await Promise.allSettled(promises);

      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
            status: result.value.status,
            responseTime: result.value.responseTime,
            timestamp: new Date().toISOString(),
          });
        } else {
          results.push({
            endpoint: 'unknown',
            status: 'error',
            responseTime: 0,
            error: result.reason.message,
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Wait 500ms between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.results.stressTests = results;
    this.analyzeStressResults(results);
  }

  // Endurance Testing - Long duration
  async runEnduranceTests() {
    this.log('Starting Endurance Testing...', 'ENDURANCE');

    const testDuration = 300000; // 5 minutes
    const endpoints = ['/', '/api/health'];

    const startTime = Date.now();
    const results = [];

    while (Date.now() - startTime < testDuration) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);

      results.push({
        endpoint,
        status: response.status,
        responseTime: response.responseTime,
        timestamp: new Date().toISOString(),
      });

      // Wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.results.enduranceTests = results;
    this.analyzeEnduranceResults(results);
  }

  // Spike Testing - Sudden load increase
  async runSpikeTests() {
    this.log('Starting Spike Testing...', 'SPIKE');

    const normalLoad = 5;
    const spikeLoad = 100;
    const spikeDuration = 10000; // 10 seconds

    const results = [];

    // Normal load for 30 seconds
    this.log('Running normal load for 30 seconds...', 'SPIKE');
    for (let i = 0; i < 30; i++) {
      const promises = Array(normalLoad)
        .fill()
        .map(() => this.makeRequest(`${this.baseUrl}/api/health`));

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        results.push({
          phase: 'normal',
          status: response.status,
          responseTime: response.responseTime,
          timestamp: new Date().toISOString(),
        });
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Spike load for 10 seconds
    this.log('Running spike load for 10 seconds...', 'SPIKE');
    const spikeStart = Date.now();
    while (Date.now() - spikeStart < spikeDuration) {
      const promises = Array(spikeLoad)
        .fill()
        .map(() => this.makeRequest(`${this.baseUrl}/api/health`));

      const responses = await Promise.allSettled(promises);
      responses.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push({
            phase: 'spike',
            status: result.value.status,
            responseTime: result.value.responseTime,
            timestamp: new Date().toISOString(),
          });
        } else {
          results.push({
            phase: 'spike',
            status: 'error',
            responseTime: 0,
            error: result.reason.message,
            timestamp: new Date().toISOString(),
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Return to normal load
    this.log('Returning to normal load for 30 seconds...', 'SPIKE');
    for (let i = 0; i < 30; i++) {
      const promises = Array(normalLoad)
        .fill()
        .map(() => this.makeRequest(`${this.baseUrl}/api/health`));

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        results.push({
          phase: 'recovery',
          status: response.status,
          responseTime: response.responseTime,
          timestamp: new Date().toISOString(),
        });
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.results.spikeTests = results;
    this.analyzeSpikeResults(results);
  }

  // Analysis methods
  analyzeLoadResults(results) {
    const responseTimes = results.map(r => r.responseTime).filter(r => r > 0);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const successRate =
      results.filter(r => r.status === 200).length / results.length;

    this.log(`Load Test Results:`, 'ANALYSIS');
    this.log(
      `  Average Response Time: ${avgResponseTime.toFixed(2)}ms`,
      'ANALYSIS'
    );
    this.log(`  Max Response Time: ${maxResponseTime}ms`, 'ANALYSIS');
    this.log(`  Min Response Time: ${minResponseTime}ms`, 'ANALYSIS');
    this.log(`  Success Rate: ${(successRate * 100).toFixed(2)}%`, 'ANALYSIS');
    this.log(`  Total Requests: ${results.length}`, 'ANALYSIS');
  }

  analyzeStressResults(results) {
    const responseTimes = results.map(r => r.responseTime).filter(r => r > 0);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const successRate =
      results.filter(r => r.status === 200).length / results.length;
    const errorRate =
      results.filter(r => r.status === 'error').length / results.length;

    this.log(`Stress Test Results:`, 'ANALYSIS');
    this.log(
      `  Average Response Time: ${avgResponseTime.toFixed(2)}ms`,
      'ANALYSIS'
    );
    this.log(`  Max Response Time: ${maxResponseTime}ms`, 'ANALYSIS');
    this.log(`  Success Rate: ${(successRate * 100).toFixed(2)}%`, 'ANALYSIS');
    this.log(`  Error Rate: ${(errorRate * 100).toFixed(2)}%`, 'ANALYSIS');
    this.log(`  Total Requests: ${results.length}`, 'ANALYSIS');
  }

  analyzeEnduranceResults(results) {
    const responseTimes = results.map(r => r.responseTime).filter(r => r > 0);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const successRate =
      results.filter(r => r.status === 200).length / results.length;

    // Check for performance degradation over time
    const firstHalf = results.slice(0, Math.floor(results.length / 2));
    const secondHalf = results.slice(Math.floor(results.length / 2));

    const firstHalfAvg =
      firstHalf.map(r => r.responseTime).reduce((a, b) => a + b, 0) /
      firstHalf.length;
    const secondHalfAvg =
      secondHalf.map(r => r.responseTime).reduce((a, b) => a + b, 0) /
      secondHalf.length;
    const degradation = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    this.log(`Endurance Test Results:`, 'ANALYSIS');
    this.log(
      `  Average Response Time: ${avgResponseTime.toFixed(2)}ms`,
      'ANALYSIS'
    );
    this.log(`  Max Response Time: ${maxResponseTime}ms`, 'ANALYSIS');
    this.log(`  Min Response Time: ${minResponseTime}ms`, 'ANALYSIS');
    this.log(`  Success Rate: ${(successRate * 100).toFixed(2)}%`, 'ANALYSIS');
    this.log(
      `  Performance Degradation: ${degradation.toFixed(2)}%`,
      'ANALYSIS'
    );
    this.log(`  Total Requests: ${results.length}`, 'ANALYSIS');
  }

  analyzeSpikeResults(results) {
    const normalPhase = results.filter(r => r.phase === 'normal');
    const spikePhase = results.filter(r => r.phase === 'spike');
    const recoveryPhase = results.filter(r => r.phase === 'recovery');

    const normalAvg =
      normalPhase.map(r => r.responseTime).reduce((a, b) => a + b, 0) /
      normalPhase.length;
    const spikeAvg =
      spikePhase
        .map(r => r.responseTime)
        .filter(r => r > 0)
        .reduce((a, b) => a + b, 0) /
      spikePhase.filter(r => r.responseTime > 0).length;
    const recoveryAvg =
      recoveryPhase.map(r => r.responseTime).reduce((a, b) => a + b, 0) /
      recoveryPhase.length;

    const spikeSuccessRate =
      spikePhase.filter(r => r.status === 200).length / spikePhase.length;
    const recoverySuccessRate =
      recoveryPhase.filter(r => r.status === 200).length / recoveryPhase.length;

    this.log(`Spike Test Results:`, 'ANALYSIS');
    this.log(`  Normal Phase Avg: ${normalAvg.toFixed(2)}ms`, 'ANALYSIS');
    this.log(`  Spike Phase Avg: ${spikeAvg.toFixed(2)}ms`, 'ANALYSIS');
    this.log(`  Recovery Phase Avg: ${recoveryAvg.toFixed(2)}ms`, 'ANALYSIS');
    this.log(
      `  Spike Success Rate: ${(spikeSuccessRate * 100).toFixed(2)}%`,
      'ANALYSIS'
    );
    this.log(
      `  Recovery Success Rate: ${(recoverySuccessRate * 100).toFixed(2)}%`,
      'ANALYSIS'
    );
    this.log(`  Total Requests: ${results.length}`, 'ANALYSIS');
  }

  // Generate comprehensive report
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const report = {
      summary: {
        totalTests: 4,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        baseUrl: this.baseUrl,
      },
      results: this.results,
      recommendations: [],
    };

    // Generate recommendations based on results
    if (this.results.loadTests.length > 0) {
      const loadAvg =
        this.results.loadTests
          .map(r => r.responseTime)
          .reduce((a, b) => a + b, 0) / this.results.loadTests.length;
      if (loadAvg > 2000) {
        report.recommendations.push(
          'WARNING: Load test average response time is high. Consider optimization.'
        );
      }
    }

    if (this.results.stressTests.length > 0) {
      const stressErrorRate =
        this.results.stressTests.filter(r => r.status === 'error').length /
        this.results.stressTests.length;
      if (stressErrorRate > 0.1) {
        report.recommendations.push(
          'CRITICAL: High error rate during stress testing. System may not handle peak load.'
        );
      }
    }

    if (this.results.enduranceTests.length > 0) {
      const firstHalf = this.results.enduranceTests.slice(
        0,
        Math.floor(this.results.enduranceTests.length / 2)
      );
      const secondHalf = this.results.enduranceTests.slice(
        Math.floor(this.results.enduranceTests.length / 2)
      );
      const firstHalfAvg =
        firstHalf.map(r => r.responseTime).reduce((a, b) => a + b, 0) /
        firstHalf.length;
      const secondHalfAvg =
        secondHalf.map(r => r.responseTime).reduce((a, b) => a + b, 0) /
        secondHalf.length;
      const degradation = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

      if (degradation > 20) {
        report.recommendations.push(
          'WARNING: Significant performance degradation detected during endurance testing.'
        );
      }
    }

    return report;
  }

  // Save report
  saveReport(report) {
    const reportPath = path.join(
      __dirname,
      '../test-results/performance-test-report.json'
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Performance test report saved to: ${reportPath}`, 'REPORT');
  }

  // Print summary
  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('           PERFORMANCE TESTING SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nTest Duration: ${report.summary.duration}`);
    console.log(`Base URL: ${report.summary.baseUrl}`);

    console.log('\n' + '-'.repeat(40));
    console.log('TEST RESULTS:');
    console.log('-'.repeat(40));

    if (report.results.loadTests.length > 0) {
      console.log('\nLoad Tests:');
      console.log(`  Total Requests: ${report.results.loadTests.length}`);
      const loadAvg =
        report.results.loadTests
          .map(r => r.responseTime)
          .reduce((a, b) => a + b, 0) / report.results.loadTests.length;
      console.log(`  Average Response Time: ${loadAvg.toFixed(2)}ms`);
    }

    if (report.results.stressTests.length > 0) {
      console.log('\nStress Tests:');
      console.log(`  Total Requests: ${report.results.stressTests.length}`);
      const stressErrorRate =
        report.results.stressTests.filter(r => r.status === 'error').length /
        report.results.stressTests.length;
      console.log(`  Error Rate: ${(stressErrorRate * 100).toFixed(2)}%`);
    }

    if (report.results.enduranceTests.length > 0) {
      console.log('\nEndurance Tests:');
      console.log(`  Total Requests: ${report.results.enduranceTests.length}`);
      const enduranceAvg =
        report.results.enduranceTests
          .map(r => r.responseTime)
          .reduce((a, b) => a + b, 0) / report.results.enduranceTests.length;
      console.log(`  Average Response Time: ${enduranceAvg.toFixed(2)}ms`);
    }

    if (report.results.spikeTests.length > 0) {
      console.log('\nSpike Tests:');
      console.log(`  Total Requests: ${report.results.spikeTests.length}`);
      const spikePhase = report.results.spikeTests.filter(
        r => r.phase === 'spike'
      );
      const spikeSuccessRate =
        spikePhase.filter(r => r.status === 200).length / spikePhase.length;
      console.log(
        `  Spike Success Rate: ${(spikeSuccessRate * 100).toFixed(2)}%`
      );
    }

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
    this.log('Starting Performance Testing Framework...', 'START');

    try {
      // Run all performance tests
      await this.runLoadTests();
      await this.runStressTests();
      await this.runEnduranceTests();
      await this.runSpikeTests();

      // Generate and save report
      const report = this.generateReport();
      this.saveReport(report);
      this.printSummary(report);

      // Exit with appropriate code
      const hasCriticalIssues = report.recommendations.some(rec =>
        rec.includes('CRITICAL')
      );
      process.exit(hasCriticalIssues ? 1 : 0);
    } catch (error) {
      this.log(
        `Fatal error during performance testing: ${error.message}`,
        'FATAL'
      );
      process.exit(1);
    }
  }
}

// Run the performance testing framework
if (require.main === module) {
  const framework = new PerformanceTestingFramework();
  framework.run();
}

module.exports = PerformanceTestingFramework;
