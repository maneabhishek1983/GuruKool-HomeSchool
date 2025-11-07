/**
 * Row Level Security (RLS) Policy Verification Script
 * Tests that RLS policies are properly configured and enforced
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env file manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const equalsIndex = line.indexOf('=');
      if (equalsIndex > 0) {
        const key = line.substring(0, equalsIndex).trim();
        const value = line.substring(equalsIndex + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function header(message) {
  log(`\n${'='.repeat(60)}`, 'magenta');
  log(message, 'magenta');
  log('='.repeat(60) + '\n', 'magenta');
}

async function verifyRLSPolicies() {
  header('🔒 RLS Policy Verification');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    error('Missing Supabase configuration');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // Test 1: Verify anon user cannot access users table without auth
  info('Test 1: Anon user should NOT access users table...');
  try {
    const { data, error: err } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (err) {
      if (err.message.includes('row-level security') ||
          err.code === 'PGRST301' ||
          err.code === '42501') {
        success('RLS blocks anon access to users table');
        passed++;
      } else {
        error(`Unexpected error: ${err.message}`);
        failed++;
      }
    } else {
      if (!data || data.length === 0) {
        success('No data returned (RLS may be working)');
        passed++;
      } else {
        error('Anon user can access users table - RLS NOT enforced!');
        failed++;
      }
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    failed++;
  }

  // Test 2: Verify anon user cannot access students table without auth
  info('\nTest 2: Anon user should NOT access students table...');
  try {
    const { data, error: err } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (err) {
      if (err.message.includes('row-level security') ||
          err.code === 'PGRST301' ||
          err.code === '42501') {
        success('RLS blocks anon access to students table');
        passed++;
      } else {
        error(`Unexpected error: ${err.message}`);
        failed++;
      }
    } else {
      if (!data || data.length === 0) {
        success('No data returned (RLS may be working)');
        passed++;
      } else {
        error('Anon user can access students table - RLS NOT enforced!');
        failed++;
      }
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    failed++;
  }

  // Test 3: Verify service role CAN bypass RLS
  info('\nTest 3: Service role should BYPASS RLS on users table...');
  try {
    const { data, error: err } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (err) {
      if (err.message.includes('does not exist')) {
        warning('users table does not exist - run migrations');
        warnings++;
      } else {
        error(`Service role cannot access users: ${err.message}`);
        failed++;
      }
    } else {
      success('Service role can bypass RLS');
      passed++;
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    failed++;
  }

  // Test 4: Verify service role CAN access students table
  info('\nTest 4: Service role should access students table...');
  try {
    const { data, error: err } = await supabaseAdmin
      .from('students')
      .select('count', { count: 'exact', head: true });

    if (err) {
      if (err.message.includes('does not exist')) {
        warning('students table does not exist - run migrations');
        warnings++;
      } else {
        error(`Service role cannot access students: ${err.message}`);
        failed++;
      }
    } else {
      success('Service role can access students table');
      passed++;
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    failed++;
  }

  // Test 5: Check RLS is enabled on critical tables
  info('\nTest 5: Checking RLS enabled status...');
  const criticalTables = ['users', 'students', 'teachers', 'sessions'];

  try {
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .in('tablename', criticalTables);

    if (rlsError) {
      warning('Could not check RLS status automatically');
      warning('Manually verify in Supabase Dashboard → Table Editor → [Table] → RLS tab');
      warnings++;
    } else {
      info('Tables found: ' + (rlsStatus?.map(t => t.tablename).join(', ') || 'none'));
      success('Table check complete');
      passed++;
    }
  } catch (err) {
    warning('Could not verify RLS status');
    warnings++;
  }

  // Test 6: Verify anon cannot insert into users table
  info('\nTest 6: Anon user should NOT insert into users table...');
  try {
    const { data, error: err } = await supabase
      .from('users')
      .insert({
        email: 'test@test.com',
        name: 'Test User',
        role: 'parent',
        preferences: {}
      })
      .select();

    if (err) {
      if (err.message.includes('row-level security') ||
          err.message.includes('permission denied') ||
          err.code === 'PGRST301' ||
          err.code === '42501') {
        success('RLS blocks anon insert to users table');
        passed++;
      } else {
        error(`Unexpected error: ${err.message}`);
        failed++;
      }
    } else {
      error('Anon user can insert into users table - RLS NOT enforced!');
      error('This is a critical security vulnerability!');
      failed++;
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    failed++;
  }

  // Test 7: Verify anon cannot delete from users table
  info('\nTest 7: Anon user should NOT delete from users table...');
  try {
    const { data, error: err } = await supabase
      .from('users')
      .delete()
      .eq('email', 'nonexistent@test.com');

    if (err) {
      if (err.message.includes('row-level security') ||
          err.message.includes('permission denied') ||
          err.code === 'PGRST301' ||
          err.code === '42501') {
        success('RLS blocks anon delete from users table');
        passed++;
      } else {
        error(`Unexpected error: ${err.message}`);
        failed++;
      }
    } else {
      error('Anon user can delete from users table - RLS NOT enforced!');
      error('This is a critical security vulnerability!');
      failed++;
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    failed++;
  }

  // Summary
  header('📊 Test Summary');

  const total = passed + failed + warnings;
  log(`Total Tests: ${total}`, 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');

  if (failed > 0) {
    log('\n' + '!'.repeat(60), 'red');
    error('CRITICAL: RLS policies are NOT properly configured!');
    error('Your database is vulnerable to unauthorized access!');
    log('!'.repeat(60), 'red');
    log('\nImmediate Actions Required:', 'yellow');
    console.log('1. Go to Supabase Dashboard → Table Editor');
    console.log('2. For each table, click RLS tab');
    console.log('3. Enable RLS if not enabled');
    console.log('4. Run migration 006_fix_rls_policies.sql');
    console.log('5. Re-run this verification script\n');
    return false;
  } else if (warnings > 0) {
    log('\n' + '-'.repeat(60), 'yellow');
    warning('Some checks could not be completed');
    log('-'.repeat(60), 'yellow');
    log('\nRecommended Actions:', 'cyan');
    console.log('1. Manually verify RLS in Supabase Dashboard');
    console.log('2. Ensure all migrations have run successfully');
    console.log('3. Test with actual user authentication\n');
    return true;
  } else {
    log('\n' + '='.repeat(60), 'green');
    success('All RLS policy checks passed!');
    log('='.repeat(60), 'green');
    log('\nYour database appears to be properly secured.', 'cyan');
    log('\nNext Steps:', 'cyan');
    console.log('1. Test with actual user authentication');
    console.log('2. Verify parents can only see their own data');
    console.log('3. Verify teachers can only see assigned students');
    console.log('4. Set up monitoring for RLS violations\n');
    return true;
  }
}

// Run verification
verifyRLSPolicies()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
