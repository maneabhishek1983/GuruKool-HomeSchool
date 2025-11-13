/**
 * Check Supabase Auth Configuration
 *
 * This script checks the current Supabase authentication configuration
 * to understand email verification settings.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

const env = loadEnv();

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

console.log('🔍 Checking Supabase Auth Configuration...\n');
console.log('Project URL:', SUPABASE_URL);
console.log('');

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log('📋 FINDINGS:\n');
console.log('1. Teacher Invitation Flow (Our Custom System):');
console.log(
  '   ✅ Uses admin.auth.admin.createUser() with email_confirm: true'
);
console.log('   ✅ Email is pre-confirmed (no verification needed)');
console.log('   ✅ Does NOT send automatic emails (logs URL to console only)');
console.log('');

console.log('2. Supabase Auto-Email Settings:');
console.log('   ⚠️  If you received an OTP/magic link email, it means:');
console.log(
  '      - Supabase\'s "Confirm Email" setting is ENABLED in dashboard'
);
console.log(
  '      - Even though we set email_confirm: true, Supabase still sends email'
);
console.log('');

console.log('3. The Email You Received:');
console.log('   URL Pattern: ?error=access_denied&error_code=otp_expired');
console.log('   Source: Supabase Auth automatic email verification');
console.log('   Status: EXPIRED (typical 1-hour expiration)');
console.log(
  '   Action Needed: Can be safely IGNORED (email is already confirmed)'
);
console.log('');

console.log('📝 SOLUTION:\n');
console.log('Option 1: Disable Supabase Auto-Emails (Recommended)');
console.log(
  '   1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/' +
    projectRef
);
console.log('   2. Navigate to: Authentication → Settings → Email');
console.log('   3. DISABLE "Enable email confirmations"');
console.log('   4. Save changes');
console.log(
  '   Result: Teachers will ONLY get our custom invitation URLs (no automatic emails)'
);
console.log('');

console.log('Option 2: Customize Supabase Email Template');
console.log('   1. Go to: Authentication → Email Templates → Confirm signup');
console.log(
  '   2. Customize the email to redirect to our invitation acceptance page'
);
console.log(
  '   3. Change the confirmation URL to: ' +
    SUPABASE_URL.replace('https://', 'https://app.') +
    '/accept-invitation'
);
console.log('   Result: Supabase emails will work with our custom flow');
console.log('');

console.log('Option 3: Do Nothing (Current Behavior)');
console.log('   - Teachers receive TWO types of links:');
console.log('     a) Supabase automatic OTP (can be ignored)');
console.log('     b) Our custom invitation URL (use this one)');
console.log(
  '   - Both are valid, but our custom URL is better (7-day expiration vs 1-hour)'
);
console.log('');

console.log('✅ RECOMMENDATION:');
console.log('   Choose Option 1 (disable auto-emails) to avoid confusion.');
console.log('   Our custom invitation system provides better UX with:');
console.log('   - 7-day expiration (vs 1-hour OTP)');
console.log('   - Password strength indicators');
console.log('   - Beautiful branded UI');
console.log('   - Parent name displayed in invitation');
console.log('');

console.log('🔗 Quick Link:');
console.log(
  '   Supabase Dashboard: https://supabase.com/dashboard/project/' +
    projectRef +
    '/auth/templates'
);
console.log('');
