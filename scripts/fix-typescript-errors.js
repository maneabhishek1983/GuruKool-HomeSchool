#!/usr/bin/env node

/**
 * Auto-fix common TypeScript strict mode errors
 *
 * This script automatically fixes common patterns that cause errors with:
 * - exactOptionalPropertyTypes: true
 * - noUncheckedIndexedAccess: true
 * - strict: true
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for console output
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

// Pattern 1: Fix optional property assignments with undefined
function fixOptionalPropertyUndefined(content) {
  let fixed = content;
  let count = 0;

  // Pattern: error: success ? undefined : 'message'
  const pattern1 = /error:\s*(\w+)\s*\?\s*undefined\s*:\s*(['"][^'"]+['"])/g;
  fixed = fixed.replace(pattern1, (match, condition, errorMsg) => {
    count++;
    return `...(${condition} ? {} : { error: ${errorMsg} })`;
  });

  // Pattern: property: value ? undefined : actual
  const pattern2 = /(\w+):\s*(\w+)\s*\?\s*undefined\s*:\s*([^,}\n]+)/g;
  fixed = fixed.replace(pattern2, (match, prop, condition, value) => {
    count++;
    return `...(${condition} ? {} : { ${prop}: ${value} })`;
  });

  return { content: fixed, count };
}

// Pattern 2: Fix priority mapping (critical -> high)
function fixPriorityMapping(content) {
  let fixed = content;
  let count = 0;

  // Pattern: message.priority where storage expects 'high' | 'medium' | 'low'
  const pattern =
    /offlineStorageManager\.store\([^,]+,\s*{[^}]+},\s*(\w+\.priority)\)/g;
  fixed = fixed.replace(pattern, (match, priorityVar) => {
    count++;
    return match.replace(
      priorityVar,
      `${priorityVar} === 'critical' ? 'high' : ${priorityVar}`
    );
  });

  return { content: fixed, count };
}

// Pattern 3: Fix Event to Error conversion
function fixEventToError(content) {
  let fixed = content;
  let count = 0;

  // Pattern: logger.error with Event parameter
  const pattern = /logger\.error\(([^,]+),\s*([^,]+),\s*(error)\)/g;
  fixed = fixed.replace(pattern, (match, category, message, errorVar) => {
    // Check if it's in an onerror handler context
    if (content.includes(`${errorVar}) => {`) && content.includes('.onerror')) {
      count++;
      return match.replace(
        errorVar,
        `${errorVar} instanceof Error ? ${errorVar} : new Error(String(${errorVar}))`
      );
    }
    return match;
  });

  return { content: fixed, count };
}

// Pattern 4: Fix possibly undefined array access
function fixUndefinedArrayAccess(content) {
  let fixed = content;
  let count = 0;

  // Pattern: array[key].property where array[key] might be undefined
  const pattern = /(\w+)\[(['"]?\w+['"]?)\]\.(\w+)/g;
  fixed = fixed.replace(pattern, (match, array, key, prop) => {
    // Only fix if it looks like a potentially undefined access
    if (
      content.includes(`${array}: Record<string,`) ||
      content.includes(`${array}: { [key:`)
    ) {
      count++;
      return `${array}[${key}]?.${prop}`;
    }
    return match;
  });

  return { content: fixed, count };
}

// Pattern 5: Fix possibly undefined object access
function fixPossiblyUndefined(content) {
  let fixed = content;
  const count = 0;

  // Add non-null assertion where needed (use sparingly)
  // This is a last resort - better to fix the root cause
  const pattern = /\.find\([^)]+\)\.(\w+)/g;
  fixed = fixed.replace(pattern, (match, prop) => {
    // Only suggest fix, don't auto-apply
    return match;
  });

  return { content: fixed, count };
}

// Pattern 6: Fix implicit any types
function fixImplicitAny(content) {
  const fixed = content;
  const count = 0;

  // Pattern: function parameters without types in arrow functions
  const pattern = /\((\w+)\)\s*=>/g;
  const matches = content.matchAll(pattern);

  for (const match of matches) {
    const param = match[1];
    // Check if it's in a common context like .map, .filter, etc.
    const beforeContext = content.substring(
      Math.max(0, match.index - 50),
      match.index
    );
    if (beforeContext.includes('.map') || beforeContext.includes('.filter')) {
      // Don't auto-fix these - need context
      continue;
    }
  }

  return { content: fixed, count };
}

// Main fix function
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let fixed = content;
  let totalFixes = 0;

  // Apply all fix patterns
  const fixes = [
    { name: 'Optional property undefined', fn: fixOptionalPropertyUndefined },
    { name: 'Priority mapping', fn: fixPriorityMapping },
    { name: 'Event to Error', fn: fixEventToError },
    { name: 'Undefined array access', fn: fixUndefinedArrayAccess },
  ];

  fixes.forEach(({ name, fn }) => {
    const result = fn(fixed);
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

// Find all TypeScript files with errors
function getFilesWithErrors() {
  try {
    const output = execSync('npm run type-check 2>&1', { encoding: 'utf8' });
    const errorLines = output
      .split('\n')
      .filter(line => line.includes('error TS'));

    const files = new Set();
    errorLines.forEach(line => {
      const match = line.match(/^([^(]+)\(/);
      if (match) {
        const filePath = match[1].trim();
        // Skip test files
        if (!filePath.includes('__tests__') && !filePath.includes('.test.')) {
          files.add(filePath);
        }
      }
    });

    return Array.from(files);
  } catch (error) {
    // npm run type-check exits with 1 on errors, which is expected
    const output = error.stdout || '';
    const errorLines = output
      .split('\n')
      .filter(line => line.includes('error TS'));

    const files = new Set();
    errorLines.forEach(line => {
      const match = line.match(/^([^(]+)\(/);
      if (match) {
        const filePath = match[1].trim();
        // Skip test files
        if (!filePath.includes('__tests__') && !filePath.includes('.test.')) {
          files.add(filePath);
        }
      }
    });

    return Array.from(files);
  }
}

// Main execution
function main() {
  log('\n🔧 TypeScript Auto-Fix Tool\n', 'cyan');
  log('Finding files with TypeScript errors...', 'blue');

  const files = getFilesWithErrors();

  if (files.length === 0) {
    log('✓ No TypeScript errors found in production code!', 'green');
    return;
  }

  log(`\nFound ${files.length} files with errors:\n`, 'yellow');

  let totalFixes = 0;
  files.forEach(file => {
    log(`Fixing: ${file}`, 'blue');
    const fixes = fixFile(file);
    totalFixes += fixes;
    if (fixes === 0) {
      log('  ℹ No automatic fixes available', 'yellow');
    }
  });

  log(`\n✓ Applied ${totalFixes} automatic fixes`, 'green');
  log('\nRun "npm run type-check" to verify remaining errors.\n', 'cyan');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fixOptionalPropertyUndefined,
  fixPriorityMapping,
  fixEventToError,
  fixUndefinedArrayAccess,
  fixFile,
};
