/**
 * UI Designer Agent - Login Screen Generator
 *
 * Generates Flutter Login screen with:
 * - Material Design 3
 * - Email/password fields
 * - Loading states
 * - Design token integration
 */

import { join } from 'path';
import { writeFileSync } from 'fs';
import { UIDesignerAgent } from '../agents/autonomous/ui-designer.agent';
import { AgentResult } from '../agents/base.agent';

async function main() {
  console.log('[STEP 1] Initializing UI Designer Agent...');
  const uiAgent = new UIDesignerAgent();

  console.log('[STEP 2] Generating Login Screen for Flutter...');
  const loginResult: AgentResult = await uiAgent.execute({
    action: 'generate_screen',
    payload: {
      screenName: 'login',
      platform: 'flutter',
      outputPath: join(
        process.cwd(),
        'gurukool_teacher',
        'lib',
        'screens',
        'login_screen.dart'
      ),
    },
  });

  console.log('[STEP 3] Login Screen Generated!');
  console.log(`  Success: ${loginResult.success}`);
  console.log(`  Message: ${loginResult.message}`);
  if (loginResult.data) {
    console.log('  Screen Details:');
    console.log(`    - Name: ${loginResult.data.screenName}`);
    console.log(`    - Platform: ${loginResult.data.platform}`);
    console.log(`    - Components: ${loginResult.data.components}`);
    console.log(
      `    - Design Tokens: ${loginResult.data.designTokens?.join(', ')}`
    );
    console.log(`    - File: ${loginResult.data.outputPath}`);
  }

  // Save execution results
  const output = {
    timestamp: new Date().toISOString(),
    agent: 'UI Designer Agent',
    action: 'generate_login_screen',
    results: {
      loginScreen: loginResult,
    },
    summary: {
      success: loginResult.success,
      filesGenerated: loginResult.artifacts?.length || 1,
    },
  };

  const outputPath = join(
    process.cwd(),
    'temp',
    'ui-designer-login-output.json'
  );
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n[OK] Results saved to: ${outputPath}`);

  console.log('\n[COMPLETE] Login screen generation complete!');
  console.log('Next steps:');
  console.log(
    '1. Review generated file: gurukool_teacher/lib/screens/login_screen.dart'
  );
  console.log('2. Add authentication logic to _handleLogin method');
  console.log('3. Update main.dart to use LoginScreen');
}

main().catch(error => {
  console.error('[ERROR] UI Designer Agent execution failed:', error);
  process.exit(1);
});
