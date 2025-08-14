#!/usr/bin/env node

const TaskValidator = require('./validate-tasks');

// Get task ID from command line arguments
const taskId = process.argv[2];

if (!taskId) {
  console.error('❌ Please provide a task ID');
  console.log('Usage: npm run validate:task <taskId>');
  console.log('Available task IDs: 6.2, 9, 10, 11, 12, 13');
  process.exit(1);
}

const validTaskIds = ['6.2', '9', '10', '11', '12', '13'];
if (!validTaskIds.includes(taskId)) {
  console.error(`❌ Invalid task ID: ${taskId}`);
  console.log('Available task IDs:', validTaskIds.join(', '));
  process.exit(1);
}

console.log(`🔍 Validating single task: ${taskId}`);
console.log('='.repeat(50));

const validator = new TaskValidator();
try {
  const result = validator.validateTask(taskId);
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 TASK VALIDATION RESULT');
  console.log('='.repeat(50));
  
  console.log(`Task ID: ${result.taskId}`);
  console.log(`Task Name: ${result.taskName}`);
  console.log(`Status: ${result.status}`);
  console.log(`Score: ${result.overallScore.toFixed(1)}%`);
  
  if (result.requirements) {
    console.log('\nRequirements:');
    result.requirements.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req}`);
    });
  }
  
  if (result.fileChecks) {
    console.log('\nFile Status:');
    Object.entries(result.fileChecks).forEach(([file, check]) => {
      const status = check.exists ? '✅' : '❌';
      const size = check.exists ? ` (${check.size} bytes)` : '';
      console.log(`  ${status} ${file}${size}`);
    });
  }
  
  if (result.codebasePatterns && result.codebasePatterns.found.length > 0) {
    console.log('\nPatterns Found:');
    const uniquePatterns = [...new Set(result.codebasePatterns.found)];
    uniquePatterns.forEach(pattern => {
      console.log(`  ✅ ${pattern}`);
    });
  }
  
  // Save individual task report
  const reportPath = `task-${taskId}-validation-report.json`;
  require('fs').writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
} catch (error) {
  console.error(`❌ Error validating task ${taskId}:`, error.message);
  process.exit(1);
}
