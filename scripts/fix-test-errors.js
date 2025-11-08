#!/usr/bin/env node

/**
 * Auto-fix common TypeScript errors in test files
 *
 * Fixes:
 * - Possibly undefined assertions
 * - Missing mock properties
 * - Implicit any types
 */

const fs = require('fs');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Fix possibly undefined assertions in tests
 * Pattern: expect(result.property).toBe(...)
 * Fix: Add non-null assertion or optional chaining
 */
function fixUndefinedAssertions(content, filePath) {
  let fixed = content;
  let count = 0;

  // Pattern 1: expect(variable.property) where variable might be undefined
  // Look for lines with errors
  const lines = content.split('\n');
  const fixedLines = lines.map((line, index) => {
    // Check if this is a test assertion that might be undefined
    if (line.includes('expect(') && (line.includes('.') || line.includes('['))) {
      // Pattern: expect(result.insights[0].title)
      const expectMatch = line.match(/expect\(([^)]+)\)/);
      if (expectMatch) {
        const expression = expectMatch[1];

        // If it has array access or property access without optional chaining
        if ((expression.includes('[') || expression.includes('.')) &&
            !expression.includes('?.') &&
            !expression.includes('!')) {

          // Check if this is likely to be undefined based on common patterns
          if (expression.match(/\w+\[0\]/) ||
              expression.match(/\w+\.\w+\[0\]/) ||
              expression.match(/\.find\(/)) {

            // Add non-null assertion for test assertions
            const fixed = line.replace(
              new RegExp(`expect\\(${expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`),
              `expect(${expression}!)`
            );

            if (fixed !== line) {
              count++;
              return fixed;
            }
          }
        }
      }
    }
    return line;
  });

  return { content: fixedLines.join('\n'), count };
}

/**
 * Fix missing mock context properties
 * Pattern: Property 'xxx' does not exist on type 'AgentContext'
 */
function fixMockContextProperties(content) {
  let fixed = content;
  let count = 0;

  // If test uses properties not in AgentContext, add proper typing
  // Pattern: shouldFail, skipExecution, etc.
  if (content.includes('shouldFail') || content.includes('skipExecution')) {
    // Add type extension or use proper context
    const hasTypeExtension = content.includes('interface ExtendedAgentContext');

    if (!hasTypeExtension) {
      // Add at top of describe block
      const describeMatch = content.match(/describe\([^{]+{/);
      if (describeMatch) {
        const insertPos = content.indexOf(describeMatch[0]) + describeMatch[0].length;
        const typeExtension = `
  // Extended context for testing
  interface ExtendedAgentContext extends AgentContext {
    shouldFail?: boolean;
    skipExecution?: boolean;
  }
`;
        fixed = content.slice(0, insertPos) + typeExtension + content.slice(insertPos);
        count++;
      }
    }
  }

  return { content: fixed, count };
}

/**
 * Fix implicit any types
 * Pattern: Parameter 'x' implicitly has an 'any' type
 */
function fixImplicitAny(content) {
  let fixed = content;
  let count = 0;

  // Pattern: arrow functions without type annotations
  // Common in .map, .filter, .reduce
  const patterns = [
    // .map(x => ...) -> .map((x: any) => ...)
    {
      regex: /\.map\(\((\w+)\) =>/g,
      replacement: '.map(($1: any) =>'
    },
    // .filter(x => ...) -> .filter((x: any) => ...)
    {
      regex: /\.filter\(\((\w+)\) =>/g,
      replacement: '.filter(($1: any) =>'
    },
    // .reduce((sum, x) => ...) -> .reduce((sum: any, x: any) => ...)
    {
      regex: /\.reduce\(\((\w+),\s*(\w+)\) =>/g,
      replacement: '.reduce(($1: any, $2: any) =>'
    },
  ];

  patterns.forEach(({ regex, replacement }) => {
    const matches = (fixed.match(regex) || []).length;
    if (matches > 0) {
      fixed = fixed.replace(regex, replacement);
      count += matches;
    }
  });

  return { content: fixed, count };
}

/**
 * Fix constructor access errors
 * Pattern: Constructor of class 'X' is private
 */
function fixPrivateConstructor(content) {
  let fixed = content;
  let count = 0;

  // Pattern: new PrivateClass() in tests
  // Fix: Use getInstance() or proper factory method
  if (content.includes('Constructor of class') ||
      content.includes('new AgentRegistry') ||
      content.includes('new SecurityService') ||
      content.includes('new LoggingService')) {

    // Replace new calls with getInstance
    const patterns = [
      { old: /new AgentRegistry\(\)/g, new: 'AgentRegistry.getInstance()' },
      { old: /new SecurityService\(\)/g, new: 'SecurityService.getInstance()' },
      { old: /new LoggingService\(\)/g, new: 'LoggingService.getInstance()' },
    ];

    patterns.forEach(({ old, new: replacement }) => {
      if (fixed.match(old)) {
        fixed = fixed.replace(old, replacement);
        count++;
      }
    });
  }

  return { content: fixed, count };
}

/**
 * Fix main function
 */
function fixTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let fixed = content;
  let totalFixes = 0;

  const fixes = [
    { name: 'Undefined assertions', fn: fixUndefinedAssertions },
    { name: 'Mock context properties', fn: fixMockContextProperties },
    { name: 'Implicit any types', fn: fixImplicitAny },
    { name: 'Private constructors', fn: fixPrivateConstructor },
  ];

  fixes.forEach(({ name, fn }) => {
    const result = fn(fixed, filePath);
    if (result.count > 0) {
      log(`  ✓ ${name}: ${result.count} fixes`, 'green');
      totalFixes += result.count;
    }
    fixed = result.content;
  });

  if (totalFixes > 0) {
    fs.writeFileSync(filePath, fixed, 'utf8');
  }

  return totalFixes;
}

/**
 * Get test files with errors
 */
function getTestFilesWithErrors() {
  try {
    execSync('npm run type-check 2>&1', { encoding: 'utf8' });
    return [];
  } catch (error) {
    const output = error.stdout || '';
    const errorLines = output.split('\n').filter(line =>
      line.includes('error TS') &&
      (line.includes('.test.ts') || line.includes('__tests__'))
    );

    const files = new Set();
    errorLines.forEach(line => {
      const match = line.match(/^([^(]+)\(/);
      if (match) {
        files.add(match[1].trim());
      }
    });

    return Array.from(files);
  }
}

/**
 * Main execution
 */
function main() {
  log('\n🧪 Test File Auto-Fix Tool\n', 'cyan');
  log('Finding test files with TypeScript errors...', 'blue');

  const files = getTestFilesWithErrors();

  if (files.length === 0) {
    log('✓ No TypeScript errors found in test files!', 'green');
    return;
  }

  log(`\nFound ${files.length} test files with errors:\n`, 'yellow');

  let totalFixes = 0;
  files.forEach(file => {
    log(`Fixing: ${file}`, 'blue');
    const fixes = fixTestFile(file);
    totalFixes += fixes;
    if (fixes === 0) {
      log('  ℹ No automatic fixes available', 'yellow');
    }
  });

  log(`\n✓ Applied ${totalFixes} automatic fixes to test files`, 'green');
  log('\nRun "npm run type-check" to verify remaining errors.\n', 'cyan');
}

if (require.main === module) {
  main();
}

module.exports = {
  fixUndefinedAssertions,
  fixMockContextProperties,
  fixImplicitAny,
  fixPrivateConstructor,
  fixTestFile,
};
