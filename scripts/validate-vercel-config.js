/**
 * Vercel Configuration Validator
 *
 * Validates that all required environment variables are properly configured
 * for Vercel deployment. Run this before deploying to catch missing configs.
 *
 * Usage: node scripts/validate-vercel-config.js
 */

const fs = require('fs');
const path = require('path');

// Manual .env file parsing (no dotenv dependency)
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

// Environment variable categories with validation rules
const ENV_CONFIG = {
  required: {
    production: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
    ],
    all: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]
  },
  optional: [
    'OPENAI_API_KEY',
    'PINECONE_API_KEY',
    'PINECONE_ENVIRONMENT',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'SENTRY_DSN',
    'SENTRY_AUTH_TOKEN',
    'NEXT_PUBLIC_WS_URL',
    'MCP_EDUCATION_ENDPOINT',
    'MCP_SECURITY_ENDPOINT',
    'MCP_COMMUNICATION_ENDPOINT',
  ],
  development: [
    'DEMO_PARENT_PASSWORD',
    'DEMO_ADMIN_PASSWORD',
    'DEMO_TEACHER_PASSWORD',
    'ENABLE_DEMO_CREDENTIALS',
  ]
};

// Validation rules
const VALIDATIONS = {
  'NEXT_PUBLIC_SUPABASE_URL': (val) => {
    if (!val.startsWith('https://')) return 'Must start with https://';
    if (!val.includes('.supabase.co')) return 'Must be a valid Supabase URL';
    return null;
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': (val) => {
    if (val.length < 100) return 'Anon key seems too short';
    return null;
  },
  'SUPABASE_SERVICE_ROLE_KEY': (val) => {
    if (val.length < 100) return 'Service role key seems too short';
    return null;
  },
  'JWT_SECRET': (val) => {
    if (val.length < 32) return 'JWT secret should be at least 32 characters';
    return null;
  },
  'OPENAI_API_KEY': (val) => {
    if (!val.startsWith('sk-')) return 'OpenAI API key should start with sk-';
    return null;
  },
  'UPSTASH_REDIS_REST_URL': (val) => {
    if (!val.startsWith('https://')) return 'Must start with https://';
    if (!val.includes('upstash.io')) return 'Must be a valid Upstash URL';
    return null;
  },
};

function validateEnvVars(env, environment = 'production') {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
    present: [],
  };

  // Check required variables
  const requiredVars = environment === 'production'
    ? ENV_CONFIG.required.production
    : ENV_CONFIG.required.all;

  requiredVars.forEach(key => {
    const value = env[key];

    if (!value || value.startsWith('your-') || value.startsWith('your_')) {
      results.valid = false;
      results.missing.push(key);
      results.errors.push(`❌ ${key} is missing or has placeholder value`);
    } else {
      results.present.push(key);

      // Run specific validation if exists
      if (VALIDATIONS[key]) {
        const error = VALIDATIONS[key](value);
        if (error) {
          results.valid = false;
          results.errors.push(`❌ ${key}: ${error}`);
        }
      }
    }
  });

  // Check optional variables (warnings only)
  ENV_CONFIG.optional.forEach(key => {
    const value = env[key];

    if (!value || value.startsWith('your-') || value.startsWith('your_')) {
      results.warnings.push(`⚠️  ${key} is not set (optional)`);
    } else {
      results.present.push(key);

      // Run specific validation if exists
      if (VALIDATIONS[key]) {
        const error = VALIDATIONS[key](value);
        if (error) {
          results.warnings.push(`⚠️  ${key}: ${error}`);
        }
      }
    }
  });

  // Check development variables (should NOT be in production)
  if (environment === 'production') {
    ENV_CONFIG.development.forEach(key => {
      if (env[key] && env['ENABLE_DEMO_CREDENTIALS'] === 'true') {
        results.warnings.push(`⚠️  ${key} is set in production (should be disabled)`);
      }
    });
  }

  return results;
}

