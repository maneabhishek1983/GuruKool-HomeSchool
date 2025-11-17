/**
 * Teacher Creation Diagnostic Script
 *
 * This script tests teacher profile creation and identifies the root cause of failures.
 *
 * Run: node test-teacher-creation.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    env[key.trim()] = value.trim();
  });

  return env;
}

async function main() {
  console.log('🧪 Teacher Creation Diagnostic Test\n');
  console.log('='.repeat(60));

  // Load environment
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   URL: ${supabaseUrl}`);
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Check teachers table schema
  console.log('📋 Test 1: Checking Teachers Table Schema');
  console.log('-'.repeat(60));

  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Failed to query teachers table:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      console.log('');
      console.log('⚠️  Possible causes:');
      console.log('   1. Teachers table does not exist');
      console.log('   2. RLS policies are too restrictive');
      console.log('   3. Missing required migrations');
      console.log('');
    } else {
      console.log('✅ Teachers table accessible');
      console.log(`   Found ${data.length} teacher(s)`);
      if (data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]).join(', '));
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
  console.log('');

  // Test 2: Check required columns
  console.log('📋 Test 2: Checking Required Columns');
  console.log('-'.repeat(60));

  const requiredColumns = [
    'id',
    'user_id',
    'parent_id',
    'name',
    'email',
    'subjects',
    'experience_years',
    'qualifications',
    'specializations',
    'hourly_rate',
    'availability',
    'location',
    'status',
    'verification_status',
  ];

  try {
    const { data, error } = await supabase
      .from('teachers')
      .select(requiredColumns.join(','))
      .limit(0); // Don't fetch data, just validate columns

    if (error) {
      console.error('❌ Missing or invalid columns:', error.message);
      console.log('');
      console.log('   Expected columns:', requiredColumns.join(', '));
      console.log('');
    } else {
      console.log('✅ All required columns exist');
    }
  } catch (err) {
    console.error('❌ Error checking columns:', err.message);
  }
  console.log('');

  // Test 3: Check user_id nullability (migration 008)
  console.log('📋 Test 3: Checking user_id Nullability');
  console.log('-'.repeat(60));

  try {
    // Try to insert a teacher with user_id = null
    const testTeacher = {
      user_id: null, // Should be nullable after migration 008
      parent_id: '00000000-0000-0000-0000-000000000000', // Fake parent ID
      name: 'Test Teacher',
      email: `test-${Date.now()}@example.com`,
      subjects: ['Math'],
      experience_years: 5,
      qualifications: ['BSc Mathematics'],
      specializations: [],
      hourly_rate: 50,
      availability: { days: [], timeSlots: [] },
      location: { address: '' },
      bio: 'Test teacher',
      status: 'available',
    };

    const { data, error } = await supabase
      .from('teachers')
      .insert(testTeacher)
      .select()
      .single();

    if (error) {
      if (error.code === '23502') {
        console.error('❌ user_id is NOT NULL (migration 008 not applied)');
        console.log('');
        console.log('   Required Action:');
        console.log(
          '   1. Apply migration: supabase/migrations/008_make_teachers_user_id_nullable.sql'
        );
        console.log(
          '   2. This migration changes user_id from NOT NULL to NULL'
        );
        console.log('');
      } else if (error.code === '23503') {
        console.error('❌ Foreign key constraint violation');
        console.log('   Error:', error.message);
        console.log('');
        console.log('   This means parent_id does not exist in users table');
        console.log('   Expected - we used a fake parent_id for testing');
        console.log('');
        console.log('✅ user_id nullability is correct (got FK error instead)');
      } else {
        console.error('❌ Unexpected error:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
      }
    } else {
      console.log('✅ Successfully inserted teacher with null user_id');
      console.log(`   Teacher ID: ${data.id}`);

      // Clean up test data
      await supabase.from('teachers').delete().eq('id', data.id);
      console.log('   (Test data cleaned up)');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
  console.log('');

  // Test 4: Check RLS policies
  console.log('📋 Test 4: Checking RLS Policies');
  console.log('-'.repeat(60));

  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'parent')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('⚠️  No parent users found for RLS testing');
      console.log('   Cannot test RLS policies without a parent user');
      console.log('');
    } else {
      const parentUser = users[0];
      console.log(`✅ Found parent user: ${parentUser.email}`);

      // Try to insert teacher as this parent
      const testTeacher = {
        user_id: null,
        parent_id: parentUser.id,
        name: 'Test Teacher via RLS',
        email: `test-rls-${Date.now()}@example.com`,
        subjects: ['Science'],
        experience_years: 3,
        qualifications: ['MSc Physics'],
        specializations: [],
        hourly_rate: 60,
        availability: { days: [], timeSlots: [] },
        location: { address: '' },
        bio: 'Test teacher for RLS',
        status: 'available',
      };

      const { data, error } = await supabase
        .from('teachers')
        .insert(testTeacher)
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          console.error('❌ RLS policy denies INSERT permission');
          console.log('');
          console.log('   Required Action:');
          console.log('   1. Check RLS policies on teachers table');
          console.log(
            '   2. Ensure parents can insert teachers where parent_id = auth.uid()'
          );
          console.log(
            '   3. Apply migration: supabase/migrations/006_fix_rls_policies.sql'
          );
          console.log('');
        } else {
          console.error('❌ Error:', error.message);
          console.error('   Code:', error.code);
        }
      } else {
        console.log('✅ RLS policies allow teacher creation');
        console.log(`   Created teacher ID: ${data.id}`);

        // Clean up
        await supabase.from('teachers').delete().eq('id', data.id);
        console.log('   (Test data cleaned up)');
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
  console.log('');

  // Test 5: Validate teacher_rates table (migration 009)
  console.log('📋 Test 5: Checking teacher_rates Table');
  console.log('-'.repeat(60));

  try {
    const { data, error } = await supabase
      .from('teacher_rates')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ teacher_rates table error:', error.message);
      console.log('');
      console.log('   Required Action:');
      console.log(
        '   1. Apply migration: supabase/migrations/009_fix_teacher_rates_foreign_key.sql'
      );
      console.log('');
    } else {
      console.log('✅ teacher_rates table accessible');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
  console.log('');

  // Summary
  console.log('📊 Diagnostic Summary');
  console.log('-'.repeat(60));
  console.log('');
  console.log('Common causes of "Failed to create user profile" error:');
  console.log('');
  console.log('1. ❌ Migration 008 NOT applied');
  console.log('   → user_id column is NOT NULL (should be NULL)');
  console.log('   → Fix: Apply 008_make_teachers_user_id_nullable.sql');
  console.log('');
  console.log('2. ❌ RLS policies too restrictive');
  console.log('   → Parents cannot INSERT into teachers table');
  console.log('   → Fix: Apply 006_fix_rls_policies.sql');
  console.log('');
  console.log('3. ❌ Missing required columns');
  console.log('   → Table schema mismatch');
  console.log('   → Fix: Apply all migrations in order');
  console.log('');
  console.log('4. ❌ teacher_rates foreign key constraint');
  console.log('   → References wrong column (user_id instead of teacher id)');
  console.log('   → Fix: Apply 009_fix_teacher_rates_foreign_key.sql');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Check Supabase Dashboard → SQL Editor');
  console.log('2. Apply missing migrations from supabase/migrations/');
  console.log('3. Re-run this test script');
  console.log('4. Try creating teacher again in the app');
  console.log('');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
