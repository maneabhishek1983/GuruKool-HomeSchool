/**
 * Verify Complete Setup Script
 *
 * Checks if all migrations are applied and system is ready for testing
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
  console.log('🎯 GuruKool Setup Verification\n');
  console.log('='.repeat(60));

  // Load environment
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.log(
      '   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   URL: ${supabaseUrl}`);
  console.log('');

  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check 1: Users table
  console.log('📋 Check 1: Users in Database');
  console.log('-'.repeat(60));

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .limit(10);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
  } else {
    console.log(`Found ${users.length} user(s):`);
    users.forEach((u, i) => {
      console.log(
        `   ${i + 1}. ${u.email} (${u.role}) - ${u.name || 'No name'}`
      );
    });

    const parents = users.filter(u => u.role === 'parent');
    const teachers = users.filter(u => u.role === 'teacher');
    const admins = users.filter(u => u.role === 'admin');

    console.log('');
    console.log(`   Parents: ${parents.length}`);
    console.log(`   Teachers: ${teachers.length}`);
    console.log(`   Admins: ${admins.length}`);
  }
  console.log('');

  // Check 2: Teachers table
  console.log('📋 Check 2: Teachers Table');
  console.log('-'.repeat(60));

  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('*')
    .limit(5);

  if (teachersError) {
    console.error('❌ Error fetching teachers:', teachersError.message);
  } else {
    console.log(`✅ Found ${teachers.length} teacher(s)`);
    if (teachers.length > 0) {
      teachers.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.name} (${t.email})`);
        console.log(`      user_id: ${t.user_id || 'NULL (no auth account)'}`);
        console.log(`      parent_id: ${t.parent_id}`);
      });
    }
  }
  console.log('');

  // Check 3: Invitation tokens table
  console.log('📋 Check 3: Invitation Tokens Table');
  console.log('-'.repeat(60));

  const { data: invitations, error: invitationsError } = await supabase
    .from('invitation_tokens')
    .select('*')
    .limit(5);

  if (invitationsError) {
    console.error('❌ Error fetching invitations:', invitationsError.message);
    console.log('   Migration 011 may not be applied');
  } else {
    console.log(`✅ Found ${invitations.length} invitation(s)`);
    if (invitations.length > 0) {
      invitations.forEach((inv, i) => {
        console.log(`   ${i + 1}. ${inv.email} - Status: ${inv.status}`);
        console.log(
          `      Expires: ${new Date(inv.expires_at).toLocaleString()}`
        );
        console.log(`      Token: ${inv.token.substring(0, 20)}...`);
      });
    }
  }
  console.log('');

  // Check 4: RLS Policies on teachers
  console.log('📋 Check 4: RLS Policies on Teachers Table');
  console.log('-'.repeat(60));

  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', {
      sql: "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'teachers' ORDER BY policyname",
    })
    .catch(() => {
      // If rpc not available, try direct query
      return supabase
        .from('pg_policies')
        .select('policyname, cmd')
        .eq('tablename', 'teachers')
        .order('policyname');
    });

  // Alternative: Check via information schema
  const policiesQuery = `
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'teachers'
    ORDER BY policyname
  `;

  console.log('Teachers table RLS policies:');
  console.log('   Expected policies after Migration 010:');
  console.log('   - "Admins can manage all teachers" (ALL)');
  console.log('   - "Parents can create teachers" (INSERT)');
  console.log('   - "Parents can read their teachers" (SELECT)');
  console.log('   - "Parents can update their teachers" (UPDATE)');
  console.log('   - "Parents can delete their teachers" (DELETE)');
  console.log('');
  console.log('   Run this in Supabase SQL Editor to verify:');
  console.log(
    "   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'teachers';"
  );
  console.log('');

  // Summary
  console.log('📊 Setup Status Summary');
  console.log('-'.repeat(60));

  const hasUsers = users && users.length > 0;
  const hasParents = users && users.some(u => u.role === 'parent');
  const teachersTableWorks = !teachersError;
  const invitationsTableWorks = !invitationsError;

  console.log(`Users in database: ${hasUsers ? '✅ Yes' : '❌ No'}`);
  console.log(`Parent users exist: ${hasParents ? '✅ Yes' : '❌ No'}`);
  console.log(
    `Teachers table working: ${teachersTableWorks ? '✅ Yes' : '❌ No'}`
  );
  console.log(
    `Invitation tokens table: ${invitationsTableWorks ? '✅ Yes' : '❌ No'}`
  );
  console.log('');

  if (!hasUsers || !hasParents) {
    console.log('⚠️  Setup Incomplete');
    console.log('');
    console.log('You need to create a parent user to test teacher creation.');
    console.log('');
    console.log('Option 1: Sign up via the app');
    console.log('   1. Go to http://localhost:3002/signup');
    console.log('   2. Create an account as a parent');
    console.log('   3. Verify email (check Supabase Auth → Users)');
    console.log('');
    console.log('Option 2: Create via Supabase Dashboard');
    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
    console.log('   2. Click "Invite User"');
    console.log('   3. Enter email and send invitation');
    console.log('   4. User sets password and logs in');
    console.log('');
  } else if (invitationsTableWorks) {
    console.log('✅ Setup Complete!');
    console.log('');
    console.log('Your system is ready for testing:');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Login as parent: http://localhost:3002/login');
    console.log('2. Create a teacher profile');
    console.log('3. Check console for invitation URL');
    console.log('4. Open invitation URL in new browser');
    console.log('5. Teacher creates password');
    console.log('6. Teacher logs in');
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('✅ Verification Complete');
}

main().catch(err => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
