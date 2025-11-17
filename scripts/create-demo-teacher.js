/**
 * Create Demo Teacher Account in Supabase
 *
 * This script creates a demo teacher account for testing the mobile app.
 * Run with: node scripts/create-demo-teacher.js
 */

const https = require('https');
const fs = require('fs');

// Read .env file manually (no dotenv dependency)
function loadEnv() {
  const envPath = '.env';
  if (!fs.existsSync(envPath)) {
    console.error(
      '❌ .env file not found. Please create one from .env.example'
    );
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
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Demo teacher credentials
const DEMO_TEACHER = {
  email: 'teacher@example.com',
  password: 'teacher123',
  user_metadata: {
    full_name: 'Demo Teacher',
    role: 'teacher',
  },
};

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
 * Create user via Supabase Admin API
 */
async function createDemoTeacher() {
  console.log('🚀 Creating demo teacher account...\n');

  const url = new URL(SUPABASE_URL);
  const options = {
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
    email: DEMO_TEACHER.email,
    password: DEMO_TEACHER.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: DEMO_TEACHER.user_metadata,
  };

  try {
    const { status, data } = await makeRequest(options, userData);

    if (status === 200 || status === 201) {
      console.log('✅ Demo teacher account created successfully!\n');
      console.log('📧 Email:', DEMO_TEACHER.email);
      console.log('🔑 Password:', DEMO_TEACHER.password);
      console.log('👤 User ID:', data.id);
      console.log(
        '\n✨ You can now login to the mobile app with these credentials!'
      );
      return true;
    } else if (
      status === 422 &&
      data.msg?.includes('already been registered')
    ) {
      console.log('ℹ️  Demo teacher account already exists!\n');
      console.log('📧 Email:', DEMO_TEACHER.email);
      console.log('🔑 Password:', DEMO_TEACHER.password);
      console.log(
        '\n✨ You can login to the mobile app with these credentials!'
      );
      return true;
    } else {
      console.error('❌ Failed to create demo teacher account');
      console.error('Status:', status);
      console.error('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating demo teacher account:', error.message);
    return false;
  }
}

// Run the script
createDemoTeacher().then(success => {
  process.exit(success ? 0 : 1);
});
