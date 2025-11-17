#!/usr/bin/env tsx
/**
 * State Management Agent Executor
 *
 * Runs the StateManagementAgent to setup Riverpod providers and offline storage.
 * Generates state containers, caching, and sync queue for offline-first architecture.
 *
 * Usage:
 *   npx tsx scripts/run-state-management.ts
 */

import { StateManagementAgent } from '../agents/autonomous/state-management.agent';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface AgentResult {
  success: boolean;
  message: string;
  data?: any;
  artifacts?: string[];
  errors?: string[];
}

async function main() {
  console.log('='.repeat(60));
  console.log('GuruKool HomeSchool - State Management Agent Executor');
  console.log('='.repeat(60));
  console.log('');

  const stateAgent = new StateManagementAgent();

  try {
    // Step 1: Setup Riverpod providers
    console.log('[STEP 1/4] Setting up Riverpod providers...');
    console.log('');

    const providersResult: AgentResult = await stateAgent.execute({
      action: 'setup_riverpod_providers',
      payload: {
        outputPath: join(process.cwd(), 'gurukool_teacher'),
      },
    });

    if (!providersResult.success) {
      console.error(
        '❌ Riverpod provider setup failed:',
        providersResult.message
      );
      if (providersResult.errors) {
        providersResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Riverpod providers created');
    if (providersResult.artifacts) {
      providersResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Step 2: Create state containers
    console.log('[STEP 2/4] Creating state containers...');
    console.log('');

    const containersResult: AgentResult = await stateAgent.execute({
      action: 'create_state_containers',
      payload: {
        outputPath: join(process.cwd(), 'gurukool_teacher'),
      },
    });

    if (!containersResult.success) {
      console.error(
        '❌ State container creation failed:',
        containersResult.message
      );
      if (containersResult.errors) {
        containersResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ State containers created');
    if (containersResult.artifacts) {
      containersResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Step 3: Implement caching
    console.log('[STEP 3/4] Implementing caching strategy...');
    console.log('');

    const cachingResult: AgentResult = await stateAgent.execute({
      action: 'implement_caching',
      payload: {
        outputPath: join(process.cwd(), 'gurukool_teacher'),
      },
    });

    if (!cachingResult.success) {
      console.error('❌ Caching implementation failed:', cachingResult.message);
      if (cachingResult.errors) {
        cachingResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Caching service created');
    if (cachingResult.artifacts) {
      cachingResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Step 4: Setup offline storage
    console.log('[STEP 4/4] Setting up offline storage with Hive...');
    console.log('');

    const storageResult: AgentResult = await stateAgent.execute({
      action: 'setup_offline_storage',
      payload: {
        outputPath: join(process.cwd(), 'gurukool_teacher'),
      },
    });

    if (!storageResult.success) {
      console.error('❌ Offline storage setup failed:', storageResult.message);
      if (storageResult.errors) {
        storageResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Offline storage configured');
    if (storageResult.artifacts) {
      storageResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Collect all results
    const allArtifacts = [
      ...(providersResult.artifacts || []),
      ...(containersResult.artifacts || []),
      ...(cachingResult.artifacts || []),
      ...(storageResult.artifacts || []),
    ];

    // Save results to JSON file
    const outputPath = join(
      process.cwd(),
      'temp',
      'state-management-output.json'
    );
    const output = {
      timestamp: new Date().toISOString(),
      providers: providersResult,
      containers: containersResult,
      caching: cachingResult,
      storage: storageResult,
      summary: {
        totalFiles: allArtifacts.length,
        files: allArtifacts,
      },
    };

    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 Full results saved to: ${outputPath}`);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ State Management Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📁 Generated Files:');
    allArtifacts.forEach(file => console.log(`   - ${file}`));
    console.log('');
    console.log('State Management Summary:');
    console.log('  ✓ Riverpod providers (auth, session, student)');
    console.log('  ✓ State containers (AuthState, SessionState)');
    console.log('  ✓ In-memory caching with TTL');
    console.log('  ✓ Hive offline storage');
    console.log('  ✓ Sync queue for offline operations');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Initialize Hive in main.dart before runApp()');
    console.log('  2. Wrap MyApp with ProviderScope');
    console.log('  3. Test the app: cd gurukool_teacher && flutter run');
    console.log('  4. Generate tests: npx tsx scripts/run-testing-agent.ts');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during state management setup:');
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
