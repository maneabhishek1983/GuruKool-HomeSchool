#!/usr/bin/env tsx
/**
 * UI Designer Agent Executor
 *
 * Runs the UIDesignerAgent to migrate design tokens and generate screens.
 * Converts Tailwind CSS tokens to Flutter Material Design 3.
 *
 * Usage:
 *   npx tsx scripts/run-ui-designer.ts
 */

import { UIDesignerAgent } from '../agents/autonomous/ui-designer.agent';
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
  console.log('GuruKool HomeSchool - UI Designer Agent Executor');
  console.log('='.repeat(60));
  console.log('');

  const uiDesigner = new UIDesignerAgent();

  try {
    // Step 1: Migrate design tokens from Tailwind to Flutter
    console.log('[STEP 1/4] Migrating design tokens (Tailwind → Flutter)...');
    console.log('');

    const tokensResult: AgentResult = await uiDesigner.execute({
      action: 'migrate_design_tokens',
      payload: {
        tailwindConfigPath: join(process.cwd(), 'src', 'config', 'theme.ts'),
        outputDir: join(process.cwd(), 'gurukool_teacher'),
      },
    });

    if (!tokensResult.success) {
      console.error('❌ Design token migration failed:', tokensResult.message);
      if (tokensResult.errors) {
        tokensResult.errors.forEach(err => console.error('  -', err));
      }
      process.exit(1);
    }

    console.log('✅ Design tokens migrated');
    if (tokensResult.artifacts) {
      tokensResult.artifacts.forEach(file => console.log(`   → ${file}`));
    }
    console.log('');

    // Collect all results
    const allArtifacts = [...(tokensResult.artifacts || [])];

    // Save results to JSON file
    const outputPath = join(process.cwd(), 'temp', 'ui-designer-output.json');
    const output = {
      timestamp: new Date().toISOString(),
      designTokens: tokensResult,
      summary: {
        totalFiles: allArtifacts.length,
        files: allArtifacts,
      },
    };

    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 Full results saved to: ${outputPath}`);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ UI Design Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📁 Generated Files:');
    allArtifacts.forEach(file => console.log(`   - ${file}`));
    console.log('');
    console.log('Next steps:');
    console.log(
      '  1. Review generated files in gurukool_teacher/lib/design_system/'
    );
    console.log(
      '  2. Run State Management agent: npx tsx scripts/run-state-management.ts'
    );
    console.log('  3. Test the UI: cd gurukool_teacher && flutter run');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during UI design:');
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
