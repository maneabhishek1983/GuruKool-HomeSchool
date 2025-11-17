#!/usr/bin/env tsx
/**
 * Backend Integration Agent Executor
 *
 * Runs the BackendIntegrationAgent to generate Supabase clients and auth services.
 * Generates code for both Flutter mobile app and Next.js web backend.
 *
 * Usage:
 *   npx tsx scripts/run-backend-integration.ts
 */

import { BackendIntegrationAgent } from '../agents/autonomous/backend-integration.agent';
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
  console.log('GuruKool HomeSchool - Backend Integration Agent Executor');
  console.log('='.repeat(60));
  console.log('');

  const backendAgent = new BackendIntegrationAgent();

  try {
    // Step 1: Setup Supabase client for Flutter
    console.log('[STEP 1/5] Setting up Supabase client for Flutter...');
    console.log('');

    const supabaseFlutterResult: AgentResult = await backendAgent.execute({
      action: 'setup_supabase_client',
      payload: {
        platform: 'flutter',
        outputPath: join(
          process.cwd(),
          'gurukool_teacher',
          'lib',
          'services',
          'supabase.service.dart'
        ),
      },
    });

    if (!supabaseFlutterResult.success) {
      console.error(
        '❌ Supabase Flutter client setup failed:',
        supabaseFlutterResult.message
      );
      if (supabaseFlutterResult.errors) {
        supabaseFlutterResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Supabase Flutter client created');
    if (supabaseFlutterResult.artifacts) {
      supabaseFlutterResult.artifacts.forEach(file =>
        console.log(`   → ${file}`)
      );
    }
    console.log('');

    // Step 2: Implement auth flow for Flutter
    console.log('[STEP 2/5] Implementing authentication flow for Flutter...');
    console.log('');

    const authFlutterResult: AgentResult = await backendAgent.execute({
      action: 'implement_auth_flow',
      payload: {
        platform: 'flutter',
        outputPath: join(
          process.cwd(),
          'gurukool_teacher',
          'lib',
          'services',
          'auth.service.dart'
        ),
      },
    });

    if (!authFlutterResult.success) {
      console.error(
        '❌ Auth flow implementation failed:',
        authFlutterResult.message
      );
      if (authFlutterResult.errors) {
        authFlutterResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Auth service created');
    if (authFlutterResult.artifacts) {
      authFlutterResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Step 3: Generate data models from Supabase schema
    console.log('[STEP 3/5] Generating data models from Supabase schema...');
    console.log('');

    const modelsResult: AgentResult = await backendAgent.execute({
      action: 'generate_data_models',
      payload: {
        platform: 'flutter',
        outputDir: join(process.cwd(), 'gurukool_teacher', 'lib', 'models'),
        tables: [
          'students',
          'teachers',
          'teacher_sessions',
          'teacher_qr_codes',
        ],
      },
    });

    if (!modelsResult.success) {
      console.error('❌ Data model generation failed:', modelsResult.message);
      if (modelsResult.errors) {
        modelsResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Data models generated');
    if (modelsResult.artifacts) {
      modelsResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Step 4: Setup Supabase realtime subscriptions
    console.log('[STEP 4/5] Setting up Supabase Realtime subscriptions...');
    console.log('');

    const realtimeResult: AgentResult = await backendAgent.execute({
      action: 'setup_realtime',
      payload: {
        tableName: 'teacher_sessions',
        platform: 'flutter',
        outputPath: join(
          process.cwd(),
          'gurukool_teacher',
          'lib',
          'services',
          'realtime.service.dart'
        ),
      },
    });

    if (!realtimeResult.success) {
      console.error('❌ Realtime setup failed:', realtimeResult.message);
      if (realtimeResult.errors) {
        realtimeResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Realtime service created');
    if (realtimeResult.artifacts) {
      realtimeResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Step 5: Create API endpoint wrappers
    console.log('[STEP 5/5] Creating API endpoint wrappers...');
    console.log('');

    const apiResult: AgentResult = await backendAgent.execute({
      action: 'create_api_endpoint',
      payload: {
        endpoint: '/api/teacher-sessions',
        method: 'POST',
        platform: 'flutter',
        outputPath: join(
          process.cwd(),
          'gurukool_teacher',
          'lib',
          'services',
          'session_api.service.dart'
        ),
      },
    });

    if (!apiResult.success) {
      console.error('❌ API endpoint creation failed:', apiResult.message);
      if (apiResult.errors) {
        apiResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ API service created');
    if (apiResult.artifacts) {
      apiResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Collect all results
    const allArtifacts = [
      ...(supabaseFlutterResult.artifacts || []),
      ...(authFlutterResult.artifacts || []),
      ...(modelsResult.artifacts || []),
      ...(realtimeResult.artifacts || []),
      ...(apiResult.artifacts || []),
    ];

    // Save results to JSON file
    const outputPath = join(
      process.cwd(),
      'temp',
      'backend-integration-output.json'
    );
    const output = {
      timestamp: new Date().toISOString(),
      supabaseClient: supabaseFlutterResult,
      authFlow: authFlutterResult,
      dataModels: modelsResult,
      realtime: realtimeResult,
      apiEndpoints: apiResult,
      summary: {
        totalFiles: allArtifacts.length,
        files: allArtifacts,
      },
    };

    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 Full results saved to: ${outputPath}`);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Backend Integration Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📁 Generated Files:');
    allArtifacts.forEach(file => console.log(`   - ${file}`));
    console.log('');
    console.log('Next steps:');
    console.log(
      '  1. Review generated services in gurukool_teacher/lib/services/'
    );
    console.log('  2. Update .env with your Supabase credentials:');
    console.log('     SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co');
    console.log('     SUPABASE_ANON_KEY=your_anon_key_here');
    console.log(
      '  3. Run UI Designer agent: npx tsx scripts/run-ui-designer.ts'
    );
    console.log(
      '  4. Run State Management agent: npx tsx scripts/run-state-management.ts'
    );
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during backend integration:');
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
