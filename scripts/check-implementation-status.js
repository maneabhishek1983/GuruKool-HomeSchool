#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ImplementationStatusChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.status = {};
  }

  // Check if directory exists and has files
  checkDirectory(dirPath) {
    const fullPath = path.join(this.projectRoot, dirPath);
    if (!fs.existsSync(fullPath)) {
      return { exists: false, fileCount: 0, files: [] };
    }

    const files = fs.readdirSync(fullPath, { withFileTypes: true });
    const fileList = files
      .filter(file => file.isFile())
      .map(file => file.name);

    return {
      exists: true,
      fileCount: fileList.length,
      files: fileList
    };
  }

  // Check if file exists and get its size
  checkFile(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      return { exists: false, size: 0 };
    }

    const stats = fs.statSync(fullPath);
    return {
      exists: true,
      size: stats.size
    };
  }

  // Search for specific patterns in a file
  searchInFile(filePath, patterns) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) return [];

    const content = fs.readFileSync(fullPath, 'utf8');
    return patterns.filter(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(content);
    });
  }

  // Check implementation status
  checkStatus() {
    console.log('🔍 Checking Current Implementation Status');
    console.log('='.repeat(60));

    // Task 6.2: Offline-capable components
    console.log('\n📱 Task 6.2: Offline-capable components');
    const offlineComponents = {
      offlineSessionManager: this.checkFile('src/components/sessions/OfflineSessionManager.tsx'),
      offlineNotificationQueue: this.checkFile('src/components/notifications/OfflineNotificationQueue.tsx'),
      offlineIndicator: this.checkFile('src/components/ui/OfflineIndicator.tsx'),
      offlineStorage: this.checkFile('src/services/offline-storage.service.ts')
    };

    let offlineScore = 0;
    Object.entries(offlineComponents).forEach(([name, check]) => {
      if (check.exists) {
        console.log(`  ✅ ${name}: ${check.size} bytes`);
        offlineScore++;
      } else {
        console.log(`  ❌ ${name}: missing`);
      }
    });

    // Task 9: Advanced data visualization and analytics
    console.log('\n📊 Task 9: Advanced data visualization and analytics');
    const analyticsComponents = {
      analyticsDashboard: this.checkFile('src/components/analytics/AnalyticsDashboard.tsx'),
      insightCard: this.checkFile('src/components/analytics/InsightCard.tsx'),
      analyticsService: this.checkFile('src/services/analytics.service.ts'),
      aiInsightsService: this.checkFile('src/services/ai-insights.service.ts')
    };

    let analyticsScore = 0;
    Object.entries(analyticsComponents).forEach(([name, check]) => {
      if (check.exists) {
        console.log(`  ✅ ${name}: ${check.size} bytes`);
        analyticsScore++;
      } else {
        console.log(`  ❌ ${name}: missing`);
      }
    });

    // Check for Recharts usage
    const rechartsUsage = this.searchInFile('src/components/analytics/AnalyticsDashboard.tsx', ['Recharts', 'Chart', 'LineChart', 'BarChart']);
    if (rechartsUsage.length > 0) {
      console.log(`  ✅ Recharts usage found: ${rechartsUsage.join(', ')}`);
      analyticsScore += 0.5;
    }

    // Task 10: Security and privacy features
    console.log('\n🔒 Task 10: Security and privacy features');
    const securityComponents = {
      securityService: this.checkFile('src/services/security.service.ts'),
      loggingService: this.checkFile('src/services/logging.service.ts'),
      authGuard: this.checkFile('src/components/auth/AuthGuard.tsx')
    };

    let securityScore = 0;
    Object.entries(securityComponents).forEach(([name, check]) => {
      if (check.exists) {
        console.log(`  ✅ ${name}: ${check.size} bytes`);
        securityScore++;
      } else {
        console.log(`  ❌ ${name}: missing`);
      }
    });

    // Check for security patterns
    const securityPatterns = this.searchInFile('src/services/security.service.ts', ['encryption', 'audit', 'rate.*limit', 'consent']);
    if (securityPatterns.length > 0) {
      console.log(`  ✅ Security patterns found: ${securityPatterns.join(', ')}`);
      securityScore += 0.5;
    }

    // Task 11: Integration and extensibility framework
    console.log('\n🔗 Task 11: Integration and extensibility framework');
    const integrationComponents = {
      apiGateway: this.checkFile('src/services/api-gateway.service.ts'),
      webhookService: this.checkFile('src/services/webhook.service.ts'),
      pluginService: this.checkFile('src/services/plugin.service.ts'),
      calendarIntegration: this.checkFile('src/services/calendar-integration.service.ts'),
      dataExport: this.checkFile('src/services/data-export.service.ts')
    };

    let integrationScore = 0;
    Object.entries(integrationComponents).forEach(([name, check]) => {
      if (check.exists) {
        console.log(`  ✅ ${name}: ${check.size} bytes`);
        integrationScore++;
      } else {
        console.log(`  ❌ ${name}: missing`);
      }
    });

    // Task 12: Comprehensive testing suite
    console.log('\n🧪 Task 12: Comprehensive testing suite');
    const testingComponents = {
      agentTests: this.checkDirectory('src/agents/__tests__'),
      componentTests: this.checkDirectory('src/components/__tests__'),
      serviceTests: this.checkDirectory('src/services/__tests__'),
      e2eTests: this.checkDirectory('e2e'),
      playwrightConfig: this.checkFile('playwright.config.ts'),
      jestConfig: this.checkFile('jest.config.js')
    };

    let testingScore = 0;
    Object.entries(testingComponents).forEach(([name, check]) => {
      if (check.exists) {
        console.log(`  ✅ ${name}: ${check.fileCount || check.size} ${check.fileCount ? 'files' : 'bytes'}`);
        testingScore++;
      } else {
        console.log(`  ❌ ${name}: missing`);
      }
    });

    // Task 13: Production environment
    console.log('\n🚀 Task 13: Production environment');
    const productionComponents = {
      dockerCompose: this.checkFile('docker-compose.yml'),
      dockerfile: this.checkFile('Dockerfile'),
      deployDir: this.checkDirectory('deploy'),
      infrastructureDir: this.checkDirectory('infrastructure'),
      monitoringDir: this.checkDirectory('monitoring'),
      ciDir: this.checkDirectory('ci'),
      vercelConfig: this.checkFile('vercel.json')
    };

    let productionScore = 0;
    Object.entries(productionComponents).forEach(([name, check]) => {
      if (check.exists) {
        console.log(`  ✅ ${name}: ${check.fileCount || check.size} ${check.fileCount ? 'files' : 'bytes'}`);
        productionScore++;
      } else {
        console.log(`  ❌ ${name}: missing`);
      }
    });

    // Calculate scores and generate summary
    const scores = {
      '6.2': (offlineScore / 4) * 100,
      '9': (analyticsScore / 4.5) * 100,
      '10': (securityScore / 3.5) * 100,
      '11': (integrationScore / 5) * 100,
      '12': (testingScore / 6) * 100,
      '13': (productionScore / 7) * 100
    };

    console.log('\n' + '='.repeat(60));
    console.log('📋 IMPLEMENTATION STATUS SUMMARY');
    console.log('='.repeat(60));

    Object.entries(scores).forEach(([taskId, score]) => {
      const status = score >= 80 ? '✅ COMPLETED' : score >= 40 ? '🔄 IN PROGRESS' : '❌ NOT STARTED';
      console.log(`${taskId}: ${status} (${score.toFixed(1)}%)`);
    });

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    console.log(`\nOverall Progress: ${overallScore.toFixed(1)}%`);

    // Save status report
    const statusReport = {
      timestamp: new Date().toISOString(),
      scores,
      overallScore,
      details: {
        offlineComponents,
        analyticsComponents,
        securityComponents,
        integrationComponents,
        testingComponents,
        productionComponents
      }
    };

    const reportPath = path.join(this.projectRoot, 'implementation-status-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(statusReport, null, 2));
    console.log(`\n📄 Detailed status report saved to: ${reportPath}`);

    return statusReport;
  }
}

// Main execution
if (require.main === module) {
  const checker = new ImplementationStatusChecker();
  checker.checkStatus();
}

module.exports = ImplementationStatusChecker;
