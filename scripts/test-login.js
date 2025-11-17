/**
 * Test Supabase Login
 *
 * This script tests if the demo credentials work with Supabase.
 * Run with: node scripts/test-login.js
 */

const https = require('https');
const fs = require('fs');

// Read .env file from Flutter app
function loadEnv() {
  const envPath = 'gurukool_teacher/.env';
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at gurukool_teacher/.env');
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

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Missing required environment variables in gurukool_teacher/.env:'
  );
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_ANON_KEY');
  process.exit(1);
}

/**
 * Make HTTPS request
 */
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

/**
 * Test login
 */
async function testLogin(email, password) {
  console.log(`🔐 Testing login for: ${email}\n`);

  const url = new URL(SUPABASE_URL);
  const options = {
    hostname: url.hostname,
    path: '/auth/v1/token?grant_type=password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
  };

  const loginData = {
    email,
    password,
  };

  try {
    const { status, data } = await makeRequest(options, loginData);

    if (status === 200) {
      console.log('✅ Login successful!\n');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Access Token:', data.access_token?.substring(0, 20) + '...');
      return true;
    } else {
      console.log('❌ Login failed!\n');
      console.log('Status:', status);
      console.log('Error:', JSON.stringify(data, null, 2));

      if (data.error_description) {
        console.log('\n💡 Error Description:', data.error_description);
      }

      if (
        status === 400 &&
        data.error_description?.includes('Invalid login credentials')
      ) {
        console.log('\n📝 Possible reasons:');
        console.log('   1. Password is incorrect');
        console.log("   2. Account doesn't exist");
        console.log('   3. Email is not confirmed');
        console.log('\n💡 Try running: node scripts/create-demo-teacher.js');
      }

      return false;
    }
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
    return false;
  }
}

// Test demo credentials
const credentials = [{ email: 'teacher@example.com', password: 'teacher123' }];

async function runTests() {
  console.log('🚀 Testing Supabase Authentication\n');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');
  console.log('─'.repeat(60) + '\n');

  for (const cred of credentials) {
    const success = await testLogin(cred.email, cred.password);
    console.log('\n' + '─'.repeat(60) + '\n');

    if (!success) {
      process.exit(1);
    }
  }

  console.log('✅ All login tests passed!');
  process.exit(0);
}

runTests();
