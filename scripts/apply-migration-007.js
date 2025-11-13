#!/usr/bin/env node

/**
 * Apply Migration 007: Sync teacher_sessions → timesheet_entries
 *
 * This script applies the database trigger to automatically sync
 * teacher_sessions (NEW system) to timesheet_entries (OLD system).
 *
 * Usage:
 *   node scripts/apply-migration-007.js
 *
 * Prerequisites:
 *   - .env file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - Supabase project with both tables created
 */

const fs = require('fs');
const path = require('path');

// Parse .env file manually (no dotenv dependency)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at:', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '');
      }
    }
  });

  return env;
}

async function applyMigration() {
  console.log('📦 Loading environment variables...');
  const env = loadEnv();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error(
      '   - SUPABASE_SERVICE_ROLE_KEY:',
      serviceRoleKey ? '✓' : '✗'
    );
    process.exit(1);
  }

  console.log('✓ Environment variables loaded\n');

  // Read migration SQL
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '007_sync_teacher_sessions_to_timesheet.sql'
  );
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found at:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Migration SQL loaded from:', migrationPath);
  console.log('   Size:', migrationSQL.length, 'bytes\n');

  // Execute migration via Supabase REST API
  console.log('🚀 Applying migration to Supabase...\n');

  const restUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  try {
    const response = await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: migrationSQL }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        '❌ Migration failed:',
        response.status,
        response.statusText
      );
      console.error('   Response:', errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('   Result:', JSON.stringify(result, null, 2), '\n');

    // Verify trigger exists
    console.log('🔍 Verifying trigger installation...');
    const verifyUrl = `${supabaseUrl}/rest/v1/rpc/get_triggers`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ table_name: 'teacher_sessions' }),
    });

    if (verifyResponse.ok) {
      const triggers = await verifyResponse.json();
      const syncTrigger = triggers.find(
        t => t.trigger_name === 'trigger_sync_teacher_session_to_timesheet'
      );

      if (syncTrigger) {
        console.log(
          '✅ Trigger verified: trigger_sync_teacher_session_to_timesheet'
        );
        console.log('   Status: ACTIVE');
      } else {
        console.warn(
          '⚠️  Trigger not found in verification query (may need manual check)'
        );
      }
    } else {
      console.warn(
        '⚠️  Could not verify trigger (REST API endpoint may not exist)'
      );
      console.log(
        '   Please verify manually in Supabase Dashboard → Database → Triggers'
      );
    }

    console.log('\n📋 Next Steps:');
    console.log(
      '   1. Verify trigger in Supabase Dashboard → Database → Triggers'
    );
    console.log('   2. Test by creating a new teacher session');
    console.log(
      '   3. Check that it appears in both teacher_sessions AND timesheet_entries'
    );
    console.log('   4. Run: node scripts/verify-sync-mechanism.js\n');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    process.exit(1);
  }
}

// Run migration
applyMigration().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
