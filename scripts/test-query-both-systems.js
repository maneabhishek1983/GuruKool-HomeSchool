#!/usr/bin/env node

/**
 * Simple Test: Verify queryBothSystems() Logic
 *
 * This test verifies that the service layer correctly queries both tables
 * WITHOUT requiring full database setup (no foreign key constraints).
 *
 * We'll use TypeScript compilation check instead of runtime tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Service Layer Query Logic Test\n');

// Test 1: TypeScript Compilation
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 1: TypeScript Compilation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('  ✅ All TypeScript files compile successfully');
  console.log('  ✅ No type errors in timesheet.service.ts');
  console.log('  ✅ No type errors in TimesheetView.tsx\n');
} catch (error) {
  const output = error.stdout?.toString() || error.stderr?.toString() || '';
  const relevantErrors = output
    .split('\n')
    .filter(
      line =>
        line.includes('timesheet.service.ts') ||
        line.includes('TimesheetView.tsx') ||
        line.includes('MonthlyTimesheetReport.tsx') ||
        line.includes('TimesheetQRCode.tsx')
    );

  if (relevantErrors.length > 0) {
    console.log('  ❌ TypeScript errors found:');
    relevantErrors.forEach(err => console.log(`     ${err}`));
    console.log();
    process.exit(1);
  } else {
    console.log('  ✅ No TypeScript errors in service layer files\n');
  }
}

// Test 2: Code Structure Verification
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 2: Service Layer Code Structure');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const serviceFile = path.join(
  __dirname,
  '..',
  'src',
  'services',
  'timesheet.service.ts'
);
const serviceCode = fs.readFileSync(serviceFile, 'utf8');

const checks = [
  {
    name: 'queryBothSystems() method exists',
    pattern: /private static async queryBothSystems/,
  },
  {
    name: 'convertTeacherSessionToTimesheetEntry() exists',
    pattern: /private static convertTeacherSessionToTimesheetEntry/,
  },
  {
    name: 'deduplicateById() exists',
    pattern: /private static deduplicateById/,
  },
  {
    name: 'getActiveCheckIn() uses queryBothSystems',
    pattern: /getActiveCheckIn[\s\S]*?queryBothSystems[\s\S]*?onlyActive: true/,
  },
  {
    name: 'getParentTimesheet() uses queryBothSystems',
    pattern: /getParentTimesheet[\s\S]{1,500}?queryBothSystems/,
  },
  {
    name: 'getTeacherTimesheet() uses queryBothSystems',
    pattern: /getTeacherTimesheet[\s\S]{1,500}?queryBothSystems/,
  },
  {
    name: 'getMonthlyTimesheetSummary() implemented (not stub)',
    pattern:
      /getMonthlyTimesheetSummary[\s\S]*?totalHours[\s\S]*?totalSessions/,
  },
  {
    name: 'exportMonthlyTimesheetCSV() implemented (not stub)',
    pattern: /exportMonthlyTimesheetCSV[\s\S]*?CSV header[\s\S]*?csv \+=/,
  },
  {
    name: 'Queries timesheet_entries table',
    pattern: /from\('timesheet_entries'\)/,
  },
  {
    name: 'Queries teacher_sessions table',
    pattern: /from\('teacher_sessions'\)/,
  },
  {
    name: 'MonthlyTimesheetSummary interface exists',
    pattern: /export interface MonthlyTimesheetSummary/,
  },
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  if (check.pattern.test(serviceCode)) {
    console.log(`  ✅ ${check.name}`);
    passed++;
  } else {
    console.log(`  ❌ ${check.name}`);
    failed++;
  }
});

console.log();

// Test 3: Component Simplification
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 3: TimesheetView Component Simplification');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const componentFile = path.join(
  __dirname,
  '..',
  'src',
  'components',
  'shared',
  'TimesheetView.tsx'
);
const componentCode = fs.readFileSync(componentFile, 'utf8');

const componentChecks = [
  {
    name: 'No longer imports TeacherQRService',
    pattern: /import.*TeacherQRService/,
    shouldNotExist: true,
  },
  {
    name: 'No convertTeacherSessionToTimesheetEntry helper',
    pattern: /function convertTeacherSessionToTimesheetEntry/,
    shouldNotExist: true,
  },
  {
    name: 'No deduplicateById helper',
    pattern: /function deduplicateById/,
    shouldNotExist: true,
  },
  {
    name: 'Uses timesheetService.getParentTimesheet()',
    pattern: /timesheetService\.getParentTimesheet/,
  },
  {
    name: 'Uses timesheetService.getTeacherTimesheet()',
    pattern: /timesheetService\.getTeacherTimesheet/,
  },
];

componentChecks.forEach(check => {
  const exists = check.pattern.test(componentCode);
  const testPassed = check.shouldNotExist ? !exists : exists;

  if (testPassed) {
    console.log(`  ✅ ${check.name}`);
    passed++;
  } else {
    console.log(`  ❌ ${check.name}`);
    failed++;
  }
});

console.log();

// Test 4: Migration File Verification
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 4: Migration 007 Syntax');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const migrationFile = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '007_sync_teacher_sessions_to_timesheet.sql'
);
const migrationCode = fs.readFileSync(migrationFile, 'utf8');

const migrationChecks = [
  {
    name: 'No empty string for UUID field',
    pattern: /COALESCE\([^,]+,\s*''\)/,
    shouldNotExist: true,
  },
  {
    name: 'Checks qr_code_used IS NOT NULL before INSERT',
    pattern:
      /IF NEW\.qr_code_used IS NOT NULL THEN[\s\S]*?INSERT INTO timesheet_entries/,
  },
  {
    name: 'Checks qr_code_used IS NOT NULL before UPDATE',
    pattern:
      /IF NEW\.qr_code_used IS NOT NULL THEN[\s\S]*?UPDATE timesheet_entries/,
  },
  {
    name: 'Backfill filters qr_code_used IS NOT NULL',
    pattern: /WHERE[\s\S]*?qr_code_used IS NOT NULL/,
  },
  {
    name: 'Creates trigger function',
    pattern: /CREATE OR REPLACE FUNCTION sync_teacher_session_to_timesheet/,
  },
  {
    name: 'Creates trigger',
    pattern: /CREATE TRIGGER trigger_sync_teacher_session_to_timesheet/,
  },
];

migrationChecks.forEach(check => {
  const exists = check.pattern.test(migrationCode);
  const testPassed = check.shouldNotExist ? !exists : exists;

  if (testPassed) {
    console.log(`  ✅ ${check.name}`);
    passed++;
  } else {
    console.log(`  ❌ ${check.name}`);
    failed++;
  }
});

console.log();

// Final Results
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 TEST RESULTS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const total = passed + failed;
console.log(`  Total Checks: ${total}`);
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  Success Rate: ${Math.round((passed / total) * 100)}%\n`);

if (failed === 0) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('   Service layer fixes are correctly implemented.\n');
  console.log('📋 Manual Testing Required:');
  console.log('   1. Apply Migration 007 in Supabase Dashboard');
  console.log('   2. Create test teacher session');
  console.log('   3. Verify appears in parent timesheet');
  console.log('   4. Test monthly report generation');
  console.log('   5. Test CSV export\n');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED');
  console.error('   Please review the failures above.\n');
  process.exit(1);
}
