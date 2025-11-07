#!/usr/bin/env node
/**
 * Application Plan Progress Tracker
 * Tracks implementation progress across all phases
 */

const fs = require('fs');
const path = require('path');

const PLAN_FILE = path.join(__dirname, '..', 'COMPREHENSIVE_APPLICATION_PLAN.md');
const STATUS_FILE = path.join(__dirname, '..', 'implementation-progress.json');

// Read plan file
function readPlan() {
  try {
    return fs.readFileSync(PLAN_FILE, 'utf8');
  } catch (error) {
    console.error('Error reading plan file:', error.message);
    process.exit(1);
  }
}

// Parse tasks from plan
function parseTasks(planContent) {
  const tasks = [];
  const lines = planContent.split('\n');
  
  let currentPhase = '';
  let currentTask = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect phase headers
    if (line.startsWith('## Phase')) {
      currentPhase = line.replace(/^##\s+/, '').trim();
    }
    
    // Detect task headers
    if (line.startsWith('#### Task') || line.startsWith('### Task')) {
      const taskMatch = line.match(/Task\s+(\d+\.\d+\.\d+):\s*(.+)/);
      if (taskMatch) {
        if (currentTask) {
          tasks.push(currentTask);
        }
        currentTask = {
          id: taskMatch[1],
          title: taskMatch[2],
          phase: currentPhase,
          actions: [],
          status: 'pending'
        };
      }
    }
    
    // Detect action items
    if (line.includes('- [ ]') && currentTask) {
      const action = line.replace(/^[\s-]*\[[\sx]\]\s*/, '').trim();
      if (action) {
        currentTask.actions.push({
          text: action,
          completed: false
        });
      }
    }
    
    // Detect completed items
    if (line.includes('- [x]') && currentTask) {
      const action = line.replace(/^[\s-]*\[x\]\s*/, '').trim();
      if (action) {
        const existingAction = currentTask.actions.find(a => a.text === action);
        if (existingAction) {
          existingAction.completed = true;
        } else {
          currentTask.actions.push({
            text: action,
            completed: true
          });
        }
      }
    }
    
    // Detect status markers
    if (line.includes('**Status:**') && currentTask) {
      const statusMatch = line.match(/\*\*Status:\*\*\s*(.+)/);
      if (statusMatch) {
        const status = statusMatch[1].trim();
        if (status.includes('✅') || status.includes('Done') || status.includes('Created')) {
          currentTask.status = 'completed';
        } else if (status.includes('🟡') || status.includes('In Progress')) {
          currentTask.status = 'in_progress';
        }
      }
    }
  }
  
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  return tasks;
}

// Calculate progress
function calculateProgress(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  
  const totalActions = tasks.reduce((sum, task) => sum + task.actions.length, 0);
  const completedActions = tasks.reduce((sum, task) => 
    sum + task.actions.filter(a => a.completed).length, 0
  , 0);
  
  return {
    tasks: {
      total,
      completed,
      inProgress,
      pending,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    },
    actions: {
      total: totalActions,
      completed: completedActions,
      percentage: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
    }
  };
}

// Generate report
function generateReport(tasks, progress) {
  const report = {
    timestamp: new Date().toISOString(),
    progress,
    phases: {},
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      phase: task.phase,
      status: task.status,
      actionsCompleted: task.actions.filter(a => a.completed).length,
      actionsTotal: task.actions.length
    }))
  };
  
  // Group by phase
  tasks.forEach(task => {
    if (!report.phases[task.phase]) {
      report.phases[task.phase] = {
        tasks: [],
        completed: 0,
        inProgress: 0,
        pending: 0
      };
    }
    report.phases[task.phase].tasks.push(task.id);
    report.phases[task.phase][task.status === 'completed' ? 'completed' : 
                             task.status === 'in_progress' ? 'inProgress' : 'pending']++;
  });
  
  return report;
}

// Main execution
function main() {
  console.log('📊 Application Plan Progress Tracker\n');
  
  const planContent = readPlan();
  const tasks = parseTasks(planContent);
  const progress = calculateProgress(tasks);
  const report = generateReport(tasks, progress);
  
  // Save report
  fs.writeFileSync(STATUS_FILE, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('📈 Progress Summary\n');
  console.log(`Tasks: ${progress.tasks.completed}/${progress.tasks.total} completed (${progress.tasks.percentage}%)`);
  console.log(`Actions: ${progress.actions.completed}/${progress.actions.total} completed (${progress.actions.percentage}%)`);
  console.log(`\nStatus Breakdown:`);
  console.log(`  ✅ Completed: ${progress.tasks.completed}`);
  console.log(`  🔄 In Progress: ${progress.tasks.inProgress}`);
  console.log(`  ⏳ Pending: ${progress.tasks.pending}`);
  
  console.log(`\n📁 Report saved to: ${STATUS_FILE}`);
  
  // Show phase breakdown
  console.log('\n📋 Phase Breakdown:');
  Object.entries(report.phases).forEach(([phase, data]) => {
    const phaseProgress = data.tasks.length > 0 
      ? Math.round((data.completed / data.tasks.length) * 100)
      : 0;
    console.log(`  ${phase}: ${data.completed}/${data.tasks.length} (${phaseProgress}%)`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { parseTasks, calculateProgress, generateReport };