function checkVercelJson() {
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');

  if (!fs.existsSync(vercelJsonPath)) {
    return { exists: false, valid: false, errors: ['vercel.json not found'] };
  }

  try {
    const content = fs.readFileSync(vercelJsonPath, 'utf8');
    const config = JSON.parse(content);

    const checks = {
      exists: true,
      valid: true,
      errors: [],
      warnings: [],
    };

    // Check framework
    if (config.framework !== 'nextjs') {
      checks.errors.push('Framework should be "nextjs"');
      checks.valid = false;
    }

    // Check functions timeout
    if (!config.functions || !config.functions['src/app/**/*']) {
      checks.warnings.push('No function timeout configured');
    }

    // Check redirects
    if (!config.redirects || config.redirects.length === 0) {
      checks.warnings.push('No redirects configured');
    }

    // Check headers
    if (!config.headers || config.headers.length === 0) {
      checks.warnings.push('No security headers configured');
    }

    return checks;
  } catch (error) {
    return { exists: true, valid: false, errors: [`Error parsing vercel.json: ${error.message}`] };
  }
}

function generateReport(envResults, vercelJsonResults) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERCEL CONFIGURATION VALIDATION REPORT');
  console.log('='.repeat(60) + '\n');

  // Vercel.json validation
  console.log('📋 vercel.json Configuration:');
  if (vercelJsonResults.exists) {
    if (vercelJsonResults.valid) {
      console.log('   ✅ Valid configuration found\n');
    } else {
      console.log('   ❌ Configuration has errors:\n');
      vercelJsonResults.errors.forEach(err => console.log(`      ${err}`));
      console.log('');
    }

    if (vercelJsonResults.warnings.length > 0) {
      console.log('   Warnings:');
      vercelJsonResults.warnings.forEach(warn => console.log(`      ${warn}`));
      console.log('');
    }
  } else {
    console.log('   ⚠️  vercel.json not found (optional but recommended)\n');
  }

  // Environment variables validation
  console.log('🔐 Environment Variables:');
  console.log(`   Present: ${envResults.present.length}`);
  console.log(`   Missing: ${envResults.missing.length}\n`);

  if (envResults.errors.length > 0) {
    console.log('   Errors:');
    envResults.errors.forEach(err => console.log(`      ${err}`));
    console.log('');
  }

  if (envResults.warnings.length > 0) {
    console.log('   Warnings:');
    envResults.warnings.forEach(warn => console.log(`      ${warn}`));
    console.log('');
  }

  // Overall status
  console.log('='.repeat(60));
  if (envResults.valid && vercelJsonResults.valid) {
    console.log('✅ Configuration is valid for Vercel deployment!');
  } else {
    console.log('❌ Configuration has errors that must be fixed');
  }
  console.log('='.repeat(60) + '\n');

  // Next steps
  if (!envResults.valid || !vercelJsonResults.valid) {
    console.log('📝 Next Steps:');
    console.log('   1. Fix all errors listed above');
    console.log('   2. Update environment variables in Vercel Dashboard:');
    console.log('      https://vercel.com/dashboard → Settings → Environment Variables');
    console.log('   3. Run this script again to verify');
    console.log('   4. Trigger a new deployment\n');
  } else {
    console.log('📝 Next Steps:');
    console.log('   1. Upload environment variables to Vercel Dashboard');
    console.log('   2. Use the generated .env.vercel file for bulk import');
    console.log('   3. Set environment scope (Production/Preview/Development)');
    console.log('   4. Deploy your application\n');
  }
}

// Main execution
function main() {
  console.log('Starting Vercel configuration validation...\n');

  // Parse .env file
  const envPath = path.join(process.cwd(), '.env');
  const env = parseEnvFile(envPath);

  if (Object.keys(env).length === 0) {
    console.error('❌ Error: No .env file found or file is empty');
    console.error('   Create a .env file based on .env.example\n');
    process.exit(1);
  }

  // Validate environment variables
  const environment = env.NODE_ENV || 'production';
  const envResults = validateEnvVars(env, environment);

  // Check vercel.json
  const vercelJsonResults = checkVercelJson();

  // Generate report
  generateReport(envResults, vercelJsonResults);

  // Exit with appropriate code
  process.exit(envResults.valid && vercelJsonResults.valid ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { validateEnvVars, checkVercelJson };
