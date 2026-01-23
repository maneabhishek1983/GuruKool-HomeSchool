/**
 * Setup Test Users Script
 *
 * Creates admin, teacher, and parent users with known passwords for testing.
 * Run with: node scripts/setup-test-users.js
 *
 * WARNING: This will delete existing test users and create new ones!
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error(
    '- SUPABASE_SERVICE_ROLE_KEY:',
    serviceRoleKey ? 'Set' : 'Missing'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user credentials
const TEST_USERS = [
  {
    email: 'admin@gurukool.test',
    password: 'Admin123!@#',
    name: 'Test Admin',
    role: 'admin',
  },
  {
    email: 'teacher@gurukool.test',
    password: 'Teacher123!@#',
    name: 'Test Teacher',
    role: 'teacher',
  },
  {
    email: 'parent@gurukool.test',
    password: 'Parent123!@#',
    name: 'Test Parent',
    role: 'parent',
  },
];

async function clearExistingUsers() {
  console.log('\n🗑️  Clearing existing test users...\n');

  // Get all users
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error.message);
    return;
  }

  // Find and delete test users
  for (const user of users || []) {
    if (
      user.email?.endsWith('@gurukool.test') ||
      user.email?.endsWith('@example.com')
    ) {
      // Delete from custom users table first
      await supabase.from('users').delete().eq('id', user.id);

      // Delete from auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (deleteError) {
        console.error(
          `  ❌ Failed to delete ${user.email}:`,
          deleteError.message
        );
      } else {
        console.log(`  ✓ Deleted: ${user.email}`);
      }
    }
  }
}

async function createTestUsers() {
  console.log('\n👤 Creating test users...\n');

  const createdUsers = [];

  for (const testUser of TEST_USERS) {
    try {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: testUser.name,
            role: testUser.role,
          },
        });

      if (authError) {
        console.error(
          `  ❌ Failed to create auth user ${testUser.email}:`,
          authError.message
        );
        continue;
      }

      // Create user in custom users table
      const { error: dbError } = await supabase.from('users').upsert({
        id: authData.user.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        preferences: {
          notifications: { email: true, push: true, inApp: true },
          dashboard: { theme: 'light', layout: 'default' },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error(
          `  ⚠️  Auth user created but DB insert failed for ${testUser.email}:`,
          dbError.message
        );
      }

      createdUsers.push({
        ...testUser,
        id: authData.user.id,
      });

      console.log(`  ✓ Created: ${testUser.email} (${testUser.role})`);
    } catch (err) {
      console.error(`  ❌ Error creating ${testUser.email}:`, err.message);
    }
  }

  return createdUsers;
}

async function createTestStudent(parentId) {
  console.log('\n📚 Creating test student...\n');

  const { data: student, error } = await supabase
    .from('students')
    .upsert({
      id: '770e8400-e29b-41d4-a716-446655440001',
      name: 'Test Student',
      parent_id: parentId,
      date_of_birth: '2015-05-15',
      grade_level: 'Grade 5',
      academic_system: 'US',
      subjects: ['Mathematics', 'Science', 'English'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('  ⚠️  Failed to create test student:', error.message);
    return null;
  }

  console.log(`  ✓ Created student: ${student?.name || 'Test Student'}`);
  return student;
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     GuruKool Test Users Setup Script       ║');
  console.log('╚════════════════════════════════════════════╝');

  // Step 1: Clear existing test users
  await clearExistingUsers();

  // Step 2: Create new test users
  const users = await createTestUsers();

  // Step 3: Create test student for parent
  const parent = users.find(u => u.role === 'parent');
  if (parent) {
    await createTestStudent(parent.id);
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           TEST USER CREDENTIALS            ║');
  console.log('╠════════════════════════════════════════════╣');

  for (const user of TEST_USERS) {
    console.log(
      `║ ${user.role.toUpperCase().padEnd(8)} │ ${user.email.padEnd(25)} ║`
    );
    console.log(`║          │ Password: ${user.password.padEnd(15)} ║`);
    console.log('╠────────────────────────────────────────────╣');
  }

  console.log('╚════════════════════════════════════════════╝');

  console.log(
    '\n✅ Setup complete! You can now login with these credentials.\n'
  );
  console.log('📍 Login URL: http://localhost:3000/login');
  console.log('   Or your deployed URL + /login\n');
}

main().catch(console.error);
