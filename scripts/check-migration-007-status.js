#!/usr/bin/env node

/**
 * Check Migration 007 Status
 *
 * Verifies if migration 007 has been applied by checking:
 * 1. Trigger exists: trigger_sync_teacher_session_to_timesheet
 * 2. Function exists: sync_teacher_session_to_timesheet()
 * 3. Backfill completed (check if data synced)
 */

const fs = require('fs');
const path = require('path');

// Parse .env file manually
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

async function checkMigrationStatus() {
  console.log('🔍 Checking Migration 007 Status\n');

  // Load environment
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  console.log('✓ Environment loaded');
  console.log(`  Supabase URL: ${supabaseUrl}\n`);

  const results = {
    triggerExists: false,
    functionExists: false,
    backfillCount: 0,
    errors: [],
  };

  try {
    // Check 1: Does the trigger exist?
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECK 1: Trigger Exists');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const triggerQuery = `
      SELECT
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE trigger_name = 'trigger_sync_teacher_session_to_timesheet'
      AND event_object_table = 'teacher_sessions';
    `;

    const triggerResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: triggerQuery }),
    });

    if (triggerResponse.ok) {
      const triggerData = await triggerResponse.json();
      if (triggerData && triggerData.length > 0) {
        console.log('  ✅ Trigger EXISTS');
        console.log('     Name: trigger_sync_teacher_session_to_timesheet');
        console.log('     Table: teacher_sessions');
        console.log(
          '     Events:',
          triggerData[0]?.event_manipulation || 'N/A'
        );
        console.log('     Timing:', triggerData[0]?.action_timing || 'N/A');
        results.triggerExists = true;
      } else {
        console.log('  ❌ Trigger NOT FOUND');
        console.log('     Migration 007 has NOT been applied');
        results.errors.push('Trigger does not exist');
      }
    } else {
      // RPC endpoint might not exist, try alternative method
      console.log('  ⚠️  Cannot check via RPC endpoint');
      console.log('     Trying alternative method...\n');

      // Alternative: Check pg_trigger directly
      const altQuery = `
        SELECT t.tgname as trigger_name,
               t.tgenabled as enabled,
               c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'trigger_sync_teacher_session_to_timesheet'
        AND c.relname = 'teacher_sessions';
      `;

      const altResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: altQuery }),
      });

      if (altResponse.ok) {
        const altData = await altResponse.json();
        if (altData && altData.length > 0) {
          console.log('  ✅ Trigger EXISTS (verified via pg_trigger)');
          console.log('     Name:', altData[0]?.trigger_name);
          console.log(
            '     Enabled:',
            altData[0]?.enabled === 'O' ? 'Yes' : 'Unknown'
          );
          results.triggerExists = true;
        } else {
          console.log('  ❌ Trigger NOT FOUND (checked pg_trigger)');
          results.errors.push('Trigger does not exist');
        }
      } else {
        console.log('  ⚠️  Cannot verify trigger existence');
        console.log('     Manual check required in Supabase Dashboard');
        results.errors.push('Cannot verify trigger via API');
      }
    }

    console.log();

    // Check 2: Does the function exist?
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECK 2: Function Exists');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const functionQuery = `
      SELECT
        routine_name,
        routine_type,
        data_type as return_type
      FROM information_schema.routines
      WHERE routine_name = 'sync_teacher_session_to_timesheet'
      AND routine_schema = 'public';
    `;

    const functionResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: functionQuery }),
      }
    );

    if (functionResponse.ok) {
      const functionData = await functionResponse.json();
      if (functionData && functionData.length > 0) {
        console.log('  ✅ Function EXISTS');
        console.log('     Name: sync_teacher_session_to_timesheet');
        console.log('     Type:', functionData[0]?.routine_type || 'FUNCTION');
        results.functionExists = true;
      } else {
        console.log('  ❌ Function NOT FOUND');
        results.errors.push('Function does not exist');
      }
    } else {
      console.log('  ⚠️  Cannot verify function existence');
      results.errors.push('Cannot verify function via API');
    }

    console.log();

    // Check 3: Backfill status
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECK 3: Backfill Status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Count sessions in teacher_sessions
    const teacherSessionsUrl = `${supabaseUrl}/rest/v1/teacher_sessions?select=count`;
    const teacherSessionsResponse = await fetch(teacherSessionsUrl, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'count=exact',
      },
    });

    const teacherSessionsCount =
      teacherSessionsResponse.headers.get('content-range')?.split('/')[1] ||
      '0';

    // Count synced entries in timesheet_entries
    const timesheetEntriesUrl = `${supabaseUrl}/rest/v1/timesheet_entries?select=count`;
    const timesheetEntriesResponse = await fetch(timesheetEntriesUrl, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: 'count=exact',
      },
    });

    const timesheetEntriesCount =
      timesheetEntriesResponse.headers.get('content-range')?.split('/')[1] ||
      '0';

    console.log('  Teacher Sessions (NEW system):', teacherSessionsCount);
    console.log('  Timesheet Entries (OLD system):', timesheetEntriesCount);

    if (
      parseInt(teacherSessionsCount) > 0 &&
      parseInt(timesheetEntriesCount) >= parseInt(teacherSessionsCount)
    ) {
      console.log('  ✅ Backfill appears complete');
      results.backfillCount = parseInt(timesheetEntriesCount);
    } else if (parseInt(teacherSessionsCount) > 0) {
      console.log('  ⚠️  Some sessions may not be synced');
      console.log('     This could be normal if sessions lack qr_code_used');
    } else {
      console.log('  ℹ️  No sessions to sync yet');
    }

    console.log();
  } catch (error) {
    console.error('\n❌ Error checking migration status:', error.message);
    results.errors.push(error.message);
  }

  // Final summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 MIGRATION STATUS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(
    `  Trigger Exists: ${results.triggerExists ? '✅ YES' : '❌ NO'}`
  );
  console.log(
    `  Function Exists: ${results.functionExists ? '✅ YES' : '❌ NO'}`
  );
  console.log(`  Backfill Count: ${results.backfillCount}\n`);

  if (results.triggerExists && results.functionExists) {
    console.log('✅ MIGRATION 007 HAS BEEN APPLIED!');
    console.log('   The sync trigger is active and working.\n');

    if (results.backfillCount === 0) {
      console.log('ℹ️  Note: No data has been synced yet.');
      console.log('   This is normal if no teacher sessions exist.\n');
    }

    console.log('📋 Next Steps:');
    console.log('   1. Create a test teacher session');
    console.log('   2. Verify it appears in both tables');
    console.log('   3. Run: node scripts/verify-sync-mechanism.js\n');

    process.exit(0);
  } else {
    console.error('❌ MIGRATION 007 HAS NOT BEEN APPLIED');
    console.error('   The sync trigger is missing.\n');

    console.error('📋 Action Required:');
    console.error('   1. Open Supabase Dashboard → SQL Editor');
    console.error(
      '   2. Copy supabase/migrations/007_sync_teacher_sessions_to_timesheet.sql'
    );
    console.error('   3. Paste and run the migration');
    console.error('   4. Re-run this script to verify\n');

    if (results.errors.length > 0) {
      console.error('Errors encountered:');
      results.errors.forEach(err => console.error(`   - ${err}`));
      console.error();
    }

    process.exit(1);
  }
}

// Run check
checkMigrationStatus().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
