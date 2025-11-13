#!/usr/bin/env node

/**
 * Verify Sync Mechanism: Test teacher_sessions → timesheet_entries synchronization
 *
 * This script verifies that the database trigger correctly syncs
 * teacher_sessions to timesheet_entries.
 *
 * Tests:
 *   1. Create test session in teacher_sessions
 *   2. Verify it appears in timesheet_entries
 *   3. Update session (add check-out time)
 *   4. Verify update syncs to timesheet_entries
 *   5. Check data consistency
 *   6. Cleanup test data
 *
 * Usage:
 *   node scripts/verify-sync-mechanism.js
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

// Helper to query Supabase REST API
async function supabaseQuery(
  url,
  serviceRoleKey,
  table,
  method = 'GET',
  body = null,
  select = '*'
) {
  const restUrl = `${url}/rest/v1/${table}?select=${select}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=representation',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(restUrl, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Query failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return response.json();
}

// Helper to insert record
async function supabaseInsert(url, serviceRoleKey, table, data) {
  const restUrl = `${url}/rest/v1/${table}`;
  const response = await fetch(restUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Insert failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return response.json();
}

// Helper to update record
async function supabaseUpdate(url, serviceRoleKey, table, id, data) {
  const restUrl = `${url}/rest/v1/${table}?id=eq.${id}`;
  const response = await fetch(restUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Update failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return response.json();
}

// Helper to delete record
async function supabaseDelete(url, serviceRoleKey, table, id) {
  const restUrl = `${url}/rest/v1/${table}?id=eq.${id}`;
  const response = await fetch(restUrl, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(
      `Delete failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }
}

async function runVerification() {
  console.log(
    '🧪 Verification Test: teacher_sessions → timesheet_entries Sync\n'
  );

  // Load environment
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  console.log('✓ Environment loaded\n');

  // Generate test IDs (use UUIDs for compatibility)
  const { randomUUID } = require('crypto');
  const testSessionId = randomUUID();
  const testTeacherId = randomUUID();
  const testStudentId = randomUUID();
  const testParentId = randomUUID();

  console.log('📝 Test Data:');
  console.log('   Session ID:', testSessionId);
  console.log('   Teacher ID:', testTeacherId);
  console.log('   Student ID:', testStudentId);
  console.log('   Parent ID:', testParentId, '\n');

  let testPassed = true;

  try {
    // Test 1: Create session in teacher_sessions
    console.log('Test 1: Create teacher_session record...');
    const newSession = {
      id: testSessionId,
      teacher_id: testTeacherId,
      student_id: testStudentId,
      parent_id: testParentId,
      session_type: 'sign_in',
      session_start: new Date().toISOString(),
      session_end: null,
      duration_minutes: null,
      location: { lat: 37.7749, lon: -122.4194 },
      notes: 'Test sync verification session',
      qr_code_used: 'test-qr-code-123',
      verification_status: 'verified',
    };

    await supabaseInsert(
      supabaseUrl,
      serviceRoleKey,
      'teacher_sessions',
      newSession
    );
    console.log('   ✓ Session created in teacher_sessions\n');

    // Wait for trigger to fire (give it 2 seconds)
    console.log('⏳ Waiting 2 seconds for trigger to fire...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Verify it appears in timesheet_entries
    console.log('Test 2: Check if session synced to timesheet_entries...');
    const timesheetUrl = `${supabaseUrl}/rest/v1/timesheet_entries?id=eq.${testSessionId}&select=*`;
    const timesheetResponse = await fetch(timesheetUrl, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    const timesheetEntries = await timesheetResponse.json();

    if (timesheetEntries.length === 0) {
      console.error('   ❌ FAILED: Session not found in timesheet_entries');
      testPassed = false;
    } else {
      const entry = timesheetEntries[0];
      console.log('   ✓ Session found in timesheet_entries');
      console.log('   ✓ Status:', entry.status);
      console.log('   ✓ Check-in time:', entry.check_in_time);
      console.log('   ✓ Check-out time:', entry.check_out_time || '(none)');

      // Verify field mapping
      if (entry.status !== 'checked_in') {
        console.error(
          '   ❌ FAILED: Expected status "checked_in", got:',
          entry.status
        );
        testPassed = false;
      }
      if (!entry.check_in_time) {
        console.error('   ❌ FAILED: check_in_time is null');
        testPassed = false;
      }
    }
    console.log();

    // Test 3: Update session (add check-out time)
    console.log('Test 3: Update session with check-out time...');
    const sessionEnd = new Date();
    const durationMinutes = 45;

    await supabaseUpdate(
      supabaseUrl,
      serviceRoleKey,
      'teacher_sessions',
      testSessionId,
      {
        session_type: 'sign_out',
        session_end: sessionEnd.toISOString(),
        duration_minutes: durationMinutes,
      }
    );
    console.log('   ✓ Session updated in teacher_sessions\n');

    // Wait for trigger
    console.log('⏳ Waiting 2 seconds for trigger to fire...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Verify update synced
    console.log('Test 4: Verify update synced to timesheet_entries...');
    const updatedTimesheetResponse = await fetch(timesheetUrl, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    const updatedTimesheetEntries = await updatedTimesheetResponse.json();

    if (updatedTimesheetEntries.length === 0) {
      console.error('   ❌ FAILED: Session disappeared from timesheet_entries');
      testPassed = false;
    } else {
      const updatedEntry = updatedTimesheetEntries[0];
      console.log('   ✓ Session still in timesheet_entries');
      console.log('   ✓ Status:', updatedEntry.status);
      console.log(
        '   ✓ Check-out time:',
        updatedEntry.check_out_time || '(none)'
      );
      console.log('   ✓ Duration (minutes):', updatedEntry.duration_minutes);

      // Verify update synced
      if (updatedEntry.status !== 'checked_out') {
        console.error(
          '   ❌ FAILED: Expected status "checked_out", got:',
          updatedEntry.status
        );
        testPassed = false;
      }
      if (!updatedEntry.check_out_time) {
        console.error('   ❌ FAILED: check_out_time is null after update');
        testPassed = false;
      }
      if (updatedEntry.duration_minutes !== durationMinutes) {
        console.error(
          '   ❌ FAILED: Expected duration',
          durationMinutes,
          'got:',
          updatedEntry.duration_minutes
        );
        testPassed = false;
      }
    }
    console.log();
  } catch (error) {
    console.error('❌ Test error:', error.message);
    testPassed = false;
  } finally {
    // Cleanup: Delete test data
    console.log('🧹 Cleaning up test data...');
    try {
      await supabaseDelete(
        supabaseUrl,
        serviceRoleKey,
        'teacher_sessions',
        testSessionId
      );
      console.log('   ✓ Deleted from teacher_sessions');
    } catch (e) {
      console.warn('   ⚠️  Could not delete from teacher_sessions:', e.message);
    }

    try {
      await supabaseDelete(
        supabaseUrl,
        serviceRoleKey,
        'timesheet_entries',
        testSessionId
      );
      console.log('   ✓ Deleted from timesheet_entries');
    } catch (e) {
      console.warn(
        '   ⚠️  Could not delete from timesheet_entries:',
        e.message
      );
    }
    console.log();
  }

  // Final result
  if (testPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('   Synchronization mechanism is working correctly.\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED');
    console.error('   Please check Supabase logs and trigger configuration.\n');
    process.exit(1);
  }
}

// Run verification
runVerification().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
