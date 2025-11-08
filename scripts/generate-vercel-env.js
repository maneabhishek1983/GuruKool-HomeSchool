/**
 * Generate Vercel Environment Variables Import File
 *
 * Creates a .env.vercel file that can be imported to Vercel Dashboard
 * with proper formatting and categorization.
 *
 * Usage: node scripts/generate-vercel-env.js
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

// Environment variable categories for Vercel
const VERCEL_CONFIG = {
  // Production-only variables (sensitive, server-side only)
  production: {
    variables: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'OPENAI_API_KEY',
      'PINECONE_API_KEY',
      'UPSTASH_REDIS_REST_TOKEN',
      'SENTRY_AUTH_TOKEN',
    ],
    description: 'Production-only (server-side secrets)',
  },
  // All environments (public or less sensitive)
  all: {
    variables: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL',
      'PINECONE_ENVIRONMENT',
      'UPSTASH_REDIS_REST_URL',
      'SENTRY_DSN',
    ],
    description: 'All environments (Production, Preview, Development)',
  },
  // Development/Preview only
  development: {
    variables: [
      'DEMO_PARENT_PASSWORD',
      'DEMO_ADMIN_PASSWORD',
      'DEMO_TEACHER_PASSWORD',
      'ENABLE_DEMO_CREDENTIALS',
      'NEXT_PUBLIC_WS_URL',
      'MCP_EDUCATION_ENDPOINT',
      'MCP_SECURITY_ENDPOINT',
      'MCP_COMMUNICATION_ENDPOINT',
    ],
    description: 'Development & Preview only',
  },
};

// Variable descriptions for documentation
const VAR_DESCRIPTIONS = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key (public, RLS-protected)',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (server-side only)',
  'JWT_SECRET': 'JWT signing secret (min 32 characters)',
  'OPENAI_API_KEY': 'OpenAI API key (local dev only, production uses Chomsky)',
  'PINECONE_API_KEY': 'Pinecone vector database API key',
  'PINECONE_ENVIRONMENT': 'Pinecone environment name',
  'UPSTASH_REDIS_REST_URL': 'Upstash Redis REST URL for rate limiting',
  'UPSTASH_REDIS_REST_TOKEN': 'Upstash Redis authentication token',
  'SENTRY_DSN': 'Sentry error tracking DSN (optional)',
  'SENTRY_AUTH_TOKEN': 'Sentry authentication token (optional)',
  'NEXT_PUBLIC_APP_URL': 'Application URL (your Vercel deployment URL)',
  'NEXT_PUBLIC_WS_URL': 'WebSocket URL for real-time features',
  'DEMO_PARENT_PASSWORD': 'Demo parent account password (dev/preview only)',
  'DEMO_ADMIN_PASSWORD': 'Demo admin account password (dev/preview only)',
  'DEMO_TEACHER_PASSWORD': 'Demo teacher account password (dev/preview only)',
  'ENABLE_DEMO_CREDENTIALS': 'Enable demo credentials (false in production)',
  'MCP_EDUCATION_ENDPOINT': 'MCP education server endpoint',
  'MCP_SECURITY_ENDPOINT': 'MCP security server endpoint',
  'MCP_COMMUNICATION_ENDPOINT': 'MCP communication server endpoint',
};

function generateVercelEnvFile(env) {
  const lines = [];

  lines.push('# GuruKool HomeSchool - Vercel Environment Variables');
  lines.push('# Generated: ' + new Date().toISOString());
  lines.push('#');
  lines.push('# IMPORTANT: Before uploading to Vercel:');
  lines.push('# 1. Replace all placeholder values (your-*, your_*) with actual credentials');
  lines.push('# 2. Select appropriate environment scope for each variable');
  lines.push('# 3. Never commit this file with real credentials to version control');
  lines.push('#');
  lines.push('# Vercel CLI Import: vercel env pull .env.local');
  lines.push('# Dashboard Import: Settings → Environment Variables → Import');
  lines.push('');

  // Fixed Vercel variables
  lines.push('# =================================================================');
  lines.push('# VERCEL SYSTEM VARIABLES (Auto-configured)');
  lines.push('# =================================================================');
  lines.push('');
  lines.push('NODE_ENV=production');
  lines.push('HUSKY=0  # Disable Husky in CI/CD');
  lines.push('');

  // Process each category
  Object.entries(VERCEL_CONFIG).forEach(([scope, config]) => {
    lines.push('# =================================================================');
    lines.push(`# ${config.description.toUpperCase()}`);
    lines.push('# =================================================================');
    lines.push('');

    config.variables.forEach(key => {
      const value = env[key] || '';
      const description = VAR_DESCRIPTIONS[key] || '';

      if (description) {
        lines.push(`# ${description}`);
      }

      if (scope === 'production') {
        lines.push(`# Scope: Production only`);
      } else if (scope === 'development') {
        lines.push(`# Scope: Development, Preview`);
      } else {
        lines.push(`# Scope: Production, Preview, Development`);
      }

      // Check if value is placeholder or missing
      if (!value || value.startsWith('your-') || value.startsWith('your_')) {
        lines.push(`${key}=REPLACE_WITH_YOUR_VALUE`);
      } else {
        lines.push(`${key}=${value}`);
      }

      lines.push('');
    });
  });

  // Instructions section
  lines.push('# =================================================================');
  lines.push('# DEPLOYMENT INSTRUCTIONS');
  lines.push('# =================================================================');
  lines.push('#');
  lines.push('# Option 1: Vercel CLI');
  lines.push('# ----------------------');
  lines.push('# 1. Install Vercel CLI: npm i -g vercel');
  lines.push('# 2. Login: vercel login');
  lines.push('# 3. Link project: vercel link');
  lines.push('# 4. Push env vars: vercel env pull .env.local');
  lines.push('#');
  lines.push('# Option 2: Vercel Dashboard');
  lines.push('# -------------------------');
  lines.push('# 1. Go to: https://vercel.com/dashboard');
  lines.push('# 2. Select your project');
  lines.push('# 3. Go to: Settings → Environment Variables');
  lines.push('# 4. Click "Add New" or "Import .env"');
  lines.push('# 5. Set appropriate scope for each variable:');
  lines.push('#    - Production only: Secrets and service keys');
  lines.push('#    - All environments: Public URLs and feature flags');
  lines.push('#    - Development/Preview: Demo credentials and testing');
  lines.push('# 6. Save and redeploy');
  lines.push('#');
  lines.push('# Environment Variable Scopes:');
  lines.push('# ---------------------------');
  lines.push('# - Production: Live production deployment only');
  lines.push('# - Preview: Branch preview deployments (PR builds)');
  lines.push('# - Development: Local development via "vercel dev"');
  lines.push('#');
  lines.push('# Security Best Practices:');
  lines.push('# ------------------------');
  lines.push('# - Never commit real credentials to Git');
  lines.push('# - Rotate keys regularly');
  lines.push('# - Use different keys for Production vs Preview/Dev');
  lines.push('# - Enable Vercel secret encryption for sensitive values');
  lines.push('# - Use @vercel/kv or @vercel/postgres for database connections');
  lines.push('# - Monitor environment variable access logs');
  lines.push('#');
  lines.push('# Production-specific Requirements:');
  lines.push('# ---------------------------------');
  lines.push('# - ENABLE_DEMO_CREDENTIALS must be "false"');
  lines.push('# - OPENAI_API_KEY should be replaced with Chomsky LLM in production');
  lines.push('# - NEXT_PUBLIC_APP_URL must be your actual Vercel deployment URL');
  lines.push('# - UPSTASH_REDIS_* required for distributed rate limiting');
  lines.push('# - SUPABASE_SERVICE_ROLE_KEY must be kept secret (Production only)');
  lines.push('');

  return lines.join('\n');
}

function generateVercelCLICommands(env) {
  const commands = [];

  commands.push('# Vercel CLI Commands to Set Environment Variables');
  commands.push('# Copy and paste these commands (replace REPLACE_WITH_YOUR_VALUE)');
  commands.push('');

  Object.entries(VERCEL_CONFIG).forEach(([scope, config]) => {
    commands.push(`# ${config.description}`);

    config.variables.forEach(key => {
      const value = env[key] || 'REPLACE_WITH_YOUR_VALUE';
      const scopeFlag = scope === 'production' ? 'production' :
                        scope === 'development' ? 'development preview' :
                        'production preview development';

      commands.push(`vercel env add ${key} ${scopeFlag} <<< "${value}"`);
    });

    commands.push('');
  });

  return commands.join('\n');
}

function main() {
  console.log('🔧 Generating Vercel environment variables import file...\n');

  // Parse .env file
  const envPath = path.join(process.cwd(), '.env');
  const env = parseEnvFile(envPath);

  if (Object.keys(env).length === 0) {
    console.error('❌ Error: No .env file found or file is empty');
    console.error('   Create a .env file based on .env.example\n');
    process.exit(1);
  }

  // Generate .env.vercel file
  const vercelEnvContent = generateVercelEnvFile(env);
  const vercelEnvPath = path.join(process.cwd(), '.env.vercel');
  fs.writeFileSync(vercelEnvPath, vercelEnvContent, 'utf8');

  console.log(`✅ Generated: ${vercelEnvPath}`);

  // Generate CLI commands file
  const cliCommands = generateVercelCLICommands(env);
  const cliCommandsPath = path.join(process.cwd(), 'vercel-env-commands.sh');
  fs.writeFileSync(cliCommandsPath, cliCommands, 'utf8');

  console.log(`✅ Generated: ${cliCommandsPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('📋 NEXT STEPS');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. Review and edit .env.vercel:');
  console.log('   - Replace all REPLACE_WITH_YOUR_VALUE with actual credentials');
  console.log('   - Verify placeholder values are updated');
  console.log('');
  console.log('2. Import to Vercel (choose one method):');
  console.log('');
  console.log('   Method A - Dashboard Import:');
  console.log('   • Go to: https://vercel.com/dashboard');
  console.log('   • Settings → Environment Variables → Import .env');
  console.log('   • Upload .env.vercel file');
  console.log('');
  console.log('   Method B - CLI (recommended):');
  console.log('   • Review vercel-env-commands.sh');
  console.log('   • Run commands or use: source vercel-env-commands.sh');
  console.log('');
  console.log('3. Set environment scopes correctly:');
  console.log('   • Production only: Service keys, JWT secrets');
  console.log('   • All environments: Public URLs, feature flags');
  console.log('   • Dev/Preview: Demo credentials, test endpoints');
  console.log('');
  console.log('4. Validate configuration:');
  console.log('   npm run validate:vercel');
  console.log('');
  console.log('5. Trigger new deployment:');
  console.log('   vercel --prod');
  console.log('');
  console.log('⚠️  SECURITY WARNING:');
  console.log('   • Never commit .env.vercel with real credentials');
  console.log('   • Add .env.vercel to .gitignore');
  console.log('   • Rotate keys if accidentally exposed');
  console.log('');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { generateVercelEnvFile, generateVercelCLICommands };
