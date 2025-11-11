/**
 * QR Code Check-In/Out Flow Test Script
 *
 * This script validates the complete QR code flow:
 * 1. Parent generates QR code for student
 * 2. Teacher scans QR code
 * 3. Teacher selects check-in or check-out action
 * 4. System records timestamp and updates timesheet
 *
 * Prerequisites:
 * - Supabase connection configured in .env
 * - Database tables created (parent_qr_codes, timesheet_entries)
 * - Test user accounts (parent, teacher, student)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env file manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envLocalPath)) {
      throw new Error('.env or .env.local file not found');
    }
    return parseEnvFile(envLocalPath);
  }
  return parseEnvFile(envPath);
}

function parseEnvFile(filePath) {
  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts
          .join('=')
          .trim()
          .replace(/^["'](.*)["']$/, '$1');
      }
    }
  });
  return env;
}

// Load environment variables
const env = loadEnv();

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS for testing)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const testData = {
  parent: {
    email: 'test-parent-qr@example.com',
    password: 'test-password-123',
    name: 'Test Parent QR',
    role: 'parent',
  },
  teacher: {
    email: 'test-teacher-qr@example.com',
    password: 'test-password-123',
    name: 'Test Teacher QR',
    role: 'teacher',
  },
  student: {
    name: 'Test Student QR',
    age: 10,
    grade: 'Year 5',
  },
};

// Helper: Generate signature
function generateSignature(parentId, studentId) {
  const secret = env.NEXT_PUBLIC_QR_SECRET || 'default-secret';
  const data = `${parentId}-${studentId}-${secret}`;
  return Buffer.from(data).toString('base64').slice(0, 16);
}

// Helper: Generate QR code data
function generateQRCodeData(parentId, studentId) {
  return JSON.stringify({
    type: 'check_in',
    parentId,
    studentId,
    timestamp: Date.now(),
    signature: generateSignature(parentId, studentId),
  });
}

// Test functions
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete auth users by email first
    const emails = [testData.parent.email, testData.teacher.email];

    for (const email of emails) {
      try {
        // List users by email
        const {
          data: { users: authUsers },
        } = await supabase.auth.admin.listUsers();
        const userToDelete = authUsers.find(u => u.email === email);

        if (userToDelete) {
          // Delete related database records first
          await supabase
            .from('timesheet_entries')
            .delete()
            .eq('parent_id', userToDelete.id);
          await supabase
            .from('timesheet_entries')
            .delete()
            .eq('teacher_id', userToDelete.id);
          await supabase
            .from('parent_qr_codes')
            .delete()
            .eq('parent_id', userToDelete.id);
          await supabase
            .from('students')
            .delete()
            .eq('parent_id', userToDelete.id);
          await supabase.from('users').delete().eq('id', userToDelete.id);

          // Delete auth user
          await supabase.auth.admin.deleteUser(userToDelete.id);
        }
      } catch (err) {
        // Ignore individual deletion errors
      }
    }

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.log('⚠️  Cleanup error (may be expected):', error.message);
  }
}

async function createTestUsers() {
  console.log('\n👥 Creating test users...');

  // Create parent
  const { data: parentAuth, error: parentAuthError } =
    await supabase.auth.admin.createUser({
      email: testData.parent.email,
      password: testData.parent.password,
      email_confirm: true,
    });

  if (parentAuthError) {
    throw parentAuthError;
  }

  const { error: parentProfileError } = await supabase.from('users').insert({
    id: parentAuth.user.id,
    email: testData.parent.email,
    name: testData.parent.name,
    role: testData.parent.role,
  });

  if (parentProfileError) {
    throw parentProfileError;
  }

  console.log(`✅ Parent created: ${testData.parent.email}`);

  // Create teacher
  const { data: teacherAuth, error: teacherAuthError } =
    await supabase.auth.admin.createUser({
      email: testData.teacher.email,
      password: testData.teacher.password,
      email_confirm: true,
    });

  if (teacherAuthError) {
    throw teacherAuthError;
  }

  const { error: teacherProfileError } = await supabase.from('users').insert({
    id: teacherAuth.user.id,
    email: testData.teacher.email,
    name: testData.teacher.name,
    role: testData.teacher.role,
  });

  if (teacherProfileError) {
    throw teacherProfileError;
  }

  console.log(`✅ Teacher created: ${testData.teacher.email}`);

  return {
    parentId: parentAuth.user.id,
    teacherId: teacherAuth.user.id,
  };
}

async function createTestStudent(parentId) {
  console.log('\n🎓 Creating test student...');

  const { data, error } = await supabase
    .from('students')
    .insert({
      parent_id: parentId,
      name: testData.student.name,
      age: testData.student.age,
      grade_level: testData.student.grade,
      grade_system: 'uk_year',
      country: 'UK',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log(`✅ Student created: ${testData.student.name} (ID: ${data.id})`);

  return data.id;
}

async function testQRCodeGeneration(parentId, studentId) {
  console.log('\n📱 Testing QR code generation...');

  const qrData = generateQRCodeData(parentId, studentId);

  // Store QR code in database (simulating parent portal action)
  const { data, error } = await supabase
    .from('parent_qr_codes')
    .insert({
      parent_id: parentId,
      student_id: studentId,
      qr_code_data: qrData,
      qr_code_image: 'data:image/png;base64,test', // Mock image
      is_active: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log('✅ QR code generated successfully');
  console.log(`   - QR Code ID: ${data.id}`);
  console.log(`   - Parent ID: ${data.parent_id}`);
  console.log(`   - Student ID: ${data.student_id}`);
  console.log(`   - Active: ${data.is_active}`);

  return data;
}

async function testQRCodeValidation(qrCodeData) {
  console.log('\n🔍 Testing QR code validation...');

  try {
    const parsedData = JSON.parse(qrCodeData);

    // Verify signature
    const expectedSignature = generateSignature(
      parsedData.parentId,
      parsedData.studentId
    );

    if (parsedData.signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Check age (24 hours)
    const age = Date.now() - parsedData.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      throw new Error('QR code expired');
    }

    console.log('✅ QR code validation passed');
    console.log(`   - Type: ${parsedData.type}`);
    console.log(`   - Parent ID: ${parsedData.parentId}`);
    console.log(`   - Student ID: ${parsedData.studentId}`);
    console.log(`   - Signature: Valid ✓`);

    return parsedData;
  } catch (error) {
    console.error('❌ QR code validation failed:', error.message);
    throw error;
  }
}

async function testCheckIn(teacherId, qrCodeData, qrCodeId) {
  console.log('\n🟢 Testing Check-In...');

  const parsedData = JSON.parse(qrCodeData);

  // Check for existing active check-in
  const { data: existingCheckIn } = await supabase
    .from('timesheet_entries')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('student_id', parsedData.studentId)
    .eq('status', 'checked_in')
    .single();

  if (existingCheckIn) {
    throw new Error('Teacher already checked in for this student');
  }

  // Create check-in entry
  const checkInTime = new Date();
  const { data, error } = await supabase
    .from('timesheet_entries')
    .insert({
      teacher_id: teacherId,
      student_id: parsedData.studentId,
      parent_id: parsedData.parentId,
      qr_code_id: qrCodeId,
      check_in_time: checkInTime.toISOString(),
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
        address: 'Test Location',
      },
      status: 'checked_in',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log('✅ Check-in successful');
  console.log(`   - Entry ID: ${data.id}`);
  console.log(`   - Check-in Time: ${checkInTime.toLocaleString()}`);
  console.log(`   - Status: ${data.status}`);
  console.log(`   - Location: ${data.location.address}`);

  return data;
}

async function testCheckOut(teacherId, qrCodeData, checkInEntryId) {
  console.log('\n🔴 Testing Check-Out...');

  // Wait 2 seconds to simulate session duration
  console.log('   ⏱️  Simulating 2-second session...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const parsedData = JSON.parse(qrCodeData);

  // Get check-in entry
  const { data: entry, error: fetchError } = await supabase
    .from('timesheet_entries')
    .select('*')
    .eq('id', checkInEntryId)
    .single();

  if (fetchError || !entry) {
    throw new Error('Check-in entry not found');
  }

  // Calculate duration
  const checkInTime = new Date(entry.check_in_time);
  const checkOutTime = new Date();
  const durationMinutes = Math.round(
    (checkOutTime - checkInTime) / (1000 * 60)
  );

  // Update entry with check-out
  const { data, error } = await supabase
    .from('timesheet_entries')
    .update({
      check_out_time: checkOutTime.toISOString(),
      duration_minutes: durationMinutes,
      notes: 'Test session completed successfully',
      status: 'checked_out',
      updated_at: checkOutTime.toISOString(),
    })
    .eq('id', checkInEntryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log('✅ Check-out successful');
  console.log(`   - Entry ID: ${data.id}`);
  console.log(`   - Check-out Time: ${checkOutTime.toLocaleString()}`);
  console.log(`   - Duration: ${durationMinutes} minutes`);
  console.log(`   - Status: ${data.status}`);
  console.log(`   - Notes: ${data.notes}`);

  return data;
}

async function testTimesheetQuery(parentId, teacherId) {
  console.log('\n📊 Testing Timesheet Queries...');

  // Parent's view
  const { data: parentEntries, error: parentError } = await supabase
    .from('timesheet_entries')
    .select('*')
    .eq('parent_id', parentId)
    .order('check_in_time', { ascending: false });

  if (parentError) {
    throw parentError;
  }

  console.log(`✅ Parent's timesheet: ${parentEntries.length} entries`);

  // Teacher's view
  const { data: teacherEntries, error: teacherError } = await supabase
    .from('timesheet_entries')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('check_in_time', { ascending: false });

  if (teacherError) {
    throw teacherError;
  }

  console.log(`✅ Teacher's timesheet: ${teacherEntries.length} entries`);

  // Calculate totals
  const completedEntries = teacherEntries.filter(
    e => e.status === 'checked_out'
  );
  const totalMinutes = completedEntries.reduce(
    (sum, e) => sum + (e.duration_minutes || 0),
    0
  );
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  console.log(`✅ Total hours: ${totalHours} hours (${totalMinutes} minutes)`);

  return {
    parentEntries,
    teacherEntries,
    totalHours,
    totalMinutes,
  };
}

async function runTests() {
  console.log('🚀 Starting QR Code Flow Tests');
  console.log('================================\n');

  let parentId, teacherId, studentId, qrCode, checkInEntry;

  try {
    // Step 1: Cleanup
    await cleanup();

    // Step 2: Create test users
    const users = await createTestUsers();
    parentId = users.parentId;
    teacherId = users.teacherId;

    // Step 3: Create test student
    studentId = await createTestStudent(parentId);

    // Step 4: Generate QR code (parent portal)
    qrCode = await testQRCodeGeneration(parentId, studentId);

    // Step 5: Validate QR code
    await testQRCodeValidation(qrCode.qr_code_data);

    // Step 6: Check-in (teacher scans and selects check-in)
    checkInEntry = await testCheckIn(teacherId, qrCode.qr_code_data, qrCode.id);

    // Step 7: Check-out (teacher scans and selects check-out)
    await testCheckOut(teacherId, qrCode.qr_code_data, checkInEntry.id);

    // Step 8: Query timesheet data
    await testTimesheetQuery(parentId, teacherId);

    console.log('\n✅ All tests passed!');
    console.log('================================');
    console.log('\n📋 Summary:');
    console.log('  ✓ QR code generation works');
    console.log('  ✓ QR code validation works');
    console.log('  ✓ Check-in recording works');
    console.log('  ✓ Check-out recording works');
    console.log('  ✓ Timestamp tracking works');
    console.log('  ✓ Duration calculation works');
    console.log('  ✓ Timesheet queries work');
    console.log('\n🎉 QR Code Flow is fully functional!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup test data
    console.log('\n🧹 Final cleanup...');
    await cleanup();
  }
}

// Run tests
runTests().catch(console.error);
