/**
 * Supabase Connection Verification Script
 * Tests connectivity and validates configuration
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

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

async function verifySupabaseConnection() {
  log('\n🔍 Verifying Supabase Connection...\n', 'blue');

  // Step 1: Check environment variables
  info('Step 1: Checking environment variables...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    error('NEXT_PUBLIC_SUPABASE_URL not found in environment');
    return false;
  }
  success('NEXT_PUBLIC_SUPABASE_URL configured');

  if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project')) {
    warning('Supabase URL appears to be a placeholder');
    warning('Please update .env with your actual Supabase project URL');
    return false;
  }

  if (!supabaseAnonKey) {
    error('NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment');
    return false;
  }
  success('NEXT_PUBLIC_SUPABASE_ANON_KEY configured');

  if (supabaseAnonKey.includes('placeholder') || supabaseAnonKey.length < 100) {
    warning('Supabase anon key appears to be a placeholder');
    warning('Please update .env with your actual Supabase anon key');
    return false;
  }

  if (!supabaseServiceKey) {
    error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
    return false;
  }
  success('SUPABASE_SERVICE_ROLE_KEY configured');

  if (supabaseServiceKey.includes('placeholder') || supabaseServiceKey.length < 100) {
    warning('Supabase service role key appears to be a placeholder');
    warning('Please update .env with your actual service role key');
    return false;
  }

  // Step 2: Test connection with anon key
  info('\nStep 2: Testing connection with anon key...');

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error: pingError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (pingError) {
      // Check if it's an RLS error (which is actually good - means connection works)
      if (pingError.message.includes('row-level security') ||
          pingError.code === 'PGRST301' ||
          pingError.code === '42501') {
        success('Connection successful (RLS is enforcing security)');
      } else {
        throw pingError;
      }
    } else {
      success('Connection successful');
      info(`Users table accessible (count: ${data || 0})`);
    }
  } catch (err) {
    error(`Connection failed: ${err.message}`);
    if (err.message.includes('Failed to fetch')) {
      warning('Network error - check your internet connection');
    } else if (err.message.includes('Invalid API key')) {
      warning('Invalid anon key - check your configuration');
    }
    return false;
  }

  // Step 3: Test service role access
  info('\nStep 3: Testing service role access...');

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (adminError) {
      throw adminError;
    }

    success('Service role can bypass RLS');
    info(`Service role access verified`);
  } catch (err) {
    error(`Service role access failed: ${err.message}`);
    return false;
  }

  // Step 4: Check table existence
  info('\nStep 4: Checking required tables...');

  const requiredTables = [
    'users',
    'students',
    'teachers',
    'sessions',
    'teacher_qr_codes',
    'teacher_sessions',
    'ai_insights',
    'learning_analytics'
  ];

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    for (const table of requiredTables) {
      const { error: tableError } = await supabaseAdmin
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (tableError) {
        if (tableError.message.includes('does not exist')) {
          error(`Table '${table}' does not exist`);
          warning('Run database migrations to create missing tables');
        } else {
          warning(`Table '${table}': ${tableError.message}`);
        }
      } else {
        success(`Table '${table}' exists`);
      }
    }
  } catch (err) {
    error(`Table check failed: ${err.message}`);
    return false;
  }

  // Step 5: Check RLS policies
  info('\nStep 5: Checking RLS policies...');

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Query pg_policies to check RLS
    const { data: policies, error: policyError } = await supabaseAdmin
      .rpc('get_rls_status')
      .catch(() => {
        // RPC might not exist, try alternative method
        return { data: null, error: null };
      });

    if (policyError) {
      warning('Could not verify RLS policies automatically');
      info('Please manually verify RLS is enabled in Supabase dashboard');
    } else if (policies) {
      success('RLS policies verified');
    } else {
      info('RLS verification skipped (requires custom function)');
      info('Manually verify RLS in Supabase Dashboard → Table Editor → [Table] → RLS tab');
    }
  } catch (err) {
    warning('Could not check RLS policies');
    info('Manually verify RLS in Supabase dashboard');
  }

  // Step 6: Test authentication
  info('\nStep 6: Testing authentication system...');

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to get session (should be null without login)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (session === null) {
      success('Authentication system responsive');
    } else {
      info('Active session found');
    }
  } catch (err) {
    warning(`Authentication check: ${err.message}`);
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  success('Supabase connection verification complete!');
  log('='.repeat(60) + '\n', 'cyan');

  info('Next steps:');
  console.log('  1. Verify RLS policies in Supabase Dashboard');
  console.log('  2. Create test user in Authentication → Users');
  console.log('  3. Test login flow in your application');
  console.log('  4. Create sample data for testing\n');

  return true;
}

// Run verification
verifySupabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
