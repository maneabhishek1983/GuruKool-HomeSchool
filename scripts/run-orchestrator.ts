#!/usr/bin/env ts-node
/**
 * Orchestrator Agent Executor
 *
 * Runs the OrchestratorAgent to initialize project tasks and plan sprints.
 * This script demonstrates autonomous agent execution for Flutter mobile app development.
 *
 * Usage:
 *   npx ts-node scripts/run-orchestrator.ts
 */

import { OrchestratorAgent } from '../agents/autonomous/orchestrator.agent';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface AgentResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

async function main() {
  console.log('='.repeat(60));
  console.log('GuruKool HomeSchool - Orchestrator Agent Executor');
  console.log('='.repeat(60));
  console.log('');

  const orchestrator = new OrchestratorAgent();

  try {
    // Step 1: Initialize project
    console.log(
      '[STEP 1/3] Initializing project with tasks from FLUTTER_DEVELOPMENT_PLAN.md...'
    );
    console.log('');

    const initResult: AgentResult = await orchestrator.execute({
      action: 'initialize_project',
    });

    if (!initResult.success) {
      console.error('❌ Project initialization failed:', initResult.message);
      if (initResult.errors) {
        initResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Project initialized successfully');
    console.log(`   Tasks loaded: ${initResult.data?.tasksCount || 0}`);
    console.log('');

    // Step 2: Plan Week 1 sprint
    console.log('[STEP 2/3] Planning Week 1 sprint...');
    console.log('');

    const sprintResult: AgentResult = await orchestrator.execute({
      action: 'plan_sprint',
      payload: { weekNumber: 1 },
    });

    if (!sprintResult.success) {
      console.error('❌ Sprint planning failed:', sprintResult.message);
      if (sprintResult.errors) {
        sprintResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Week 1 sprint planned successfully');
    console.log('');

    // Display sprint details
    if (sprintResult.data) {
      const sprint = sprintResult.data;
      console.log('📋 Week 1 Sprint Details:');
      console.log('─'.repeat(60));
      console.log(`   Week: ${sprint.weekNumber}`);
      console.log(`   Goal: ${sprint.goal}`);
      console.log(`   Tasks: ${sprint.tasks?.length || 0}`);
      console.log(`   Estimated Hours: ${sprint.estimatedHours || 0}`);
      console.log('');

      if (sprint.tasks && sprint.tasks.length > 0) {
        console.log('📝 Tasks:');
        sprint.tasks.forEach((task: any, index: number) => {
          console.log(
            `   ${index + 1}. [${task.priority}] ${task.id}: ${task.title}`
          );
          console.log(`      Status: ${task.status}`);
          console.log(`      Estimated: ${task.estimatedHours}h`);
          if (task.dependencies && task.dependencies.length > 0) {
            console.log(`      Depends on: ${task.dependencies.join(', ')}`);
          }
          console.log('');
        });
      }
    }

    // Step 3: Generate progress report
    console.log('[STEP 3/3] Generating progress report...');
    console.log('');

    const reportResult: AgentResult = await orchestrator.execute({
      action: 'generate_progress_report',
    });

    if (!reportResult.success) {
      console.error(
        '❌ Progress report generation failed:',
        reportResult.message
      );
      if (reportResult.errors) {
        reportResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Progress report generated');
    console.log('');

    // Display progress report
    if (reportResult.data) {
      const report = reportResult.data;
      console.log('📊 Project Progress Report:');
      console.log('─'.repeat(60));
      console.log(`   Total Tasks: ${report.totalTasks || 0}`);
      console.log(
        `   Completed: ${report.completedTasks || 0} (${report.completionPercentage || 0}%)`
      );
      console.log(`   In Progress: ${report.inProgressTasks || 0}`);
      console.log(`   Pending: ${report.pendingTasks || 0}`);
      console.log(`   Blocked: ${report.blockedTasks || 0}`);
      console.log('');

      if (report.upcomingTasks && report.upcomingTasks.length > 0) {
        console.log('🎯 Next 5 Tasks:');
        report.upcomingTasks.slice(0, 5).forEach((task: any, index: number) => {
          console.log(`   ${index + 1}. ${task.id}: ${task.title}`);
        });
        console.log('');
      }
    }

    // Save results to JSON file
    const outputPath = join(process.cwd(), 'temp', 'orchestrator-output.json');
    const output = {
      timestamp: new Date().toISOString(),
      initialization: initResult,
      sprint: sprintResult,
      report: reportResult,
    };

    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 Full results saved to: ${outputPath}`);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Orchestrator execution complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review Week 1 sprint tasks above');
    console.log('  2. Run agent scripts to generate code:');
    console.log(
      '     - npx ts-node scripts/run-ui-designer.ts (design tokens)'
    );
    console.log(
      '     - npx ts-node scripts/run-backend-integration.ts (Supabase)'
    );
    console.log(
      '     - npx ts-node scripts/run-state-management.ts (Riverpod)'
    );
    console.log('  3. Check temp/orchestrator-output.json for full details');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during orchestrator execution:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };
