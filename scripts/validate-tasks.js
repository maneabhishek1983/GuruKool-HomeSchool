#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Task validation configuration
const TASK_VALIDATION_CONFIG = {
  '6.2': {
    name: 'Create offline-capable components',
    requirements: [
      'offline session components',
      'offline timesheet tracking',
      'offline notification queue',
      'offline indicator UI'
    ],
    files: [
      'src/components/sessions/OfflineSessionManager.tsx',
      'src/components/notifications/OfflineNotificationQueue.tsx',
      'src/components/ui/OfflineIndicator.tsx',
      'src/services/offline-storage.service.ts'
    ],
    patterns: [
      'offline.*session',
      'offline.*timesheet',
      'offline.*notification',
      'sync.*status'
    ]
  },
  '9': {
    name: 'Add advanced data visualization and analytics',
    requirements: [
      'interactive charts with Recharts',
      'learning progress visualization',
      'session analytics with teacher metrics',
      'comparative analytics',
      'AI-powered insights display'
    ],
    files: [
      'src/components/analytics/AnalyticsDashboard.tsx',
      'src/components/analytics/InsightCard.tsx',
      'src/services/analytics.service.ts',
      'src/services/ai-insights.service.ts'
    ],
    patterns: [
      'Recharts',
      'Chart.*component',
      'analytics.*dashboard',
      'insight.*card',
      'visualization'
    ]
  },
  '10': {
    name: 'Implement security and privacy features',
    requirements: [
      'end-to-end encryption',
      'audit logging system',
      'rate limiting and DDoS protection',
      'data anonymization',
      'user consent management',
      'GDPR compliance'
    ],
    files: [
      'src/services/security.service.ts',
      'src/services/logging.service.ts',
      'src/components/auth/AuthGuard.tsx'
    ],
    patterns: [
      'encryption',
      'audit.*log',
      'rate.*limit',
      'consent.*management',
      'GDPR',
      'privacy'
    ]
  },
  '11': {
    name: 'Build integration and extensibility framework',
    requirements: [
      'secure API gateway',
      'webhook system',
      'plugin architecture',
      'calendar integration',
      'data export/import system',
      'backup and restore'
    ],
    files: [
      'src/services/api-gateway.service.ts',
      'src/services/webhook.service.ts',
      'src/services/plugin.service.ts',
      'src/services/calendar-integration.service.ts',
      'src/services/data-export.service.ts'
    ],
    patterns: [
      'API.*gateway',
      'webhook',
      'plugin.*architecture',
      'calendar.*integration',
      'data.*export',
      'backup.*restore'
    ]
  },
  '12': {
    name: 'Create comprehensive testing suite',
    requirements: [
      'unit tests for components',
      'integration tests for API endpoints',
      'AI agent testing',
      'performance testing',
      'E2E tests with Playwright',
      'accessibility testing'
    ],
    files: [
      'src/agents/__tests__/',
      'src/components/__tests__/',
      'src/services/__tests__/',
      'e2e/',
      'playwright.config.ts',
      'jest.config.js'
    ],
    patterns: [
      '\\.test\\.',
      '\\.spec\\.',
      'describe\\(',
      'it\\(',
      'expect\\(',
      'playwright',
      'accessibility'
    ]
  },
  '13': {
    name: 'Deploy and configure production environment',
    requirements: [
      'production database configuration',
      'Redis cache cluster',
      'CDN configuration',
      'monitoring and alerting',
      'CI/CD pipeline',
      'performance monitoring'
    ],
    files: [
      'docker-compose.yml',
      'Dockerfile',
      'deploy/',
      'infrastructure/',
      'monitoring/',
      'ci/',
      'vercel.json'
    ],
    patterns: [
      'production.*config',
      'redis.*cache',
      'CDN',
      'monitoring',
      'alerting',
      'CI.*CD',
      'deployment'
    ]
  }
};

class TaskValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {};
  }

  // Check if file exists
  checkFileExists(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    return {
      exists: fs.existsSync(fullPath),
      path: fullPath,
      size: fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0
    };
  }

  // Search for patterns in file content
  searchPatternsInFile(filePath, patterns) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) return { found: [], content: '' };

    // Check if it's a directory
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) return { found: [], content: 'Directory' };

    const content = fs.readFileSync(fullPath, 'utf8');
    const found = patterns.filter(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(content);
    });

    return { found, content: content.substring(0, 500) + '...' };
  }

  // Recursively search for patterns in directory
  searchPatternsInDirectory(dirPath, patterns) {
    const fullPath = path.join(this.projectRoot, dirPath);
    if (!fs.existsSync(fullPath)) return { found: [], files: [] };

    const results = { found: [], files: [] };
    
    const searchRecursive = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          searchRecursive(itemPath);
        } else if (stat.isFile() && /\.(ts|tsx|js|jsx|json|yml|yaml)$/.test(item)) {
          const relativePath = path.relative(this.projectRoot, itemPath);
          const content = fs.readFileSync(itemPath, 'utf8');
          
          const foundPatterns = patterns.filter(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(content);
          });
          
          if (foundPatterns.length > 0) {
            results.found.push(...foundPatterns);
            results.files.push(relativePath);
          }
        }
      }
    };

    searchRecursive(fullPath);
    return results;
  }

  // Validate a specific task
  validateTask(taskId) {
    const config = TASK_VALIDATION_CONFIG[taskId];
    if (!config) {
      throw new Error(`Unknown task ID: ${taskId}`);
    }

    console.log(`\n🔍 Validating Task ${taskId}: ${config.name}`);
    console.log('='.repeat(60));

    const validation = {
      taskId,
      taskName: config.name,
      requirements: config.requirements,
      fileChecks: {},
      patternChecks: {},
      overallScore: 0,
      status: 'NOT_STARTED'
    };

    // Check required files
    console.log('\n📁 Checking required files:');
    let fileScore = 0;
    for (const file of config.files) {
      const fileCheck = this.checkFileExists(file);
      validation.fileChecks[file] = fileCheck;
      
      if (fileCheck.exists) {
        console.log(`  ✅ ${file} (${fileCheck.size} bytes)`);
        fileScore += 1;
      } else {
        console.log(`  ❌ ${file} (missing)`);
      }
    }

    // Search for patterns in specific files
    console.log('\n🔍 Checking patterns in specific files:');
    for (const file of config.files) {
      const patternCheck = this.searchPatternsInFile(file, config.patterns);
      validation.patternChecks[file] = patternCheck;
      
      if (patternCheck.found.length > 0) {
        console.log(`  ✅ ${file}: Found patterns: ${patternCheck.found.join(', ')}`);
      }
    }

    // Search for patterns in entire codebase
    console.log('\n🔍 Searching codebase for patterns:');
    const codebaseSearch = this.searchPatternsInDirectory('src', config.patterns);
    validation.codebasePatterns = codebaseSearch;
    
    if (codebaseSearch.found.length > 0) {
      console.log(`  ✅ Found patterns: ${[...new Set(codebaseSearch.found)].join(', ')}`);
      console.log(`  📄 In files: ${codebaseSearch.files.slice(0, 5).join(', ')}${codebaseSearch.files.length > 5 ? '...' : ''}`);
    } else {
      console.log(`  ❌ No patterns found in codebase`);
    }

    // Calculate overall score
    const totalFiles = config.files.length;
    const filePercentage = totalFiles > 0 ? (fileScore / totalFiles) * 100 : 0;
    const patternScore = codebaseSearch.found.length > 0 ? 50 : 0;
    validation.overallScore = Math.min(100, filePercentage + patternScore);

    // Determine status
    if (validation.overallScore >= 80) {
      validation.status = 'COMPLETED';
    } else if (validation.overallScore >= 40) {
      validation.status = 'IN_PROGRESS';
    } else {
      validation.status = 'NOT_STARTED';
    }

    console.log(`\n📊 Task ${taskId} Summary:`);
    console.log(`  Score: ${validation.overallScore.toFixed(1)}%`);
    console.log(`  Status: ${validation.status}`);
    console.log(`  Files found: ${fileScore}/${totalFiles}`);
    console.log(`  Patterns found: ${codebaseSearch.found.length}`);

    return validation;
  }

  // Validate all not-started tasks
  validateAllTasks() {
    console.log('🚀 Starting Task Implementation Validation');
    console.log('='.repeat(60));

    const taskIds = ['6.2', '9', '10', '11', '12', '13'];
    const results = {};

    for (const taskId of taskIds) {
      try {
        results[taskId] = this.validateTask(taskId);
      } catch (error) {
        console.error(`❌ Error validating task ${taskId}:`, error.message);
        results[taskId] = {
          taskId,
          error: error.message,
          status: 'ERROR'
        };
      }
    }

    // Generate summary report
    this.generateSummaryReport(results);
    
    return results;
  }

  // Generate summary report
  generateSummaryReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 VALIDATION SUMMARY REPORT');
    console.log('='.repeat(60));

    const summary = {
      total: Object.keys(results).length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      errors: 0
    };

    for (const [taskId, result] of Object.entries(results)) {
      if (result.error) {
        summary.errors++;
        console.log(`❌ ${taskId}: ${result.taskName || 'Unknown'} - ERROR`);
      } else {
        switch (result.status) {
          case 'COMPLETED':
            summary.completed++;
            console.log(`✅ ${taskId}: ${result.taskName} - COMPLETED (${result.overallScore.toFixed(1)}%)`);
            break;
          case 'IN_PROGRESS':
            summary.inProgress++;
            console.log(`🔄 ${taskId}: ${result.taskName} - IN PROGRESS (${result.overallScore.toFixed(1)}%)`);
            break;
          case 'NOT_STARTED':
            summary.notStarted++;
            console.log(`❌ ${taskId}: ${result.taskName} - NOT STARTED (${result.overallScore.toFixed(1)}%)`);
            break;
        }
      }
    }

    console.log('\n📊 Overall Statistics:');
    console.log(`  Total Tasks: ${summary.total}`);
    console.log(`  Completed: ${summary.completed} (${((summary.completed/summary.total)*100).toFixed(1)}%)`);
    console.log(`  In Progress: ${summary.inProgress} (${((summary.inProgress/summary.total)*100).toFixed(1)}%)`);
    console.log(`  Not Started: ${summary.notStarted} (${((summary.notStarted/summary.total)*100).toFixed(1)}%)`);
    console.log(`  Errors: ${summary.errors}`);

    // Save detailed report
    const reportPath = path.join(this.projectRoot, 'task-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
if (require.main === module) {
  const validator = new TaskValidator();
  validator.validateAllTasks();
}

module.exports = TaskValidator;
