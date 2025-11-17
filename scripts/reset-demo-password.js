/**
 * Reset Demo Teacher Password
 *
 * This script resets the password for teacher@example.com to 'teacher123'
 * Run with: node scripts/reset-demo-password.js
 */

const https = require('https');
const fs = require('fs');

// Read .env file
function loadEnv() {
  const envPath = '.env';
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      env[key.trim()] = value;
    }
  });

  return env;
}

const env = loadEnv();

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌ Missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'
  );
  process.exit(1);
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function resetPassword() {
  console.log('🔐 Resetting password for teacher@example.com...\n');

  // First, get the user ID
  const url = new URL(SUPABASE_URL);
  const listOptions = {
    hostname: url.hostname,
    path: '/auth/v1/admin/users',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  const { data: users } = await makeRequest(listOptions);
  const teacher = users.users?.find(u => u.email === 'teacher@example.com');

  if (!teacher) {
    console.log('❌ Teacher account not found. Creating it...\n');

    // Create the account
    const createOptions = {
      hostname: url.hostname,
      path: '/auth/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    };

    const userData = {
      email: 'teacher@example.com',
      password: 'teacher123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Teacher',
        role: 'teacher',
      },
    };

    const { status, data } = await makeRequest(createOptions, userData);
    if (status === 200 || status === 201) {
      console.log('✅ Demo teacher account created!\n');
      console.log('📧 Email: teacher@example.com');
      console.log('🔑 Password: teacher123');
      return true;
    } else {
      console.error('❌ Failed to create account:', data);
      return false;
    }
  }

  // Update the password
  const updateOptions = {
    hostname: url.hostname,
    path: `/auth/v1/admin/users/${teacher.id}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  const updateData = {
    password: 'teacher123',
  };

  const { status, data } = await makeRequest(updateOptions, updateData);

  if (status === 200) {
    console.log('✅ Password reset successfully!\n');
    console.log('📧 Email: teacher@example.com');
    console.log('🔑 Password: teacher123');
    console.log('\n✨ You can now login to the mobile app!');
    return true;
  } else {
    console.error('❌ Failed to reset password');
    console.error('Response:', data);
    return false;
  }
}

resetPassword().then(success => {
  process.exit(success ? 0 : 1);
});
